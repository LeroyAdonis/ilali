"use client";

import Link from "next/link";
import { Check, Clock, PartyPopper, X } from "lucide-react";
import { statusToStep, type StatusStep } from "@/lib/applications";

/**
 * Painless Journeys T028 — provider onboarding status tracker.
 *
 * Renders the four-step lifecycle (Draft → Submitted → Reviewing → Live) and
 * highlights where the provider's application currently sits. Draft/providers
 * can jump back into the wizard; rejected applications get a clear, hopeful
 * message plus a "Start over" path.
 *
 * Status source: providerApplications.status (draft | pending | contacted |
 * approved | rejected). `live` is true once a providers row exists.
 */
const STEPS = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "reviewing", label: "Reviewing" },
  { key: "live", label: "Live" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

function stepIndexFor(status: string): StepKey {
  // Shared vocabulary lives in src/lib/applications.ts (statusToStep).
  return statusToStep(status) as StepKey;
}

export default function StatusTracker({
  status,
  providerName,
}: {
  status: string | null;
  providerName?: string | null;
}) {
  const live = status === "approved";
  const rejected = status === "rejected";
  const current: StepKey = rejected ? "draft" : stepIndexFor(status || "draft");
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  if (rejected) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-red-50 p-3">
            <X className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-ink">
              Your listing wasn&apos;t accepted this time
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              No stress — this happens. Update your details and resubmit, or
              reach out to us at{" "}
              <a
                href="mailto:hello@ilali.co"
                className="font-medium text-ilali-600 hover:text-ilali-700"
              >
                hello@ilali.co
              </a>{" "}
              and we&apos;ll help you get listed.
            </p>
            <Link
              href="/providers/signup"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-ilali-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
            >
              Update and resubmit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-6">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold text-ink">
          Where your listing stands
        </h2>
        {live ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <PartyPopper className="h-3.5 w-3.5" />
            You&apos;re live on ILALI!
          </span>
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            {status === "contacted"
              ? "Being reviewed by our team"
              : "Awaiting review"}
          </span>
        )}
      </div>

      {/* Step rail */}
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < currentIdx || live;
          const active = !live && i === currentIdx;
          return (
            <li
              key={step.key}
              className={`flex items-center ${i > 0 ? "flex-1" : ""}`}
            >
              {i > 0 && (
                <div
                  aria-hidden
                  className={`mx-2 h-0.5 flex-1 rounded ${
                    done ? "bg-teal-500" : "bg-ink/10"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span
                  aria-current={active ? "step" : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? "bg-teal-500 text-white"
                      : active
                        ? "bg-ilali-600 text-white"
                        : "bg-ink/10 text-ink-faint"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`text-xs font-medium ${
                    active || done ? "text-ink" : "text-ink-faint"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Status body */}
      <div className="mt-6 rounded-lg bg-paper-warm p-4">
        {live ? (
          <>
            <p className="text-sm font-semibold text-ink">
              {providerName || "Your listing"} is live and searchable by parents.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Parents can now find you, read your profile and send inquiries.
              Keep your schedule and photos fresh to stay in the results.
            </p>
            <Link
              href="/provider/edit"
              className="mt-3 inline-flex items-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
            >
              Manage your listing
            </Link>
          </>
        ) : current === "draft" ? (
          <>
            <p className="text-sm font-semibold text-ink">
              You&apos;re partway through creating your listing.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Finish it whenever you&apos;re ready — it takes about 5 minutes.
            </p>
            <Link
              href="/providers/signup"
              className="mt-3 inline-flex items-center rounded-lg bg-ilali-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
            >
              Continue your listing
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">
              We&apos;ve got your application.
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Most listings are reviewed within 24–48 hours. We&apos;ll email
              you the moment your listing goes live — no need to keep checking.
            </p>
            {current === "submitted" && (
              <p className="mt-2 text-xs text-ink-faint">
                Submitted {""}
                <span className="font-medium">
                  {status === "pending" ? "and in the queue" : ""}
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
