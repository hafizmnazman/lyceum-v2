// Demo timing: the paced-hold durations, the cursor pacing (spec 5b), and a turbo
// scale so the headless smoke can play the whole thing quickly. The staged reveals
// keep their real tick counts; turbo only shortens the interval period and the
// paced holds, so the end state is identical every run. estimateTotalMs sums the
// whole runtime deterministically, so we can assert it lands in the 7:00-7:45
// window (spec Section 2) without waiting seven minutes.

import { SCRIPT, type DemoStep } from "./script.ts";

// ---- turbo (smoke only) ----
export function isTurbo(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const w = window as unknown as { __demoTurbo?: boolean };
    if (w.__demoTurbo) return true;
    return new URLSearchParams(window.location.search).has("demoTurbo");
  } catch {
    return false;
  }
}

/** Shrink a paced duration under turbo; full speed (identity) otherwise. */
export function scaleMs(ms: number): number {
  return isTurbo() ? Math.max(16, Math.round(ms * 0.05)) : ms;
}

// ---- cursor pacing (spec 5b: human, not a bot) ----
export const TWEEN_MS = 760; // cursor move, ease-in-out, slowing near the target
export const PRE_ACT_MS = 1400; // readable pause after landing, before acting
export const TYPE_CHAR_MS = 32; // per-character typing
export const SWITCH_PAD_MS = 200; // small settle on a user switch

// ---- Act 1 / Act 2 hold durations (the content lives in the segments) ----
// Each card / band holds just long enough to read its content and caption, no
// more. The band captions vary in length, so the holds do too.
export const SETUP_HOLDS = [6000, 8500, 9000, 7000, 8000, 6000]; // 6 cards, ~0:45
export const ARCH_HOLDS = [7000, 8000, 11000]; // 3 bands, ~0:26

// ---- staged-reveal durations (real, driven by the store timers) ----
export const DRILL_STEP_MS = 6500; // per hop
export const DRILL_STEPS = 6;
export const SIGNAL_REVEAL_MS = 12000;
export const ACCEPTANCE_REVEAL_MS = 16000;
export const DRILL_REVEAL_MS = DRILL_STEP_MS * DRILL_STEPS; // 39000

// How long each `wait` predicate really takes, for the runtime estimate.
const WAIT_MS: Record<string, number> = {
  "intake-filed": 400,
  "signal-done": SIGNAL_REVEAL_MS,
  "run-done": ACCEPTANCE_REVEAL_MS,
  "drill-done": DRILL_REVEAL_MS,
};

// Wall-clock the auto-scroll adds beyond the step sum: ~a dozen screen-change
// scroll-to-tops and a handful of scroll-into-view settles across the run. Folded
// into the estimate so it reflects the real video length (the drill-follow scrolls
// overlap the drill wait and cost nothing extra).
const SCROLL_ALLOWANCE_MS = 12000;

function stepCost(step: DemoStep): number {
  const settle = step.settleMs;
  switch (step.action) {
    case "move":
      return TWEEN_MS + settle;
    case "switchUser":
      return TWEEN_MS + SWITCH_PAD_MS + settle;
    case "click":
      return TWEEN_MS + PRE_ACT_MS + settle;
    case "type":
      return TWEEN_MS + PRE_ACT_MS + (step.value?.length ?? 0) * TYPE_CHAR_MS + settle;
    case "wait":
      return (step.value ? (WAIT_MS[step.value] ?? 0) : 0) + settle;
    case "hold":
      return settle;
    default:
      return settle;
  }
}

/** Deterministic estimate of the full-speed runtime, in ms (acts 1-3). */
export function estimateTotalMs(): number {
  const act1 = SETUP_HOLDS.reduce((a, b) => a + b, 0);
  const act2 = ARCH_HOLDS.reduce((a, b) => a + b, 0);
  const act3 = SCRIPT.reduce((a, s) => a + stepCost(s), 0);
  return act1 + act2 + act3 + SCROLL_ALLOWANCE_MS;
}
