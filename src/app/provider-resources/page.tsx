import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";
import AIOnboardingForm from "@/components/AIOnboardingForm";

export const metadata: Metadata = {
  title: "Provider Resources | ILALI",
  description:
    "Resources and guides for ILALI activity providers. Learn how to get started, manage bookings, and grow your business.",
};

const resources = [
  {
    title: "Getting Started Guide",
    description:
      "Learn how to create your provider profile, set up your activities, and publish your first listing step by step.",
    icon: "🚀",
  },
  {
    title: "Vetting Process",
    description:
      "Understand our background check and verification process. See what documents are required and how long it takes.",
    icon: "🛡️",
  },
  {
    title: "Managing Bookings",
    description:
      "Tips for handling incoming bookings, communicating with parents, and managing your schedule efficiently.",
    icon: "📅",
  },
  {
    title: "Best Practices",
    description:
      "Proven strategies to attract more families, get great reviews, and build a thriving activity business.",
    icon: "💡",
  },
  {
    title: "Video Tutorials",
    description:
      "Watch walkthrough videos covering the ILALI dashboard, booking management, and provider tools.",
    icon: "🎬",
  },
  {
    title: "FAQs",
    description:
      "Find answers to frequently asked questions about listing, payments, cancellations, and more.",
    icon: "❓",
  },
];

export default function ProviderResourcesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <InteriorHero
          eyebrow="Resources"
          title={<><span className="text-teal">Provider</span> Resources</>}
          subtitle="Everything you need to succeed on ILALI — from getting started to growing your activity business."
          image={HERO_IMAGES['provider-resources']}
        />

        {/* Resources Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Guides & Resources
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Explore our library of resources designed to help you succeed
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <div
                key={resource.title}
                className="rounded-xl border border-ink/10 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl">
                  {resource.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {resource.description}
                </p>
              </div>
            ))}
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

        {/* Need Help? */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-paper-warm px-6 py-12 text-center shadow-lg sm:px-12">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Need Help?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">
              Can&apos;t find what you&apos;re looking for? Our support team is here to
              help you every step of the way.
            </p>
            <a
              href="/contact"
              className="mt-6 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-ilali-700 shadow-sm hover:bg-ilali-50 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
