import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

function StepCard({
  step,
}: {
  step: (typeof parentSteps)[number];
}) {
  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ilali-100 text-lg font-bold text-ilali-700">
          {step.number}
        </span>
        <span className="text-2xl">{step.icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {step.description}
      </p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              How It Works
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Whether you are a parent looking for activities or a provider
              wanting to grow your reach, we make it simple.
            </p>
          </div>
        </section>

        {/* For Parents */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              For Parents
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Three easy steps to get your child started
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {parentSteps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* For Providers */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              For Providers
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Start reaching more families today
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {providerSteps.map((step) => (
              <StepCard key={step.number} step={step} />
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
