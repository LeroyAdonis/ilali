import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Home,
  MapPin,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import ClubEventCard from "@/components/community/ClubEventCard";
import RoleBadge from "@/components/community/RoleBadge";
import RideRequest from "@/components/community/RideRequest";
import {
  getProviderBySlug,
  getCategories,
  getClubEvents,
  getClubStats,
} from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

export default async function ClubHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  const [categories, events, stats] = await Promise.all([
    getCategories(),
    getClubEvents(dbProvider.id),
    getClubStats(dbProvider.id),
  ]);
  const provider = mapProvider(dbProvider, categories);

  // Upcoming events only (data-source returns upcoming-first, already sorted)
  const now = Date.now();
  const upcomingEvents = events
    .filter((e) => e.startTime.getTime() >= now)
    .slice(0, 3);

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      {/* ── Main column ── */}
      <div className="lg:col-span-2 space-y-10">
        {/* About */}
        <section aria-labelledby="club-about">
          <h2
            id="club-about"
            className="text-lg font-bold text-slate-900 mb-2"
          >
            About this club
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            {provider.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-ilali-500" aria-hidden="true" />
              {provider.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 text-ilali-500" aria-hidden="true" />
              {stats.memberFamilies} member famil
              {stats.memberFamilies === 1 ? "y" : "ies"}
            </span>
            <Link
              href={`/activity/${slug}`}
              className="text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
            >
              View activity listing →
            </Link>
          </div>
        </section>

        {/* Schedule (Upcoming) */}
        <section aria-labelledby="club-schedule">
          <div className="flex items-center justify-between">
            <h2
              id="club-schedule"
              className="text-lg font-bold text-slate-900 mb-2"
            >
              Upcoming events
            </h2>
            <Link
              href={`/clubs/${slug}/events`}
              className="flex items-center gap-0.5 text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <ClubEventCard
                  key={event.id}
                  event={event}
                  memberFamilies={stats.memberFamilies}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <CalendarDays
                className="mx-auto h-6 w-6 text-slate-400"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-slate-600">
                No upcoming events yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Check the full schedule for past sessions and more.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── Community sidebar ── */}
      <aside className="space-y-6">
        {/* Community panel */}
        <section
          aria-labelledby="club-community"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2
            id="club-community"
            className="flex items-center gap-2 text-sm font-bold text-slate-900"
          >
            <Users className="h-4 w-4 text-ilali-500" aria-hidden="true" />
            Community
          </h2>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {stats.memberFamilies}
          </p>
          <p className="text-xs text-slate-500">
            member famil{stats.memberFamilies === 1 ? "y" : "ies"} in this club
          </p>

          {stats.familiesBySuburb.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Families by suburb
              </p>
              {stats.familiesBySuburb.slice(0, 4).map((row) => (
                <div key={row.suburb} className="flex items-center gap-2">
                  <Home
                    className="h-3.5 w-3.5 text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-slate-600">{row.suburb}</span>
                  <span className="ml-auto text-xs font-semibold text-slate-500">
                    {row.count} famil{row.count === 1 ? "y" : "ies"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/clubs/${slug}/members`}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
          >
            Meet the members
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>

        {/* Rewards teaser — top volunteers */}
        <section
          aria-labelledby="club-volunteers"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2
            id="club-volunteers"
            className="flex items-center gap-2 text-sm font-bold text-slate-900"
          >
            <Trophy className="h-4 w-4 text-sunset-500" aria-hidden="true" />
            Top volunteers
          </h2>
          {stats.topVolunteers.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {stats.topVolunteers.slice(0, 4).map((v) => (
                <li key={v.parentId} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ilali-100 to-sunset-100 text-sm font-bold text-ilali-700">
                    {(v.parentName ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {v.parentName ?? "Club volunteer"}
                    </p>
                    <RoleBadge role={v.role} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Be the first volunteer — earn points every season.
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Volunteers earn rewards for helping the club run.
          </p>
        </section>

        {/* Ride requests — interactive lift club (Task 5) */}
        <RideRequest
          providerId={provider.id}
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime.toISOString(),
          }))}
        />
      </aside>
    </div>
  );
}
