// New subject (spec Section 4, Department). The focal point is one short form:
// name it, pick a coordinator, confirm. Calm at rest: just the form. Once the
// subject exists we show it quietly and offer a proxy acceptance test, because a
// brand-new subject has no cohort of its own to test against.

import { useState } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Eyebrow, Provenance } from "../layout.tsx";
import { createSubject, navigate, selectProposal, selectSubject, switchUser, useStore } from "../../app/store.ts";

const fieldLabel: CSSProperties = {
  ...mono,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: t.muted,
  marginBottom: 8,
  display: "block",
};

const textInput: CSSProperties = {
  ...display,
  fontSize: 15,
  color: t.ink,
  background: t.paper,
  border: `1px solid ${t.line}`,
  borderRadius: t.radius,
  padding: "10px 12px",
  width: "100%",
  boxSizing: "border-box",
};

const codeInput: CSSProperties = { ...textInput, ...mono, fontSize: 14 };

// A button matching the primitive's variants but carrying a data-demo-id, which
// the self-driving demo clicks. The shared Button doesn't pass that attribute
// through, so this screen renders its two driven actions natively.
function ActionButton({
  children,
  onClick,
  demoId,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  demoId: string;
  variant?: "primary" | "secondary";
}) {
  const skin: CSSProperties =
    variant === "primary"
      ? { background: t.petrol, color: t.cream, border: "none" }
      : { background: "transparent", color: t.petrol, border: `1px solid ${t.petrol}` };
  return (
    <button
      data-demo-id={demoId}
      onClick={onClick}
      style={{
        font: `600 12px/1 ${t.fontDisplay}`,
        padding: "11px 15px",
        borderRadius: t.radius,
        cursor: "pointer",
        ...skin,
      }}
    >
      {children}
    </button>
  );
}

export function NewSubjectScreen() {
  const s = useStore();
  const academics = s.people.filter((p) => p.orgRole === "academic");

  const [id, setId] = useState("CS450");
  const [title, setTitle] = useState("Reinforcement Learning");
  const [year, setYear] = useState(3);
  const [semester, setSemester] = useState(1);
  const [coordinatorId, setCoordinatorId] = useState(academics[0]?.id ?? "");
  const [cloText, setCloText] = useState(
    "Apply reinforcement-learning methods to a sequential decision problem.",
  );
  const [createdId, setCreatedId] = useState<string | null>(null);

  const created = createdId ? s.subjects.find((x) => x.id === createdId) : undefined;
  const coordinator = s.people.find((p) => p.id === coordinatorId);

  function confirm() {
    const newId = createSubject({
      id,
      title,
      year: Number(year),
      semester: Number(semester),
      coordinatorId,
      cloText,
    });
    setCreatedId(newId);
  }

  return (
    <Page>
      <PageHead
        eyebrow="Department · Bachelor of Computer Science"
        title="Scope a new subject"
        lead="Name it, give it one outcome, and hand it to a coordinator. The proposal lands in their studio; you can take it straight to a proxy acceptance test from here."
      />

      {!created ? (
        // the focal point: a short, left-aligned form
        <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ width: 150 }}>
              <label style={fieldLabel}>Code</label>
              <input value={id} onChange={(e) => setId(e.target.value)} style={codeInput} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Title</label>
              <input
                data-demo-id="ns-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={textInput}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ width: 110 }}>
              <label style={fieldLabel}>Year</label>
              <input
                type="number"
                min={1}
                max={4}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                style={codeInput}
              />
            </div>
            <div style={{ width: 110 }}>
              <label style={fieldLabel}>Semester</label>
              <input
                type="number"
                min={1}
                max={2}
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                style={codeInput}
              />
            </div>
          </div>

          <div>
            <label style={fieldLabel}>First outcome (CLO)</label>
            <textarea
              value={cloText}
              onChange={(e) => setCloText(e.target.value)}
              rows={2}
              style={{ ...textInput, resize: "vertical", lineHeight: 1.45 }}
            />
          </div>

          <div>
            <label style={fieldLabel}>Coordinator</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {academics.map((p) => {
                const on = p.id === coordinatorId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCoordinatorId(p.id)}
                    style={{
                      ...display,
                      fontSize: 13,
                      fontWeight: on ? 600 : 500,
                      color: on ? t.cream : t.ink,
                      background: on ? t.petrol : t.paper,
                      border: `1px solid ${on ? t.petrol : t.line}`,
                      borderRadius: t.radius,
                      padding: "8px 13px",
                      cursor: "pointer",
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 4 }}>
            <ActionButton demoId="ns-create" onClick={confirm}>
              Create subject &amp; assign coordinator
            </ActionButton>
          </div>
        </div>
      ) : (
        // calm confirmation: the subject exists; offer the proxy test
        <div style={{ maxWidth: 560 }}>
          <Eyebrow accent>Created</Eyebrow>
          <div style={{ ...display, fontSize: 22, fontWeight: 600, color: t.ink }}>
            <span style={{ ...mono, color: t.petrol, marginRight: 12 }}>{created.id}</span>
            {created.title}
          </div>
          <div style={{ ...mono, fontSize: 12, color: t.muted, marginTop: 10 }}>
            Year {created.year} &middot; Semester {created.semester} &middot; coordinator{" "}
            {coordinator?.name ?? coordinatorId} &middot; status {created.status}
          </div>
          <div style={{ ...display, fontSize: 14, color: t.ink, marginTop: 14, lineHeight: 1.55 }}>
            {cloText}
          </div>

          <Divider style={{ maxWidth: 560 }} />

          <p style={{ ...display, fontSize: 13.5, color: t.muted, margin: "0 0 16px", lineHeight: 1.55, maxWidth: 520 }}>
            A new subject has no cohort of its own yet, so when the coordinator
            tests it the Analogy agent borrows a proxy from similar outcomes.
            Testing is the coordinator's to run, so hand it over.
          </p>
          <ActionButton
            demoId="ns-test"
            variant="secondary"
            onClick={() => {
              switchUser(coordinatorId);
              selectSubject(created.id);
              selectProposal(`CP-${created.id}-001`);
              navigate("studio");
            }}
          >
            Hand to {coordinator?.name ?? "the coordinator"} to test
          </ActionButton>
          <div style={{ marginTop: 16 }}>
            <Provenance onClick={() => navigate("assignments")}>Or review the assignments</Provenance>
          </div>
        </div>
      )}
    </Page>
  );
}
