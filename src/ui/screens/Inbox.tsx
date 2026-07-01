// Inbox (spec Section 4, Section 6): the pings that route work to a person. The
// focal point is the most recent ping, shown large with one primary action,
// "Open the subject." Older pings sit underneath as quiet, compact rows. Calm at
// rest: read top to bottom like a short list of messages, not a grid of cards.

import type { NotificationKind } from "../../types.ts";
import { tokens as t } from "../../theme.ts";
import { Page, PageHead, mono, display, Divider, Row } from "../layout.tsx";
import { Button } from "../primitives.tsx";
import { inboxFor, openNotification, useStore } from "../../app/store.ts";

// A human line per ping kind (the headline the reader sees first).
const KIND_LINE: Record<NotificationKind, string> = {
  "ping-update": "A subject is drifting from demand",
  "ping-new-subject": "A new subject needs scoping",
  "review-request": "A review is requested",
  "test-done": "An acceptance test finished",
  approved: "A change was approved",
  rejected: "A change was returned",
};

// A short tag word per kind, for the quiet rows.
const KIND_TAG: Record<NotificationKind, string> = {
  "ping-update": "drift",
  "ping-new-subject": "new subject",
  "review-request": "review",
  "test-done": "tested",
  approved: "approved",
  rejected: "returned",
};

export function InboxScreen() {
  const s = useStore();
  const person = s.people.find((p) => p.id === s.currentPersonId)!;
  const items = inboxFor(person.id);
  const top = items[0];

  return (
    <Page>
      <PageHead
        eyebrow={`Inbox · ${person.name}`}
        title="Pings"
        lead="The agents route work to you here. The newest ping is up top, with one thing to do: open the subject. Everything older is a quiet line you can pick up when you want."
      />

      {!top ? (
        <p style={{ ...display, fontSize: 15, color: t.muted, maxWidth: 520 }}>No pings right now.</p>
      ) : (
        <>
          {/* the focal ping: the most recent, shown large */}
          <div style={{ maxWidth: 620 }}>
            {!top.read && (
              <div style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: t.ochre, marginBottom: 12 }}>
                Unread
              </div>
            )}
            <h2 style={{ ...display, fontWeight: 600, fontSize: 22, lineHeight: 1.2, color: t.ink, margin: 0 }}>
              {KIND_LINE[top.kind]}
            </h2>
            {top.subjectId && (
              <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: t.petrol, marginTop: 10 }}>
                {top.subjectId} {s.subjects.find((x) => x.id === top.subjectId)?.title ?? ""}
              </div>
            )}
            {top.agentFindings && (
              <p style={{ ...display, fontSize: 15, lineHeight: 1.55, color: t.muted, margin: "12px 0 0" }}>
                {top.agentFindings}
              </p>
            )}
            <div style={{ marginTop: 20 }}>
              <Button data-demo-id="open-notif" onClick={() => openNotification(top.id)}>
                Open
              </Button>
            </div>
          </div>

          {items.length > 1 && (
            <>
              <Divider style={{ maxWidth: 620, margin: "32px 0 8px" }} />
              <div style={{ maxWidth: 620 }}>
                {items.slice(1).map((n) => (
                  <Row key={n.id} onClick={() => openNotification(n.id)}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: n.read ? t.line : t.ochre,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ ...display, fontSize: 14, color: t.ink, flex: 1 }}>{KIND_LINE[n.kind]}</span>
                    {n.subjectId && (
                      <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: t.petrol }}>{n.subjectId}</span>
                    )}
                    <span style={{ ...mono, fontSize: 11, color: t.muted, width: 88, textAlign: "right" }}>
                      {KIND_TAG[n.kind]}
                    </span>
                  </Row>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Page>
  );
}
