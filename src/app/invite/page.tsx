import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRewardPoints } from "@/lib/data-source";
import { REWARD_ACTIONS } from "@/lib/rewards/calculate";
import { SITE_URL } from "@/lib/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";
import CopyLinkButton from "@/components/invite/CopyLinkButton";
import { Users, Gift, Share2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Invite Parents | ILALI",
  description:
    "Invite other parents to ILALI and earn 200 Ubuntu Rewards points when they sign up and book their first activity.",
};

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // ── Not signed in → prompt ──
  if (!session) {
    return (
      <>
        <Header />
        <main className="flex-1">
          <InteriorHero
            eyebrow="Invite"
            title={
              <>
                Share ILALI,{" "}
                <span className="text-teal">earn</span> together
              </>
            }
            subtitle="Invite other parents to join ILALI. When they sign up and book their first activity, you both earn Ubuntu Rewards points."
            image={HERO_IMAGES['invite']}
          />

          <section className="bg-paper px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-xl rounded-2xl border border-ink/10 bg-white p-10 text-center shadow-sm">
              <span className="text-5xl">👥</span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-ink">
                Sign In to Start Inviting
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                Sign in to get your personal referral link. Share it with other
                parents — when they join and book, you both earn{" "}
                <span className="font-semibold text-amber-600">
                  {REWARD_ACTIONS.referral} points
                </span>
                .
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/signin"
                  className="rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full border border-ink/10 px-6 py-2.5 text-sm font-semibold text-ink-soft hover:border-ilali-300 hover:text-ilali-700 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  // ── Signed in → show referral tools ──
  const userId = session.user.id;
  const referralLink = `${SITE_URL}/auth/signup?ref=${userId}`;

  // Count referrals from reward points ledger
  const ledger = await getRewardPoints(userId);
  const referralCount = ledger.filter((entry) => entry.action === "referral").length;

  const shareText = encodeURIComponent(
    "Join me on ILALI — the trusted marketplace for kids' activities in Cape Town. Sign up with my link and we both earn rewards!"
  );
  const whatsAppUrl = `https://wa.me/?text=${shareText}%20${encodeURIComponent(referralLink)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent("Join ILALI — kids' activities in Cape Town")}&body=${shareText}%0A%0A${referralLink}`;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ── Hero ── */}
        <InteriorHero
          eyebrow="Invite"
          title={
            <>
              Share ILALI,{" "}
              <span className="text-teal">earn</span> together
            </>
          }
          subtitle="Invite other parents to join ILALI. When they sign up and book their first activity, you both earn Ubuntu Rewards points."
          image={HERO_IMAGES['invite']}
        />

        {/* ── Referral tools ── */}
        <section className="bg-paper px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Stats badge */}
            <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm shadow-sm">
                <Gift className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <span className="font-semibold text-ink">
                  {REWARD_ACTIONS.referral} pts
                </span>
                <span className="text-ink-faint">per referral</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm shadow-sm">
                <Users className="h-4 w-4 text-ilali-500" aria-hidden="true" />
                <span className="font-semibold text-ink">{referralCount}</span>
                <span className="text-ink-faint">
                  {referralCount === 1 ? "referral" : "referrals"} so far
                </span>
              </div>
            </div>

            {/* Referral link card */}
            <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-bold text-ink">
                Your referral link
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Share this link with other parents. They&apos;ll land on the
                sign-up page with your referral code attached.
              </p>

              {/* Link display */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink/10 bg-paper-warm p-3">
                <code className="flex-1 break-all text-sm text-ink-soft">
                  {referralLink}
                </code>
              </div>

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <CopyLinkButton referralLink={referralLink} />

                {/* WhatsApp share */}
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-ink/10 bg-[#25D366] px-5 py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#1ebe5b] transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  WhatsApp
                </a>

                {/* Email share */}
                <a
                  href={emailUrl}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-ink/10 bg-white px-5 py-3 text-[14px] font-semibold text-ink-soft hover:bg-paper-warm transition-colors shadow-sm"
                >
                  Email
                </a>
              </div>
            </div>

            {/* How it works */}
            <div className="mt-10 rounded-2xl border border-ink/10 bg-paper-warm p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold text-ink">
                How it works
              </h2>
              <ol className="mt-4 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ilali-600 text-sm font-bold text-white">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Share your link
                    </p>
                    <p className="text-xs text-ink-faint">
                      Send it via WhatsApp, email, or copy and paste it anywhere
                      parents hang out.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ilali-600 text-sm font-bold text-white">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Friends sign up
                    </p>
                    <p className="text-xs text-ink-faint">
                      They create an ILALI account — your referral code is
                      automatically linked.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ilali-600 text-sm font-bold text-white">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      You both earn
                    </p>
                    <p className="text-xs text-ink-faint">
                      When they book their first activity, you both earn{" "}
                      <span className="font-semibold text-amber-600">
                        {REWARD_ACTIONS.referral} Ubuntu Rewards points
                      </span>{" "}
                      each. Redeemable for discounts, free trials, and more.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="mt-6 border-t border-ink/10 pt-5 text-center">
                <Link
                  href="/rewards"
                  className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
                >
                  View your rewards dashboard →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
