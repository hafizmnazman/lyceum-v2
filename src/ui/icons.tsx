// Line icons (Section 16: line only, no emoji). Ported from the design
// reference's icon function. Each takes the current color via `stroke`.

interface IconProps {
  size?: number;
}

const base = (size: number) => ({
  viewBox: "0 0 24 24",
  width: size,
  height: size,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function CoverageIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 20V11" />
      <path d="M12 20V5" />
      <path d="M19 20V14" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function VerdictIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 17a8 8 0 0 1 16 0" />
      <path d="M12 17l5-4" />
      <circle cx={12} cy={17} r={1.3} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DrillIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 3v15" />
      <path d="M7 9h6" />
      <path d="M7 16h6" />
      <circle cx={7} cy={3} r={1.4} fill="currentColor" stroke="none" />
      <circle cx={14} cy={9} r={1.4} fill="currentColor" stroke="none" />
      <circle cx={14} cy={16} r={1.4} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BacktestIcon({ size = 20 }: IconProps) {
  // History / replay: a circular arrow back, for predicting a past cohort.
  return (
    <svg {...base(size)}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v4h4" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function MaterialIcon({ size = 20 }: IconProps) {
  // Slides / document with lines, for material generation.
  return (
    <svg {...base(size)}>
      <rect x={4} y={3} width={16} height={18} rx={1.5} />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

export function PipelineIcon({ size = 20 }: IconProps) {
  // Connected nodes: the agent pipeline.
  return (
    <svg {...base(size)}>
      <circle cx={5} cy={12} r={2.5} />
      <circle cx={12} cy={12} r={2.5} />
      <circle cx={19} cy={12} r={2.5} />
      <path d="M7.5 12h2" />
      <path d="M14.5 12h2" />
    </svg>
  );
}

export function SignOutIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 12h7" />
      <path d="M18 9l3 3-3 3" />
    </svg>
  );
}

// ---------- v2 screen icons (line only, no emoji) ----------
export function TrendsIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 17l5-5 4 3 6-7" />
      <path d="M16 8h5v5" />
    </svg>
  );
}

export function ApprovalIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

export function ProgrammeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x={3} y={4} width={7} height={7} rx={1} />
      <rect x={14} y={4} width={7} height={7} rx={1} />
      <rect x={3} y={14} width={7} height={6} rx={1} />
      <rect x={14} y={14} width={7} height={6} rx={1} />
    </svg>
  );
}

export function NewSubjectIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x={4} y={4} width={16} height={16} rx={1.5} />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function AssignmentsIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx={8} cy={8} r={3} />
      <path d="M3 20a5 5 0 0 1 10 0" />
      <path d="M16 11h5" />
      <path d="M16 15h5" />
    </svg>
  );
}

export function CoursesIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 5h11a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4z" />
      <path d="M20 5h-1a2 2 0 0 0-2 2v12" />
    </svg>
  );
}

export function StudioIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 20l4-1 9-9-3-3-9 9z" />
      <path d="M13.5 6.5l3 3" />
      <path d="M16 4l1.5-1.5a1.5 1.5 0 0 1 2 2L18 6" />
    </svg>
  );
}

export function AcceptanceIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function InboxIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 13l2-8h12l2 8" />
      <path d="M4 13v6h16v-6" />
      <path d="M4 13h5l1 2h4l1-2h5" />
    </svg>
  );
}

export function UploadIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 16V5" />
      <path d="M8 9l4-4 4 4" />
      <path d="M5 19h14" />
    </svg>
  );
}

export function DataRoomIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <ellipse cx={12} cy={6} rx={7} ry={3} />
      <path d="M5 6v12c0 1.6 3.1 3 7 3s7-1.4 7-3V6" />
      <path d="M5 12c0 1.6 3.1 3 7 3s7-1.4 7-3" />
    </svg>
  );
}

export function OfficeIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 21V5l8-2v18" />
      <path d="M12 21V9l8 2v10" />
      <path d="M7 8h1M7 12h1M7 16h1" />
    </svg>
  );
}
