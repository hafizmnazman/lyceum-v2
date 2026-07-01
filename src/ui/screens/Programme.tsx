// Programme (spec Section 4, Department). The degree by year, but the screen
// opens on the one thing that needs a decision: the subjects the Curriculum agent
// has flagged. The CS220 prerequisite conflict is the headline. The full grid is
// folded away behind a disclosure so the page is calm at rest. The department
// reads and creates here; it does not draft, so an "open" only drafts for a
// new-subject flag, otherwise it just shows the detail.

import { useState } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Eyebrow, Row } from "../layout.tsx";
import { Tag, Button } from "../primitives.tsx";
import { navigate, selectSubject, useStore } from "../../app/store.ts";
import { runCurriculum } from "../../agents/curriculum.ts";
import { runSignal } from "../../agents/signal.ts";
import type { SubjectAnnotation } from "../../agents/curriculum.ts";

const ANNO_LABEL: Record<Exclude<SubjectAnnotation["annotation"], "fine">, string> = {
  "prereq-conflict": "prereq conflict",
  "needs-new-clo": "needs new outcome",
  "needs-update": "needs update",
};

export function ProgrammeScreen() {
  const s = useStore();
  const [showGrid, setShowGrid] = useState(false);

  const annos = runCurriculum(s.programme.id, runSignal(s.programme.id));
  const byId = new Map(s.subjects.map((su) => [su.id, su]));
  const annoBySubject = new Map(annos.map((a) => [a.subjectId, a]));

  // Conflicts read loudest, then new-outcome, then update.
  const order: Record<string, number> = { "prereq-conflict": 0, "needs-new-clo": 1, "needs-update": 2 };
  const flagged = annos
    .filter((a) => a.annotation !== "fine")
    .sort((a, b) => (order[a.annotation] ?? 9) - (order[b.annotation] ?? 9));

  const years = [1, 2, 3, 4].filter((y) => s.subjects.some((su) => su.year === y));

  return (
    <Page>
      <PageHead
        eyebrow={`Department · ${s.programme.title}`}
        title="The flags worth a decision"
        lead="The Curriculum agent checked the degree against the skills signal and the prerequisite graph. These are the subjects that need attention. The rest of the programme is folded away below."
      />

      {/* the focal point: flagged subjects, conflict first */}
      <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 4 }}>
        {flagged.map((a) => {
          const su = byId.get(a.subjectId);
          const isNew = a.annotation === "needs-new-clo";
          return (
            <Row key={a.subjectId} rail={t.ochre} style={{ alignItems: "flex-start", padding: "16px 16px 16px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: t.petrol }}>{a.subjectId}</span>
                  <span style={{ ...display, fontSize: 16, fontWeight: 600, color: t.ink }}>{su?.title ?? a.subjectId}</span>
                  <Tag tone="ochre">{ANNO_LABEL[a.annotation as keyof typeof ANNO_LABEL]}</Tag>
                </div>
                <div style={{ ...display, fontSize: 14, lineHeight: 1.5, color: t.muted, marginTop: 8 }}>{a.detail}</div>
              </div>
              {isNew && (
                <Button
                  variant="secondary"
                  style={{ flexShrink: 0 }}
                  onClick={() => {
                    selectSubject(a.subjectId);
                    navigate("new-subject");
                  }}
                >
                  Scope it
                </Button>
              )}
            </Row>
          );
        })}
      </div>

      <Divider style={{ maxWidth: 720, margin: "32px 0 20px" }} />

      <button
        onClick={() => setShowGrid((v) => !v)}
        style={{
          ...display,
          fontSize: 13,
          fontWeight: 600,
          color: t.petrol,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        {showGrid ? "Hide the full degree" : "Show the full degree"}
      </button>

      {showGrid && (
        <div style={{ marginTop: 26 }}>
          <Eyebrow>{s.subjects.length} subjects · years 1 to {years[years.length - 1] ?? 1}</Eyebrow>
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap", alignItems: "flex-start" }}>
            {years.map((year) => {
              const inYear = s.subjects.filter((su) => su.year === year);
              const semesters = [...new Set(inYear.map((su) => su.semester))].sort((x, y) => x - y);
              return (
                <div key={year} style={{ minWidth: 200 }}>
                  <div style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: t.muted, marginBottom: 14 }}>
                    Year {year}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {semesters.map((sem) => (
                      <div key={sem}>
                        <div style={{ ...mono, fontSize: 10, color: t.muted, marginBottom: 8 }}>Sem {sem}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                          {inYear
                            .filter((su) => su.semester === sem)
                            .map((su) => {
                              const flag = annoBySubject.get(su.id)?.annotation;
                              const isFlagged = flag !== undefined && flag !== "fine";
                              return (
                                <div key={su.id} style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                                  <span
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: "50%",
                                      background: isFlagged ? t.ochre : t.petrol2,
                                      flexShrink: 0,
                                      alignSelf: "center",
                                    }}
                                  />
                                  <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: t.petrol, width: 52 }}>{su.id}</span>
                                  <span style={{ ...display, fontSize: 13, color: isFlagged ? t.ink : t.muted }}>{su.title}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Page>
  );
}
