import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIOnboardingForm from "@/components/AIOnboardingForm";
import ProviderInquiryForm from "./form";
import { pricing, PRICING_ONE_LINER, PRICING_CARD_LINE } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "For Providers | ILALI",
  description: `List your kids' activities on ILALI. Reach more families, manage bookings, and grow your business. ${PRICING_ONE_LINER}.`,
};

import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";

const BENEFIT_COLORS = [
  { bar: "bg-teal", icon: "bg-teal/10 text-teal-deep", tag: "text-teal-deep-2" },
  { bar: "bg-gold", icon: "bg-gold/10 text-gold-deep", tag: "text-gold-deep-2" },
  { bar: "bg-purple", icon: "bg-purple/10 text-purple-deep", tag: "text-purple-deep" },
  { bar: "bg-orange", icon: "bg-orange/10 text-orange", tag: "text-orange" },
];

const benefits = [
  {
    title: "Dashboard",
    description:
      "Manage everything from one place: bookings, messages, payments, and analytics. See how you're doing at a glance.",
    icon: "📊",
  },
  {
    title: "Scheduling",
    description:
      "Set your availability, create recurring sessions, and let parents book directly. No more back-and-forth coordination.",
    icon: "📅",
  },
  {
    title: "Payments",
    description:
      "Secure online payments with automatic payouts. No chasing invoices or handling cash — we handle it all.",
    icon: "💳",
  },
  {
    title: "Messaging",
    description:
      "Built-in messaging so you can chat directly with parents about schedules, updates, and anything specific your activity needs.",
    icon: "💬",
  },
];

export default function ForProvidersPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <InteriorHero
          eyebrow="For Providers"
          title={<>List your <span className="text-teal">activities</span>, grow your <span className="text-gold-deep">reach</span></>}
          subtitle="Join the platform that connects you with families looking for quality kids' activities in your area."
          image={HERO_IMAGES['for-providers']}
        />

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Everything you need to succeed
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Tools to help you manage and grow your activity business
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, idx) => {
              const c = BENEFIT_COLORS[idx % BENEFIT_COLORS.length];
              return (
              <div
                key={benefit.title}
                className="rounded-xl border border-ink/10 bg-white shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden"
              >
                <div className={`h-[5px] w-full ${c.bar}`} />
                <div className="p-6">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-2xl ${c.icon}`}>
                  {benefit.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {benefit.description}
                </p>
                <span className={`mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.16em] ${c.tag}`}>
                  FEATURE {String(idx + 1).padStart(2, "0")}
                </span>
                </div>
              </div>
            )})}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Pricing */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border-2 border-ilali-200 bg-white p-8 text-center shadow-lg">
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Simple pricing
              </h2>
              <p className="mt-2 text-sm text-ink-faint">
                No hidden fees. No surprises.
              </p>
              <div className="mt-6">
                <span className="text-5xl font-extrabold text-ilali-600">
                  R{pricing.monthlyFeeRands}
                </span>
                <span className="text-lg text-ink-faint">/month</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {PRICING_CARD_LINE}
              </p>
              <ul className="mx-auto mt-6 space-y-3 text-left text-sm text-ink-soft">
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Full provider profile and listing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Booking and scheduling dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Secure payment processing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Parent messaging
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Reviews and ratings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Priority support
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* AI-Powered Onboarding */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <AIOnboardingForm />
          </div>
        </section>

        {/* Sign-up Form */}
        <section
          id="signup"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-lg">
            <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
              Start listing today
            </h2>
            <p className="mt-2 text-center text-sm text-ink-faint">
              Fill in the form below and we&apos;ll be in touch.
            </p>
            <ProviderInquiryForm />
            <div className="mt-8 rounded-xl border border-ink/10 bg-white p-6 text-center shadow-sm">
              <h3 className="font-display text-lg font-bold text-ink">
                Ready to get started?
              </h3>
              <p className="mt-1 text-sm text-ink-faint">
                Our AI-powered wizard walks you through it in about 5 minutes.
              </p>
              <Link
                href="/providers/signup"
                className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
              >
                List your activity →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
