"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, X } from "lucide-react";

interface WhoIsThisForModalProps {
  onClose: () => void;
}

/**
 * Post-signup, not at signup: after a guest resolves an intent (save / contact /
 * notify) we know they care about *something* — this asks who it's for so saved
 * activities and future recommendations are personalised from the start. The
 * onboarding API accepts a minimal { name, age } child (interests / suburb /
 * availability stay optional and can be filled in later).
 */
export default function WhoIsThisForModal({ onClose }: WhoIsThisForModalProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const parsedAge = Number(age);

    if (!trimmedName) {
      setError("Please tell us their name");
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > 18) {
      setError("Age must be between 1 and 18");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          children: [{ name: trimmedName, age: parsedAge }],
          preferences: {},
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that — please try again.");
        return;
      }

      setDone(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Who is this for?"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ilali-50">
              <CheckCircle2 className="h-7 w-7 text-ilali-600" aria-hidden="true" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink">All set!</h2>
            <p className="mt-2 text-sm text-ink-faint">
              We&apos;ve noted who it&apos;s for. Saved activities and recommendations
              will match from now on.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                  Who is this for?
                </h2>
                <p className="mt-1 text-sm text-ink-faint">
                  Tell us who the activities are for — it helps us recommend the right
                  things and keeps saved spots ready.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-paper-warm hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="child-name" className="block text-sm font-medium text-ink-soft">
                  Child&apos;s name
                </label>
                <input
                  id="child-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="e.g. Thandi"
                  className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>

              <div>
                <label htmlFor="child-age" className="block text-sm font-medium text-ink-soft">
                  Age
                </label>
                <input
                  id="child-age"
                  type="number"
                  min={1}
                  max={18}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  inputMode="numeric"
                  placeholder="e.g. 7"
                  className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Save it"
                )}
              </button>

              <p className="text-center text-xs text-ink-faint">
                You can add more children or details later — no pressure.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
