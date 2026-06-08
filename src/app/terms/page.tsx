import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | ILALI",
  description:
    "ILALI's Terms of Service govern the use of our platform for booking and listing children's activities.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    content:
      "By accessing or using the ILALI platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. These terms constitute a legally binding agreement between you and ILALI. We may update these terms from time to time, and your continued use of the platform after changes are posted constitutes acceptance of the updated terms. We will notify registered users of material changes via email or through the platform.",
  },
  {
    title: "Description of Service",
    content:
      "ILALI provides an online platform that connects parents and guardians with children's activity providers. Parents can browse, book, and pay for activities, while providers can list and manage their offerings. ILALI facilitates the booking and payment process but is not a party to the agreement between parents and providers. ILALI does not supervise, control, or direct the activities listed on the platform and makes no representations about the quality or suitability of any activity beyond the verification steps we undertake.",
  },
  {
    title: "User Obligations",
    content:
      "All users must provide accurate, complete, and current information when creating an account and keep this information updated. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to use the platform only for lawful purposes and in accordance with these terms. Parents agree to provide accurate information about their children's needs, including any medical conditions, allergies, or special requirements. Providers agree to deliver the activities as described and to maintain all required certifications and insurance.",
  },
  {
    title: "Payments & Fees",
    content:
      "All payments are processed securely through the ILALI platform. Activity prices are set by providers and include any applicable fees unless otherwise stated. ILALI charges a service fee on bookings, which will be clearly displayed before you complete your transaction. Payment is due at the time of booking unless alternative arrangements are agreed upon with the provider. Refunds are subject to the provider's cancellation policy and ILALI's refund policy. All prices are in South African Rand (ZAR) unless otherwise indicated.",
  },
  {
    title: "Cancellations & Refunds",
    content:
      "Cancellation policies are set by individual providers and displayed on each activity listing. Parents may cancel bookings in accordance with the provider's stated policy. ILALI's service fee is non-refundable except where required by law or where a booking is cancelled due to provider non-performance. If a provider cancels a booking, parents are entitled to a full refund of all amounts paid. ILALI reserves the right to cancel bookings and issue refunds in cases of suspected fraud or violation of these terms.",
  },
  {
    title: "Limitation of Liability",
    content:
      "To the maximum extent permitted by applicable law, ILALI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the platform. This includes but is not limited to damages for loss of profits, goodwill, use, data, or other intangible losses, even if advised of the possibility of such damages. ILALI's total liability for any claim arising from these terms or the platform shall not exceed the total amount of fees paid by you to ILALI in the twelve months preceding the claim. Nothing in these terms limits or excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              The terms governing your use of the ILALI platform.
            </p>
          </div>
        </section>

        {/* Last Updated */}
        <section className="mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm text-slate-500">
              Last updated: June 2026. These Terms of Service apply to all
              users of the ILALI platform.
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
