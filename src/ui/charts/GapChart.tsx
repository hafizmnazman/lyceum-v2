// Dual-gap chart (ported from the design's gapSvg). Market gap and readiness
// gap on the same CLO axis, with a confidence band on each bar (taller band =
// thinner data). Driven by the derived CloRows, so every bar is real output.

import { tokens as t } from "../../theme.ts";
import type { CloRow } from "../derive.ts";

interface Props {
  rows: CloRow[];
}

export function GapChart({ rows }: Props) {
  const W = 980;
  const H = 366;
  const left = 44;
  const right = 966;
  const top = 20;
  const base = 300;
  const max = 0.7;
  const yOf = (v: number) => base - (v / max) * (base - top);
  const slot = (right - left) / rows.length;
  const bw = 30;

  const els: React.ReactNode[] = [];

  for (let i = 0; i <= 7; i += 1) {
    const v = i / 10;
    const yv = yOf(v);
    const major = i === 0 || i === 7;
    els.push(
      <line
        key={`g${i}`}
        x1={left}
        x2={right}
        y1={yv}
        y2={yv}
        stroke={t.grid}
        strokeWidth={1}
        strokeDasharray={major ? undefined : "2 5"}
      />,
    );
    els.push(
      <text key={`gt${i}`} x={left - 8} y={yv + 3.5} textAnchor="end" fontFamily={t.fontMono} fontSize={10} fill={t.muted}>
        {v.toFixed(1)}
      </text>,
    );
  }

  rows.forEach((c, i) => {
    const cx = left + (i + 0.5) * slot;
    const mx = cx - 34;
    const rx = cx + 4;
    const lc = c.weakest ? t.ochre : t.petrol;

    if (c.weakest) {
      els.push(<rect key={`fb${i}`} x={cx - slot / 2 + 5} y={top} width={slot - 10} height={base - top} fill="rgba(200,137,58,0.07)" />);
    }
    els.push(<rect key={`mb${i}`} x={mx} y={yOf(c.marketGap)} width={bw} height={base - yOf(c.marketGap)} fill={t.petrol} />);
    els.push(<rect key={`rb${i}`} x={rx} y={yOf(c.readinessGap)} width={bw} height={base - yOf(c.readinessGap)} fill={t.petrol2} />);

    const band = (x: number, v: number, key: string) => {
      const yt = yOf(Math.min(max, v + c.bandHalf));
      const yb = yOf(Math.max(0, v - c.bandHalf));
      els.push(<rect key={`${key}d`} x={x - 4} y={yt} width={bw + 8} height={yb - yt} fill="rgba(33,31,26,0.10)" />);
      els.push(<line key={`${key}t`} x1={x - 4} x2={x + bw + 4} y1={yt} y2={yt} stroke="rgba(33,31,26,0.38)" strokeWidth={1} />);
      els.push(<line key={`${key}b`} x1={x - 4} x2={x + bw + 4} y1={yb} y2={yb} stroke="rgba(33,31,26,0.38)" strokeWidth={1} />);
    };
    band(mx, c.marketGap, `m${i}`);
    band(rx, c.readinessGap, `r${i}`);

    els.push(<text key={`xl${i}`} x={cx} y={320} textAnchor="middle" fontFamily={t.fontMono} fontSize={11} fontWeight={700} fill={lc}>{c.cloId}</text>);
    els.push(<text key={`xc${i}`} x={cx} y={333} textAnchor="middle" fontFamily={t.fontMono} fontSize={9.5} fill={t.muted}>{c.code}</text>);
    els.push(<text key={`xm${i}`} x={cx} y={349} textAnchor="middle" fontFamily={t.fontMono} fontSize={9.5} fill={t.petrol}>{`M ${c.marketGap.toFixed(2)}`}</text>);
    els.push(<text key={`xr${i}`} x={cx} y={361} textAnchor="middle" fontFamily={t.fontMono} fontSize={9.5} fill="#3f6f72">{`R ${c.readinessGap.toFixed(2)}`}</text>);
  });

  els.push(<line key="baseline" x1={left} x2={right} y1={base} y2={base} stroke={t.petrol} strokeWidth={1.5} />);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", height: "auto" }}>
      {els}
    </svg>
  );
}
