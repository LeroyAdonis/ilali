"use client";

import { useState } from "react";
import Link from "next/link";
import { IlaliSpinner } from "@/components/IlaliSpinner";

export default function OnboardPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !description.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Please provide a bit more detail about your activity (at least 10 characters).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* ── Header ── */}
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img
                src="/images/brand/ilali-logo-38.png"
                alt="ILALI"
                width={38}
                height={38}
                className="rounded-md"
              />
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-ink-soft hover:text-ilali-600 transition-colors"
            >
              ← Back to ILALI
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ilali-50">
              <svg className="h-10 w-10 text-ilali-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Thanks, {name || "provider"}!
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              We&apos;ll review your activity and add you to ILALI within 48 hours.
              Keep an eye on your inbox — we&apos;ll send a confirmation to{" "}
              <span className="font-semibold text-ink">{email}</span>.
            </p>
            <div className="mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-ilali-700 hover:shadow-lg"
              >
                ← Back to ILALI
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper-warm">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img
              src="/images/brand/ilali-logo-38.png"
              alt="ILALI"
              width={38}
              height={38}
              className="rounded-md"
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-ink-soft hover:text-ilali-600 transition-colors"
          >
            ← Back to ILALI
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">
          {/* ── Heading ── */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ilali-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-ilali-700">
              <span className="h-1.5 w-1.5 rounded-full bg-ilali-500" />
              For Providers
            </span>
            <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Are you a children&apos;s activity provider?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Send us your poster and we&apos;ll add you to ILALI — free.
            </p>
          </div>

          {/* ── Two options: email or form ── */}
          <div className="mt-10 space-y-6">
            {/* Quick email link */}
            <a
              href="mailto:providers@ilali.co?subject=Add%20my%20activity%20to%20ILALI"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/10 bg-paper-warm px-6 py-5 text-base font-semibold text-ink-soft transition-all hover:border-ilali-400 hover:bg-ilali-50 hover:text-ilali-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              Email us your poster: providers@ilali.co
            </a>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-paper-warm px-4 text-ink-faint">
                  or fill in the form
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-ink-soft">
                  Provider name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your activity or business name"
                  className="mt-1.5 block w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-ink-soft">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 block w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-ink-soft">
                  Tell us about your activity <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-ink-faint">
                  What, where, ages, prices, schedule — anything that helps us build your listing.
                </p>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="e.g. We run fun soccer classes for 5–10 year olds in Rondebosch on Saturdays. R80 per session."
                  className="mt-1.5 block w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 resize-y"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-ilali-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <IlaliSpinner size="xs" variant="inverse" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </form>
          </div>

          {/* ── Trust note ── */}
          <p className="mt-8 text-center text-xs text-ink-faint">
            No spam — we&apos;ll only use your email to confirm your listing.
          </p>
        </div>
      </main>
    </div>
  );
}
