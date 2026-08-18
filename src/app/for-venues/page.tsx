import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VenuePartnerForm from "./form";

export const metadata: Metadata = {
  title: "For Venues | ILALI",
  description:
    "Partner with ILALI to list your venue for children's activities. Get discovered by providers looking for safe, welcoming spaces.",
};

const benefits = [
  {
    title: "Get discovered",
    description:
      "Providers searching for activity spaces in your area find your venue. No more relying on word-of-mouth alone.",
    icon: "🔍",
  },
  {
    title: "Fill empty slots",
    description:
      "List your available hours and days. Providers looking for a home for their activities can see what you offer.",
    icon: "📅",
  },
  {
    title: "Build trust",
    description:
      "A professional venue listing with photos, amenities, and details helps providers choose your space with confidence.",
    icon: "🛡️",
  },
  {
    title: "Community impact",
    description:
      "Support local children's activities by providing safe, welcoming spaces for learning, playing, and growing.",
    icon: "🤝",
  },
];

const steps = [
  {
    number: 1,
    title: "Apply",
    description: "Tell us about your venue — location, capacity, amenities, and available hours.",
  },
  {
    number: 2,
    title: "Verify",
    description: "We'll review your space and conduct a safety check to ensure it meets our standards.",
  },
  {
    number: 3,
    title: "Get found",
    description: "Once approved, your venue appears in provider searches. Providers reach out directly to arrange bookings.",
  },
];

export default function ForVenuesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-teal-deep px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Partner With Us
            </h1>
            <p className="mt-3 text-base leading-relaxed text-orange-100 sm:text-lg">
              List your venue on ILALI so activity providers can find the perfect space for
              children&apos;s activities in your area.
            </p>
            <a
              href="#apply"
              className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-sunset-700 shadow-sm hover:bg-orange-50 transition-colors"
            >
              Apply Now
            </a>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Why Partner With ILALI?
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Get your space in front of the providers who need it
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-ink/10 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sunset-100 text-2xl">
                  {benefit.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Getting started is easy
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-ink/10 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunset-100 text-lg font-bold text-sunset-700">
                  {step.number}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Apply Form */}
        <section
          id="apply"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-lg">
            <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
              Apply to Partner
            </h2>
            <p className="mt-2 text-center text-sm text-ink-faint">
              Tell us about your venue and we'll be in touch.
            </p>
            <VenuePartnerForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
