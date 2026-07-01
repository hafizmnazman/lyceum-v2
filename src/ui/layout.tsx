// Shared layout helpers that encode the house style (spec Section 3a) so every
// screen reads like a calm document, not an architecture diagram:
//   - left-aligned reading order, generous whitespace, no boxing by default
//   - one quiet eyebrow label at most; hierarchy through type, not chrome
//   - one focal point (the PageHead title, or a Focal block) dominant and high
//   - numbers in Space Mono
// Screens compose these; a Panel border is earned, not a default.

import type { CSSProperties, ReactNode } from "react";
import { tokens as t } from "../theme.ts";

export const mono = { fontFamily: t.fontMono } as const;
export const display = { fontFamily: t.fontDisplay } as const;

/** Page shell: left-aligned, roomy, fades in. Not centred, not boxed. */
export function Page({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ animation: "fadein .25s ease", maxWidth: 1060, padding: "8px 4px 64px", ...style }}>
      {children}
    </div>
  );
}

/** The one focal header: a quiet eyebrow, a real heading, a supporting lead.
 *  This is where the eye lands. Keep one per screen. */
export function PageHead({
  eyebrow,
  title,
  lead,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
      <div style={{ maxWidth: 720 }}>
        {eyebrow && (
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: t.muted, marginBottom: 12 }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ ...display, fontWeight: 600, fontSize: 30, lineHeight: 1.15, color: t.ink, margin: 0 }}>{title}</h1>
        {lead && <p style={{ ...display, fontSize: 15, lineHeight: 1.55, color: t.muted, margin: "14px 0 0", maxWidth: 640 }}>{lead}</p>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

/** A big mono number with a quiet label, for headline figures. */
export function BigStat({ value, label, accent, sub }: { value: ReactNode; label: ReactNode; accent?: boolean; sub?: ReactNode }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: 44, lineHeight: 1, fontWeight: 700, color: accent ? t.ochre : t.petrol }}>{value}</div>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: t.muted, marginTop: 10 }}>{label}</div>
      {sub && <div style={{ ...display, fontSize: 13, color: t.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/** A small inline stat (label over mono value). */
export function Stat({ label, value, accent }: { label: ReactNode; value: ReactNode; accent?: boolean }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: t.muted, marginBottom: 6 }}>{label}</div>
      <div style={{ ...mono, fontSize: 18, fontWeight: 700, color: accent ? t.ochre : t.ink }}>{value}</div>
    </div>
  );
}

/** A hairline divider; whitespace does most grouping, this is for the rest. */
export function Divider({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: t.line, margin: "24px 0", ...style }} />;
}

/** A quiet section label (Space Grotesk, small). One per group at most. */
export function Eyebrow({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <div style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: accent ? t.ochre : t.muted, marginBottom: 14 }}>
      {children}
    </div>
  );
}

/** A list row grouped by whitespace, not a card. Optional left status rail. */
export function Row({
  children,
  onClick,
  rail,
  active,
  style,
  demoId,
}: {
  children: ReactNode;
  onClick?: () => void;
  rail?: string; // colour of a thin left status bar
  active?: boolean;
  style?: CSSProperties;
  demoId?: string;
}) {
  return (
    <div
      data-demo-id={demoId}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 16px 14px 14px",
        borderLeft: `2px solid ${rail ?? "transparent"}`,
        background: active ? "rgba(19,71,77,0.05)" : "transparent",
        cursor: onClick ? "pointer" : "default",
        borderRadius: t.radius,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Provenance line: a quiet, clickable "grounded on N learners" style note. */
export function Provenance({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 11,
        color: t.muted,
        background: "none",
        border: "none",
        borderBottom: `1px dashed ${t.line}`,
        padding: "2px 0",
        cursor: onClick ? "pointer" : "default",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </button>
  );
}
