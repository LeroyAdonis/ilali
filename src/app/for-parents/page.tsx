import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Parents | ILALI",
  description:
    "A parent's guide to finding safe, vetted extramural activities in Cape Town. Learn how vetting works, what to expect, and how to get started.",
};

export default function ForParentsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              A parent&apos;s guide to ILALI
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Everything you need to know about finding safe, fun activities
              for your children — from how vetting works to what happens after
              you book.
            </p>
          </div>
        </section>

        {/* How vetting works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How vetting works
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Every provider on ILALI goes through a verification process before
              they can list activities. Here&apos;s what that means for your family:
            </p>
            <div className="mt-8 space-y-6">
              {[
                {
                  q: "Background checks",
                  a: "Every provider submits a police clearance or equivalent background check. We verify the document, not just collect it. This applies to all staff who work with children.",
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
                  a: "Each provider profile shows their vetting badge, how long they've been on ILALI, ratings from other parents, and a detailed description of their offering and credentials.",
                },
              ].map((item) => (
                <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Tips for choosing */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Tips for choosing the right activity
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Not sure where to start? Here are a few things parents tell us
              make the biggest difference:
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: "🎯",
                  title: "Follow their interests",
                  desc: "Start with what your child already loves — art, sport, music, or something new. The best activities are the ones they're excited about.",
                },
                {
                  icon: "📍",
                  title: "Consider location",
                  desc: "Filter by neighbourhood to find activities close to home, school, or along your regular route. Less travel means more consistency.",
                },
                {
                  icon: "📅",
                  title: "Check the schedule",
                  desc: "Look at session times, frequency, and whether it fits your weekly routine. Many providers offer trial sessions before committing.",
                },
                {
                  icon: "⭐",
                  title: "Read reviews",
                  desc: "Real feedback from other parents tells you more than any description. Look for consistent positive patterns, not just star ratings.",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="mt-0.5 text-2xl">{tip.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{tip.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Ubuntu Rewards for parents */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Earn while your kids grow
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              ILALI&apos;s Ubuntu Rewards programme means every booking does more
              than just keep your child busy — it earns points, unlocks
              discounts, and supports kids who wouldn&apos;t otherwise have access.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Points per booking", value: "1pt / R20" },
                { label: "Referral bonus", value: "50–200 pts" },
                { label: "Community fund", value: "5% per booking" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-500">{item.label}</p>
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
          <hr className="border-slate-200" />
        </div>

        {/* Getting started checklist */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Getting started checklist
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                { step: "1", text: "Create your free ILALI account — no credit card needed" },
                { step: "2", text: "Set your location to see activities near you" },
                { step: "3", text: "Browse by category, age, or use the search bar" },
                { step: "4", text: "Read provider profiles, reviews, and check their vetting status" },
                { step: "5", text: "Book a session or trial — pay securely through the platform" },
                { step: "6", text: "Leave a review afterwards to help other parents" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-xs font-bold text-ilali-700">
                    {item.step}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-ilali-500 to-ilali-700 px-6 py-12 text-center shadow-lg sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to find the perfect activity?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ilali-100">
              Browse hundreds of trusted activities near you and book with confidence.
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
