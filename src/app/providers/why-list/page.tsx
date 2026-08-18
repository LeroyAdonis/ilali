import Link from "next/link";
import { Check, TrendingUp, Shield, Star, BarChart3, ArrowRight, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";
import { MONTHLY_PRICING_SHORT, PRICING_FAQ_LONG, TRIAL_CTA_LINE } from "@/lib/pricing";

export const metadata = {
  title: "Why List With Us — ILALI",
};

const comparisons = [
  { ilali: "Targeted audience of local families", other: "Generic social media feed" },
  { ilali: "Verified provider badge builds trust", other: "No verification, hard to stand out" },
  { ilali: "Direct WhatsApp contact from parents", other: "Manual DMs, emails, WhatsApp" },
  { ilali: "Ubuntu Rewards loyalty programme", other: "No recurring engagement" },
  { ilali: "Reviews and ratings from real families", other: "Referrals scattered across group chats" },
  { ilali: "AI-assisted listing from a poster", other: "Manual setup, time-consuming" },
  { ilali: MONTHLY_PRICING_SHORT, other: "Free — but no audience or trust" },
];

const faqs = [
  {
    q: "How much does it cost to list?",
    a: PRICING_FAQ_LONG,
  },
  {
    q: "How long does it take to get approved?",
    a: "Most providers are approved within 48 hours of submitting their background check and verification documents.",
  },
  {
    q: "Do I need my own website?",
      a: "Not at all. ILALI gives you a professional listing page with photos, reviews, and a trust badge — everything parents need to know you're the real deal.",
  },
  {
    q: "Can I offer free trials or promotions?",
    a: "Absolutely! You have full control over your pricing, promotions, and availability.",
  },
  {
    q: "What types of activities are allowed?",
    a: "Any children's extramural activity — sports, arts, music, tutoring, holiday programmes, and more. All providers must pass our vetting process.",
  },
];

export default function WhyListPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <InteriorHero
          eyebrow="For Providers"
          title={<>Why list your activity with <span className="text-warm-300">ILALI</span>?</>}
          subtitle="Stop juggling Facebook groups, WhatsApp messages, and word-of-mouth. List your activity, earn a trust badge, and get discovered by families who are actively searching."
          image={HERO_IMAGES['provider-resources']}
        />

        {/* CTA Buttons */}
        <div className="mx-auto max-w-3xl px-4 pb-8 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/providers/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ilali-700 hover:bg-ilali-50 transition-colors"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 px-6 py-3 text-sm font-semibold text-ink hover:bg-teal/5 transition-colors"
            >
              See what's listed
            </Link>
          </div>
        </div>

        {/* Benefits */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
              The ILALI advantage
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: TrendingUp,
                  title: "More visibility",
                  desc: "Your activities appear in search results, category pages, and AI recommendations for families in your suburb.",
                },
                {
                  icon: Shield,
                  title: "Trust & safety",
                  desc: "Our vetting process and badge system help parents choose you with confidence. Safer for everyone.",
                },
                {
                  icon: Star,
                  title: "Professional listings",
                  desc: "Showcase your activities with photos, descriptions, schedules, and reviews — all in a clean, mobile-friendly format.",
                },
                {
                  icon: BarChart3,
                  title: "Community-powered",
                  desc: "Grow through school partnerships, parent referrals, and community vouches — not ad spend.",
                },
              ].map((b) => (
                <div key={b.title} className="rounded-xl border border-ink/10 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ilali-100 text-ilali-600 mb-3">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink">{b.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-paper-warm py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
              ILALI vs. the alternatives
            </h2>
            <div className="mt-10 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
              <div className="grid grid-cols-3 gap-0 border-b border-ink/10 bg-paper-warm px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
                <div className="col-span-1">Feature</div>
                <div className="col-span-1 text-center text-ilali-600">ILALI</div>
                <div className="col-span-1 text-center text-ink-faint">Other platforms</div>
              </div>
              {comparisons.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 gap-0 px-4 sm:px-6 py-3 text-sm ${
                    i % 2 === 0 ? "bg-white" : "bg-paper-warm/50"
                  }`}
                >
                  <div className="col-span-1 text-ink-soft">{row.ilali.split(" ")[0]}…</div>
                  <div className="col-span-1 flex items-center justify-center gap-1 text-ilali-600 text-xs">
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">{row.ilali}</span>
                  </div>
                  <div className="col-span-1 text-center text-xs text-ink-faint line-clamp-1">{row.other}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-2xl bg-ilali-50 p-8 sm:p-12">
              <p className="text-lg italic leading-relaxed text-ink-soft">
                &ldquo;ILALI is exactly what Cape Town needs. Parents deserve to know who&apos;s looking
                after their kids — and providers deserve a way to be found. We&apos;re proud to
                support this.&rdquo;
              </p>
              <div className="mt-6">
                <p className="text-sm font-bold text-ink">ASSITEJ South Africa</p>
                <p className="text-xs text-ink-faint">Partner, International Association of Theatre for Children</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-paper-warm py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-ink/10 bg-white p-4 open:shadow-sm transition-shadow">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-ink">
                    {faq.q}
                    <HelpCircle className="h-4 w-4 text-ink-faint group-open:rotate-180 transition-transform shrink-0" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft border-t border-ink/10 pt-3">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Ready to grow?
            </h2>
            <p className="mt-3 text-sm text-ink-faint">
              Cape Town providers are already getting listed. {TRIAL_CTA_LINE}
            </p>
            <Link
              href="/providers/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ilali-600 px-8 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
            >
              Start your free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
