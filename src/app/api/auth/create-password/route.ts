import { NextRequest, NextResponse } from "next/server";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/index";
import { users, authAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/auth/create-password
 *
 * First-login forced password creation for providers with passwordResetRequired=true.
 * Requires an active session where the user's passwordResetRequired flag is set.
 * Accepts { password, passphrase }, hashes both, clears the flag.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = session.user as { id: string; role?: string; email?: string };
    const userId = userRecord.id;

    // Fetch the user from DB to check passwordResetRequired
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.passwordResetRequired) {
      return NextResponse.json(
        { error: "Password reset not required for this account" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { password, passphrase } = body;

    // Validate
    if (!password || typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!passphrase || typeof passphrase !== "string" || passphrase.trim().split(/\s+/).length < 3) {
      return NextResponse.json(
        { error: "Passphrase must contain at least 3 words" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Hash passphrase
    const passphraseHash = await bcrypt.hash(passphrase.trim(), 10);

    // Update the authAccounts table with new password hash
    await db
      .update(authAccounts)
      .set({ password: passwordHash })
      .where(
        and(
          eq(authAccounts.userId, userId),
          eq(authAccounts.providerId, "credential")
        )
      );

    // Clear passwordResetRequired and set passphraseHash on users table
    await db
      .update(users)
      .set({
        passwordResetRequired: false,
        passphraseHash,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("create-password error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
