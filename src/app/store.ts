// The central store: one in-memory state plus the actions that move it. Built as
// a module-level external store (useSyncExternalStore) so both React screens and
// the self-driving demo runner read the same state and dispatch the same real
// actions. No backend; everything is local, seeded, reproducible.
//
// SCREENS: call `useStore()` for state and import the action functions directly.
// The proposal state machine, notifications, the staged run, and the closed loop
// all live here so screens stay thin and consistent.
//
// State machine (spec Section 5):
//   drafting --(coordinator runs)--> testing
//   drafting --(lecturer submits)--> coordinator-review
//   coordinator-review --(approve)--> testing   --(changes)--> drafting
//   testing --(run done)--> management-approval
//   management-approval --(approve)--> approved (writes a Prediction)
//                       --(reject)--> drafting

import { useSyncExternalStore } from "react";
import type {
  CLO,
  ChangeProposal,
  DataSource,
  Hat,
  Notification,
  NotificationKind,
  Person,
  PersonId,
  Prediction,
  ProposalId,
  ResultUpload,
  RoleAssignment,
  Subject,
  SubjectId,
  SubjectVersion,
  SurveyRecord,
  VerdictReport,
} from "../types.ts";
import type { Screen } from "./roles.ts";
import { can, landingScreen, navAllows, hatsOn } from "./roles.ts";
import type { SimState } from "./sim.ts";
import { initSim, SIM_TICK_MS, stepSim } from "./sim.ts";
import type { SignalSimState } from "./signalSim.ts";
import { initSignalSim, SIGNAL_TICK_MS, stepSignal } from "./signalSim.ts";
import { DRILL_STEP_MS, DRILL_STEPS, scaleMs } from "../demo/timing.ts";
import {
  runAcceptanceWithDistribution,
  type AcceptanceDistribution,
} from "../agents/acceptance.ts";
import { runIntake, type ParsedSheet } from "../agents/intake.ts";
import { runAuthoring } from "../agents/authoring.ts";
import { runAnalogy } from "../agents/analogy.ts";
import { runSignal } from "../agents/signal.ts";
import { ITEMS, itemsForCLOs } from "../data/items.ts";
import {
  CANONICAL_PROPOSAL,
  CLOS,
  DATA_SOURCES,
  PEOPLE,
  PEOPLE_IDS,
  PROGRAMME,
  ROLE_ASSIGNMENTS,
  SEED_PREDICTIONS,
  SEED_RESULT_UPLOADS,
  SEED_SUBJECT_VERSIONS,
  SUBJECTS,
  SURVEY,
  TERM,
} from "../data/seed.ts";

// ---------- the seven agents, for the living office ----------
export type AgentId =
  | "intake"
  | "signal"
  | "curriculum"
  | "authoring"
  | "cohort"
  | "analogy"
  | "evaluator";
export type AgentState = "idle" | "working" | "done" | "needs-input";

export const AGENT_LABELS: Record<AgentId, string> = {
  intake: "Intake",
  signal: "Signal",
  curriculum: "Curriculum",
  authoring: "Authoring",
  cohort: "Cohort",
  analogy: "Analogy",
  evaluator: "Evaluator",
};

// A fixed clock so every generated timestamp is identical across runs.
const NOW = "2026-07-01T10:00:00Z";

export interface AppState {
  // reference data
  people: Person[];
  assignments: RoleAssignment[];
  programme: typeof PROGRAMME;
  subjects: Subject[];
  clos: CLO[];
  survey: SurveyRecord[];

  // session
  currentPersonId: PersonId | null;
  screen: Screen;
  selectedSubjectId: SubjectId | null;
  selectedProposalId: ProposalId | null;

  // mutable world
  proposals: ChangeProposal[];
  notifications: Notification[];
  predictions: Prediction[];
  resultUploads: ResultUpload[];
  dataSources: DataSource[];
  subjectVersions: SubjectVersion[];

  // transient UI
  sim: SimState | null;
  signalSim: SignalSimState | null; // the staged Signal reveal on Trends
  drillOpen: boolean;
  drillStep: number; // -1 closed; 0..5 the six-hop drill-down revealing one by one
  agentStates: Record<AgentId, AgentState>;
  agentBubble: { agent: AgentId; text: string } | null;
  critique: string[] | null; // last Authoring review critique
  flashUpload: ResultUpload | null; // last filed upload, for the Upload confirmation
  toast: string | null;

