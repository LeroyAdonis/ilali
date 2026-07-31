import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProvidersPageClient from "./client";
import { getProviders, getCategories } from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

export const metadata: Metadata = {
  title: "Providers | ILALI",
  description:
    "Browse trusted children's activity providers in Cape Town. All providers are background-checked and vetted for your peace of mind.",
};

export default async function ProvidersPage() {
  const [dbProviders, dbCategories] = await Promise.all([
    getProviders(),
    getCategories(),
  ]);
  const providers = dbProviders.map(p => mapProvider(p, dbCategories));

  return (
    <>
      <Header />
      <ProvidersPageClient providers={providers} categories={dbCategories} />
      <Footer />
    </>
  );
}
