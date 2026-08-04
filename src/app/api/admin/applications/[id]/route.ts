import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications, providers, users, authAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const VALID_STATUSES = ["pending", "contacted", "approved", "rejected"];
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["contacted"],
  contacted: ["approved", "rejected"],
};

export const GET = withAdmin(async () => {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(providerApplications.createdAt);
  return NextResponse.json(applications);
});

export const POST = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  // Try formData first (HTML form submissions), fall back to JSON
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

  const [updated] = await db
    .update(providerApplications)
    .set({ status: newStatus })
    .where(eq(providerApplications.id, id))
    .returning();

  // Always redirect after POST — all submissions come from HTML forms
  return NextResponse.redirect(new URL("/admin/applications", request.url));
});

export const PATCH = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await request.json();
  const newStatus = body.status;

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

  // Update application status
  const [updated] = await db
    .update(providerApplications)
    .set({ status: newStatus })
    .where(eq(providerApplications.id, id))
    .returning();

  // Auto-create provider user account when transitioning to "approved"
  let tempPassword: string | undefined;
  if (newStatus === "approved") {
    try {
      // 1. Check if user with this email already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, application.email.toLowerCase().trim()))
        .limit(1);

      if (existingUser) {
        // Link existing user to provider if not already linked
        const [existingProvider] = await db
          .select()
          .from(providers)
          .where(eq(providers.userId, existingUser.id))
          .limit(1);

        if (!existingProvider) {
          // Find provider by email match or name
          await db
            .update(providers)
            .set({ userId: existingUser.id })
            .where(eq(providers.id, id)); // attempt to link; the provider might be separate
        }

        return NextResponse.json({
          ...updated,
          warning: "A user with this email already exists — account not re-created",
        });
      }

      // 2. Generate temp password (12 chars, alphanumeric)
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let pass = "";
      const randomBytes = crypto.getRandomValues(new Uint8Array(12));
      for (let i = 0; i < 12; i++) {
        pass += charset[randomBytes[i] % charset.length];
      }
      tempPassword = pass;

      // 3. Hash the temp password
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // 4. Create user
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        name: application.name || application.email,
        email: application.email.toLowerCase().trim(),
        role: "provider",
        passwordResetRequired: true,
        needsClaim: false,
      });

      // 5. Create auth account
      await db.insert(authAccounts).values({
        id: crypto.randomUUID(),
        userId,
        providerId: "credential",
        accountId: userId,
        password: passwordHash,
      });

      // 6. Link provider to user
      // The provider might already exist (created when application was "contacted")
      // Try to find the provider by application data or create one
      const providerId = crypto.randomUUID();
      const slug = application.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const [existingProviderByEmail] = await db
        .select()
        .from(providers)
        .where(eq(providers.userId, userId))
        .limit(1);

      if (!existingProviderByEmail) {
        // Try to upsert: find a provider that matches the application
        const [matchingProvider] = await db
          .select()
          .from(providers)
          .where(eq(providers.id, id))
          .limit(1);

        if (matchingProvider) {
          await db
            .update(providers)
            .set({ userId })
            .where(eq(providers.id, matchingProvider.id));
        } else {
          // Create a new provider from application data
          await db.insert(providers).values({
            id: providerId,
            name: application.name,
            slug,
            category: application.activityType || "arts-culture",
            description: application.description || "",
            providerName: application.name,
            location: application.location || "",
            ageMin: application.ageMin ?? 0,
            ageMax: application.ageMax ?? 18,
            priceValue: application.priceValue ?? 0,
            imageUrl: application.imageUrl || null,
            phone: application.phone || null,
            userId,
          });
        }
      }
    } catch (e) {
      console.error("Auto-create provider user failed:", e);
      return NextResponse.json({
        ...updated,
        error: "Application approved but account creation failed. Please create manually.",
      });
    }
  }

  return NextResponse.json({
    ...updated,
    ...(tempPassword ? { tempPassword } : {}),
  });
});
