"use client";

import { Heart } from "lucide-react";
import { useSaved } from "./SavedProvider";

interface SaveButtonProps {
  providerId: string;
  providerName: string;
  className?: string;
}

/**
 * Save / Saved toggle. Signed-in parents get an instant heart; guests are
 * routed through email capture at the moment of intent (Painless Journeys
 * Phase 2) and the save completes via magic link.
 */
export default function SaveButton({ providerId, providerName, className = "" }: SaveButtonProps) {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(providerId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${providerName} from saved` : `Save ${providerName}`}
      title={saved ? "Saved" : "Save for later"}
      onClick={() => void toggleSave(providerId, providerName)}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-300 focus:ring-offset-2 ${
        saved
          ? "border-ilali-500 bg-ilali-50 text-ilali-700 hover:bg-ilali-100"
          : "border-ink/10 bg-white text-ink-soft hover:border-ilali-300 hover:text-ilali-600"
      } ${className}`}
    >
      <Heart
        className="h-4 w-4"
        aria-hidden="true"
        fill={saved ? "currentColor" : "none"}
      />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
