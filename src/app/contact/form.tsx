"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function ContactForm() {
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
      message: formData.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Something went wrong");

      setSubmitted(true);
    } catch {
      setError("Could not send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-ilali-500" />
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            Message sent!
          </h2>
          <p className="mt-2 text-sm text-ink-faint">
            Thanks for reaching out. We typically respond within 24 hours
            during business days.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <p className="text-center text-sm text-ink-faint">
          Fill in the form below and we&apos;ll get back to you as soon as
          possible.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink-soft">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your full name"
              className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-ink-soft">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              placeholder="How can we help you?"
              className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200 resize-y"
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Sending…" : "Send Message"}
          </button>
          <p className="text-center text-xs text-ink-faint">
            We typically respond within 24 hours during business days.
          </p>
        </form>
      </div>
    </section>
  );
}
