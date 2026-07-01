// The self-driving demo script, Act 3 (demo spec Section 5d). The storyline in
// exact order. The runner moves a simulated cursor to each target and dispatches
// the REAL UI event, so the genuine app responds. `wait` polls real state (the
// staged reveals, intake), never a hard-coded duration. `hold` is a pure readable
// pause on the current frame. Targets are data-demo-id values on the elements.
//
// Acts 1 (Setup) and 2 (Architecture) are timed title/architecture sequences
// driven by the overlay, not cursor steps; they play before this script.

import { PEOPLE_IDS } from "../data/seed.ts";

export interface DemoStep {
  caption: string;
  target?: string; // data-demo-id of the element to act on
  action: "move" | "click" | "type" | "wait" | "hold" | "switchUser";
  value?: string; // text for "type", personId for "switchUser", predicate key for "wait"
  settleMs: number; // human-like pause after the action (spec 5b: readable, not a bot)
  scroll?: "top" | "bottom" | string; // bring content into view on a hold/reveal beat
}

// The six drill-down hop captions (spec 5d step 8). Shown by the caption bar,
// synced to the store's drillStep, as the drill reveals one hop at a time.
export const DRILL_CAPTIONS: string[] = [
  "Projected mastery falls to 0.58.",
  "CLO4 is the driver, at 0.45.",
  "Down to one learner, S-0488.",
  "Ability 0.40 on this outcome.",
  "Facing item ML-14, difficulty 0.70.",
  "P = sigma(0.40 - 0.70) = 0.43. Every number computed, none invented.",
];

// The captions for Acts 1 and 2 and the closing frame (spec Sections 3, 4, 5d).
export const SETUP_CAPTIONS: string[] = [
  "Lyceum. Stress-test a curriculum change before you commit, grounded in your real cohort.",
  "Seven agents run it: reading demand, drafting the change, testing the cohort, compiling the verdict.",
  "Grounded, and it proves it. Every number down to a learner, P = 0.43, and a backtest at 0.009 mean error.",
  "React, TypeScript, Vite. Five agents LLM-backed with a fixture/live switch, two deterministic maths.",
  "Install, run, build. This recording runs the reproducible fixture path; live wires the agents to an LLM.",
  "Verified: the checks pass, the build succeeds, the demo runs end to end.",
];

export const ARCH_CAPTIONS: string[] = [
  "Four roles operate the system: management, department, coordinators, lecturers.",
  "Seven agents do the work: reading demand, checking the graph, drafting updates, running the cohort, compiling the verdict.",
  "Every verdict is grounded in real, per-learner survey data. That grounding, and the backtest that validates it, are what set Lyceum apart, not the fact that it uses agents.",
];

export const CLOSING_CAPTION = "Lyceum. Test the change before the cohort pays for it.";

const SIGNAL_BEAT =
  "The signal agent reads employer demand, extracts the rising skills, and maps them onto your outcomes.";

