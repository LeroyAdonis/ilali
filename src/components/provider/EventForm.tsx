"use client";

import { useState } from "react";
import { IlaliSpinner } from "@/components/IlaliSpinner";

export interface EventData {
  id: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
}

interface EventFormProps {
  event?: EventData | null;
  onSave: (event: EventData) => void;
  onCancel: () => void;
}

const EVENT_TYPES = [
  { value: "practice", label: "Practice" },
  { value: "game", label: "Game" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

function toLocalDatetimeString(dateStr: string): string {
  // Converts an ISO string to a datetime-local input value
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const isEditing = !!event;
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventType, setEventType] = useState(event?.eventType ?? "practice");
  const [startTime, setStartTime] = useState(
    event?.startTime ? toLocalDatetimeString(event.startTime) : ""
  );
  const [endTime, setEndTime] = useState(
    event?.endTime ? toLocalDatetimeString(event.endTime) : ""
  );
  const [location, setLocation] = useState(event?.location ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!startTime) {
      setError("Start time is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/provider/events/${event!.id}`
        : "/api/provider/events";
      const method = isEditing ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: title.trim(),
        eventType,
        startTime: new Date(startTime).toISOString(),
      };
      if (endTime) body.endTime = new Date(endTime).toISOString();
      if (location.trim()) body.location = location.trim();

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save event");
      }

      onSave(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-ink/10 bg-paper-warm p-6"
    >
      <h3 className="font-display text-lg font-bold text-ink">
        {isEditing ? "Edit event" : "Add event"}
      </h3>

      {error && (
        <div className="mt-3 rounded-lg bg-orange/10 px-4 py-2 text-sm font-medium text-orange">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="event-title"
            className="block text-xs font-semibold text-ink-faint uppercase tracking-wide"
          >
            Title *
          </label>
          <input
            id="event-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Saturday morning practice"
            className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            disabled={isSubmitting}
          />
        </div>

        {/* Event type */}
        <div>
          <label
            htmlFor="event-type"
            className="block text-xs font-semibold text-ink-faint uppercase tracking-wide"
          >
            Type
          </label>
          <select
            id="event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            disabled={isSubmitting}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start time */}
        <div>
          <label
            htmlFor="event-start"
            className="block text-xs font-semibold text-ink-faint uppercase tracking-wide"
          >
            Start time *
          </label>
          <input
            id="event-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            disabled={isSubmitting}
          />
        </div>

        {/* End time */}
        <div>
          <label
            htmlFor="event-end"
            className="block text-xs font-semibold text-ink-faint uppercase tracking-wide"
          >
            End time (optional)
          </label>
          <input
            id="event-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-sans text-sm text-ink focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            disabled={isSubmitting}
          />
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="event-location"
            className="block text-xs font-semibold text-ink-faint uppercase tracking-wide"
          >
            Location
          </label>
          <input
            id="event-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Green Point Park"
            className="mt-1 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-sans text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <IlaliSpinner size="xs" variant="inverse" />
              Saving...
            </>
          ) : isEditing ? (
            "Update event"
          ) : (
            "Create event"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-ink-faint transition-colors hover:text-ink disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
