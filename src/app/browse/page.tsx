import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import ProviderCard from "@/components/ProviderCard";
import Footer from "@/components/Footer";
import { providers } from "@/lib/constants";

export default function BrowsePage() {
  const newProviders = providers.slice(0, 4);
  const localFavourites = providers.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Search Section */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Find the perfect activity
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Search from hundreds of vetted children&apos;s activities near you.
              </p>
            </div>
            <div className="mt-8">
              <SearchBar variant="large" />
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FilterBar />
          </div>
        </section>

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
      </main>

      <Footer />
    </div>
  );
}
