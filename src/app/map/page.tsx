import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderMap from "@/components/map/ProviderMap";
import { getCategories } from "@/lib/data-source";

export const metadata: Metadata = {
  title: "Map",
  description:
    "Explore verified and listed activity clubs across Cape Town on the ILALI map, with anonymised parent density by suburb.",
};

export default async function MapPage() {
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Find clubs near you
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Green pins are verified providers, grey pins are listed, and blue
            circles show how many ILALI parents are nearby — by suburb, never
            individuals.
          </p>
        </div>

        <ProviderMap
          categories={categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            icon: c.icon,
            color: c.color,
          }))}
        />
      </main>
      <Footer />
    </div>
  );
}
