// The self-driving demo overlay (demo spec Sections 2-7). One Play control drives
// the whole video end to end: Act 1 (Setup cards), Act 2 (Architecture band walk),
// then Act 3 (the cursor-driven walkthrough over the real app). A caption bar
// carries the story (legible with the sound off), background music loops from the
// Play click with a mute toggle, and the cursor is an absolutely-positioned SVG.
// Timing is deterministic; the runtime lands in the 7:00-7:45 window (timing.ts).

import { useEffect, useRef, useState } from "react";
import { tokens as t } from "../theme.ts";
import { mono } from "../ui/layout.tsx";
import { resetDemoState, useStore } from "../app/store.ts";
import { runDemo } from "./runner.ts";
import { demoAudio } from "./audio.ts";
import { Setup } from "./segments/Setup.tsx";
import { Architecture } from "./segments/Architecture.tsx";
import { ARCH_CAPTIONS, CLOSING_CAPTION, DRILL_CAPTIONS, SETUP_CAPTIONS } from "./script.ts";
import { ARCH_HOLDS, SETUP_HOLDS, estimateTotalMs, scaleMs } from "./timing.ts";

type Phase = "idle" | "act1" | "act2" | "act3" | "done";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function DemoOverlay() {
  const s = useStore();
  const [playing, setPlaying] = useState(false);
  const [caption, setCaption] = useState("");
  const [muted, setMuted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [act1Step, setAct1Step] = useState(0);
  const [act2Band, setAct2Band] = useState(0);
  const [progress, setProgress] = useState(0);
  const [curtain, setCurtain] = useState(0); // cream crossfade between acts
  const cursorRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const mutedRef = useRef(false);

  const fade = async (to: number) => {
    setCurtain(to);
    await sleep(scaleMs(340));
  };

  // Progress bar: elapsed wall-clock over the deterministic runtime estimate.
  useEffect(() => {
    if (!playing) {
      setProgress(0);
      return;
    }
    const start = performance.now();
    const total = estimateTotalMs();
    const id = setInterval(() => setProgress(Math.min(1, (performance.now() - start) / total)), 200);
    return () => clearInterval(id);
  }, [playing]);

  // Expose the deterministic runtime estimate for the headless smoke.
  useEffect(() => {
    (window as unknown as { __demoEstimateMs?: number }).__demoEstimateMs = estimateTotalMs();
  }, []);
  // Expose the phase for the smoke to confirm the acts ran.
  useEffect(() => {
    (window as unknown as { __demo?: { phase: Phase; playing: boolean } }).__demo = { phase, playing };
  }, [phase, playing]);

  function markSeen(p: Phase) {
    const w = window as unknown as { __demoSeen?: Record<string, boolean> };
    w.__demoSeen = { ...(w.__demoSeen ?? {}), [p]: true };
  }

  function setCursor(x: number, y: number) {
    const el = cursorRef.current;
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }

  async function play() {
    if (playing) return;
    abortRef.current = false;
    resetDemoState(); // clean state so the demo replays from the top
    setCaption("");
    setPhase("idle");
    setCurtain(1); // start covered, so Act 1 fades in cleanly
    setPlaying(true);
    demoAudio.start(mutedRef.current);

    const ctx = { setCaption, setCursor, shouldAbort: () => abortRef.current };

    // Act 1: Setup and environment (timer-advanced cards).
    setPhase("act1");
    markSeen("act1");
    setAct1Step(0);
    await sleep(scaleMs(60));
    await fade(0);
    for (let i = 0; i < SETUP_HOLDS.length; i += 1) {
      if (abortRef.current) return finish();
      setAct1Step(i);
      setCaption(SETUP_CAPTIONS[i]);
      await sleep(scaleMs(SETUP_HOLDS[i]));
    }

    // Act 2: the architecture band walk (crossfade in).
    if (abortRef.current) return finish();
    await fade(1);
    setPhase("act2");
    markSeen("act2");
    setAct2Band(0);
    await sleep(scaleMs(60));
    await fade(0);
    for (let b = 0; b < ARCH_HOLDS.length; b += 1) {
      if (abortRef.current) return finish();
      setAct2Band(b);
      setCaption(ARCH_CAPTIONS[b]);
      await sleep(scaleMs(ARCH_HOLDS[b]));
    }

    // Act 3: the autonomous walkthrough over the real app (crossfade in).
    if (abortRef.current) return finish();
    setCaption("");
    await fade(1);
    setPhase("act3");
    markSeen("act3");
    await sleep(scaleMs(80));
    await fade(0);
    await runDemo(ctx);
    if (abortRef.current) return finish();

    setPhase("done");
    setCaption(CLOSING_CAPTION);
    finish();
  }

  function finish() {
    demoAudio.stop();
    setCurtain(0);
    setPlaying(false);
  }

  function stop() {
    abortRef.current = true;
    demoAudio.stop();
    setCurtain(0);
    setPlaying(false);
    setPhase("idle");
    setCaption("");
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      mutedRef.current = next;
      demoAudio.setMuted(next);
      return next;
    });
  }

  // During the drill beat the caption bar shows the current hop's line (spec 5d).
  const drillActive = playing && phase === "act3" && s.drillStep >= 0;
  const shownCaption = drillActive ? DRILL_CAPTIONS[Math.min(s.drillStep, DRILL_CAPTIONS.length - 1)] : caption;

  return (
    <>
      {/* progress bar: overall demo progress, pinned to the top edge */}
      {playing && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "rgba(19,71,77,0.14)", zIndex: 9999 }}>
          <div style={{ height: "100%", width: `${progress * 100}%`, background: t.petrol, transition: "width .2s linear" }} />
        </div>
      )}

      {/* Act 1 / Act 2 full-screen segments */}
      {playing && phase === "act1" && <Setup key={`setup-${act1Step}`} step={act1Step} />}
      {playing && phase === "act2" && <Architecture activeBand={act2Band} />}

      {/* cream crossfade curtain, masks the hard cut between acts */}
      {playing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9994,
            pointerEvents: "none",
            background: t.cream,
            opacity: curtain,
            transition: "opacity .34s ease",
          }}
        />
      )}

      {/* Play / Stop control */}
      <button
        data-demo-id="play-demo"
        onClick={playing ? stop : play}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9998,
          background: playing ? t.ochre : t.petrol,
          color: playing ? t.ink : t.cream,
          border: "none",
          borderRadius: t.radius,
          padding: "12px 18px",
          ...mono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(33,31,26,0.18)",
        }}
      >
        {playing ? "Stop demo" : "Play demo"}
      </button>

      {/* mute toggle, top corner, house style, line icon */}
      {playing && (
        <button
          data-demo-id="mute-toggle"
          onClick={toggleMute}
          title={muted ? "Unmute music" : "Mute music"}
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            zIndex: 9999,
            background: "rgba(33,31,26,0.82)",
            color: t.cream,
            border: "none",
            borderRadius: t.radius,
            padding: "9px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            ...mono,
            fontSize: 11,
          }}
        >
          <SpeakerIcon muted={muted} />
          {muted ? "Muted" : "Music"}
        </button>
      )}

      {/* caption bar */}
      {playing && shownCaption && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            zIndex: 9998,
            background: "rgba(33,31,26,0.92)",
            color: t.cream,
            padding: "13px 24px",
            borderRadius: t.radius,
            fontFamily: t.fontDisplay,
            fontSize: 15,
            lineHeight: 1.45,
            maxWidth: "72vw",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(33,31,26,0.28)",
          }}
        >
          {shownCaption}
        </div>
      )}

      {/* the simulated cursor (Act 3 only) */}
      {playing && phase === "act3" && (
        <div
          ref={cursorRef}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            zIndex: 9999,
            pointerEvents: "none",
            transform: "translate(-3px, -2px)",
            filter: "drop-shadow(0 2px 3px rgba(33,31,26,0.35))",
          }}
        >
          <svg width={24} height={24} viewBox="0 0 24 24">
            <path d="M4 2 L4 20 L9 15 L12.5 22 L15 21 L11.5 14 L18 14 Z" fill={t.cream} stroke={t.ink} strokeWidth={1.3} strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={t.cream} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9 v6 h4 l5 4 V5 L8 9 Z" />
      {muted ? (
        <path d="M17 9 l4 6 M21 9 l-4 6" />
      ) : (
        <path d="M17 8.5 a4 4 0 0 1 0 7" />
      )}
    </svg>
  );
}
