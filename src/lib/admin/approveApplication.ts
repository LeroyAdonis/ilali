/**
 * WS-4 Bulk Import — shared WS-1 approval logic (T018 / spec FR-5).
 *
 * Extracted from `src/app/api/admin/applications/[id]/route.ts` so the
 * single-approve route AND the batch-approve route share ONE account-creation
 * path. Behavior is byte-identical to the original route:
 *  1. duplicate-user check → throws ApproveError(409)
 *  2. create provider user (role='provider', 12-char temp password,
 *     passwordResetRequired=true) + Better Auth credential account
 *  3. link or create the providers row (matched by name+location or phone)
 *  4. fire the WS-2 welcome email (non-blocking)
 *  5. mark the application approved
 *
 * Callers wrap this in their own try/catch — a failure throws and leaves the
 * application's status untouched.
 */
import { db } from "@/lib/db/index";
import {
  providerApplications,
  providers,
  users,
  authAccounts,
  categories,
} from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendProviderWelcomeEmail, appUrl } from "@/lib/mail";
import { sendNotification } from "@/lib/notifications";

export const EMAIL_EXISTS_ERROR = "A user with this email already exists";

/** Error with an HTTP status, thrown by approveApplication(). */
export class ApproveError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApproveError";
    this.statusCode = statusCode;
  }
}

export interface ApproveResult {
  tempPassword: string;
  emailSent: boolean;
}

// ── Temp password (12 chars, mixed case + digits) ──
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const ALL_CHARS = UPPER + LOWER + DIGITS;

export function generateTempPassword(length = 12): string {
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
export const ACTIVITY_TYPE_TO_CATEGORY: Record<string, string> = {
  "arts & culture": "arts-culture",
  sports: "sports",
  "music lessons": "music-lessons",
  "education & tutoring": "education",
  "holiday programs": "holiday-programs",
  "dance & movement": "arts-culture",
  "emotional intelligence": "emotional-intelligence",
};

export async function resolveCategoryId(activityType: string | null | undefined): Promise<string> {
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
 * Assumes no user with this email exists yet (checked by approveApplication).
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

/**
 * Approve one application end-to-end (WS-1 + WS-2).
 * Throws ApproveError on failure — the application's status is only updated
 * once the account actually exists and the email has been attempted.
 */
export async function approveApplication(
  application: typeof providerApplications.$inferSelect
): Promise<ApproveResult> {
  const email = application.email.toLowerCase().trim();

  // Do the account creation FIRST so the application is only marked approved
  // once the account actually exists.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ApproveError(EMAIL_EXISTS_ERROR, 409);
  }

  let tempPassword: string;
  let providerUserId: string;
  try {
    const result = await createProviderAccount(application);
    tempPassword = result.tempPassword;
    providerUserId = result.userId;
  } catch (e) {
    console.error("Auto-create provider account failed:", e);
    throw new ApproveError(
      "Account creation failed — application not approved. Check the server logs and try again.",
      500
    );
  }

  // WS-2: fire-and-forget the welcome email (temp password + login
  // instructions). Email is OPTIONAL and NON-BLOCKING — if RESEND_API_KEY
  // is unset or Resend rejects the send, the approval still succeeds and
  // the admin copies the temp password manually, exactly as before.
  let emailSent = false;
  try {
    const mailResult = await sendProviderWelcomeEmail({
      to: application.email,
      providerName: application.name || application.email,
      tempPassword,
    });
    emailSent = "sent" in mailResult ? mailResult.sent : false;
  } catch (e) {
    console.warn("[mail] Welcome email failed — approval proceeds:", e);
    emailSent = false;
  }

  await db
    .update(providerApplications)
    .set({ status: "approved" })
    .where(eq(providerApplications.id, application.id));

  // Painless Journeys FR-6: fire the provider-status notification (status →
  // Live) the moment the listing goes live. Non-blocking by design — the
  // sendNotification service never throws, so the approval can never fail
  // because of email/WhatsApp problems. Fired here (the shared helper) so the
  // single-approve route AND batch-approve both notify.
  try {
    await sendNotification(
      providerUserId,
      "provider-status",
      {
        status: "live",
        providerName: application.name || application.email,
        activityName: application.activityType || "",
        link: `${appUrl()}/provider`,
      },
      { email: application.email } // known — skip the user lookup
    );
  } catch (e) {
    // Belt-and-braces — sendNotification is contractually non-throwing, but a
    // regression here must never break the admin approval flow.
    console.warn("[approve] provider-status notification failed — approval proceeds:", e);
  }

  return { tempPassword, emailSent };
}
