import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ubuntu Rewards | ILALI",
  description:
    "Earn Ubuntu Rewards points for every booking, referral, and review. Redeem for discounts, get early access, and give back to Cape Town kids' programmes.",
};

const tiers = [
  {
    name: "Bronze",
    color: "from-amber-700 to-amber-500",
    badge: "🥉",
    points: "0 – 499",
    perks: ["1 point per R20 spent", "Standard booking access", "Birthday bonus points"],
  },
  {
    name: "Silver",
    color: "from-slate-400 to-slate-300",
    badge: "🥈",
    points: "500 – 1,999",
    perks: [
      "2 points per R20 spent",
      "Early access to new activities",
      "Referral bonus: 100 points",
      "5% discount on every 5th booking",
    ],
    highlighted: false,
  },
  {
    name: "Gold",
    color: "from-yellow-500 to-yellow-400",
    badge: "🥇",
    points: "2,000+",
    perks: [
      "3 points per R20 spent",
      "Priority booking & early access",
      "Referral bonus: 200 points",
      "10% discount on every 3rd booking",
      "Exclusive invites to member events",
    ],
    popular: true,
  },
];

const waysToEarn = [
  {
    icon: "🎯",
    title: "Book Activities",
    desc: "Earn points on every booking — the more activities your family enjoys, the faster your balance grows.",
    rate: "1 pt per R20",
  },
  {
    icon: "👥",
    title: "Refer a Friend",
    desc: "Share ILALI with other families and earn bonus points when they book their first activity.",
    rate: "50–200 pts per referral",
  },
  {
    icon: "⭐",
    title: "Leave Reviews",
    desc: "Help other parents by sharing your experience. Every honest review earns you points.",
    rate: "10 pts per review",
  },
  {
    icon: "📱",
    title: "Daily Check-in",
    desc: "Open the app daily and check in to earn streak bonuses. Consistency pays off.",
    rate: "2 pts per day + streak bonus",
  },
];

const testimonials = [
  {
    quote:
      "I've earned over 800 points just from booking my daughter's weekly art classes and referring two friends. That's R200 off our next holiday camp!",
    name: "Thandi M.",
    role: "Parent, Claremont",
    points: "832 pts earned",
  },
  {
    quote:
      "As a provider, I love that ILALI rewards families for engaging consistently. It means more committed students and a real community feel.",
    name: "Marcus O.",
    role: "Provider, Woodstock",
    points: "Gold Tier Member",
  },
];

