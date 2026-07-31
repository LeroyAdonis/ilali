"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RedeemButtonProps {
  rewardType: string;
  cost: number;
  disabled?: boolean;
}

/**
 * Redeem button for the rewards dashboard. POSTs to /api/rewards/redeem
 * and refreshes the server-rendered page so the balance hero updates.
 */
export default function RedeemButton({
  rewardType,
  cost,
  disabled = false,
}: RedeemButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  async function handleRedeem() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardType }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok) {
        setFeedback({
          tone: "ok",
          text: `Redeemed! ${data?.pointsSpent ?? cost} pts spent — new balance ${data?.balance ?? "?"} pts.`,
        });
        router.refresh();
      } else {
        setFeedback({
          tone: "err",
          text: data?.error ?? "Redemption failed — please try again.",
        });
      }
    } catch {
      setFeedback({ tone: "err", text: "Redemption failed — please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleRedeem}
        disabled={disabled || busy}
        className="w-full rounded-full bg-gradient-to-r from-sunset-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-sunset-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Redeeming…" : `Redeem — ${cost} pts`}
      </button>
      {feedback && (
        <p
          className={`text-xs leading-relaxed ${
            feedback.tone === "ok" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