  idSeq: number;
}

function idleAgents(): Record<AgentId, AgentState> {
  return {
    intake: "idle",
    signal: "idle",
    curriculum: "idle",
    authoring: "idle",
    cohort: "idle",
    analogy: "idle",
    evaluator: "idle",
  };
}

let state: AppState = {
  people: PEOPLE,
  assignments: [...ROLE_ASSIGNMENTS],
  programme: PROGRAMME,
  subjects: [...SUBJECTS],
  clos: [...CLOS],
  survey: SURVEY,

  currentPersonId: null,
  screen: "login",
  selectedSubjectId: null,
  selectedProposalId: CANONICAL_PROPOSAL.id,

  proposals: [structuredClone(CANONICAL_PROPOSAL)],
  notifications: [],
  predictions: [...SEED_PREDICTIONS],
  resultUploads: [...SEED_RESULT_UPLOADS],
  dataSources: [...DATA_SOURCES],
  subjectVersions: [...SEED_SUBJECT_VERSIONS],

  sim: null,
  signalSim: null,
  drillOpen: false,
  drillStep: -1,
  agentStates: idleAgents(),
  agentBubble: null,
  critique: null,
  flashUpload: null,
  toast: null,

  idSeq: 1,
};

// ---------- external-store plumbing ----------
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
function set(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
}
export function getState(): AppState {
  return state;
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
export function useStore(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

function nextId(prefix: string): string {
  const id = `${prefix}-${state.idSeq}`;
  state = { ...state, idSeq: state.idSeq + 1 };
  return id;
}

// ---------- selectors ----------
export function currentPerson(): Person | null {
  return state.people.find((p) => p.id === state.currentPersonId) ?? null;
}
export function personById(id: PersonId): Person | undefined {
  return state.people.find((p) => p.id === id);
}
export function subjectById(id: SubjectId): Subject | undefined {
  return state.subjects.find((s) => s.id === id);
}
export function proposalById(id: ProposalId | null): ChangeProposal | undefined {
  return id ? state.proposals.find((p) => p.id === id) : undefined;
}
export function unreadFor(personId: PersonId): Notification[] {
  return state.notifications.filter((n) => n.toPersonId === personId && !n.read);
}
export function inboxFor(personId: PersonId): Notification[] {
  return [...state.notifications]
    .filter((n) => n.toPersonId === personId)
    .sort((a, b) => (a.createdAt === b.createdAt ? 0 : a.createdAt < b.createdAt ? 1 : -1));
}
/** First person who holds the given hat on a subject. */
export function personWithHat(subjectId: SubjectId, hat: Hat): Person | undefined {
  const a = state.assignments.find((x) => x.subjectId === subjectId && x.hat === hat);
  return a ? personById(a.personId) : undefined;
}

function setAgent(agent: AgentId, st: AgentState) {
  set((s) => ({ agentStates: { ...s.agentStates, [agent]: st } }));
}
function resetAgents() {
  set({ agentStates: idleAgents(), agentBubble: null });
}

// ---------- session actions ----------
export function login(personId: PersonId) {
  const person = personById(personId);
  if (!person) return;
  resetAgents();
  set({ currentPersonId: personId, screen: landingScreen(person, state.assignments) });
}
export function logout() {
  set({ currentPersonId: null, screen: "login" });
}
/** Demo person switch: change who we are, clamp the screen into their nav. */
export function switchUser(personId: PersonId) {
  const person = personById(personId);
  if (!person) return;
  set((s) => ({
    currentPersonId: personId,
    screen: navAllows(person, s.assignments, s.screen) ? s.screen : landingScreen(person, s.assignments),
  }));
}
export function navigate(screen: Screen) {
  set({ screen });
}
export function selectSubject(subjectId: SubjectId | null) {
  set({ selectedSubjectId: subjectId });
}
export function selectProposal(proposalId: ProposalId | null) {
  set({ selectedProposalId: proposalId });
}
export function dismissToast() {
  set({ toast: null });
}

// ---------- notifications ----------
function notify(args: {
  toPersonId: PersonId;
  kind: NotificationKind;
  subjectId?: SubjectId;
  proposalId?: ProposalId;
  agentFindings?: string;
}) {
  const n: Notification = {
    id: nextId("N"),
    toPersonId: args.toPersonId,
    kind: args.kind,
    subjectId: args.subjectId,
    proposalId: args.proposalId,
    agentFindings: args.agentFindings,
    read: false,
    createdAt: NOW,
  };
  set((s) => ({ notifications: [...s.notifications, n] }));
}

export function openNotification(id: string) {
  const n = state.notifications.find((x) => x.id === id);
  if (!n) return;
  set((s) => ({ notifications: s.notifications.map((x) => (x.id === id ? { ...x, read: true } : x)) }));
  if (n.proposalId) selectProposal(n.proposalId);
  if (n.subjectId) selectSubject(n.subjectId);
  // Land the reader in context.
  const person = currentPerson();
  if (!person) return;
  if (n.kind === "review-request") navigate("studio");
  else if (n.kind === "ping-update") navigate("studio");
  else if (n.kind === "ping-new-subject") navigate("new-subject");
  else if (n.kind === "test-done" || n.kind === "approved" || n.kind === "rejected") {
    navigate(person.orgRole === "management" ? "approval" : "studio");
  }
}

// ---------- proposal helpers ----------
function patchProposal(id: ProposalId, fn: (p: ChangeProposal) => ChangeProposal) {
  set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? fn(p) : p)) }));
}
function authorIsCoordinator(p: ChangeProposal): boolean {
  return hatsOn(p.authorId, p.subjectId, state.assignments).includes("coordinator");
}

