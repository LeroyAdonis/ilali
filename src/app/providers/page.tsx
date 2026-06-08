import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import { providers, categories } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Providers | ILALI",
  description:
    "Browse trusted children's activity providers in Cape Town. All providers are background-checked and vetted for your peace of mind.",
};

export default function ProvidersPage() {
  return (
    <>
      <Header />
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
              placeholder="Search providers by name, category, or location..."
              className="block w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-medium text-white shadow-sm"
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Provider grid */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mb-4 text-sm text-slate-500">
            Showing {providers.length} providers
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>

        {/* Pagination (visual) */}
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
      </main>
      <Footer />
    </>
  );
}
