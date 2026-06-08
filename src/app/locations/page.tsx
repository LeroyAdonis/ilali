import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Locations | ILALI",
  description:
    "Browse children's activities by location in Cape Town. Find trusted providers in your neighbourhood.",
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
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Find activities near you
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Select a location to discover trusted children's activities in
              your area.
            </p>
          </div>
        </section>

        {/* Location Grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Browse by Location
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Choose a neighbourhood to see what's available near you
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {locations.map((location) => (
              <a
                key={location.slug}
                href={`/browse?location=${location.slug}`}
                className="group rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:border-ilali-300"
              >
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-ilali-600 transition-colors">
                  {location.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
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
