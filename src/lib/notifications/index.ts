/**
 * ILALI notification state machine — Painless Journeys Phase 3 (FR-6).
 *
 * `sendNotification(userId, type, payload)` is THE single entry point for
 * every triggered notification (welcome is handled separately by the Phase 1
 * auth hook). Contract:
 *
 *  - DEDUPE: one event per trigger. An identical (userId + type + payload)
 *    pending/sent event within the dedupe window suppresses a re-send.
 *  - CHANNEL ABSTRACTION: email today; the `channel` column + the
 *    WHATSAPP_NOTIFY_ENABLED flag keep WhatsApp pluggable with zero call-site
 *    changes (no WhatsApp implementation yet — those calls record `skipped`).
 *  - NEVER THROWS: every failure is logged and recorded on the event row
 *    (status pending/sent/failed/skipped) so the caller's flow never breaks.
 *    A missing RESEND_API_KEY degrades to `skipped` via the mail wrapper.
 *  - PREF GATES: non-essential triggers (bookings, reminders, digests) respect
 *    the per-user notificationPreferences toggles; transactional triggers
 *    (saved, provider-status, first-booking) always send.
 *  - AUDIT: every event gets a `notification_events` row.
 */
import { db } from "@/lib/db/index";
import {
  notificationEvents,
  notificationPreferences,
  users,
} from "@/lib/db/schema";
import { and, eq, gte, or } from "drizzle-orm";
import { sendEmail } from "@/lib/mail/index";
import {
  renderNotificationEmail,
  type NotificationPayload,
  type NotificationType,
} from "@/lib/mail/templates";

export type { NotificationPayload, NotificationType };

export type SendNotificationResult =
  | { status: "sent"; eventId: number }
  | { status: "skipped"; eventId: number | null; reason: string }
  | { status: "failed"; eventId: number | null; reason: string };

export interface SendNotificationOptions {
  /** Force a channel ("email" | "whatsapp"). Defaults to the env flag. */
  channel?: string;
  /** Dedupe window in ms for identical events. Default: 24h. */
  dedupeWindowMs?: number;
}

/** Default dedupe window — the same trigger within 24h is a duplicate. */
export const DEFAULT_DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

// ── Preference gates (FR-6: parents can mute non-essential triggers) ──
type PrefKey = "notifyBookings" | "notifyReminders" | "notifyDigest";

const PREF_BY_TYPE: Partial<Record<NotificationType, PrefKey>> = {
  "booking-confirmed": "notifyBookings",
  "reminder-24h": "notifyReminders",
  "review-nudge": "notifyReminders",
  "digest-weekly": "notifyDigest",
  "digest-monthly": "notifyDigest",
};

// ── Stable payload key (sorted keys → "identical" is order-insensitive) ──

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      out[key] = sortKeys(record[key]);
    }
    return out;
  }
  return value;
}

function payloadKey(payload: unknown): string {
  try {
    return JSON.stringify(sortKeys(payload ?? {}));
  } catch {
    return String(payload ?? {});
  }
}

// ── Channel resolution ──

function resolveChannel(opts: SendNotificationOptions): string {
  if (opts.channel) return opts.channel;
  return process.env.WHATSAPP_NOTIFY_ENABLED === "true" ? "whatsapp" : "email";
}

// ── Queries ──

async function findRecentDuplicate(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
  windowMs: number
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMs);
    const rows = await db
      .select({
        payload: notificationEvents.payload,
        status: notificationEvents.status,
      })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, userId),
          eq(notificationEvents.type, type),
          or(
            eq(notificationEvents.status, "pending"),
            eq(notificationEvents.status, "sent")
          ),
          gte(notificationEvents.createdAt, since)
        )
      );
    const key = payloadKey(payload);
    return rows.some((row) => payloadKey(row.payload) === key);
  } catch (e) {
    console.warn("[notifications] dedupe check failed — proceeding:", e);
    return false;
  }
}

async function findUserEmail(userId: string): Promise<string | null> {
  try {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user?.email ?? null;
  } catch (e) {
    console.warn("[notifications] user lookup failed:", e);
    return null;
  }
}

