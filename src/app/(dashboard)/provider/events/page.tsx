"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Edit3, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import EventForm from "@/components/provider/EventForm";
import type { EventData } from "@/components/provider/EventForm";
import { IlaliSpinner } from "@/components/IlaliSpinner";

interface Event {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  rideRequestCount?: number;
  memberCount?: number;
  createdAt: string;
}

const EVENT_TYPE_BADGES: Record<string, { label: string; className: string }> = {
  practice: {
    label: "Practice",
    className: "bg-ilali-50 text-ilali-600",
  },
  game: {
    label: "Game",
    className: "bg-purple/10 text-purple",
  },
  event: {
    label: "Event",
    className: "bg-gold/10 text-gold-deep-2",
  },
  other: {
    label: "Other",
    className: "bg-ink/5 text-ink-faint",
  },
};

export default function ProviderEventsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!isPending && (!session || (session.user as { role?: string }).role !== "provider")) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/provider/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      } else {
        setError("Failed to load events");
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPending && session) {
      fetchEvents();
    }
  }, [session, isPending, fetchEvents]);

  const handleSave = (savedEvent: EventData) => {
    if (editingEvent) {
      // Update in-place
      setEvents((prev) => prev.map((e) => (e.id === savedEvent.id ? { ...e, ...savedEvent } : e)));
    } else {
      // Add new (will be enriched on re-fetch)
      const newEvent = { ...savedEvent, createdAt: new Date().toISOString() } as Event;
      setEvents((prev) => [newEvent, ...prev]);
    }
    setShowForm(false);
    setEditingEvent(null);
    // Re-fetch to get enriched data (attendee counts etc.)
    fetchEvents();
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;

    setDeletingId(eventId);
    try {
      const res = await fetch(`/api/provider/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-ZA", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.startTime) >= now);
  const pastEvents = events.filter((e) => new Date(e.startTime) < now);

  if (isPending || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center justify-center">
          <IlaliSpinner size="sm" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm text-orange">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Events</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Manage your schedule. Events appear on your club page for parents to see.
          </p>
        </div>
        {!showForm && !editingEvent && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-deep"
          >
            <Plus className="h-4 w-4" />
            Add event
          </button>
        )}
      </div>

      {/* Event form */}
      {(showForm || editingEvent) && (
        <div className="mb-8">
          <EventForm
            event={editingEvent}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
          />
        </div>
      )}

      {events.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-10 text-center">
          <Calendar className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 text-sm font-medium text-ink-soft">
            No events yet
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Create your first event to let parents know about your schedule.
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming events */}
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-ink truncate">
                        {event.title}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          EVENT_TYPE_BADGES[event.eventType]?.className ??
                          EVENT_TYPE_BADGES.other.className
                        }`}
                      >
                        {EVENT_TYPE_BADGES[event.eventType]?.label ?? "Other"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-faint">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(event.startTime)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    {/* Attendee info */}
                    {((event.rideRequestCount ?? 0) > 0 || (event.memberCount ?? 0) > 0) && (
                      <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
                        {(event.memberCount ?? 0) > 0 && (
                          <span>{event.memberCount} club member{event.memberCount !== 1 ? "s" : ""}</span>
                        )}
                        {(event.rideRequestCount ?? 0) > 0 && (
                          <span>{event.rideRequestCount} ride request{event.rideRequestCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setShowForm(false);
                      }}
                      className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
                      aria-label="Edit event"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-orange/10 hover:text-orange disabled:opacity-50"
                      aria-label="Delete event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Past events (collapsible) */}
          {pastEvents.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowPast(!showPast)}
                className="inline-flex items-center gap-2 text-sm font-medium text-ink-faint transition-colors hover:text-ink"
              >
                {showPast ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Past events ({pastEvents.length})
              </button>

              {showPast && (
                <div className="mt-3 space-y-4">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-ink/5 bg-paper-warm p-5 opacity-70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-semibold text-ink truncate">
                              {event.title}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                EVENT_TYPE_BADGES[event.eventType]?.className ??
                                EVENT_TYPE_BADGES.other.className
                              }`}
                            >
                              {EVENT_TYPE_BADGES[event.eventType]?.label ?? "Other"}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-faint">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDateTime(event.startTime)}
                            </span>
                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-orange/10 hover:text-orange disabled:opacity-50"
                            aria-label="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
