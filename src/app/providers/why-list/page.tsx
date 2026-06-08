import Link from "next/link";
import { Check, TrendingUp, Shield, Star, BarChart3, ArrowRight, HelpCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Why List With Us — ILALI",
};

const comparisons = [
  { ilali: "Targeted audience of local families", other: "Generic social media feed" },
  { ilali: "Verified provider badge builds trust", other: "No verification, hard to stand out" },
  { ilali: "Built-in booking & payment system", other: "Manual DMs, invoices, WhatsApp" },
  { ilali: "Ubuntu Rewards loyalty programme", other: "No recurring engagement" },
  { ilali: "Reviews and ratings from real customers", other: "Referrals scattered across platforms" },
  { ilali: "Marketing exposure to thousands of users", other: "Your posts get buried in algorithms" },
  { ilali: "R99/month — first 30 days free", other: "Free — but no tools or audience" },
];

const faqs = [
  {
    q: "How much does it cost to list?",
    a: "Just R99 per month, and your first 30 days are completely free. No setup fees, no hidden costs.",
  },
  {
    q: "How long does it take to get approved?",
    a: "Most providers are approved within 48 hours of submitting their background check and verification documents.",
  },
  {
    q: "Do I need my own website?",
    a: "Not at all. ILALI gives you a full listing page with scheduling, reviews, and messaging — everything you need.",
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
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs uppercase tracking-widest text-ilali-200 font-semibold">
              For providers
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Why list your activity with <span className="text-warm-300">ILALI</span>?
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Stop juggling social media, spreadsheets, and WhatsApp messages. One platform to manage
              it all — and reach families who are ready to book.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/providers/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ilali-700 hover:bg-ilali-50 transition-colors"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                See what's listed
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              The ILALI advantage
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: TrendingUp,
                  title: "More visibility",
                  desc: "Your activities appear in search results, category pages, and personalised recommendations to thousands of local families.",
                },
                {
                  icon: Shield,
                  title: "Trust & safety",
                  desc: "Our vetting process and verified badge system help parents choose you with confidence. Safer for everyone.",
                },
                {
                  icon: Star,
                  title: "Beautiful listings",
                  desc: "Showcase your activities with photos, descriptions, schedules, and reviews — all in a professional, mobile-friendly format.",
                },
                {
                  icon: BarChart3,
                  title: "Grow smarter",
                  desc: "Track views, bookings, and earnings with built-in analytics. Know what works and double down on it.",
                },
              ].map((b) => (
                <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ilali-100 text-ilali-600 mb-3">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              ILALI vs. the alternatives
            </h2>
            <div className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-3 gap-0 border-b border-slate-200 bg-slate-50 px-4 sm:px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div className="col-span-1">Feature</div>
                <div className="col-span-1 text-center text-ilali-600">ILALI</div>
                <div className="col-span-1 text-center text-slate-400">Other platforms</div>
              </div>
              {comparisons.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 gap-0 px-4 sm:px-6 py-3 text-sm ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <div className="col-span-1 text-slate-600">{row.ilali.split(" ")[0]}…</div>
                  <div className="col-span-1 flex items-center justify-center gap-1 text-ilali-600 text-xs">
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">{row.ilali}</span>
                  </div>
                  <div className="col-span-1 text-center text-xs text-slate-400 line-clamp-1">{row.other}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-2xl bg-ilali-50 p-8 sm:p-12">
              <p className="text-lg italic leading-relaxed text-slate-700">
                &ldquo;ILALI transformed how we manage our classes. Instead of juggling WhatsApp groups
                and spreadsheets, everything is in one place. Our bookings doubled in the first month.&rdquo;
              </p>
              <div className="mt-6">
                <p className="text-sm font-bold text-slate-900">Sarah N.</p>
                <p className="text-xs text-slate-500">Art Studio Cape Town</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl mb-10">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-slate-200 bg-white p-4 open:shadow-sm transition-shadow">
                  <summary className="flex items-center justify-between cursor-pointer text-sm font-semibold text-slate-900">
                    {faq.q}
                    <HelpCircle className="h-4 w-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-3">
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
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Ready to grow?
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Join hundreds of providers on ILALI. First 30 days free — no strings attached.
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