async function isMuted(userId: string, type: NotificationType): Promise<boolean> {
  const prefKey = PREF_BY_TYPE[type];
  if (!prefKey) return false; // transactional — always send
  try {
    const [row] = await db
      .select({ pref: notificationPreferences[prefKey] })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);
    // Missing row = defaults (true = enabled) → not muted.
    return row?.pref === false;
  } catch (e) {
    console.warn("[notifications] prefs lookup failed — sending:", e);
    return false;
  }
}

function insertEvent(
  userId: string,
  type: NotificationType,
  channel: string,
  payload: NotificationPayload,
  status: string,
  extra: { scheduledFor?: Date; sentAt?: Date } = {}
) {
  return db
    .insert(notificationEvents)
    .values({
      userId,
      type,
      channel,
      payload,
      status,
      ...(extra.scheduledFor ? { scheduledFor: extra.scheduledFor } : {}),
      ...(extra.sentAt ? { sentAt: extra.sentAt } : {}),
    })
    .returning({ id: notificationEvents.id });
}

// ── Main entry point ──

/**
 * Fire a notification for a trigger. Never throws — the caller's flow is
 * always safe. Returns the outcome so callers can log if they want to.
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload = {},
  opts: SendNotificationOptions = {}
): Promise<SendNotificationResult> {
  const channel = resolveChannel(opts);
  const dedupeWindowMs = opts.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;

  // WhatsApp is a Tier 2 placeholder — record the intent as skipped, never
  // pretend to send. This branch disappears when the WhatsApp impl lands.
  if (channel !== "email") {
    console.warn(`[notifications] channel "${channel}" not implemented — skipping ${type}`);
    try {
      const [row] = await insertEvent(userId, type, channel, payload, "skipped");
      return { status: "skipped", eventId: row.id, reason: `Channel "${channel}" not implemented` };
    } catch (e) {
      console.warn("[notifications] failed to record skipped event:", e);
      return { status: "skipped", eventId: null, reason: `Channel "${channel}" not implemented` };
    }
  }

  try {
    // 1. Dedupe — the same trigger must only send once.
    if (await findRecentDuplicate(userId, type, payload, dedupeWindowMs)) {
      return {
        status: "skipped",
        eventId: null,
        reason: "Duplicate notification already pending/sent",
      };
    }

    // 2. We need a real user with an email to send to.
    const email = await findUserEmail(userId);
    if (!email) {
      console.warn(`[notifications] no user/email for ${userId} — skipping ${type}`);
      try {
        const [row] = await insertEvent(userId, type, channel, payload, "failed");
        return { status: "failed", eventId: row.id, reason: "User or email not found" };
      } catch {
        return { status: "failed", eventId: null, reason: "User or email not found" };
      }
    }

    // 3. Respect the user's preferences for non-essential triggers.
    if (await isMuted(userId, type)) {
      try {
        const [row] = await insertEvent(userId, type, channel, payload, "skipped");
        return {
          status: "skipped",
          eventId: row.id,
          reason: "Disabled in notification preferences",
        };
      } catch {
        return { status: "skipped", eventId: null, reason: "Disabled in notification preferences" };
      }
    }

    // 4. Render the human copy (defensive — never "undefined" in an email).
    const rendered = renderNotificationEmail(type, payload);
    if (!rendered) {
      console.warn(`[notifications] no template for type "${type}"`);
      try {
        const [row] = await insertEvent(userId, type, channel, payload, "failed");
        return { status: "failed", eventId: row.id, reason: `No template for type "${type}"` };
      } catch {
        return { status: "failed", eventId: null, reason: `No template for type "${type}"` };
      }
    }

    // 5. Audit row (pending) → send → mark terminal state.
    const [event] = await insertEvent(userId, type, channel, payload, "pending");
    const result = await sendEmail({
      to: email,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });

    if ("skipped" in result) {
      await db
        .update(notificationEvents)
        .set({ status: "skipped" })
        .where(eq(notificationEvents.id, event.id));
      return {
        status: "skipped",
        eventId: event.id,
        reason: "Email skipped (no mail key configured)",
      };
    }

    if (result.sent) {
      await db
        .update(notificationEvents)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(notificationEvents.id, event.id));
      return { status: "sent", eventId: event.id };
    }

    await db
      .update(notificationEvents)
      .set({ status: "failed" })
      .where(eq(notificationEvents.id, event.id));
    return { status: "failed", eventId: event.id, reason: result.error };
  } catch (e) {
    console.warn(`[notifications] sendNotification(${type}) failed:`, e);
    try {
      const [row] = await insertEvent(userId, type, channel, payload, "failed");
      return {
        status: "failed",
        eventId: row.id,
        reason: e instanceof Error ? e.message : String(e),
      };
    } catch {
      return {
        status: "failed",
        eventId: null,
        reason: e instanceof Error ? e.message : String(e),
      };
    }
  }
}

// ── Idempotency helper for cron jobs ──

/**
 * True when this user already has a `sent` event of this type within the
 * window. Cron jobs call this before enqueueing digests/reminders so running
 * the route twice can never double-send.
 */
