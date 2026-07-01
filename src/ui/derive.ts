// Presentation-derived per-CLO rows for the charts and the trends view. Every
// value comes from real output: demand from the Signal agent, mastery and
// grounding confidence from the VerdictReport's spine run. The confidence band
// half-width is derived from the grounding confidence (low confidence -> wide
// band), which is how the spine's 0..1 score becomes a confidence interval.
// Carried from v1's derive.ts, adapted to the v2 report shape.

import type { CLOId, VerdictReport } from "../types.ts";
import { clamp01 } from "../lib/stats.ts";
import { CLOS } from "../data/seed.ts";
import { marketGapByCLO } from "../agents/signal.ts";

// [KNOB] band half-width = (1 - confidence) * BAND_SCALE. At 0.25 a confidence
// of 0.36 (CLO4) gives a band of ~0.16, matching the design.
export const BAND_SCALE = 0.25;

export interface CloRow {
  cloId: CLOId;
  name: string;
  code: string; // the owning subject id, e.g. CS220
  demand: number;
  coverage: number;
  marketGap: number;
  proposedMastery: number;
  readinessGap: number;
  confidence: number;
  bandHalf: number;
  weakest: boolean;
}

export function deriveCloRows(report: VerdictReport): CloRow[] {
  const gaps = marketGapByCLO();
  const proposedByCLO = new Map(report.cloMastery.map((m) => [m.cloId, m]));
  const weakest = [...report.cloMastery].sort((a, b) => a.meanP - b.meanP)[0]?.cloId;

  return CLOS.map((clo) => {
    const gap = gaps[clo.id];
    const proposed = proposedByCLO.get(clo.id);
    const proposedMastery = proposed?.meanP ?? 0;
    const confidence = proposed?.confidence ?? 0;
    return {
      cloId: clo.id,
      name: clo.text,
      code: clo.subjectId,
      demand: gap?.demand ?? 0,
      coverage: gap?.coverage ?? 0,
      marketGap: gap?.gap ?? 0,
      proposedMastery,
      // Distance from full mastery on this outcome: a pure capability shortfall,
      // independent of demand. CLO4 lands ~0.55.
      readinessGap: clamp01(1 - proposedMastery),
      confidence,
      bandHalf: (1 - confidence) * BAND_SCALE,
      weakest: clo.id === weakest,
    };
  });
}
