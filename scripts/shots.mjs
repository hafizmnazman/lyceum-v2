// Capture screenshots of the key screens to eyeball the house style (Section 3a).
// Drives the store directly via the window test seam. Writes PNGs to the path in
// argv[2] (a scratchpad dir). Run after `npm run build`.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] || "./shots";
mkdirSync(OUT, { recursive: true });

const BROWSERS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const executablePath = BROWSERS.find((p) => existsSync(p));
const PORT = 4179;
const URL = `http://localhost:${PORT}/`;

function waitForServer(url, timeoutMs = 20000) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try { const r = await fetch(url); if (r.ok) return resolve(); } catch { /* wait */ }
      if (Date.now() - t0 > timeoutMs) return reject(new Error("server timeout"));
      setTimeout(tick, 300);
    };
    tick();
  });
}

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { shell: true, stdio: "ignore" });
let browser;
try {
  await waitForServer(URL);
  const puppeteer = (await import("puppeteer-core")).default;
  browser = await puppeteer.launch({ executablePath, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: "networkidle0" });

  const drive = (fn) => page.evaluate(fn);
  const settle = (ms = 450) => new Promise((r) => setTimeout(r, ms));
  const shot = async (name) => { await settle(); await page.screenshot({ path: join(OUT, `${name}.png`) }); console.log("shot", name); };

  // login
  await shot("01-login");

  // lecturer upload (filed)
  await drive(() => { const s = window.__lyceum; s.login("P-SOBRI"); s.navigate("upload"); s.uploadResults("CS220"); });
  await shot("02-upload");

  // course studio (hybrid draft)
  await drive(() => { const s = window.__lyceum; s.selectSubject("CS220"); s.selectProposal("CP-CS220-001"); s.draftWithAgent("CP-CS220-001", "hybrid"); s.navigate("studio"); });
  await shot("03-studio");

  // acceptance verdict (run immediately so it is settled)
  await drive(() => { const s = window.__lyceum; s.runAcceptanceImmediate("CP-CS220-001"); s.navigate("acceptance"); });
  await shot("04-acceptance");

  // office (after a run: cohort done, evaluator needs-input)
  await drive(() => { const s = window.__lyceum; s.navigate("office"); });
  await shot("05-office");

  // management trends
  await drive(() => { const s = window.__lyceum; s.switchUser("P-LIM"); s.navigate("trends"); });
  await shot("06-trends");

  // management approval
  await drive(() => { const s = window.__lyceum; s.navigate("approval"); });
  await shot("07-approval");

  // closed loop / backtest
  await drive(() => { const s = window.__lyceum; s.navigate("backtest"); });
  await shot("08-backtest");

  // department programme
  await drive(() => { const s = window.__lyceum; s.switchUser("P-RAHMAN"); s.navigate("programme"); });
  await shot("09-programme");

  // data room
  await drive(() => { const s = window.__lyceum; s.navigate("dataroom"); });
  await shot("10-dataroom");

  console.log("done");
} catch (e) {
  console.error("shots error:", e);
} finally {
  if (browser) await browser.close();
  server.kill();
}
