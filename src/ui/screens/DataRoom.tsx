// Data room (spec Section 4), shared. The spine made visible: every DataSource
// with its term and freshness, grouped by subject. This is the evidence layer
// the provenance links point at, so it reads as a calm document, not a console.
// One quiet headline, then subjects as sections, sources as left-aligned rows.

import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider } from "../layout.tsx";
import { useStore } from "../../app/store.ts";
import type { DataSource } from "../../types.ts";

// The fixed clock (matches the store's NOW). Everything is computed against this
// so freshness is deterministic and never touches Date.now().
const CLOCK_MS = Date.UTC(2026, 6, 1); // 2026-07-01

const KIND_LABELS: Record<DataSource["kind"], string> = {
  "clo-survey": "CLO survey",
  ssrt: "SSRT",
  results: "Results",
};

/** A short, deterministic freshness string from an ISO date vs the fixed clock. */
function freshness(isoDate: string): string {
  const then = Date.parse(isoDate);
  if (Number.isNaN(then)) return isoDate;
  const days = Math.round((CLOCK_MS - then) / 86_400_000);
  if (days <= 0) return "ingested today";
  if (days === 1) return "1 day ago";
  if (days < 45) return `${days} days ago`;
  return `ingested ${isoDate.slice(0, 10)}`;
}

export function DataRoomScreen() {
  const s = useStore();

  // Group sources by subject, walking subjects in their canonical order so the
  // document reads top-down. Only subjects that actually have sources appear.
  const groups = s.subjects
    .map((subject) => ({
      subject,
      sources: s.dataSources.filter((d) => d.subjectId === subject.id),
    }))
    .filter((g) => g.sources.length > 0);

  const total = s.dataSources.length;

  return (
    <Page>
      <PageHead
        eyebrow="Shared · Data room"
        title="Every number traces back here."
        lead="Each verdict elsewhere rests on these sources. This is the ground: the surveys, the SSRT readings, and the filed results, with the term they cover and when they last came in."
      />

      <div style={{ ...mono, fontSize: 11, color: t.muted, letterSpacing: "0.02em", marginBottom: 8 }}>
        {total} sources across {groups.length} subjects
      </div>

      {groups.map((g, gi) => {
        // The freshest source in this group earns the ochre dot.
        const freshestMs = Math.max(...g.sources.map((d) => Date.parse(d.ingestedAt)));
        return (
          <div key={g.subject.id}>
            {gi > 0 && <Divider style={{ maxWidth: 720 }} />}

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: gi > 0 ? 0 : 18 }}>
              <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: t.petrol }}>{g.subject.id}</span>
              <span style={{ ...display, fontSize: 15, color: t.ink }}>{g.subject.title}</span>
            </div>

            <div style={{ marginTop: 12, marginBottom: 4, maxWidth: 720 }}>
              {g.sources.map((d, di) => {
                const isFreshest = Date.parse(d.ingestedAt) === freshestMs;
                return (
                  <div
                    key={`${d.kind}-${d.term}-${di}`}
                    style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "9px 0" }}
                  >
                    <span
                      title={isFreshest ? "freshest source" : undefined}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        flexShrink: 0,
                        alignSelf: "center",
                        background: isFreshest ? t.ochre : "transparent",
                        border: isFreshest ? "none" : `1.5px solid ${t.line}`,
                      }}
                    />
                    <span style={{ ...display, fontSize: 13, color: t.ink, width: 110, flexShrink: 0 }}>
                      {KIND_LABELS[d.kind]}
                    </span>
                    <span style={{ ...mono, fontSize: 12, color: t.muted, width: 76, flexShrink: 0 }}>{d.term}</span>
                    <span style={{ ...mono, fontSize: 12, color: t.ink, width: 96, flexShrink: 0 }}>
                      {d.recordCount} records
                    </span>
                    <span style={{ ...mono, fontSize: 12, color: isFreshest ? t.ochre : t.muted }}>
                      {freshness(d.ingestedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Page>
  );
}
