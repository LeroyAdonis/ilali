"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ──

interface ProviderData {
  name: string;
  category: string;
  ageMin: number;
  ageMax: number;
  priceValue: number;
  imageUrl: string | null;
  description: string;
  tags: string[] | null;
  priceLabel?: string;
  isFree?: boolean;
}

interface ProfileWizardProps {
  provider: ProviderData;
  /** Count of club events (for schedule completion check) */
  clubEventCount: number;
  /** Called when a step's save is triggered with field updates */
  onSave: (fields: Record<string, unknown>) => Promise<void>;
  /** If true, all 8 steps are complete — wizard disappears */
  isComplete?: boolean;
}

// ── Step Definitions ──

interface StepDef {
  id: string;
  label: string;
  isComplete: (p: ProviderData, ctx: { clubEventCount: number }) => boolean;
}

const STEPS: StepDef[] = [
  {
    id: "name",
    label: "Activity name",
    isComplete: (p) => (p.name?.trim().length ?? 0) > 0,
  },
  {
    id: "category",
    label: "Category",
    isComplete: () => true, // always complete — set during application
  },
  {
    id: "age",
    label: "Age range",
    isComplete: (p) => p.ageMin != null && p.ageMax != null && p.ageMin > 0,
  },
  {
    id: "pricing",
    label: "Pricing",
    isComplete: (p) =>
      p.priceValue != null && p.priceValue > 0,
  },
  {
    id: "schedule",
    label: "Schedule",
    isComplete: (_p, ctx) => ctx.clubEventCount > 0,
  },
  {
    id: "photos",
    label: "Photos",
    isComplete: (p) => (p.imageUrl?.trim().length ?? 0) > 0,
  },
  {
    id: "description",
    label: "Description",
    isComplete: (p) => (p.description?.length ?? 0) > 50,
  },
  {
    id: "tags",
    label: "Tags",
    isComplete: (p) => (p.tags?.length ?? 0) > 0,
  },
];

const ACCENT_GRADIENTS = [
  "bg-teal",
  "bg-gold",
  "bg-purple",
  "bg-orange",
] as const;

// ── Inline Step Editors ──

function NameEditor({
  value,
  onSave,
  saving,
}: {
  value: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [name, setName] = useState(value);
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your activity name"
        className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ name: name.trim() })}
          disabled={saving || !name.trim()}
          className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function CategoryDisplay({ value }: { value: string }) {
  const catMap: Record<string, string> = {
    sports: "Sports",
    "arts-culture": "Arts & Culture",
    education: "Education",
    "music-lessons": "Music Lessons",
    "emotional-intelligence": "Emotional Intelligence",
    "holiday-programs": "Holiday Programs",
  };
  return (
    <p className="text-sm text-ink-soft">
      Category is set during application and cannot be changed here. Your
      activity is listed under{" "}
      <span className="font-semibold text-ink">
        {catMap[value] ?? value}
      </span>
      .
    </p>
  );
}

