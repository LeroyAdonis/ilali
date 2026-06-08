import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Safeguarding | ILALI",
  description:
    "ILALI's commitment to child safety. Learn about our provider vetting process, code of conduct, and how to report a concern.",
};

const vettingSteps = [
  {
    number: 1,
    title: "Identity Verification",
    description:
      "All providers must submit valid government-issued ID and proof of address before being listed.",
  },
  {
    number: 2,
    title: "Background Check",
    description:
      "We conduct background checks through accredited South African agencies, including clearance from the National Register for Sex Offenders.",
  },
  {
    number: 3,
    title: "Qualification Review",
    description:
      "Providers' qualifications, certifications, and experience are verified to ensure they meet our standards.",
  },
  {
    number: 4,
    title: "Reference Checks",
    description:
      "We contact provided references to confirm the provider's track record working with children.",
  },
  {
    number: 5,
    title: "Ongoing Monitoring",
    description:
      "We regularly review provider ratings, parent feedback, and conduct periodic re-checks to maintain safety standards.",
  },
];

const conductPoints = [
  {
    title: "Child-Centred Approach",
    description:
      "The welfare of the child is always the paramount consideration in every decision and interaction.",
  },
  {
    title: "Respect & Dignity",
    description:
      "Every child must be treated with respect and dignity regardless of age, ability, gender, race, or background.",
  },
  {
    title: "Safe Environment",
    description:
      "Providers must maintain a physically and emotionally safe environment at all times.",
  },
  {
    title: "Professional Boundaries",
    description:
      "Clear professional boundaries must be maintained between providers and children at all times.",
  },
  {
    title: "Confidentiality",
    description:
      "All personal information about children and families must be kept confidential and handled with care.",
  },
  {
    title: "Reporting Obligations",
    description:
      "Any concerns about a child's safety or wellbeing must be reported immediately through the appropriate channels.",
  },
];

export default function SafeguardingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Safeguarding
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              Child safety is at the heart of everything we do. Learn how we
              protect your family.
            </p>
          </div>
        </section>

        {/* Commitment */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Our Commitment
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              At ILALI, safeguarding is not just a policy — it is our
              foundation. We are committed to creating a platform where children
              can learn, play, and grow in a safe and nurturing environment.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Every provider on our platform undergoes a rigorous vetting
              process. We work with accredited background check agencies in
              South Africa, and we continuously monitor and review all providers
              to maintain the highest safety standards.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Our safeguarding policies are reviewed regularly and aligned with
              South African child protection laws and international best
              practices.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Vetting Process */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Provider Vetting Process
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Every provider is thoroughly checked before they join our platform
            </p>
          </div>
          <div className="mx-auto max-w-3xl space-y-6">
            {vettingSteps.map((step) => (
              <div
                key={step.number}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-base font-bold text-ilali-700">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Code of Conduct */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Code of Conduct
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Our standards for every provider on the platform
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            {conductPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Reporting & Complaints */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Reporting & Complaints
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              If you have a concern about a provider, an activity, or a child's
              safety, please report it immediately. All reports are treated with
              the utmost seriousness and confidentiality.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              You can use the form below, or contact us directly at{" "}
              <a
                href="mailto:safeguarding@ilali.co"
                className="font-medium text-ilali-600 underline hover:text-ilali-700"
              >
                safeguarding@ilali.co
              </a>
              .
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Report Form */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-lg">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Report a Concern
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Your report will be handled confidentially.
            </p>
            <form className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="report-name"
                  className="block text-sm font-medium text-slate-700"
                >
                  Your Name (optional)
                </label>
                <input
                  id="report-name"
                  type="text"
                  placeholder="Your name"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>
              <div>
                <label
                  htmlFor="report-email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Your Email (optional)
                </label>
                <input
                  id="report-email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>
              <div>
                <label
                  htmlFor="report-subject"
                  className="block text-sm font-medium text-slate-700"
                >
                  Subject
                </label>
                <select
                  id="report-subject"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                >
                  <option value="">Select a subject...</option>
                  <option value="provider-conduct">Provider Conduct</option>
                  <option value="safety-concern">Safety Concern</option>
                  <option value="safeguarding">Safeguarding Issue</option>
                  <option value="complaint">General Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="report-details"
                  className="block text-sm font-medium text-slate-700"
                >
                  Details
                </label>
                <textarea
                  id="report-details"
                  rows={5}
                  placeholder="Please describe your concern in as much detail as possible..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>
              <button
                type="button"
                className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 transition-colors"
              >
                Submit Report
              </button>
              <p className="text-center text-xs text-slate-400">
                All reports are treated confidentially. We will respond within 24
                hours.
              </p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
