// Act 2: the architecture beat (demo spec Section 4). One built screen (not a
// PNG) establishing the system before the walkthrough. Three horizontal bands,
// top to bottom: role workspaces, the seven agents, the shared data spine. A
// moving highlight walks the bands (activeBand) so it is watchable. The ONE
// connecting line allowed (house style) is the meaningful one: the spine grounds
// the Cohort agent's verdicts. No other decorative arrows.

import type { ReactNode } from "react";
import { tokens as t } from "../../theme.ts";
import { mono, display } from "../../ui/layout.tsx";

const ROLES = ["Management", "Department", "Course coordinator", "Lecturer"];

const AGENTS: Array<{ label: string; kind?: string }> = [
  { label: "Intake" },
  { label: "Signal" },
  { label: "Curriculum", kind: "deterministic" },
  { label: "Authoring" },
  { label: "Cohort", kind: "psychometric model" },
  { label: "Analogy" },
  { label: "Evaluator" },
];

const SPINE = ["CLO mastery survey", "SSRT self-reflection", "Uploaded results"];

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
        padding: "0 clamp(40px, 7vw, 120px)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function BandLabel({ children, active }: { children: ReactNode; active: boolean }) {
  return (
    <div
      style={{
        ...mono,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: active ? t.ochre : t.muted,
        marginBottom: 12,
        transition: "color .4s ease",
      }}
    >
      {children}
    </div>
  );
}

function Chip({ label, kind, active }: { label: string; kind?: string; active: boolean }) {
  return (
    <div
      style={{
        border: `1px solid ${active ? t.petrol : t.line}`,
        background: active ? t.petrol : "transparent",
        borderRadius: t.radius,
        padding: "12px 12px",
        textAlign: "center",
        transition: "all .4s ease",
      }}
    >
      <div style={{ ...display, fontSize: 14, fontWeight: 600, color: active ? t.cream : t.ink }}>{label}</div>
      {kind && (
        <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.04em", color: active ? "rgba(244,241,232,0.8)" : t.muted, marginTop: 4 }}>
          {kind}
        </div>
      )}
    </div>
  );
}

export function Architecture({ activeBand }: { activeBand: number }) {
  const gap = 10;
  return (
    <Frame>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: t.muted, marginBottom: 8 }}>
        The architecture
      </div>
      <h1 style={{ ...display, fontWeight: 600, fontSize: 30, lineHeight: 1.15, color: t.ink, margin: "0 0 34px" }}>
        A role-aware agent network over one real data spine
      </h1>

      {/* Band 1: role workspaces */}
      <div style={{ marginBottom: 22, opacity: activeBand === 0 ? 1 : 0.55, transition: "opacity .4s ease" }}>
        <BandLabel active={activeBand === 0}>Role workspaces</BandLabel>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${ROLES.length}, 1fr)`, gap }}>
          {ROLES.map((r) => (
            <Chip key={r} label={r} active={activeBand === 0} />
          ))}
        </div>
      </div>

      {/* Band 2: the seven agents */}
      <div style={{ marginBottom: 4, opacity: activeBand === 1 ? 1 : 0.55, transition: "opacity .4s ease" }}>
        <BandLabel active={activeBand === 1}>Agents</BandLabel>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${AGENTS.length}, 1fr)`, gap }}>
          {AGENTS.map((a) => (
            <Chip key={a.label} label={a.label} kind={a.kind} active={activeBand === 1} />
          ))}
        </div>
      </div>

      {/* the ONE meaningful edge: the spine grounds the Cohort agent's verdicts.
          A second 7-column grid aligns the connector under the Cohort chip with no
          pixel maths. */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${AGENTS.length}, 1fr)`, gap }}>
        {AGENTS.map((a) =>
          a.label === "Cohort" ? (
            <div key={a.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 1.5, height: 26, background: activeBand === 2 ? t.ochre : t.petrol, transition: "background .4s ease" }} />
              <div style={{ ...mono, fontSize: 9, color: activeBand === 2 ? t.ochre : t.muted, marginTop: 2, whiteSpace: "nowrap", transition: "color .4s ease" }}>
                grounds
              </div>
            </div>
          ) : (
            <div key={a.label} />
          ),
        )}
      </div>

      {/* Band 3: the shared data spine */}
      <div style={{ marginTop: 4, opacity: activeBand === 2 ? 1 : 0.55, transition: "opacity .4s ease" }}>
        <BandLabel active={activeBand === 2}>Shared data spine · real, per learner</BandLabel>
        <div
          style={{
            border: `1px solid ${activeBand === 2 ? t.ochre : t.line}`,
            borderRadius: t.radius,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 22,
            flexWrap: "wrap",
            transition: "border-color .4s ease",
          }}
        >
          {SPINE.map((sName) => (
            <div key={sName} style={{ ...display, fontSize: 14, color: t.ink }}>
              {sName}
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 20 }} />
          <div style={{ ...mono, fontSize: 13, color: t.petrol, fontWeight: 700 }}>
            calibrates Rasch 1PL · P = sigma(theta - b)
          </div>
        </div>
      </div>
    </Frame>
  );
}