export async function hasSentRecently(
  userId: string,
  type: NotificationType,
  windowMs: number
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowMs);
    const [row] = await db
      .select({ id: notificationEvents.id })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, userId),
          eq(notificationEvents.type, type),
          eq(notificationEvents.status, "sent"),
          gte(notificationEvents.sentAt, since)
        )
      )
      .limit(1);
    return !!row;
  } catch (e) {
    console.warn("[notifications] hasSentRecently failed:", e);
    return false;
  }
}

// ── Batch (cron entry point) ──

export interface NotificationBatchItem {
  userId: string;
  type: NotificationType;
  payload?: NotificationPayload;
}

export interface NotificationBatchResult {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Send a batch of notifications (used by the journeys cron). Each item is
 * independent — one failure never stops the rest, and this never throws.
 */
export async function sendNotificationBatch(
  items: NotificationBatchItem[]
): Promise<NotificationBatchResult> {
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await sendNotification(item.userId, item.type, item.payload ?? {});
      if (result.status === "sent") sent += 1;
      else if (result.status === "skipped") skipped += 1;
      else failed += 1;
    } catch (e) {
      failed += 1;
      console.warn(`[notifications] batch item failed for user ${item.userId}:`, e);
    }
  }

  return { total: items.length, sent, skipped, failed };
}

// ── WS-6 stubs ──
// These fire on booking lifecycles. There is no booking/enquiry record TODAY
// (booking lands with Paystack online booking, WS-6), so they are NOT wired
// anywhere yet — the templates + service functions exist and the TODO comments
// mark exactly where the wiring goes when the booking table ships.

export async function sendBookingConfirmed(params: {
  userId: string;
  providerName?: string;
  activityName?: string;
  childName?: string;
  date?: string;
  time?: string;
  location?: string;
  link?: string;
}): Promise<SendNotificationResult> {
  // TODO(WS-6): call from the booking-created path (Paystack webhook / order
  // confirm) once a booking record exists.
  return sendNotification(params.userId, "booking-confirmed", {
    providerName: params.providerName,
    activityName: params.activityName,
    childName: params.childName,
    date: params.date,
    time: params.time,
    location: params.location,
    link: params.link,
  });
}

export async function sendReviewNudge(params: {
  userId: string;
  providerName?: string;
  activityName?: string;
  childName?: string;
  link?: string;
}): Promise<SendNotificationResult> {
  // TODO(WS-6): fire ~24-48h after the booked session ends (needs the booking
  // record + an end time to schedule against).
  return sendNotification(params.userId, "review-nudge", {
    providerName: params.providerName,
    activityName: params.activityName,
    childName: params.childName,
    link: params.link,
  });
}

export async function sendFirstBooking(params: {
  userId: string;
  providerName?: string;
  activityName?: string;
  childName?: string;
  date?: string;
  link?: string;
}): Promise<SendNotificationResult> {
  // TODO(WS-6): fire when the provider's very first confirmed booking lands.
  return sendNotification(params.userId, "first-booking", {
    providerName: params.providerName,
    activityName: params.activityName,
    childName: params.childName,
    date: params.date,
    link: params.link,
  });
}