// ---------- Trends -> routing (spec Section 5) ----------
export function routeDrift(subjectId: SubjectId) {
  const signal = runSignal(state.programme.id);
  setAgent("signal", "done");
  setAgent("curriculum", "done");
  const drift = signal.subjectDrift.find((d) => d.subjectId === subjectId);
  const findings =
    `Demand on this subject's outcomes is outpacing coverage (gap ${(drift?.gap ?? 0).toFixed(2)}). ` +
    `Sampled from the skills signal over the programme.`;
  if (drift?.flag === "new-subject") {
    notify({
      toPersonId: state.programme.departmentOwnerId,
      kind: "ping-new-subject",
      subjectId,
      agentFindings: findings,
    });
    set({ toast: "Routed to the department owner to scope a new subject." });
  } else {
    const coord = personWithHat(subjectId, "coordinator");
    const proposal = state.proposals.find((p) => p.subjectId === subjectId);
    if (coord) {
      notify({
        toPersonId: coord.id,
        kind: "ping-update",
        subjectId,
        proposalId: proposal?.id,
        agentFindings: findings,
      });
      set({ toast: `Routed to ${coord.name}, the subject coordinator.` });
    }
  }
}

// ---------- Trends -> the staged Signal reveal (demo spec Section 5a) ----------
let signalTimer: ReturnType<typeof setInterval> | null = null;

/** Play the Signal agent's staged reveal on the Trends screen: reading ->
 *  extracting -> mapping -> done, landing on CS220 / CLO4 gap 0.62. Deterministic,
 *  fixed ticks (mirrors the acceptance reveal). Idempotent while it is running, so
 *  a re-trigger (React StrictMode double-mount, a revisit) cannot double-play. */
export function runSignalReveal() {
  if (state.signalSim && state.signalSim.phase !== "done") return;
  setAgent("signal", "working");
  set({ signalSim: initSignalSim() });
  if (signalTimer) clearInterval(signalTimer);
  signalTimer = setInterval(tickSignal, scaleMs(SIGNAL_TICK_MS));
}

function tickSignal() {
  const ss = state.signalSim;
  if (!ss) {
    if (signalTimer) clearInterval(signalTimer);
    signalTimer = null;
    return;
  }
  const next = stepSignal(ss);
  set({ signalSim: next });
  if (next.phase === "done") {
    if (signalTimer) clearInterval(signalTimer);
    signalTimer = null;
    setAgent("signal", "done");
    setAgent("curriculum", "done");
  }
}

/** Clear the reveal so a fresh demo run replays it from the top. */
export function resetSignalReveal() {
  if (signalTimer) clearInterval(signalTimer);
  signalTimer = null;
  set({ signalSim: null });
}

