// Course Studio (spec Section 4, Coordinator/Lecturer). Edit topics, the CLO, the
// test and lab drafts, in one of three modes (self / agent / hybrid). The draft
// is the focal point. The primary action depends on the hat: a coordinator runs
// the acceptance test directly; a lecturer submits to the coordinator for review.
// When a draft is in review and you are the coordinator, a Review panel appears.

import { useState } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, Eyebrow, Divider, mono, display } from "../layout.tsx";
import { Button, Tag } from "../primitives.tsx";
import {
  canRunTest,
  draftWithAgent,
  editCloChangeText,
  navigate,
  requestAgentReview,
  reviewApprove,
  reviewRequestChanges,
  startAcceptanceRun,
  startDraft,
  submitForReview,
  useStore,
} from "../../app/store.ts";
import { hatsOn } from "../../app/roles.ts";

type Mode = "self" | "agent" | "hybrid";

const STATUS_LABEL: Record<string, string> = {
  drafting: "Drafting",
  "coordinator-review": "In coordinator review",
  testing: "Ready to test",
  "management-approval": "With management",
  approved: "Approved",
  rejected: "Returned",
};

export function StudioScreen() {
  const s = useStore();
  const person = s.people.find((p) => p.id === s.currentPersonId)!;
  const [mode, setMode] = useState<Mode>("self");

  // Resolve the subject + proposal in context.
  const myHatsSubject = s.assignments.find((a) => a.personId === person.id)?.subjectId ?? "CS220";
  const subjectId = s.selectedSubjectId ?? myHatsSubject;
  const subject = s.subjects.find((x) => x.id === subjectId);
  const proposal =
    s.proposals.find((p) => p.id === s.selectedProposalId && p.subjectId === subjectId) ??
    s.proposals.find((p) => p.subjectId === subjectId);

  if (!subject || !proposal) {
    const canDraftHere = subject && hatsOn(person.id, subject.id, s.assignments).length > 0;
    return (
      <Page>
        <PageHead eyebrow="Course Studio" title="Nothing to edit yet" lead={subject ? `No open change on ${subject.id}. Start one, or pick another subject.` : "Open a subject from Courses to draft a change."} />
        <div style={{ display: "flex", gap: 10 }}>
          {subject && canDraftHere && (
            <Button data-demo-id="start-draft" onClick={() => startDraft(subject.id)}>Start a draft on {subject.id}</Button>
          )}
          <Button variant="secondary" onClick={() => navigate("courses")}>Go to Courses</Button>
        </div>
      </Page>
    );
  }

  const hats = hatsOn(person.id, subjectId, s.assignments);
  const isCoordinator = hats.includes("coordinator");
  const inReview = proposal.status === "coordinator-review";
  const draft = proposal.draft;

  function pickMode(next: Mode) {
    setMode(next);
    if (next === "agent" || next === "hybrid") draftWithAgent(proposal!.id, next);
  }

  return (
    <Page>
      <PageHead
        eyebrow={`Course Studio · ${subject.id} ${subject.title}`}
        title="Revise the subject"
        lead="Draft the change, then test it against the real cohort before it goes anywhere. The agent can draft for you, or assist while you write."
        right={<Tag tone={proposal.status === "drafting" ? "petrol" : "ochre"}>{STATUS_LABEL[proposal.status] ?? proposal.status}</Tag>}
      />

      {/* mode selector, quiet */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <span style={{ ...mono, fontSize: 10, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 6 }}>Mode</span>
        {(["self", "agent", "hybrid"] as Mode[]).map((m) => (
          <button
            key={m}
            data-demo-id={`mode-${m}`}
            onClick={() => pickMode(m)}
            style={{
              ...mono,
              fontSize: 11,
              padding: "6px 12px",
              borderRadius: t.radius,
              cursor: "pointer",
              border: `1px solid ${mode === m ? t.petrol : t.line}`,
              background: mode === m ? t.petrol : "transparent",
              color: mode === m ? t.cream : t.muted,
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
        {mode === "hybrid" && s.agentBubble?.agent === "authoring" && (
          <span style={{ ...display, fontSize: 12, color: t.ochre, marginLeft: 8 }}>{s.agentBubble.text}</span>
        )}
      </div>

      {/* the draft: the focal point */}
      <div style={{ maxWidth: 720 }}>
        <Eyebrow>Outcome</Eyebrow>
        {(draft.cloChanges ?? []).map((c, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ ...mono, fontSize: 11, color: t.petrol, fontWeight: 700, marginBottom: 6 }}>
              {c.cloId ?? "new CLO"} · {c.bloomLevel} · {c.op}
            </div>
            <textarea
              data-demo-id={`clo-edit-${i}`}
              value={c.text}
              onChange={(e) => editCloChangeText(proposal.id, i, e.target.value)}
              rows={2}
              style={{
                ...display,
                fontSize: 15,
                lineHeight: 1.5,
                width: "100%",
                color: t.ink,
                background: t.paper,
                border: `1px solid ${t.line}`,
                borderRadius: t.radius,
                padding: "10px 12px",
                resize: "vertical",
              }}
            />
          </div>
        ))}

        <Eyebrow>Topics</Eyebrow>
        <ul style={{ ...display, fontSize: 14, color: t.ink, lineHeight: 1.7, margin: "0 0 18px", paddingLeft: 18 }}>
          {(draft.topics ?? []).map((topic, i) => (
            <li key={i}>{topic}</li>
          ))}
        </ul>

        <Eyebrow>Assessment draft</Eyebrow>
        <p style={{ ...display, fontSize: 14, color: t.ink, lineHeight: 1.6, margin: "0 0 14px" }}>{draft.testDraft}</p>
        <p style={{ ...display, fontSize: 13, color: t.muted, lineHeight: 1.6, margin: 0 }}>{draft.labDraft}</p>

        {/* agent critique, if requested */}
        {s.critique && s.critique.length > 0 && (
          <>
            <Divider />
            <Eyebrow accent>Agent review</Eyebrow>
            <ul style={{ ...display, fontSize: 13, color: t.ink, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
              {s.critique.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Divider style={{ maxWidth: 720 }} />

      {/* actions */}
      {inReview && isCoordinator ? (
        <div>
          <Eyebrow accent>This draft is awaiting your review</Eyebrow>
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              data-demo-id="review-approve"
              onClick={() => {
                reviewApprove(proposal.id);
                startAcceptanceRun(proposal.id);
              }}
            >
              Approve and test
            </Button>
            <Button variant="secondary" onClick={() => reviewRequestChanges(proposal.id, "Please address the flagged items before testing.")}>
              Request changes
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button variant="secondary" onClick={() => requestAgentReview(proposal.id)}>
            Ask the agent to review
          </Button>
          {isCoordinator || canRunTest(proposal.id) ? (
            <Button data-demo-id="run-test" onClick={() => startAcceptanceRun(proposal.id)}>
              Run acceptance test
            </Button>
          ) : (
            <Button data-demo-id="submit-review" onClick={() => submitForReview(proposal.id)}>
              Submit to coordinator
            </Button>
          )}
        </div>
      )}
    </Page>
  );
}