export const SCRIPT: DemoStep[] = [
  // 0. The login screen: who runs the degree.
  { caption: "Everyone who runs the degree signs in here: management, department, coordinators, lecturers.", action: "hold", settleMs: 4200 },

  // 1. A lecturer (Dr Sobri) signs in.
  { caption: "A lecturer signs in to upload this term's results.", action: "switchUser", value: PEOPLE_IDS.sobri, settleMs: 2600 },
  { caption: "A lecturer uploads this term's results.", action: "hold", settleMs: 2600 },

  // 2. Drop the results; the Intake agent files them.
  { caption: "Intake files them against the right course and outcomes.", action: "click", target: "nav-upload", settleMs: 2200 },
  { caption: "Intake files them against the right course and outcomes.", action: "click", target: "drop-zone", settleMs: 2000 },
  { caption: "Intake files them against the right course and outcomes.", action: "wait", value: "intake-filed", settleMs: 4000 },

  // 3. Management opens Trends; the Signal agent plays its staged reveal.
  { caption: "Management sees CS220 drifting from demand.", action: "switchUser", value: PEOPLE_IDS.lim, settleMs: 2000 },
  { caption: SIGNAL_BEAT, action: "click", target: "nav-trends", settleMs: 1400 },
  { caption: SIGNAL_BEAT, action: "wait", value: "signal-done", settleMs: 2400 },
  { caption: "CS220 carries the widest gap, 0.62, machine learning against its coverage.", action: "hold", settleMs: 3200 },

  // 4. Route the drift to the coordinator.
  { caption: "It pings the course coordinator, findings attached.", action: "click", target: "route-CS220", settleMs: 3500 },

  // 5. The coordinator opens the flagged subject.
  { caption: "The coordinator opens the flagged subject.", action: "switchUser", value: PEOPLE_IDS.sobri, settleMs: 2000 },
  { caption: "The coordinator opens the flagged subject.", action: "click", target: "nav-courses", settleMs: 2000 },
  { caption: "The coordinator opens the flagged subject.", action: "click", target: "open-CS220", settleMs: 2800 },

  // 6. Update it in hybrid mode, the Authoring agent assisting, then edit one line.
  { caption: "They update it, the Authoring agent assisting. The coordinator keeps the pen.", action: "click", target: "mode-hybrid", settleMs: 3000 },
  { caption: "They update it, the Authoring agent assisting. The coordinator keeps the pen.", action: "type", target: "clo-edit-0", value: " It assumes the linear algebra from MA201.", settleMs: 2800 },
  { caption: "The coordinator keeps the pen. The change is theirs, tested before it ships.", action: "hold", settleMs: 6000 },

  // 7. Run the acceptance test; watch it run.
  { caption: "The Cohort agent runs the Rasch model over the real cohort. Watch it work.", action: "click", target: "run-test", settleMs: 1400 },
  { caption: "The Cohort agent runs the Rasch model over the real cohort. Watch it work.", action: "wait", value: "run-done", settleMs: 3200 },
  { caption: "Projected mastery 0.58, down from 0.60, driven by CLO4 at 0.45.", action: "hold", settleMs: 5500, scroll: "verdict" },

  // 8. The drill-down: six hops, each held long enough to read.
  { caption: DRILL_CAPTIONS[0], action: "click", target: "open-drill", settleMs: 1800 },
  { caption: DRILL_CAPTIONS[0], action: "wait", value: "drill-done", settleMs: 4000 },

  // 9. Submit to management.
  { caption: "The tested change goes to the approval gate.", action: "click", target: "submit-management", settleMs: 3000 },

  // 10. Management reads the verdict and approves.
  { caption: "Management reads the verdict and approves.", action: "switchUser", value: PEOPLE_IDS.lim, settleMs: 2000 },
  { caption: "Management reads the verdict and approves.", action: "click", target: "nav-approval", settleMs: 2400 },
  { caption: "Management reads the verdict and approves.", action: "click", target: "approve", settleMs: 4500 },

  // 11. The closed loop: the prediction is recorded.
  { caption: "The prediction is recorded. Next term's real results will score it.", action: "click", target: "nav-backtest", settleMs: 3500 },
  { caption: "The prediction is recorded. Next term's real results will score it.", action: "hold", settleMs: 4500 },

  // 12. The backtest reveal: the model grades its own homework.
  { caption: "Run on a held-out cohort it never saw, the model predicts 0.534 against a real 0.536. Mean error 0.009. This is the part that matters: it grades its own homework.", action: "click", target: "reveal-backtest", settleMs: 4000 },
  { caption: "Run on a held-out cohort it never saw, the model predicts 0.534 against a real 0.536. Mean error 0.009. This is the part that matters: it grades its own homework.", action: "hold", settleMs: 9500, scroll: "backtest-result" },

  // 13. Office: the agents as a network.
  { caption: "The agents as a network, each doing its part.", action: "click", target: "nav-office", settleMs: 4000 },
  { caption: "The agents as a network, each doing its part.", action: "hold", settleMs: 6000 },

  // 14. Data room: the real per-learner grounding.
  { caption: "Grounded in real, per-learner survey data. Not roleplay.", action: "click", target: "nav-dataroom", settleMs: 4000 },
  { caption: "Grounded in real, per-learner survey data. Not roleplay.", action: "hold", settleMs: 6000 },

  // 15. Closing frame.
  { caption: CLOSING_CAPTION, action: "hold", settleMs: 8000 },
];
