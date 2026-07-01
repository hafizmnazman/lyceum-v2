// The living office (spec Section 8). Seven agent characters at fixed desks. Each
// has a state (idle | working | done | needs-input) derived from real system
// state (store.agentStates), not a fixed parade. A character animates to
// "working" (typing) when its agent is active; a speech bubble renders when it
// needs input (Authoring asking the mode, Evaluator presenting a verdict). During
// an acceptance test the Cohort character works while the others wait. Calm at
// rest. CSS-animated SVG figures in petrol/ochre, bounded layout.

import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display } from "../layout.tsx";
import { AGENT_LABELS, useStore, type AgentId, type AgentState } from "../../app/store.ts";

const DESKS: { id: AgentId; role: string }[] = [
  { id: "intake", role: "files uploads" },
  { id: "signal", role: "reads demand" },
  { id: "curriculum", role: "checks the graph" },
  { id: "authoring", role: "drafts changes" },
  { id: "cohort", role: "runs the spine" },
  { id: "analogy", role: "borrows proxies" },
  { id: "evaluator", role: "writes the verdict" },
];

function colourFor(st: AgentState): string {
  if (st === "working") return t.ochre;
  if (st === "done") return t.petrol;
  if (st === "needs-input") return t.ochre;
  return t.line;
}

export function OfficeScreen() {
  const s = useStore();
  const anyActive = Object.values(s.agentStates).some((st) => st !== "idle");

  return (
    <Page>
      <PageHead
        eyebrow="The office"
        title="The agents at work"
        lead="A network, not a chain. Each desk lights up when its agent is actually doing something: intake on an upload, the cohort during a test, the evaluator when a verdict is ready. Calm when there is nothing to do."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          maxWidth: 880,
          padding: "26px 20px 16px",
          background: "rgba(251,248,241,0.45)",
          border: `1px solid ${t.line}`,
          borderRadius: t.radius,
        }}
      >
        {DESKS.map((d) => (
          <Desk key={d.id} id={d.id} role={d.role} state={s.agentStates[d.id]} bubble={s.agentBubble?.agent === d.id ? s.agentBubble.text : null} />
        ))}
      </div>

      <div style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 16 }}>
        {anyActive ? "Live: an agent is working." : "At rest. Run an acceptance test or file an upload to see the office come alive."}
      </div>
    </Page>
  );
}

function Desk({ id, role, state, bubble }: { id: AgentId; role: string; state: AgentState; bubble: string | null }) {
  const c = colourFor(state);
  const working = state === "working";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 4px", position: "relative" }}>
      {bubble && (
        <div
          style={{
            position: "absolute",
            top: -6,
            background: t.petrol,
            color: t.cream,
            ...mono,
            fontSize: 9.5,
            lineHeight: 1.3,
            padding: "6px 8px",
            borderRadius: t.radius,
            maxWidth: 150,
            textAlign: "center",
            animation: "lypop .25s ease",
            zIndex: 2,
          }}
        >
          {bubble}
        </div>
      )}
      <Figure agent={id} colour={c} working={working} done={state === "done"} />
      <div style={{ ...display, fontSize: 12, fontWeight: 600, color: t.ink, marginTop: 6 }}>{AGENT_LABELS[id]}</div>
      <div style={{ ...mono, fontSize: 9.5, color: t.muted, marginTop: 2 }}>{role}</div>
      <div style={{ ...mono, fontSize: 9, color: c, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{state}</div>
    </div>
  );
}

function Figure({ agent, colour, working, done }: { agent: AgentId; colour: string; working: boolean; done: boolean }) {
  return (
    <svg viewBox="0 0 120 104" width={132} height={114} style={{ display: "block" }}>
      {/* desk */}
      <line x1={8} x2={112} y1={88} y2={88} stroke={t.line} strokeWidth={2} />
      {/* monitor */}
      <g style={working ? { animation: "lypulse 1.1s ease-in-out infinite" } : undefined}>
        <rect x={62} y={44} width={44} height={32} rx={2} fill={t.paper} stroke={colour} strokeWidth={1.8} />
        <Glyph agent={agent} colour={colour} />
      </g>
      <line x1={84} x2={84} y1={76} y2={88} stroke={t.line} strokeWidth={1.5} />
      {/* person */}
      <circle cx={36} cy={46} r={10} fill="none" stroke={t.petrol} strokeWidth={1.8} />
      <path d="M20 86 C 20 68, 52 68, 52 86" fill="none" stroke={t.petrol} strokeWidth={1.8} />
      <path d="M48 78 L 60 70" fill="none" stroke={t.petrol} strokeWidth={1.6} strokeLinecap="round" />
      {/* done check */}
      {done && (
        <path d="M98 40 l3 3 5-6" fill="none" stroke={t.petrol} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {/* typing dots when working */}
      {working &&
        [0, 1, 2].map((i) => (
          <circle key={i} cx={26 + i * 6} cy={96} r={2} fill={t.ochre} style={{ animation: `lypulse 1s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
    </svg>
  );
}

function Glyph({ agent, colour }: { agent: AgentId; colour: string }) {
  const cx = 84;
  const cy = 60;
  const stroke = { stroke: colour, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const };
  switch (agent) {
    case "intake":
      return (
        <g {...stroke}>
          <path d={`M${cx - 9} ${cy} h18`} />
          <path d={`M${cx - 9} ${cy} l4 6 h10 l4 -6`} />
          <path d={`M${cx} ${cy - 8} v6 M${cx - 3} ${cy - 5} l3 3 3 -3`} />
        </g>
      );
    case "signal":
      return (
        <g {...stroke}>
          <path d={`M${cx - 9} ${cy + 6} v-3 M${cx - 4} ${cy + 6} v-8 M${cx + 1} ${cy + 6} v-12 M${cx + 6} ${cy + 6} v-6`} />
        </g>
      );
    case "curriculum":
      return (
        <g {...stroke}>
          <circle cx={cx - 7} cy={cy - 4} r={2.4} />
          <circle cx={cx + 6} cy={cy - 6} r={2.4} />
          <circle cx={cx + 2} cy={cy + 6} r={2.4} />
          <path d={`M${cx - 5} ${cy - 3} L${cx + 4} ${cy - 5} M${cx + 5} ${cy - 4} L${cx + 3} ${cy + 4}`} />
        </g>
      );
    case "authoring":
      return (
        <g {...stroke}>
          <path d={`M${cx - 7} ${cy - 7} h14 v14 h-14 z`} />
          <path d={`M${cx - 4} ${cy - 3} h8 M${cx - 4} ${cy} h8 M${cx - 4} ${cy + 3} h5`} />
        </g>
      );
    case "cohort":
      return (
        <g fill={colour}>
          {[-6, 0, 6].map((dx) =>
            [-5, 1, 7].map((dy) => <circle key={`${dx}-${dy}`} cx={cx + dx} cy={cy + dy} r={1.5} />),
          )}
        </g>
      );
    case "analogy":
      return (
        <g {...stroke}>
          <circle cx={cx - 6} cy={cy} r={4} />
          <circle cx={cx + 6} cy={cy} r={4} />
          <path d={`M${cx - 2} ${cy} h4`} />
        </g>
      );
    case "evaluator":
      return (
        <g {...stroke}>
          <path d={`M${cx - 7} ${cy} l4 5 l9 -10`} strokeWidth={2} />
        </g>
      );
  }
}
