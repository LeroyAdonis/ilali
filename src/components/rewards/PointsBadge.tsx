"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

/**
 * 🏆 points pill for the dashboard header.
 * Signed-in only: renders nothing while the session loads, for logged-out
 * visitors, and on any rewards API error — graceful in every failure mode.
 */
export default function PointsBadge() {
  const { data: session, isPending } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    fetch("/api/rewards", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.balance === "number") {
          setBalance(data.balance);
        }
      })
      .catch(() => {
        // Graceful: badge simply stays hidden on network/API errors.
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  if (isPending || !session || balance === null) return null;

  return (
    <Link
      href="/rewards"
      title="Ubuntu Rewards balance"
      aria-label={`Ubuntu Rewards balance: ${balance.toLocaleString()} points`}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-warm-50 px-3.5 py-1.5 text-sm font-semibold text-amber-700 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-100"
    >
      <span aria-hidden>🏆</span>
      <span>{balance.toLocaleString()} pts</span>
    </Link>
  );
}
