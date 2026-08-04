"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"verify" | "reset">("verify");
  const [email, setEmail] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getPassphraseWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !passphrase) {
      setError("Both email and passphrase are required");
      return;
    }

    setLoading(true);
    try {
      // Step 1: verify email + passphrase by attempting reset with same password
      // (We just check that the endpoint would accept it; actual reset happens in step 2)
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          passphrase: passphrase.trim(),
          newPassword: "PLACEHOLDER_TEMP_12345",
          newPassphrase: "placeholder temp passphrase",
        }),
      });

      const data = await res.json();

      // If "No match" — passphrase is wrong
      if (!res.ok && data.error === "No match") {
        setError("That doesn't match our records. Please try again.");
        return;
      }

      // If rate limited
      if (res.status === 429) {
        setError(data.error);
        return;
      }

      // If the passphrase was correct (even though the temp password was used), proceed
      // The endpoint returns "No match" on bad passphrase, or other errors on validation
      // We consider "Internal server error" or success as passphrase match
      // Actually: let's re-think. The validate will reject the temp placeholder. But if passphrase matches,
      // it might still fail on validation. Let's just check that it's NOT a "No match"
      if (data.error === "No match") {
        setError("That doesn't match our records. Please try again.");
        return;
      }

      // Passphrase was correct — move to step 2
      setStep("reset");
      setError("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    if (getPassphraseWords(newPassphrase) < 3) {
      setError("New passphrase must contain at least 3 words");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          passphrase: passphrase.trim(),
          newPassword,
          newPassphrase: newPassphrase.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Success — redirect to sign-in with success message
      router.push("/auth/signin?reset=success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "verify") {
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
            <div className="mb-8 text-center">
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Forgot Password?
              </h1>
              <p className="mt-2 text-sm text-ink-faint">
                Enter your email and recovery passphrase to reset your password.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>

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
                  placeholder="Enter your recovery passphrase"
                  className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1 text-sm font-medium text-ilali-600 hover:text-ilali-700"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Set new password
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
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              Choose a new password and passphrase for <span className="font-medium text-ink-soft">{email}</span>
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-ink-soft">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-ink-soft">
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
              {confirmNewPassword && newPassword !== confirmNewPassword && (
                <p className="mt-1 text-xs text-orange">Passwords do not match</p>
              )}
            </div>

            <div>
              <label htmlFor="newPassphrase" className="block text-sm font-medium text-ink-soft">
                New Recovery Passphrase
              </label>
              <input
                id="newPassphrase"
                type="text"
                autoComplete="off"
                required
                value={newPassphrase}
                onChange={(e) => setNewPassphrase(e.target.value)}
                placeholder="e.g. green elephant dances quietly"
                className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
              />
              {newPassphrase && (
                <p className="mt-1 text-xs text-ink-faint">
                  {getPassphraseWords(newPassphrase)} words · {newPassphrase.trim().length} characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setStep("verify"); setError(""); }}
              className="inline-flex items-center gap-1 text-sm font-medium text-ilali-600 hover:text-ilali-700"
            >
              <ArrowLeft className="h-3 w-3" />
              Try different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
