import type { Metadata } from "next";
import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCard";
import ProviderCard from "@/components/ProviderCard";
import VenueCard from "@/components/VenueCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AIChatPanel from "@/components/chat/AIChatPanel";
import InteriorHero from "@/components/InteriorHero";
import { categories, stats } from "@/lib/constants";
import { getProviders, getVenues, getCategories } from "@/lib/data-source";
import { mapProvider, mapVenue } from "@/lib/db/mappers";
import Link from "next/link";

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;

export const metadata: Metadata = {
  title: "Home | ILALI",
  description:
    "Discover and book trusted children's extramural activities in Cape Town. Browse vetted providers, venues, and activities.",
};

export default async function HomePage() {
  const [dbProviders, dbVenues, dbCategories] = await Promise.all([
    getProviders(),
    getVenues(),
    getCategories(),
  ]);
  const providers = dbProviders.map(p => mapProvider(p, dbCategories));
  const venues = dbVenues.map(mapVenue);
  const newProviders = providers.slice(0, 4);
  const popularProviders = providers.filter((p) => p.featured);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* ───── HERO: Photo-backed + AI Chat ───── */}
        <InteriorHero
          eyebrow="Welcome"
          title={<>Find activities your <span className="text-gold-deep">kids</span> will <span className="text-teal">love</span></>}
          subtitle="ILALI is Cape Town's trusted marketplace for children's activities. Every provider is background-checked, every review from a real family."
          imageSrc="/images/hero/hero-home.jpg"
          imageAlt="Family discovering activities in Cape Town"
        />

        {/* AI Chat Panel */}
        <section className="border-b border-ink/10 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <AIChatPanel />

            {/* Trending tags */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-ink-faint">Trending:</span>
              {["Arts & Culture", "Sports", "Music Lessons", "Holiday Programs"].map((tag) => (
                <Link
                  key={tag}
                  href={`/browse?category=${encodeURIComponent(tag.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-"))}`}
                  className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-medium text-ink-soft shadow-sm transition-all hover:border-ilali-400 hover:text-ilali-600 hover:bg-ilali-50"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───── STATS BAR ───── */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-ink/10 border-b border-ink/10 px-4 py-7 sm:grid-cols-4 sm:px-6 lg:px-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-extrabold text-ilali-700">{s.value}</p>
                <p className="text-xs text-ink-faint">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───── EXPLORE CATEGORIES ───── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
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
              {categories.map((cat, idx) => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  icon={cat.icon}
                  colorClasses={cat.color}
                  description={cat.description}
                  href={`/category/${cat.slug}`}
                  accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ───── NEW PROVIDERS ───── */}
        <section className="py-16 sm:py-20 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                New providers this week
              </h2>
              <Link
                href="/browse"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 sm:hidden">
              {newProviders.map((provider, idx) => (
                <div key={provider.id} className="w-[280px] shrink-0 snap-start">
                  <ProviderCard provider={provider} accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]} />
                </div>
              ))}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
              {newProviders.map((provider, idx) => (
                <ProviderCard key={provider.id} provider={provider} accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]} />
              ))}
            </div>
          </div>
        </section>

        {/* ───── POPULAR THIS WEEK ───── */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Popular this week
              </h2>
              <Link
                href="/browse"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="mt-8 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 sm:hidden">
              {popularProviders.map((provider, idx) => (
                <div key={provider.id} className="w-[280px] shrink-0 snap-start">
                  <ProviderCard provider={provider} accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]} />
                </div>
              ))}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
              {popularProviders.map((provider, idx) => (
                <ProviderCard key={provider.id} provider={provider} accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]} />
              ))}
            </div>
          </div>
        </section>

        {/* ───── UBUNTU REWARDS SPOTLIGHT ───── */}
        <section className="relative overflow-hidden bg-teal-deep px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="relative mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                🏆 Ubuntu Rewards
              </span>
              <h2 className="mt-6 font-display text-3xl font-extrabold text-white sm:text-4xl">
                Earn rewards while your kids learn &amp; play
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ilali-100">
                Every booking earns you points. Climb from Bronze to Gold for
                bigger discounts, early access, and exclusive perks. Plus, a
                portion of every booking supports children&apos;s programmes in
                underserved communities.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/ubuntu-rewards"
                  className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-ilali-700 shadow-md hover:bg-sunset-50 transition-colors"
                >
                  See full rewards →
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full border-2 border-white/30 px-8 py-3 text-sm font-semibold text-white hover:border-white/60 transition-colors"
                >
                  Start earning
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───── VENUES ───── */}
        <section className="py-16 sm:py-20 bg-paper-warm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
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

        {/* ───── TESTIMONIALS ───── */}
        <TestimonialCarousel />

        {/* ───── CTA ───── */}
        <CTASection />

        {/* ───── TRUST & SAFETY ───── */}
        <section className="bg-ilali-600 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="text-xl font-display font-bold text-white sm:text-2xl">
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

        {/* ───── PARTNERS ───── */}
        <section className="bg-paper-warm py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <p className="text-xs leading-relaxed text-ink-faint max-w-lg text-center sm:text-left">
                Built in partnership with ASSITEJ South Africa, with initial funding
                support from BASA through its Supporting Grants Programme.
              </p>
              <div className="flex items-center gap-6">
                <img
                  src="/images/assitej/assitej-sa-logo.png"
                  alt="ASSITEJ South Africa logo"
                  className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
                <img
                  src="/images/basa/basa-logo.png"
                  alt="Business and Arts South Africa logo"
                  className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