// ---------- Upload -> Intake -> filed results + closed loop ----------
const DEMO_SHEET: ParsedSheet = {
  fileName: "CS220-results-2025-S1.xlsx",
  headers: ["student", "CLO4 score"],
  rows: [
    { student: "anon-1", "CLO4 score": 0.55 },
    { student: "anon-2", "CLO4 score": 0.6 },
  ],
};

export function uploadResults(subjectId: SubjectId) {
  const person = currentPerson();
  if (!person) return;
  setAgent("intake", "working");
  const upload = runIntake(DEMO_SHEET, subjectId, {
    uploadedBy: person.id,
    term: TERM,
    filedAt: NOW,
    uploadId: `RU-${subjectId}-${TERM}`,
  });
  set((s) => {
    const others = s.resultUploads.filter((u) => u.id !== upload.id);
    const ds: DataSource = {
      kind: "results",
      subjectId,
      term: TERM,
      recordCount: upload.rows.reduce((m, r) => Math.max(m, r.n), 0),
      ingestedAt: NOW,
    };
    const dataSources = [ds, ...s.dataSources.filter((d) => !(d.kind === "results" && d.subjectId === subjectId && d.term === TERM))];
    return { resultUploads: [...others, upload], dataSources, flashUpload: upload };
  });
  setAgent("intake", "done");
  fillPredictionsForSubject(subjectId);
}

function masteryFromUpload(u: ResultUpload): number {
  if (u.rows.length === 0) return 0;
  return u.rows.reduce((sum, r) => sum + r.meanScore, 0) / u.rows.length;
}

/** The latest results upload for a subject filed AT OR AFTER a moment. A
 *  prediction is a claim about the change taking effect, so it is only scored by
 *  results that arrived after it was made, never by what was already on file. */
function latestUploadSince(subjectId: SubjectId, since: string): ResultUpload | undefined {
  return [...state.resultUploads]
    .filter((u) => u.subjectId === subjectId && u.filedAt >= since)
    .sort((a, b) => (a.filedAt < b.filedAt ? 1 : -1))[0];
}

/** Closed loop: score any open prediction on a subject against results filed
 *  after the prediction was made. Returns how many were scored. */
function fillPredictionsForSubject(subjectId: SubjectId): number {
  let scored = 0;
  set((s) => ({
    predictions: s.predictions.map((p) => {
      if (p.subjectId !== subjectId || p.actualMastery !== undefined) return p;
      const upload = latestUploadSince(subjectId, p.madeAt);
      if (!upload) return p;
      const actual = masteryFromUpload(upload);
      scored += 1;
      return { ...p, actualMastery: actual, residual: Math.abs(p.predictedMastery - actual) };
    }),
  }));
  return scored;
}

/** Score every open prediction against results filed since it was made (the
 *  closed-loop screen's button). Honest toast: only claims what it actually did. */
export function scoreOpenPredictions() {
  let scored = 0;
  for (const subjectId of new Set(state.predictions.filter((p) => p.actualMastery === undefined).map((p) => p.subjectId))) {
    scored += fillPredictionsForSubject(subjectId);
  }
  set({
    toast: scored > 0 ? `Scored ${scored} prediction${scored === 1 ? "" : "s"} against the filed results.` : "No new results have been filed since these predictions were made.",
  });
}

// ---------- Course Studio: authoring ----------
export function draftWithAgent(proposalId: ProposalId, mode: "agent" | "hybrid") {
  const p = proposalById(proposalId);
  const subject = p && subjectById(p.subjectId);
  if (!p || !subject) return;
  setAgent("authoring", "working");
  const clos = state.clos.filter((c) => c.subjectId === subject.id);
  const result = runAuthoring(subject, clos, "Align CS220 with demand", "draft", p.draft, "fixture");
  patchProposal(proposalId, (pp) => ({
    ...pp,
    draft: result.draft,
    history: [...pp.history, { at: NOW, byPersonId: pp.authorId, action: "agent-drafted", note: `Agent drafted (${mode} mode).` }],
  }));
  setAgent("authoring", mode === "hybrid" ? "needs-input" : "done");
  if (mode === "hybrid") {
    set({ agentBubble: { agent: "authoring", text: "Drafted a revision. Your turn to refine a line." } });
  }
}

