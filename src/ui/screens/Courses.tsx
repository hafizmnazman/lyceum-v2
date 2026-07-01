// Courses (spec Section 4, Coordinator/Lecturer). A person's own subjects with the
// Curriculum agent's annotation read against each. Calm at rest: the one flagged
// subject is the focal point, shown large with its detail and the single action
// that matters (open it in Course Studio). The rest of the person's subjects sit
// quietly below as a list, each fine and muted, each clickable.

import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Eyebrow, Row } from "../layout.tsx";
import { Button } from "../primitives.tsx";
import { navigate, selectProposal, selectSubject, useStore } from "../../app/store.ts";
import { subjectsForPerson } from "../../app/roles.ts";
import { runCurriculum, type SubjectAnnotation } from "../../agents/curriculum.ts";
import { runSignal } from "../../agents/signal.ts";

export function CoursesScreen() {
  const s = useStore();
  const person = s.people.find((p) => p.id === s.currentPersonId)!;
  const mine = subjectsForPerson(person.id, s.assignments);

  // The Curriculum agent reads the programme against the skills signal; index its
  // annotations by subject so we can hang one off each of the person's subjects.
  const annotations = runCurriculum(s.programme.id, runSignal(s.programme.id));
  const bySubject = new Map<string, SubjectAnnotation>(annotations.map((a) => [a.subjectId, a]));

  // The flagged subject among "mine" is the focal point (CS220, prereq-conflict
  // for Dr Sobri). Anything not "fine" counts; prereq conflicts read loudest.
  const flaggedId = mine.find((id) => (bySubject.get(id)?.annotation ?? "fine") !== "fine");
  const others = mine.filter((id) => id !== flaggedId);

  function open(subjectId: string) {
    selectSubject(subjectId);
    const prop = s.proposals.find((p) => p.subjectId === subjectId);
    if (prop) selectProposal(prop.id);
    navigate("studio");
  }

  const flagged = flaggedId ? s.subjects.find((x) => x.id === flaggedId) : undefined;
  const flaggedNote = flaggedId ? bySubject.get(flaggedId) : undefined;

  return (
    <Page>
      <PageHead
        eyebrow={`${person.name} · my subjects`}
        title={flagged ? "One subject needs your attention" : "Your subjects"}
        lead={
          flagged
            ? "The Curriculum agent read your subjects against demand and the prerequisite graph. One is flagged. Open it in Course Studio to act."
            : "The Curriculum agent read your subjects against demand and the prerequisite graph. Nothing is flagged right now."
        }
      />

      {flagged && flaggedNote && (
        <div style={{ maxWidth: 640 }}>
          <Eyebrow accent>Flagged</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ ...mono, fontSize: 24, fontWeight: 700, color: t.ochre }}>{flagged.id}</span>
            <span style={{ ...display, fontSize: 24, fontWeight: 600, color: t.ink }}>{flagged.title}</span>
          </div>
          <p style={{ ...display, fontSize: 15, lineHeight: 1.55, color: t.muted, margin: "12px 0 0" }}>
            {flaggedNote.detail}
          </p>
          <div data-demo-id={`open-${flagged.id}`} style={{ marginTop: 20 }}>
            <Button onClick={() => open(flagged.id)}>Open in Course Studio</Button>
          </div>
        </div>
      )}

      {others.length > 0 && (
        <>
          {flagged && <Divider style={{ maxWidth: 640 }} />}
          <Eyebrow>{flagged ? "Your other subjects" : "Your subjects"}</Eyebrow>
          <div style={{ maxWidth: 640 }}>
            {others.map((id) => {
              const subject = s.subjects.find((x) => x.id === id);
              const note = bySubject.get(id);
              const flag = note?.annotation ?? "fine";
              return (
                <Row
                  key={id}
                  onClick={() => open(id)}
                  rail={flag === "fine" ? undefined : t.ochre}
                >
                  <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: t.petrol, width: 64 }}>{id}</span>
                  <span style={{ ...display, fontSize: 14, color: t.ink, flex: 1 }}>{subject?.title ?? id}</span>
                  <span style={{ ...display, fontSize: 13, color: t.muted, flex: 2 }}>{note?.detail}</span>
                </Row>
              );
            })}
          </div>
        </>
      )}
    </Page>
  );
}
