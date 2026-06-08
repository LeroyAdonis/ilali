"use client";

import { ArrowRight } from "lucide-react";

export default function ReferralForm() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("Coming soon — we will notify you when referrals are live!");
      }}
      className="space-y-4"
    >
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Your details
        </legend>
        <div className="space-y-3">
          <input
            type="text"
            required
            placeholder="Your full name"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
          <input
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
            type="text"
            required
            placeholder="Provider's name or business name"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
          <input
            type="email"
            required
            placeholder="Provider's email address"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
          <input
            type="tel"
            placeholder="Provider's phone number (optional)"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          />
        </div>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors flex items-center justify-center gap-2"
      >
        Submit referral
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
