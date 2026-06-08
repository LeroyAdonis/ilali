"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import ProviderCard from "@/components/ProviderCard";
import { providers, categories } from "@/lib/constants";

export default function ProvidersPageClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const filtered = useMemo(() => {
    let result = providers;

    if (activeCategory) {
      const cat = categories.find((c) => c.slug === activeCategory);
      if (cat) {
        result = result.filter((p) => p.category === cat.name);
      }
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.providerName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
      );
    }

    return result;
  }, [searchQuery, activeCategory]);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Find Activity Providers
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
            Browse our curated list of trusted, background-checked activity
            providers in your community.
          </p>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search providers by name, category, or location..."
            className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("")}
            className={`rounded-full px-4 py-2 text-xs font-medium shadow-sm transition-colors ${
              !activeCategory
                ? "bg-ilali-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setActiveCategory(activeCategory === cat.slug ? "" : cat.slug)
              }
              className={`rounded-full px-4 py-2 text-xs font-medium shadow-sm transition-colors ${
                activeCategory === cat.slug
                  ? "bg-ilali-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Provider grid */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mb-4 text-sm text-slate-500">
          Showing {filtered.length} of {providers.length} providers
          {searchQuery && ` for "${searchQuery}"`}
          {activeCategory &&
            ` in ${
              categories.find((c) => c.slug === activeCategory)?.name || ""
            }`}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.length > 0 ? (
            filtered.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <span className="text-4xl">🔍</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No providers found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search or clearing filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Pagination (visual) */}
      {filtered.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              disabled
            >
              ‹
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ilali-600 text-sm font-medium text-white shadow-sm"
            >
              1
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              2
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              3
            </button>
            <span className="px-1 text-sm text-slate-400">...</span>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              8
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ›
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
