"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Star, Car, Users, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

// ── Types ──

interface RewardEntry {
  id: string;
  amount: number;
  action: string;
  referenceId?: string | null;
  createdAt: string | Date;
}

interface RideActivity {
  id: string;
  eventTitle: string;
  parentName: string;
  claimedByName?: string | null;
  createdAt: string | Date;
  status: string;
}

interface CommunityEntry {
  id: string;
  type: string;
  description: string | null;
  points: number;
  createdAt: string | Date;
}

interface NotificationBellProps {
  /** Ride activity entries — prefetched server-side if available */
  rideActivity?: RideActivity[];
  /** Community contribution entries — prefetched server-side if available */
  communityActivity?: CommunityEntry[];
}

// ── Helpers ──

function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function formatAction(action: string): string {
  return action
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ──

export default function NotificationBell({
  rideActivity: initialRides,
  communityActivity: initialCommunity,
}: NotificationBellProps) {
  const { data: session, isPending: sessionLoading } = useSession();

  const [open, setOpen] = useState(false);
  const [rewards, setRewards] = useState<RewardEntry[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState(false);
  const [rides, setRides] = useState<RideActivity[]>(initialRides ?? []);
  const [community, setCommunity] = useState<CommunityEntry[]>(
    initialCommunity ?? []
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // ── Fetch rewards from /api/rewards ──
  const fetchRewards = useCallback(async () => {
    if (!session) return;
    setRewardsLoading(true);
    setRewardsError(false);
    try {
      const res = await fetch("/api/rewards", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load rewards");
      const data = await res.json();
      // ledger is the reward points entries array
      const entries: RewardEntry[] = Array.isArray(data?.ledger)
        ? data.ledger.slice(0, 5)
        : [];
      setRewards(entries);
    } catch {
      setRewardsError(true);
    } finally {
      setRewardsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch-on-open sets loading synchronously, data arrives async
      fetchRewards();
    }
  }, [open, fetchRewards]);

  // ── Close on Escape ──
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // ── Close on outside click ──
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        bellRef.current &&
        !bellRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (sessionLoading || !session) return null;

  const hasAnyActivity =
    rewards.length > 0 || rides.length > 0 || community.length > 0;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={bellRef}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close notifications" : "Open notifications"}
        aria-expanded={open}
        className="relative inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white p-2 text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {hasAnyActivity && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal" />
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className={`absolute z-50 mt-2 max-h-96 w-72 overflow-y-auto rounded-xl border border-ink/10 bg-white shadow-lg sm:w-80 ${
            // Mobile: anchored right, within viewport. Desktop: right-aligned, constrained
            "right-0 max-w-[calc(100vw-2rem)]"
          }`}
          role="menu"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <h3 className="font-display text-sm font-semibold text-ink">
              Notifications
            </h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="rounded-lg p-1 text-ink-faint hover:bg-paper-warm hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-ink/5">
            {/* ── Section 1: Recent Rewards ── */}
            <section className="px-4 py-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <Star className="h-3.5 w-3.5 text-gold" />
                Recent Rewards
              </h4>
              {rewardsLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-ink-faint">
                  <IlaliSpinner size="xs" />
                  Loading rewards...
                </div>
              ) : rewardsError ? (
                <p className="py-2 text-sm text-ink-faint">
                  Could not load rewards
                </p>
              ) : rewards.length === 0 ? (
                <p className="py-2 text-sm text-ink-faint">
                  No recent activity
                </p>
              ) : (
                <ul className="space-y-2">
                  {rewards.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/10">
                        <Star className="h-3.5 w-3.5 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">
                          <span className="font-medium">
                            +{entry.amount} pts
                          </span>{" "}
                          for {formatAction(entry.action)}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {formatRelativeTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Section 2: Ride Activity ── */}
            <section className="px-4 py-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <Car className="h-3.5 w-3.5 text-teal" />
                Ride Activity
              </h4>
              {rides.length === 0 ? (
                <p className="py-2 text-sm text-ink-faint">
                  No recent activity
                </p>
              ) : (
                <ul className="space-y-2">
                  {rides.slice(0, 3).map((ride) => (
                    <li
                      key={ride.id}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/10">
                        <Car className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">
                          {ride.claimedByName
                            ? `Your ride with ${ride.claimedByName} was confirmed`
                            : `Ride for ${ride.eventTitle}`}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {formatRelativeTime(ride.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ── Section 3: Community ── */}
            <section className="px-4 py-3">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <Users className="h-3.5 w-3.5 text-purple" />
                Community
              </h4>
              {community.length === 0 ? (
                <p className="py-2 text-sm text-ink-faint">
                  No recent activity
                </p>
              ) : (
                <ul className="space-y-2">
                  {community.slice(0, 3).map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple/10">
                        <Users className="h-3.5 w-3.5 text-purple" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-ink">
                          You earned{" "}
                          <span className="font-medium">
                            +{entry.points} pts
                          </span>{" "}
                          for {entry.description ?? formatAction(entry.type)}
                        </p>
                        <p className="text-xs text-ink-faint">
                          {formatRelativeTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
