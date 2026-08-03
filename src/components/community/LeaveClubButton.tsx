"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";

interface LeaveClubButtonProps {
  clubSlug: string;
  clubName: string;
}

/**
 * LeaveClubButton — small text link that opens a confirm dialog.
 * On confirm, POSTs to /api/clubs/[slug]/leave and changes state.
 */
export default function LeaveClubButton({
  clubSlug,
  clubName,
}: LeaveClubButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [left, setLeft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeave = useCallback(async () => {
    setLeaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/leave`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to leave");
      }
      setLeft(true);
      setShowConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to leave");
    } finally {
      setLeaving(false);
    }
  }, [clubSlug]);

  if (left) {
    return (
      <span className="text-xs text-ink-faint">Left — rejoin anytime</span>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs text-ink-faint hover:text-red-500 transition-colors"
      >
        Leave club
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}

      {/* Confirm dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div className="w-full max-w-sm rounded-t-xl bg-white p-6 shadow-xl sm:rounded-xl">
            <div className="flex items-start justify-between">
              <p className="text-sm font-bold text-ink">
                Leave {clubName}?
              </p>
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-full p-1 text-ink-faint hover:text-ink-soft transition-colors"
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Your contributions and chat messages stay — you&apos;re part of
              the club&apos;s history. You can rejoin anytime.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-paper-warm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="flex-1 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {leaving ? "Leaving..." : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
