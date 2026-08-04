"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClaimPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "credentials">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function getPassphraseWords(): number {
    return passphrase.trim().split(/\s+/).filter(Boolean).length;
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Check if there's a matching provider by attempting a claim lookup
    // We'll just proceed to credentials form — the API will validate on submit
    setStep("credentials");
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (getPassphraseWords() < 3) {
      setError("Passphrase must contain at least 3 words");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/providers/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          passphrase: passphrase.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No matching provider found. Please contact us if you think this is an error.");
        return;
      }

      // Success — the claim set the password and passphrase
      // Now sign the user in
      const authClient = (await import("better-auth/client")).createAuthClient();
      const signInResult = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (signInResult.error) {
        setError("Account claimed but sign-in failed. Please go to the sign-in page.");
        return;
      }

      router.push("/provider");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
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
                Claim Your Listing
              </h1>
              <p className="mt-2 text-sm text-ink-faint">
                Already have an activity listed on ILALI? Enter your email to claim your provider account.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                  placeholder="The email associated with your listing"
                  className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
              >
                Continue
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

  // Step 2: Set password + passphrase
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
              Set Up Your Account
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              Create a password to manage your listing at <span className="font-medium text-ink-soft">{email}</span>
            </p>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
                Password
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
                <p className="mt-1 text-xs text-ink-faint">
                  {getPassphraseWords()} words · {passphrase.trim().length} characters
                </p>
              )}
              <p className="mt-1 text-xs text-ink-faint">
                Choose 3+ words you&apos;ll remember to recover your account.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Claim My Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setStep("email"); setError(""); }}
              className="inline-flex items-center gap-1 text-sm font-medium text-ilali-600 hover:text-ilali-700"
            >
              <ArrowLeft className="h-3 w-3" />
              Use a different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
