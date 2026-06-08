"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function ReferralForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      referrer_name: formData.get("referrerName"),
      referrer_email: formData.get("referrerEmail"),
      provider_name: formData.get("providerName"),
      provider_email: formData.get("providerEmail"),
      provider_phone: formData.get("providerPhone"),
    };

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Something went wrong");

      setSubmitted(true);
    } catch {
      setError("Could not submit referral. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-12 w-12 text-ilali-500" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Referral submitted!
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Thanks for helping us build a safer community. You&apos;ll earn
          Ubuntu Rewards once the provider completes their first booking.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Your details
        </legend>
        <div className="space-y-3">
          <input
            id="referrerName"
            name="referrerName"
            type="text"
            required
            placeholder="Your full name"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
          <input
            id="referrerEmail"
            name="referrerEmail"
            type="email"
            required
            placeholder="Your email address"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Provider details
        </legend>
        <div className="space-y-3">
          <input
            id="providerName"
            name="providerName"
            type="text"
            required
            placeholder="Provider's name or business name"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
          <input
            id="providerEmail"
            name="providerEmail"
            type="email"
            required
            placeholder="Provider's email address"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
          <input
            id="providerPhone"
            name="providerPhone"
            type="tel"
            placeholder="Provider's phone number (optional)"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? "Submitting…" : "Submit referral"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
