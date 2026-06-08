import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import ProviderCard from "@/components/ProviderCard";
import VenueCard from "@/components/VenueCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { categories, providers, venues } from "@/lib/constants";
import Link from "next/link";

export default function HomePage() {
  const newProviders = providers.slice(0, 4);
  const popularProviders = providers.filter((p) => p.featured);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <Hero />

        {/* Explore Categories */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Explore categories
              </h2>
              <Link
                href="/categories"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  icon={cat.icon}
                  colorClasses={cat.color}
                  description={cat.description}
                  href={`/browse?category=${cat.slug}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* New providers this week */}
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                New providers this week
              </h2>
              <Link
                href="/browse"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
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

        {/* Popular this week */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Popular this week
              </h2>
              <Link
                href="/browse"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
              {popularProviders.map((provider) => (
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

        {/* Explore Venues */}
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Explore venues
              </h2>
              <Link
                href="/venues"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <TestimonialCarousel />

        {/* CTA Section */}
        <CTASection />

        {/* Trust & Safety Banner */}
        <section className="bg-ilali-600 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  Your child&apos;s safety is our priority
                </h2>
                <p className="mt-2 text-sm text-ilali-100">
                  All providers are vetted and background-checked for your peace of mind.
                </p>
              </div>
              <Link
                href="/safeguarding"
                className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-ilali-700 hover:bg-ilali-50 transition-colors sm:mt-0"
              >
                View our safeguarding policy
              </Link>
            </div>
          </div>
        </section>

        {/* Partnership Badge */}
        <section className="bg-slate-50 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs leading-relaxed text-slate-500 max-w-2xl mx-auto">
              Built in partnership with ASSITEJ South Africa, with initial funding
              support from BASA through its Supporting Grants Programme.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
