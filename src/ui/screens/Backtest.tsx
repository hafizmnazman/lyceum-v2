// Closed loop (spec Section 5 closed loop, Section 11 step 8). Two beats, calm
// first: PART A is the loop on THIS run's predictions (what we promised, scored
// against what came back); PART B is the historical proof, hidden until asked
// for, that the same predictor called a past cohort from its before-ratings
// alone. The v1 backtest engine is reused unchanged. One focal point: the open
// loop on this run, or, when there is nothing yet, a single quiet line.

import { useMemo, useState } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Eyebrow, BigStat } from "../layout.tsx";
import { Button, Tag } from "../primitives.tsx";
import { scoreOpenPredictions, useStore } from "../../app/store.ts";
import { runBacktest } from "../../lib/backtest.ts";
import { HISTORICAL_BACKTEST } from "../../data/historical-backtest.ts";
import { ITEMS } from "../../data/items.ts";
import { CLO_NAMES } from "../../data/seed.ts";

export function BacktestScreen() {
  const s = useStore();
  const r = useMemo(() => runBacktest(HISTORICAL_BACKTEST, ITEMS), []);
  const [revealed, setRevealed] = useState(false);

  const predictions = s.predictions;
  const open = predictions.filter((p) => p.actualMastery === undefined);

  return (
    <Page>
      <PageHead
        eyebrow="Closed loop"
        title="Every prediction is filed and scored"
        lead="When a tested change is approved, we record what we projected. Next term's results score it against what actually happened. The same predictor is checked here against a past cohort it never saw."
      />

      {/* PART A, the focal point: the loop on this run's predictions */}
      {predictions.length === 0 ? (
        <p style={{ ...display, fontSize: 16, lineHeight: 1.55, color: t.ink, margin: 0, maxWidth: 600 }}>
          No predictions yet. Approve a tested change and it is recorded here; next term's results score it.
        </p>
      ) : (
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {predictions.map((p, i) => {
              const scored = p.actualMastery !== undefined && p.residual !== undefined;
              const held = scored && p.residual! <= 0.05;
              return (
                <div key={`${p.proposalId}-${i}`} style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                  <span style={{ ...mono, fontSize: 15, fontWeight: 700, color: t.petrol, width: 64 }}>{p.subjectId}</span>
                  <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
                    <span style={{ ...mono, fontSize: 14, color: t.ink }}>predicted {p.predictedMastery.toFixed(2)}</span>
                    {scored ? (
                      <>
                        <span style={{ ...mono, fontSize: 14, color: t.ochre }}>actual {p.actualMastery!.toFixed(2)}</span>
                        <span style={{ ...mono, fontSize: 13, color: t.muted }}>residual {p.residual!.toFixed(2)}</span>
                        <Tag tone={held ? "petrol" : "ochre"}>{held ? "prediction held" : "missed"}</Tag>
                      </>
                    ) : (
                      <span style={{ ...display, fontSize: 13, color: t.muted }}>awaiting next term's results</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {open.length > 0 && (
            <div data-demo-id="score-predictions" style={{ marginTop: 22 }}>
              <Button onClick={() => scoreOpenPredictions()}>Score against filed results</Button>
            </div>
          )}
        </div>
      )}

      <Divider style={{ maxWidth: 640, margin: "40px 0" }} />

      {/* PART B, the historical proof, calm first */}
      <Eyebrow>The backtest</Eyebrow>
      {!revealed ? (
        <div style={{ maxWidth: 640 }}>
          <BigStat value={r.overallPredicted.toFixed(2)} label="Overall predicted, past cohort" />
          <p style={{ ...display, fontSize: 15, lineHeight: 1.55, color: t.muted, margin: "18px 0 0", maxWidth: 560 }}>
            We predicted this past cohort from its before-ratings alone. The recorded outcome is held out.
          </p>
          <div style={{ marginTop: 20 }}>
            <Button variant="secondary" data-demo-id="reveal-backtest" onClick={() => setRevealed(true)}>
              Reveal recorded outcome
            </Button>
          </div>
        </div>
      ) : (
        <div data-demo-id="backtest-result" style={{ maxWidth: 640 }}>
          <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
            <BigStat value={r.overallPredicted.toFixed(2)} label="Overall predicted" />
            <BigStat value={r.overallActual.toFixed(2)} label="Recorded outcome" accent />
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 22 }}>
            <div style={{ ...mono, fontSize: 13, color: t.muted }}>
              MAE {r.mae.toFixed(3)} across {r.points.length} outcomes
            </div>
            <Tag tone="petrol">{r.withinTolerance} of {r.points.length} within {r.tolerance.toFixed(2)}</Tag>
          </div>

          <Divider style={{ margin: "28px 0 22px" }} />

          {/* per-CLO list: predicted (petrol) vs recorded (ochre), residual in mono */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {r.points.map((pt) => (
              <div key={pt.cloId} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: t.petrol, width: 52 }}>{pt.cloId}</span>
                <span
                  style={{
                    ...display,
                    fontSize: 13,
                    color: t.ink,
                    width: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {CLO_NAMES[pt.cloId] ?? pt.cloId}
                </span>
                <Marker predicted={pt.predicted} actual={pt.actual} />
                <span style={{ ...mono, fontSize: 12, color: t.muted, width: 96, textAlign: "right" }}>
                  res {pt.residual >= 0 ? "+" : ""}{pt.residual.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}

/** Two markers on a shared 0..1 track: predicted (petrol) and recorded (ochre).
 *  No chart library; a thin rule with two dots reads as a calm comparison. */
function Marker({ predicted, actual }: { predicted: number; actual: number }) {
  return (
    <div style={{ position: "relative", flex: 1, height: 14, minWidth: 120 }}>
      <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 1, background: t.line }} />
      <Dot at={predicted} colour={t.petrol} />
      <Dot at={actual} colour={t.ochre} />
    </div>
  );
}

function Dot({ at, colour }: { at: number; colour: string }) {
  const clamped = Math.max(0, Math.min(1, at));
  return (
    <div
      style={{
        position: "absolute",
        top: 3,
        left: `calc(${clamped * 100}% - 3.5px)`,
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: colour,
      }}
    />
  );
}
