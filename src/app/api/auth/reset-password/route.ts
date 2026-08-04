import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/index";
import { users, authAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// In-memory rate limit: 2 attempts per email per 30 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    // Reset or first attempt
    rateLimitMap.set(key, { count: 1, resetAt: now + 30 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 2) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * POST /api/auth/reset-password
 *
 * Passphrase-based password recovery. No auth required.
 * Accepts { email, passphrase, newPassword, newPassphrase }.
 * Rate limited: 2 attempts per email per 30 minutes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, passphrase, newPassword, newPassphrase } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!passphrase || typeof passphrase !== "string") {
      return NextResponse.json(
        { error: "Passphrase is required" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!newPassphrase || typeof newPassphrase !== "string" || newPassphrase.trim().split(/\s+/).length < 3) {
      return NextResponse.json(
        { error: "New passphrase must contain at least 3 words" },
        { status: 400 }
      );
    }

    // Rate limit check
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 30 minutes." },
        { status: 429 }
      );
    }

    // Find user by email
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!dbUser || !dbUser.passphraseHash) {
      return NextResponse.json({ error: "No match" }, { status: 400 });
    }

    // Verify passphrase
    const passphraseMatch = await bcrypt.compare(
      passphrase.trim(),
      dbUser.passphraseHash
    );

    if (!passphraseMatch) {
      return NextResponse.json({ error: "No match" }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Hash new passphrase
    const newPassphraseHash = await bcrypt.hash(newPassphrase.trim(), 10);

    // Update password in authAccounts
    await db
      .update(authAccounts)
      .set({ password: passwordHash })
      .where(
        and(
          eq(authAccounts.userId, dbUser.id),
          eq(authAccounts.providerId, "credential")
        )
      );

    // Update passphraseHash on users
    await db
      .update(users)
      .set({ passphraseHash: newPassphraseHash })
      .where(eq(users.id, dbUser.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
