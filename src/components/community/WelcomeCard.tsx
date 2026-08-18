"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X, MessageCircle, Users, Car } from "lucide-react";

interface WelcomeCardProps {
  clubName: string;
  memberNumber: string | null;
  nextEvent?: string | null;
  memberCount: number;
  clubSlug: string;
}

const STORAGE_KEY_PREFIX = "ilali-welcome-dismissed-";

/**
 * WelcomeCard — shown after joining a club.
 * Dismissible with localStorage persistence per club.
 */
export default function WelcomeCard({
  clubName,
  memberNumber,
  memberCount,
  clubSlug,
}: WelcomeCardProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${clubSlug}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydrate dismiss state from localStorage after mount
    setDismissed(stored === "true");
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(storageKey, "true");
    setDismissed(true);
  }, [storageKey]);

  if (dismissed) return null;

  return (
    <div className="relative rounded-xl bg-amber-50/60 p-6">
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-4 rounded-full p-1 text-ink-faint hover:text-ink-soft hover:bg-white/50 transition-colors"
        aria-label="Dismiss welcome card"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-lg font-bold text-ink">
        🎉 Welcome to {clubName}!
      </p>

      {memberNumber && (
        <p className="mt-1 text-sm text-ink-soft">
          Member #{memberNumber} — one of {memberCount} member{" "}
          {memberCount === 1 ? "family" : "families"}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/clubs/${clubSlug}?tab=chat`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-soft border border-ink/10 hover:border-ilali-300 hover:text-ilali-700 transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Chat
        </Link>
        <Link
          href={`/clubs/${clubSlug}/members`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-soft border border-ink/10 hover:border-ilali-300 hover:text-ilali-700 transition-colors"
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          Members
        </Link>
        {clubSlug && (
          <a
            href={`#rides`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink-soft border border-ink/10 hover:border-ilali-300 hover:text-ilali-700 transition-colors"
          >
            <Car className="h-3.5 w-3.5" aria-hidden="true" />
            Rides
          </a>
        )}
      </div>
    </div>
  );
}
