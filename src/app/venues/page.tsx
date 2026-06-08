import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VenueCard from "@/components/VenueCard";
import { venues } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Venues | ILALI",
  description:
    "Browse venues for children's activities in Cape Town. Studios, halls, outdoor spaces and more for your child's next activity.",
};

export default function VenuesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-sunset-500 to-sunset-700 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Browse Venues
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-orange-100 sm:text-lg">
              Discover the perfect spaces for children's activities — from
              studios and halls to outdoor fields and theatres.
            </p>
          </div>
        </section>

        {/* Search + Filters */}
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Search bar */}
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search venues by name or location..."
              className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-200"
            />
          </div>

          {/* Location filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              Location:
            </span>
            {["All", "Newlands", "Claremont", "Muizenberg", "Observatory"].map(
              (loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`rounded-full px-4 py-2 text-xs font-medium shadow-sm transition-colors ${
                    loc === "All"
                      ? "bg-sunset-500 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {loc}
                </button>
              )
            )}
          </div>
        </section>

        {/* Venue grid */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-4 text-sm text-slate-500">
            Showing {venues.length} venues
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
