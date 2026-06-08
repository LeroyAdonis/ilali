import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "For Providers | ILALI",
  description:
    "List your children's activities on ILALI. Reach more families, manage bookings, and grow your business. R99/month + 10% commission.",
};

const benefits = [
  {
    title: "Dashboard",
    description:
      "Manage everything from one place — bookings, messages, payments, and analytics. See your performance at a glance.",
    icon: "📊",
  },
  {
    title: "Scheduling",
    description:
      "Set your availability, create recurring sessions, and let parents book directly. No more back-and-forth coordination.",
    icon: "📅",
  },
  {
    title: "Payments",
    description:
      "Secure online payments with automatic payouts. No chasing invoices or handling cash — we handle it all.",
    icon: "💳",
  },
  {
    title: "Messaging",
    description:
      "Built-in messaging so you can communicate with parents directly about schedules, updates, and special requirements.",
    icon: "💬",
  },
];

export default function ForProvidersPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              List Your Activities
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Join the platform that connects you with families looking for
              quality children's activities in your area.
            </p>
            <a
              href="#signup"
              className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ilali-700 shadow-sm hover:bg-ilali-50 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Everything You Need to Succeed
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Powerful tools to help you manage and grow your activity business
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl">
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

        {/* Pricing */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border-2 border-ilali-200 bg-white p-8 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Simple Pricing
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                No hidden fees. No surprises.
              </p>
              <div className="mt-6">
                <span className="text-5xl font-extrabold text-ilali-600">
                  R99
                </span>
                <span className="text-lg text-slate-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Plus a small 10% commission on bookings
              </p>
              <ul className="mx-auto mt-6 space-y-3 text-left text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Full provider profile and listing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Booking and scheduling dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Secure payment processing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Parent messaging
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Reviews and ratings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-ilali-500">✓</span>
                  Priority support
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Sign-up Form */}
        <section
          id="signup"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-lg">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Start Listing Today
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Fill in the form below and we'll be in touch.
            </p>
            <form className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-slate-700"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+27 00 000 0000"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>
              <div>
                <label
                  htmlFor="activity-type"
                  className="block text-sm font-medium text-slate-700"
                >
                  Activity Type
                </label>
                <select
                  id="activity-type"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                >
                  <option value="">Select activity type...</option>
                  <option value="sports">Sports</option>
                  <option value="arts">Arts & Culture</option>
                  <option value="music">Music Lessons</option>
                  <option value="education">Education & STEM</option>
                  <option value="holiday">Holiday Programs</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 transition-colors"
              >
                Submit Application
              </button>
              <p className="text-center text-xs text-slate-400">
                We'll review your application and get back to you within 2
                business days.
              </p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
