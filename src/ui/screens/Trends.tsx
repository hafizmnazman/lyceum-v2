// Trends (spec Section 4, Management). The focal point is the single biggest
// demand drift on the programme, stated in one confident line with a Route this
// button. Before it settles there, the Signal agent plays its staged reveal
// (demo spec Section 5a): reading employer demand, extracting the rising skills,
// then mapping them onto the outcomes until CS220 / CLO4 resolves to the widest
// gap, 0.62. Calm at rest once done; the per-outcome breakdown is a quiet toggle.

import { useEffect, useState } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, BigStat, mono, display, Divider, Provenance } from "../layout.tsx";
import { Button } from "../primitives.tsx";
import { routeDrift, runSignalReveal, useStore } from "../../app/store.ts";
import { marketGapByCLO } from "../../agents/signal.ts";
import { CLO_NAMES, SUBJECTS_BY_ID, CLOS } from "../../data/seed.ts";
import type { SignalSimState } from "../../app/signalSim.ts";

interface GapRow {
  cloId: string;
  subjectId: string;
  subjectTitle: string;
  name: string;
  demand: number;
  coverage: number;
  gap: number;
}

export function TrendsScreen() {
  const s = useStore();
  const person = s.people.find((p) => p.id === s.currentPersonId);
  const [showAll, setShowAll] = useState(false);

  // The Signal agent plays its staged reveal the first time this screen opens.
  // Runs once (guarded in the store); a later visit shows the settled result.
  useEffect(() => {
    if (s.signalSim === null) runSignalReveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gaps = marketGapByCLO();
  // The seven outcomes, sorted widest demand-vs-coverage gap first.
  const rows: GapRow[] = (Object.keys(gaps) as Array<keyof typeof gaps>)
    .map((cloId) => {
      const clo = CLOS.find((c) => c.id === cloId);
      const subject = clo ? SUBJECTS_BY_ID[clo.subjectId] : undefined;
      return {
        cloId: cloId as string,
        subjectId: clo?.subjectId ?? "",
        subjectTitle: subject?.title ?? "",
        name: CLO_NAMES[cloId as string] ?? (cloId as string),
        ...gaps[cloId],
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const top = rows[0];
  const maxDemand = Math.max(...rows.map((r) => r.demand));

  const ss = s.signalSim;
  const revealing = ss !== null && ss.phase !== "done";

  return (
    <Page>
      <PageHead
        eyebrow="Management · Bachelor of Computer Science"
        title={revealing ? "Reading the market" : "Where the programme is drifting from demand"}
        lead={
          revealing
            ? "The signal agent samples employer and skills demand, extracts the rising skills, and maps them onto the programme's outcomes."
            : "The signal agent samples employer and skills demand across every outcome, then sets it against what the curriculum actually covers. One subject is pulling away faster than the rest."
        }
      />

      {revealing ? (
        <SignalReveal ss={ss} rows={rows} maxDemand={maxDemand} />
      ) : (
        <>
          {/* the one focal point: the widest drift, stated in a single line, with
              the gap as the dominant figure and the only action on the screen */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 40, maxWidth: 760 }}>
            <div style={{ flexShrink: 0 }}>
              <BigStat value={top.gap.toFixed(2)} label="Demand gap" accent />
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{ ...display, fontSize: 19, lineHeight: 1.4, color: t.ink, fontWeight: 600 }}>
                {top.subjectId} {top.subjectTitle} is drifting from demand.
              </div>
              <div style={{ ...display, fontSize: 15, lineHeight: 1.55, color: t.muted, marginTop: 10 }}>
                Employer demand for {top.name.toLowerCase()} sits at{" "}
                <span style={{ ...mono, color: t.ink }}>{top.demand.toFixed(2)}</span>, but coverage is only{" "}
                <span style={{ ...mono, color: t.ink }}>{top.coverage.toFixed(2)}</span>, a gap of{" "}
                <span style={{ ...mono, color: t.ochre, fontWeight: 700 }}>{top.gap.toFixed(2)}</span>.
              </div>
              {person?.orgRole === "management" ? (
                <div data-demo-id={`route-${top.subjectId}`} style={{ marginTop: 20, display: "inline-block" }}>
                  <Button variant="primary" onClick={() => routeDrift(top.subjectId)}>
                    Route this to the coordinator
                  </Button>
                </div>
              ) : (
                <div style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 20 }}>
                  Read-only view. Routing a drift is a management action.
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <Provenance onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Hide per-outcome demand" : "Show per-outcome demand"}
            </Provenance>
          </div>

          {showAll && (
            <>
              <Divider style={{ maxWidth: 760 }} />
              <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
                {rows.map((r) => {
                  const isTop = r.cloId === top.cloId;
                  return (
                    <div key={r.cloId} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: isTop ? t.ochre : t.petrol, width: 48, flexShrink: 0 }}>
                        {r.cloId}
                      </span>
                      <span style={{ ...display, fontSize: 13, color: t.ink, width: 168, flexShrink: 0 }}>
                        {r.name}
                      </span>
                      {/* a thin petrol bar sized to demand, with a quieter coverage tick */}
                      <div style={{ position: "relative", flex: 1, height: 10 }}>
                        <div
                          style={{
                            position: "absolute",
                            top: 3,
                            left: 0,
                            height: 4,
                            width: `${(r.demand / maxDemand) * 100}%`,
                            background: isTop ? t.ochre : t.petrol,
                            borderRadius: 2,
                          }}
                        />
                        <div
                          title={`coverage ${r.coverage.toFixed(2)}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: `${(r.coverage / maxDemand) * 100}%`,
                            height: 10,
                            width: 2,
                            background: t.muted,
                          }}
                        />
                      </div>
                      <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: isTop ? t.ochre : t.ink, width: 44, textAlign: "right", flexShrink: 0 }}>
                        {r.gap.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <div style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 2 }}>
                  Bar = employer demand · tick = current coverage · figure = the gap.
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Page>
  );
}

/** The staged reveal: a three-step rail, then the phase's content. reading shows
 *  the source-types populating; extracting shows the ranked skills; mapping shows
 *  the demand bars filling and the top gap counting up to 0.62. It animates into
 *  the focal state, so the transition to "done" is seamless. */
function SignalReveal({ ss, rows, maxDemand }: { ss: SignalSimState; rows: GapRow[]; maxDemand: number }) {
  return (
    <div style={{ maxWidth: 760 }}>
      <PhaseRail phase={ss.phase} />
      <div style={{ ...mono, fontSize: 13, color: t.ink, margin: "20px 0 22px" }}>{ss.caption}</div>

      {ss.phase === "reading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ss.sources.map((src) => (
            <div key={src} style={{ display: "flex", alignItems: "center", gap: 12, animation: "fadein .25s ease" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.petrol, flexShrink: 0 }} />
              <span style={{ ...display, fontSize: 15, color: t.ink }}>{src}</span>
            </div>
          ))}
        </div>
      )}

      {ss.phase === "extracting" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {ss.skills.map((skill, i) => (
            <div key={skill} style={{ display: "flex", alignItems: "baseline", gap: 14, animation: "fadein .25s ease" }}>
              <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: i === 0 ? t.ochre : t.petrol, width: 26, flexShrink: 0 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ ...display, fontSize: 16, color: t.ink, fontWeight: i === 0 ? 600 : 400 }}>{skill}</span>
            </div>
          ))}
        </div>
      )}

      {ss.phase === "mapping" && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
          <div style={{ flexShrink: 0 }}>
            <BigStat value={ss.gapDisplayed.toFixed(2)} label="Widest demand gap" accent />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 13, paddingTop: 4 }}>
            {rows.map((r) => {
              const isTop = r.cloId === rows[0].cloId;
              return (
                <div key={r.cloId} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: isTop ? t.ochre : t.petrol, width: 48, flexShrink: 0 }}>
                    {r.cloId}
                  </span>
                  <span style={{ ...display, fontSize: 13, color: t.ink, width: 150, flexShrink: 0 }}>{r.name}</span>
                  <div style={{ position: "relative", flex: 1, height: 6 }}>
                    <div
                      style={{
                        position: "absolute",
                        top: 1,
                        left: 0,
                        height: 4,
                        width: `${(r.demand / maxDemand) * 100 * ss.mapProgress}%`,
                        background: isTop ? t.ochre : t.petrol,
                        borderRadius: 2,
                        transition: "width .15s linear",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** The three reveal steps as a quiet rail (no connector arrows, house style):
 *  the active step accented, completed steps in petrol, upcoming ones muted. */
function PhaseRail({ phase }: { phase: SignalSimState["phase"] }) {
  const steps: Array<{ key: SignalSimState["phase"]; label: string }> = [
    { key: "reading", label: "Reading demand" },
    { key: "extracting", label: "Extracting skills" },
    { key: "mapping", label: "Mapping to outcomes" },
  ];
  const order: SignalSimState["phase"][] = ["reading", "extracting", "mapping", "done"];
  const cur = order.indexOf(phase);
  return (
    <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
      {steps.map((st, i) => {
        const active = st.key === phase;
        const done = order.indexOf(st.key) < cur;
        return (
          <div
            key={st.key}
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: active ? t.ochre : done ? t.petrol : t.muted,
              fontWeight: active ? 700 : 400,
            }}
          >
            {String(i + 1).padStart(2, "0")} {st.label}
          </div>
        );
      })}
    </div>
  );
}
