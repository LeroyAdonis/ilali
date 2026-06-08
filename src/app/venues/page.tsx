import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VenuesPageClient from "./client";

export const metadata: Metadata = {
  title: "Venues | ILALI",
  description:
    "Browse venues for children's activities in Cape Town. Studios, halls, outdoor spaces and more for your child's next activity.",
};

export default function VenuesPage() {
  return (
    <>
      <Header />
      <VenuesPageClient />
      <Footer />
    </>
  );
}
