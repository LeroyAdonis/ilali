import { db } from "@/lib/db/index";
import { users, providers } from "@/lib/db/schema";
import { or, isNotNull, eq, desc } from "drizzle-orm";
import ClaimsClient from "./ClaimsClient";
import type { ClaimRow } from "./ClaimsClient";

export const dynamic = "force-dynamic";

/**
 * /admin/claims (WS-3) — issue single-use claim codes to providers so they can
 * verify ownership of their migrated listing. The admin layout gates access.
 * The plaintext code is shown once after generation (POST response only) —
 * only the bcrypt hash lives in the DB.
 */
export default async function ClaimsPage() {
  const claimUsers = await db
    .select()
    .from(users)
    .where(or(eq(users.needsClaim, true), isNotNull(users.claimCodeHash)))
    .orderBy(desc(users.createdAt));

  const providerList = await db.select().from(providers);
  const providerByUserId = new Map(
    providerList
      .filter((p) => p.userId != null)
      .map((p) => [p.userId as string, p])
  );

  const rows: ClaimRow[] = claimUsers.map((u) => {
    const provider = providerByUserId.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      slug: provider?.slug ?? null,
      providerName: provider?.name ?? null,
      needsClaim: u.needsClaim ?? false,
      hasCode: u.claimCodeHash != null,
      expiresAt: u.claimCodeExpiresAt,
      attempts: u.claimAttempts ?? 0,
      lockedUntil: u.claimLockedUntil,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Claim codes</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Issue single-use claim codes so providers can verify they own their
          listing. Codes expire after 7 days and lock after 5 failed attempts.
        </p>
      </div>

      <ClaimsClient rows={rows} />
    </div>
  );
}
