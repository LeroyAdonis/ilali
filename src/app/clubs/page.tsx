/* Hallmark · macrostructure: Bento Grid · genre: playful · theme: ilali-native
 * Designed-as-app · design-system: ilali-tokens
 */

import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import {
  getProviders,
  getClubStats,
  getClubEvents,
  getRideRequests,
  getCommunityContributions,
  type ClubEvent,
  type RideRequestWithNames,
} from "@/lib/data-source";
import {
  Users,
  CalendarDays,
  MapPin,
  Car,
  ArrowRight,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { formatEventDate } from "@/lib/club-format";

export const metadata: Metadata = {
  title: "Community Hub | ILALI",
  description:
    "Find your club, share the ride — ILALI's community hub connects families through clubs, events, and ride-sharing in Cape Town.",
};

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;

type Accent = (typeof ACCENT_ROTATION)[number];

const ACCENT_BORDER: Record<Accent, string> = {
  teal: "border-t-teal",
  gold: "border-t-gold",
  purple: "border-t-purple",
  orange: "border-t-orange",
};

const ACCENT_DOT: Record<Accent, string> = {
  teal: "bg-teal",
  gold: "bg-gold",
  purple: "bg-purple",
  orange: "bg-orange",
};

const ACCENT_LINK: Record<Accent, string> = {
  teal: "text-teal-deep hover:text-teal",
  gold: "text-gold-deep-2 hover:text-gold",
  purple: "text-purple-deep hover:text-purple",
  orange: "text-orange hover:text-orange/80",
};

const CONTRIBUTION_VERBS: Record<string, string> = {
  "venue-help": "helped set up at",
  "event-support": "supported an event at",
  "community-building": "welcomed new members at",
  "knowledge-sharing": "shared knowledge at",
  outreach: "did outreach for",
};

function relativeTime(date: Date, now: number): string {
  const seconds = Math.floor((now - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

type ContributionRow = {
  id: string;
  userName: string;
  clubName: string;
  type: string;
  description: string | null;
  points: number;
  status: string;
  confirmedByName: string | null;
  createdAt: Date;
};

type ClubCard = {
  provider: Awaited<ReturnType<typeof getProviders>>[number];
  stats: Awaited<ReturnType<typeof getClubStats>>;
  nextEvent: ClubEvent | null;
};

export default async function ClubsPage() {
  // ── 1. Fetch all providers ──
  const allProviders = await getProviders();

  // ── 2. Stats for every provider (parallel) ──
  const allStats = await Promise.all(
    allProviders.map((p) => getClubStats(p.id)),
  );

  // ── 3. Filter to clubs with real members ──
  const providersWithMembers = allProviders.filter(
    (_, i) => allStats[i].memberFamilies > 0,
  );
  const filteredStats = allStats.filter((s) => s.memberFamilies > 0);

  // ── 4. Get events for clubs with members ──
  const eventsByClub = await Promise.all(
    providersWithMembers.map((p) => getClubEvents(p.id)),
  );

  const now = Date.now();
  const clubs: ClubCard[] = providersWithMembers.map((provider, i) => ({
    provider,
    stats: filteredStats[i],
    nextEvent: eventsByClub[i].find((e) => e.startTime.getTime() >= now) ?? null,
  }));

  // ── 5. Open ride requests ──
  const allRides = await getRideRequests();
  const openRides: RideRequestWithNames[] = allRides.filter(
    (r) => r.status === "open",
  );

  // ── 6. Build eventId → clubSlug lookup for ride cards ──
  const eventToSlug = new Map<string, string>();
  for (let i = 0; i < providersWithMembers.length; i++) {
    const slug = providersWithMembers[i].slug;
    for (const evt of eventsByClub[i]) {
      eventToSlug.set(evt.id, slug);
    }
  }

  const hasClubs = clubs.length > 0;
  const hasRides = openRides.length > 0;

  // ── 7. Global Ubuntu Feed ──
  const contributions = await getCommunityContributions({ limit: 10 });
  const contributionNow = Date.now();
  const hasContributions = contributions.length > 0;

  // ── Activity feed data ──
  const nowMs = Date.now();
  const weekFromNow = nowMs + 7 * 86400000;

  // Provider id → name lookup for event cards
  const providerNameById = new Map(
    providersWithMembers.map((p) => [p.id, p.name]),
  );

  // Upcoming events across all clubs (within 7 days)
  const upcomingEvents = eventsByClub
    .flat()
    .filter((e) => {
      const t = e.startTime.getTime();
      return t >= nowMs && t <= weekFromNow;
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, 5)
    .map((e) => ({
      type: "event" as const,
      icon: "📅",
      title: e.title,
      subtitle: `${formatEventDate(e.startTime)}${e.location ? ` — ${e.location}` : ""}`,
      providerName: providerNameById.get(e.providerId) ?? "A club",
      time: e.startTime.getTime(),
    }));

  // Recent ride requests (newest first)
  const recentRides = allRides
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 5)
    .map((r) => ({
      type: "ride" as const,
      icon: "🚗",
      title: `${r.parentName} needs a ride for ${r.childName || "their child"}`,
      subtitle: r.eventTitle,
      providerName: eventToSlug.get(r.eventId)
        ? providersWithMembers.find(
            (p) => p.slug === eventToSlug.get(r.eventId),
          )?.name ?? "A club"
        : "A club",
      time: r.createdAt?.getTime() ?? 0,
    }));

  // Merge and sort by time (newest first)
  const activityItems = [...recentRides, ...upcomingEvents]
    .sort((a, b) => b.time - a.time)
    .slice(0, 8);

  const hasActivity = activityItems.length > 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ── InteriorHero ── */}
        <InteriorHero
          eyebrow="Community"
          title={
            <>
              Find your{" "}
              <span className="text-teal">club</span>, share the{" "}
              <span className="text-gold-deep">ride</span>
            </>
          }
          subtitle="Every provider on ILALI is a club — with events, members, and ride-sharing. Find your crew and stay connected."
          imageSrc="/images/hero/hero-clubs.jpg"
          imageAlt="ILALI community clubs in Cape Town"
        />

        {/* ═══════ BENTO GRID — irregular modular layout ═══════ */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6">
            {/* ── BLOCK 1: Active Clubs (spans 2 columns, full height) ── */}
            <section className="lg:col-span-2" aria-labelledby="clubs-heading">
              <div className="flex items-center justify-between mb-5">
                <h2
                  id="clubs-heading"
                  className="font-display text-[clamp(1.3rem,2vw,1.6rem)] font-bold text-ink"
                >
                  Active clubs
                </h2>
                {hasClubs && (
                  <span className="text-xs font-semibold text-ink-faint">
                    {clubs.length} club{clubs.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {hasClubs ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {clubs.map((club, idx) => {
                    const accent = ACCENT_ROTATION[idx % ACCENT_ROTATION.length];
                    const provider = club.provider;
                    const categoryName =
                      (provider as { category?: string }).category
                        ?.split("-")
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ") ?? "Club";

                    return (
                      <Link
                        key={provider.id}
                        href={`/clubs/${provider.slug}`}
                        className={`group flex flex-col rounded-[14px] border border-ink/10 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition-all duration-200 border-t-[3px] ${ACCENT_BORDER[accent]}`}
                      >
                        {/* Card body */}
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-[15px] font-bold text-ink leading-[1.3] group-hover:text-teal-deep transition-colors">
                            {provider.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {categoryName}
                          </p>

                          {/* Stats row */}
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                            <span className="flex items-center gap-1">
                              <Users
                                className="h-3.5 w-3.5 text-ilali-500"
                                aria-hidden="true"
                              />
                              {club.stats.memberFamilies} member famil
                              {club.stats.memberFamilies === 1 ? "y" : "ies"}
                            </span>
                            {club.nextEvent && (
                              <span className="flex items-center gap-1">
                                <CalendarDays
                                  className="h-3.5 w-3.5 text-ilali-500"
                                  aria-hidden="true"
                                />
                                {formatEventDate(club.nextEvent.startTime)}
                              </span>
                            )}
                          </div>

                          {/* Next event detail */}
                          {club.nextEvent && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg bg-paper-warm p-2.5 text-xs">
                              <div
                                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${ACCENT_DOT[accent]}`}
                                aria-hidden="true"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-ink truncate">
                                  {club.nextEvent.title}
                                </p>
                                {club.nextEvent.location && (
                                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                                    <MapPin className="h-3 w-3" aria-hidden="true" />
                                    {club.nextEvent.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Accent bar + link */}
                        <div
                          className={`flex items-center justify-end gap-1 px-5 py-2.5 border-t border-ink/5 bg-paper-warm text-xs font-semibold ${ACCENT_LINK[accent]}`}
                        >
                          View club
                          <span aria-hidden="true">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-10 text-center">
                  <Users
                    className="mx-auto h-8 w-8 text-ink-faint"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-sm font-medium text-ink-soft">
                    No active clubs yet
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Clubs form when families join a provider. Be the first!
                  </p>
                </div>
              )}
            </section>

            {/* ── BLOCK 2: Activity Feed (sidebar column, tall) ── */}
            <div className="lg:col-span-1 space-y-6">
              {hasActivity && (
                <section
                  aria-labelledby="activity-heading"
                  className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
                >
                  <h2
                    id="activity-heading"
                    className="font-display text-sm font-bold text-ink flex items-center gap-2 mb-4"
                  >
                    <Clock className="h-4 w-4 text-ilali-500" aria-hidden="true" />
                    Recent Activity
                  </h2>
                  <div className="space-y-3">
                    {activityItems.slice(0, 6).map((item, idx) => (
                      <div
                        key={`${item.type}-${idx}`}
                        className="flex items-start gap-3 rounded-lg bg-paper-warm p-3"
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-base"
                          aria-hidden
                        >
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-faint truncate">
                            {item.subtitle}
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-ink-faint/70">
                            {item.providerName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Ride-sharing board — compact sidebar block */}
              {hasRides && (
                <section
                  aria-labelledby="rides-heading"
                  className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      id="rides-heading"
                      className="font-display text-sm font-bold text-ink flex items-center gap-2"
                    >
                      <Car className="h-4 w-4 text-gold" aria-hidden="true" />
                      Ride board
                    </h2>
                    <span className="text-[10px] font-semibold text-ink-faint">
                      {openRides.length} open
                    </span>
                  </div>
                  <div className="space-y-3">
                    {openRides.slice(0, 3).map((ride, idx) => {
                      const accent = ACCENT_ROTATION[idx % ACCENT_ROTATION.length];
                      const DirectionIcon =
                        ride.direction === "to" ? ArrowRight : ArrowLeft;
                      const clubSlug = eventToSlug.get(ride.eventId);

                      return (
                        <div
                          key={ride.id}
                          className={`rounded-xl border border-ink/10 bg-paper-warm p-3 border-t-[2px] ${ACCENT_BORDER[accent]}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <DirectionIcon
                              className="h-3.5 w-3.5 shrink-0 text-ilali-500"
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold text-ink">
                              {ride.direction === "to"
                                ? "Ride to event"
                                : "Ride from event"}
                            </span>
                            <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                              Open
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-ink-soft leading-relaxed">
                            <span className="font-semibold text-ink">
                              {ride.parentName}
                            </span>{" "}
                            needs a ride for{" "}
                            <span className="font-medium">{ride.childName}</span>
                          </p>
                          <p className="mt-0.5 text-[10px] text-ink-faint flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" aria-hidden="true" />
                            {ride.eventTitle}
                          </p>
                          {clubSlug ? (
                            <Link
                              href={`/clubs/${clubSlug}`}
                              className={`mt-2 inline-flex items-center gap-0.5 text-[10px] font-semibold ${ACCENT_LINK[accent]}`}
                            >
                              Claim this ride →
                            </Link>
                          ) : (
                            <span className="mt-2 text-[10px] text-ink-faint italic">
                              Visit a club to claim
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* ── BLOCK 3: Ubuntu Feed (full width, below) ── */}
          {hasContributions && (
            <section
              aria-labelledby="ubuntu-heading"
              className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm lg:p-8"
            >
              <div className="mb-5">
                <h2
                  id="ubuntu-heading"
                  className="font-display text-[clamp(1.2rem,1.8vw,1.5rem)] font-bold text-ink flex items-center gap-2"
                >
                  <span aria-hidden="true">🤝</span>
                  Ubuntu Feed
                </h2>
                <p className="mt-1 text-sm text-ink-faint">
                  See how the community is helping each other
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {contributions.slice(0, 6).map((c) => {
                  const verb = CONTRIBUTION_VERBS[c.type] ?? "contributed at";
                  const isConfirmed = c.status === "confirmed";

                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 rounded-xl border border-ink/10 bg-paper-warm p-4"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-bold text-teal-deep"
                        aria-hidden="true"
                      >
                        {c.userName?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">
                          <span className="font-semibold">{c.userName}</span>{" "}
                          <span className="text-ink-soft">{verb}</span>{" "}
                          <span className="font-medium">{c.clubName}</span>
                        </p>
                        {c.description && (
                          <p className="mt-0.5 text-xs text-ink-faint line-clamp-2">
                            {c.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-[11px] text-ink-faint/70">
                            {c.createdAt
                              ? relativeTime(c.createdAt, contributionNow)
                              : ""}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-semibold text-teal-deep">
                            +{c.points} pts
                          </span>
                          {isConfirmed ? (
                            <span className="text-[11px] text-ilali-600 font-medium">
                              confirmed ✓
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-faint italic">
                              pending…
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── CTA band ── */}
        <section className="border-t border-ink/5 bg-paper px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-7xl text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold-deep-2">
              ★ IT TAKES A VILLAGE
            </span>
            <h2 className="font-display mt-2 text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold text-ink">
              Browse all{" "}
              <span className="text-teal">vetted</span> providers
            </h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-sm text-ink-faint">
              Every listed provider on ILALI is also a club. Find activities
              your kids will love — and a community to share the journey.
            </p>
            <div className="mt-5">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-[10px] bg-gold px-8 py-3.5 text-[15px] font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] transition-transform hover:-translate-y-px"
              >
                Browse all activities →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
