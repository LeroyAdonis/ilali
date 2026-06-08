import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Provider Resources
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Everything you need to succeed on ILALI — from getting started to
              growing your activity business.
            </p>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Guides & Resources
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Explore our library of resources designed to help you succeed
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <div
                key={resource.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl">
                  {resource.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {resource.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Need Help? */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-ilali-500 to-ilali-700 px-6 py-12 text-center shadow-lg sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Need Help?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ilali-100">
              Can't find what you're looking for? Our support team is here to
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
