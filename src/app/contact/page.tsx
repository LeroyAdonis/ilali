import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "./form";

export const metadata: Metadata = {
  title: "Contact | ILALI",
  description:
    "Get in touch with the ILALI team. We'd love to hear from you — whether you're a parent or a provider.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-paper-warm px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Get in Touch
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-soft sm:text-lg">
              Have a question, suggestion, or need help? We&apos;re here for you.
            </p>
          </div>
        </section>

        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
