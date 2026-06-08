import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Centre | ILALI",
  description:
    "Find answers to common questions about using ILALI — bookings, payments, accounts, and safety. Contact our support team if you need more help.",
};

const categories = [
  {
    title: "Getting Started",
    icon: "🚀",
    questions: [
      { q: "How do I create an account?", a: "Click 'Sign In' in the top right corner, then select 'Create one' to register. You'll need an email address and a password to get started." },
      { q: "Is it free to browse activities?", a: "Yes! Browsing all activities, reading provider profiles, and reading reviews is completely free. You only pay when you book." },
      { q: "How do I search for activities?", a: "Use the search bar at the top of any page to search by keyword, or browse by category and location from the navigation menu." },
    ],
  },
  {
    title: "Bookings & Payments",
    icon: "📅",
    questions: [
      { q: "How do I book an activity?", a: "Navigate to the activity you're interested in and click the 'Book Now' button. Follow the prompts to complete your booking and payment." },
      { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, and major South African debit cards. All payments are processed securely through our payment gateway." },
      { q: "Can I cancel a booking?", a: "Cancellation policies are set by each provider and displayed on the activity listing. You can cancel through your account dashboard." },
    ],
  },
  {
    title: "Accounts & Profile",
    icon: "👤",
    questions: [
      { q: "How do I reset my password?", a: "Click 'Sign In', then select 'Forgot password?' on the sign-in page. Enter your email and we'll send you a reset link." },
      { q: "How do I update my profile?", a: "Sign in and go to your account dashboard. From there you can update your name, email, phone number, and notification preferences." },
      { q: "Can I have multiple children on one account?", a: "Yes. You can add multiple children to your account and book activities for each of them from your dashboard." },
    ],
  },
  {
    title: "Safety & Trust",
    icon: "🛡️",
    questions: [
      { q: "How are providers vetted?", a: "All providers undergo identity verification, background checks through accredited South African agencies, and qualification review before listing." },
      { q: "What if something goes wrong during an activity?", a: "Contact the provider directly through the ILALI messaging system. If you're not satisfied with the response, reach out to our support team." },
      { q: "How do I report a concern?", a: "You can report any safety concern through our Contact page or by emailing safety@ilali.co. All reports are treated confidentially." },
    ],
  },
  {
    title: "For Providers",
    icon: "📋",
    questions: [
      { q: "How do I list my activities?", a: "Visit our For Providers page to get started. Fill in the application form and our team will review your submission within 2 business days." },
      { q: "What are the fees?", a: "Our standard plan is R99/month plus a 10% commission on bookings. There are no setup fees or hidden costs." },
      { q: "How do I get paid?", a: "Payouts are processed automatically after each completed activity. Funds are transferred to your bank account within 3-5 business days." },
    ],
  },
];

export default function HelpCentrePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Help Centre
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Find answers to common questions. If you need more help, our
              team is here for you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/contact"
                className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ilali-700 shadow-sm hover:bg-ilali-50 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        {categories.map((cat) => (
          <section key={cat.title} className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{cat.icon}</span>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {cat.title}
                </h2>
              </div>
              <div className="space-y-4">
                {cat.questions.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-slate-200 bg-white shadow-sm open:shadow-md transition-shadow"
                  >
                    <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-slate-900 hover:text-ilali-600 transition-colors">
                      {item.q}
                      <span className="ml-4 shrink-0 text-slate-400 group-open:rotate-180 transition-transform">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </summary>
                    <div className="border-t border-slate-100 px-6 py-4">
                      <p className="text-sm leading-relaxed text-slate-600">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Still Need Help? */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-sunset-50 to-warm-50 px-6 py-12 text-center shadow-sm sm:px-12">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Still Need Help?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-slate-600">
              Can't find what you're looking for? Our support team is ready
              to help. We typically respond within 24 hours.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/contact"
                className="inline-flex items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
              >
                Contact Us
              </a>
              <a
                href="mailto:support@ilali.co"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-ilali-400 hover:text-ilali-600"
              >
                Email support@ilali.co
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