function AgeEditor({
  ageMin,
  ageMax,
  onSave,
  saving,
}: {
  ageMin: number;
  ageMax: number;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [min, setMin] = useState(String(ageMin));
  const [max, setMax] = useState(String(ageMax));
  const [error, setError] = useState("");

  const handleSave = () => {
    const minNum = Number(min);
    const maxNum = Number(max);
    if (isNaN(minNum) || isNaN(maxNum) || minNum < 0 || maxNum < 0) {
      setError("Please enter valid ages");
      return;
    }
    if (minNum > maxNum) {
      setError("Minimum age cannot exceed maximum age");
      return;
    }
    setError("");
    onSave({ ageMin: minNum, ageMax: maxNum });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-faint mb-1">
            Minimum age
          </label>
          <input
            type="number"
            min={0}
            max={18}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="w-20 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
          />
        </div>
        <span className="mt-5 text-ink-faint">to</span>
        <div>
          <label className="block text-xs font-medium text-ink-faint mb-1">
            Maximum age
          </label>
          <input
            type="number"
            min={0}
            max={18}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="w-20 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
          />
        </div>
        <span className="mt-5 text-xs text-ink-faint">years old</span>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function PricingEditor({
  priceValue,
  isFree,
  priceLabel,
  onSave,
  saving,
}: {
  priceValue: number;
  isFree?: boolean;
  priceLabel?: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [free, setFree] = useState(isFree ?? false);
  const [rands, setRands] = useState(
    free ? "" : String(Math.round(priceValue / 100))
  );
  const [label, setLabel] = useState(priceLabel ?? "per session");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!free) {
      const randsNum = Number(rands);
      if (isNaN(randsNum) || randsNum <= 0) {
        setError("Please enter a valid price in Rands");
        return;
      }
      const cents = Math.round(randsNum * 100);
      setError("");
      onSave({ priceValue: cents, isFree: false, priceLabel: label || "per session" });
      return;
    }
    setError("");
    onSave({ isFree: true, priceValue: 0, priceLabel: "Free" });
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={free}
          onChange={(e) => setFree(e.target.checked)}
          className="h-4 w-4 rounded border-ink/20 text-ilali-600 focus:ring-ilali-500"
        />
        <span className="text-sm text-ink-soft">This activity is free</span>
      </label>
      {!free && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-faint">R</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={rands}
              onChange={(e) => setRands(e.target.value)}
              placeholder="150"
              className="w-24 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-faint mb-1">
              Price label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="per session"
              className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
            />
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function DescriptionEditor({
  value,
  onSave,
  saving,
}: {
  value: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [text, setText] = useState(value);
  const chars = text.length;
  const isEnough = chars > 50;

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Describe your activity — what makes it special? What will children learn?"
        className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200 resize-y"
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${isEnough ? "text-teal-deep" : "text-ink-faint"}`}
        >
          {chars} characters {isEnough ? "✓" : `(at least ${50 - chars} more needed)`}
        </span>
        <button
          onClick={() => onSave({ description: text })}
          disabled={saving || !text.trim()}
          className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function PhotoEditor({
  imageUrl,
  onSave,
  saving,
}: {
  imageUrl: string | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [url, setUrl] = useState(imageUrl ?? "");

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-faint">
        Paste a URL to your activity photo. We recommend a bright, clear image
        showing children enjoying the activity.
      </p>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/photo.jpg"
        className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
      />
      {url && (
        <div className="h-32 w-full overflow-hidden rounded-lg bg-paper-warm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Preview"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <button
        onClick={() => onSave({ imageUrl: url.trim() || null })}
        disabled={saving}
        className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function TagsEditor({
  value,
  onSave,
  saving,
}: {
  value: string[] | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [tagsInput, setTagsInput] = useState((value ?? []).join(", "));

  const handleSave = () => {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    onSave({ tags });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-faint">
        Comma-separated tags help parents find your activity (e.g. outdoor,
        team-sport, creative, high-energy).
      </p>
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="outdoor, team-sport, high-energy"
        className="w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function ScheduleInfo({ clubEventCount }: { clubEventCount: number }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        {clubEventCount > 0
          ? `You have ${clubEventCount} club event${clubEventCount !== 1 ? "s" : ""} scheduled. Manage events from the Events page.`
          : "No events scheduled yet. Head to the Events page to create your first club event — practices, games, or open days."}
      </p>
      {clubEventCount === 0 && (
        <p className="text-xs text-ink-faint">
          Schedule is tracked via your club events. Create events from the
          Events tab in your dashboard.
        </p>
      )}
    </div>
  );
}

// ── Main Wizard Component ──

export default function ProfileWizard({
  provider,
  clubEventCount = 0,
  onSave,
  isComplete = false,
}: ProfileWizardProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const completeMap = STEPS.reduce(
    (acc, step) => {
      acc[step.id] = step.isComplete(provider, { clubEventCount });
      return acc;
    },
    {} as Record<string, boolean>
  );

  const completedCount = Object.values(completeMap).filter(Boolean).length;
  const totalSteps = STEPS.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  // Progress bar color
  let progressColor = "bg-teal";
  if (progressPercent >= 88) {
    progressColor = "bg-teal-deep";
  } else if (progressPercent >= 50) {
    progressColor = "bg-gold";
  }

  // If entirely complete
  if (isComplete || completedCount === totalSteps) {
    return (
      <div className="rounded-xl border border-teal/30 bg-teal/5 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-teal-deep" />
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              ✅ Listing complete
            </h3>
            <p className="text-sm text-ink-faint">
              Your listing is fully set up and visible to parents. Keep it fresh
              by updating events and responding to reviews.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const toggleStep = (stepId: string) => {
    setExpandedStep((prev) => (prev === stepId ? null : stepId));
  };

  const handleStepSave = useCallback(
    async (fields: Record<string, unknown>) => {
      setSaving(true);
      try {
        await onSave(fields);
        // Collapse the step after successful save
        setExpandedStep(null);
      } finally {
        setSaving(false);
      }
    },
    [onSave]
  );

  const renderEditor = (step: StepDef) => {
    switch (step.id) {
      case "name":
        return (
          <NameEditor
            value={provider.name}
            onSave={handleStepSave}
            saving={saving}
          />
        );
      case "category":
        return <CategoryDisplay value={provider.category} />;
      case "age":
        return (
          <AgeEditor
            ageMin={provider.ageMin}
            ageMax={provider.ageMax}
            onSave={handleStepSave}
            saving={saving}
          />
        );
      case "pricing":
        return (
          <PricingEditor
            priceValue={provider.priceValue}
            isFree={provider.isFree}
            priceLabel={provider.priceLabel}
            onSave={handleStepSave}
            saving={saving}
          />
        );
      case "schedule":
        return <ScheduleInfo clubEventCount={clubEventCount} />;
      case "photos":
        return (
          <PhotoEditor
            imageUrl={provider.imageUrl}
            onSave={handleStepSave}
            saving={saving}
          />
        );
      case "description":
        return (
          <DescriptionEditor
            value={provider.description}
            onSave={handleStepSave}
            saving={saving}
          />
        );
      case "tags":
        return (
          <TagsEditor
            value={provider.tags}
            onSave={handleStepSave}
            saving={saving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold text-ink">
          Complete your listing
        </h3>
        <p className="text-sm text-ink-faint">
          {completedCount} of {totalSteps} steps complete
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-paper-warm">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const complete = completeMap[step.id];
          const isExpanded = expandedStep === step.id;

          return (
            <div
              key={step.id}
              className="rounded-lg border border-ink/10 overflow-hidden"
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-paper-warm/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {complete ? (
                    <CheckCircle2 className="h-5 w-5 text-teal-deep shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-gold shrink-0" />
                  )}
                  <span className="text-sm font-medium text-ink">
                    {step.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {complete ? (
                    <span className="text-xs text-teal-deep font-medium">
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs text-ink-faint">Incomplete</span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-ink-faint" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-ink-faint" />
                  )}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-ink/10 px-4 py-4 bg-paper-warm/30">
                  {renderEditor(step)}
                  {step.id !== "category" && step.id !== "schedule" && (
                    <button
                      onClick={() => setExpandedStep(null)}
                      className="mt-3 text-xs text-ink-faint hover:text-ink transition-colors"
                    >
                      I&apos;ll do this later
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
