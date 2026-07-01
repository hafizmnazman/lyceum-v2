// Act 1: Setup and environment (demo spec Section 3). A full-screen, auto-advancing
// title sequence over the graph-paper canvas, driven by the overlay's timer (the
// `step` prop, 0..4). House style: left-aligned, one focal point per card,
// whitespace over borders, no boxing, no connector arrows. Space Grotesk for
// headings, Space Mono for code and numbers.

import type { ReactNode } from "react";
import { tokens as t } from "../../theme.ts";
import { mono, display } from "../../ui/layout.tsx";

// Card 5 pulls the real figures from PROJECT_STATE (kept current, not stale):
// 56 proof checks, typecheck clean, production build succeeds, demo runs end to end.
const PROOF_CHECKS = 56;

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        backgroundColor: t.cream,
        backgroundImage: `linear-gradient(${t.grid} 1px, transparent 1px), linear-gradient(90deg, ${t.grid} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
        backgroundPosition: "-1px -1px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 clamp(48px, 10vw, 160px)",
      }}
    >
      <div style={{ maxWidth: 760, animation: "fadein .5s ease" }}>
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...mono, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: t.muted, marginBottom: 20 }}>
      {children}
    </div>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h1 style={{ ...display, fontWeight: 600, fontSize: 40, lineHeight: 1.1, color: t.ink, margin: "0 0 22px" }}>{children}</h1>;
}

function Line({ children }: { children: ReactNode }) {
  return <div style={{ ...display, fontSize: 19, lineHeight: 1.6, color: t.ink, marginBottom: 8 }}>{children}</div>;
}

export function Setup({ step }: { step: number }) {
  // Card 1: the cover, with the hook.
  if (step <= 0) {
    return (
      <Frame>
        <div style={{ ...display, fontWeight: 700, fontSize: 92, lineHeight: 1, letterSpacing: "-0.02em", color: t.petrol, marginBottom: 26 }}>
          Lyceum
        </div>
        <div style={{ ...display, fontSize: 22, lineHeight: 1.5, color: t.ink, maxWidth: 640 }}>
          Stress-test a curriculum change before you commit, grounded in your real cohort.
        </div>
        <div style={{ ...mono, fontSize: 13, color: t.ochre, marginTop: 34, letterSpacing: "0.04em", fontWeight: 700 }}>
          A multi-agent decision system over a real psychometric spine.
        </div>
      </Frame>
    );
  }

  // Card 2: what it does, the multi-agent seller.
  if (step === 1) {
    return (
      <Frame>
        <Eyebrow>01 / 05</Eyebrow>
        <Heading>Seven agents, one workflow</Heading>
        <Line>They read employer demand, draft the update, test it against your real cohort, and compile the verdict.</Line>
        <Line>A network, not a chain. Five are LLM-backed; two are deterministic maths (the Rasch model, the prerequisite graph).</Line>
      </Frame>
    );
  }

  // Card 3: why it is different, the payload.
  if (step === 2) {
    return (
      <Frame>
        <Eyebrow>02 / 05</Eyebrow>
        <Heading>Grounded, and it proves it</Heading>
        <Line>Not roleplay. Every verdict traces to a real learner and a real item, drilled down to <Mono>P = 0.43</Mono>.</Line>
        <Line>It grades its own homework: on a held-out cohort it predicted <Mono>0.534</Mono> against a real <Mono>0.536</Mono>, mean error <Mono>0.009</Mono>.</Line>
      </Frame>
    );
  }

  // Card 4: environment and stack.
  if (step === 3) {
    return (
      <Frame>
        <Eyebrow>03 / 05</Eyebrow>
        <Heading>Environment</Heading>
        <Line>React 18, TypeScript, Vite 6. Runs in the browser, nothing to stand up.</Line>
        <Line>The five LLM agents have a fixture/live switch. This recording runs the fixture path.</Line>
      </Frame>
    );
  }

  // Card 5: setup and how to run.
  if (step === 4) {
    return (
      <Frame>
        <Eyebrow>04 / 05</Eyebrow>
        <Heading>Setup</Heading>
        <pre
          style={{
            ...mono,
            fontSize: 17,
            lineHeight: 1.8,
            color: t.ink,
            background: t.paper,
            border: `1px solid ${t.line}`,
            borderRadius: t.radius,
            padding: "20px 24px",
            margin: "0 0 20px",
            maxWidth: 560,
            overflow: "hidden",
          }}
        >
          <span>npm install</span>
          {"\n"}
          <span>npm run dev</span>
          <span style={{ color: t.muted }}>{"      # http://localhost:5173"}</span>
          {"\n"}
          <span>npm run build</span>
          <span style={{ color: t.muted }}>{"    # production build -> dist/"}</span>
        </pre>
        <Line>Reproducible by design: seeded, offline, identical every run. Live mode wires the agents to an LLM.</Line>
      </Frame>
    );
  }

  // Card 6: proof of readiness.
  return (
    <Frame>
      <Eyebrow>05 / 05</Eyebrow>
      <Heading>Verified</Heading>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 18 }}>
        <span style={{ ...mono, fontSize: 64, fontWeight: 700, lineHeight: 1, color: t.ochre }}>{PROOF_CHECKS}</span>
        <span style={{ ...display, fontSize: 20, color: t.ink }}>automated checks pass.</span>
      </div>
      <Line>Typecheck clean. Production build succeeds.</Line>
      <Line>The self-driving demo runs end to end.</Line>
    </Frame>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span style={{ ...mono, color: t.petrol, fontWeight: 700 }}>{children}</span>;
}
