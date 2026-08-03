import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import {
  getRewardPoints,
  getRewardRedemptions,
} from "@/lib/data-source";
import { calculateBalance } from "@/lib/rewards/calculate";

/**
 * PointsWidget — Ubuntu Rewards balance display.
 *
 * Fetches the current user's reward points and redemptions,
 * calculates the net balance, and displays it compactly.
 * Designed to sit in the 3-column widget row alongside
 * KidsCard and ClubCardsRow.
 */
export default async function PointsWidget() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const [points, redemptions] = await Promise.all([
    getRewardPoints(session.user.id),
    getRewardRedemptions(session.user.id),
  ]);

  const balance = calculateBalance(points, redemptions);

  if (balance === 0) {
    return (
      <div className="rounded-xl border border-gold/20 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl" aria-hidden="true">
            🏆
          </span>
          <span className="text-2xl font-bold font-display text-gold-deep">
            0
          </span>
          <span className="text-sm font-medium text-ink-faint">points</span>
        </div>
        <p className="text-xs text-ink-faint leading-relaxed">
          Earn points by joining clubs and sharing rides
        </p>
        <Link
          href="/rewards"
          className="mt-2 inline-block text-xs font-semibold text-teal hover:text-teal-deep transition-colors"
        >
          View rewards →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/20 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          🏆
        </span>
        <span className="text-2xl font-bold font-display text-gold-deep">
          {balance.toLocaleString()}
        </span>
        <span className="text-sm font-medium text-ink-faint">points</span>
      </div>
      <Link
        href="/rewards"
        className="mt-3 inline-block text-xs font-semibold text-teal hover:text-teal-deep transition-colors"
      >
        View rewards →
      </Link>
    </div>
  );
}
