"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<"parent" | "provider">("parent");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendLink() {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim(),
        name: name.trim() || undefined,
        callbackURL: "/home",
      });

      if (result.error) {
        setError(result.error.message ?? "Could not send the link. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendLink();
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-warm px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block">
              <img
                src="/images/brand/ilali-logo-76-t.png"
                alt="ILALI"
                className="mx-auto h-16 w-auto"
              />
            </Link>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ilali-50">
                <MailCheck className="h-7 w-7 text-ilali-600" aria-hidden="true" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Check your inbox
              </h1>
              <p className="mt-2 text-sm text-ink-faint">
                We&apos;ve sent a magic link to{" "}
                <span className="font-medium text-ink-soft">{email.trim()}</span>. Tap it to
                continue to ILALI — no password needed.
              </p>
            </div>

            <p className="mb-6 text-center text-xs text-ink-faint">
              Didn&apos;t get it? Check spam, or{" "}
              <button
                type="button"
                onClick={() => void sendLink()}
                disabled={loading}
                className="font-medium text-ilali-600 underline hover:text-ilali-700 disabled:opacity-50"
              >
                {loading ? "Resending…" : "resend the link"}
              </button>
              .
            </p>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="mt-4 w-full text-center text-sm text-ink-faint hover:text-ilali-600 transition-colors"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-warm px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <img
              src="/images/brand/ilali-logo-76-t.png"
              alt="ILALI"
              className="mx-auto h-16 w-auto"
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              No password needed — we&apos;ll email you a magic link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-ink-soft"
              >
                What should we call you?{" "}
                <span className="font-normal text-ink-faint">(optional)</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-soft"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-soft">
                I am a…
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-white p-3 text-sm font-medium text-ink-soft hover:bg-paper-warm has-[:checked]:border-ilali-500 has-[:checked]:bg-ilali-50 has-[:checked]:text-ilali-700">
                  <input
                    type="radio"
                    name="accountType"
                    value="parent"
                    checked={accountType === "parent"}
                    onChange={() => setAccountType("parent")}
                    className="sr-only"
                  />
                  <span>Parent</span>
                </label>
                <label className="flex cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-white p-3 text-sm font-medium text-ink-soft hover:bg-paper-warm has-[:checked]:border-ilali-500 has-[:checked]:bg-ilali-50 has-[:checked]:text-ilali-700">
                  <input
                    type="radio"
                    name="accountType"
                    value="provider"
                    checked={accountType === "provider"}
                    onChange={() => setAccountType("provider")}
                    className="sr-only"
                  />
                  <span>Provider</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                "Send magic link"
              )}
            </button>

            <p className="text-xs text-ink-faint">
              By continuing you agree to the{" "}
              <a
                href="/terms"
                className="font-medium text-ilali-600 underline hover:text-ilali-700"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="font-medium text-ilali-600 underline hover:text-ilali-700"
              >
                Privacy Policy
              </a>
              .
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-faint">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-ilali-600 hover:text-ilali-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
