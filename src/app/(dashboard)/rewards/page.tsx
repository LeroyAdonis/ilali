import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRewardPoints, getRewardRedemptions } from "@/lib/data-source";
import {
  REWARD_ACTIONS,
  REDEMPTION_COSTS,
  calculateBalance,
  type RewardAction,
  type RedemptionType,
} from "@/lib/rewards/calculate";
import RedeemButton from "@/components/rewards/RedeemButton";

export const metadata: Metadata = {
  title: "Ubuntu Rewards",
  description:
    "Your Ubuntu Rewards dashboard — balance, how to earn points, and redemption options.",
};

export const dynamic = "force-dynamic";

// ── Display metadata (kept in sync with the maps in calculate.ts) ──

const ACTION_META: Record<
  RewardAction,
  { label: string; description: string; icon: string }
> = {
  lift: { label: "Lift Share", description: "Complete a ride share", icon: "🚗" },
  volunteer: { label: "Volunteer", description: "Help at a club event", icon: "🤝" },
  referral: { label: "Refer a Friend", description: "A friend joins ILALI", icon: "👥" },
  review: { label: "Leave a Review", description: "Review an activity or venue", icon: "⭐" },
  welcome: { label: "Welcome Bonus", description: "Join Ubuntu Rewards", icon: "🎉" },
  attendance: { label: "Event Attendance", description: "Attend a club event", icon: "📅" },
};

const REDEMPTION_META: Record<
  RedemptionType,
  { label: string; description: string; icon: string }
> = {
  activityDiscount: { label: "Activity Discount", description: "R50 off any activity booking", icon: "🎟️" },
  freeTrial: { label: "Free Trial Session", description: "One free trial at a partner club", icon: "🥳" },
  priorityBooking: { label: "Priority Booking", description: "Jump the queue for popular camps", icon: "⚡" },
  airtime: { label: "Airtime Top-up", description: "R25 airtime, any network", icon: "📱" },
};

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Page ──

export default async function RewardsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Logged out → friendly gate with a CTA back to sign-in
  if (!session) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-ink/10 bg-white p-10 text-center shadow-sm">
          <span className="text-5xl">🏆</span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
            Your Rewards Are Waiting
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Sign in to see your Ubuntu Rewards balance, earn points for lift
            shares, volunteering, referrals and reviews — then redeem them for
            discounts and perks.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/signin"
              className="rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/ubuntu-rewards"
              className="rounded-full border border-ink/10 px-6 py-2.5 text-sm font-semibold text-ink-soft hover:border-ilali-300 hover:text-ilali-700 transition-colors"
            >
              About Ubuntu Rewards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [ledger, redemptions] = await Promise.all([
    getRewardPoints(session.user.id),
    getRewardRedemptions(session.user.id),
  ]);
  const balance = calculateBalance(ledger, redemptions);

  const earnRows = (Object.keys(REWARD_ACTIONS) as RewardAction[]).map(
    (action) => ({
      action,
      points: REWARD_ACTIONS[action],
      ...ACTION_META[action],
    })
  );

  const redeemOptions = (
    Object.keys(REDEMPTION_COSTS) as RedemptionType[]
  ).map((type) => ({
    type,
    cost: REDEMPTION_COSTS[type],
    ...REDEMPTION_META[type],
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* ── Balance hero ── */}
      <section className="relative overflow-hidden rounded-2xl bg-teal-deep px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-sm font-medium text-amber-100">
            Ubuntu Rewards balance
          </p>
          <p className="mt-2 text-5xl font-extrabold tracking-tight">
            🏆 {balance.toLocaleString()}{" "}
            <span className="text-2xl font-bold text-amber-100">pts</span>
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-amber-50">
            Every lift share, volunteer session, referral and review earns
            points — and every redemption gives a little back to your family.
            <em className="font-semibold text-white"> Ubuntu:</em> I am because
            we are.
          </p>
        </div>
      </section>

      {/* ── How to earn + redeem ── */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-bold text-ink">How to Earn</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 bg-paper-warm text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {earnRows.map((row) => (
                  <tr key={row.action} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3">
                      <span className="mr-2" aria-hidden>
                        {row.icon}
                      </span>
                      <span className="font-semibold text-ink">
                        {row.label}
                      </span>
                      <span className="block text-xs text-ink-faint">
                        {row.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      +{row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-ink">
            Redeem Your Points
          </h2>
          <div className="mt-4 space-y-3">
            {redeemOptions.map((option) => (
              <div
                key={option.type}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl"
                    aria-hidden
                  >
                    {option.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {option.label}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {option.description}
                    </p>
                  </div>
                </div>
                <div className="w-40 shrink-0">
                  <RedeemButton
                    rewardType={option.type}
                    cost={option.cost}
                    disabled={balance < option.cost}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-ink-faint">
              Redemptions are confirmed by our team — vouchers arrive by email
              within 2 working days.
            </p>
          </div>
        </section>
      </div>

      {/* ── Ledger history ── */}
      <section className="mt-12">
        <h2 className="font-display text-lg font-bold text-ink">Points History</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          {ledger.length === 0 && redemptions.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-faint">
              No points activity yet — complete a lift share, volunteer or
              leave a review to start earning. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {ledger.map((entry) => {
                const meta = ACTION_META[entry.action as RewardAction];
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {meta?.icon ?? "✨"}{" "}
                        {meta?.label ?? entry.action}
                      </p>
                      <p className="text-xs text-ink-faint">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-emerald-600">
                      +{entry.amount}
                    </span>
                  </li>
                );
              })}
              {redemptions.map((redemption) => {
                const meta =
                  REDEMPTION_META[redemption.rewardType as RedemptionType];
                return (
                  <li
                    key={redemption.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {meta?.icon ?? "🎁"}{" "}
                        {meta?.label ?? redemption.rewardType}
                      </p>
                      <p className="text-xs text-ink-faint">
                        Redeemed {formatDate(redemption.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-rose-500">
                      −{redemption.pointsSpent}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ── Sponsor placeholder ── */}
      <section className="mt-12 rounded-xl border border-dashed border-ink/10 bg-paper-warm px-6 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Partner Spotlight
        </p>
        <p className="mt-2 text-sm text-ink-faint">
          Sponsored by{" "}
          <span className="font-semibold text-ink-soft">
            [Your Brand Here]
          </span>{" "}
          — this slot supports the Ubuntu Fund for kids&apos; programmes.
        </p>
        <Link
          href="/for-providers"
          className="mt-3 inline-block text-xs font-semibold text-ilali-600 hover:text-ilali-700"
        >
          Become a sponsor →
        </Link>
      </section>
    </div>
  );
}