export function requestAgentReview(proposalId: ProposalId) {
  const p = proposalById(proposalId);
  const subject = p && subjectById(p.subjectId);
  if (!p || !subject) return;
  setAgent("authoring", "working");
  const clos = state.clos.filter((c) => c.subjectId === subject.id);
  const result = runAuthoring(subject, clos, "Review draft", "review", p.draft, "fixture");
  set({ critique: result.critique ?? [] });
  setAgent("authoring", "needs-input");
  set({ agentBubble: { agent: "authoring", text: "I flagged a few things in the draft." } });
}

/** Edit a single CLO-change line (the demo's "edit one line" beat). */
export function editCloChangeText(proposalId: ProposalId, index: number, text: string) {
  patchProposal(proposalId, (p) => {
    const cloChanges = [...(p.draft.cloChanges ?? [])];
    if (cloChanges[index]) cloChanges[index] = { ...cloChanges[index], text };
    return { ...p, draft: { ...p.draft, cloChanges } };
  });
}

/** Start a fresh draft on a subject that has no open proposal. Authored by the
 *  current person, so a lecturer's draft is correctly lecturer-authored (and so
 *  must pass coordinator review before testing). Selects it and opens the studio. */
export function startDraft(subjectId: SubjectId): ProposalId | null {
  const person = currentPerson();
  if (!person) return null;
  const existing = state.proposals.find((p) => p.subjectId === subjectId && p.status !== "approved" && p.status !== "rejected");
  if (existing) {
    selectSubject(subjectId);
    selectProposal(existing.id);
    return existing.id;
  }
  const clo = state.clos.find((c) => c.subjectId === subjectId);
  const id = `CP-${subjectId}-${state.idSeq}`;
  const proposal: ChangeProposal = {
    id,
    subjectId,
    kind: "update",
    authorId: person.id,
    draft: {
      topics: [],
      cloChanges: clo ? [{ cloId: clo.id, op: "edit", text: clo.text, bloomLevel: clo.bloomLevel }] : [],
    },
    status: "drafting",
    history: [{ at: NOW, byPersonId: person.id, action: "drafted", note: "Draft started." }],
  };
  set((s) => ({ proposals: [...s.proposals, proposal], idSeq: s.idSeq + 1, selectedSubjectId: subjectId, selectedProposalId: id }));
  return id;
}

// ---------- proposal state machine ----------
/** Lecturer-only author submits to the coordinator for review. */
export function submitForReview(proposalId: ProposalId) {
  const p = proposalById(proposalId);
  if (!p) return;
  const coord = personWithHat(p.subjectId, "coordinator");
  patchProposal(proposalId, (pp) => ({
    ...pp,
    status: "coordinator-review",
    history: [...pp.history, { at: NOW, byPersonId: pp.authorId, action: "submitted-for-review" }],
  }));
  if (coord) {
    notify({
      toPersonId: coord.id,
      kind: "review-request",
      subjectId: p.subjectId,
      proposalId,
      agentFindings: "A lecturer has drafted a change and is asking for your review before testing.",
    });
  }
  set({ toast: "Submitted to the coordinator for review." });
}

export function reviewApprove(proposalId: ProposalId) {
  patchProposal(proposalId, (p) => ({
    ...p,
    status: "testing",
    history: [...p.history, { at: NOW, byPersonId: state.currentPersonId ?? p.authorId, action: "review-approved" }],
  }));
  set({ toast: "Review approved. Ready to run the acceptance test." });
}

export function reviewRequestChanges(proposalId: ProposalId, note: string) {
  const p = proposalById(proposalId);
  if (!p) return;
  patchProposal(proposalId, (pp) => ({
    ...pp,
    status: "drafting",
    history: [...pp.history, { at: NOW, byPersonId: state.currentPersonId ?? pp.authorId, action: "review-changes-requested", note }],
  }));
  notify({
    toPersonId: p.authorId,
    kind: "review-request",
    subjectId: p.subjectId,
    proposalId,
    agentFindings: note || "The coordinator asked for changes before this can be tested.",
  });
  set({ toast: "Changes requested; sent back to the author." });
}

