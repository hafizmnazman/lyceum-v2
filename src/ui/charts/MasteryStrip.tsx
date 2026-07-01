// Mastery strip (ported from the design's masterySvg). A 0..1 axis with the
// proposed cohort mean as a bar, the inter-quartile band behind it, and the
// current mean marked as a caret above, so the drop reads at a glance.

import { tokens as t } from "../../theme.ts";

interface Props {
  proposedMean: number;
  iqrLo: number;
  iqrHi: number;
  currentMean: number;
}

export function MasteryStrip({ proposedMean, iqrLo, iqrHi, currentMean }: Props) {
  const W = 288;
  const H = 56;
  // Inset the track so the end axis labels (0.00, 1.00) fit inside the viewBox
  // instead of clipping at the edges.
  const x0 = 20;
  const x1 = 268;
  const y = 30;
  const xOf = (v: number) => x0 + v * (x1 - x0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={t.line} strokeWidth={2} />
      {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
        <g key={i}>
          <line x1={xOf(v)} x2={xOf(v)} y1={y - 4} y2={y + 4} stroke={t.muted} strokeWidth={1} />
          <text x={xOf(v)} y={y + 17} textAnchor="middle" fontFamily={t.fontMono} fontSize={9} fill={t.muted}>
            {v.toFixed(2)}
          </text>
        </g>
      ))}
      <rect x={xOf(iqrLo)} y={y - 9} width={xOf(iqrHi) - xOf(iqrLo)} height={18} fill="rgba(19,71,77,0.18)" />
      <line x1={xOf(proposedMean)} x2={xOf(proposedMean)} y1={y - 13} y2={y + 13} stroke={t.petrol} strokeWidth={2.5} />
      <path
        d={`M ${xOf(currentMean) - 4} ${y - 19} L ${xOf(currentMean) + 4} ${y - 19} L ${xOf(currentMean)} ${y - 13} Z`}
        fill="rgba(33,31,26,0.55)"
      />
    </svg>
  );
}
