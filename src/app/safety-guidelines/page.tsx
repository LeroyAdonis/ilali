import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Safety Guidelines | ILALI",
  description:
    "Essential safety guidelines for families using ILALI. Learn about child safety, supervision requirements, and emergency procedures.",
};

export default function SafetyGuidelinesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Safety Guidelines
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              Keeping children safe is our shared responsibility. Here is how
              we maintain a secure environment for every activity.
            </p>
          </div>
        </section>

        {/* Child Safety */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Child Safety
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Child safety is our highest priority. Every provider on ILALI
              undergoes a thorough vetting process, including background checks
              through accredited South African agencies and verification against
              the National Register for Sex Offenders.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              All activities listed on our platform must comply with our strict
              safety standards. Providers are required to maintain appropriate
              supervision ratios, have up-to-date first aid certifications, and
              follow our comprehensive code of conduct at all times.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              We encourage parents to review provider profiles, read reviews
              from other families, and communicate directly with providers
              before booking.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Supervision */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Supervision Requirements
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              All providers must adhere to age-appropriate supervision ratios.
              For children under five, a minimum of one adult per four children
              is required. For children aged five and above, the ratio is one
              adult per eight children.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Providers must ensure that children are supervised at all times
              during activities. Parents are welcome to stay and observe
              sessions unless otherwise specified by the provider for certain
              specialised activities.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Before dropping off your child, please confirm the provider's
              supervision arrangements and ensure your child is comfortable
              with the environment.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* Emergency Procedures */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Emergency Procedures
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Every provider is required to have a documented emergency plan
              that covers medical emergencies, fire safety, and evacuation
              procedures. These plans must be reviewed and practised regularly.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Providers must maintain a fully stocked first aid kit on site
              and have at least one staff member with a valid first aid
              certification present during all activities.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              In the event of an emergency, providers are trained to contact
              emergency services immediately and then notify parents or
              guardians. Parents should ensure their emergency contact details
              are up to date in their ILALI profile.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-slate-200" />
        </div>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-ilali-50 px-8 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Our Safeguarding Policy
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
              Our comprehensive safeguarding policy outlines every measure we
              take to protect children on our platform. Learn about our
              vetting process, reporting procedures, and commitment to safety.
            </p>
            <div className="mt-8">
              <a
                href="/safeguarding"
                className="inline-flex items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
              >
                View Safeguarding Policy
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