/** Whether the test may run now. Two gates, both required:
 *  1. The ACTOR must have run-test capability on the subject (Section 2): an
 *     academic with a hat there. This blocks management and the department from
 *     triggering a run (e.g. via the New subject screen).
 *  2. The PROPOSAL must be ready: already review-approved (status testing), or a
 *     coordinator's own draft (status drafting + author is the coordinator). This
 *     is the gate that stops a lecturer's draft reaching a test without review. */
export function canRunTest(proposalId: ProposalId): boolean {
  const p = proposalById(proposalId);
  if (!p) return false;
  const person = currentPerson();
  if (!person || !can(person, "run-test", { subjectId: p.subjectId, assignments: state.assignments })) return false;
  if (p.status === "testing") return true;
  if (p.status === "drafting") return authorIsCoordinator(p);
  return false;
}

// ---------- the staged acceptance run ----------
let simTimer: ReturnType<typeof setInterval> | null = null;

/** Shared by the staged and immediate runs: enforce the gate, set testing, build
 *  the proxy cohort for a new subject, and compute the real spine result. */
function prepareRun(proposalId: ProposalId): { report: VerdictReport; distribution: AcceptanceDistribution } | null {
  const p = proposalById(proposalId);
  const subject = p && subjectById(p.subjectId);
  if (!p || !subject) return null;
  if (!canRunTest(proposalId)) {
    set({ toast: "This draft must pass coordinator review before it can be tested." });
    return null;
  }
  // drafting/testing -> testing
  patchProposal(proposalId, (pp) => ({
    ...pp,
    status: "testing",
    history: pp.status === "testing" ? pp.history : [...pp.history, { at: NOW, byPersonId: state.currentPersonId ?? pp.authorId, action: "review-approved" }],
  }));

  // New-subject proposals are tested on an Analogy proxy cohort.
  const isNew = p.kind === "new-subject";
  let survey = state.survey;
  let items = ITEMS;
  let isProxyCohort = false;
  if (isNew) {
    const newCLOs = state.clos.filter((c) => c.subjectId === subject.id);
    const analogy = runAnalogy(newCLOs, state.subjects, state.survey);
    setAgent("analogy", "done");
    survey = analogy.proxySurvey;
    items = itemsForCLOs(newCLOs);
    isProxyCohort = true;
  }

  setAgent("cohort", "working");
  return runAcceptanceWithDistribution(p, subject, survey, items, { subjects: state.subjects, isProxyCohort });
}

export function startAcceptanceRun(proposalId: ProposalId) {
  const prepared = prepareRun(proposalId);
  if (!prepared) return;
  const { report, distribution } = prepared;
  set({ sim: initSim(proposalId, report, distribution), drillOpen: false, drillStep: -1, screen: "acceptance" });
  selectProposal(proposalId);

  if (simTimer) clearInterval(simTimer);
  simTimer = setInterval(() => tickRun(report, distribution), scaleMs(SIM_TICK_MS));
}

/** Run without the staged reveal (a "skip animation" path; also used by proofs). */
export function runAcceptanceImmediate(proposalId: ProposalId) {
  const prepared = prepareRun(proposalId);
  if (!prepared) return;
  set({ sim: { ...initSim(proposalId, prepared.report, prepared.distribution), phase: "done", learnersRun: prepared.report.groundedOnLearners, bins: initSim(proposalId, prepared.report, prepared.distribution).finalBins, displayedMastery: prepared.report.projectedMastery } });
  finishRun(proposalId, prepared.report);
}

function tickRun(report: VerdictReport, _distribution: AcceptanceDistribution) {
  const sim = state.sim;
  if (!sim) {
    if (simTimer) clearInterval(simTimer);
    simTimer = null;
    return;
  }
  const next = stepSim(sim);
  set({ sim: next });
  if (next.phase === "done") {
    if (simTimer) clearInterval(simTimer);
    simTimer = null;
    finishRun(next.proposalId, report);
  }
}

