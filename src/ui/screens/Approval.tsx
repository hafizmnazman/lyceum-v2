// Approval (spec Section 4, Management). The focal point is the one tested change
// waiting on a decision: its projected mastery, the Evaluator's plain-language
// verdict, and Approve / Reject. Calm at rest: the verdict and the two buttons
// are all that show; the evidence (drill-down chain, dual-gap chart) is one
// toggle away. Every figure traces to a learner and an item.

import { useState } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, BigStat, Divider, Eyebrow, Provenance, mono, display } from "../layout.tsx";
import { Button } from "../primitives.tsx";
import { approveProposal, rejectProposal, navigate, useStore } from "../../app/store.ts";
import { runEvaluator } from "../../agents/evaluator.ts";
import { deriveCloRows } from "../derive.ts";
import { GapChart } from "../charts/GapChart.tsx";
import { CLO_NAMES } from "../../data/seed.ts";

export function ApprovalScreen() {
  const s = useStore();
  const [showEvidence, setShowEvidence] = useState(false);

  const proposal = s.proposals.find((p) => p.status === "management-approval");

  // Already decided this session: the closed-loop note, nothing to approve.
  const approved = s.proposals.find((p) => p.status === "approved");
  if (!proposal && approved) {
    return (
      <Page>
        <PageHead
          eyebrow="Management · Approval"
          title="The change is live"
          lead="The tested change has been approved and a prediction recorded. Nothing else is waiting on you."
        />
        <div style={{ ...display, fontSize: 16, color: t.ink, maxWidth: 560 }}>
          Prediction recorded. Next term's results will score it.
        </div>
        <div style={{ marginTop: 16 }}>
          <Provenance onClick={() => navigate("backtest")}>See how past predictions scored · backtest</Provenance>
        </div>
      </Page>
    );
  }

  if (!proposal) {
    return (
      <Page>
        <PageHead
          eyebrow="Management · Approval"
          title="Nothing waiting on you"
          lead="When a coordinator runs an acceptance test, the tested change lands here with a verdict to read and a decision to make."
        />
        <div style={{ ...display, fontSize: 16, color: t.muted, maxWidth: 560 }}>
          No change is waiting on your approval right now.
        </div>
      </Page>
    );
  }

  const report = proposal.acceptanceResult;
  if (!report) {
    return (
      <Page>
        <PageHead
          eyebrow="Management · Approval"
          title="Verdict not ready"
          lead="This change is between you and a result. The acceptance test has not produced a verdict yet."
        />
        <div style={{ ...display, fontSize: 16, color: t.muted, maxWidth: 560 }}>
          No verdict to read on this change yet.
        </div>
      </Page>
    );
  }

  const summary = runEvaluator(proposal).summary;
  const subject = s.subjects.find((x) => x.id === proposal.subjectId);
  const root = report.drillRoot;

  return (
    <Page>
      <PageHead
        eyebrow={`Management · ${proposal.subjectId} ${subject?.title ?? ""}`}
        title="One change is waiting on your approval"
        lead="The acceptance test ran on real learners. Read the verdict, then approve or send it back. Every figure below traces to a learner and an item, one toggle away."
      />

      {/* the focal block: the headline figure, the verdict, and the decision */}
      <div style={{ maxWidth: 640 }}>
        <BigStat
          value={report.projectedMastery.toFixed(2)}
          label="Projected mastery"
          sub={`current ${report.currentMastery.toFixed(2)}`}
        />

        <p style={{ ...display, fontSize: 15, lineHeight: 1.6, color: t.muted, margin: "22px 0 0" }}>
          {summary}
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
          <span data-demo-id="approve" style={{ display: "inline-flex" }}>
            <Button variant="primary" onClick={() => approveProposal(proposal.id)}>
              Approve the change
            </Button>
          </span>
          <span data-demo-id="reject" style={{ display: "inline-flex" }}>
            <Button variant="secondary" onClick={() => rejectProposal(proposal.id)}>
              Reject
            </Button>
          </span>
        </div>

        <div style={{ marginTop: 18 }}>
          <Provenance onClick={() => navigate("dataroom")}>
            Grounded on {report.groundedOnLearners} real learners
          </Provenance>
        </div>
      </div>

      <Divider style={{ maxWidth: 640 }} />

      {/* calm-first disclosure: the evidence is here when you ask for it */}
      <Provenance onClick={() => setShowEvidence((v) => !v)}>
        {showEvidence ? "Hide the evidence" : "Show the evidence"}
      </Provenance>

      {showEvidence && (
        <div style={{ marginTop: 24 }}>
          <Eyebrow>How the figure was reached</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 720 }}>
            <DrillStep label="verdict" value={report.projectedMastery.toFixed(2)} note="projected cohort mastery" />
            <DrillStep label="weakest outcome" value={root.cloId} note={CLO_NAMES[root.cloId] ?? root.cloId} />
            <DrillStep label="learner" value={root.studentId} note={`theta ${root.theta.toFixed(2)}`} />
            <DrillStep label="item" value={root.itemId} note={`b ${root.b.toFixed(2)}`} />
            <DrillStep label="P(correct)" value={root.p.toFixed(2)} note="P = sigma(0.40 - 0.70) = 0.43" />
            <DrillStep label="root cause" value={root.cause} />
          </div>

          <Eyebrow>Market gap and readiness gap, per outcome</Eyebrow>
          <div style={{ maxWidth: 980 }}>
            <GapChart rows={deriveCloRows(report)} />
          </div>
          <div style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 10 }}>
            Petrol bars: what demand outpaces coverage. Lighter bars: how far each outcome sits from full mastery. Taller band, thinner data.
          </div>
        </div>
      )}
    </Page>
  );
}

/** One link in the drill-down chain: a quiet label, a mono readout, an aside. */
function DrillStep({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
      <span style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: t.muted, width: 130 }}>
        {label}
      </span>
      <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: t.petrol }}>{value}</span>
      {note && <span style={{ ...display, fontSize: 13, color: t.muted }}>{note}</span>}
    </div>
  );
}
