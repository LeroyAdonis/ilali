import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import ClubEventCard from "@/components/community/ClubEventCard";
import {
  getProviderBySlug,
  getClubEvents,
  getClubStats,
} from "@/lib/data-source";
import { monthKey, monthLabel } from "@/lib/club-format";

export default async function ClubEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  const [events, stats] = await Promise.all([
    getClubEvents(dbProvider.id),
    getClubStats(dbProvider.id),
  ]);

  // eslint-disable-next-line react-hooks/purity -- server component: per-request time
  const now = Date.now();

  // Upcoming first, then past (data-source already sorts this way) — split
  // into two ordered groups so "Upcoming" always leads even with mixed data.
  const upcoming = events.filter((e) => e.startTime.getTime() >= now);
  const past = events.filter((e) => e.startTime.getTime() < now);
  const grouped = [...upcoming, ...past].reduce<
    Record<string, { upcoming: boolean; events: typeof events }>
  >((acc, event) => {
    const key = monthKey(event.startTime);
    if (!acc[key]) {
      acc[key] = {
        upcoming: event.startTime.getTime() >= now,
        events: [],
      };
    }
    acc[key].events.push(event);
    return acc;
  }, {});

  const monthGroups = Object.entries(grouped);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Full schedule</h2>
        <p className="mt-1 text-sm text-ink-faint">
          {events.length} event{events.length === 1 ? "" : "s"} — upcoming
          first. Joining events arrives soon.
        </p>
      </div>

      {monthGroups.length > 0 ? (
        monthGroups.map(([key, group]) => (
          <section key={key} aria-labelledby={`month-${key}`}>
            <h3
              id={`month-${key}`}
              className="mb-3 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink"
            >
              {group.upcoming && (
                <span className="rounded-full bg-ilali-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ilali-700">
                  Upcoming
                </span>
              )}
              {monthLabel(key)}
            </h3>
            <div className="space-y-3">
              {group.events.map((event) => (
                <ClubEventCard
                  key={event.id}
                  event={event}
                  memberFamilies={stats.memberFamilies}
                  showJoinButton={group.upcoming}
                />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-10 text-center">
          <CalendarDays
            className="mx-auto h-8 w-8 text-ink-faint"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-ink-soft">
            No events scheduled yet
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            The club will post practices, games and club days here.
          </p>
        </div>
      )}
    </div>
  );
}
