"use client";

import { useState, useEffect } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Require a signed-in session — magic-link users can add a password anytime.
  useEffect(() => {
    async function checkSession() {
      const { data: session } = await authClient.getSession();
      if (!session) {
        router.push("/auth/signin");
        return;
      }
      setChecking(false);
    }
    void checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-warm">
        <IlaliSpinner size="md" />
      </div>
    );
  }

  if (success) {
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
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />
              </div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Password set
              </h1>
              <p className="mt-2 text-sm text-ink-faint">
                You can now sign in with your password or a magic link — whichever
                you prefer.
              </p>
            </div>

            <Link
              href="/home"
              className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
            >
              Back to ILALI
            </Link>
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
              Set a password
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              Optional — add a password so you can sign in without waiting for a
              magic link.
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
                htmlFor="password"
                className="block text-sm font-medium text-ink-soft"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-ink-soft"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-orange">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <IlaliSpinner size="xs" variant="inverse" />
              ) : (
                "Set password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
