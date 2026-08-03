"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import ChildForm, {
  type ChildInput,
  emptyChild,
} from "@/components/parent/ChildForm";

// ── Types ──

interface NotificationPrefs {
  notifyNewProviders: boolean;
  notifyCommunity: boolean;
  notifyRewards: boolean;
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

  function updateChild(index: number, data: ChildInput) {
    setChildren((prev) =>
      prev.map((c, i) => (i === index ? data : c))
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
    <div className="flex min-h-screen items-center justify-center bg-paper-warm px-4 py-12 sm:px-6 lg:px-8">
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
                      : "border-2 border-ink/10 bg-white text-ink-faint"
                  }`}
                >
                  {step > s ? <Check className="h-4 w-4" /> : s}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium ${
                    step >= s ? "text-ilali-600" : "text-ink-faint"
                  }`}
                >
                  {s === 1 ? "Welcome" : s === 2 ? "Children" : "Preferences"}
                </span>
              </div>
            ))}
          </div>
          {/* Connector lines */}
          <div className="relative mt-[-1.75rem] px-10">
            <div className="h-0.5 bg-paper-warm">
              <div
                className="h-full bg-ilali-600 transition-all duration-300"
                style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
          {/* ── STEP 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ilali-50 text-4xl">
                👋
              </div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                Welcome to ILALI!
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Let&apos;s set up profiles for your children so we can find the
                perfect activities for them.
              </p>
              <div className="mt-6 space-y-3 text-left text-sm text-ink-faint">
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
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Step 2 of 3
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">
                  Tell us about your children
                </h2>
                <p className="mt-1 text-sm text-ink-faint">
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
                    className="rounded-xl border border-ink/10 bg-paper-warm/50 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold text-ink">
                        Child {index + 1}
                      </h3>
                      {children.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChild(index)}
                          className="rounded-lg p-1 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label="Remove child"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <ChildForm
                      initialData={child}
                      onChange={(data) => updateChild(index, data)}
                      onSave={async () => {}}
                      hideActions
                    />
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
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft"
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
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Step 3 of 3
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">
                  Almost done!
                </h2>
                <p className="mt-1 text-sm text-ink-faint">
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
                <label className="flex items-start gap-3 rounded-xl border border-ink/10 p-4 transition-colors hover:bg-paper-warm cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      Notify me when new activities match my children
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
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
                        : "bg-paper-warm"
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
                <label className="flex items-start gap-3 rounded-xl border border-ink/10 p-4 transition-colors hover:bg-paper-warm cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      Notify me about community events and chats
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
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
                        : "bg-paper-warm"
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
                <label className="flex items-start gap-3 rounded-xl border border-ink/10 p-4 transition-colors hover:bg-paper-warm cursor-pointer">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      Share my suburb for community features
                    </p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      Help us connect you with nearby families and local activities.
                      <span className="ml-1 text-ink-faint">— Only your suburb is shared, never your exact address</span>
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
                      preferences.notifyRewards ? "bg-ilali-600" : "bg-paper-warm"
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
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition-colors hover:text-ink-soft"
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
        <p className="mt-6 text-center text-xs text-ink-faint">
          You can update your children&apos;s profiles and notification preferences anytime from your account settings.
        </p>
      </div>
    </div>
  );
}
