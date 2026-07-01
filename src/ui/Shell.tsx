// The app shell: a petrol nav rail filtered to the person's role, a calm header
// with the person switcher and the live notification badge, and the content area
// on the graph-paper canvas. The switcher and badge read from the same store the
// Inbox does, so a ping shows everywhere at once.

import type { ReactNode } from "react";
import { tokens as t } from "../theme.ts";
import { mono } from "./layout.tsx";
import { SignOutIcon } from "./icons.tsx";
import { SCREEN_META } from "./nav.tsx";
import type { Screen } from "../app/roles.ts";
import { navFor } from "../app/roles.ts";
import {
  dismissToast,
  logout,
  navigate,
  switchUser,
  unreadFor,
  useStore,
} from "../app/store.ts";

const ORG_LABEL: Record<string, string> = {
  management: "Management",
  department: "Department",
  academic: "Academic",
};

export function Shell({ children }: { children: ReactNode }) {
  const s = useStore();
  const person = s.people.find((p) => p.id === s.currentPersonId);
  if (!person) return null;
  const nav = navFor(person, s.assignments);
  const unread = unreadFor(person.id).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* nav rail */}
      <nav
        style={{
          width: 188,
          flexShrink: 0,
          background: t.petrol,
          color: t.cream,
          padding: "22px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ ...mono, fontSize: 14, fontWeight: 700, letterSpacing: "0.22em", padding: "4px 10px 18px" }}>LYCEUM</div>
        {nav.map((screen) => (
          <NavItem key={screen} screen={screen} active={s.screen === screen} badge={screen === "inbox" ? unread : 0} />
        ))}
        <div style={{ flex: 1 }} />
        <button
          data-demo-id="sign-out"
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "transparent",
            border: "none",
            color: "rgba(244,241,232,0.7)",
            cursor: "pointer",
            padding: "10px",
            ...mono,
            fontSize: 12,
          }}
        >
          <SignOutIcon size={18} /> Sign out
        </button>
      </nav>

      {/* main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header person={person} unread={unread} />
        <main style={{ padding: "28px 36px", flex: 1 }}>{children}</main>
        {s.toast && <Toast message={s.toast} />}
      </div>
    </div>
  );
}

function NavItem({ screen, active, badge }: { screen: Screen; active: boolean; badge: number }) {
  const meta = SCREEN_META[screen];
  const Icon = meta.icon;
  return (
    <button
      data-demo-id={`nav-${screen}`}
      onClick={() => navigate(screen)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 10px",
        borderRadius: t.radius,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "rgba(244,241,232,0.14)" : "transparent",
        color: active ? t.cream : "rgba(244,241,232,0.78)",
        ...mono,
        fontSize: 12.5,
        position: "relative",
      }}
    >
      <Icon size={18} />
      <span style={{ flex: 1 }}>{meta.label}</span>
      {badge > 0 && (
        <span style={{ background: t.ochre, color: t.ink, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{badge}</span>
      )}
    </button>
  );
}

function Header({ person, unread }: { person: { id: string; name: string; orgRole: string }; unread: number }) {
  const s = useStore();
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 36px",
        borderBottom: `1px solid ${t.line}`,
        background: "rgba(251,248,241,0.7)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div style={{ ...mono, fontSize: 11, color: t.muted, letterSpacing: "0.06em" }}>
        {SCREEN_META[s.screen]?.label}
      </div>
      <div style={{ flex: 1 }} />

      {/* person switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ ...mono, fontSize: 10, color: t.muted, marginRight: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Viewing as</span>
        {s.people.map((p) => {
          const active = p.id === person.id;
          return (
            <button
              key={p.id}
              data-demo-id={`switch-${p.id}`}
              onClick={() => switchUser(p.id)}
              title={`${p.name}, ${ORG_LABEL[p.orgRole]}`}
              style={{
                ...mono,
                fontSize: 11,
                padding: "5px 9px",
                borderRadius: t.radius,
                cursor: "pointer",
                border: `1px solid ${active ? t.petrol : t.line}`,
                background: active ? t.petrol : "transparent",
                color: active ? t.cream : t.muted,
              }}
            >
              {p.name.replace(/^(Dr|Prof|Ms|Mr) /, "")}
            </button>
          );
        })}
      </div>

      <div style={{ width: 1, height: 22, background: t.line, margin: "0 6px" }} />

      <button
        data-demo-id="notif-badge"
        onClick={() => navigate("inbox")}
        style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: t.ink, ...mono, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 8, background: unread > 0 ? t.ochre : t.line, display: "inline-block" }} />
        {unread > 0 ? `${unread} new` : "inbox"}
      </button>

      <div style={{ ...mono, fontSize: 10, color: t.muted }}>n 200 &middot; RASCH-1PL</div>
    </header>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <div
      onClick={dismissToast}
      style={{
        position: "fixed",
        bottom: 22,
        left: "50%",
        transform: "translateX(-50%)",
        background: t.petrol,
        color: t.cream,
        padding: "11px 18px",
        borderRadius: t.radius,
        ...mono,
        fontSize: 12,
        cursor: "pointer",
        boxShadow: "0 6px 24px rgba(33,31,26,0.18)",
        animation: "lypop .25s ease",
        zIndex: 50,
      }}
    >
      {message}
    </div>
  );
}
