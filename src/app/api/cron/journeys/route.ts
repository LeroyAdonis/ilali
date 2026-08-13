import { NextResponse } from "next/server";
import { and, eq, gte, gt, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/index";
import {
  authSessions,
  clubEvents,
  clubMemberships,
  providers,
  providerInquiries,
  reviews,
  users,
} from "@/lib/db/schema";
import {
  hasSentRecently,
  sendNotificationBatch,
  type NotificationBatchResult,
} from "@/lib/notifications";
import { appUrl } from "@/lib/mail";
import { formatEventTime } from "@/lib/club-format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Date helpers (no date lib in deps — small, local) ──

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ── CRON_SECRET guard ──

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return bufA.length === 0 || bufA.equals(bufB);
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("cronSecret");
  if (querySecret && safeEqual(querySecret, secret)) return true;

  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) {
    return safeEqual(authorization.slice("Bearer ".length), secret);
  }

  return false;
}

// ── Job: reminders-24h ──
// No booking table yet (lands with Paystack, WS-6) — this queries what exists:
// club events starting tomorrow → remind the active club members' parents.

async function runReminders24h(): Promise<NotificationBatchResult> {
  const tomorrowStart = startOfDay(addDays(new Date(), 1));
  const tomorrowEnd = addDays(tomorrowStart, 1);

  const events = await db
    .select()
    .from(clubEvents)
    .where(
      and(gte(clubEvents.startTime, tomorrowStart), lte(clubEvents.startTime, tomorrowEnd))
    );

  if (events.length === 0) {
    return { total: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const providerIds = [...new Set(events.map((e) => e.providerId))];
  const providerRows = await db
    .select({ id: providers.id, name: providers.name, slug: providers.slug })
    .from(providers)
    .where(inArray(providers.id, providerIds));
  const providerById = new Map(providerRows.map((p) => [p.id, p]));

  const memberships = await db
    .select({ parentId: clubMemberships.parentId, providerId: clubMemberships.providerId })
    .from(clubMemberships)
    .where(
      and(inArray(clubMemberships.providerId, providerIds), eq(clubMemberships.status, "active"))
    );

  const items: Array<{ userId: string; payload: Record<string, unknown> }> = [];
  for (const event of events) {
    const provider = providerById.get(event.providerId);
    const link = provider ? `${appUrl()}/clubs/${provider.slug}` : `${appUrl()}/clubs`;
    for (const membership of memberships) {
      if (membership.providerId !== event.providerId) continue;
      // No parent-wide guard here: sendNotification's payload-aware dedupe
      // (payload includes eventId) prevents same-event double-sends, while a
      // parent with back-to-back events must get a reminder for EACH one.
      items.push({
        userId: membership.parentId,
        payload: {
          activityName: event.title,
          providerName: provider?.name,
          date: formatDate(event.startTime),
          time: formatEventTime(event.startTime),
          location: event.location ?? undefined,
          eventId: event.id,
          link,
        },
      });
    }
  }

  const itemsWithType = items.map((item) => ({ ...item, type: "reminder-24h" as const }));
  return sendNotificationBatch(itemsWithType);
}

// ── Job: digest-weekly ──
// Providers who saw real activity in the last 7 days (enquiries + reviews).
// Bookings are 0 until Paystack lands (WS-6).

async function runDigestWeekly(): Promise<NotificationBatchResult> {
  const since = new Date(Date.now() - 7 * DAY_MS);

  const [inquiryRows, reviewRows] = await Promise.all([
    db
      .select({
        providerId: providerInquiries.providerId,
        count: sql<number>`count(*)::int`,
      })
      .from(providerInquiries)
      .where(gte(providerInquiries.matchedAt, since))
      .groupBy(providerInquiries.providerId),
    db
      .select({ providerId: reviews.providerId })
      .from(reviews)
      .where(and(gte(reviews.createdAt, since), isNotNull(reviews.providerId)))
      .groupBy(reviews.providerId),
  ]);

  const activeProviderIds = new Set([
    ...inquiryRows.map((r) => r.providerId),
    ...reviewRows.map((r) => r.providerId),
  ]);

  if (activeProviderIds.size === 0) {
    return { total: 0, sent: 0, skipped: 0, failed: 0 };
  }

  // reviews.providerId is a nullable FK — drop nulls before inArray.
  const activeProviderIdValues = [...activeProviderIds].filter(
    (id): id is string => id !== null
  );

  const providerRows = await db
    .select({ id: providers.id, name: providers.name, userId: providers.userId })
    .from(providers)
    .where(inArray(providers.id, activeProviderIdValues));

  const enquiryCount = new Map(inquiryRows.map((r) => [r.providerId, r.count]));

  const items: Array<{
    userId: string;
    type: "digest-weekly";
    payload: Record<string, unknown>;
  }> = [];

  for (const provider of providerRows) {
    // Provider must have an account to notify; no account → nothing to send.
    if (!provider.userId) continue;
    if (await hasSentRecently(provider.userId, "digest-weekly", 7 * DAY_MS)) continue;
    const enquiries = enquiryCount.get(provider.id) ?? 0;
    items.push({
      userId: provider.userId,
      type: "digest-weekly",
      payload: {
        providerName: provider.name,
        views: "0",
        enquiries: String(enquiries),
        bookings: "0",
        link: `${appUrl()}/provider`,
      },
    });
  }

  return sendNotificationBatch(items);
}

// ── Job: digest-monthly ──
// Parents signed up > 30 days ago who are still active (have an unexpired
// session). Sent at most once per ~month (idempotent via sent rows).

async function runDigestMonthly(): Promise<NotificationBatchResult> {
  const cutoff = new Date(Date.now() - 30 * DAY_MS);

  const [parents, sessionRows] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, suburb: users.suburb })
      .from(users)
      .where(and(eq(users.role, "parent"), lte(users.createdAt, cutoff))),
    db
      .select({ userId: authSessions.userId })
      .from(authSessions)
      .where(gt(authSessions.expiresAt, new Date())),
  ]);

  const activeIds = new Set(sessionRows.map((s) => s.userId));

  const items: Array<{
    userId: string;
    type: "digest-monthly";
    payload: Record<string, unknown>;
  }> = [];

  for (const parent of parents) {
    if (!activeIds.has(parent.id)) continue; // "still active" gate
    if (await hasSentRecently(parent.id, "digest-monthly", 30 * DAY_MS)) continue;
    items.push({
      userId: parent.id,
      type: "digest-monthly",
      payload: {
        parentName: parent.name,
        suburb: parent.suburb ?? undefined,
        link: `${appUrl()}/browse`,
      },
    });
  }

  return sendNotificationBatch(items);
}

