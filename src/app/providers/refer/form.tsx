"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { referralSchema } from "@/lib/validations";
import { formatPhone } from "@/lib/utils";

type FormData = {
  referrer_name: string;
  referrer_email: string;
  provider_name: string;
  provider_email: string;
  provider_phone: string;
};

type FieldErrors = Partial<Record<keyof FormData, string[]>>;

const initialFormData: FormData = {
  referrer_name: "",
  referrer_email: "",
  provider_name: "",
  provider_email: "",
  provider_phone: "",
};

export default function ReferralForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedProviderName, setSubmittedProviderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>(initialFormData);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handlePhoneBlur() {
    if (formData.provider_phone.trim()) {
      const formatted = formatPhone(formData.provider_phone);
      setFormData((prev) => ({ ...prev, provider_phone: formatted }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // ── Client-side Zod validation ──
    const validated = referralSchema.safeParse({
      referrer_name: formData.referrer_name,
      referrer_email: formData.referrer_email,
      provider_name: formData.provider_name,
      provider_email: formData.provider_email,
      provider_phone: formData.provider_phone || undefined,
    });

    if (!validated.success) {
      const flat = validated.error.flatten().fieldErrors as FieldErrors;
      setFieldErrors(flat);
      setLoading(false);
      return;
    }

    // ── Submit to API ──
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated.data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError(json.error || "Too many attempts. Please wait before trying again.");
        } else if (json.errors) {
          setFieldErrors(json.errors as FieldErrors);
        } else {
          setError(json.error || "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      setSubmittedProviderName(formData.provider_name);
      setSubmitted(true);
    } catch {
      setError("Could not submit referral. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-12 w-12 text-ilali-500" />
        <h3 className="mt-4 font-display text-lg font-semibold text-ink">
          Referral submitted!
        </h3>
        <p className="mt-2 text-sm text-ink-faint">
          We&apos;ll reach out to{" "}
          <span className="font-medium text-ink-soft">{submittedProviderName}</span>{" "}
          and invite them to list on ILALI.
        </p>
        <p className="mt-2 text-sm text-ink-faint">
          Thanks for helping us build a safer community. You&apos;ll earn
          Ubuntu Rewards once the provider completes their first booking.
        </p>
      </div>
    );
  }

  const fieldError = (field: keyof FormData): string | null =>
    fieldErrors[field]?.[0] ?? null;

  const inputClass = (field: keyof FormData) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm text-ink-soft placeholder-ink-faint focus:outline-none focus:ring-2 transition-colors min-h-[44px] ${
      fieldError(field)
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-ink/10 focus:border-ilali-400 focus:ring-ilali-100"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* ── Your details ── */}
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-3">
          Your details
        </legend>
        <div className="space-y-3">
          <div>
            <input
              id="referrerName"
              name="referrerName"
              type="text"
              required
              placeholder="Your full name"
              className={inputClass("referrer_name")}
              value={formData.referrer_name}
              onChange={(e) => updateField("referrer_name", e.target.value)}
            />
            {fieldError("referrer_name") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("referrer_name")}</p>
            )}
          </div>
          <div>
            <input
              id="referrerEmail"
              name="referrerEmail"
              type="email"
              required
              placeholder="Your email address"
              className={inputClass("referrer_email")}
              value={formData.referrer_email}
              onChange={(e) => updateField("referrer_email", e.target.value)}
            />
            {fieldError("referrer_email") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("referrer_email")}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── Provider details ── */}
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-3">
          Provider details
        </legend>
        <div className="space-y-3">
          <div>
            <input
              id="providerName"
              name="providerName"
              type="text"
              required
              placeholder="Provider's name or business name"
              className={inputClass("provider_name")}
              value={formData.provider_name}
              onChange={(e) => updateField("provider_name", e.target.value)}
            />
            {fieldError("provider_name") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("provider_name")}</p>
            )}
          </div>
          <div>
            <input
              id="providerEmail"
              name="providerEmail"
              type="email"
              required
              placeholder="Provider's email address"
              className={inputClass("provider_email")}
              value={formData.provider_email}
              onChange={(e) => updateField("provider_email", e.target.value)}
            />
            {fieldError("provider_email") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("provider_email")}</p>
            )}
          </div>
          <div>
            <input
              id="providerPhone"
              name="providerPhone"
              type="tel"
              placeholder="Provider's phone number (optional)"
              className={inputClass("provider_phone")}
              value={formData.provider_phone}
              onChange={(e) => updateField("provider_phone", e.target.value)}
              onBlur={handlePhoneBlur}
            />
            {fieldError("provider_phone") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("provider_phone")}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ── Global error ── */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
      >
        {loading ? "Submitting…" : "Submit referral"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
