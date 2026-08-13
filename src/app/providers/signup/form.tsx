"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Eye,
  Loader2,
  MailCheck,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { useSession, authClient } from "@/lib/auth-client";
import {
  wizardOfferStepSchema,
  wizardDetailsStepSchema,
  wizardPhotosStepSchema,
  wizardSubmitSchema,
} from "@/lib/validations";
import { formatPhone } from "@/lib/utils";
import { CT_SUBURBS } from "@/lib/suburbs";
import { categories } from "@/lib/constants";
import ListingCardPreview from "@/components/provider/ListingCardPreview";
import type { Provider } from "@/lib/types";
import { EMAIL_RE } from "@/lib/validations";

/**
 * Painless Journeys Phase 4 (T026/T027) — provider self-onboarding wizard.
 *
 * Guest-first: a sign-in-with-magic-link panel precedes the form (no password
 * ever). Signed-in users get a 4-step wizard (Offer → Details → Photos →
 * Review & Submit) that autosaves each step to /api/providers/applications
 * and resumes a saved draft on return. Submitting turns the draft into a
 * pending application, flips the role to provider, and points the provider at
 * their dashboard status tracker.
 */

const STEP_LABELS = ["The offer", "Practical details", "Photos & story", "Review"] as const;

type WizardFields = {
  name: string;
  category: string;
  ageMin: string;
  ageMax: string;
  priceValue: string;
  priceLabel: string;
  location: string;
  schedule: string;
  phone: string;
  description: string;
  imageUrl: string;
};

const EMPTY_FIELDS: WizardFields = {
  name: "",
  category: "",
  ageMin: "",
  ageMax: "",
  priceValue: "",
  priceLabel: "per session",
  location: "",
  schedule: "",
  phone: "",
  description: "",
  imageUrl: "",
};

const PRICE_LABELS = ["per session", "per week", "per month", "per term"];

function toNumber(value: string): number | null {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? null : n;
}

function previewProvider(fields: WizardFields): Provider {
  const category = categories.find((c) => c.name === fields.category);
  const priceValue = toNumber(fields.priceValue);
  const ageMin = toNumber(fields.ageMin) ?? 0;
  const ageMax = toNumber(fields.ageMax) ?? 18;
  return {
    id: "preview",
    name: fields.name.trim() || "Your activity name",
    slug: "preview",
    category: fields.category || "Category",
    categorySlug: category?.slug ?? "arts-culture",
    description:
      fields.description.trim() ||
      "Your description will appear here once you finish setting up.",
    providerName: fields.name.trim() || "Your activity name",
    location: fields.location.trim() || "Cape Town",
    distance: "—",
    ageRange: `${ageMin}–${ageMax} years`,
    ageMin,
    ageMax,
    rating: 0,
    reviewCount: 0,
    price:
      priceValue != null && priceValue > 0
        ? `R${priceValue.toLocaleString()}`
        : "Free",
    priceValue: (priceValue ?? 0) * 100,
    priceLabel: fields.priceLabel || "per session",
    image:
      fields.imageUrl.trim() ||
      `/images/providers/${category?.slug ?? "arts-culture"}.jpg`,
    isFree: priceValue == null || priceValue === 0,
    verified: false,
    tags: [],
    phone: fields.phone.trim() || undefined,
  };
}

function stepPayload(step: number, fields: WizardFields): Record<string, unknown> {
  switch (step) {
    case 1:
      return {
        name: fields.name,
        category: fields.category,
        ageMin: toNumber(fields.ageMin),
        ageMax: toNumber(fields.ageMax),
      };
    case 2:
      return {
        priceValue: toNumber(fields.priceValue),
        priceLabel: fields.priceLabel,
        location: fields.location,
        schedule: fields.schedule,
        phone: fields.phone,
      };
    case 3:
      return {
        description: fields.description,
        imageUrl: fields.imageUrl,
      };
    default:
      return {
        name: fields.name,
        category: fields.category,
        ageMin: toNumber(fields.ageMin),
        ageMax: toNumber(fields.ageMax),
        priceValue: toNumber(fields.priceValue),
        priceLabel: fields.priceLabel,
        location: fields.location,
        schedule: fields.schedule,
        phone: fields.phone,
        description: fields.description,
        imageUrl: fields.imageUrl,
      };
  }
}

const STEP_SCHEMAS = [
  wizardOfferStepSchema,
  wizardDetailsStepSchema,
  wizardPhotosStepSchema,
  wizardSubmitSchema,
];

