"use client";

import { useState, useEffect } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { createAuthClient } from "better-auth/client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

const authClient = createAuthClient();

export default function CreatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check session on mount — verify passwordResetRequired
  useEffect(() => {
    async function checkSession() {
      const { data: session } = await authClient.getSession();
      if (!session) {
        router.push("/auth/signin");
        return;
      }
      const user = session.user as { passwordResetRequired?: boolean; role?: string };
      if (!user.passwordResetRequired || user.role !== "provider") {
        // If no reset required, redirect to provider dashboard
        router.push("/provider");
        return;
      }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  function getPassphraseWords(): number {
    return passphrase.trim().split(/\s+/).filter(Boolean).length;
  }

  function getPassphraseStrength(): { label: string; color: string } {
    const words = getPassphraseWords();
    const length = passphrase.trim().length;
    if (words >= 5 && length >= 25) return { label: "Strong", color: "text-teal-deep" };
    if (words >= 4 && length >= 16) return { label: "Good", color: "text-teal" };
    if (words >= 3 && length >= 10) return { label: "Fair", color: "text-gold-deep" };
    return { label: "Weak", color: "text-orange" };
  }

  function validate(): string | null {
    if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    if (password !== confirmPassword) return "Passwords do not match";
    if (getPassphraseWords() < 3) return "Passphrase must contain at least 3 words";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/create-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, passphrase: passphrase.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Refresh session to clear passwordResetRequired, then redirect
      router.push("/provider");
      router.refresh();
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

  const strength = getPassphraseStrength();

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-warm px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img
            src="/images/brand/ilali-logo-76-t.png"
            alt="ILALI"
            className="mx-auto h-16 w-auto"
          />
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Set Your Password
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              Choose a password and recovery passphrase to access your provider dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
                New Password
              </label>
              <input
                id="password"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-soft">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
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

            {/* Passphrase */}
            <div>
              <label htmlFor="passphrase" className="block text-sm font-medium text-ink-soft">
                Recovery Passphrase
              </label>
              <input
                id="passphrase"
                type="text"
                autoComplete="off"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. green elephant dances quietly"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
              {passphrase && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-ink-faint">
                    {getPassphraseWords()} words · {passphrase.trim().length} characters
                  </span>
                  <span className={`text-xs font-medium ${strength.color}`}>
                    {strength.label}
                  </span>
                </div>
              )}
              <p className="mt-1 text-xs text-ink-faint">
                Choose 3 or more words you&apos;ll remember. Use this to recover your account if you forget your password.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <IlaliSpinner size="xs" variant="inverse" /> : "Set Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
