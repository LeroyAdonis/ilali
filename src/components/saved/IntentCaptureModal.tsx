"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MailCheck, X, Heart, MessageCircle, Bell } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { EMAIL_RE } from "@/lib/validations";
import type { IntentAction } from "@/lib/intent-cookie";

interface IntentCaptureModalProps {
  action: IntentAction;
  providerName: string;
  notifyWhenOpen?: boolean;
  onClose: () => void;
  /** Called after the magic link was actually sent — the provider writes the
   *  intent cookie then, so abandoned modals never leave orphaned intent. */
  onLinkSent: () => void;
}

const ACTION_META: Record<
  IntentAction,
  { icon: typeof Heart; title: string; benefit: string; cta: string }
> = {
  save: {
    icon: Heart,
    title: "Save it for later",
    benefit:
      "We'll keep you posted — saved activities, new spots, nothing spammy. Just confirm your email and we'll send a magic link.",
    cta: "Send magic link",
  },
  contact: {
    icon: MessageCircle,
    title: "Reach the provider",
    benefit:
      "Drop your email and we'll open the chat — the provider will know who's reaching out. No password needed.",
    cta: "Continue on WhatsApp",
  },
  notify: {
    icon: Bell,
    title: "Be first in the door",
    benefit:
      "We'll email you the moment booking opens. Confirm your email and we'll send a magic link.",
    cta: "Send magic link",
  },
};

export default function IntentCaptureModal({
  action,
  providerName,
  notifyWhenOpen,
  onClose,
  onLinkSent,
}: IntentCaptureModalProps) {
  const meta = ACTION_META[action];
  const Icon = meta.icon;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  async function sendLink() {
    setError("");
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signIn.magicLink({
        email: trimmed,
        name: name.trim() || undefined,
        callbackURL: "/home",
      });

      if (result.error) {
        setError(result.error.message ?? "Could not send the link. Please try again.");
      } else {
        onLinkSent();
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

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={meta.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ilali-50">
                <MailCheck className="h-7 w-7 text-ilali-600" aria-hidden="true" />
              </div>
              <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                Check your inbox
              </h2>
              <p className="mt-2 text-sm text-ink-faint">
                We&apos;ve sent a magic link to{" "}
                <span className="font-medium text-ink-soft">{email.trim()}</span>. Tap it to
                pick up where you left off — no password needed.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-warm"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ilali-50">
                  <Icon className="h-5 w-5 text-ilali-600" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                    {meta.title}
                  </h2>
                  <p className="text-xs text-ink-faint">{providerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-paper-warm hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-5 text-sm text-ink-soft">
              {meta.benefit}
              {notifyWhenOpen ? (
                <span className="mt-1 block text-xs font-medium text-ilali-600">
                  Notify me when booking opens for {providerName}
                </span>
              ) : null}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="intent-email" className="block text-sm font-medium text-ink-soft">
                  Email address
                </label>
                <input
                  id="intent-email"
                  ref={emailInputRef}
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
                <label htmlFor="intent-name" className="block text-sm font-medium text-ink-soft">
                  What should we call you?{" "}
                  <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <input
                  id="intent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  meta.cta
                )}
              </button>

              <p className="text-center text-xs text-ink-faint">
                No password needed — a one-tap magic link keeps you signed in.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
