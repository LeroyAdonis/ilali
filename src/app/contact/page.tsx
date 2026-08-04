import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import ContactForm from "./form";

export const metadata: Metadata = {
  title: "Contact | ILALI",
  description:
    "Get in touch with the ILALI team — whether you're a parent or a provider, we want to hear from you.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <InteriorHero
          eyebrow="Contact"
          title="Get in touch"
          subtitle="Got a question, a suggestion, or need help? We're listening."
          imageSrc="/images/hero/hero-contact.jpg"
          imageAlt="Welcoming community center"
        />

        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
