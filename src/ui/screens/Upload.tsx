// Upload (spec Section 4, Lecturer). The focal point is the drop zone; on drop,
// the Intake agent files the sheet and the data room updates. We show the filed
// result (a clean ResultUpload), never the raw rows. Calm at rest: before a drop,
// just the zone and one line of context.

import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Eyebrow, Provenance } from "../layout.tsx";
import { Button } from "../primitives.tsx";
import { navigate, uploadResults, useStore } from "../../app/store.ts";
import { CLO_NAMES } from "../../data/seed.ts";

export function Upload() {
  const s = useStore();
  const person = s.people.find((p) => p.id === s.currentPersonId)!;
  // The lecturer's subject (CS220 for Dr Sobri).
  const subjectId =
    s.assignments.find((a) => a.personId === person.id && a.hat === "lecturer")?.subjectId ?? "CS220";
  const subject = s.subjects.find((x) => x.id === subjectId);
  const filed = s.flashUpload && s.flashUpload.subjectId === subjectId ? s.flashUpload : null;

  return (
    <Page>
      <PageHead
        eyebrow={`Lecturer · ${subjectId} ${subject?.title ?? ""}`}
        title="Upload this term's results"
        lead="Drop the results sheet. The intake agent reads it, maps the columns onto this subject's outcomes, and files it to the data room. You see the filed result, not the spreadsheet."
      />

      {/* the drop zone: the one focal action */}
      <div
        data-demo-id="drop-zone"
        onClick={() => uploadResults(subjectId)}
        style={{
          border: `1.5px dashed ${t.line}`,
          borderRadius: t.radius,
          padding: "44px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: "rgba(251,248,241,0.5)",
          maxWidth: 560,
        }}
      >
        <div style={{ ...display, fontSize: 17, color: t.ink, fontWeight: 600 }}>Drop the results sheet</div>
        <div style={{ ...mono, fontSize: 12, color: t.muted, marginTop: 10 }}>CS220-results-2025-S1.xlsx &middot; or click to file the demo sheet</div>
        <div style={{ marginTop: 18 }}>
          <Button onClick={() => uploadResults(subjectId)}>File results</Button>
        </div>
      </div>

      {filed && (
        <>
          <Divider style={{ maxWidth: 560 }} />
          <Eyebrow accent>Filed</Eyebrow>
          <div style={{ maxWidth: 560 }}>
            <div style={{ ...display, fontSize: 16, fontWeight: 600, color: t.ink }}>
              {filed.subjectId} {subject?.title} · {filed.term}
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {filed.rows.map((r) => (
                <div key={r.cloId} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ ...mono, fontSize: 12, color: t.petrol, fontWeight: 700, width: 56 }}>{r.cloId}</span>
                  <span style={{ ...display, fontSize: 13, color: t.ink, flex: 1 }}>{CLO_NAMES[r.cloId] ?? r.cloId}</span>
                  <span style={{ ...mono, fontSize: 13, color: t.ink }}>mean {r.meanScore.toFixed(2)}</span>
                  <span style={{ ...mono, fontSize: 11, color: t.muted }}>n {r.n}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <Provenance onClick={() => navigate("dataroom")}>Filed to the data room · view freshness</Provenance>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
