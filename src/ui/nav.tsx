// Nav metadata: the label and line icon for each screen, plus a stable
// data-demo-id, used by the Shell rail and the self-driving demo.

import type { ReactNode } from "react";
import type { Screen } from "../app/roles.ts";
import {
  AcceptanceIcon,
  ApprovalIcon,
  AssignmentsIcon,
  CoursesIcon,
  DataRoomIcon,
  InboxIcon,
  NewSubjectIcon,
  OfficeIcon,
  ProgrammeIcon,
  StudioIcon,
  TrendsIcon,
  UploadIcon,
} from "./icons.tsx";

export const SCREEN_META: Record<Screen, { label: string; icon: (p: { size?: number }) => ReactNode }> = {
  login: { label: "Login", icon: OfficeIcon },
  trends: { label: "Trends", icon: TrendsIcon },
  approval: { label: "Approval", icon: ApprovalIcon },
  programme: { label: "Programme", icon: ProgrammeIcon },
  "new-subject": { label: "New subject", icon: NewSubjectIcon },
  assignments: { label: "Assignments", icon: AssignmentsIcon },
  courses: { label: "Courses", icon: CoursesIcon },
  studio: { label: "Course Studio", icon: StudioIcon },
  acceptance: { label: "Acceptance test", icon: AcceptanceIcon },
  inbox: { label: "Inbox", icon: InboxIcon },
  upload: { label: "Upload", icon: UploadIcon },
  backtest: { label: "Closed loop", icon: AcceptanceIcon },
  dataroom: { label: "Data room", icon: DataRoomIcon },
  office: { label: "Office", icon: OfficeIcon },
};
