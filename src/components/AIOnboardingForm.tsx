"use client";

import { useState } from "react";
import { Sparkles, MapPin, Tag, Clock, Banknote, ArrowRight } from "lucide-react";
import type { ProviderExtract } from "@/lib/ai/extract-provider";
import { IlaliSpinner } from "@/components/IlaliSpinner";

export default function AIOnboardingForm() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProviderExtract | null>(null);
  const [error, setError] = useState("");

  async function handleExtract(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError("Please describe your activity in a bit more detail (at least 10 characters).");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/extract-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      const json = await res.json();

      if (json.fallback) {
        setError(json.message);
      } else {
        setResult(json.extracted);
      }
    } catch {
      setError("Could not reach the AI. Please try again or fill in the form manually.");
    } finally {
      setLoading(false);
    }
  }

  function buildSignupUrl(): string {
    if (!result) return "/providers/signup";
    const params = new URLSearchParams();
    if (result.name) params.set("name", result.name);
    if (result.category) params.set("category", result.category);
    if (result.description) params.set("description", result.description);
    if (result.location) params.set("location", result.location);
    if (result.ageMin) params.set("ageMin", String(result.ageMin));
    if (result.ageMax) params.set("ageMax", String(result.ageMax));
    if (result.priceValue) params.set("price", String(result.priceValue));
    return `/providers/signup?${params.toString()}`;
  }

  return (
    <div className="rounded-2xl border border-ilali-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-ilali-50 to-sunset-50 px-6 py-5 border-b border-ilali-100">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-ilali-600" />
          <h3 className="text-lg font-bold text-ink">AI-Powered Setup</h3>
        </div>
        <p className="text-sm text-ink-faint">
          Describe your activity in plain language and we&apos;ll auto-fill your listing —
          then you just review and submit.
        </p>
      </div>

      <div className="p-6">
        {!result ? (
          <form onSubmit={handleExtract} className="space-y-4">
            <div>
              <label htmlFor="aiDescription" className="block text-sm font-medium text-ink-soft mb-1.5">
                Tell us about your activity
              </label>
              <textarea
                id="aiDescription"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='e.g. "I run art classes for kids aged 5-10 in Muizenberg every Saturday. R100 per session, all materials included."'
                className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm text-ink-soft placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors resize-y min-h-[44px]"
              />
              <p className="mt-1 text-xs text-ink-faint">
                Include: activity type, age range, location, price (if any), and what makes it special.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {loading ? (
                <>
                  <IlaliSpinner size="xs" variant="inverse" />
                  Analysing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract my listing
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-ilali-50 border border-ilali-200 px-4 py-3 text-sm text-ilali-700 font-medium">
              ✨ Here&apos;s what we extracted — review and continue to the signup form.
            </div>

            {/* Extracted fields */}
            <div className="grid gap-3 sm:grid-cols-2">
              {result.name && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Activity name</p>
                    <p className="text-sm font-medium text-ink">{result.name}</p>
                  </div>
                </div>
              )}
              {result.category && (
                <div className="flex items-start gap-2">
                  <Tag className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Category</p>
                    <p className="text-sm font-medium text-ink">{result.category}</p>
                  </div>
                </div>
              )}
              {result.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Location</p>
                    <p className="text-sm font-medium text-ink">{result.location}</p>
                  </div>
                </div>
              )}
              {(result.ageMin || result.ageMax) && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Age range</p>
                    <p className="text-sm font-medium text-ink">
                      {result.ageMin ?? "?"}–{result.ageMax ?? "?"} years
                    </p>
                  </div>
                </div>
              )}
              {result.priceValue != null && (
                <div className="flex items-start gap-2">
                  <Banknote className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Price</p>
                    <p className="text-sm font-medium text-ink">R{result.priceValue}/session</p>
                  </div>
                </div>
              )}
              {result.tags && result.tags.length > 0 && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Tag className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Tags</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-ilali-100 px-2.5 py-0.5 text-xs font-medium text-ilali-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {result.description && (
              <div>
                <p className="text-xs text-ink-faint mb-1">Description</p>
                <p className="text-sm leading-relaxed text-ink-soft">{result.description}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={buildSignupUrl()}
                className="flex items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors min-h-[44px]"
              >
                Continue to signup
                <ArrowRight className="h-4 w-4" />
              </a>
              <button
                onClick={() => { setResult(null); setDescription(""); }}
                className="text-sm text-ink-faint hover:text-ink-soft transition-colors min-h-[44px] px-4"
              >
                Try a different description
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
