import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { childProfiles, clubMemberships, clubEvents, providers } from "@/lib/db/schema";
import { eq, inArray, and, gte } from "drizzle-orm";
import Header from "@/components/Header";
import CategoryCard from "@/components/CategoryCard";
import ProviderCard from "@/components/ProviderCard";
import VenueCard from "@/components/VenueCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AIChatPanel from "@/components/chat/AIChatPanel";
import InteriorHero from "@/components/InteriorHero";
import KidsCard from "@/components/parent/KidsCard";
import type { ChildProfile } from "@/components/parent/KidsCard";
import WeekPlanner from "@/components/parent/WeekPlanner";
import type { ScheduledEvent } from "@/components/parent/WeekPlanner";
import SuggestedActivities from "@/components/parent/SuggestedActivities";
import ClubCardsRow from "@/components/parent/ClubCardsRow";
import type { ClubMembershipWithProvider } from "@/components/parent/ClubCardsRow";
import PointsWidget from "@/components/parent/PointsWidget";
import ProfileSettingsPanel from "@/components/parent/ProfileSettingsPanel";
import NotificationBell from "@/components/parent/NotificationBell";
import { categories, stats } from "@/lib/constants";
import { getProviders, getVenues, getCategories } from "@/lib/data-source";
import { mapProvider, mapVenue } from "@/lib/db/mappers";
import Link from "next/link";

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;
const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const metadata: Metadata = {
  title: "Home | ILALI",
  description:
    "Discover and book trusted children's extramural activities in Cape Town. Browse vetted providers, venues, and activities.",
};

/** Format a Date to "HH:MM" in SA time. */
function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Format a Date to "DAY HH:MM" (e.g. "Wed 16:00"). */
function formatDayTime(d: Date): string {
  return `${WEEK_DAYS[d.getDay()]!.slice(0, 3)} ${formatTime(d)}`;
}

