import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ubuntu Rewards | ILALI",
  description:
    "Earn Ubuntu Rewards points by booking activities, referring friends, and leaving reviews. Redeem points for discounts on future bookings.",
};

const steps = [
  {
    number: 1,
    title: "Earn Points",
    description:
      "Earn points every time you book an activity, refer a friend, or leave a review. The more you engage with the ILALI community, the more you earn.",
  },
  {
    number: 2,
    title: "Track Your Rewards",
    description:
      "Monitor your points balance from your ILALI dashboard. Your points accumulate across all your bookings and referrals — you'll never lose them.",
  },
  {
    number: 3,
    title: "Redeem & Save",
    description:
      "Redeem your points for discounts on future activity bookings. The more points you earn, the bigger the savings for your family's next adventure.",
  },
];

const benefits = [
  {
    title: "Book Activities",
    description:
      "Earn 5 points for every R100 spent on activity bookings. The more activities your family enjoys, the faster your points grow.",
    icon: "🎯",
  },
  {
    title: "Refer Friends",
    description:
      "Refer a friend to ILALI and earn 50 points when they complete their first booking. There's no limit to how many friends you can refer.",
    icon: "👥",
  },
  {
    title: "Leave Reviews",
    description:
      "Share your experience and help other families. Earn 10 points for every review you leave after an activity.",
    icon: "⭐",
  },
];

const perks = [
  {
    title: "Redeem for Discounts",
    description:
      "100 points = R50 off your next booking. Points never expire as long as your account is active.",
  },
  {
    title: "Exclusive Access",
    description:
      "Rewards members get early access to new activities and special events before they open to the public.",
  },
  {
    title: "Community Impact",
    description:
      "A portion of every booking supports children's programmes in underserved communities across South Africa.",
  },
];

export default function UbuntuRewardsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ubuntu Rewards
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              Earn points while your family learns, plays, and grows. Our
              rewards programme gives back to the community that makes ILALI
              special.
            </p>
          </div>
        </section>

        {/* Description */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base leading-relaxed text-slate-600">
              Ubuntu Rewards is our way of saying thank you. Every time you
              book an activity, refer another family, or share your experience
              through a review, you earn points that can be redeemed for
              discounts on future bookings. The more you participate in the
              ILALI community, the more you save.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Three simple steps to start earning rewards
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-lg font-bold text-ilali-700">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Ways to Earn */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Ways to Earn
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Every action earns you points
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  {benefit.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Perks & Benefits
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              More than just points
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {perk.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-ilali-50 px-8 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Start Earning Today
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              Sign up or log in to start earning Ubuntu Rewards. Every booking,
              referral, and review brings you closer to your next discount.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/auth/signup"
                className="inline-flex items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
              >
                Create an Account
              </a>
              <a
                href="/auth/signin"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                Sign In
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
