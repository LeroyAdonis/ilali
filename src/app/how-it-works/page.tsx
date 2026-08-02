import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";

export const metadata: Metadata = {
  title: "How It Works | ILALI",
  description:
    "Learn how ILALI works for parents and providers. Browse, book, and attend children's activities with confidence.",
};

const parentSteps = [
  {
    number: 1,
    title: "Browse",
    description:
      "Explore hundreds of vetted activities near you — from art classes to sports. Filter by age, location, category, and price to find the perfect fit.",
    icon: "🔍",
  },
  {
    number: 2,
    title: "Book & Pay",
    description:
      "Once you find an activity you love, book directly through the platform. Pay securely online — no cash, no hassle.",
    icon: "📅",
  },
  {
    number: 3,
    title: "Attend",
    description:
      "Show up and enjoy! Your child gets to learn, play, and grow in a safe, vetted environment. Leave a review afterwards.",
    icon: "🎉",
  },
];

const providerSteps = [
  {
    number: 1,
    title: "List",
    description:
      "Create your profile and list your activities in minutes. Add photos, schedules, pricing, and age groups.",
    icon: "📋",
  },
  {
    number: 2,
    title: "Manage",
    description:
      "Use your dashboard to manage bookings, communicate with parents, and update availability in real time.",
    icon: "⚙️",
  },
  {
    number: 3,
    title: "Grow",
    description:
      "Reach more families, get reviews, and grow your business. ILALI handles payments so you can focus on what you do best.",
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
          subtitle="Whether you're a parent looking for activities or a provider wanting to grow your reach, we make it simple."
          imageSrc="/images/hero/hero-home.jpg"
          imageAlt="How ILALI works"
        />

        {/* For Parents */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              For Parents
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Three easy steps to get your child started
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
