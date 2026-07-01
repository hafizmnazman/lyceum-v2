// Top-level router. No person -> Login; otherwise the Shell wraps the active
// screen. The self-driving demo overlay (stage 10) sits above everything so it
// can drive the real UI. All state lives in the store; screens are thin.

import { useStore } from "./app/store.ts";
import { Shell } from "./ui/Shell.tsx";
import { Login } from "./ui/screens/Login.tsx";
import { Upload } from "./ui/screens/Upload.tsx";
import { TrendsScreen } from "./ui/screens/Trends.tsx";
import { ApprovalScreen } from "./ui/screens/Approval.tsx";
import { ProgrammeScreen } from "./ui/screens/Programme.tsx";
import { NewSubjectScreen } from "./ui/screens/NewSubject.tsx";
import { AssignmentsScreen } from "./ui/screens/Assignments.tsx";
import { CoursesScreen } from "./ui/screens/Courses.tsx";
import { StudioScreen } from "./ui/screens/Studio.tsx";
import { AcceptanceScreen } from "./ui/screens/Acceptance.tsx";
import { InboxScreen } from "./ui/screens/Inbox.tsx";
import { BacktestScreen } from "./ui/screens/Backtest.tsx";
import { DataRoomScreen } from "./ui/screens/DataRoom.tsx";
import { OfficeScreen } from "./ui/screens/Office.tsx";
import { DemoOverlay } from "./demo/DemoOverlay.tsx";

export function App() {
  const s = useStore();

  if (!s.currentPersonId) {
    return (
      <>
        <Login />
        <DemoOverlay />
      </>
    );
  }

  return (
    <>
      <Shell>
        {s.screen === "upload" && <Upload />}
        {s.screen === "trends" && <TrendsScreen />}
        {s.screen === "approval" && <ApprovalScreen />}
        {s.screen === "programme" && <ProgrammeScreen />}
        {s.screen === "new-subject" && <NewSubjectScreen />}
        {s.screen === "assignments" && <AssignmentsScreen />}
        {s.screen === "courses" && <CoursesScreen />}
        {s.screen === "studio" && <StudioScreen />}
        {s.screen === "acceptance" && <AcceptanceScreen />}
        {s.screen === "inbox" && <InboxScreen />}
        {s.screen === "backtest" && <BacktestScreen />}
        {s.screen === "dataroom" && <DataRoomScreen />}
        {s.screen === "office" && <OfficeScreen />}
      </Shell>
      <DemoOverlay />
    </>
  );
}
