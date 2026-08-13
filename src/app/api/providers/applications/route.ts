import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providerApplications, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  WIZARD_COLUMN_MAP,
  WIZARD_STEP_SCHEMAS,
  wizardToApplicationRow,
} from "@/lib/validations";
import { sendProviderStatusNotification } from "@/lib/notifications";

/**
 * Provider self-onboarding wizard (Painless Journeys Phase 4, T024/T025).
 *
 * GET  /api/providers/applications  — the signed-in user's draft (resume).
 * POST /api/providers/applications  — upsert wizard state; `submitted: true`
 *       turns the draft into a real pending application (status → 'pending'),
 *       flips the user's role to 'provider', and fires the provider-status
 *       "submitted" notification.
 *
 * Auth: session (the provider signed in via magic link). No admin gate — this
 * is the self-serve path. Applications created here carry userId + onboardSource
 * 'wizard' so the admin approval flow knows to skip temp-password creation.
 */

async function requireUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return { user: null, response: NextResponse.json({ error: "Sign in first to save your draft" }, { status: 401 }) };
  }
  return { user: session.user as { id: string; email: string }, response: null };
}

function columnValues(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    const column = WIZARD_COLUMN_MAP[key];
    if (!column) continue;
    out[column] = typeof value === "string" && value.trim() === "" ? null : value;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  const [application] = await db
    .select()
    .from(providerApplications)
    .where(eq(providerApplications.userId, user!.id))
    .limit(1);

  return NextResponse.json({ application: application ?? null });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (response) return response;

  let body: { fields?: Record<string, unknown>; step?: number; submitted?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const submitted = body.submitted === true;
  const step = submitted ? 4 : Math.min(Math.max(Number(body.step) || 1, 1), 4);
  const fields = body.fields ?? {};

  // Validate against this step's schema (the full submit schema on step 4).
  const schema = WIZARD_STEP_SCHEMAS[step - 1];
  const parsed = schema.safeParse(submitted ? { ...fields, email: user!.email } : fields);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Please fix the highlighted fields" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: providerApplications.id, status: providerApplications.status })
    .from(providerApplications)
    .where(eq(providerApplications.userId, user!.id))
    .limit(1);

  const values: Partial<typeof providerApplications.$inferInsert> = submitted
    ? wizardToApplicationRow(parsed.data as Parameters<typeof wizardToApplicationRow>[0])
    : columnValues(fields);

  let application: typeof providerApplications.$inferSelect;
  if (existing) {
    const [updated] = await db
      .update(providerApplications)
      .set({
        ...values,
        ...(submitted ? { status: "pending" } : { status: "draft" }),
        email: user!.email,
      })
      .where(eq(providerApplications.id, existing.id))
      .returning();
    application = updated;
  } else {
    // Drafts are always written name/activityType-first (step 1) — the empty
    // fallbacks keep partial saves from violating NOT NULL columns on resume.
    const insertValues: typeof providerApplications.$inferInsert = {
      ...values,
      name:
        typeof values.name === "string" && values.name.trim() ? values.name : "",
      email: user!.email,
      activityType:
        typeof values.activityType === "string" && values.activityType.trim()
          ? values.activityType
          : "",
      userId: user!.id,
      status: submitted ? "pending" : "draft",
      onboardSource: "wizard",
    };
    const [inserted] = await db
      .insert(providerApplications)
      .values(insertValues)
      .returning();
    application = inserted;
  }

  if (submitted) {
    // FR-5 one account two doors: the magic-link user (role 'parent') becomes
    // a provider the moment they submit. Never a temp password — they already
    // have an account.
    await db.update(users).set({ role: "provider" }).where(eq(users.id, user!.id));

    // Scenario 6: Submitted → Reviewing → Live, the provider stays in the loop.
    // Fire-and-forget: email latency must never block the submit response.
    void sendProviderStatusNotification(user!.id, "submitted", application, {
      email: user!.email,
    }).catch((e) => {
      console.warn("[applications] provider-status notification failed — submit proceeds:", e);
    });
  }

  return NextResponse.json({ application });
}
