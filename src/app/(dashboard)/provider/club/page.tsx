"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Users, Sprout } from "lucide-react";

interface ClubMember {
  id: string;
  parentName: string;
  childNames: string[];
  role: string;
  joinedAt: string | null;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  parent: {
    label: "Parent",
    className: "bg-ilali-50 text-ilali-600",
  },
  volunteer: {
    label: "Volunteer",
    className: "bg-gold/10 text-gold-deep-2",
  },
  organizer: {
    label: "Organizer",
    className: "bg-purple/10 text-purple",
  },
};

export default function ProviderClubPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auth gate
  useEffect(() => {
    if (!isPending && (!session || (session.user as { role?: string }).role !== "provider")) {
      router.push("/auth/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session) {
      const fetchMembers = async () => {
        try {
          const res = await fetch("/api/provider/club/members");
          if (res.ok) {
            const data = await res.json();
            setMembers(data.members ?? []);
          } else if (res.status !== 404) {
            setError("Failed to load members");
          }
        } catch (err) {
          console.error("Failed to fetch members:", err);
          setError("Failed to load members");
        } finally {
          setLoading(false);
        }
      };
      fetchMembers();
    }
  }, [session, isPending]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isPending || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink/10 border-t-teal" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm text-orange">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Club members</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Families who have joined your club.
          </p>
        </div>
        {members.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-ilali-50 px-4 py-2">
            <Users className="h-4 w-4 text-ilali-600" />
            <span className="text-sm font-bold text-ilali-600">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {members.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-10 text-center">
          <Sprout className="mx-auto h-8 w-8 text-ink-faint" />
          <p className="mt-3 text-sm font-medium text-ink-soft">
            Your community is growing 🌱
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Members join when parents sign up for your club.
          </p>
        </div>
      ) : (
        /* Members table */
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          {/* Table header */}
          <div className="hidden border-b border-ink/5 bg-paper-warm px-5 py-3 sm:grid sm:grid-cols-3">
            <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide">
              Parent
            </span>
            <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide">
              Children
            </span>
            <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide">
              Joined
            </span>
          </div>

          {/* Table rows */}
          {members.map((member) => (
            <div
              key={member.id}
              className="border-b border-ink/5 px-5 py-4 last:border-b-0 sm:grid sm:grid-cols-3 sm:items-center"
            >
              {/* Parent name + role badge */}
              <div>
                <span className="block text-sm font-medium text-ink">
                  {member.parentName}
                </span>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    ROLE_BADGES[member.role]?.className ?? ROLE_BADGES.parent.className
                  }`}
                >
                  {ROLE_BADGES[member.role]?.label ?? "Parent"}
                </span>
              </div>

              {/* Children */}
              <div className="mt-2 sm:mt-0">
                <span className="text-sm text-ink-soft">
                  {member.childNames.length > 0
                    ? member.childNames.join(", ")
                    : "—"}
                </span>
              </div>

              {/* Joined date */}
              <div className="mt-2 sm:mt-0">
                <time className="text-sm text-ink-faint">
                  {formatDate(member.joinedAt)}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
