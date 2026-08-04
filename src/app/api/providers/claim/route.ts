import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/index";
import { users, providers, authAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/providers/claim
 *
 * Existing provider claim flow. No auth required.
 * Accepts { email, password, passphrase }.
 * Finds user where email matches AND needsClaim=true.
 * Creates password account, sets passphraseHash, clears needsClaim.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, passphrase } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!passphrase || typeof passphrase !== "string" || passphrase.trim().split(/\s+/).length < 3) {
      return NextResponse.json(
        { error: "Passphrase must contain at least 3 words" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with matching email AND needsClaim=true AND role='provider'
    const [dbUser] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, normalizedEmail),
          eq(users.needsClaim, true),
          eq(users.role, "provider")
        )
      )
      .limit(1);

    if (!dbUser) {
      return NextResponse.json(
        { error: "No matching provider found" },
        { status: 404 }
      );
    }

    // Verify this user is linked to a provider
    const [providerRecord] = await db
      .select()
      .from(providers)
      .where(eq(providers.userId, dbUser.id))
      .limit(1);

    if (!providerRecord) {
      return NextResponse.json(
        { error: "No matching provider found" },
        { status: 404 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Hash passphrase
    const passphraseHash = await bcrypt.hash(passphrase.trim(), 10);

    // Check if auth account already exists for this user
    const [existingAccount] = await db
      .select()
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.userId, dbUser.id),
          eq(authAccounts.providerId, "credential")
        )
      )
      .limit(1);

    if (existingAccount) {
      // Update existing account
      await db
        .update(authAccounts)
        .set({ password: passwordHash })
        .where(
          and(
            eq(authAccounts.userId, dbUser.id),
            eq(authAccounts.providerId, "credential")
          )
        );
    } else {
      // Create new auth account
      await db.insert(authAccounts).values({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        providerId: "credential",
        accountId: dbUser.id,
        password: passwordHash,
      });
    }

    // Clear needsClaim and set passphraseHash
    await db
      .update(users)
      .set({
        needsClaim: false,
        passphraseHash,
        passwordResetRequired: false,
      })
      .where(eq(users.id, dbUser.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("providers/claim error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