export default function ProviderSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();

  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<WizardFields>(EMPTY_FIELDS);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [finalState, setFinalState] = useState<
    null | "inbox" | "submitted" | "already" | "approved"
  >(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Prefill from AI-extraction URL params on a fresh (no-draft) start.
  const urlPrefill = useMemo(() => {
    const updates: Partial<WizardFields> = {};
    const ageMin = searchParams.get("ageMin");
    const ageMax = searchParams.get("ageMax");
    const price = searchParams.get("price");
    const name = searchParams.get("name");
    const category = searchParams.get("category");
    const description = searchParams.get("description");
    const location = searchParams.get("location");
    if (name) updates.name = name;
    if (category) updates.category = category;
    if (description) updates.description = description;
    if (location) updates.location = location;
    if (ageMin) updates.ageMin = ageMin;
    if (ageMax) updates.ageMax = ageMax;
    if (price) updates.priceValue = price;
    return updates;
  }, [searchParams]);

  // Resume the saved draft once signed in.
  useEffect(() => {
    if (sessionLoading || !session) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/providers/applications");
        if (!res.ok) return;
        const body = (await res.json()) as {
          application?: (Record<string, unknown> & { status?: string }) | null;
        };
        if (cancelled) return;
        const app = body.application;
        if (!app) {
          if (Object.keys(urlPrefill).length > 0) {
            setFields((prev) => ({ ...prev, ...urlPrefill }));
          }
          setDraftLoaded(true);
          return;
        }
        if (app.status === "approved") {
          setFinalState("approved");
          return;
        }
        if (app.status === "pending" || app.status === "contacted") {
          setFinalState("already");
          return;
        }
        // Draft (or any resume-able status) → restore into the form.
        setFields((prev) => ({
          ...prev,
          name: typeof app.name === "string" ? app.name : "",
          category:
            typeof app.activityType === "string" ? app.activityType : "",
          ageMin: typeof app.ageMin === "number" ? String(app.ageMin) : "",
          ageMax: typeof app.ageMax === "number" ? String(app.ageMax) : "",
          priceValue:
            typeof app.priceValue === "number" ? String(app.priceValue) : "",
          priceLabel:
            typeof app.priceLabel === "string" && app.priceLabel
              ? app.priceLabel
              : "per session",
          location: typeof app.location === "string" ? app.location : "",
          schedule: typeof app.schedule === "string" ? app.schedule : "",
          phone: typeof app.phone === "string" ? app.phone : "",
          description:
            typeof app.description === "string" ? app.description : "",
          imageUrl: typeof app.imageUrl === "string" ? app.imageUrl : "",
        }));
        setDraftLoaded(true);
      } catch {
        setDraftLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session]);

  function updateField(key: keyof WizardFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handlePhoneBlur() {
    if (fields.phone.trim()) {
      setFields((prev) => ({ ...prev, phone: formatPhone(prev.phone) }));
    }
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = guestEmail.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setGuestError("Please enter a valid email address");
      return;
    }
    setGuestLoading(true);
    setGuestError("");
    try {
      const result = await authClient.signIn.magicLink({
        email: trimmed,
        name: guestName.trim() || undefined,
        callbackURL: "/providers/signup",
      });
      if (result.error) {
        setGuestError(result.error.message ?? "Could not send the link. Please try again.");
      } else {
        setFinalState("inbox");
      }
    } catch {
      setGuestError("Something went wrong. Please try again.");
    } finally {
      setGuestLoading(false);
    }
  }

  async function saveStep(nextStep: number, submit = false) {
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const payload = stepPayload(step + 1, fields);
      const schema = submit ? wizardSubmitSchema : STEP_SCHEMAS[step];
      const parsed = submit
        ? schema.safeParse({ ...payload, email: session?.user?.email ?? "" })
        : schema.safeParse(payload);
      if (!parsed.success) {
        const issues = Object.fromEntries(
          parsed.error.issues.map((i) => [i.path[0], i.message])
        ) as Record<string, string>;
        setFieldErrors(issues);
        return;
      }

      const res = await fetch("/api/providers/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          submit
            ? { fields: payload, step: 4, submitted: true }
            : { fields: payload, step: step + 1 }
        ),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        application?: { status?: string };
      };
      if (!res.ok) {
        setError(body.error || "Could not save your draft. Please try again.");
        return;
      }
      setSavedAt(new Date());
      if (submit) {
        setFinalState("submitted");
        return;
      }
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not save your draft. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Auth loading ──
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ilali-600" />
      </div>
    );
  }

  // ── Guest gate: magic-link sign-in ──
  if (!session) {
    if (finalState === "inbox") {
      return (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-lg px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ilali-50">
              <MailCheck className="h-7 w-7 text-ilali-600" aria-hidden="true" />
            </div>
            <h2 className="font-display text-2xl font-bold text-ink">Check your inbox</h2>
            <p className="mt-2 text-sm text-ink-faint">
              We&apos;ve sent a magic link to{" "}
              <span className="font-medium text-ink-soft">{guestEmail.trim()}</span>.
              Tap it to start your listing — no password needed.
            </p>
            <p className="mt-4 text-sm text-ink-faint">
              Your listing will autosave, so you can come back any time.
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
            Get started — it&apos;s free
          </h2>
          <p className="mt-2 text-center text-sm text-ink-faint">
            Drop your email and we&apos;ll send a magic link to start your
            listing. No password, no waiting.
          </p>
          <form onSubmit={sendMagicLink} className="mt-8 space-y-4" noValidate>
            {guestError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {guestError}
              </p>
            )}
            <div>
              <label htmlFor="wizard-guest-name" className="block text-xs font-medium text-ink-soft mb-1">
                Your name{" "}
                <span className="text-ink-faint font-normal">(optional)</span>
              </label>
              <input
                id="wizard-guest-name"
                type="text"
                autoComplete="name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="wizard-guest-email" className="block text-xs font-medium text-ink-soft mb-1">
                Email address
              </label>
              <input
                id="wizard-guest-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-ink/10 px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200 min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              disabled={guestLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 disabled:opacity-50 min-h-[44px]"
            >
              {guestLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Send magic link <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="text-center text-xs text-ink-faint">
              Your draft autosaves as you go — close the tab any time and
              resume here later.
            </p>
          </form>
        </div>
      </section>
    );
  }

  // ── Post-submit states ──
  if (finalState === "submitted") {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-ilali-500" />
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            You&apos;re on your way!
          </h2>
          <p className="mt-2 text-sm text-ink-faint">
            Your listing is in review. Most are approved within 24–48 hours —
            we&apos;ll email you the moment it&apos;s live.
          </p>
          <Link
            href="/provider"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
          >
            Track your status
          </Link>
        </div>
      </section>
    );
  }

  if (finalState === "already") {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-teal-500" />
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            Your listing is already in review
          </h2>
          <p className="mt-2 text-sm text-ink-faint">
            We&apos;re on it. Check your dashboard to see where things stand.
          </p>
          <Link
            href="/provider"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (finalState === "approved") {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 text-center">
          <PartyPopper className="mx-auto h-12 w-12 text-teal-500" />
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            You&apos;re already live!
          </h2>
          <p className="mt-2 text-sm text-ink-faint">
            Your listing is on ILALI. Head to your dashboard to manage it.
          </p>
          <Link
            href="/provider"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
          >
            Open dashboard
          </Link>
        </div>
      </section>
    );
  }

  // ── Wizard body ──
  const inputClass = (key: keyof WizardFields) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 transition-colors min-h-[44px] ${
      fieldErrors[key]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-ink/10 focus:border-ilali-400 focus:ring-ilali-100"
    }`;

  const labelClass = "block text-xs font-medium text-ink-soft mb-1";

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ilali-50 px-3 py-1 text-xs font-semibold text-ilali-700">
            <Sparkles className="h-3.5 w-3.5" />
            {draftLoaded ? "Resumed your draft" : "New listing"}
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
            {STEP_LABELS[step]}
          </h2>
          <p className="mt-2 text-sm text-ink-faint">
            Step {step + 1} of 4
          </p>
        </div>

        {/* Progress rail */}
        <ol className="mt-8 flex items-center" aria-label="Progress">
          {STEP_LABELS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
                {i > 0 && (
                  <div
                    aria-hidden
                    className={`mx-2 h-0.5 flex-1 rounded ${done ? "bg-ilali-500" : "bg-ink/10"}`}
                  />
                )}
                <div className="flex flex-col items-center gap-1">
                  <span
                    aria-current={active ? "step" : undefined}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      done
                        ? "bg-ilali-500 text-white"
                        : active
                          ? "bg-ilali-600 text-white"
                          : "bg-ink/10 text-ink-faint"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-xl border border-ink/10 bg-white p-6 sm:p-8">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Activity name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="off"
                  className={inputClass("name")}
                  placeholder="e.g. Little Picassos Art Club"
                  value={fields.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className={labelClass}>
                  Category
                </label>
                <select
                  id="category"
                  className={inputClass("category")}
                  value={fields.category}
                  onChange={(e) => updateField("category", e.target.value)}
                >
                  <option value="">Pick a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.category}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ageMin" className={labelClass}>
                    Minimum age
                  </label>
                  <input
                    id="ageMin"
                    type="number"
                    min={0}
                    max={18}
                    className={inputClass("ageMin")}
                    placeholder="e.g. 4"
                    value={fields.ageMin}
                    onChange={(e) => updateField("ageMin", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="ageMax" className={labelClass}>
                    Maximum age
                  </label>
                  <input
                    id="ageMax"
                    type="number"
                    min={0}
                    max={18}
                    className={inputClass("ageMax")}
                    placeholder="e.g. 12"
                    value={fields.ageMax}
                    onChange={(e) => updateField("ageMax", e.target.value)}
                  />
                </div>
              </div>
              {fieldErrors.ageMax && (
                <p className="text-xs text-red-500">{fieldErrors.ageMax}</p>
              )}
              {fieldErrors.ageMin && (
                <p className="text-xs text-red-500">{fieldErrors.ageMin}</p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="location" className={labelClass}>
                  Suburb where you run your activity
                </label>
                <select
                  id="location"
                  className={inputClass("location")}
                  value={fields.location}
                  onChange={(e) => updateField("location", e.target.value)}
                >
                  <option value="">Select a suburb…</option>
                  {CT_SUBURBS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.location && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.location}</p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="priceValue" className={labelClass}>
                    Price (R)
                  </label>
                  <input
                    id="priceValue"
                    type="number"
                    min={0}
                    className={inputClass("priceValue")}
                    placeholder="e.g. 150"
                    value={fields.priceValue}
                    onChange={(e) => updateField("priceValue", e.target.value)}
                  />
                  {fieldErrors.priceValue && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.priceValue}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="priceLabel" className={labelClass}>
                    Charged
                  </label>
                  <select
                    id="priceLabel"
                    className={inputClass("priceLabel")}
                    value={fields.priceLabel}
                    onChange={(e) => updateField("priceLabel", e.target.value)}
                  >
                    {PRICE_LABELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClass("phone")}
                  placeholder="+27 82 123 4567"
                  value={fields.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  onBlur={handlePhoneBlur}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="schedule" className={labelClass}>
                  When does it run?{" "}
                  <span className="text-ink-faint font-normal">(optional)</span>
                </label>
                <input
                  id="schedule"
                  type="text"
                  className={inputClass("schedule")}
                  placeholder="e.g. Saturdays 09:00–11:00"
                  value={fields.schedule}
                  onChange={(e) => updateField("schedule", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="description" className={labelClass}>
                  Tell parents about it
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className={inputClass("description")}
                  placeholder="What makes your activity special? Who is it for? What should parents expect?"
                  value={fields.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.description}</p>
                )}
              </div>
              <div>
                <label htmlFor="imageUrl" className={labelClass}>
                  Photo URL{" "}
                  <span className="text-ink-faint font-normal">(optional)</span>
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  className={inputClass("imageUrl")}
                  placeholder="https://example.com/photo.jpg"
                  value={fields.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                />
                {fieldErrors.imageUrl && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.imageUrl}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Does this look right?
                </h3>
                <p className="mt-1 text-sm text-ink-faint">
                  You can edit anything after publishing. Submit when you&apos;re
                  happy — we&apos;ll review it within 24–48 hours.
                </p>
              </div>

              <ListingCardPreview provider={previewProvider(fields)} />

              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Activity", fields.name || "—"],
                  ["Category", fields.category || "—"],
                  ["Location", fields.location || "—"],
                  ["Phone", fields.phone || "—"],
                  [
                    "Price",
                    toNumber(fields.priceValue) != null
                      ? `R${toNumber(fields.priceValue)!.toLocaleString()} ${fields.priceLabel}`
                      : "Free",
                  ],
                  ["Schedule", fields.schedule || "—"],
                  ["Ages", `${toNumber(fields.ageMin) ?? 0}–${toNumber(fields.ageMax) ?? 18}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-paper-warm px-4 py-3">
                    <dt className="text-xs font-medium text-ink-faint">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => s - 1);
                  setFieldErrors({});
                  setError("");
                }}
                disabled={saving}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span className="text-xs text-ink-faint">
                {savedAt ? (
                  <>
                    <Check className="mr-1 inline h-3.5 w-3.5 text-teal-600" />
                    Draft saved{" "}
                    {savedAt.toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </>
                ) : (
                  "Your draft autosaves as you go"
                )}
              </span>
            )}

            <button
              type="button"
              onClick={() => saveStep(step === 3 ? 3 : step + 1, step === 3)}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {step === 3 ? "Submitting…" : "Saving…"}
                </>
              ) : step === 3 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Submit listing
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink-faint">
          <Eye className="mr-1 inline h-3.5 w-3.5" />
          Parents only see your listing after it&apos;s approved.
        </p>
      </div>
    </section>
  );
}
