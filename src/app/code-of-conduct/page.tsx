import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Code of Conduct | ILALI",
  description:
    "ILALI's Provider Code of Conduct sets the professional, ethical, and safety standards every provider must uphold on our platform.",
};

const sections = [
  {
    title: "Our Commitment",
    content:
      "ILALI is dedicated to creating a safe, nurturing, and enriching environment for every child. This Code of Conduct outlines the professional and ethical standards that all providers must uphold. By listing on ILALI, providers agree to act in the best interests of children at all times, maintain the highest standards of professionalism, and contribute positively to our community.",
  },
  {
    title: "Child Safety First",
    content:
      "The safety and wellbeing of every child is the paramount consideration in all activities and interactions. Providers must comply with all applicable South African child protection laws, maintain valid background checks, and adhere to our safeguarding policy. Any concern regarding a child's safety must be reported immediately. Providers must never be alone with a child outside of designated supervised activity times and must maintain appropriate physical and emotional boundaries at all times.",
  },
  {
    title: "Professional Conduct",
    content:
      "Providers must act with integrity, honesty, and professionalism in all dealings with children, parents, and fellow providers. This includes arriving on time for all scheduled activities, being prepared with appropriate materials and equipment, dressing appropriately, and maintaining a positive and encouraging demeanour. Providers must not consume alcohol or non-prescription drugs before or during activities, and must not smoke or vape in the presence of children.",
  },
  {
    title: "Inclusive Environment",
    content:
      "ILALI is committed to providing an inclusive environment where every child feels welcome, respected, and valued. Providers must not discriminate on the basis of race, ethnicity, gender, religion, disability, sexual orientation, or socioeconomic background. Activities should be adapted where reasonably possible to accommodate children with special needs. Providers must foster a culture of respect, kindness, and belonging, and must address any instances of bullying or exclusion promptly and appropriately.",
  },
  {
    title: "Reliability & Communication",
    content:
      "Providers must maintain clear, prompt, and respectful communication with parents and guardians. This includes responding to booking enquiries within 24 hours, providing timely updates about schedule changes or cancellations, and sharing any relevant information about activities. Providers must honour all confirmed bookings and provide adequate notice if changes are necessary. Parents should be able to reach providers through the ILALI messaging system for activity-related matters.",
  },
  {
    title: "Transparent Practices",
    content:
      "All provider listings must accurately represent the activities, qualifications, pricing, and any additional fees. Providers must not make false or misleading claims about their services, certifications, or experience. Pricing must be transparent and include all applicable charges. Any changes to activity details, pricing, or availability must be communicated to affected families promptly. Providers must handle all payments through the ILALI platform and not solicit direct payments from parents.",
  },
  {
    title: "Enforcement",
    content:
      "ILALI takes the Code of Conduct seriously. Providers who breach these standards may face consequences including written warnings, suspension of listings, removal from the platform, and in serious cases, referral to relevant authorities. ILALI reserves the right to investigate any reported concerns and will take appropriate action based on the severity and frequency of the breach. Providers may appeal enforcement decisions in writing. We are committed to fair and consistent enforcement to maintain trust across our community.",
  },
];

export default function CodeOfConductPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Provider Code of Conduct
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              Our standards for professional, ethical, and safe practice on the
              ILALI platform.
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-12">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Footer note */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm leading-relaxed text-slate-500">
              This Code of Conduct is reviewed regularly and may be updated
              from time to time. Providers will be notified of any material
              changes. The latest version is always available on this page.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Last updated: June 2026. If you have questions about the Code of
              Conduct, please contact us at{" "}
              <a
                href="mailto:support@ilali.co"
                className="font-medium text-ilali-600 underline hover:text-ilali-700"
              >
                support@ilali.co
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
