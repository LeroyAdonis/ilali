import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import ProviderCard from "@/components/ProviderCard";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import { providers } from "@/lib/constants";
import type { Provider } from "@/lib/types";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function filterProviders(
  all: Provider[],
  params: { [key: string]: string | string[] | undefined }
) {
  let filtered = [...all];

  // Search query filter
  const q = typeof params.q === "string" ? params.q.toLowerCase().trim() : "";
  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.providerName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }

  // Category filter (multi)
  const catSlugs = params.category;
  if (catSlugs) {
    const slugs = Array.isArray(catSlugs) ? catSlugs : [catSlugs];
    if (slugs.length > 0) {
      filtered = filtered.filter((p) => slugs.includes(p.categorySlug));
    }
  }

  // Age filter
  const age = typeof params.age === "string" ? params.age : "";
  if (age) {
    const ageMap: Record<string, [number, number]> = {
      "0-3": [0, 3],
      "4-7": [4, 7],
      "8-12": [8, 12],
      "13-17": [13, 17],
    };
    const range = ageMap[age];
    if (range) {
      const [min, max] = range;
      filtered = filtered.filter(
        (p) => p.ageMin <= max && p.ageMax >= min
      );
    }
  }

  // Price filter
  const price = typeof params.price === "string" ? params.price : "";
  if (price) {
    const priceMap: Record<string, [number, number]> = {
      free: [0, 0],
      "under-100": [0, 99],
      "100-250": [100, 250],
      "250-500": [251, 500],
      "over-500": [501, 99999],
    };
    const range = priceMap[price];
    if (range) {
      const [min, max] = range;
      filtered = filtered.filter(
        (p) => p.priceValue >= min && p.priceValue <= max
      );
    }
  }

  // Distance filter
  const distance = typeof params.distance === "string" ? params.distance : "";
  if (distance) {
    const distNum = parseInt(distance, 10);
    if (!isNaN(distNum)) {
      filtered = filtered.filter((p) => {
        const distVal = parseFloat(p.distance);
        return !isNaN(distVal) && distVal <= distNum;
      });
    }
  }

  return filtered;
}

function ResultsSection({ params }: { params: { [key: string]: string | string[] | undefined } }) {
  const filtered = filterProviders(providers, params);
  const q = typeof params.q === "string" ? params.q : "";
  const activeCategory = typeof params.category === "string" ? params.category : "";

  // Get the new providers (from this week)
  const newProviders = providers.slice(0, 4);
  // Get local favourites
  const localFavourites = providers.slice(0, 4);

  // If there's an active filter, show only filtered results
  const hasActiveFilters = q || params.category || params.age || params.price || params.distance;

  return (
    <>
      {/* Search Section */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {activeCategory
                ? `${providers.find((p) => p.categorySlug === activeCategory)?.category || "Browse"} Activities`
                : "Find the perfect activity"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {hasActiveFilters
                ? `Showing ${filtered.length} ${filtered.length === 1 ? "activity" : "activities"}`
                : "Search from hundreds of vetted children's activities near you."}
            </p>
          </div>
          <div className="mt-8">
            <Suspense fallback={<div className="h-16 w-full" />}>
              <SearchBar variant="large" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-24 w-full" />}>
            <FilterBar />
          </Suspense>
        </div>
      </section>

      {/* Active filter results or default sections */}
      {hasActiveFilters ? (
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filtered.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <span className="text-4xl">🔍</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  No activities match your filters
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Try adjusting your search or clearing filters to see more
                  options.
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* New providers */}
          <section className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                New providers
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fresh activities added this week
              </p>
              <div className="mt-6 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                {newProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="min-w-[280px] shrink-0 snap-start sm:min-w-0 sm:w-1/2 lg:w-1/4"
                  >
                    <ProviderCard provider={provider} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Local favourites */}
          <section className="py-10 bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Local favourites
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Most popular activities in your area
              </p>
              <div className="mt-6 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                {localFavourites.map((provider) => (
                  <div
                    key={provider.id}
                    className="min-w-[280px] shrink-0 snap-start sm:min-w-0 sm:w-1/2 lg:w-1/4"
                  >
                    <ProviderCard provider={provider} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ilali-500 border-t-transparent" />
            </div>
          }
        >
          <ResultsSection params={params} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
