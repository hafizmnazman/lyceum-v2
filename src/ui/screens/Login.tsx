// Login (spec Section 4): not bare buttons. The Lyceum identity is the focal
// point, left-aligned with room around it; the role picker is a short list of the
// demo people as restrained rows (name, role, scope). Picking one sets the org
// role and loads that person's subject hats. A quiet instrument footer.

import { tokens as t } from "../../theme.ts";
import { mono, display } from "../layout.tsx";
import { login, useStore } from "../../app/store.ts";
import { subjectsForPerson, hatsOn } from "../../app/roles.ts";
import type { Person, RoleAssignment } from "../../types.ts";

const ORG: Record<string, string> = { management: "Management", department: "Department", academic: "Academic" };

function scopeLine(person: Person, assignments: RoleAssignment[], deptTitle: string): string {
  if (person.orgRole === "management") return "Whole portfolio, all programmes";
  if (person.orgRole === "department") return deptTitle;
  const subs = subjectsForPerson(person.id, assignments);
  return subs
    .map((sid) => {
      const hats = hatsOn(person.id, sid, assignments);
      const label = hats.length === 2 ? "both hats" : hats[0];
      return `${sid} (${label})`;
    })
    .join(", ");
}

function roleLine(person: Person, assignments: RoleAssignment[]): string {
  if (person.orgRole !== "academic") return ORG[person.orgRole];
  const hats = new Set(assignments.filter((a) => a.personId === person.id).map((a) => a.hat));
  if (hats.has("coordinator") && hats.has("lecturer")) return "Coordinator and Lecturer";
  if (hats.has("coordinator")) return "Coordinator";
  return "Lecturer";
}

export function Login() {
  const s = useStore();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "40px 8vw" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 72, width: "100%", maxWidth: 1080, alignItems: "center" }}>
        {/* identity, the focal point */}
        <div>
          <div style={{ ...mono, fontSize: 17, fontWeight: 700, letterSpacing: "0.26em", color: t.petrol }}>LYCEUM</div>
          <h1 style={{ ...display, fontWeight: 600, fontSize: 34, lineHeight: 1.18, color: t.ink, margin: "26px 0 0", maxWidth: 460 }}>
            Stress-test a curriculum change before you commit, grounded in your real cohort.
          </h1>
          <p style={{ ...display, fontSize: 15, lineHeight: 1.6, color: t.muted, margin: "20px 0 0", maxWidth: 440 }}>
            Built on the CLO mastery survey and real results. A measured cohort, not roleplay.
          </p>
        </div>

        {/* role picker */}
        <div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: t.muted, marginBottom: 16 }}>
            Sign in as
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {s.people.map((p, i) => (
              <button
                key={p.id}
                data-demo-id={`login-${p.id}`}
                onClick={() => login(p.id)}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 4px",
                  background: "transparent",
                  border: "none",
                  borderTop: i === 0 ? `1px solid ${t.line}` : "none",
                  borderBottom: `1px solid ${t.line}`,
                  cursor: "pointer",
                  textAlign: "left",
                  color: t.ink,
                }}
              >
                <div>
                  <div style={{ ...display, fontWeight: 600, fontSize: 16 }}>{p.name}</div>
                  <div style={{ ...mono, fontSize: 11, color: t.muted, marginTop: 5 }}>{roleLine(p, s.assignments)}</div>
                </div>
                <div style={{ ...mono, fontSize: 10.5, color: t.muted, maxWidth: 200, textAlign: "right" }}>
                  {scopeLine(p, s.assignments, s.programme.title)}
                </div>
              </button>
            ))}
          </div>
          <div style={{ ...mono, fontSize: 10, lineHeight: 1.6, color: "#8C867A", marginTop: 22 }}>
            build 2026.07 &middot; model RASCH-1PL &middot; fixtures, seeded &middot; session not authenticated
          </div>
        </div>
      </div>
    </div>
  );
}
