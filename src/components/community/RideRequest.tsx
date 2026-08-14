"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  CheckCircle2,
  LogIn,
  Plus,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

// ── Types ──

export interface RideEventOption {
  id: string;
  title: string;
  startTime: string; // ISO — parsed client-side
}

export interface RideRequestItem {
  id: string;
  eventId: string;
  eventTitle: string;
  parentId: string;
  parentName: string;
  childId: string;
  childName: string;
  direction: "to" | "from";
  status: "open" | "claimed" | "completed";
  claimedBy: string | null;
  claimedByName: string | null;
  requesterConfirmed: boolean;
  claimerConfirmed: boolean;
  createdAt: string;
}

interface RideRequestProps {
  providerId: string;
  events: RideEventOption[];
}

interface ChildOption {
  id: string;
  name: string;
  age: number;
}

// ── Status badge styles (open amber, claimed blue, completed green) ──

const STATUS_BADGE: Record<
  RideRequestItem["status"],
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-amber-100 text-amber-700" },
  claimed: { label: "Claimed", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

function formatEventOption(e: RideEventOption): string {
  const d = new Date(e.startTime);
  if (Number.isNaN(d.getTime())) return e.title;
  const day = d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-ZA", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} ${time} — ${e.title}`;
}

// ── Component ──

export default function RideRequest({ providerId, events }: RideRequestProps) {
  const { data: session, isPending: sessionPending } = useSession();
  const signedIn = !!session?.user;
  const userId = session?.user?.id ?? null;

  const [rides, setRides] = useState<RideRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Post-a-request form state
  const [formOpen, setFormOpen] = useState(false);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [formEventId, setFormEventId] = useState("");
  const [formChildId, setFormChildId] = useState("");
  const [formDirection, setFormDirection] = useState<"to" | "from">("to");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => new Date(e.startTime).getTime() >= Date.now() - 3600000)
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
    [events]
  );

  // ── Load ride requests ──
  const loadRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rides?providerId=${encodeURIComponent(providerId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body && typeof body.error === "string" ? body.error : null) ??
            `Request failed (${res.status})`
        );
      }
      setRides((await res.json()) as RideRequestItem[]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Couldn't load ride requests. Try again."
      );
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  // ── Load children when the form opens ──
  useEffect(() => {
    if (!formOpen || !signedIn || children.length > 0 || childrenLoading) return;
    let cancelled = false;
    setChildrenLoading(true);
    fetch("/api/rides/children")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = (await res.json()) as ChildOption[];
        if (!cancelled) {
          setChildren(data);
          if (data.length > 0) setFormChildId(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setFormError("Couldn't load your children — refresh to retry.");
      })
      .finally(() => {
        if (!cancelled) setChildrenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [formOpen, signedIn, children.length, childrenLoading]);

  // Default event selection when the form opens
  useEffect(() => {
    if (formOpen && !formEventId && upcomingEvents.length > 0) {
      setFormEventId(upcomingEvents[0].id);
    }
  }, [formOpen, formEventId, upcomingEvents]);

  // ── Actions ──

  const runAction = async (rideId: string, action: () => Promise<Response>) => {
    setBusyId(rideId);
    setActionError(null);
    try {
      const res = await action();
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (body && typeof body.error === "string" ? body.error : null) ??
            `Request failed (${res.status})`
        );
      }
      await loadRides(); // refresh after every action
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleClaim = (rideId: string) =>
    runAction(rideId, () =>
      fetch(`/api/rides/${rideId}/claim`, { method: "POST" })
    );

  const handleConfirm = (rideId: string, as: "requester" | "claimer") =>
    runAction(rideId, () =>
      fetch(`/api/rides/${rideId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ as }),
      })
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formChildId || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: formEventId,
          childId: formChildId,
          direction: formDirection,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (body && typeof body.error === "string" ? body.error : null) ??
            `Request failed (${res.status})`
        );
      }
      setFormOpen(false);
      setFormEventId("");
      setFormChildId("");
      setFormDirection("to");
      await loadRides();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Couldn't post your request. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──

  return (
    <section
      aria-labelledby="club-rides"
      className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2
          id="club-rides"
          className="flex items-center gap-2 text-sm font-bold text-ink"
        >
          <Car className="h-4 w-4 text-ilali-500" aria-hidden="true" />
          Ride requests
        </h2>
        {signedIn && (
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg bg-ilali-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ilali-700"
          >
            {formOpen ? (
              <>
                <Plus className="h-3.5 w-3.5 rotate-45" aria-hidden="true" />
                Close
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Post a request
              </>
            )}
          </button>
        )}
      </div>

      {actionError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {actionError}
        </p>
      )}

      {/* Post-a-request form */}
      {signedIn && formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-3 rounded-lg bg-paper-warm p-3"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Post a ride request
          </p>

          <label className="block">
            <span className="text-[11px] font-medium text-ink-faint">Event</span>
            <select
              value={formEventId}
              onChange={(e) => setFormEventId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none"
            >
              <option value="" disabled>
                {upcomingEvents.length > 0
                  ? "Select an event…"
                  : "No upcoming events"}
              </option>
              {upcomingEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {formatEventOption(ev)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-medium text-ink-faint">Child</span>
            <select
              value={formChildId}
              onChange={(e) => setFormChildId(e.target.value)}
              required
              disabled={childrenLoading || children.length === 0}
              className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none disabled:opacity-60"
            >
              {childrenLoading ? (
                <option>Loading your children…</option>
              ) : children.length === 0 ? (
                <option value="">No children on your profile</option>
              ) : (
                children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.age})
                  </option>
                ))
              )}
            </select>
          </label>

          <fieldset>
            <legend className="text-[11px] font-medium text-ink-faint">
              Direction
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {(
                [
                  { value: "to", label: "Ride to event", icon: ArrowRight },
                  { value: "from", label: "Ride from event", icon: ArrowLeft },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormDirection(value)}
                  aria-pressed={formDirection === value}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    formDirection === value
                      ? "border-ilali-500 bg-ilali-50 text-ilali-700"
                      : "border-ink/10 bg-white text-ink-soft hover:bg-paper-warm"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {formError && (
            <p className="text-xs font-medium text-red-600">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || children.length === 0}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ilali-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ilali-700 disabled:opacity-60"
          >
            {submitting ? (
              <IlaliSpinner size="xs" variant="inverse" />
            ) : (
              <Car className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {submitting ? "Posting…" : "Post request"}
          </button>
        </form>
      )}

      {/* List */}
      <div className="mt-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <IlaliSpinner size="xs" />
          </div>
        ) : error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {error}
          </p>
        ) : rides.length === 0 ? (
          <p className="py-2 text-xs text-ink-faint">
            No ride requests yet — be the first to post one.
          </p>
        ) : (
          <ul className="space-y-3">
            {rides.map((ride) => {
              const badge = STATUS_BADGE[ride.status];
              const isRequester = userId === ride.parentId;
              const isClaimer = userId === ride.claimedBy;
              const DirectionIcon =
                ride.direction === "to" ? ArrowRight : ArrowLeft;

              return (
                <li
                  key={ride.id}
                  className="rounded-lg bg-paper-warm p-3"
                  data-testid="ride-request"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">
                      {ride.parentName}
                      <span className="ml-1.5 font-normal text-ink-faint">
                        needs a ride
                      </span>
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                    >
                      {ride.status === "completed" && (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      )}
                      {badge.label}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-ink-faint">{ride.eventTitle}</p>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <DirectionIcon
                        className="h-3.5 w-3.5 text-ilali-500"
                        aria-hidden="true"
                      />
                      {ride.direction === "to"
                        ? "Ride to event"
                        : "Ride from event"}
                    </span>
                    <span>· {ride.childName || "Child"}</span>
                    {ride.status === "claimed" && ride.claimedByName && (
                      <span>
                        · offered by{" "}
                        <span className="font-semibold text-blue-700">
                          {ride.claimedByName}
                        </span>
                      </span>
                    )}
                  </p>

                  {/* Two-sided confirmation progress */}
                  {ride.status === "claimed" && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-faint">
                      <span
                        className={
                          ride.requesterConfirmed
                            ? "inline-flex items-center gap-0.5 font-medium text-emerald-600"
                            : "inline-flex items-center gap-0.5"
                        }
                      >
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Requester confirmed
                      </span>
                      <span
                        className={
                          ride.claimerConfirmed
                            ? "inline-flex items-center gap-0.5 font-medium text-emerald-600"
                            : "inline-flex items-center gap-0.5"
                        }
                      >
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Claimer confirmed
                      </span>
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-2">
                    {ride.status === "open" &&
                      signedIn &&
                      !isRequester && (
                        <button
                          type="button"
                          onClick={() => handleClaim(ride.id)}
                          disabled={busyId === ride.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-ilali-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ilali-700 disabled:opacity-60"
                        >
                          {busyId === ride.id ? (
                            <IlaliSpinner size="xs" />
                          ) : (
                            <Car className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          I can help
                        </button>
                      )}

                    {ride.status === "claimed" &&
                      signedIn &&
                      ((isRequester && !ride.requesterConfirmed) ||
                        (isClaimer && !ride.claimerConfirmed)) && (
                        <button
                          type="button"
                          onClick={() =>
                            handleConfirm(
                              ride.id,
                              isRequester ? "requester" : "claimer"
                            )
                          }
                          disabled={busyId === ride.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {busyId === ride.id ? (
                            <IlaliSpinner size="xs" />
                          ) : (
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          Confirm ride complete
                        </button>
                      )}

                    {ride.status === "claimed" &&
                      ((isRequester && ride.requesterConfirmed) ||
                        (isClaimer && ride.claimerConfirmed)) && (
                        <p className="text-[11px] font-medium text-ink-faint">
                          Waiting for the other parent to confirm…
                        </p>
                      )}

                    {ride.status === "completed" && (
                      <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Ride complete · both parents earned 50 pts
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Auth prompt */}
      {!signedIn && !sessionPending && (
        <Link
          href="/auth/signin"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-warm"
        >
          <LogIn className="h-3.5 w-3.5 text-ilali-500" aria-hidden="true" />
          Sign in to offer a lift or post a request
        </Link>
      )}

      <p className="mt-3 text-xs text-ink-faint">
        Offering a lift earns you volunteer points.
      </p>
    </section>
  );
}
