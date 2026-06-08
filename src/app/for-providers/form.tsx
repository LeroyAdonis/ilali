"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function ProviderInquiryForm() {
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
      <div className="mx-auto max-w-lg text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-ilali-500" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Application submitted!
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          We&apos;ll review your application and get back to you within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Your full name"
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+27 00 000 0000"
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        />
      </div>
      <div>
        <label htmlFor="activityType" className="block text-sm font-medium text-slate-700">
          Activity Type
        </label>
        <select
          id="activityType"
          name="activityType"
          required
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
        >
          <option value="">Select activity type...</option>
          <option value="sports">Sports</option>
          <option value="arts">Arts & Culture</option>
          <option value="music">Music Lessons</option>
          <option value="education">Education & STEM</option>
          <option value="holiday">Holiday Programs</option>
          <option value="other">Other</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Submitting…" : "Submit Application"}
      </button>
      <p className="text-center text-xs text-slate-400">
        We&apos;ll review your application and get back to you within 2 business days.
      </p>
    </form>
  );
}
