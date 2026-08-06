import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import {
  providerApplications,
  providers,
  users,
  authAccounts,
  categories,
} from "@/lib/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";

/**
 * Admin application lifecycle:
 * - POST /api/admin/applications/[id]  { status } — transition status
 *   (pending→contacted|approved|rejected, contacted→approved|rejected).
 *   Approving auto-creates a provider user account (role='provider') with a
 *   temp password, links or creates the providers row, and returns the temp
 *   password in the JSON response so the admin can copy it to the provider.
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

const EMAIL_EXISTS_ERROR = "A user with this email already exists";

// ── Temp password (FR-1: 12 chars, mixed case + digits; FR-11: 12+ random) ──
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const ALL_CHARS = UPPER + LOWER + DIGITS;

function generateTempPassword(length = 12): string {
  const pick = (chars: string) =>
    chars[crypto.getRandomValues(new Uint8Array(1))[0] % chars.length];
  // Guarantee at least one of each class, then fill, then shuffle.
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  const fill = crypto.getRandomValues(new Uint8Array(Math.max(0, length - chars.length)));
  for (const b of fill) chars.push(ALL_CHARS[b % ALL_CHARS.length]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// ── Small helpers ──
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "provider";
  const taken = new Set(
    (await db.select({ slug: providers.slug }).from(providers)).map((p) => p.slug)
  );
  if (!taken.has(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}

// Map the signup form's activity-type labels to real category ids, then fall
// back to matching the categories table by name/slug.
const ACTIVITY_TYPE_TO_CATEGORY: Record<string, string> = {
  "arts & culture": "arts-culture",
  sports: "sports",
  "music lessons": "music-lessons",
  "education & tutoring": "education",
  "holiday programs": "holiday-programs",
  "dance & movement": "arts-culture",
  "emotional intelligence": "emotional-intelligence",
};

async function resolveCategoryId(activityType: string | null | undefined): Promise<string> {
  const label = (activityType || "").trim();
  if (label) {
    const aliased = ACTIVITY_TYPE_TO_CATEGORY[label.toLowerCase()];
    if (aliased) return aliased;
    const [byName] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(ilike(categories.name, label))
      .limit(1);
    if (byName) return byName.id;
    const [bySlug] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slugify(label)))
      .limit(1);
    if (bySlug) return bySlug.id;
  }
  const [first] = await db.select({ id: categories.id }).from(categories).limit(1);
  return first?.id ?? "arts-culture";
}

/**
 * Create the provider user account for an approved application and link it to
 * the providers row (reusing an existing one when it was already created via
 * the admin "Create Provider" flow — matched by name+location or phone).
 * Assumes no user with this email exists yet (checked by the caller).
 */
async function createProviderAccount(application: typeof providerApplications.$inferSelect) {
  const email = application.email.toLowerCase().trim();

  // 1. Generate + hash temp password
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // 2. Create user
  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name: application.name || email,
    email,
    role: "provider",
    passwordResetRequired: true,
    needsClaim: false,
  });

  // 3. Create Better Auth credential account (password hash lives here)
  await db.insert(authAccounts).values({
    id: crypto.randomUUID(),
    userId,
    providerId: "credential",
    accountId: userId,
    password: passwordHash,
  });

  // 4. Link or create the providers row.
  //    provider_applications has no providerId column, so match the provider
  //    row by its data: same name + location, or same (normalized) phone.
  const name = application.name?.trim().toLowerCase();
  const location = application.location?.trim().toLowerCase();
  const phone = application.phone?.replace(/\s+/g, "") || "";

  const allProviders = await db
    .select({
      id: providers.id,
      name: providers.name,
      location: providers.location,
      phone: providers.phone,
      userId: providers.userId,
    })
    .from(providers);

  const existing = allProviders.find(
    (p) =>
      (name &&
        location &&
        p.name?.toLowerCase() === name &&
        p.location?.toLowerCase() === location) ||
      (phone !== "" && p.phone && p.phone.replace(/\s+/g, "") === phone)
  );

  if (existing) {
    await db
      .update(providers)
      .set({ userId })
      .where(eq(providers.id, existing.id));
  } else {
    await db.insert(providers).values({
      id: crypto.randomUUID(),
      name: application.name,
      slug: await uniqueSlug(application.name),
      category: await resolveCategoryId(application.activityType),
      description: application.description || "",
      providerName: application.name,
      location: application.location || "",
      ageMin: application.ageMin ?? 0,
      ageMax: application.ageMax ?? 18,
      // Applications store price in Rands (form label); providers store cents.
      priceValue:
        application.priceValue != null ? Math.round(application.priceValue * 100) : 0,
      imageUrl: application.imageUrl || null,
      phone: application.phone || null,
      userId,
    });
  }

  return { tempPassword, userId };
}

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
    // Do the account creation FIRST so the application is only marked approved
    // once the account actually exists.
    let tempPassword: string | undefined;
    if (newStatus === "approved") {
      const email = application.email.toLowerCase().trim();
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return NextResponse.json(
          { error: EMAIL_EXISTS_ERROR },
          { status: 409 }
        );
      }

      try {
        const result = await createProviderAccount(application);
        tempPassword = result.tempPassword;
      } catch (e) {
        console.error("Auto-create provider account failed:", e);
        return NextResponse.json(
          {
            error:
              "Account creation failed — application not approved. Check the server logs and try again.",
          },
          { status: 500 }
        );
      }
    }

    const [updated] = await db
      .update(providerApplications)
      .set({ status: newStatus })
      .where(eq(providerApplications.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      ...(tempPassword ? { tempPassword } : {}),
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
