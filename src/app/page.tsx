/* Hallmark · macrostructure: Split Studio · genre: playful · theme: ilali-native
 * nav: N1b (canonical SaaS) · footer: Ft5 (Statement)
 * Designed-as-app · design-system: ilali-tokens
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Search, Users, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "ILALI — Find Kids' Activities in Cape Town",
  description:
    "Find background-checked activities your kids will love in Cape Town. Search by category, age, location, and price.",
  openGraph: {
    title: "ILALI — Find Kids' Activities in Cape Town",
    description:
      "Find vetted activities your kids will love. Every provider is background-checked.",
    type: "website",
  },
};

const features = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    iconClass: "bg-teal/10 text-teal-deep",
    accentBar: "bg-teal",
    title: "100% Vetted",
    desc: "Every provider is background-checked. We do the safety work so you don't have to.",
    tag: "SHIELD-CHECKED",
    tagClass: "text-teal-deep-2",
    side: "left" as const,
  },
  {
    icon: <Search className="h-6 w-6" />,
    iconClass: "bg-purple/10 text-purple",
    accentBar: "bg-purple",
    title: "Search & Discover",
    desc: "Browse by category, location, age, or price. Find something your kid will love in minutes.",
    tag: "AI-MATCHED",
    tagClass: "text-purple-deep",
    side: "right" as const,
  },
  {
    icon: <Users className="h-6 w-6" />,
    iconClass: "bg-gold/15 text-gold-deep",
    accentBar: "bg-gold",
    title: "Trusted Community",
    desc: "Built with ASSITEJ SA & BASA. Read real reviews from Cape Town families and leave your own.",
    tag: "REAL REVIEWS",
    tagClass: "text-gold-deep-2",
    side: "left" as const,
  },
];

const steps = [
  {
    num: "01",
    title: "Search",
    desc: "Browse activities by category, age group, location, or what you want to spend.",
    numClass: "text-teal-deep border-teal/50 bg-teal/10",
    accent: "teal" as const,
  },
  {
    num: "02",
    title: "Compare",
    desc: "Read reviews, check ratings, and find the right fit for your kid.",
    numClass: "text-purple border-purple/50 bg-purple/10",
    accent: "purple" as const,
  },
  {
    num: "03",
    title: "Book",
    desc: "Reserve your spot through the platform — quick, straightforward, and secure.",
    numClass: "text-gold-deep border-gold/50 bg-gold/10",
    accent: "gold" as const,
  },
];

const plannerRows = [
  { day: "MON 14:00", name: "Swimming — Aqua Tots", meta: "Ages 4-6 · Claremont", badge: "R220/wk", badgeClass: "border-teal/40 text-teal-deep" },
  { day: "TUE 15:30", name: "Junior Coding Club", meta: "Ages 7-10 · Observatory", badge: "R180/wk", badgeClass: "border-teal/40 text-teal-deep" },
  { day: "THU 16:00", name: "Football — Stars Academy", meta: "Ages 6-12 · Pinelands", badge: "R200/wk", badgeClass: "border-purple/40 text-purple" },
  { day: "SAT 09:00", name: "Art & Craft Studio", meta: "Ages 5-12 · Gardens", badge: "★ MATCH", badgeClass: "border-gold/50 text-gold-deep" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink-soft antialiased">
      {/* ───── NAV ───── */}
      <header className="sticky top-0 z-50 w-full border-b border-ink/10 bg-paper/92 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
            <img
              src="/images/brand/ilali-logo-76-t.png"
              alt="ILALI"
              width={40}
              height={40}
              className="h-10 w-10"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/home" className="px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:text-teal-deep transition-colors rounded-lg">
              Browse Activities
            </Link>
            <Link href="/for-providers" className="px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:text-teal-deep transition-colors rounded-lg">
              For Providers
            </Link>
            <Link href="/how-it-works" className="px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:text-teal-deep transition-colors rounded-lg">
              How it works
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-[10px] border border-ink/15 px-4 py-2 text-[13px] font-semibold text-ink hover:border-teal hover:text-teal-deep transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-[10px] bg-teal-deep px-4 py-2 text-[13px] font-semibold text-white hover:bg-teal transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ═══════ HERO — Split Studio: image right, type left ═══════ */}
        <section className="relative grid min-h-[88vh] items-center overflow-hidden border-b border-ink/10 lg:grid-cols-[1fr_1.15fr]">
          {/* Left: type column */}
          <div className="relative z-[2] order-2 lg:order-1 flex flex-col justify-center px-4 py-16 sm:px-8 lg:px-14 lg:py-0">
            <span className="inline-flex items-center gap-2.5 pb-5 font-mono text-xs uppercase tracking-[0.18em] text-teal-deep">
              <span className="text-gold text-sm leading-none">★</span> Cape Town, South Africa · Term 2
              <span className="block h-px w-10 bg-teal/40" />
            </span>
            <h1 className="max-w-[14ch] font-display text-[clamp(2.6rem,6vw,5rem)] font-extrabold leading-[0.96] tracking-[-0.02em] text-ink">
              Find activities your{" "}
              <span className="text-gold-deep">kids</span> will{" "}
              <span className="text-teal">love</span>
            </h1>
            <p className="mt-6 max-w-[48ch] text-[16px] leading-relaxed text-ink-soft">
              ILALI helps Cape Town parents find activities their kids will love.
              Every provider is <strong className="text-ink font-semibold">background-checked</strong>, every review is from a{" "}
              <strong className="text-ink font-semibold">real family</strong>, and we help you find the right fit.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5">
              <Link
                href="/home"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gold px-9 py-4 text-[15px] font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] transition-transform hover:bg-[#FFB84D] active:translate-y-px"
              >
                Enter ILALI
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </Link>
              <Link
                href="/for-providers"
                className="inline-flex items-center justify-center rounded-[10px] border border-ink/15 px-9 py-4 text-[15px] font-semibold text-ink hover:border-teal hover:text-teal-deep hover:bg-teal/5 transition-colors"
              >
                I&apos;m a provider
              </Link>
            </div>
            <p className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-faint">
              <span className="text-teal-deep text-[13px]">✓</span> No credit card required
              <span className="text-ink/15">·</span>
              <span className="text-teal-deep text-[13px]">✓</span> Free to browse
              <span className="text-ink/15">·</span>
              <span className="text-teal-deep text-[13px]">✓</span> Vetted providers across Cape Town
            </p>
          </div>

          {/* Right: image column — full-bleed into the grid */}
          <div className="relative order-1 lg:order-2 h-[50vh] lg:h-full min-h-[380px] bg-paper-warm">
            <Image
              src="/images/hero/hero-kids.jpg"
              alt="Children playing football at golden hour in Cape Town"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-[62%_40%]"
            />
            {/* Subtle gradient — lighter than before, lets photo breathe */}
            <div
              className="absolute inset-0 lg:bg-gradient-to-r lg:from-paper lg:to-transparent lg:opacity-30"
              aria-hidden="true"
            />
          </div>

          {/* Signature: Vetted stamp — positioned as a photographic annotation */}
          <div
            className="absolute right-5 bottom-6 lg:right-[52%] lg:bottom-8 z-[3] hidden sm:flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full border-2 border-gold bg-paper/92 shadow-[0_8px_30px_rgba(16,49,46,0.10)] backdrop-blur-sm -rotate-[6deg]"
            aria-hidden="true"
          >
            <span className="absolute inset-1.5 rounded-full border border-dashed border-teal/55" />
            <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-teal-deep">Vetted</span>
            <span className="font-display text-[18px] font-extrabold text-gold-deep">★ ✓</span>
            <span className="text-[8px] text-purple">every provider</span>
          </div>
        </section>

        {/* ═══════ TRUST BAND — unified narrow band ═══════ */}
        <section className="border-b border-ink/10 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xl" role="img" aria-hidden="true">🛡️</span>
                <div>
                  <p className="text-sm font-bold text-ink">Every provider is background-checked</p>
                  <p className="text-xs text-ink-faint mt-0.5">Police clearance verified · ID confirmed · Ongoing review</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-8">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                  Built in partnership with
                </span>
                <img
                  src="/images/assitej/assitej-sa-logo.png"
                  alt="ASSITEJ South Africa"
                  className="h-8 w-auto object-contain opacity-75"
                />
                <img
                  src="/images/basa/basa-logo.png"
                  alt="Business and Arts South Africa"
                  className="h-5 w-auto object-contain opacity-75"
                />
              </div>
              <Link href="/safeguarding" className="text-xs font-semibold text-teal-deep hover:text-teal transition-colors shrink-0">
                Learn more →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════ FEATURES — alternating split layout ═══════ */}
        <section className="border-b border-ink/10 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Section head */}
            <div className="mb-16 lg:mb-20">
              <span className="inline-flex items-center gap-2.5 pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Why families choose ILALI
              </span>
              <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
                Everything you need to find the right activity
              </h2>
              <p className="mt-4 max-w-[56ch] text-[16px] leading-relaxed text-ink-soft">
                No more scrolling through Facebook groups or asking around. Everything&apos;s in one place, vetted and ready to go.
              </p>
            </div>

            {/* Split feature rows — alternating left/right */}
            <div className="flex flex-col gap-14 lg:gap-20">
              {features.map((f) => {
                const isLeft = f.side === "left";
                return (
                  <div
                    key={f.title}
                    className={`grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14 ${!isLeft ? "lg:[direction:rtl]" : ""}`}
                  >
                    {/* Text side */}
                    <div className={!isLeft ? "lg:[direction:ltr]" : ""}>
                      <span className={`mb-5 inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl ${f.iconClass}`}>
                        {f.icon}
                      </span>
                      <h3 className="mb-3 font-display text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-ink leading-[1.15]">
                        {f.title}
                      </h3>
                      <p className="max-w-[44ch] text-[15px] leading-relaxed text-ink-soft">{f.desc}</p>
                      <span className={`mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.18em] ${f.tagClass}`}>
                        {f.tag}
                      </span>
                    </div>
                    {/* Visual side — decorative color bar + abstract proof element */}
                    <div className={`${!isLeft ? "lg:[direction:ltr]" : ""}`}>
                      <div className={`relative overflow-hidden rounded-2xl border border-ink/10 bg-paper-warm p-10 lg:p-14 flex items-center justify-center min-h-[240px] ${isLeft ? "lg:ml-0" : "lg:mr-0"}`}>
                        {/* Abstract accent geometry — distinctive signature element */}
                        <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
                          <div className={`absolute top-0 ${isLeft ? "right-0" : "left-0"} h-full w-[40%] ${f.accentBar}`} />
                          <div className={`absolute ${isLeft ? "left-[20%]" : "right-[20%]"} top-[15%] h-[70%] w-[2px] bg-ink/20 rounded-full`} />
                          <div className={`absolute ${isLeft ? "left-[35%]" : "right-[35%]"} top-[25%] h-[50%] w-[2px] bg-ink/10 rounded-full`} />
                        </div>
                        <span className={`relative inline-flex h-[80px] w-[80px] items-center justify-center rounded-2xl ${f.iconClass} shadow-[0_8px_30px_rgba(16,49,46,0.06)]`}>
                          <span className="scale-[1.8]">{f.icon}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════ HOW IT WORKS + TERM PLANNER — the signature split ═══════ */}
        <section className="border-b border-ink/10 bg-paper-warm px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-start gap-14 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2.5 pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Three simple steps
              </span>
              <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
                How ILALI works
              </h2>
              <p className="mt-4 mb-8 max-w-[720px] text-[16px] leading-relaxed text-ink-soft">
                From sideline to schedule: find it, compare it, book it.
              </p>
              <div className="flex flex-col gap-7">
                {steps.map((step) => (
                  <div key={step.num} className="flex gap-5">
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border font-mono text-[13px] ${step.numClass}`}>
                      {step.num}
                    </span>
                    <div>
                      <h3 className="mb-1.5 font-display text-[19px] font-bold text-ink">{step.title}</h3>
                      <p className="text-[14.5px] leading-relaxed text-ink-soft">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/how-it-works"
                className="mt-9 inline-flex items-center gap-2 text-[13px] font-semibold text-teal-deep hover:text-teal transition-colors"
              >
                Learn more about how ILALI works →
              </Link>
            </div>

            {/* Term planner — signature structure */}
            <div className="lg:sticky lg:top-28">
              <div
                className="overflow-hidden rounded-2xl border border-gold/35 bg-white shadow-[0_24px_60px_rgba(16,49,46,0.10)]"
                aria-hidden="true"
              >
                <div className="flex items-center justify-between border-b border-gold/25 bg-gradient-to-b from-gold/5 to-gold/2 px-5 py-4">
                  <span className="font-display text-[15px] font-bold text-ink">TERM 2 · WEEK 6</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold-deep">CPT · SOUTH</span>
                </div>
                {plannerRows.map((row) => (
                  <div
                    key={row.day}
                    className="grid grid-cols-[72px_1fr] sm:grid-cols-[72px_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-ink/10 px-5 py-5 last:border-b-0"
                  >
                    <span className="font-mono text-xs text-gold-deep">{row.day}</span>
                    <div>
                      <div className="text-[15px] font-semibold text-ink">{row.name}</div>
                      <div className="mt-0.5 text-xs text-ink-soft">{row.meta}</div>
                    </div>
                    <span className={`sm:col-auto col-[2] justify-self-start mt-[-6px] sm:mt-0 rounded-full border px-2.5 py-1 text-[10px] whitespace-nowrap ${row.badgeClass}`}>
                      {row.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ PROVIDER TEASER — split: image left, type right ═══════ */}
        <section className="border-b border-ink/10 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative grid items-center gap-10 overflow-hidden rounded-3xl border border-teal/30 bg-white p-8 sm:p-12 lg:grid-cols-[1fr_1.4fr] lg:p-[60px]">
              <span className="pointer-events-none absolute right-[5%] top-[8%] font-serif text-[130px] leading-none text-gold/10" aria-hidden="true">
                ★
              </span>
              {/* Image side — left on desktop */}
              <div className="flex items-center justify-center order-2 lg:order-1">
                <Image
                  src="/images/hero/art-studio.jpg"
                  alt="Children painting at an art studio"
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full max-w-[400px] rounded-2xl border border-ink/10 object-cover saturate-[1.05]"
                />
              </div>
              {/* Text side — right on desktop */}
              <div className="order-1 lg:order-2">
                <h2 className="font-display text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink">
                  Are you a <span className="text-gold-deep">provider?</span>
                </h2>
                <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">
                  List your activities for free and reach Cape Town families.
                  Just describe your activity and we&apos;ll build your listing for you.
                </p>
                <div className="mt-7 flex flex-wrap gap-3.5">
                  <Link
                    href="/for-providers"
                    className="inline-flex items-center rounded-[10px] bg-gold px-7 py-3.5 text-sm font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] hover:bg-[#FFB84D] transition-colors"
                  >
                    Learn about listing →
                  </Link>
                  <Link
                    href="/providers/signup"
                    className="inline-flex items-center rounded-[10px] border border-ink/15 px-7 py-3.5 text-sm font-semibold text-ink hover:border-teal hover:text-teal-deep transition-colors"
                  >
                    List your activity
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════ FINAL CTA — centered, the anchor ═══════ */}
        <section className="px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mx-auto max-w-[18ch] font-display text-[clamp(2.6rem,5.5vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
              Ready to find your kid&apos;s next <span className="text-gold-deep">adventure?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] text-ink-soft">
              Browse vetted activities, read real reviews, and find the right fit for your family.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <Link
                href="/home"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gold px-9 py-4 text-[15px] font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] hover:bg-[#FFB84D] transition-colors"
              >
                Browse Activities
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-[10px] border border-ink/15 px-9 py-4 text-[15px] font-semibold text-ink hover:border-teal hover:text-teal-deep transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-ink/10 bg-paper-warm px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/brand/ilali-logo-76-t.png"
                alt="ILALI"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="font-display text-[17px] font-extrabold text-ink">ILALI</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-ink-faint">
              <Link href="/about" className="hover:text-teal-deep transition-colors">About</Link>
              <Link href="/contact" className="hover:text-teal-deep transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-teal-deep transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-teal-deep transition-colors">Terms</Link>
              <span className="text-ink-faint">&copy; {new Date().getFullYear()} Arts4Youth</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