function finishRun(proposalId: ProposalId, report: VerdictReport) {
  patchProposal(proposalId, (p) => ({
    ...p,
    status: "management-approval",
    acceptanceResult: report,
    history: [...p.history, { at: NOW, byPersonId: state.currentPersonId ?? p.authorId, action: "tested", note: `Projected mastery ${report.projectedMastery.toFixed(2)}.` }],
  }));
  setAgent("cohort", "done");
  setAgent("evaluator", "needs-input");
  // Drop any earlier test-done ping for this proposal so a re-run (reject then
  // test again) does not pile up duplicate pings in management's inbox.
  set((s) => ({
    drillOpen: true,
    agentBubble: { agent: "evaluator", text: `Verdict ready: ${report.projectedMastery.toFixed(2)} projected.` },
    notifications: s.notifications.filter((n) => !(n.kind === "test-done" && n.proposalId === proposalId)),
  }));
  // Notify management (the approval gate) that the test is done.
  for (const m of state.people.filter((pp) => pp.orgRole === "management")) {
    notify({
      toPersonId: m.id,
      kind: "test-done",
      subjectId: proposalById(proposalId)?.subjectId,
      proposalId,
      agentFindings: report.summary,
    });
  }
}

/** The coordinator's explicit "send this to management" affordance after a test.
 *  The run already set management-approval and pinged management; this confirms
 *  it and reads as the hand-off in the demo. */
export function submitToManagement(proposalId: ProposalId) {
  const p = proposalById(proposalId);
  if (!p) return;
  closeDrill(); // collapse the drill as we hand off to the approval gate
  set({ toast: "Verdict sent to management for approval." });
}

// ---------- the six-hop drill-down reveal (demo spec 5b) ----------
let drillTimer: ReturnType<typeof setInterval> | null = null;

/** Reveal the drill-down one hop at a time (verdict -> CLO4 -> learner -> theta ->
 *  item -> P), each held long enough to read. Deterministic; the interval scales
 *  under turbo for the smoke. Works for a human too (a calm progressive reveal). */
export function startDrillReveal() {
  const report = proposalById(state.selectedProposalId)?.acceptanceResult;
  if (!report) return;
  set({ drillOpen: true, drillStep: 0 });
  if (drillTimer) clearInterval(drillTimer);
  drillTimer = setInterval(() => {
    const cur = state.drillStep;
    if (cur >= DRILL_STEPS - 1) {
      if (drillTimer) clearInterval(drillTimer);
      drillTimer = null;
      return;
    }
    set({ drillStep: cur + 1 });
  }, scaleMs(DRILL_STEP_MS));
}

export function closeDrill() {
  if (drillTimer) clearInterval(drillTimer);
  drillTimer = null;
  set({ drillStep: -1 });
}

// ---------- management approval gate ----------
export function approveProposal(proposalId: ProposalId) {
  const p = proposalById(proposalId);
  // Only a tested proposal awaiting approval can be approved; the status guard
  // also makes this idempotent against a double-click (the first call flips the
  // status, so a second is a no-op rather than a duplicate Prediction/version).
  if (!p || !p.acceptanceResult || p.status !== "management-approval") return;
  const report = p.acceptanceResult;
  patchProposal(proposalId, (pp) => ({
    ...pp,
    status: "approved",
    history: [...pp.history, { at: NOW, byPersonId: state.currentPersonId ?? PEOPLE_IDS.lim, action: "approved" }],
  }));
  // Closed loop: record a prediction.
  const prediction: Prediction = {
    proposalId,
    subjectId: p.subjectId,
    predictedMastery: report.projectedMastery,
    madeAt: NOW,
  };
  // Bump a subject version (the change is now live).
  const version: SubjectVersion = {
    id: nextId(`${p.subjectId}-v`),
    subjectId: p.subjectId,
    snapshot: {
      title: subjectById(p.subjectId)?.title ?? p.subjectId,
      cloIds: subjectById(p.subjectId)?.cloIds ?? [],
      prerequisiteSubjectIds: subjectById(p.subjectId)?.prerequisiteSubjectIds ?? [],
    },
    cloSnapshot: state.clos.filter((c) => c.subjectId === p.subjectId),
    changedBy: state.currentPersonId ?? PEOPLE_IDS.lim,
    changedAt: NOW,
    reason: "Approved curriculum change.",
  };
  set((s) => ({
    predictions: [...s.predictions, prediction],
    subjectVersions: [...s.subjectVersions, version],
    subjects: s.subjects.map((su) => (su.id === p.subjectId ? { ...su, status: "active" } : su)),
    toast: "Approved. Prediction recorded for next term.",
  }));
  setAgent("evaluator", "done");
  notify({ toPersonId: p.authorId, kind: "approved", subjectId: p.subjectId, proposalId, agentFindings: "Management approved the tested change." });
  // The prediction stays OPEN: it is a claim about the change taking effect, to be
  // scored by NEXT term's results, not by what is already on file. A later upload
  // (or the closed-loop screen's "Score against filed results") fills it.
}

