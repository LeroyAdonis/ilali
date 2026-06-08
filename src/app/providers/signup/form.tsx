"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const activityTypes = [
  "Arts & Culture",
  "Sports",
  "Music Lessons",
  "Education & Tutoring",
  "Holiday Programs",
  "Dance & Movement",
  "Emotional Intelligence",
  "Other",
];

export default function ProviderSignupForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    alert("Coming soon — we will notify you when provider sign-up is live!");
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Get started today
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Fill in your details and we&apos;ll be in touch.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Phone number</label>
            <input
              type="tel"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
              placeholder="+27 82 123 4567"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Activity type</label>
            <select
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
            >
              <option value="">Select a category…</option>
              {activityTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors flex items-center justify-center gap-2"
          >
            {submitted ? "You're on the list!" : "Submit interest"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-xs text-center text-slate-400">
            By submitting, you agree to our{" "}
            <Link href="/terms" className="text-ilali-500 hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-ilali-500 hover:underline">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </section>
  );
}
