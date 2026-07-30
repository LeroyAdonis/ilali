import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import ProviderCard from "@/components/ProviderCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Suspense } from "react";
import { getProviders, getCategories } from "@/lib/db/queries";
import { mapProvider } from "@/lib/db/mappers";
import type { Provider } from "@/lib/types";
import type { categories as categoriesSchema } from "@/lib/db/schema";

type DbCategory = typeof categoriesSchema.$inferSelect;

interface MatchResult {
  provider: Provider;
  score: number;
  reasons: string[];
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function filterProviders(
  all: Provider[],
  params: { [key: string]: string | string[] | undefined }
) {
  let filtered = [...all];

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

  const catSlugs = params.category;
  if (catSlugs) {
    const slugs = Array.isArray(catSlugs) ? catSlugs : [catSlugs];
    if (slugs.length > 0) {
      filtered = filtered.filter((p) => slugs.includes(p.categorySlug));
    }
  }

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

interface ResultsSectionProps {
  providers: Provider[];
  categories: DbCategory[];
  params: { [key: string]: string | string[] | undefined };
  matchResults?: MatchResult[] | null;
  searchSuggestions?: { message: string; suggestedCategories: string[] } | null;
}

function ResultsSection({
  providers,
  categories,
  params,
  matchResults,
  searchSuggestions,
}: ResultsSectionProps) {
  const filtered = filterProviders(providers, params);
  const q = typeof params.q === "string" ? params.q : "";
  const nl = typeof params.nl === "string" ? params.nl : "";
  const activeCategory =
    typeof params.category === "string" ? params.category : "";

  const newProviders = providers.slice(0, 4);
  const localFavourites = providers.slice(0, 4);

  const hasActiveFilters =
    q || nl || params.category || params.age || params.price || params.distance;

  const isAiMatch = !!nl && matchResults && matchResults.length > 0;

  return (
    <>
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {activeCategory
                ? `${
                    providers.find((p) => p.categorySlug === activeCategory)
                      ?.category || "Browse"
                  } Activities`
                : isAiMatch
                  ? "AI-Powered Matches"
                  : "Find the perfect activity"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {nl
                ? `Showing matches for "${nl}"`
                : hasActiveFilters
                  ? `Showing ${filtered.length} ${
                      filtered.length === 1 ? "activity" : "activities"
                    }`
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

      <section className="pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-24 w-full" />}>
            <FilterBar categories={categories} />
          </Suspense>
        </div>
      </section>

      {/* AI Match Results */}
      {isAiMatch ? (
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ilali-50 px-3 py-1 text-xs font-medium text-ilali-700">
                🤖 AI-powered results based on your description
              </span>
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {matchResults!.map(({ provider, score, reasons }) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  matchScore={score}
                  matchReasons={reasons}
                />
              ))}
            </div>
          </div>
        </section>
      ) : hasActiveFilters ? (
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
                <span className="text-4xl" role="img" aria-hidden="true">
                  🔍
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Nothing matched "{q || nl}"
                </h3>
                {searchSuggestions ? (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-md mx-auto">
                      {searchSuggestions.message}
                    </p>
                    {searchSuggestions.suggestedCategories.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {searchSuggestions.suggestedCategories.map((cat) => (
                          <Link
                            key={cat}
                            href={`/browse?category=${encodeURIComponent(cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-"))}`}
                            className="rounded-full border border-ilali-200 bg-ilali-50 px-4 py-2 text-sm font-medium text-ilali-700 hover:bg-ilali-100 transition-colors"
                          >
                            {cat}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Try adjusting your search or clearing filters to see more
                    options.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Parent accounts signup CTA */}
          <section className="pb-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-xl border border-ilali-200 bg-gradient-to-r from-ilali-50 to-white p-6 sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">👋 Create your free account</h3>
                  <p className="mt-1 text-sm text-slate-500">Save your favourite activities and get personalised recommendations.</p>
                </div>
                <Link
                  href="/auth/signup"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors sm:mt-0 shrink-0"
                >
                  Sign up free
                </Link>
              </div>
            </div>
          </section>

          <section className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                New providers
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Fresh activities added this week
              </p>
              <div className="mt-6 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 sm:hidden">
                {newProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="w-[280px] shrink-0 snap-start"
                  >
                    <ProviderCard provider={provider} />
                  </div>
                ))}
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
                {newProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-10 bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Local favourites
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Most popular activities in your area
              </p>
              <div className="mt-6 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 sm:hidden">
                {localFavourites.map((provider) => (
                  <div
                    key={provider.id}
                    className="w-[280px] shrink-0 snap-start"
                  >
                    <ProviderCard provider={provider} />
                  </div>
                ))}
              </div>
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
                {localFavourites.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
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
  const [dbProviders, dbCategories] = await Promise.all([
    getProviders(),
    getCategories(),
  ]);
  const providers = dbProviders.map(p => mapProvider(p, dbCategories));

  // AI matching via `nl` param
  let matchResults: MatchResult[] | null = null;
  let searchSuggestions: { message: string; suggestedCategories: string[] } | null = null;
  const nl = typeof params.nl === "string" ? params.nl : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (nl) {
    try {
      const res = await fetch(`${baseUrl}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: nl }),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        matchResults = data.matches || [];
      }
    } catch (err) {
      console.warn("[browse] AI match fetch failed:", err);
    }
  }

  // Fetch AI suggestions when search returns no results
  const searchQuery = nl || q;
  const shouldSuggest =
    searchQuery &&
    // No match results from AI search
    ((nl && (!matchResults || matchResults.length === 0)) ||
      // No filtered results from text search
      (!nl && q));

  if (shouldSuggest) {
    try {
      const categoryNames = dbCategories.map((c) => c.name);
      const res = await fetch(`${baseUrl}/api/ai/search-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          availableCategories: categoryNames,
        }),
        cache: "no-store",
      });
      if (res.ok) {
        searchSuggestions = await res.json();
      }
    } catch (err) {
      console.warn("[browse] Search suggestions fetch failed:", err);
    }
  }

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
          <ResultsSection
            providers={providers}
            categories={dbCategories}
            params={params}
            matchResults={matchResults}
            searchSuggestions={searchSuggestions}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
