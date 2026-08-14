"use client";

import { useState } from "react";
import { z } from "zod/v4";
import { IlaliSpinner } from "@/components/IlaliSpinner";

// ── Types ──

export interface ChildInput {
  name: string;
  age: string; // string for form input, validated as 1-18
  interests: string[];
  suburb: string;
  availability: {
    days: string[];
    timeSlots: string[];
  };
}

// ── Constants ──

export const INTEREST_OPTIONS = [
  "Soccer",
  "Swimming",
  "Art",
  "Music",
  "Coding",
  "Dance",
  "Drama",
  "Science",
  "Horse Riding",
  "Gymnastics",
  "Cricket",
  "Piano",
  "Guitar",
  "Nature/Outdoors",
  "Maths",
] as const;

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const;

// ── Zod Schema ──

export const childFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  age: z.coerce
    .number()
    .int()
    .min(1, "Age must be between 1 and 18")
    .max(18, "Age must be between 1 and 18"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  suburb: z.string().optional(),
  availability: z.object({
    days: z.array(z.string()).min(1, "Select at least one day"),
    timeSlots: z.array(z.string()).min(1, "Select at least one time slot"),
  }),
});

// ── Empty helper ──

export function emptyChild(): ChildInput {
  return {
    name: "",
    age: "",
    interests: [],
    suburb: "",
    availability: { days: [], timeSlots: [] },
  };
}

// ── Props ──

export interface ChildFormProps {
  initialData?: ChildInput;
  onSave: (data: ChildInput) => Promise<void>;
  onCancel?: () => void;
  saveLabel?: string;
  /** Called on every change — useful for syncing state up to a parent */
  onChange?: (data: ChildInput) => void;
  /** Hide the save/cancel action buttons — useful when embedding in a multi-form layout */
  hideActions?: boolean;
}

// ── Component ──

export default function ChildForm({
  initialData,
  onSave,
  onCancel,
  saveLabel = "Save",
  onChange,
  hideActions = false,
}: ChildFormProps) {
  const [child, setChild] = useState<ChildInput>(
    initialData ?? emptyChild()
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Helpers ──

  function updateField(field: keyof ChildInput, value: unknown) {
    setChild((prev) => {
      const next = { ...prev, [field]: value };
      onChange?.(next);
      return next;
    });
  }

  function toggleAvailabilitySection(
    section: "days" | "timeSlots",
    value: string
  ) {
    setChild((prev) => {
      const current = prev.availability[section];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const next = {
        ...prev,
        availability: { ...prev.availability, [section]: updated },
      };
      onChange?.(next);
      return next;
    });
  }

  function toggleInterest(interest: string) {
    setChild((prev) => {
      const updated = prev.interests.includes(interest)
        ? prev.interests.filter((v) => v !== interest)
        : [...prev.interests, interest];
      const next = { ...prev, interests: updated };
      onChange?.(next);
      return next;
    });
  }

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate with Zod
    const result = childFormSchema.safeParse({
      name: child.name,
      age: child.age,
      interests: child.interests,
      suburb: child.suburb,
      availability: child.availability,
    });

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      setError(firstIssue?.message ?? "Validation failed");
      return;
    }

    setLoading(true);
    try {
      await onSave(child);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-ink-soft">
          Name
        </label>
        <input
          type="text"
          value={child.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Child's name"
          className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        />
      </div>

      {/* Age */}
      <div>
        <label className="block text-xs font-medium text-ink-soft">
          Age
        </label>
        <input
          type="number"
          min={1}
          max={18}
          value={child.age}
          onChange={(e) => updateField("age", e.target.value)}
          placeholder="1–18"
          className="mt-1 block w-24 rounded-lg border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        />
      </div>

      {/* Interests */}
      <div>
        <label className="block text-xs font-medium text-ink-soft mb-2">
          Interests
        </label>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const selected = child.interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-ilali-100 text-ilali-700 border border-ilali-300"
                    : "border border-ink/10 bg-white text-ink-faint hover:border-ink/10 hover:bg-paper-warm"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suburb */}
      <div>
        <label className="block text-xs font-medium text-ink-soft">
          Suburb <span className="text-ink-faint font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={child.suburb}
          onChange={(e) => updateField("suburb", e.target.value)}
          placeholder="e.g. Rondebosch"
          className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        />
      </div>

      {/* Availability — Days */}
      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5">
          Available days
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((day) => {
            const selected = child.availability.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleAvailabilitySection("days", day)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-ilali-600 text-white"
                    : "border border-ink/10 bg-white text-ink-faint hover:border-ink/10"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability — Time preference */}
      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5">
          Preferred time
        </label>
        <div className="flex gap-2">
          {TIME_SLOTS.map((slot) => {
            const selected = child.availability.timeSlots.includes(slot);
            return (
              <button
                key={slot}
                type="button"
                onClick={() => toggleAvailabilitySection("timeSlots", slot)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "bg-sunset-100 text-sunset-700 border border-sunset-300"
                    : "border border-ink/10 bg-white text-ink-faint hover:border-ink/10"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {!hideActions && (
        <div className="flex items-center justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <IlaliSpinner size="xs" variant="inverse" />
                Saving…
              </>
            ) : (
              saveLabel
            )}
          </button>
        </div>
      )}
    </form>
  );
}