export default function UbuntuRewardsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ───── HERO ───── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ilali-700 via-ilali-600 to-sunset-600 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                🏆 Introducing ILALI Ubuntu Rewards
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Earn While Your Family{" "}
                <span className="text-sunset-300">Learns &amp; Plays</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-ilali-100 sm:text-xl">
                Every booking, referral, and review earns you points. Redeem
                them for discounts, get early access to activities, and help
                fund children&apos;s programmes across Cape Town. It&apos;s our way
                of saying <em className="font-semibold text-white">thank you</em>.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-ilali-700 shadow-lg transition-all hover:bg-sunset-50 hover:shadow-xl"
                >
                  Start Earning Rewards
                  <span className="ml-2">→</span>
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/60"
                >
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───── SOCIAL PROOF BAR ───── */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-ilali-700">2,400+</p>
              <p className="text-sm text-slate-500">Active Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-ilali-700">12,500</p>
              <p className="text-sm text-slate-500">Points Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-ilali-700">R8,200</p>
              <p className="text-sm text-slate-500">Saved by Families</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-ilali-700">4.9★</p>
              <p className="text-sm text-slate-500">Member Rating</p>
            </div>
          </div>
        </section>

        {/* ───── THE UBUNTU PHILOSOPHY ───── */}
        <section className="bg-ilali-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                <span className="text-ilali-600">Ubuntu</span>: I Am Because We Are
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Ubuntu Rewards isn&apos;t just a loyalty programme — it&apos;s a
                promise. Every time you earn, a portion goes back into funding
                activities for children who wouldn&apos;t otherwise have access.
                Your family&apos;s growth helps another child grow too.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
              {[
                { icon: "🤝", title: "Community First", desc: "Your rewards help fund programmes in underserved communities." },
                { icon: "♻️", title: "Circle of Giving", desc: "Each booking creates opportunity — for your family and others." },
                { icon: "🌱", title: "Shared Growth", desc: "We grow together. More members = more impact = better rewards." },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-white p-6 text-center shadow-sm">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ilali-100 text-3xl">
                    {item.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── WAYS TO EARN ───── */}
        <section id="how-it-works" className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Ways to Earn
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                There are dozens of ways to earn points. Here are the most popular:
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {waysToEarn.map((way) => (
                <div
                  key={way.title}
                  className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-ilali-300 hover:shadow-md"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-ilali-50 text-2xl transition-colors group-hover:bg-ilali-100">
                    {way.icon}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{way.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{way.desc}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ilali-600">
                    {way.rate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── TIERS TABLE ───── */}
        <section className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Reward Tiers
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                The more you engage, the faster you climb. Each tier unlocks better perks.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition-all hover:shadow-lg ${
                    tier.popular
                      ? "border-ilali-500 ring-2 ring-ilali-200"
                      : "border-slate-200"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-ilali-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
                      Most Popular
                    </span>
                  )}
                  <div className="text-center">
                    <span className="text-4xl">{tier.badge}</span>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-ilali-600">{tier.points} pts</p>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-0.5 text-ilali-500">✓</span>
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── TESTIMONIALS ───── */}
        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                What Members Say
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                Join hundreds of families already earning rewards.
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-1 text-sm text-yellow-400">
                    {"★".repeat(5)}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-700 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                    <span className="rounded-full bg-ilali-50 px-3 py-1 text-xs font-semibold text-ilali-700">
                      {t.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FAQ ───── */}
        <section className="bg-ilali-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Questions?
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                Everything you need to know about Ubuntu Rewards.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl space-y-4">
              {[
                {
                  q: "How do I start earning?",
                  a: "Sign up for a free ILALI account. You'll automatically be enrolled in Ubuntu Rewards at Bronze tier. Start booking activities to earn your first points.",
                },
                {
                  q: "Do my points expire?",
                  a: "Points never expire as long as your account is active. Even if you take a break, your balance stays safe until your next booking.",
                },
                {
                  q: "How do I redeem points?",
                  a: "At checkout, select 'Use Ubuntu Rewards' to apply your points as a discount. 100 points = R50 off. You can also save up for bigger discounts.",
                },
                {
                  q: "What's the community impact?",
                  a: "5% of every booking on ILALI goes into the Ubuntu Fund, which sponsors activities for children in underserved Cape Town communities. Your rewards literally help another child.",
                },
              ].map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-slate-200 bg-white shadow-sm transition-all open:border-ilali-300 open:ring-1 open:ring-ilali-200"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-base font-semibold text-slate-900 transition-colors hover:text-ilali-700">
                    {faq.q}
                    <span className="ml-4 text-xl text-slate-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-6 pb-4 pt-3">
                    <p className="text-sm leading-relaxed text-slate-600">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FINAL CTA ───── */}
        <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ilali-600 via-ilali-700 to-sunset-700 px-8 py-16 text-center shadow-xl sm:px-16">
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />

              <div className="relative">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  Ready to Start Earning?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ilali-100">
                  Join thousands of Cape Town families earning rewards for doing
                  what they already love — booking amazing activities for their
                  kids.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center rounded-full bg-white px-10 py-4 text-base font-semibold text-ilali-700 shadow-lg transition-all hover:bg-sunset-50 hover:shadow-xl"
                  >
                    Join Ubuntu Rewards — Free
                    <span className="ml-2">→</span>
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center rounded-full border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/60"
                  >
                    Browse Activities
                  </Link>
                </div>
                <p className="mt-6 text-sm text-ilali-200">
                  No credit card required. Start at Bronze and climb as you go.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
