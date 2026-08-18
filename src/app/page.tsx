import type { Metadata } from "next";
import Image from "next/image";
import ResponsiveImage from "@/components/ResponsiveImage";
import Header from "@/components/Header";
import { HERO_IMAGES } from "@/lib/images";
import Link from "next/link";
import { ShieldCheck, Search, Users, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "ILALI — Find Vetted Kids' Activities in Cape Town",
  description:
    "Find trusted, background-checked extramural activities for your children in Cape Town. Search by age, location, and price. Free to browse.",
  openGraph: {
    title: "ILALI — Find Vetted Kids' Activities in Cape Town",
    description:
      "Find vetted extramural activities your kids will love. Every provider is background-checked.",
    type: "website",
  },
};

const features = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    iconClass: "bg-teal/10 text-teal-deep",
    accentBar: "bg-teal",
    title: "Every provider is vetted",
    desc: "Background-checked, ID-verified, and reviewed by real families. Child safety comes first.",
    tag: "SHIELD-CHECKED",
    tagClass: "text-teal-deep-2",
  },
  {
    icon: <Search className="h-6 w-6" />,
    iconClass: "bg-purple/10 text-purple",
    accentBar: "bg-purple",
    title: "Find the right fit",
    desc: "Search by age, suburb, category, or price. Tell our AI what you need and get matched in seconds.",
    tag: "AI-MATCHED",
    tagClass: "text-purple-deep",
  },
  {
    icon: <Users className="h-6 w-6" />,
    iconClass: "bg-gold/15 text-gold-deep",
    accentBar: "bg-gold",
    title: "Real community reviews",
    desc: "Built with ASSITEJ SA and BASA. Read real reviews from Cape Town families, and leave your own.",
    tag: "REAL REVIEWS",
    tagClass: "text-gold-deep-2",
  },
];

