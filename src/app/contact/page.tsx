import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";
import ContactForm from "./form";

export const metadata: Metadata = {
  title: "Contact | ILALI",
  description:
    "Got a question, a suggestion, or need help finding an activity? We'd love to hear from you.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <InteriorHero
          eyebrow="Contact"
          title={<>Get in <span className="text-teal">touch</span></>}
          subtitle="Got a question, a suggestion, or need help? We're a small team and we read every message."
          image={HERO_IMAGES['contact']}
        />

        <ContactForm />
      </main>
      <Footer />
    </>
  );
}
