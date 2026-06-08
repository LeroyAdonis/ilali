import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProvidersPageClient from "./client";

export const metadata: Metadata = {
  title: "Providers | ILALI",
  description:
    "Browse trusted children's activity providers in Cape Town. All providers are background-checked and vetted for your peace of mind.",
};

export default async function ProvidersPage() {
  return (
    <>
      <Header />
      <ProvidersPageClient />
      <Footer />
    </>
  );
}
