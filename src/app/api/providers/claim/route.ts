import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/index";
import { users, providers, authAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  UNIFORM_CLAIM_ERROR,
  CLAIM_LOCKOUT_ERROR,
  isClaimLocked,
  isClaimCodeExpired,
  nextClaimAttempt,
  verifyClaimCode,
} from "@/lib/claim-codes";

/**
 * POST /api/providers/claim — WS-3 rewrite.
 *
 * No auth required (that's the point — a provider claims their listing before
 * they have an account). Ownership is verified with an admin-issued claim code
 * delivered out-of-band (placeholder slug@ilali.co emails can't receive mail).
 *
 * Flow:
 *   1. Validate { email, claimCode, password, passphrase } — every shape of
 *      bad input returns the SAME uniform error (no field-level hints).
 *   2. Look up the user by email, then require role='provider' + a linked
 *      providers row — all failures return the uniform error, so the endpoint
 *      never reveals whether an email exists or a code is set.
 *   3. Lockout: locked account → 429. Each failed code verification increments
 *      claimAttempts; the 5th failure arms a 15-minute lock (429). Only the
 *      lockout state is distinguishable from the outside — and that requires
 *      already knowing an email that is claimable.
 *   4. Success: bcrypt-verify the code (checks expiry, handles null hash),
 *      then set the credential password + passphrase, clear needsClaim AND
 *      the claim code (single-use), and reset attempts/lock.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, claimCode, password, passphrase } = body;

    // ── 1. Field validation — uniform error for everything ──
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }
    if (typeof claimCode !== "string" || !claimCode.trim()) {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }
    if (
      typeof passphrase !== "string" ||
      passphrase.trim().split(/\s+/).filter(Boolean).length < 3
    ) {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // ── 2. Find the user by email (NOT filtered by needsClaim — we must be
    // able to check lock state uniformly, and the code is the real gate) ──
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }
    if (dbUser.role !== "provider") {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }

    // ── 3. Lockout check — the ONE distinguishable failure ──
    if (isClaimLocked(dbUser, now)) {
      return NextResponse.json(
        { error: CLAIM_LOCKOUT_ERROR },
        { status: 429 }
      );
    }

    // Verify this user is linked to a providers row.
    const [providerRecord] = await db
      .select()
      .from(providers)
      .where(eq(providers.userId, dbUser.id))
      .limit(1);
    if (!providerRecord) {
      return NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }

    // ── 4. Verify the claim code (null hash → false, expired → false) ──
    const codeOk =
      dbUser.claimCodeHash != null &&
      !isClaimCodeExpired(dbUser, now) &&
      (await verifyClaimCode(dbUser, claimCode.trim()));

    if (!codeOk) {
      const next = nextClaimAttempt(dbUser, now);
      await db
        .update(users)
        .set({
          claimAttempts: next.claimAttempts,
          claimLockedUntil: next.claimLockedUntil,
        })
        .where(eq(users.id, dbUser.id));
      // The 5th failure arms the lock — surface the lockout message.
      return next.locked
        ? NextResponse.json(
            { error: CLAIM_LOCKOUT_ERROR },
            { status: 429 }
          )
        : NextResponse.json({ error: UNIFORM_CLAIM_ERROR }, { status: 400 });
    }

    // ── 5. Success — code verified, single-use from here on ──
    const passwordHash = await bcrypt.hash(password, 10);
    const passphraseHash = await bcrypt.hash(passphrase.trim(), 10);

    // Create/update the credential auth account (kept from the pre-WS-3 route).
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
      await db.insert(authAccounts).values({
        id: crypto.randomUUID(),
        userId: dbUser.id,
        providerId: "credential",
        accountId: dbUser.id,
        password: passwordHash,
      });
    }

    // Claim the listing: set credentials, clear the claim flag AND the claim
    // code (single-use), reset attempt/lock state.
    await db
      .update(users)
      .set({
        needsClaim: false,
        passphraseHash,
        passwordResetRequired: false,
        claimCodeHash: null,
        claimCodeExpiresAt: null,
        claimAttempts: 0,
        claimLockedUntil: null,
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
