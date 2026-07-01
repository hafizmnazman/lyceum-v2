// Acceptance test (spec Section 4 + Section 7). The staged run is revealed at
// human pace (drawing -> running -> settling -> done), the real spine result
// computed up front. When it settles, the verdict is the focal point: projected
// mastery, the mastery strip, the dual-gap chart and the timeline, with the
// drill-down unlocked. The office comes alive in parallel (Cohort agent working).

import { useEffect, useRef } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, BigStat, Eyebrow, Divider, Stat, mono, display, Provenance } from "../layout.tsx";
import { Button, Tag } from "../primitives.tsx";
import { GapChart } from "../charts/GapChart.tsx";
import { MasteryStrip } from "../charts/MasteryStrip.tsx";
import { Timeline } from "../charts/Timeline.tsx";
import { deriveCloRows } from "../derive.ts";
import { SIM_BINS } from "../../app/sim.ts";
import {
  closeDrill,
  navigate,
  startAcceptanceRun,
  startDrillReveal,
  submitToManagement,
  useStore,
} from "../../app/store.ts";
import { CLO_NAMES } from "../../data/seed.ts";

export function AcceptanceScreen() {
  const s = useStore();
  const proposal =
    s.proposals.find((p) => p.id === s.selectedProposalId) ??
    s.proposals.find((p) => p.status === "management-approval" || p.status === "testing");
  // Only use the live run when it belongs to the proposal on screen, so a stale
  // prior run never shows its verdict under a different subject.
  const sim = s.sim && s.sim.proposalId === proposal?.id ? s.sim : null;
  // The verdict is live only while a tested proposal is awaiting or has been
  // approved; once it is back in drafting (rejected / changes requested) the old
  // figures are not shown as if current.
  const verdictLive = proposal?.status === "management-approval" || proposal?.status === "approved";
  const report = sim?.report ?? (verdictLive ? proposal?.acceptanceResult : undefined);

  // Nothing to show yet.
  if (!report && !sim) {
    const returned = proposal && (proposal.status === "drafting" || proposal.status === "coordinator-review");
    return (
      <Page>
        <PageHead
          eyebrow={`Acceptance test${proposal ? ` · ${proposal.subjectId}` : ""}`}
          title={returned ? "Back with the author" : "No test has run yet"}
          lead={returned
            ? "This change is being revised in Course Studio. Run the acceptance test again once the draft is ready."
            : "Draft a change in Course Studio, then run the acceptance test to stress it against the real cohort."}
        />
        <Button variant="secondary" onClick={() => navigate("studio")}>Go to Course Studio</Button>
      </Page>
    );
  }

  const running = sim && sim.phase !== "done";
  const awaiting = proposal?.status === "management-approval";

  return (
    <Page>
      <PageHead
        eyebrow={`Acceptance test · ${proposal?.subjectId ?? ""}`}
        title={running ? "Testing the cohort" : "The verdict"}
        lead={
          running
            ? "Real computation, revealed at human pace. Each learner is a real survey profile; each item runs through the Rasch link."
            : report?.isProxyCohort
              ? "Measured on a proxy cohort the Analogy agent assembled from similar outcomes, as this subject has no history of its own."
              : "Every figure below traces to a learner and an item. Open the drill-down to walk it."
        }
        right={report?.isProxyCohort ? <Tag>proxy cohort</Tag> : undefined}
      />

      {/* the staged run */}
      {sim && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ ...mono, fontSize: 13, color: t.ink, marginBottom: 14 }}>{sim.caption}</div>
          <div style={{ display: "flex", gap: 40, alignItems: "flex-end", marginBottom: 18 }}>
            <Stat label="Learners drawn" value={sim.learnersDrawn} />
            <Stat label="Learners run" value={sim.learnersRun} />
            <Stat label="Projected mastery" value={sim.displayedMastery.toFixed(2)} accent={running ? false : true} />
          </div>
          <Histogram bins={sim.bins} total={sim.totalLearners} />
          {running && (
            <div style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 10 }}>
              Cohort agent {s.agentStates.cohort === "working" ? "working" : "done"} ·{" "}
              <Provenance onClick={() => navigate("office")}>watch the office</Provenance>
            </div>
          )}
        </div>
      )}

      {/* the verdict, once settled */}
      {report && !running && (
        <>
          <Divider />
          <div data-demo-id="verdict" style={{ display: "flex", gap: 56, alignItems: "flex-start", flexWrap: "wrap" }}>
            <BigStat
              value={report.projectedMastery.toFixed(2)}
              label="Projected mastery"
              accent
              sub={`current ${report.currentMastery.toFixed(2)} · ${(report.projectedMastery - report.currentMastery).toFixed(2)}`}
            />
            <div style={{ flex: 1, minWidth: 300, maxWidth: 360 }}>
              <Eyebrow>Cohort spread</Eyebrow>
              <MasteryStrip
                proposedMean={report.projectedMastery}
                currentMean={report.currentMastery}
                iqrLo={sim?.distribution.iqr[0] ?? report.projectedMastery - 0.1}
                iqrHi={sim?.distribution.iqr[1] ?? report.projectedMastery + 0.1}
              />
              <div style={{ ...mono, fontSize: 10, color: t.muted, marginTop: 4 }}>caret = current · bar = proposed · band = IQR</div>
            </div>
          </div>

          <p style={{ ...display, fontSize: 15, lineHeight: 1.6, color: t.ink, maxWidth: 680, marginTop: 22 }}>{report.summary}</p>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {proposal && awaiting && (
              <Button data-demo-id="submit-management" onClick={() => submitToManagement(proposal.id)}>
                Submit to management
              </Button>
            )}
            {proposal?.status === "approved" && (
              <span style={{ ...mono, fontSize: 12, color: t.petrol, alignSelf: "center" }}>Approved. Prediction recorded for next term.</span>
            )}
            <Button variant="secondary" data-demo-id="open-drill" onClick={() => (s.drillStep >= 0 ? closeDrill() : startDrillReveal())}>
              {s.drillStep >= 0 ? "Hide the drill-down" : "Open the drill-down"}
            </Button>
          </div>

          {/* drill-down: six hops, revealed one at a time (spec 5b) */}
          {s.drillStep >= 0 && <DrillDown report={report} step={s.drillStep} />}

          {/* the dual-gap chart + timeline, behind the headline */}
          <Divider />
          <Eyebrow>Where the change lands</Eyebrow>
          <GapChart rows={deriveCloRows(report)} />
          <div style={{ marginTop: 18 }}>
            <Timeline conflictEdge={report.prerequisiteConflicts[0]?.edge as [string, string] | undefined} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Provenance onClick={() => navigate("dataroom")}>Grounded on {report.groundedOnLearners} real learners · view the data room</Provenance>
          </div>
        </>
      )}

      {/* run button if a proposal is selected but no run yet */}
      {!sim && proposal && proposal.status !== "approved" && (
        <Button data-demo-id="run-test-acc" onClick={() => startAcceptanceRun(proposal.id)} style={{ marginTop: 20 }}>
          Run acceptance test
        </Button>
      )}
    </Page>
  );
}

