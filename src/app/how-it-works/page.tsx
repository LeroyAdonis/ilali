import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "How It Works | ILALI",
  description:
    "Learn how ILALI works for parents and providers. Find, compare, and get in touch with vetted kids' activities in Cape Town.",
};

const parentSteps = [
  {
    number: 1,
    title: "Search",
    description:
      "Find vetted activities near you — by age, suburb, category, or price. Tell our AI what you need and get matched in seconds.",
    icon: "🔍",
  },
  {
    number: 2,
    title: "Compare",
    description:
      "Read reviews from real parents, check vetting badges, and compare options side by side.",
    icon: "📋",
  },
  {
    number: 3,
    title: "Get in touch",
    description:
      "Contact the provider directly to arrange a trial or sign up. No middleman, no booking fees.",
    icon: "✅",
  },
];

const providerSteps = [
  {
    number: 1,
    title: "List your activity",
    description:
      "Describe your activity and our AI builds your listing for you. Add photos, schedules, pricing, and age groups — no website needed.",
    icon: "📋",
  },
  {
    number: 2,
    title: "Get found",
    description:
      "Parents search by age, suburb, and category. Your listing appears when they look for exactly what you offer.",
    icon: "🔍",
  },
  {
    number: 3,
    title: "Grow your community",
    description:
      "Earn trust badges through reviews and vouches. Reach more families as your reputation grows.",
    icon: "📈",
  },
];

const stepColors = [
  { ring: "border-teal/50 bg-teal/10 text-teal-deep", bar: "bg-teal", tag: "text-teal-deep-2" },
  { ring: "border-purple/50 bg-purple/10 text-purple", bar: "bg-purple", tag: "text-purple-deep" },
  { ring: "border-gold/50 bg-gold/10 text-gold-deep", bar: "bg-gold", tag: "text-gold-deep-2" },
];

function StepCard({
  step,
  idx,
}: {
  step: (typeof parentSteps)[number];
  idx: number;
}) {
  const c = stepColors[idx % stepColors.length];
  return (
    <div className="relative rounded-xl border border-ink/10 bg-white shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden">
      {/* Accent bar */}
      <div className={`h-[5px] w-full ${c.bar}`} />
      <div className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold ${c.ring}`}>
            {step.number}
          </span>
          <span className="text-2xl">{step.icon}</span>
        </div>
        <h3 className="font-display text-lg font-bold text-ink">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {step.description}
        </p>
        <span className={`mt-3 inline-block font-mono text-[10px] uppercase tracking-[0.16em] ${c.tag}`}>
          STEP {String(step.number).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <InteriorHero
          eyebrow="How it works"
          title={<>Simple for <span className="text-teal">parents</span>, powerful for <span className="text-purple">providers</span></>}
          subtitle="Whether you're a parent looking for activities or a provider wanting to reach more families, here's how ILALI works."
          image={HERO_IMAGES['how-it-works']}
        />

        {/* For Parents */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              For Parents
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Three easy steps to get your kid started
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {parentSteps.map((step, idx) => (
              <StepCard key={step.number} step={step} idx={idx} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* For Providers */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              For Providers
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Start reaching more families today
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {providerSteps.map((step, idx) => (
              <StepCard key={step.number} step={step} idx={idx} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="/for-providers"
              className="inline-flex items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 transition-colors"
            >
              List Your Activities
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
