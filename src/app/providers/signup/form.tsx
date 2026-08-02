"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle } from "lucide-react";
import { providerApplicationSchema } from "@/lib/validations";
import { formatPhone } from "@/lib/utils";
import { CT_SUBURBS } from "@/lib/suburbs";

const activityTypes = [
  "Arts & Culture",
  "Sports",
  "Music Lessons",
  "Education & Tutoring",
  "Holiday Programs",
  "Dance & Movement",
  "Emotional Intelligence",
  "Other",
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  activity_type: string;
  description: string;
  location: string;
  age_min: string;
  age_max: string;
  price_value: string;
  image_url: string;
};

type FieldErrors = Partial<Record<keyof FormData, string[]>>;

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  activity_type: "",
  description: "",
  location: "",
  age_min: "",
  age_max: "",
  price_value: "",
  image_url: "",
};

export default function ProviderSignupForm() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Pre-fill from AI extraction URL params
  useEffect(() => {
    const updates: Partial<FormData> = {};
    const fields: Array<{ param: string; field: keyof FormData }> = [
      { param: "name", field: "name" },
      { param: "category", field: "activity_type" },
      { param: "description", field: "description" },
      { param: "location", field: "location" },
      { param: "ageMin", field: "age_min" },
      { param: "ageMax", field: "age_max" },
      { param: "price", field: "price_value" },
    ];
    for (const { param, field } of fields) {
      const val = searchParams.get(param);
      if (val) updates[field] = val;
    }
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  }, [searchParams]);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handlePhoneBlur() {
    if (formData.phone.trim()) {
      const formatted = formatPhone(formData.phone);
      setFormData((prev) => ({ ...prev, phone: formatted }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    // ── Prepare data for Zod ──
    const parsedPhone = formData.phone.trim() || undefined;

    const validated = providerApplicationSchema.safeParse({
      name: formData.name,
      email: formData.email,
      phone: parsedPhone,
      activity_type: formData.activity_type,
      description: formData.description || undefined,
      location: formData.location || undefined,
      age_min: formData.age_min ? Number(formData.age_min) : null,
      age_max: formData.age_max ? Number(formData.age_max) : null,
      price_value: formData.price_value ? Number(formData.price_value) : null,
      image_url: formData.image_url || undefined,
    });

    if (!validated.success) {
      const flat = validated.error.flatten().fieldErrors as FieldErrors;
      setFieldErrors(flat);
      setLoading(false);
      return;
    }

    // ── Submit to API ──
    try {
      const res = await fetch("/api/providers/apply", {
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

      setSubmittedEmail(formData.email);
      setSubmitted(true);
    } catch {
      setError("Could not submit. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-ilali-500" />
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            You&apos;re on the list!
          </h2>
          <p className="mt-2 text-sm text-ink-faint">
            We&apos;ll review your application within 48 hours.
            You&apos;ll hear from us at{" "}
            <span className="font-medium text-ink-soft">{submittedEmail}</span>.
          </p>
          <p className="mt-3 text-sm text-ink-faint">
            When approved, you&apos;ll get access to your own provider dashboard
            to manage listings, track enquiries, and update your profile.
          </p>
          <p className="mt-1 text-sm text-ink-faint">
            You&apos;ll receive email updates about your application status.
          </p>
        </div>
      </section>
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
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-bold text-ink sm:text-3xl">
          Get started today
        </h2>
        <p className="mt-2 text-center text-sm text-ink-faint">
          Fill in your details and we&apos;ll be in touch.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          {/* ── Name ── */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClass("name")}
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
            {fieldError("name") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("name")}</p>
            )}
          </div>

          {/* ── Email ── */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass("email")}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
            {fieldError("email") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("email")}</p>
            )}
          </div>

          {/* ── Phone ── */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className={inputClass("phone")}
              placeholder="+27 82 123 4567"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onBlur={handlePhoneBlur}
            />
            {fieldError("phone") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("phone")}</p>
            )}
          </div>

          {/* ── Activity Type ── */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1" htmlFor="activityType">
              Activity type
            </label>
            <select
              id="activityType"
              name="activityType"
              required
              className={inputClass("activity_type")}
              value={formData.activity_type}
              onChange={(e) => updateField("activity_type", e.target.value)}
            >
              <option value="">Select a category…</option>
              {activityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {fieldError("activity_type") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("activity_type")}</p>
            )}
          </div>

          {/* ── Description ── */}
          <div>
            <label
              className="block text-xs font-medium text-ink-soft mb-1"
              htmlFor="description"
            >
              Description{" "}
              <span className="text-ink-faint font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={inputClass("description")}
              placeholder="Tell us about your activity, classes, or program…"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          {/* ── Location ── */}
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1" htmlFor="location">
              Location{" "}
              <span className="text-ink-faint font-normal">(optional)</span>
            </label>
            <select
              id="location"
              name="location"
              className={inputClass("location")}
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
            >
              <option value="">Select a suburb…</option>
              {CT_SUBURBS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* ── Age range ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-medium text-ink-soft mb-1"
                htmlFor="age_min"
              >
                Min age{" "}
                <span className="text-ink-faint font-normal">(optional)</span>
              </label>
              <input
                id="age_min"
                name="age_min"
                type="number"
                min={0}
                max={18}
                className={inputClass("age_min")}
                placeholder="0"
                value={formData.age_min}
                onChange={(e) => updateField("age_min", e.target.value)}
              />
              {fieldError("age_min") && (
                <p className="mt-1 text-xs text-red-500">{fieldError("age_min")}</p>
              )}
            </div>
            <div>
              <label
                className="block text-xs font-medium text-ink-soft mb-1"
                htmlFor="age_max"
              >
                Max age{" "}
                <span className="text-ink-faint font-normal">(optional)</span>
              </label>
              <input
                id="age_max"
                name="age_max"
                type="number"
                min={0}
                max={18}
                className={inputClass("age_max")}
                placeholder="18"
                value={formData.age_max}
                onChange={(e) => updateField("age_max", e.target.value)}
              />
              {fieldError("age_max") && (
                <p className="mt-1 text-xs text-red-500">{fieldError("age_max")}</p>
              )}
            </div>
          </div>

          {/* ── Price ── */}
          <div>
            <label
              className="block text-xs font-medium text-ink-soft mb-1"
              htmlFor="price_value"
            >
              Price per session (R){" "}
              <span className="text-ink-faint font-normal">(optional)</span>
            </label>
            <input
              id="price_value"
              name="price_value"
              type="number"
              min={0}
              className={inputClass("price_value")}
              placeholder="e.g. 150"
              value={formData.price_value}
              onChange={(e) => updateField("price_value", e.target.value)}
            />
            {fieldError("price_value") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("price_value")}</p>
            )}
          </div>

          {/* ── Image URL ── */}
          <div>
            <label
              className="block text-xs font-medium text-ink-soft mb-1"
              htmlFor="image_url"
            >
              Image URL{" "}
              <span className="text-ink-faint font-normal">(optional)</span>
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              className={inputClass("image_url")}
              placeholder="https://example.com/photo.jpg"
              value={formData.image_url}
              onChange={(e) => updateField("image_url", e.target.value)}
            />
            {fieldError("image_url") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("image_url")}</p>
            )}
          </div>

          {/* ── Global error ── */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? "Submitting…" : "Submit interest"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-xs text-center text-ink-faint">
            By submitting, you agree to our{" "}
            <Link href="/terms" className="text-ilali-500 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-ilali-500 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      </div>
    </section>
  );
}