// ── Handler ──

interface JobDef {
  name: string;
  run: () => Promise<NotificationBatchResult>;
  /** Gate for the daily pass. UTC-based — the cron fires at 06:00 UTC. */
  runsOn: (date: Date) => boolean;
}

const JOBS: Record<string, JobDef> = {
  "reminders-24h": { name: "reminders-24h", run: runReminders24h, runsOn: () => true },
  "digest-weekly": { name: "digest-weekly", run: runDigestWeekly, runsOn: (d) => d.getUTCDay() === 1 },
  "digest-monthly": { name: "digest-monthly", run: runDigestMonthly, runsOn: (d) => d.getUTCDate() === 1 },
};

/** Run one job, isolated: a failure is reported, never thrown up. */
async function runJobSafely(
  job: JobDef
): Promise<{ ok: true; batch: NotificationBatchResult } | { ok: false; error: string }> {
  try {
    return { ok: true, batch: await job.run() };
  } catch (e) {
    console.error(`[cron/journeys] ${job.name} failed:`, e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * GET /api/cron/journeys?job=reminders-24h|digest-weekly|digest-monthly
 * Guarded by CRON_SECRET (query param `cronSecret` or `Authorization: Bearer`).
 * Without a job param it runs the daily pass: reminders every day,
 * digest-weekly on Mondays, digest-monthly on the 1st of the month.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = new URL(request.url).searchParams.get("job");

  if (job) {
    const def = JOBS[job];
    if (!def) {
      return NextResponse.json({ error: `Unknown job "${job}"` }, { status: 400 });
    }
    const result = await runJobSafely(def);
    return NextResponse.json(
      result.ok ? { ok: true, job, batch: result.batch } : { ok: false, job, error: result.error },
      { status: result.ok ? 200 : 500 }
    );
  }

  // Daily pass: every job whose gate says "today", isolated so one failure
  // never starves the day's other jobs.
  const today = new Date();
  const dueJobs = Object.values(JOBS).filter((j) => j.runsOn(today));
  const results = await Promise.all(dueJobs.map((j) => runJobSafely(j)));
  const jobs = Object.fromEntries(dueJobs.map((j, i) => [j.name, results[i]]));
  const anyFailed = results.some((r) => !r.ok);
  return NextResponse.json({ ok: !anyFailed, jobs }, { status: anyFailed ? 500 : 200 });
}
