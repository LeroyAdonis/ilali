"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

interface ProviderData {
  name: string;
  category: string;
  description: string;
  providerName: string;
  location: string;
  ageMin: number;
  ageMax: number;
  priceValue: number;
  priceLabel: string;
  imageUrl: string | null;
  tags: string[];
  phone: string | null;
  isFree: boolean;
}

interface ScheduleRow {
  day: string;
  startTime: string;
  endTime: string;
}

interface PhotoRow {
  url: string;
}

export default function EditListingPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [priceLabel, setPriceLabel] = useState("per session");
  const [isFree, setIsFree] = useState(false);
  const [location, setLocation] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [photos, setPhotos] = useState<PhotoRow[]>([{ url: "" }]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([
    { day: "Monday", startTime: "", endTime: "" },
  ]);

  // Auth check + data fetch
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/auth/signin");
      return;
    }
    if (!sessionLoading && session) {
      const user = session.user as { role?: string };
      if (user.role !== "provider") {
        router.replace("/auth/signin");
        return;
      }
      // Fetch current provider data
      fetch("/api/provider")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to load");
          return r.json();
        })
        .then((data) => {
          const p = data.provider as ProviderData;
          setName(p.name || "");
          setCategory(p.category || "");
          setDescription(p.description || "");
          setAgeMin(String(p.ageMin || 0));
          setAgeMax(String(p.ageMax || 0));
          setIsFree(p.isFree || false);
          if (!p.isFree && p.priceValue > 0) {
            setPriceRands(String(p.priceValue / 100));
          }
          setPriceLabel(p.priceLabel || "per session");
          setLocation(p.location || "");
          setTagsInput((p.tags || []).join(", "));
          if (p.imageUrl) {
            setPhotos([{ url: p.imageUrl }]);
          }
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to load provider data");
        })
        .finally(() => setLoading(false));
    }
  }, [session, sessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Build update payload
      const payload: Record<string, unknown> = {};

      if (name.trim()) payload.name = name.trim();
      payload.description = description;
      payload.location = location;

      const minAge = Number(ageMin);
      const maxAge = Number(ageMax);
      if (!isNaN(minAge) && !isNaN(maxAge) && minAge >= 0 && maxAge >= 0) {
        payload.ageMin = minAge;
        payload.ageMax = maxAge;
      }

      if (isFree) {
        payload.isFree = true;
        payload.priceValue = 0;
      } else {
        const rands = Number(priceRands);
        if (!isNaN(rands) && rands > 0) {
          payload.priceValue = Math.round(rands * 100);
          payload.isFree = false;
          payload.priceLabel = priceLabel || "per session";
        }
      }

      // Tags: split and trim
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      payload.tags = tags;

      // Photos: first valid URL
      const validPhotos = photos.filter((p) => p.url.trim().length > 0);
      if (validPhotos.length > 0) {
        payload.imageUrl = validPhotos[0].url.trim();
      }

      const res = await fetch("/api/provider", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Save failed");
      }

      setSuccess(true);

      // Redirect back after short delay
      setTimeout(() => {
        router.push("/provider");
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const addPhoto = () => {
    if (photos.length >= 6) return;
    setPhotos([...photos, { url: "" }]);
  };

  const updatePhoto = (index: number, url: string) => {
    const updated = [...photos];
    updated[index] = { url };
    setPhotos(updated);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addScheduleRow = () => {
    setSchedule([...schedule, { day: "Monday", startTime: "", endTime: "" }]);
  };

  const updateScheduleRow = (
    index: number,
    field: keyof ScheduleRow,
    value: string
  ) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const removeScheduleRow = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const catLabels: Record<string, string> = {
    sports: "Sports",
    "arts-culture": "Arts & Culture",
    education: "Education",
    "music-lessons": "Music Lessons",
    "emotional-intelligence": "Emotional Intelligence",
    "holiday-programs": "Holiday Programs",
  };

  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-ilali-600" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="max-w-2xl animate-fade-in-up space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Edit Listing
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          Update your activity details. Changes appear immediately.
        </p>
      </div>

      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-teal-deep shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-deep-2">
              Listing updated successfully!
            </p>
            <p className="text-xs text-teal-deep">Redirecting to dashboard…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Activity name */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-lg font-bold text-ink">
            Activity Details
          </h2>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-ink-soft mb-1.5"
            >
              Activity name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Soccer Stars Academy"
              required
              className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-ink-soft mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe your activity — what makes it special? What will children learn?"
              className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200 resize-y"
            />
            <p className="mt-1 text-xs text-ink-faint">
              {description.length} characters (at least 50 recommended)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={catLabels[category] || category}
              readOnly
              className="w-full rounded-lg border border-ink/10 bg-paper-warm px-4 py-3 text-sm text-ink-soft cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-ink-faint">
              Category is set during application and cannot be changed here.
              Contact support for category changes.
            </p>
          </div>
        </section>

        {/* Age + Pricing + Location */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-lg font-bold text-ink">
            Age &amp; Pricing
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ageMin"
                className="block text-sm font-medium text-ink-soft mb-1.5"
              >
                Minimum age (years)
              </label>
              <input
                id="ageMin"
                type="number"
                min={0}
                max={18}
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
            <div>
              <label
                htmlFor="ageMax"
                className="block text-sm font-medium text-ink-soft mb-1.5"
              >
                Maximum age (years)
              </label>
              <input
                id="ageMax"
                type="number"
                min={0}
                max={18}
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4 rounded border-ink/20 text-ilali-600 focus:ring-ilali-500"
              />
              <span className="text-sm font-medium text-ink-soft">
                This activity is free
              </span>
            </label>

            {!isFree && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-ink-soft mb-1.5"
                  >
                    Price (Rands)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-faint">R</span>
                    <input
                      id="price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={priceRands}
                      onChange={(e) => setPriceRands(e.target.value)}
                      placeholder="150"
                      className="flex-1 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="priceLabel"
                    className="block text-sm font-medium text-ink-soft mb-1.5"
                  >
                    Price label
                  </label>
                  <input
                    id="priceLabel"
                    type="text"
                    value={priceLabel}
                    onChange={(e) => setPriceLabel(e.target.value)}
                    placeholder="per session"
                    className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-ink-soft mb-1.5"
            >
              Location / Suburb
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Claremont, Rondebosch"
              className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
        </section>

        {/* Tags */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-display text-lg font-bold text-ink">Tags</h2>
          <div>
            <label
              htmlFor="tags"
              className="block text-sm font-medium text-ink-soft mb-1.5"
            >
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="outdoor, team-sport, high-energy, creative"
              className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
            <p className="mt-1 text-xs text-ink-faint">
              Tags help parents find your activity in searches.
            </p>
          </div>
        </section>

        {/* Photos */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Photos</h2>
            {photos.length < 6 && (
              <button
                type="button"
                onClick={addPhoto}
                className="flex items-center gap-1.5 rounded-full bg-ilali-50 px-3 py-1.5 text-xs font-medium text-ilali-700 hover:bg-ilali-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add photo
              </button>
            )}
          </div>

          {photos.map((photo, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={photo.url}
                  onChange={(e) => updatePhoto(i, e.target.value)}
                  placeholder={`Photo URL ${i + 1} — https://example.com/photo.jpg`}
                  className="flex-1 rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="p-2 text-ink-faint hover:text-red-500 transition-colors"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {photo.url && (
                <div className="h-32 w-full overflow-hidden rounded-lg bg-paper-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {photos.length === 0 && (
            <p className="text-xs text-ink-faint">
              Add photos to make your listing stand out. Paste image URLs above.
            </p>
          )}
        </section>

        {/* Schedule */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Schedule</h2>
            <button
              type="button"
              onClick={addScheduleRow}
              className="flex items-center gap-1.5 rounded-full bg-ilali-50 px-3 py-1.5 text-xs font-medium text-ilali-700 hover:bg-ilali-100 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add time slot
            </button>
          </div>

          <p className="text-xs text-ink-faint">
            Set your weekly schedule. For full event management (games, open
            days, practices), use the{" "}
            <span className="font-medium text-ilali-600">Events</span> tab.
          </p>

          {schedule.map((row, i) => (
            <div
              key={i}
              className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-paper-warm/50"
            >
              <div>
                <label className="block text-xs font-medium text-ink-faint mb-1">
                  Day
                </label>
                <select
                  value={row.day}
                  onChange={(e) => updateScheduleRow(i, "day", e.target.value)}
                  className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none"
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-faint mb-1">
                  Start
                </label>
                <input
                  type="time"
                  value={row.startTime}
                  onChange={(e) =>
                    updateScheduleRow(i, "startTime", e.target.value)
                  }
                  className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-faint mb-1">
                  End
                </label>
                <input
                  type="time"
                  value={row.endTime}
                  onChange={(e) =>
                    updateScheduleRow(i, "endTime", e.target.value)
                  }
                  className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeScheduleRow(i)}
                className="p-2 text-ink-faint hover:text-red-500 transition-colors"
                aria-label={`Remove time slot ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {schedule.length === 0 && (
            <p className="text-xs text-ink-faint">
              No time slots added yet. Click &quot;Add time slot&quot; to set
              your weekly schedule.
            </p>
          )}
        </section>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2 inline" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/provider")}
            className="text-sm font-medium text-ink-faint hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
