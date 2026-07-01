// Lyceum v2, Layer 0 data model (implementation spec Section 1).
//
// This is the contract. Every page and every agent reads and writes only these
// shapes. Written to the spec exactly. Even fields not used yet are defined now
// (Prediction, SubjectVersion, Notification) so later features are additive, not
// a refactor.
//
// The audited v1 spine (src/lib/spine/*) is reused unchanged. It computes over a
// small set of computation types (Student, Cohort, ItemResult, CLOMastery,
// CohortResult) that are NOT part of the Layer 0 contract; they live in a marked
// appendix at the bottom of this file so the spine imports resolve against one
// place and the maths stays byte-identical. See DECISIONS.md.

// ---------- ids ----------
export type PersonId = string;
export type ProgrammeId = string;
export type SubjectId = string;
export type CLOId = string;
export type ProposalId = string;

export type BloomLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyse"
  | "Evaluate"
  | "Create";

// ---------- people, hats, scope ----------
// Org tier is fixed to the person. Subject-level hats are per (person x subject).
export type OrgRole = "management" | "department" | "academic";
export type Hat = "coordinator" | "lecturer";

export interface Person {
  id: PersonId;
  name: string; // e.g. "Dr Sobri"
  orgRole: OrgRole; // management, department owner, or an academic who holds hats
  departmentOf?: ProgrammeId; // set when orgRole === "department": the programme they own
}

export interface RoleAssignment {
  // the model that resolves the lecturer/coordinator overlap
  personId: PersonId;
  subjectId: SubjectId;
  hat: Hat; // a person can appear here twice for one subject (both hats)
}

// ---------- curriculum ----------
export interface Programme {
  id: ProgrammeId;
  title: string; // "Bachelor of Computer Science"
  departmentOwnerId: PersonId;
  subjectIds: SubjectId[];
}

export interface Subject {
  id: SubjectId; // "CS220"
  title: string; // "Applied Machine Learning"
  programmeId: ProgrammeId;
  year: number; // 1..4
  semester: number;
  cloIds: CLOId[];
  prerequisiteSubjectIds: SubjectId[];
  sharedWithProgrammeIds: ProgrammeId[]; // cross-programme ripple
  status: "active" | "proposed"; // proposed = a new subject not yet approved
  currentVersionId: string;
}

export interface CLO {
  id: CLOId;
  subjectId: SubjectId;
  text: string;
  bloomLevel: BloomLevel;
  demandSignal?: number; // 0..1, written by the Signal agent
}

export interface Item {
  // same shape as v1
  id: string;
  text: string;
  targetCLO: CLOId;
  bloomLevel: BloomLevel;
  difficulty: number; // b, from the Bloom ladder
}

// ---------- the data spine (real ground) ----------
export interface SurveyRecord {
  // CLO mastery survey + SSRT, per student per subject per term
  studentId: string;
  subjectId: SubjectId;
  term: string; // "2025-S1"
  cloRatings: Record<CLOId, number>; // 1..10 self-rating
}

export interface ResultUpload {
  // what a lecturer drops in
  id: string;
  subjectId: SubjectId;
  uploadedBy: PersonId;
  term: string;
  rows: Array<{ cloId: CLOId; meanScore: number; sd: number; n: number }>;
  filedAt: string; // ISO
}

export interface DataSource {
  // for the data room freshness view
  kind: "clo-survey" | "ssrt" | "results";
  subjectId: SubjectId;
  term: string;
  recordCount: number;
  ingestedAt: string;
}

// ---------- change proposals (the flow) ----------
export type ProposalStatus =
  | "drafting" // author working in Course Studio
  | "coordinator-review" // lecturer-drafted, awaiting coordinator
  | "testing" // acceptance test running
  | "management-approval" // tested, awaiting management
  | "approved"
  | "rejected";

export interface ProposalEvent {
  at: string;
  byPersonId: PersonId;
  action:
    | "drafted"
    | "agent-drafted"
    | "agent-reviewed"
    | "submitted-for-review"
    | "review-approved"
    | "review-changes-requested"
    | "tested"
    | "approved"
    | "rejected";
  note?: string;
}

