import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";

export const metadata: Metadata = {
  title: "Locations | ILALI",
  description:
    "Browse children's activities by suburb in Cape Town. Find trusted, background-checked providers in your neighbourhood.",
};

const locations = [
  { name: "Southern Suburbs", slug: "southern-suburbs" },
  { name: "Claremont", slug: "claremont" },
  { name: "Newlands", slug: "newlands" },
  { name: "Rondebosch", slug: "rondebosch" },
  { name: "Constantia", slug: "constantia" },
  { name: "Kenilworth", slug: "kenilworth" },
  { name: "Wynberg", slug: "wynberg" },
  { name: "Hout Bay", slug: "hout-bay" },
  { name: "Muizenberg", slug: "muizenberg" },
  { name: "Observatory", slug: "observatory" },
  { name: "Woodstock", slug: "woodstock" },
  { name: "Langa", slug: "langa" },
];

export default function LocationsPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <InteriorHero
          eyebrow="Discover"
          title={<>Find <span className="text-teal">activities</span> near you</>}
          subtitle="Select a neighbourhood to discover vetted children's activities near you."
          image={HERO_IMAGES['locations']}
        />

        {/* Location Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Browse by Location
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Choose a neighbourhood to see what's available near you
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {locations.map((location) => (
              <a
                key={location.slug}
                href={`/browse?location=${location.slug}`}
                className="group rounded-xl border border-ink/10 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:border-ilali-300"
              >
                <h3 className="font-display text-lg font-semibold text-ink group-hover:text-ilali-600 transition-colors">
                  {location.name}
                </h3>
                <p className="mt-1 text-sm text-ink-faint">
                  Browse activities →
                </p>
              </a>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
