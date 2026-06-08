import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "For Parents | ILALI",
  description:
    "Find trusted, background-checked activities for your children. Browse, book, and review with confidence on ILALI.",
};

const howItWorks = [
  {
    title: "Browse & Discover",
    description:
      "Explore activities by location, category, or age group. Read detailed profiles and see what other parents recommend.",
    icon: "🔍",
  },
  {
    title: "Book with Confidence",
    description:
      "Every provider is background-checked and verified. Book directly through our secure platform with transparent pricing.",
    icon: "✅",
  },
  {
    title: "Enjoy & Review",
    description:
      "After the activity, leave a review to help other parents. Your feedback keeps our community thriving.",
    icon: "⭐",
  },
];

const whyChoose = [
  {
    title: "Vetted Providers Only",
    description:
      "Every activity provider undergoes a thorough background check before they can list on ILALI. Your child's safety comes first.",
    icon: "🛡️",
  },
  {
    title: "Activities Near You",
    description:
      "Find activities in your neighbourhood — from Southern Suburbs to the Atlantic Seaboard. No more driving across town.",
    icon: "📍",
  },
  {
    title: "Easy Booking & Tracking",
    description:
      "Book, reschedule, and manage all your children's activities from one dashboard. Get reminders and updates automatically.",
    icon: "📱",
  },
  {
    title: "Community Reviews",
    description:
      "Real reviews from real parents. See what others say about providers before you book, and share your own experience.",
    icon: "💬",
  },
];

export default function ForParentsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Find trusted activities for your children
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Discover safe, fun, and enriching extramural activities near you.
              Every provider is background-checked for your peace of mind.
            </p>
            <a
              href="/browse"
              className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ilali-700 shadow-sm hover:bg-ilali-50 transition-colors"
            >
              Browse activities
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Three simple steps to find the perfect activity
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {howItWorks.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ilali-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="mt-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl">
                  {step.icon}
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

        {/* Why Parents Choose ILALI */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Why Parents Choose ILALI
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Built with your family's safety and convenience in mind
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl">
                  {item.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-ilali-500 to-ilali-700 px-6 py-12 text-center shadow-lg sm:px-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Find the Perfect Activity?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ilali-100">
              Browse hundreds of trusted activities near you and book with
              confidence.
            </p>
            <a
              href="/browse"
              className="mt-6 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-ilali-700 shadow-sm hover:bg-ilali-50 transition-colors"
            >
              Browse activities
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