export interface ChangeProposal {
  id: ProposalId;
  subjectId: SubjectId;
  kind: "update" | "new-subject";
  authorId: PersonId;
  draft: {
    topics?: string[];
    cloChanges?: Array<{
      cloId?: CLOId;
      text: string;
      bloomLevel: BloomLevel;
      op: "add" | "edit" | "remove";
    }>;
    testDraft?: string;
    labDraft?: string;
  };
  status: ProposalStatus;
  acceptanceResult?: VerdictReport; // filled by the Cohort agent
  history: ProposalEvent[];
}

// ---------- verdict (reuse v1 shape, named here for clarity) ----------
export interface VerdictReport {
  summary: string;
  projectedMastery: number; // e.g. 0.58
  currentMastery: number; // e.g. 0.60
  cloMastery: Array<{
    cloId: CLOId;
    meanP: number;
    spread: number;
    confidence: number;
  }>;
  failedItems: Array<{ studentId: string; itemId: string; p: number }>;
  drillRoot: {
    studentId: string;
    cloId: CLOId;
    theta: number;
    itemId: string;
    b: number;
    p: number;
    cause: string;
  };
  prerequisiteConflicts: Array<{
    subjectId: SubjectId;
    missingPrereqId: SubjectId;
    edge: [SubjectId, SubjectId];
  }>;
  groundedOnLearners: number; // for the provenance line
  isProxyCohort: boolean; // true when the Analogy agent stood in
}

// ---------- closed loop ----------
export interface Prediction {
  proposalId: ProposalId;
  subjectId: SubjectId;
  predictedMastery: number;
  madeAt: string;
  actualMastery?: number; // filled when the next term's results arrive
  residual?: number; // |predicted - actual|
}

// ---------- connective tissue ----------
export type NotificationKind =
  | "ping-update"
  | "ping-new-subject"
  | "review-request"
  | "test-done"
  | "approved"
  | "rejected";

export interface Notification {
  id: string;
  toPersonId: PersonId;
  kind: NotificationKind;
  subjectId?: SubjectId;
  proposalId?: ProposalId;
  agentFindings?: string; // the context that prompted the ping
  read: boolean;
  createdAt: string;
}

export interface SubjectVersion {
  id: string;
  subjectId: SubjectId;
  snapshot: Pick<Subject, "title" | "cloIds" | "prerequisiteSubjectIds">;
  cloSnapshot: CLO[];
  changedBy: PersonId;
  changedAt: string;
  reason: string;
}

// ============================================================================
// Layer 1, spine computation types (NOT part of the Layer 0 contract).
//
// These are the shapes the audited v1 spine (src/lib/spine/*) computes over. The
// spine files import them from here so the maths copies across byte-identical.
// They are intentionally separate from the contract above: pages and agents work
// in Layer 0 shapes; the spine works in these, and runAcceptanceTest bridges the
// two. (See DECISIONS.md "Spine support types".)
// ============================================================================

export interface Student {
  id: string;
  cohortId: string;
  ratings: Record<CLOId, number>; // raw 1..10 self-rating, kept for provenance
  ability: Record<CLOId, number>; // theta per CLO, on the logistic scale
}

export interface Cohort {
  id: string;
  intake: string; // e.g. "2023-S1". Labels the batch. Never blend batches.
  programmeId: string;
  students: Student[];
}

export interface ItemResult {
  studentId: string;
  itemId: string;
  p: number; // P(correct) from the link
  outcome: 0 | 1; // seeded Bernoulli draw, gives concrete pass/fail
}

export interface CLOMastery {
  cloId: CLOId;
  meanP: number; // cohort mean P on this CLO
  spread: number; // SD across the cohort
  confidence: number; // 0..1, from how much grounding data backs this CLO
}

export interface CohortResult {
  cohortId: string;
  itemResults: ItemResult[]; // full provenance: every student x every item
  cloMastery: CLOMastery[];
}
