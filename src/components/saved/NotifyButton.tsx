"use client";

import { Bell } from "lucide-react";
import { useSaved } from "./SavedProvider";

interface NotifyButtonProps {
  providerId: string;
  providerName: string;
  className?: string;
}

/**
 * "Notify me when booking opens" — saves the provider with notifyWhenOpen so
 * Phase 3 can send the opening ping. Guests capture email at the moment of
 * intent; the save completes after the magic link.
 */
export default function NotifyButton({
  providerId,
  providerName,
  className = "",
}: NotifyButtonProps) {
  const { requestNotify } = useSaved();

  return (
    <button
      type="button"
      onClick={() => requestNotify(providerId, providerName)}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-ilali-300 bg-white px-6 py-3 text-sm font-semibold text-ilali-700 transition-colors hover:bg-ilali-50 focus:outline-none focus:ring-2 focus:ring-ilali-300 focus:ring-offset-2 ${className}`}
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      <span>Notify me when booking opens</span>
    </button>
  );
}