export default async function HomePage() {
  const headersList = await headers();

  // ── Fetch session + shared data in parallel ──
  const [session, dbProviders, dbVenues, dbCategories] = await Promise.all([
    auth.api.getSession({ headers: headersList }),
    getProviders(),
    getVenues(),
    getCategories(),
  ]);

  const providersList = dbProviders.map((p) => mapProvider(p, dbCategories));
  const venues = dbVenues.map(mapVenue);
  const newProviders = providersList.slice(0, 4);
  const popularProviders = providersList.filter((p) => p.featured);

  // ── Signed-in data ──
  let signedInData: {
    userName: string;
    children: ChildProfile[];
    memberships: ClubMembershipWithProvider[];
    events: ScheduledEvent[];
    scheduledProviderIds: string[];
  } | null = null;

  if (session?.user?.id) {
    const userId = session.user.id;
    const userName = session.user.name ?? "there";

    // Fetch child profiles + memberships in parallel
    const [dbChildProfiles, dbMemberships] = await Promise.all([
      db
        .select()
        .from(childProfiles)
        .where(eq(childProfiles.parentId, userId)),
      db
        .select()
        .from(clubMemberships)
        .where(eq(clubMemberships.parentId, userId)),
    ]);

    // Map children
    const children: ChildProfile[] = dbChildProfiles.map((cp) => ({
      id: cp.id,
      name: cp.name,
      age: cp.age,
      interests: cp.interests ?? null,
      availability: cp.availability as {
        days: string[];
        timeSlots: string[];
      } | null,
      suburb: cp.suburb ?? null,
    }));

    // Get memberships' provider details + upcoming events in parallel
    const memberProviderIds = [
      ...new Set(dbMemberships.map((m) => m.providerId)),
    ];

    let membershipProviders: (typeof providers.$inferSelect)[] = [];
    let dbClubEvents: (typeof clubEvents.$inferSelect)[] = [];

    if (memberProviderIds.length > 0) {
      const now = new Date();
      [membershipProviders, dbClubEvents] = await Promise.all([
        db
          .select()
          .from(providers)
          .where(inArray(providers.id, memberProviderIds)),
        db
          .select()
          .from(clubEvents)
          .where(
            and(
              inArray(clubEvents.providerId, memberProviderIds),
              gte(clubEvents.startTime, now),
            ),
          )
          .orderBy(
            // Drizzle doesn't support CASE expressions natively; sort by startTime asc
            // and rely on the gte filter to give only upcoming
          ),
      ]);

      // Sort events by startTime ascending
      dbClubEvents.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime(),
      );
    }

    // Map memberships to ClubMembershipWithProvider
    const memberships: ClubMembershipWithProvider[] = dbMemberships.map(
      (m) => {
        const provider = membershipProviders.find(
          (p) => p.id === m.providerId,
        );
        const nextEvent = dbClubEvents
          .filter((e) => e.providerId === m.providerId)
          .sort(
            (a, b) => a.startTime.getTime() - b.startTime.getTime(),
          )[0];

        return {
          id: m.id,
          providerId: m.providerId,
          providerName: provider?.name ?? "Unknown Club",
          providerSlug: provider?.slug ?? "#",
          nextEventDate: nextEvent
            ? formatDayTime(nextEvent.startTime)
            : undefined,
          unreadCount: 0,
        };
      },
    );

    // Map clubEvents to ScheduledEvent
    const childMap = new Map(children.map((c) => [c.id, c]));

    const events: ScheduledEvent[] = dbClubEvents.map((e, idx) => {
      const membership = dbMemberships.find(
        (m) => m.providerId === e.providerId,
      );
      const memberChildIds = membership?.childIds ?? [];
      // Use first child from the membership that still exists in profiles
      const firstChild = memberChildIds
        .map((cid) => childMap.get(cid))
        .find(Boolean);

      return {
        id: e.id,
        dayOfWeek: WEEK_DAYS[e.startTime.getDay()]!,
        time: formatTime(e.startTime),
        activityName: e.title,
        providerName:
          membershipProviders.find((p) => p.id === e.providerId)?.name ??
          "Activity",
        childName: firstChild?.name ?? "",
        clubColor: ACCENT_ROTATION[idx % ACCENT_ROTATION.length],
      };
    });

    const scheduledProviderIds = [
      ...new Set(dbClubEvents.map((e) => e.providerId)),
    ];

    signedInData = {
      userName,
      children,
      memberships,
      events,
      scheduledProviderIds,
    };
  }

  // ── Common discovery section (rendered below personalised dashboard for signed-in users) ──
  const discoverySection = (
    <>
      {/* ───── AI Chat Panel ───── */}
      <section className="border-b border-ink/10 bg-paper-warm">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <AIChatPanel />

          {/* Trending tags */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-medium text-ink-faint">
              Trending:
            </span>
            {[
              "Arts & Culture",
              "Sports",
              "Music Lessons",
              "Holiday Programs",
            ].map((tag) => (
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
                <ProviderCard
                  provider={provider}
                  accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
                />
              </div>
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
            {newProviders.map((provider, idx) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
              />
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
                <ProviderCard
                  provider={provider}
                  accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
                />
              </div>
            ))}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
            {popularProviders.map((provider, idx) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
              />
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
                All providers are vetted and background-checked for your peace
                of mind.
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
              Built in partnership with ASSITEJ South Africa, with initial
              funding support from BASA through its Supporting Grants
              Programme.
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
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {session?.user && signedInData ? (
          <>
            {/* ═══════════════════════════════════════════════ */}
            {/* PERSONALISED DASHBOARD (signed-in only)        */}
            {/* ═══════════════════════════════════════════════ */}

            {/* ───── Greeting Bar ───── */}
            <div className="border-b border-ink/10 bg-paper-warm px-4 py-3">
              <div className="mx-auto flex max-w-7xl items-center justify-between sm:px-6 lg:px-8">
                <h1 className="font-display text-lg font-bold text-ink sm:text-xl">
                  Welcome back, {signedInData.userName}{" "}
                  <span aria-hidden="true">👋</span>
                </h1>
                <div className="flex items-center gap-2">
                  <ProfileSettingsPanel />
                  <NotificationBell />
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* ───── 3-Column Widget Row ───── */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <KidsCard children={signedInData.children} />
                <ClubCardsRow memberships={signedInData.memberships} />
                <PointsWidget />
              </div>

              {/* ───── Week Planner (full-width) ───── */}
              <div className="mt-8">
                {signedInData.children.length === 0 ? (
                  /* No children: empty state with popular suggestions */
                  <div>
                    <div className="mb-4">
                      <h2 className="font-display text-lg font-bold text-ink">
                        This Week
                      </h2>
                    </div>
                    <div className="rounded-xl border border-ink/10 bg-white px-6 py-10 text-center shadow-sm">
                      <p className="text-sm font-medium text-ink-soft">
                        Add your children to see their upcoming activities
                      </p>
                      {popularProviders.length > 0 && (
                        <div className="mt-6">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                            Popular suggestions
                          </p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {popularProviders.slice(0, 6).map((provider, idx) => (
                              <Link
                                key={provider.id}
                                href={`/activity/${provider.slug ?? provider.id}`}
                                className="flex items-center gap-3 rounded-lg border border-ink/10 bg-paper-warm p-3 text-left transition-all hover:border-ilali-400 hover:shadow-sm"
                              >
                                <div
                                  className={`h-8 w-1 shrink-0 rounded-full ${
                                    ACCENT_ROTATION[idx % ACCENT_ROTATION.length] === "teal"
                                      ? "bg-teal"
                                      : ACCENT_ROTATION[idx % ACCENT_ROTATION.length] === "gold"
                                        ? "bg-gold"
                                        : ACCENT_ROTATION[idx % ACCENT_ROTATION.length] === "purple"
                                          ? "bg-purple"
                                          : "bg-orange"
                                  }`}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-ink truncate">
                                    {provider.name}
                                  </p>
                                  <p className="text-xs text-ink-faint">
                                    {provider.location ?? provider.category}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Has children: show week planner + suggestions */
                  <div>
                    <WeekPlanner events={signedInData.events} />

                    {/* Suggested activities */}
                    <SuggestedActivities
                      children={signedInData.children.map((c) => ({
                        id: c.id,
                        name: c.name,
                        age: c.age,
                        interests: c.interests ?? [],
                        suburb: c.suburb,
                      }))}
                      providers={dbProviders.map((p) => ({
                        id: p.id,
                        name: p.name,
                        ageMin: p.ageMin,
                        ageMax: p.ageMax,
                        tags: p.tags,
                        location: p.location,
                      }))}
                      scheduledProviderIds={signedInData.scheduledProviderIds}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ───── "Discover More" Divider ───── */}
            <div className="bg-white">
              <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-ink/10" />
                  <span className="text-sm font-medium text-ink-faint">
                    Discover More
                  </span>
                  <div className="h-px flex-1 bg-ink/10" />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* DISCOVERY SECTION (existing signed-out content) */}
            {/* ═══════════════════════════════════════════════ */}
            {discoverySection}
          </>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════ */}
            {/* SIGNED-OUT LANDING PAGE (unchanged)            */}
            {/* ═══════════════════════════════════════════════ */}

            {/* ───── HERO: Photo-backed + AI Chat ───── */}
            <InteriorHero
              eyebrow="Welcome"
              title={
                <>
                  Find activities your{" "}
                  <span className="text-gold-deep">kids</span> will{" "}
                  <span className="text-teal">love</span>
                </>
              }
              subtitle="ILALI is Cape Town's trusted marketplace for children's activities. Every provider is background-checked, every review from a real family."
              imageSrc="/images/hero/hero-home.jpg"
              imageAlt="Family discovering activities in Cape Town"
            />

            {/* ───── AI Chat Panel ───── */}
            <section className="border-b border-ink/10 bg-paper-warm">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <AIChatPanel />

                {/* Trending tags */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-medium text-ink-faint">
                    Trending:
                  </span>
                  {[
                    "Arts & Culture",
                    "Sports",
                    "Music Lessons",
                    "Holiday Programs",
                  ].map((tag) => (
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
                    <p className="text-xl font-extrabold text-ilali-700">
                      {s.value}
                    </p>
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
                      accentColor={
                        ACCENT_ROTATION[idx % ACCENT_ROTATION.length]
                      }
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
                    <div
                      key={provider.id}
                      className="w-[280px] shrink-0 snap-start"
                    >
                      <ProviderCard
                        provider={provider}
                        accentColor={
                          ACCENT_ROTATION[idx % ACCENT_ROTATION.length]
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
                  {newProviders.map((provider, idx) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      accentColor={
                        ACCENT_ROTATION[idx % ACCENT_ROTATION.length]
                      }
                    />
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
                    <div
                      key={provider.id}
                      className="w-[280px] shrink-0 snap-start"
                    >
                      <ProviderCard
                        provider={provider}
                        accentColor={
                          ACCENT_ROTATION[idx % ACCENT_ROTATION.length]
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
                  {popularProviders.map((provider, idx) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      accentColor={
                        ACCENT_ROTATION[idx % ACCENT_ROTATION.length]
                      }
                    />
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
                    Every booking earns you points. Climb from Bronze to Gold
                    for bigger discounts, early access, and exclusive perks.
                    Plus, a portion of every booking supports children&apos;s
                    programmes in underserved communities.
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
                      All providers are vetted and background-checked for your
                      peace of mind.
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
                    Built in partnership with ASSITEJ South Africa, with
                    initial funding support from BASA through its Supporting
                    Grants Programme.
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
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
