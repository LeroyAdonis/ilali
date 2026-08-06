import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications, users, authAccounts } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  ApproveError,
  approveApplication,
  generateTempPassword,
} from "@/lib/admin/approveApplication";

/**
 * Admin application lifecycle:
 * - POST /api/admin/applications/[id]  { status } — transition status
 *   (pending→contacted|approved|rejected, contacted→approved|rejected).
 *   Approving auto-creates a provider user account (role='provider') with a
 *   temp password, links or creates the providers row, and returns the temp
 *   password in the JSON response so the admin can copy it to the provider.
 *   The account-creation + email logic lives in the shared
 *   `approveApplication()` helper (WS-4) — used by the single-approve route
 *   AND the batch-approve route.
 * - PATCH /api/admin/applications/[id]  — regenerate the temp password for an
 *   approved application (invalidates the old one, re-arms password reset).
 */

const VALID_STATUSES = ["pending", "contacted", "approved", "rejected"];
// Admin can approve straight from pending — no forced "contacted" step.
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["contacted", "approved", "rejected"],
  contacted: ["approved", "rejected"],
  approved: [],
  rejected: [],
};

export const GET = withAdmin(async () => {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(providerApplications.createdAt);
  return NextResponse.json(applications);
});

export const POST = withAdmin(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    // Accept formData (legacy HTML forms) or JSON (client fetch)
    let newStatus: string;
    try {
      const formData = await request.formData();
      newStatus = formData.get("status") as string;
    } catch {
      const body = await request.json();
      newStatus = body.status;
    }

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const [application] = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.id, id));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const currentStatus = application.status || "pending";
    const allowedNext = VALID_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${currentStatus}" to "${newStatus}"` },
        { status: 400 }
      );
    }

    // Approving auto-creates the provider login account (spec Scenario 9 / FR-1).
    // Shared helper: dup check → account creation → WS-2 email → status update.
    let tempPassword: string | undefined;
    let emailSent = false;
    if (newStatus === "approved") {
      try {
        const result = await approveApplication(application);
        tempPassword = result.tempPassword;
        emailSent = result.emailSent;
      } catch (e) {
        if (e instanceof ApproveError) {
          return NextResponse.json({ error: e.message }, { status: e.statusCode });
        }
        throw e;
      }
    }

    const [updated] = await db
      .update(providerApplications)
      .set({ status: newStatus })
      .where(eq(providerApplications.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      ...(tempPassword ? { tempPassword, emailSent } : {}),
    });
  }
);

/**
 * PATCH — regenerate the temp password for an approved application.
 * Overwrites the stored hash (invalidating the previous temp password) and
 * re-arms passwordResetRequired so the provider must set a new password.
 */
export const PATCH = withAdmin(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const [application] = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.id, id));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved applications have a temp password to regenerate" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, application.email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "No account exists for this application yet" },
        { status: 404 }
      );
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await db
      .update(authAccounts)
      .set({ password: passwordHash })
      .where(and(eq(authAccounts.userId, user.id), eq(authAccounts.providerId, "credential")));

    await db
      .update(users)
      .set({ passwordResetRequired: true })
      .where(eq(users.id, user.id));

    return NextResponse.json({ tempPassword });
  }
);
