"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import VenueCard from "@/components/VenueCard";
import { venues } from "@/lib/constants";

const locations = ["All", "Newlands", "Claremont", "Muizenberg", "Observatory", "Constantia", "Woodstock", "Hout Bay"];

export default function VenuesPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLocation, setActiveLocation] = useState("All");

  const filtered = useMemo(() => {
    let result = venues;

    if (activeLocation !== "All") {
      result = result.filter((v) => v.location === activeLocation);
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q) ||
          v.type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, activeLocation]);

  return (
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
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venues by name or location..."
            className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-sunset-500 focus:outline-none focus:ring-2 focus:ring-sunset-200"
          />
        </div>

        {/* Location filter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-slate-500">
            Location:
          </span>
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setActiveLocation(loc)}
              className={`rounded-full px-4 py-2 text-xs font-medium shadow-sm transition-colors ${
                activeLocation === loc
                  ? "bg-sunset-500 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </section>

      {/* Venue grid */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-4 text-sm text-slate-500">
          Showing {filtered.length} of {venues.length} venues
          {searchQuery && ` for "${searchQuery}"`}
          {activeLocation !== "All" && ` in ${activeLocation}`}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.length > 0 ? (
            filtered.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <span className="text-4xl">📍</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No venues found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search or clearing filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
