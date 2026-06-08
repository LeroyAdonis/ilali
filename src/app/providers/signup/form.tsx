"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      activity_type: formData.get("activityType"),
    };

    try {
      const res = await fetch("/api/providers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Something went wrong");

      setSubmitted(true);
    } catch {
      setError("Could not submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-ilali-500" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            You&apos;re on the list!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Thanks for your interest. We&apos;ll review your application and
            get back to you within 2 business days.
          </p>
        </div>
      </section>
    );
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
            <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
              placeholder="+27 82 123 4567"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="activityType">
              Activity type
            </label>
            <select
              id="activityType"
              name="activityType"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
            >
              <option value="">Select a category…</option>
              {activityTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Submitting…" : "Submit interest"}
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
