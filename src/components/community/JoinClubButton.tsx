"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Check } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

interface JoinClubButtonProps {
  clubSlug: string;
  invitedBy?: string;
}

type MembershipState = {
  isMember: boolean;
  status: "active" | "inactive" | null;
  memberNumber: string | null;
  joinedAt: string | null;
};

export default function JoinClubButton({
  clubSlug,
  invitedBy,
}: JoinClubButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {
    try {
      const res = await fetch(`/api/clubs/${clubSlug}/membership`);
      if (!res.ok) throw new Error("Failed to fetch membership");
      const data: MembershipState = await res.json();
      setMembership(data);
    } catch {
      setError("Could not check membership");
    } finally {
      setLoading(false);
    }
  }, [clubSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch-on-mount sets loading synchronously, data arrives async
    fetchMembership();
  }, [fetchMembership]);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    try {
      const url = invitedBy
        ? `/api/clubs/${clubSlug}/join?invitedBy=${encodeURIComponent(invitedBy)}`
        : `/api/clubs/${clubSlug}/join`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to join");
      }
      await fetchMembership();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  // Not signed in
  if (!session) {
    return (
      <a
        href={`/auth/signin?callbackUrl=${encodeURIComponent(
          `/clubs/${clubSlug}`
        )}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Sign in to join
      </a>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-3">
        <IlaliSpinner size="xs" />
      </div>
    );
  }

  // Error state
  if (error && !membership) {
    return (
      <button
        onClick={handleJoin}
        disabled={joining}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2 disabled:opacity-50"
      >
        {joining ? (
          <>
            <IlaliSpinner size="xs" variant="inverse" />
            Joining...
          </>
        ) : (
          "🤝 Join this club"
        )}
      </button>
    );
  }

  // Active member
  if (membership?.status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ilali-50 px-4 py-2 text-sm font-semibold text-ilali-600">
        <Check className="h-4 w-4" aria-hidden="true" />
        You&apos;re a member
      </span>
    );
  }

  // Inactive (Alumni) — show Rejoin
  if (membership?.status === "inactive") {
    return (
      <button
        onClick={handleJoin}
        disabled={joining}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2 disabled:opacity-50"
      >
        {joining ? (
          <>
            <IlaliSpinner size="xs" variant="inverse" />
            Rejoining...
          </>
        ) : (
          "Rejoin this club"
        )}
      </button>
    );
  }

  // Not a member
  return (
    <>
      {error && (
        <p className="mb-2 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
      <button
        onClick={handleJoin}
        disabled={joining}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2 disabled:opacity-50"
      >
        {joining ? (
          <>
            <IlaliSpinner size="xs" variant="inverse" />
            Joining...
          </>
        ) : (
          "🤝 Join this club"
        )}
      </button>
    </>
  );
}
