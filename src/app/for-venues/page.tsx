import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VenuePartnerForm from "./form";

export const metadata: Metadata = {
  title: "For Venues | ILALI",
  description:
    "Partner with ILALI to list your venue for children's activities. Increase footfall, generate extra revenue, and reach more families.",
};

const benefits = [
  {
    title: "Increase Footfall",
    description:
      "Get your venue in front of hundreds of parents searching for activity spaces. Drive more traffic through your doors every week.",
    icon: "🚶",
  },
  {
    title: "Extra Revenue",
    description:
      "Turn empty hours into income. List your available slots and earn every time a provider or parent books your space.",
    icon: "💰",
  },
  {
    title: "Easy Management",
    description:
      "Set your availability, manage bookings, and receive payments — all from a simple dashboard. No complicated systems.",
    icon: "📋",
  },
  {
    title: "Community Impact",
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
    title: "List & Earn",
    description: "Once approved, your venue goes live. Providers can book it and you start earning.",
  },
];

export default function ForVenuesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-sunset-500 to-sunset-700 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Partner With Us
            </h1>
            <p className="mt-3 text-base leading-relaxed text-orange-100 sm:text-lg">
              List your venue on ILALI and connect with activity providers
              looking for the perfect space for children's activities.
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
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Why Partner With ILALI?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Unlock the full potential of your space
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sunset-100 text-2xl">
                  {benefit.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Getting started is easy
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sunset-100 text-lg font-bold text-sunset-700">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Apply Form */}
        <section
          id="apply"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-lg">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Apply to Partner
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
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
