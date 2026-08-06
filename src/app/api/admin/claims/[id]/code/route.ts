import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { regenerateClaimCode } from "@/lib/claim-codes";

/**
 * Admin claim-code management (WS-3).
 *
 * - POST   /api/admin/claims/[id]/code — generate (or regenerate) a claim code
 *   for a provider user. The PLAINTEXT code is returned ONLY in this response
 *   so the admin can copy it; only the bcrypt hash is ever persisted.
 *   Regenerating overwrites the hash → the previous code is instantly dead.
 * - DELETE /api/admin/claims/[id]/code — clear/revoke the claim code.
 */
export const POST = withAdmin(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "provider") {
      return NextResponse.json(
        { error: "Claim codes are only for provider accounts" },
        { status: 400 }
      );
    }

    const { claimCode, claimCodeHash, claimCodeExpiresAt } =
      await regenerateClaimCode();

    await db
      .update(users)
      .set({
        claimCodeHash,
        claimCodeExpiresAt,
        claimAttempts: 0,
        claimLockedUntil: null,
      })
      .where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      claimCode,
      expiresAt: claimCodeExpiresAt.toISOString(),
    });
  }
);

export const DELETE = withAdmin(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db
      .update(users)
      .set({
        claimCodeHash: null,
        claimCodeExpiresAt: null,
        claimAttempts: 0,
        claimLockedUntil: null,
      })
      .where(eq(users.id, id));

    return NextResponse.json({ success: true });
  }
);
