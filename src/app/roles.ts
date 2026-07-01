// Roles and permissions (spec Section 2). The org tier is on the Person
// (management / department / academic); the subject hats (coordinator /
// lecturer) are looked up per (person x subject) in the RoleAssignment table. A
// person who holds both hats on a subject gets the union. Every page and action
// resolves against the table below.
//
//  Capability                 | Mgmt | Dept | Coordinator(subj) | Lecturer(subj)
//  See programme trends       | all  | own  | own subjects      | no
//  See course list by year    | read | own  | own subjects      | own subjects
//  Create a new subject       | no   | yes  | no                | no
//  Assign hats to subjects    | no   | yes  | no                | no
//  Upload results             | no   | no   | yes               | yes
//  Draft a change             | no   | no   | yes               | yes
//  Review a lecturer's draft  | no   | no   | yes               | no
//  Run the acceptance test    | no   | no   | yes               | proposes (runs)
//  Approve / reject a change  | yes  | no   | no                | no

import type { Hat, Person, RoleAssignment, SubjectId } from "../types.ts";

export type Screen =
  | "login"
  | "trends"
  | "approval"
  | "programme"
  | "new-subject"
  | "assignments"
  | "courses"
  | "studio"
  | "acceptance"
  | "inbox"
  | "upload"
  | "backtest"
  | "dataroom"
  | "office";

export type Capability =
  | "see-trends"
  | "see-courses"
  | "create-subject"
  | "assign-hats"
  | "upload-results"
  | "draft-change"
  | "review-draft"
  | "run-test"
  | "approve";

/** All hats a person holds on a subject (0, 1, or 2). */
export function hatsOn(
  personId: string,
  subjectId: SubjectId,
  assignments: RoleAssignment[],
): Hat[] {
  return assignments
    .filter((a) => a.personId === personId && a.subjectId === subjectId)
    .map((a) => a.hat);
}

/** Distinct subjects where the person holds any hat. */
export function subjectsForPerson(personId: string, assignments: RoleAssignment[]): SubjectId[] {
  const out: SubjectId[] = [];
  for (const a of assignments) {
    if (a.personId === personId && !out.includes(a.subjectId)) out.push(a.subjectId);
  }
  return out;
}

export function isCoordinatorAnywhere(personId: string, assignments: RoleAssignment[]): boolean {
  return assignments.some((a) => a.personId === personId && a.hat === "coordinator");
}

export function isLecturerAnywhere(personId: string, assignments: RoleAssignment[]): boolean {
  return assignments.some((a) => a.personId === personId && a.hat === "lecturer");
}

/** Resolve a capability, optionally scoped to a subject. Subject-scoped
 *  capabilities (upload, draft, review, run-test, see-courses) require the right
 *  hat on THAT subject; global ones (trends, create-subject, assign-hats,
 *  approve) depend only on the org tier. */
export function can(
  person: Person,
  capability: Capability,
  ctx: { subjectId?: SubjectId; assignments: RoleAssignment[] },
): boolean {
  const { subjectId, assignments } = ctx;
  const hats = subjectId ? hatsOn(person.id, subjectId, assignments) : [];
  const isCoordHere = hats.includes("coordinator");
  const isLecturerHere = hats.includes("lecturer");

  switch (capability) {
    case "see-trends":
      // Management sees all; coordinators see their own subjects; lecturers no.
      if (person.orgRole === "management") return true;
      if (person.orgRole === "department") return true;
      return isCoordinatorAnywhere(person.id, assignments);
    case "see-courses":
      if (person.orgRole === "management" || person.orgRole === "department") return true;
      return subjectsForPerson(person.id, assignments).length > 0;
    case "create-subject":
      return person.orgRole === "department";
    case "assign-hats":
      return person.orgRole === "department";
    case "upload-results":
      return person.orgRole === "academic" && (isCoordHere || isLecturerHere);
    case "draft-change":
      return person.orgRole === "academic" && (isCoordHere || isLecturerHere);
    case "review-draft":
      // Only a coordinator reviews a lecturer's draft.
      return person.orgRole === "academic" && isCoordHere;
    case "run-test":
      // Coordinator runs directly; a lecturer proposes and the test runs for them.
      return person.orgRole === "academic" && (isCoordHere || isLecturerHere);
    case "approve":
      return person.orgRole === "management";
    default:
      return false;
  }
}

/** The nav items a person sees, in order. Shared screens (Office, Data room) are
 *  appended for everyone. Academics get the union of their hats' screens. */
export function navFor(person: Person, assignments: RoleAssignment[]): Screen[] {
  // The closed loop, the office and the data room are shared: the prediction
  // ledger and the evidence layer are cross-cutting, not role-specific.
  const shared: Screen[] = ["backtest", "office", "dataroom"];
  if (person.orgRole === "management") {
    return ["trends", "approval", ...shared];
  }
  if (person.orgRole === "department") {
    return ["programme", "new-subject", "assignments", "trends", ...shared];
  }
  // academic: union of coordinator + lecturer screens
  const nav: Screen[] = [];
  const isCoord = isCoordinatorAnywhere(person.id, assignments);
  const isLect = isLecturerAnywhere(person.id, assignments);
  if (isLect) nav.push("upload");
  nav.push("inbox", "courses", "studio");
  if (isCoord || isLect) nav.push("acceptance");
  // A coordinator is entitled to see programme trends for their own subjects
  // (Section 2), so surface the screen they can reach.
  if (isCoord) nav.push("trends");
  return [...nav, ...shared];
}

/** The screen a person lands on after login. */
export function landingScreen(person: Person, assignments: RoleAssignment[]): Screen {
  return navFor(person, assignments)[0] ?? "office";
}

/** Does this person's nav include the screen? */
export function navAllows(person: Person, assignments: RoleAssignment[], screen: Screen): boolean {
  return screen === "login" || navFor(person, assignments).includes(screen);
}