function Histogram({ bins, total }: { bins: number[]; total: number }) {
  const max = Math.max(1, ...bins);
  const H = 88;
  return (
    <svg viewBox={`0 0 ${SIM_BINS * 26} ${H + 18}`} width="100%" style={{ maxWidth: 420, display: "block" }} preserveAspectRatio="xMidYMid meet">
      {bins.map((b, i) => {
        const h = (b / max) * H;
        const x = i * 26 + 3;
        return <rect key={i} x={x} y={H - h} width={20} height={h} fill={t.petrol} opacity={0.85} />;
      })}
      <line x1={0} x2={SIM_BINS * 26} y1={H} y2={H} stroke={t.line} strokeWidth={1} />
      <text x={2} y={H + 14} fontFamily={t.fontMono} fontSize={9} fill={t.muted}>0.0</text>
      <text x={SIM_BINS * 26 - 20} y={H + 14} fontFamily={t.fontMono} fontSize={9} fill={t.muted}>1.0</text>
      <text x={SIM_BINS * 13 - 30} y={H + 14} fontFamily={t.fontMono} fontSize={9} fill={t.muted}>{bins.reduce((m, b) => m + b, 0)} of {total}</text>
    </svg>
  );
}

function DrillDown({ report, step }: { report: NonNullable<ReturnType<typeof useStore>["sim"]>["report"]; step: number }) {
  const d = report.drillRoot;
  const clo4Mean = report.cloMastery.find((m) => m.cloId === d.cloId)?.meanP.toFixed(2) ?? "";
  // Follow the reveal down the page so each newly revealed hop stays in view.
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);
  const hop = (i: number, n: string, label: string, value: string) =>
    step >= i && (
      <div key={n} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0", borderBottom: `1px solid ${t.line}`, animation: "fadein .3s ease" }}>
        <span style={{ ...mono, fontSize: 11, color: t.muted, width: 22 }}>{n}</span>
        <span style={{ ...display, fontSize: 13, color: t.ink, width: 172 }}>{label}</span>
        <span style={{ ...mono, fontSize: 13, color: t.petrol }}>{value}</span>
      </div>
    );
  return (
    <div style={{ marginTop: 20, maxWidth: 640 }}>
      <Eyebrow accent>Drill-down · every number traces to a learner and an item</Eyebrow>
      {hop(0, "01", "Verdict", `projected ${report.projectedMastery.toFixed(2)}`)}
      {hop(1, "02", "Weakest outcome", `${d.cloId} ${CLO_NAMES[d.cloId] ?? ""} ${clo4Mean}`)}
      {hop(2, "03", "Down to one learner", `${d.studentId}`)}
      {hop(3, "04", "Ability (self-rated)", `theta ${d.theta.toFixed(2)} on ${d.cloId}`)}
      {hop(4, "05", "Facing item", `${d.itemId} · difficulty ${d.b.toFixed(2)}`)}
      {step >= 5 && (
        <div style={{ padding: "14px 0", animation: "fadein .3s ease" }}>
          <span style={{ ...mono, fontSize: 11, color: t.muted, marginRight: 14 }}>06</span>
          <span style={{ ...display, fontSize: 13, color: t.ink, marginRight: 14 }}>Response probability</span>
          <div style={{ ...mono, fontSize: 15, color: t.ochre, marginTop: 8 }}>
            P(correct) = sigma({d.theta.toFixed(2)} - {d.b.toFixed(2)}) = sigma({(d.theta - d.b).toFixed(2)}) = {d.p.toFixed(2)}
          </div>
          <p style={{ ...display, fontSize: 13, color: t.muted, lineHeight: 1.6, margin: "10px 0 0" }}>
            Every number computed, none invented. {d.cause}
          </p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
