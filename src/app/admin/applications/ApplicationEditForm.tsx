"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import type { Application } from "./ApplicationCard";

/**
 * Inline draft editor for pending/contacted applications.
 * Edits the same fields the poster/import flows capture, then PATCHes the
 * application in place. Approved/rejected apps are locked upstream (no Edit
 * button rendered) and the route double-guards.
 */
export function ApplicationEditForm({
  application,
  onDone,
}: {
  application: Application;
  onDone: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(application.name ?? "");
  const [activityType, setActivityType] = useState(application.activityType ?? "");
  const [description, setDescription] = useState(application.description ?? "");
  const [location, setLocation] = useState(application.location ?? "");
  const [ageMin, setAgeMin] = useState(
    application.ageMin != null ? String(application.ageMin) : ""
  );
  const [ageMax, setAgeMax] = useState(
    application.ageMax != null ? String(application.ageMax) : ""
  );
  const [priceValue, setPriceValue] = useState(
    application.priceValue != null ? String(application.priceValue) : ""
  );
  const [phone, setPhone] = useState(application.phone ?? "");
  const [email, setEmail] = useState(application.email ?? "");

  const inputCls =
    "mt-1 block w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-ink-soft";

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            name,
            activityType,
            description,
            location,
            ageMin: ageMin === "" ? null : Number(ageMin),
            ageMax: ageMax === "" ? null : Number(ageMax),
            priceValue: priceValue === "" ? null : Number(priceValue),
            phone,
            email,
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Could not save changes.");
        return;
      }
      router.refresh();
      onDone();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-ilali-200 bg-ilali-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Edit draft</p>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-ink/5 hover:text-ink transition-colors"
          aria-label="Close editor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor={`edit-name-${application.id}`}>
            Name
          </label>
          <input
            id={`edit-name-${application.id}`}
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`edit-type-${application.id}`}>
            Activity type
          </label>
          <input
            id={`edit-type-${application.id}`}
            className={inputCls}
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor={`edit-desc-${application.id}`}>
            Description
          </label>
          <textarea
            id={`edit-desc-${application.id}`}
            rows={3}
            className={inputCls}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`edit-loc-${application.id}`}>
            Location
          </label>
          <input
            id={`edit-loc-${application.id}`}
            className={inputCls}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`edit-email-${application.id}`}>
            Email
          </label>
          <input
            id={`edit-email-${application.id}`}
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`edit-phone-${application.id}`}>
            Phone
          </label>
          <input
            id={`edit-phone-${application.id}`}
            className={inputCls}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls} htmlFor={`edit-agemin-${application.id}`}>
              Age min
            </label>
            <input
              id={`edit-agemin-${application.id}`}
              type="number"
              min={0}
              max={18}
              className={inputCls}
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor={`edit-agemax-${application.id}`}>
              Age max
            </label>
            <input
              id={`edit-agemax-${application.id}`}
              type="number"
              min={0}
              max={18}
              className={inputCls}
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor={`edit-price-${application.id}`}>
              Price (R)
            </label>
            <input
              id={`edit-price-${application.id}`}
              type="number"
              min={0}
              step="0.01"
              className={inputCls}
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !name.trim() || !activityType.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ilali-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ilali-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
