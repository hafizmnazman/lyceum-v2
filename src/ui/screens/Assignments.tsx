// Assignments (spec Section 4, Department). The programme's RoleAssignment table
// read as a document: for each subject, who wears which hat. Calm at rest, the
// table is the one thing on the page; assigning a hat is tucked behind a quiet
// disclosure. A person can hold both hats on a subject (the union of permissions).

import { useState } from "react";
import type { Hat, PersonId, SubjectId } from "../../types.ts";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Eyebrow } from "../layout.tsx";
import { Tag, Button } from "../primitives.tsx";
import { assignHat, useStore } from "../../app/store.ts";

export function AssignmentsScreen() {
  const s = useStore();
  const personById = (id: PersonId) => s.people.find((p) => p.id === id);
  const academics = s.people.filter((p) => p.orgRole === "academic");

  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState<PersonId>(academics[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState<SubjectId>(s.subjects[0]?.id ?? "");
  const [hat, setHat] = useState<Hat>("coordinator");

  const selectStyle = {
    ...display,
    fontSize: 13,
    color: t.ink,
    background: t.paper,
    border: `1px solid ${t.line}`,
    borderRadius: t.radius,
    padding: "9px 11px",
  } as const;

  return (
    <Page>
      <PageHead
        eyebrow={`Department · ${s.programme.title}`}
        title="Who holds which hat"
        lead="The role table for the programme. A coordinator owns a subject and reviews its drafts; a lecturer teaches and uploads. Hats are assigned per person, per subject."
      />

      {/* the focal document: subjects, each with its quiet assignment rows */}
      <div style={{ maxWidth: 640 }}>
        {s.subjects.map((subject, i) => {
          const rows = s.assignments.filter((a) => a.subjectId === subject.id);
          return (
            <div key={subject.id} style={{ marginTop: i === 0 ? 0 : 30 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ ...mono, fontSize: 13, color: t.petrol, fontWeight: 700 }}>{subject.id}</span>
                <span style={{ ...display, fontSize: 16, fontWeight: 600, color: t.ink }}>{subject.title}</span>
              </div>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
                {rows.length === 0 ? (
                  <div style={{ ...display, fontSize: 13, color: t.muted }}>No hats assigned yet.</div>
                ) : (
                  rows.map((a) => (
                    <div key={`${a.personId}-${a.hat}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ ...display, fontSize: 14, color: t.ink, width: 130 }}>
                        {personById(a.personId)?.name ?? a.personId}
                      </span>
                      <Tag tone={a.hat === "coordinator" ? "petrol" : "ochre"}>{a.hat}</Tag>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...display, fontSize: 13, color: t.muted, marginTop: 30, maxWidth: 640, lineHeight: 1.55 }}>
        A person can wear both hats on one subject. Dr Sobri coordinates and lectures CS220, so his
        permissions there are the union of the two.
      </div>

      <Divider style={{ maxWidth: 640 }} />

      {/* assigning a hat: tucked behind a disclosure so the table stays the focus */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          ...mono,
          fontSize: 12,
          color: t.petrol,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          letterSpacing: "0.02em",
        }}
      >
        {open ? "− Assign a hat" : "+ Assign a hat"}
      </button>

      {open && (
        <div style={{ marginTop: 18, maxWidth: 640 }}>
          <Eyebrow>New assignment</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
            <select value={personId} onChange={(e) => setPersonId(e.target.value)} style={selectStyle}>
              {academics.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={selectStyle}>
              {s.subjects.map((su) => (
                <option key={su.id} value={su.id}>{su.id} {su.title}</option>
              ))}
            </select>
            <select value={hat} onChange={(e) => setHat(e.target.value as Hat)} style={selectStyle}>
              <option value="coordinator">coordinator</option>
              <option value="lecturer">lecturer</option>
            </select>
            <Button onClick={() => assignHat(personId, subjectId, hat)}>Assign hat</Button>
          </div>
        </div>
      )}
    </Page>
  );
}
