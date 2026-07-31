"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";

// ── Types ──

interface ChildInput {
  name: string;
  age: string; // string for form input, validated as 1-18
  interests: string[];
  suburb: string;
  availability: {
    days: string[];
    timeSlots: string[];
  };
}

interface NotificationPrefs {
  notifyNewProviders: boolean;
  notifyCommunity: boolean;
  notifyRewards: boolean;
}

// ── Constants ──

const INTEREST_OPTIONS = [
  "Soccer",
  "Swimming",
  "Art",
  "Music",
  "Coding",
  "Dance",
  "Drama",
  "Science",
  "Horse Riding",
  "Gymnastics",
  "Cricket",
  "Piano",
  "Guitar",
  "Nature/Outdoors",
  "Maths",
] as const;

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const TIME_SLOTS = ["Morning", "Afternoon", "Evening"] as const;

function emptyChild(): ChildInput {
  return {
    name: "",
    age: "",
    interests: [],
    suburb: "",
    availability: { days: [], timeSlots: [] },
  };
}

// ── Page ──

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [children, setChildren] = useState<ChildInput[]>([emptyChild()]);
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    notifyNewProviders: true,
    notifyCommunity: true,
    notifyRewards: true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Child helpers ──

  function updateChild(index: number, field: keyof ChildInput, value: unknown) {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  function updateChildAvailability(
    index: number,
    field: "days" | "timeSlots",
    value: string
  ) {
    setChildren((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const current = c.availability[field];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return {
          ...c,
          availability: { ...c.availability, [field]: updated },
        };
      })
    );
  }

  function toggleInterest(index: number, interest: string) {
    setChildren((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const updated = c.interests.includes(interest)
          ? c.interests.filter((v) => v !== interest)
          : [...c.interests, interest];
        return { ...c, interests: updated };
      })
    );
  }

  function addChild() {
    setChildren((prev) => [...prev, emptyChild()]);
  }

  function removeChild(index: number) {
    if (children.length <= 1) return;
    setChildren((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Validation ──

  function validateStep2(): string | null {
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!c.name.trim()) return `Child ${i + 1}: Name is required`;
      const age = parseInt(c.age, 10);
      if (isNaN(age) || age < 1 || age > 18)
        return `Child ${i + 1}: Age must be between 1 and 18`;
    }
    return null;
  }

  // ── Submit ──

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      setStep(2);
      return;
    }

    try {
      const payload = {
        children: children.map((c) => ({
          name: c.name.trim(),
          age: parseInt(c.age, 10),
          interests: c.interests,
          suburb: c.suburb.trim() || null,
          availability: c.availability,
        })),
        preferences,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function canProceedFromStep2(): boolean {
    return children.every((c) => {
      const age = parseInt(c.age, 10);
      return c.name.trim() && !isNaN(age) && age >= 1 && age <= 18;
    });
  }

  // ── Render ──

  const TOTAL_STEPS = 3;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-ilali-600">ILALI</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    step >= s
                      ? "bg-ilali-600 text-white"
                      : "border-2 border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium ${
                    step >= s ? "text-ilali-600" : "text-slate-400"
                  }`}
                >
                  {s === 1 ? "Welcome" : s === 2 ? "Children" : "Preferences"}
                </span>
              </div>
            ))}
          </div>
          {/* Connector lines */}
          <div className="relative mt-[-1.75rem] px-10">
            <div className="h-0.5 bg-slate-200">
              <div
                className="h-full bg-ilali-600 transition-all duration-300"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ilali-50 text-4xl">
                👋
              </div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Welcome to ILALI!
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Let&apos;s set up profiles for your children so we can find the
                perfect activities for them.
              </p>
              <div className="mt-6 space-y-3 text-left text-sm text-slate-500">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-xs font-bold text-ilali-700">
                    1
                  </span>
                  <span>Tell us about each child — their age, interests, and when they&apos;re free</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-xs font-bold text-ilali-700">
                    2
                  </span>
                  <span>Set how you&apos;d like to hear from us</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-xs font-bold text-ilali-700">
                    3
                  </span>
                  <span>Start discovering activities matched to your children!</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-ilali-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Add Children ── */}
          {step === 2 && (
            <div>
              <div className="mb-6 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Step 2 of 3
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Tell us about your children
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add each child so we can match the right activities
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-8">
                {children.map((child, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Child {index + 1}
                      </h3>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove child"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Name
                        </label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => updateChild(index, "name", e.target.value)}
                          placeholder="Child's name"
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Age
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={18}
                          value={child.age}
                          onChange={(e) => updateChild(index, "age", e.target.value)}
                          placeholder="1–18"
                          className="mt-1 block w-24 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                        />
                      </div>

                      {/* Interests */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          Interests
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {INTEREST_OPTIONS.map((interest) => {
                            const selected = child.interests.includes(interest);
                            return (
                              <button
                                key={interest}
                                type="button"
                                onClick={() => toggleInterest(index, interest)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                  selected
                                    ? "bg-ilali-100 text-ilali-700 border border-ilali-300"
                                    : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                {interest}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Suburb */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          Suburb (optional)
                        </label>
                        <input
                          type="text"
                          value={child.suburb}
                          onChange={(e) => updateChild(index, "suburb", e.target.value)}
                          placeholder="e.g. Rondebosch"
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                        />
                      </div>

                      {/* Availability — Days */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Available days
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS.map((day) => {
                            const selected = child.availability.days.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => updateChildAvailability(index, "days", day)}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                                  selected
                                    ? "bg-ilali-600 text-white"
                                    : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Availability — Time preference */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Preferred time
                        </label>
                        <div className="flex gap-2">
                          {TIME_SLOTS.map((slot) => {
                            const selected = child.availability.timeSlots.includes(slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => updateChildAvailability(index, "timeSlots", slot)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                  selected
                                    ? "bg-sunset-100 text-sunset-700 border border-sunset-300"
                                    : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add another child */}
              <button
                type="button"
                onClick={addChild}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-sunset-300 bg-white px-4 py-2 text-xs font-medium text-sunset-600 transition-colors hover:bg-sunset-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another child
              </button>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedFromStep2()}
                  className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Notification Preferences ── */}
          {step === 3 && (
            <div>
              <div className="mb-8 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Step 3 of 3
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Almost done!
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell us how you&apos;d like to hear from us
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                {/* Toggle 1: New activities match */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Notify me when new activities match my children
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Get alerts when providers near you list activities your children would love
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.notifyNewProviders}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifyNewProviders: !prev.notifyNewProviders,
                      }))
                    }
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      preferences.notifyNewProviders
                        ? "bg-ilali-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        preferences.notifyNewProviders
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>

                {/* Toggle 2: Community events */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Notify me about community events and chats
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Stay in the loop with ILALI community happenings and parent discussions
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.notifyCommunity}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifyCommunity: !prev.notifyCommunity,
                      }))
                    }
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      preferences.notifyCommunity
                        ? "bg-ilali-600"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        preferences.notifyCommunity
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>

                {/* Toggle 3: Share suburb */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Share my suburb for community features
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Help us connect you with nearby families and local activities.
                      <span className="ml-1 text-slate-400">— Only your suburb is shared, never your exact address</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.notifyRewards}
                    onClick={() =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifyRewards: !prev.notifyRewards,
                      }))
                    }
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      preferences.notifyRewards ? "bg-ilali-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        preferences.notifyRewards ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          You can update your children&apos;s profiles and notification preferences anytime from your account settings.
        </p>
      </div>
    </div>
  );
}
