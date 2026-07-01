// The self-driving demo runner, Act 3 (spec Section 9, demo spec 5b). Eases an
// overlay cursor between target rects, pauses to read, then dispatches the REAL UI
// event so the genuine app responds. Typing goes character by character. `wait`
// polls real store state (the staged reveals, intake), never a hard-coded
// duration; `hold` is a pure readable pause. Pacing constants live in timing.ts;
// turbo (smoke only) shrinks the paced holds without changing the end state.

import { getState } from "../app/store.ts";
import { SCRIPT, type DemoStep } from "./script.ts";
import { PRE_ACT_MS, SWITCH_PAD_MS, TWEEN_MS, TYPE_CHAR_MS, scaleMs } from "./timing.ts";

export interface DemoCtx {
  setCaption: (c: string) => void;
  setCursor: (x: number, y: number) => void;
  shouldAbort: () => boolean;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let cur = { x: 0, y: 0 };

async function moveTo(x: number, y: number, ctx: DemoCtx, dur = scaleMs(TWEEN_MS)): Promise<void> {
  const start = { ...cur };
  const t0 = performance.now();
  return new Promise<void>((resolve) => {
    function frame(now: number) {
      const p = Math.min(1, (now - t0) / dur);
      const e = easeInOut(p);
      cur = { x: start.x + (x - start.x) * e, y: start.y + (y - start.y) * e };
      ctx.setCursor(cur.x, cur.y);
      if (p < 1 && !ctx.shouldAbort()) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function sel(demoId: string): string {
  return `[data-demo-id="${demoId}"]`;
}

async function waitForSelector(selector: string, timeout = 12000): Promise<HTMLElement | null> {
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) return el;
    await sleep(90);
  }
  return null;
}

/** Wait for a smooth scroll to actually finish, so a rect measured afterwards is
 *  correct. Polls the scroll position until it stops moving. Without this the
 *  cursor would glide to a stale mid-scroll position and miss its target. */
async function waitScrollSettle(timeout = 1600): Promise<void> {
  let last = window.scrollY;
  let stable = 0;
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    await sleep(60);
    const y = window.scrollY;
    if (Math.abs(y - last) < 1) {
      stable += 1;
      if (stable >= 2) return;
    } else {
      stable = 0;
    }
    last = y;
  }
}

/** Scroll a target to the middle of the viewport if it is off-screen or hugging
 *  an edge, then wait for the scroll to settle, so the cursor always acts on
 *  something the viewer can see, exactly where it is. */
async function ensureVisible(el: HTMLElement): Promise<void> {
  const r = el.getBoundingClientRect();
  const margin = 100;
  if (r.top < margin || r.bottom > window.innerHeight - margin) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await waitScrollSettle();
  }
}

async function moveToEl(el: HTMLElement, ctx: DemoCtx): Promise<void> {
  await ensureVisible(el);
  const r = el.getBoundingClientRect();
  await moveTo(r.left + r.width / 2, r.top + r.height / 2, ctx);
}

/** A quick re-glide onto the target's CURRENT position, right before acting, in
 *  case a late re-render or layout shift moved it after the main move. */
async function nudgeOnto(el: HTMLElement, ctx: DemoCtx): Promise<void> {
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  if (Math.hypot(cx - cur.x, cy - cur.y) > 4) await moveTo(cx, cy, ctx, scaleMs(240));
}

/** Explicit scroll for a hold/reveal beat: "top", "bottom", or a data-demo-id to
 *  bring into the middle of the viewport (so revealed content below the fold shows). */
async function applyScroll(scroll: string): Promise<void> {
  if (scroll === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (scroll === "bottom") {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  } else {
    const el = document.querySelector(sel(scroll)) as HTMLElement | null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  await waitScrollSettle();
}

/** Click the real interactive element. Some screens put the data-demo-id on a
 *  wrapper around the Button, so a raw el.click() would not reach the handler;
 *  fall through to the first clickable descendant when the target itself is not
 *  interactive. */
function clickReal(el: HTMLElement) {
  const interactive = "button, a, [role=button], input";
  const target = el.matches(interactive) ? el : (el.querySelector(interactive) as HTMLElement | null) ?? el;
  target.click();
}

/** Set a controlled input/textarea value the way React notices, then fire input. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

async function typeInto(el: HTMLElement, text: string, ctx: DemoCtx) {
  const field = el as HTMLInputElement | HTMLTextAreaElement;
  field.focus();
  let value = field.value;
  const charMs = scaleMs(TYPE_CHAR_MS);
  for (const ch of text) {
    if (ctx.shouldAbort()) return;
    value += ch;
    setNativeValue(field, value);
    await sleep(charMs);
  }
}

function predicate(key: string): boolean {
  const s = getState();
  if (key === "intake-filed") return !!s.flashUpload;
  if (key === "run-done") return s.sim?.phase === "done";
  if (key === "signal-done") return s.signalSim?.phase === "done";
  if (key === "drill-done") return s.drillStep >= 5;
  return true;
}

async function waitFor(key: string, ctx: DemoCtx, timeout = 60000) {
  const t0 = performance.now();
  while (performance.now() - t0 < timeout) {
    if (ctx.shouldAbort()) return;
    if (predicate(key)) return;
    await sleep(120);
  }
}

async function execStep(step: DemoStep, ctx: DemoCtx) {
  if (step.scroll) await applyScroll(step.scroll);
  if (step.action === "hold") return; // pure pause; the settle after does the work
  if (step.action === "wait") {
    await waitFor(step.value ?? "", ctx);
    return;
  }
  if (step.action === "switchUser") {
    const personId = step.value!;
    const selector = getState().currentPersonId ? sel(`switch-${personId}`) : sel(`login-${personId}`);
    const el = await waitForSelector(selector);
    if (el) {
      await moveToEl(el, ctx);
      await sleep(scaleMs(SWITCH_PAD_MS));
      el.click();
    }
    return;
  }
  // move / click / type all target an element
  const el = step.target ? await waitForSelector(sel(step.target)) : null;
  if (!el) return; // best-effort: skip a missing target rather than hang
  await moveToEl(el, ctx);
  await sleep(scaleMs(PRE_ACT_MS)); // land, then pause to read before acting
  if (step.action === "click") {
    await nudgeOnto(el, ctx); // make sure the cursor is actually on it
    clickReal(el);
  } else if (step.action === "type") {
    await nudgeOnto(el, ctx);
    await typeInto(el, step.value ?? "", ctx);
  }
}

export async function runDemo(ctx: DemoCtx): Promise<void> {
  cur = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  ctx.setCursor(cur.x, cur.y);
  let prevScreen = getState().screen;
  for (const step of SCRIPT) {
    if (ctx.shouldAbort()) return;
    ctx.setCaption(step.caption);
    // A new screen starts at the top, so a long previous page never leaves the
    // next one scrolled past its focal point.
    const screen = getState().screen;
    if (screen !== prevScreen) {
      prevScreen = screen;
      if (window.scrollY > 2) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        await waitScrollSettle();
      }
    }
    await execStep(step, ctx);
    if (ctx.shouldAbort()) return;
    await sleep(scaleMs(step.settleMs));
  }
}
