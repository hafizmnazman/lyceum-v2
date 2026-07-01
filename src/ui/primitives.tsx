// Small shared UI primitives, on the locked tokens (Section 16). Kept minimal;
// the screens compose these plus inline styles, matching the design reference.

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { tokens as t } from "../theme.ts";

export function Panel({ children, style, accent }: { children: ReactNode; style?: CSSProperties; accent?: boolean }) {
  return (
    <div
      style={{
        background: t.paper,
        border: `1px solid ${accent ? t.ochre : t.line}`,
        borderRadius: t.radius,
        padding: "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        font: `600 11px/1 ${t.fontDisplay}`,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: accent ? t.ochre : t.petrol,
      }}
    >
      {children}
    </span>
  );
}

export function Tag({ children, tone = "ochre" }: { children: ReactNode; tone?: "ochre" | "petrol" }) {
  const bg = tone === "ochre" ? t.ochre : t.petrol;
  const fg = tone === "ochre" ? t.ink : t.cream;
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color: fg,
        font: `700 11px/1 ${t.fontMono}`,
        letterSpacing: "0.06em",
        padding: "6px 10px",
        borderRadius: t.radius,
      }}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "accent";

// Accepts standard button attributes (so data-demo-id, disabled, etc. pass
// through to the element), plus our variant. Used everywhere, including by the
// self-driving demo which targets buttons by data-demo-id.
export function Button({
  children,
  onClick,
  variant = "primary",
  style,
  ...rest
}: {
  children: ReactNode;
  variant?: ButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: t.petrol, color: t.cream, border: "none" },
    secondary: { background: "transparent", color: t.petrol, border: `1px solid ${t.petrol}` },
    accent: { background: t.ochre, color: t.ink, border: "none" },
  };
  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        font: `600 12px/1 ${t.fontDisplay}`,
        padding: "11px 15px",
        borderRadius: t.radius,
        cursor: "pointer",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
