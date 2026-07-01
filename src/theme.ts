// Realised design tokens (implementation.md Section 16). Locked here so the
// coded build matches the Claude Design reference exactly. Petrol primary,
// ochre as the single accent (flags and warnings only), cream background,
// 2px radius, Space Grotesk for headings/labels and Space Mono for all numbers.

export const tokens = {
  petrol: "#13474D", // primary
  petrol2: "#7BA6A8", // secondary series (readiness gap)
  ochre: "#C8893A", // single accent, flags and warnings only
  cream: "#F4F1E8", // background
  paper: "#FBF8F1", // raised surfaces
  ink: "#211F1A", // body text
  line: "#CFC7B4", // borders and dividers
  muted: "#6F6A5E", // secondary mono text
  grid: "rgba(177,168,144,0.20)", // graph-paper lines at 32px
  radius: "2px",
  fontDisplay: "'Space Grotesk', system-ui, sans-serif",
  fontMono: "'Space Mono', ui-monospace, monospace",
} as const;
