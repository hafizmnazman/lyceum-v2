# Lyceum

**Stress-test a curriculum change before you commit, grounded in your real cohort.**

Lyceum is a role-aware, multi-agent decision system for curriculum change. A
department runs a degree; coordinators and lecturers propose changes to subjects;
the system stress-tests each change against the real cohort before anyone commits,
and records a prediction that next term's results will score. Every verdict traces
to a real learner and a real item, and the model grades its own homework with a
backtest.

Built on the CLO mastery survey and real results, calibrating a Rasch 1PL
psychometric model. A measured cohort, not roleplay.

**[Run it locally](#getting-started)** &middot;
Built with React 18, TypeScript, and Vite 6 over a Rasch 1PL psychometric spine.

![The agent network](docs/screenshots/08-architecture.png)

---

## What makes it different

- **Seven agents, one workflow.** They read employer demand, draft the update,
  test it against your real cohort, and compile the verdict. A network, not a
  chain. Five are LLM-backed (Intake, Signal, Authoring, Analogy, Evaluator); two
  are deterministic maths (the Cohort agent's Rasch model, the Curriculum agent's
  prerequisite graph).
- **Grounded, and it proves it.** Every number traces down to a single learner and
  a single item. In the worked example the drill-down lands on `P = 0.43`.
- **A closed loop.** Approving a change records a prediction; next term's results
  score it. The same predictor is validated against a held-out past cohort:
  predicted `0.534` against a real `0.536`, mean error `0.009`.
- **Reproducible by design.** Seeded, offline, identical every run. The five LLM
  agents ship with a `fixture | live` switch; this build runs the fixture path, so
  it needs no keys and reproduces exactly. Live mode wires them to an LLM.

---

## The worked example

CS220 (Applied Machine Learning) is scheduled before its prerequisite MA201
(Linear Algebra). Lyceum measures what that does to the cohort.

| Quantity | Value |
|---|---|
| Current cohort mastery | 0.60 |
| Projected cohort mastery | 0.58 |
| Weakest outcome | CLO4 Machine learning, 0.45 |
| Sequencing conflict | one: CS220 depends on MA201 |
| Drill-down | learner S-0488, theta 0.40, item ML-14 at b 0.70, P = sigma(0.40 - 0.70) = 0.43 |
| Backtest | predicted 0.534 vs actual 0.536, MAE 0.009, 7 of 7 within 0.05 |

---

## Screenshots

**Sign in.** The people who run the degree, with their scope.

![Login](docs/screenshots/01-login.png)

**Trends.** The Signal agent reads employer demand and finds where the programme
is drifting: CS220 carries the widest gap, 0.62.

![Trends](docs/screenshots/02-trends.png)

**The acceptance test.** The Cohort agent runs the Rasch model over the real
cohort and returns a verdict: projected mastery falls to 0.58.

![Acceptance test](docs/screenshots/03-acceptance.png)

**The drill-down.** Every figure traces to a learner and an item, down to
`P = 0.43`. None of it is invented.

![Drill-down](docs/screenshots/04-drilldown.png)

**The closed loop.** The same predictor, checked against a held-out cohort it
never saw. Mean error 0.009.

![Closed loop backtest](docs/screenshots/05-backtest.png)

**The office.** The agents as a network, each desk lighting up when its agent is
actually working.

![The office](docs/screenshots/06-office.png)

---

## Architecture

```text
Layer 0   Data model     the contract every page and agent obeys        src/types.ts
Layer 1   Spine          cohort + Rasch link, pure maths, no LLM         src/lib/spine/
Layer 2   Agents         functions over the Layer 0 shapes               src/agents/
Layer 3   App and UI     store, roles, shell, role-aware screens         src/app/, src/ui/
Layer 4   Demo           the self-driving, self-narrating video          src/demo/
```

- **The data spine (real ground).** The CLO mastery survey and the SSRT
  self-reflection survey, per learner, calibrating the Rasch 1PL link
  `P = sigma(theta - b)`.
- **Roles and permissions.** Management, department, coordinators and lecturers,
  with per-subject hats. A lecturer's draft cannot reach management without
  coordinator review; management approves, the department does not; only academics
  with a hat on a subject can author or run its test.
- **The proposal flow.** `drafting` to `coordinator-review` to `testing` to
  `management-approval` to `approved`, enforced as a state machine, with pings
  routed between the waiting parties at every step.

---

## Getting started

### Requirements

- Node.js 20 or newer (the proof scripts run TypeScript directly on Node 22+).
- A modern browser. No backend, no server, no API keys to run this build.

### Install and run

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

### Proofs

The maths and the flows are covered by deterministic proof scripts (no UI):

```bash
npm run prove          # the spine and the canonical numbers (12 checks)
npm run prove:backtest # the closed-loop backtest (4 checks)
npm run prove:flow     # store, roles, state machine, analogy, closed loop (28 checks)
npm run prove:signal   # the Signal staged reveal, lands CS220 / CLO4 gap 0.62 (12 checks)
npm run prove:all      # all of the above (56 checks)
```

### The self-driving demo

A single **Play demo** control (bottom-right of the app) runs the whole thing end
to end with a simulated cursor: setup and environment cards, the architecture
beat, then the full walkthrough over the real app, narrated by captions and a
soft ambient soundtrack. It needs no manual input.

```bash
npm run build
npm run preview        # then open the URL and click "Play demo"
npm run smoke          # headless: play the demo and assert the end state
```

Drop your own royalty-free `public/demo-music.mp3` to replace the built-in
generated track.

---

## Project structure

```text
src/
  types.ts                     the Layer 0 data contract
  config.ts theme.ts index.css knobs, design tokens, the graph-paper canvas
  lib/spine/                   the reused Rasch spine (pure maths)
  agents/                      the seven agents (fixture | live)
  app/                         store, roles, staged simulations
  ui/                          shell, primitives, charts, role-aware screens
  demo/                        the self-driving video (script, runner, segments)
scripts/                       generators and headless verification
docs/screenshots/              the images in this README
```

Every screen and agent is covered by deterministic proof scripts and a headless
demo smoke, so the numbers above are reproducible on any machine.

---

## License

Copyright (c) 2026 Hafiz Azman. All rights reserved.

This is proprietary software. No permission is granted to use, copy, modify, or
distribute it without the express prior written permission of the author. See
[LICENSE](LICENSE) for the full terms.
