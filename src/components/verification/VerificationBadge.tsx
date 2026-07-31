import { ShieldCheck, Star } from "lucide-react";
import { db } from "@/lib/db/index";
import {
  providerVerifications,
  providerVouches,
  providers,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ── Types ──

export type VerificationTier = "listed" | "verified" | "trusted";

export interface VerificationStatus {
  tier: VerificationTier;
  label: string;
}

// ── Tier lookup ──

async function getVerificationTier(
  providerId: string
): Promise<VerificationStatus> {
  // In mock mode, all providers default to Listed
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return { tier: "listed", label: "Listed" };
  }

  try {
    // 1. Check for an approved verification record
    const [verification] = await db
      .select()
      .from(providerVerifications)
      .where(
        and(
          eq(providerVerifications.providerId, providerId),
          eq(providerVerifications.status, "approved")
        )
      )
      .limit(1);

    if (!verification) {
      return { tier: "listed", label: "Listed" };
    }

    // 2. Count vouches
    const [vouchRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(providerVouches)
      .where(eq(providerVouches.providerId, providerId));

    // 3. Get review count from providers table
    const [providerRow] = await db
      .select({ reviewCount: providers.reviewCount })
      .from(providers)
      .where(eq(providers.id, providerId))
      .limit(1);

    const vouchCount = vouchRow?.count ?? 0;
    const reviewCount = providerRow?.reviewCount ?? 0;

    // 4. Determine tier
    if (vouchCount >= 3 && reviewCount >= 5) {
      return { tier: "trusted", label: "Trusted" };
    }

    return { tier: "verified", label: "Verified" };
  } catch {
    // Graceful fallback — treat as Listed on any DB error
    return { tier: "listed", label: "Listed" };
  }
}

// ── Tier config ──

const tierConfig: Record<
  VerificationTier,
  { icon: React.ReactNode; className: string }
> = {
  listed: {
    icon: null,
    className: "bg-slate-100 text-slate-600",
  },
  verified: {
    icon: <ShieldCheck className="h-3 w-3" aria-hidden="true" />,
    className: "bg-ilali-50 text-ilali-600",
  },
  trusted: {
    icon: <Star className="h-3 w-3" aria-hidden="true" />,
    className: "bg-amber-50 text-amber-600",
  },
};

// ── Component ──

interface VerificationBadgeProps {
  providerId: string;
  className?: string;
}

export default async function VerificationBadge({
  providerId,
  className = "",
}: VerificationBadgeProps) {
  const { tier, label } = await getVerificationTier(providerId);
  const config = tierConfig[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className} ${className}`}
    >
      {config.icon}
      {label}
    </span>
  );
}

// ── Helper: get tier for use outside the component ──

export { getVerificationTier };
