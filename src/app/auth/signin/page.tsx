"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MailCheck, KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

function getValidatedCallbackUrl(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.slice(1).split(/[/?#]/)[0].includes(":")) return null;
  return value;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const callbackUrl = getValidatedCallbackUrl(searchParams.get("callbackUrl"));
  const [mode, setMode] = useState<"magic" | "password">(
    resetSuccess ? "password" : callbackUrl?.startsWith("/admin") ? "password" : "magic"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success] = useState(
    resetSuccess
      ? "Password reset successfully. Please sign in with your new password."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendMagicLink() {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: callbackUrl ?? "/home",
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

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    void sendMagicLink();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError("Invalid email or password");
      } else {
        // Redirect based on role: providers → /provider, admins → /admin, parents → /home
        const session = await authClient.getSession();
        const user = session?.data?.user as { role?: string; passwordResetRequired?: boolean };
        const role = user?.role;

        if (role === "provider") {
          // Check if password reset is required — ALWAYS route to set-password
          // first, regardless of callbackUrl (they can't do anything until
          // they've chosen a password).
          if (user?.passwordResetRequired) {
            router.push("/auth/create-password");
          } else {
            router.push(callbackUrl ?? "/provider");
          }
        } else if (role === "admin") {
          router.push(callbackUrl ?? "/admin");
        } else {
          router.push(callbackUrl ?? "/home");
        }
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
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
                sign in — it works once and expires in 5 minutes.
              </p>
            </div>

            <p className="mb-6 text-center text-xs text-ink-faint">
              Didn&apos;t get it? Check spam, or{" "}
              <button
                type="button"
                onClick={() => void sendMagicLink()}
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
              Sign in
            </h1>
            <p className="mt-2 text-sm text-ink-faint">
              {mode === "magic"
                ? "No password needed — we&apos;ll email you a magic link"
                : "Sign in with your password"}
            </p>
          </div>

          {success && (
            <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {mode === "magic" ? (
            <>
              <form onSubmit={handleMagicLink} className="space-y-5">
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
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <IlaliSpinner size="xs" />
                      Sending link…
                    </>
                  ) : (
                    "Email me a magic link"
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-ink-faint">or</span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError("");
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink-soft shadow-sm transition-colors hover:bg-paper-warm"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Use password instead
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <IlaliSpinner size="xs" />
                      Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-ink-faint hover:text-ilali-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-xs text-ink-faint">or</span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode("magic");
                  setError("");
                }}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink-soft shadow-sm transition-colors hover:bg-paper-warm"
              >
                <MailCheck className="h-4 w-4" aria-hidden="true" />
                Email me a magic link instead
              </button>
            </>
          )}

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-ink-faint">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-ilali-600 hover:text-ilali-700"
              >
                Create one
              </Link>
            </p>
            <p className="text-sm text-ink-faint">
              Already have a listing?{" "}
              <Link
                href="/providers/claim"
                className="font-medium text-ilali-600 hover:text-ilali-700"
              >
                Claim your account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper-warm">
          <IlaliSpinner size="md" label="Loading" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