export function rejectProposal(proposalId: ProposalId, note = "Not approved.") {
  const p = proposalById(proposalId);
  if (!p || p.status !== "management-approval") return;
  patchProposal(proposalId, (pp) => ({
    ...pp,
    status: "drafting",
    history: [...pp.history, { at: NOW, byPersonId: state.currentPersonId ?? PEOPLE_IDS.lim, action: "rejected", note }],
  }));
  notify({ toPersonId: p.authorId, kind: "rejected", subjectId: p.subjectId, proposalId, agentFindings: note });
  set({ toast: "Rejected and returned to the author." });
  setAgent("evaluator", "done");
}

// ---------- department: create subject + assign hats ----------
export function createSubject(args: {
  id: SubjectId;
  title: string;
  year: number;
  semester: number;
  coordinatorId: PersonId;
  cloText: string;
}): SubjectId {
  const cloId = `${args.id}-CLO1`;
  const subject: Subject = {
    id: args.id,
    title: args.title,
    programmeId: state.programme.id,
    year: args.year,
    semester: args.semester,
    cloIds: [cloId],
    prerequisiteSubjectIds: [],
    sharedWithProgrammeIds: [],
    status: "proposed",
    currentVersionId: `${args.id}-v1`,
  };
  const clo: CLO = { id: cloId, subjectId: args.id, text: args.cloText, bloomLevel: "Apply" };
  const proposal: ChangeProposal = {
    id: `CP-${args.id}-001`,
    subjectId: args.id,
    kind: "new-subject",
    authorId: args.coordinatorId,
    draft: { topics: [args.cloText], cloChanges: [{ cloId, op: "add", text: args.cloText, bloomLevel: "Apply" }] },
    status: "drafting",
    history: [{ at: NOW, byPersonId: state.programme.departmentOwnerId, action: "drafted", note: "New subject scoped." }],
  };
  set((s) => ({
    subjects: [...s.subjects, subject],
    clos: [...s.clos, clo],
    assignments: [...s.assignments, { personId: args.coordinatorId, subjectId: args.id, hat: "coordinator" }],
    proposals: [...s.proposals, proposal],
    toast: `Created ${args.id} and assigned a coordinator.`,
  }));
  return args.id;
}

export function assignHat(personId: PersonId, subjectId: SubjectId, hat: Hat) {
  if (state.assignments.some((a) => a.personId === personId && a.subjectId === subjectId && a.hat === hat)) return;
  set((s) => ({ assignments: [...s.assignments, { personId, subjectId, hat }], toast: "Hat assigned." }));
}

// ---------- office helpers ----------
export function setAgentState(agent: AgentId, st: AgentState) {
  setAgent(agent, st);
}

// ---------- demo reset ----------
/** Reset the mutable world to seed and stop every timer, so the self-driving demo
 *  replays cleanly from a fresh state (back to the login screen) on each Play. */
export function resetDemoState() {
  if (simTimer) clearInterval(simTimer);
  simTimer = null;
  if (signalTimer) clearInterval(signalTimer);
  signalTimer = null;
  if (drillTimer) clearInterval(drillTimer);
  drillTimer = null;
  set({
    assignments: [...ROLE_ASSIGNMENTS],
    subjects: [...SUBJECTS],
    clos: [...CLOS],
    currentPersonId: null,
    screen: "login",
    selectedSubjectId: null,
    selectedProposalId: CANONICAL_PROPOSAL.id,
    proposals: [structuredClone(CANONICAL_PROPOSAL)],
    notifications: [],
    predictions: [...SEED_PREDICTIONS],
    resultUploads: [...SEED_RESULT_UPLOADS],
    dataSources: [...DATA_SOURCES],
    subjectVersions: [...SEED_SUBJECT_VERSIONS],
    sim: null,
    signalSim: null,
    drillOpen: false,
    drillStep: -1,
    agentStates: idleAgents(),
    agentBubble: null,
    critique: null,
    flashUpload: null,
    toast: null,
    idSeq: 1,
  });
}
