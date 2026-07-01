// Programme sequence timeline (ported from the design's timelineSvg). Cards by
// semester, with the conflicting course tagged NEW, its prerequisite tagged
// PREREQ, and a dashed arc marking the dependency that runs backwards in time.
// The conflict edge is passed in from the verdict, so the arc reflects the
// detected conflict rather than being hard-coded.

import { tokens as t } from "../../theme.ts";

interface Props {
  /** [conflictingCourse, prerequisiteCourse], e.g. ["CS220", "MA201"]. */
  conflictEdge?: [string, string];
}

interface Card {
  col: number;
  row: number;
  code: string;
  name: string;
}

const CARDS: Card[] = [
  { col: 0, row: 0, code: "CS101", name: "Programming foundations" },
  { col: 0, row: 1, code: "MA101", name: "Calculus" },
  { col: 1, row: 0, code: "ST201", name: "Statistical inference" },
  { col: 1, row: 1, code: "CS220", name: "Applied machine learning" },
  { col: 2, row: 0, code: "MA201", name: "Linear algebra" },
  { col: 2, row: 1, code: "CS230", name: "Data ethics, governance" },
  { col: 3, row: 0, code: "CS310", name: "Data visualisation" },
  { col: 3, row: 1, code: "CS340", name: "Deep learning" },
];

export function Timeline({ conflictEdge = ["CS220", "MA201"] }: Props) {
  const [newCode, preCode] = conflictEdge;
  const W = 1000;
  const colW = 232;
  const gap = 24;
  const headY = 18;
  const r0 = 46;
  const rh = 64;
  const r1 = 128;
  const colX = (i: number) => i * (colW + gap);

  const els: React.ReactNode[] = [];
  const pos: Record<string, { x: number; y: number }> = {};

  ["SEM 1", "SEM 2", "SEM 3", "SEM 4"].forEach((s, i) => {
    els.push(
      <text key={`h${i}`} x={colX(i) + colW / 2} y={headY} textAnchor="middle" fontFamily={t.fontMono} fontSize={10} letterSpacing="0.08em" fill={t.muted}>
        {s}
      </text>,
    );
    els.push(<line key={`hl${i}`} x1={colX(i)} x2={colX(i) + colW} y1={headY + 8} y2={headY + 8} stroke={t.line} strokeWidth={1} />);
  });

  CARDS.forEach((c, i) => {
    const x = colX(c.col);
    const y = c.row === 0 ? r0 : r1;
    pos[c.code] = { x, y };
    const isNew = c.code === newCode;
    const isPre = c.code === preCode;
    const stroke = isNew ? t.ochre : isPre ? t.petrol : t.line;
    els.push(<rect key={`c${i}`} x={x} y={y} width={colW} height={rh} rx={2} fill={t.paper} stroke={stroke} strokeWidth={isNew ? 1.8 : 1} />);
    els.push(<text key={`cc${i}`} x={x + 13} y={y + 25} fontFamily={t.fontMono} fontSize={13} fontWeight={700} fill={t.petrol}>{c.code}</text>);
    els.push(<text key={`cn${i}`} x={x + 13} y={y + 45} fontFamily={t.fontDisplay} fontSize={11.5} fill={t.ink}>{c.name}</text>);
    if (isNew) {
      els.push(<rect key={`tg${i}`} x={x + colW - 46} y={y + 9} width={36} height={16} rx={2} fill={t.ochre} />);
      els.push(<text key={`tt${i}`} x={x + colW - 28} y={y + 21} textAnchor="middle" fontFamily={t.fontMono} fontSize={9} fontWeight={700} fill={t.paper}>NEW</text>);
    }
    if (isPre) {
      els.push(<text key={`pt${i}`} x={x + colW - 13} y={y + 21} textAnchor="end" fontFamily={t.fontMono} fontSize={9} fill={t.petrol}>PREREQ</text>);
    }
  });

  const a = pos[preCode];
  const b = pos[newCode];
  if (a && b) {
    const ax = a.x + colW / 2;
    const ay = a.y;
    const bx = b.x + colW / 2;
    const by = b.y;
    const apex = 8;
    els.push(<path key="arc" d={`M ${ax} ${ay} C ${ax} ${apex}, ${bx} ${apex}, ${bx} ${by}`} fill="none" stroke={t.ochre} strokeWidth={2} strokeDasharray="5 4" />);
    els.push(<circle key="adot" cx={ax} cy={ay} r={3} fill={t.ochre} />);
    els.push(<path key="ah" d={`M ${bx - 5} ${by - 7} L ${bx} ${by} L ${bx + 5} ${by - 7}`} fill="none" stroke={t.ochre} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />);
    els.push(<rect key="lbg" x={(ax + bx) / 2 - 44} y={apex - 9} width={88} height={15} fill={t.cream} />);
    els.push(<text key="al" x={(ax + bx) / 2} y={apex + 2} textAnchor="middle" fontFamily={t.fontMono} fontSize={9.5} fill={t.ochre}>depends on</text>);
  }

  return (
    <svg viewBox={`0 0 ${W} 200`} width="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", height: "auto" }}>
      {els}
    </svg>
  );
}
