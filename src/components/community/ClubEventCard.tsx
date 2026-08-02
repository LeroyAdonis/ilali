import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import type { ClubEvent } from "@/lib/data-source";
import {
  formatEventDate,
  formatEventTimeRange,
} from "@/lib/club-format";

const EVENT_TYPE_STYLES: Record<
  ClubEvent["eventType"],
  { label: string; className: string }
> = {
  practice: {
    label: "Practice",
    className: "bg-ilali-50 text-ilali-700 border-ilali-100",
  },
  game: {
    label: "Game",
    className: "bg-sunset-50 text-sunset-600 border-sunset-100",
  },
  event: {
    label: "Club event",
    className: "bg-warm-50 text-warm-500 border-warm-100",
  },
  other: {
    label: "Other",
    className: "bg-paper-warm text-ink-soft border-ink/10",
  },
};

interface ClubEventCardProps {
  event: ClubEvent;
  /** Member-family count used as the attendance proxy (club_events has no attending column). */
  memberFamilies?: number;
  /** Show a non-functional "Join" button (interactions land in Task 5). */
  showJoinButton?: boolean;
}

/**
 * Single club event row — date, time, location, member-family count.
 * Server component: no interactivity yet (RSVP/join is Task 5).
 */
export default function ClubEventCard({
  event,
  memberFamilies,
  showJoinButton = false,
}: ClubEventCardProps) {
  const typeStyle = EVENT_TYPE_STYLES[event.eventType] ?? EVENT_TYPE_STYLES.other;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      {/* Date block */}
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-ilali-50 to-sunset-50 border border-ink/10">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          {event.startTime.toLocaleDateString("en-ZA", { month: "short" })}
        </span>
        <span className="text-xl font-extrabold leading-none text-ink">
          {event.startTime.getDate()}
        </span>
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-ink">{event.title}</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeStyle.className}`}
          >
            {typeStyle.label}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-ilali-500" aria-hidden="true" />
            {formatEventDate(event.startTime)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-ilali-500" aria-hidden="true" />
            {formatEventTimeRange(event.startTime, event.endTime)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ilali-500" aria-hidden="true" />
              {event.location}
            </span>
          )}
        </div>
        {typeof memberFamilies === "number" && memberFamilies > 0 && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-faint">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {memberFamilies} member famil{memberFamilies === 1 ? "y" : "ies"}
          </p>
        )}
      </div>

      {/* Join — non-functional placeholder (Task 5) */}
      {showJoinButton && (
        <button
          type="button"
          disabled
          title="Joining events arrives soon"
          className="shrink-0 rounded-full border border-ink/10 bg-paper-warm px-4 py-2 text-xs font-semibold text-ink-faint sm:self-center"
        >
          Join
        </button>
      )}
    </div>
  );
}