const steps = [
  {
    num: "01",
    title: "Search",
    desc: "Browse activities by category, age group, location, or price range.",
    numClass: "text-teal-deep border-teal/50 bg-teal/10",
  },
  {
    num: "02",
    title: "Compare",
    desc: "Read real reviews, check vetting badges, and find the perfect fit for your child.",
    numClass: "text-purple border-purple/50 bg-purple/10",
  },
  {
    num: "03",
    title: "Get in touch",
    desc: "Contact the provider directly to book a trial or sign up. No middleman.",
    numClass: "text-gold-deep border-gold/50 bg-gold/10",
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
      {/* ───── NAV (shared Header — same nav as every page) ───── */}
      <Header />

      <main className="flex-1">
        {/* ───── HERO ───── */}
        <section className="relative flex min-h-[85vh] items-center overflow-hidden border-b border-ink/10 bg-paper-warm">
          <div className="absolute inset-0">
            <ResponsiveImage
              image={HERO_IMAGES.landing}
              variant="hero"
              priority
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,253,250,0.97) 0%, rgba(255,253,250,0.88) 30%, rgba(255,253,250,0.30) 58%, rgba(255,253,250,0.04) 100%), linear-gradient(0deg, rgba(255,253,250,0.55) 0%, transparent 40%)",
            }}
          />

          {/* Vetted stamp — signature */}
          <div
            className="absolute right-[7%] top-auto bottom-[16%] z-[3] hidden sm:flex h-[124px] w-[124px] flex-col items-center justify-center rounded-full border-2 border-gold bg-paper/90 shadow-[0_12px_40px_rgba(16,49,46,0.12)] backdrop-blur-sm -rotate-[8deg]"
            aria-hidden="true"
          >
            <span className="absolute inset-1.5 rounded-full border border-dashed border-teal/55" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal-deep -rotate-[8deg]">Vetted</span>
            <span className="font-display text-[22px] font-extrabold text-gold-deep -rotate-[8deg]">★ ✓</span>
            <span className="text-[9px] text-purple -rotate-[8deg]">every provider</span>
          </div>

          {/* Stamp — mobile: tucked top-right, smaller */}
          <div
            className="absolute right-[14px] top-[84px] z-[3] flex sm:hidden h-[84px] w-[84px] flex-col items-center justify-center rounded-full border-2 border-gold bg-paper/90 shadow-[0_12px_40px_rgba(16,49,46,0.12)] backdrop-blur-sm -rotate-[8deg]"
            aria-hidden="true"
          >
            <span className="absolute inset-1 rounded-full border border-dashed border-teal/55" />
            <span className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-teal-deep -rotate-[8deg]">Vetted</span>
            <span className="font-display text-[15px] font-extrabold text-gold-deep -rotate-[8deg]">★ ✓</span>
            <span className="text-[7.5px] text-purple -rotate-[8deg]">every provider</span>
          </div>

          <div className="relative z-[2] w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl">
              <span className="inline-flex items-center gap-2.5 pb-6 font-mono text-xs uppercase tracking-[0.18em] text-teal-deep">
                <span className="text-gold text-sm leading-none">★</span> Cape Town, South Africa · Term 2
                <span className="block h-px w-12 bg-teal/40" />
              </span>
              <h1 className="max-w-[12ch] font-display text-[clamp(2.75rem,6vw,5.5rem)] font-extrabold leading-[0.98] tracking-[-0.02em] text-ink sm:max-w-[12ch] sm:text-[clamp(2.75rem,6vw,5.5rem)]">
                Find activities your <span className="text-gold-deep">kids</span> will <span className="text-teal">love</span>
              </h1>
              <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-ink-soft">
                Cape Town&apos;s trusted place to find <strong className="text-ink font-semibold">safe, vetted</strong> extramural
                activities for your kids. Every provider is background-checked, every review is from a
                <strong className="text-ink font-semibold"> real family</strong>, and you can search by age, suburb, or price.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3.5">
                <Link
                  href="/home"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-gold px-9 py-4 text-[15px] font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] transition-transform hover:bg-[#FFB84D] active:translate-y-px"
                >
                   Browse Activities
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
                <span className="text-teal-deep text-[13px]">✓</span> Free to browse and search
                <span className="text-ink/15">·</span>
                <span className="text-teal-deep text-[13px]">✓</span> Every provider is background-checked
                <span className="text-ink/15">·</span>
                <span className="text-teal-deep text-[13px]">✓</span> No credit card required
              </p>
            </div>
          </div>
        </section>

        {/* ───── SAFEGUARDING TRUST BAR ───── */}
        <section className="border-b border-ink/10 bg-paper-warm py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex items-start sm:items-center gap-3 flex-1">
                <span className="text-xl" role="img" aria-hidden="true">🛡️</span>
                <div>
                  <p className="text-sm font-bold text-ink">Every provider is background-checked</p>
                  <p className="text-xs text-ink-faint mt-0.5">Police clearance verified · ID confirmed · Ongoing review</p>
                </div>
              </div>
              <Link href="/safeguarding" className="text-xs font-semibold text-teal-deep hover:text-teal transition-colors shrink-0">
                Learn more →
              </Link>
            </div>
          </div>
        </section>

        {/* ───── TRUST BAR ───── */}
        <section className="border-b border-ink/10 bg-white py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-10 px-4 sm:px-6 lg:px-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
              Built in partnership with
            </span>
            <img
              src="/images/assitej/assitej-sa-logo.png"
              alt="ASSITEJ South Africa"
              className="h-9 w-auto object-contain opacity-80"
            />
            <img
              src="/images/basa/basa-logo.png"
              alt="Business and Arts South Africa"
              className="h-6 w-auto object-contain opacity-80"
            />
          </div>
        </section>

        {/* ───── FEATURES ───── */}
        <section className="border-b border-ink/10 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-[720px] mb-16">
              <span className="inline-flex items-center gap-2.5 pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Why families choose ILALI
              </span>
              <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
                Everything you need to find the right activity
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
                No more scrolling through Facebook groups or asking around. Everything&apos;s in one place, vetted and verified.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white p-8 transition-transform hover:-translate-y-0.5 hover:border-teal/40 hover:shadow-[0_16px_40px_rgba(16,49,46,0.08)]"
                >
                  <span className={`absolute left-0 top-0 h-full w-1 ${f.accentBar}`} aria-hidden="true" />
                  <span className={`mb-6 inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl ${f.iconClass}`}>
                    {f.icon}
                  </span>
                  <h3 className="mb-2.5 font-display text-[21px] font-bold text-ink">{f.title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-ink-soft">{f.desc}</p>
                  <span className={`mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.18em] ${f.tagClass}`}>
                    {f.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── HOW IT WORKS / TERM PLANNER ───── */}
        <section className="border-b border-ink/10 bg-paper-warm px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2.5 pb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Three simple steps
              </span>
              <h2 className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
                How ILALI works
              </h2>
                <p className="mt-4 mb-8 max-w-[720px] text-[16px] leading-relaxed text-ink-soft">
                From sideline to schedule in three touches — find it, compare it, contact the provider.
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
        </section>

        {/* ───── PROVIDER TEASER ───── */}
        <section className="border-b border-ink/10 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative grid items-center gap-10 overflow-hidden rounded-3xl border border-teal/30 bg-white p-8 sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:p-[60px]">
              <span className="pointer-events-none absolute right-[5%] top-[8%] font-serif text-[130px] leading-none text-gold/10" aria-hidden="true">
                ★
              </span>
              <div>
                <h2 className="font-display text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink">
                  Are you a <span className="text-gold-deep">provider?</span>
                </h2>
                <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-ink-soft">
                  List your activities and reach Cape Town families who are actively searching.
                  Describe your activity and we&apos;ll build your listing for you — no website needed.
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
              <div className="flex items-center justify-center">
                <Image
                  src="/images/hero/art-studio.jpg"
                  alt="Children painting at an art studio"
                  width={400}
                  height={300}
                  className="aspect-[4/3] w-full max-w-[400px] rounded-2xl border border-ink/10 object-cover saturate-[1.05]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ───── FINAL CTA ───── */}
        <section className="px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="mx-auto max-w-[18ch] font-display text-[clamp(2.6rem,5.5vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
              Ready to find your child&apos;s next <span className="text-gold-deep">adventure?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] text-ink-soft">
              Browse vetted activities, read real reviews, and find the perfect match for your child — all in one place.
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
