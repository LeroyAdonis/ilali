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
import { sendProviderStatusNotification } from "@/lib/notifications";

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

    let updated = application;
    if (newStatus !== "approved") {
      // approveApplication already sets status → "approved"; only contacted/
      // rejected transitions need a write here (one less UPDATE per approval).
      [updated] = await db
        .update(providerApplications)
        .set({ status: newStatus })
        .where(eq(providerApplications.id, id))
        .returning();
    }

    // Painless Journeys (Scenario 6): self-onboarded providers stay in the
    // loop. The approval "live" notification fires inside approveApplication;
    // here we cover the other two transitions — into review (contacted) and
    // rejection. Fire-and-forget: email latency must never block the response.
    if (application.userId && newStatus !== "approved") {
      void sendProviderStatusNotification(
        application.userId,
        newStatus === "contacted" ? "reviewing" : "rejected",
        application,
        { email: application.email ?? undefined }
      ).catch((e) => {
        console.warn("[admin] provider-status notification failed — transition proceeds:", e);
      });
    }

    return NextResponse.json({
      ...updated,
      ...(tempPassword ? { tempPassword, emailSent } : {}),
    });
  }
);

/**
 * PATCH /api/admin/applications/[id]
 * Two modes:
 *  - Body { fields: {...} }  → EDIT the draft application (pending/contacted only).
 *    Updates name, activityType, description, location, ages, priceValue (Rands),
 *    phone, email, venue, address, dates/times, day of week, contact name,
 *    booking/additional info, and logo in place. Approved/rejected are locked — 400.
 *  - Empty body → regenerate the temp password for an approved application
 *    (legacy behavior, invalidates the old one, re-arms password reset).
 */
export const PATCH = withAdmin(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const [application] = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.id, id));

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // ── Mode detection: fields body → draft edit; empty body → temp password ──
    let fields: Record<string, unknown> | undefined;
    try {
      const body = await request.json();
      if (body?.fields && typeof body.fields === "object") fields = body.fields;
    } catch {
      // empty body — legacy temp-password path
    }

    if (fields) {
      if (application.status !== "pending" && application.status !== "contacted") {
        return NextResponse.json(
          { error: "Only pending or contacted applications can be edited" },
          { status: 400 }
        );
      }

      const name = typeof fields.name === "string" ? fields.name.trim() : "";
      const activityType =
        typeof fields.activityType === "string" ? fields.activityType.trim() : "";
      if (!name || !activityType) {
        return NextResponse.json(
          { error: "Name and activity type are required." },
          { status: 400 }
        );
      }

      const ageMin = fields.ageMin == null || fields.ageMin === "" ? null : Number(fields.ageMin);
      const ageMax = fields.ageMax == null || fields.ageMax === "" ? null : Number(fields.ageMax);
      if (
        (ageMin != null && (!Number.isInteger(ageMin) || ageMin < 0 || ageMin > 18)) ||
        (ageMax != null && (!Number.isInteger(ageMax) || ageMax < 0 || ageMax > 18))
      ) {
        return NextResponse.json(
          { error: "Ages must be whole numbers between 0 and 18." },
          { status: 400 }
        );
      }

      // providerApplications.priceValue is stored in Rands (whole numbers) —
      // the cents conversion happens at APPROVAL when the providers row is
      // created (approveApplication). Store what the admin typed, as-is.
      const priceValue =
        fields.priceValue == null || fields.priceValue === ""
          ? null
          : Number(fields.priceValue);
      if (priceValue != null && (!Number.isFinite(priceValue) || priceValue < 0)) {
        return NextResponse.json(
          { error: "Price must be a positive number (in Rands)." },
          { status: 400 }
        );
      }

      const email =
        typeof fields.email === "string" ? fields.email.trim() : application.email;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "A valid email address is required." },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(providerApplications)
        .set({
          name,
          email,
          activityType,
          description:
            typeof fields.description === "string" && fields.description.trim()
              ? fields.description.trim()
              : null,
          location:
            typeof fields.location === "string" && fields.location.trim()
              ? fields.location.trim()
              : null,
          ageMin,
          ageMax,
          priceValue,
          phone:
            typeof fields.phone === "string" && fields.phone.trim()
              ? fields.phone.trim()
              : null,
          venue:
            typeof fields.venue === "string" && fields.venue.trim()
              ? fields.venue.trim()
              : null,
          address:
            typeof fields.address === "string" && fields.address.trim()
              ? fields.address.trim()
              : null,
          dateStart:
            typeof fields.dateStart === "string" && fields.dateStart.trim()
              ? fields.dateStart.trim()
              : null,
          dateEnd:
            typeof fields.dateEnd === "string" && fields.dateEnd.trim()
              ? fields.dateEnd.trim()
              : null,
          timeStart:
            typeof fields.timeStart === "string" && fields.timeStart.trim()
              ? fields.timeStart.trim()
              : null,
          timeEnd:
            typeof fields.timeEnd === "string" && fields.timeEnd.trim()
              ? fields.timeEnd.trim()
              : null,
          dayOfWeek:
            typeof fields.dayOfWeek === "string" && fields.dayOfWeek.trim()
              ? fields.dayOfWeek.trim()
              : null,
          contactName:
            typeof fields.contactName === "string" && fields.contactName.trim()
              ? fields.contactName.trim()
              : null,
          bookingInfo:
            typeof fields.bookingInfo === "string" && fields.bookingInfo.trim()
              ? fields.bookingInfo.trim()
              : null,
          additionalInfo:
            typeof fields.additionalInfo === "string" &&
            fields.additionalInfo.trim()
              ? fields.additionalInfo.trim()
              : null,
          logoPath:
            typeof fields.logoPath === "string" ? fields.logoPath : null,
        })
        .where(eq(providerApplications.id, id))
        .returning();

      return NextResponse.json({ application: updated });
    }

    if (application.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved applications have a temp password to regenerate" },
        { status: 400 }
      );
    }

    // Painless Journeys: wizard applications (userId set) signed up via magic
    // link — they have no password to regenerate. Temp passwords are for the
    // admin/bulk-import path only.
    if (application.userId) {
      return NextResponse.json(
        { error: "This provider signed up via magic link — no temp password exists" },
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
