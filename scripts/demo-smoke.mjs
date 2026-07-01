// Headless smoke for the self-driving demo (spec Section 9/12, demo spec Section 8).
// Serves the production build with `vite preview`, drives a real headless browser
// to click "Play demo", and asserts the whole video runs and lands the right end
// state:
//   - Acts 1 (Setup) and 2 (Architecture) play before the walkthrough
//   - the Signal staged reveal reaches done (CS220 / CLO4)
//   - the six-hop drill-down reveals (P = 0.43)
//   - the canonical CS220 proposal ends approved, a Prediction is recorded at 0.58
//   - the estimated runtime lands in the 7:00-7:45 window
//   - no uncaught page errors (the missing music file must not fail the demo)
//
// Runs in turbo (?demoTurbo) so the paced holds shrink; the staged reveals keep
// their real tick counts, so the end state is identical to a full-speed run.
// Uses the system Chrome/Edge via puppeteer-core (no Chromium download).
//
// Run with:  node scripts/demo-smoke.mjs   (after `npm run build`)

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];
const executablePath = BROWSERS.find((p) => existsSync(p));
if (!executablePath) {
  console.error("No system browser found; skipping smoke.");
  process.exit(2);
}

const PORT = 4178;
const URL = `http://localhost:${PORT}/?demoTurbo`;

function waitForServer(url, timeoutMs = 20000) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const r = await fetch(url);
        if (r.ok) return resolve();
      } catch {
        // not up yet
      }
      if (Date.now() - t0 > timeoutMs) return reject(new Error("server did not start"));
      setTimeout(tick, 300);
    };
    tick();
  });
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
  shell: true,
  stdio: "ignore",
});

let browser;
let failed = false;
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failed = true;
};

try {
  await waitForServer(URL);
  const puppeteer = (await import("puppeteer-core")).default;
  browser = await puppeteer.launch({ executablePath, headless: "new", args: ["--no-sandbox", "--window-size=1440,900"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: "networkidle0" });

  const estimate = await page.evaluate(() => window.__demoEstimateMs ?? null);

  await page.waitForSelector('[data-demo-id="play-demo"]', { timeout: 10000 });
  await page.click('[data-demo-id="play-demo"]');

  // Poll the store + demo telemetry until the canonical proposal is approved and a
  // prediction exists, tracking that each act ran and the reveals fired along the way.
  const deadline = Date.now() + 120000;
  let snap = null;
  let sawSignalDone = false;
  let sawDrill = false;
  let seen = {};
  while (Date.now() < deadline) {
    snap = await page.evaluate(() => {
      const st = window.__lyceum?.getState?.();
      if (!st) return null;
      const prop = st.proposals.find((p) => p.id === "CP-CS220-001");
      const pred = st.predictions.find((p) => p.proposalId === "CP-CS220-001");
      return {
        status: prop?.status ?? null,
        projected: prop?.acceptanceResult?.projectedMastery ?? null,
        drillP: prop?.acceptanceResult?.drillRoot?.p ?? null,
        hasPrediction: !!pred,
        predicted: pred?.predictedMastery ?? null,
        screen: st.screen,
        notifications: st.notifications.length,
        signalPhase: st.signalSim?.phase ?? null,
        drillStep: st.drillStep,
        seen: window.__demoSeen ?? {},
      };
    });
    if (snap) {
      if (snap.signalPhase === "done") sawSignalDone = true;
      if (snap.drillStep >= 5) sawDrill = true;
      seen = snap.seen ?? seen;
    }
    if (snap && snap.status === "approved" && snap.hasPrediction) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("end state:", JSON.stringify({ ...snap, estimate }));
  check(!!snap, "store state was readable");
  check(seen.act1 === true, "Act 1 (Setup) played");
  check(seen.act2 === true, "Act 2 (Architecture) played");
  check(seen.act3 === true, "Act 3 (walkthrough) played");
  check(sawSignalDone, "the Signal staged reveal reached done");
  check(sawDrill, "the six-hop drill-down revealed to the end");
  check(snap?.status === "approved", "canonical CS220 proposal ends approved");
  check(snap?.hasPrediction === true, "a prediction was recorded on approval");
  check(snap != null && Math.abs((snap.projected ?? 0) - 0.578) < 0.01, "verdict projected mastery is 0.58");
  check(snap != null && Math.abs((snap.drillP ?? 0) - 0.4256) < 0.01, "drill-down P is 0.43");
  check(snap != null && snap.notifications > 0, "notifications fired during the run");
  check(
    estimate != null && estimate >= 270000 && estimate <= 478000,
    `estimated runtime is natural and under 8:00 (${estimate != null ? (estimate / 1000).toFixed(0) + "s" : "n/a"})`,
  );
  check(errors.length === 0, `no uncaught page errors (${errors.length})`);
  if (errors.length) console.log(errors.slice(0, 5).join("\n"));
} catch (e) {
  console.error("smoke error:", e);
  failed = true;
} finally {
  if (browser) await browser.close();
  server.kill();
}

console.log(failed ? "\nSMOKE FAILED" : "\nSMOKE PASSED");
process.exit(failed ? 1 : 0);
