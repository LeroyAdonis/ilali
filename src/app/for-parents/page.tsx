import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "For Parents | ILALI",
  description:
    "A parent's guide to finding safe, vetted activities for your kids in Cape Town. How vetting works, what to expect, and how to get started.",
};

export default function ForParentsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <InteriorHero
          eyebrow="For Parents"
          title="A parent's guide to ILALI"
          subtitle="Everything you need to know about finding safe, fun activities for your kids — how vetting works, what to expect, and what happens after you book."
          image={HERO_IMAGES['home']}
        />

        {/* How vetting works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              How vetting works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Every provider on ILALI goes through a verification process before
              they can list activities. Here&apos;s what that means for your family:
            </p>
            <div className="mt-8 space-y-6">
              {[
                {
                  q: "Background checks",
                  a: "Every provider submits a police clearance or equivalent background check. We verify the document, not just collect it. This applies to all staff who work with kids.",
                },
                {
                  q: "Identity verification",
                  a: "Providers must verify their identity and business details. We cross-reference against public records to confirm they are who they say they are.",
                },
                {
                  q: "Ongoing monitoring",
                  a: "Vetting isn't a one-time thing. Providers are periodically re-checked, and parents can report concerns at any time. A provider's status is clearly shown on their profile.",
                },
                {
                  q: "What you see on a profile",
                  a: "Each provider profile shows their vetting badge, how long they've been on ILALI, ratings from other parents, and a clear description of what they offer.",
                },
              ].map((item) => (
                <div key={item.q} className="rounded-xl border border-ink/10 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-base font-semibold text-ink">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Tips for choosing */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Tips for choosing the right activity
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Not sure where to start? Here are a few things parents tell us
              make the biggest difference:
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: "🎯",
                  title: "Follow their interests",
                  desc: "Start with what your kid already loves — art, sport, music, or something new. The best activities are the ones they're excited about.",
                },
                {
                  icon: "📍",
                  title: "Consider location",
                  desc: "Filter by neighbourhood to find activities close to home, school, or along your regular route. Less travel means you'll actually get there each week.",
                },
                {
                  icon: "📅",
                  title: "Check the schedule",
                  desc: "Look at session times, frequency, and whether it fits your weekly routine. Many providers offer trial sessions before committing.",
                },
                {
                  icon: "⭐",
                  title: "Read reviews",
                  desc: "Real feedback from other parents tells you more than any description. Look for patterns in what they say, not just the star rating.",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
                >
                  <span className="mt-0.5 text-2xl">{tip.icon}</span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-ink">{tip.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-faint">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Ubuntu Rewards for parents */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Earn while your kids grow
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              ILALI&apos;s Ubuntu Rewards programme means every booking does more than just keep your kid busy — it earns points, unlocks
              discounts, and supports kids who wouldn&apos;t otherwise have access.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Points per booking", value: "1pt / R20" },
                { label: "Referral bonus", value: "50–200 pts" },
                { label: "Community fund", value: "5% per booking" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-ink/10 bg-paper-warm p-4 text-center">
                  <p className="text-xs text-ink-faint">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-ilali-700">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/ubuntu-rewards"
                className="inline-flex items-center gap-1 text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                See full Ubuntu Rewards details →
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Getting started checklist */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Getting started checklist
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { step: "1", text: "Create your free ILALI account — no credit card needed" },
                { step: "2", text: "Set your location to see activities near you" },
                { step: "3", text: "Browse by category, age, or use the search bar" },
                { step: "4", text: "Read provider profiles, reviews, and check their vetting badge" },
                { step: "5", text: "Book a session or trial — pay securely through the platform" },
                { step: "6", text: "Leave a review afterwards to help other moms and dads" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-xs font-bold text-ilali-700">
                    {item.step}
                  </span>
                  <span className="text-sm leading-relaxed text-ink-soft">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-paper-warm px-6 py-12 text-center shadow-lg sm:px-12">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Ready to find the right activity for your kid?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
              Browse activities near you and book with confidence.
            </p>
            <Link
              href="/home"
              className="mt-6 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-ilali-700 shadow-sm hover:bg-ilali-50 transition-colors"
            >
              Go to ILALI
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
