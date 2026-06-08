import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | ILALI",
  description:
    "ILALI's Privacy Policy explains how we collect, use, and protect your personal information in accordance with POPIA.",
};

const sections = [
  {
    title: "Information We Collect",
    content:
      "We collect information that you provide directly to us when you create an account, book an activity, contact support, or communicate with providers. This may include your name, email address, phone number, billing information, and details about your children (such as age and any relevant medical or dietary requirements). We also automatically collect certain technical information when you use our platform, including your IP address, browser type, device information, and usage patterns. If you are a provider, we additionally collect identity documents, qualifications, background check results, and professional references.",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to operate, maintain, and improve our platform. This includes processing bookings and payments, facilitating communication between parents and providers, verifying provider credentials, personalising your experience, sending activity recommendations and service updates, and providing customer support. We may also use aggregated, anonymised data for analytics and to improve our services. We will not use your personal information for purposes incompatible with those described in this policy without notifying you.",
  },
  {
    title: "Data Protection",
    content:
      "ILALI takes the security of your personal information seriously. We implement appropriate technical and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction. These measures include encryption of data in transit and at rest, secure server infrastructure, access controls, and regular security audits. We comply with the Protection of Personal Information Act (POPIA) and other applicable South African data protection laws. While we strive to protect your personal information, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "Your Rights",
    content:
      "Under POPIA, you have the right to access the personal information we hold about you, request correction of inaccurate or incomplete data, request deletion of your data (subject to legal retention requirements), object to the processing of your data for certain purposes, and withdraw consent where processing is based on consent. You also have the right to lodge a complaint with the Information Regulator if you believe we have not handled your data in accordance with applicable law. To exercise any of these rights, please contact us using the details below.",
  },
  {
    title: "Contact",
    content:
      "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our Information Officer. You can reach us by email at privacy@ilali.co or by mail at: ILALI, Information Officer, Cape Town, South Africa. We will respond to your enquiry within the timeframe required by applicable law. If you are not satisfied with our response, you have the right to escalate your concern to the South African Information Regulator.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              How we collect, use, and protect your personal information.
            </p>
          </div>
        </section>

        {/* Last Updated */}
        <section className="mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-slate-500">
              Last updated: June 2026. This policy applies to all users of the
              ILALI platform.
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
      </main>
      <Footer />
    </>
  );
}
