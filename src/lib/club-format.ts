/**
 * Date/time formatting helpers for club pages.
 * Kept dependency-free (no date-fns) and consistent with the app's en-ZA audience.
 */

export function formatEventDate(d: Date): string {
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatEventTime(d: Date): string {
  return d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatEventTimeRange(start: Date, end: Date | null): string {
  const s = formatEventTime(start);
  if (!end) return s;
  return `${s} – ${formatEventTime(end)}`;
}

/** Month grouping key, e.g. "2026-08" */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Month label for a key, e.g. "August 2026" */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

export function formatJoinedDate(d: Date): string {
  return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}
