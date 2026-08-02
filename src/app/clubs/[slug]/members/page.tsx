import { notFound } from "next/navigation";
import { Home, Users } from "lucide-react";
import RoleBadge from "@/components/community/RoleBadge";
import {
  getProviderBySlug,
  getClubMemberships,
  getClubStats,
} from "@/lib/data-source";
import { formatJoinedDate } from "@/lib/club-format";

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  const [memberships, stats] = await Promise.all([
    getClubMemberships(dbProvider.id),
    getClubStats(dbProvider.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Members</h2>
        <p className="mt-1 text-sm text-ink-faint">
          {stats.memberFamilies} member famil
          {stats.memberFamilies === 1 ? "y" : "ies"} — parents, volunteers and
          organizers who make this club run.
        </p>
      </div>

      {memberships.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {memberships.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ilali-100 to-sunset-100 text-base font-bold text-ilali-700">
                  {(member.parentName ?? "?").charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {member.parentName ?? "Club member"}
                  </p>
                  <div className="mt-1">
                    <RoleBadge role={member.role ?? "parent"} />
                  </div>
                </div>
              </div>

              {member.childNames.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.childNames.map((childName) => (
                    <span
                      key={childName}
                      className="rounded-full bg-paper-warm px-2.5 py-1 text-xs font-medium text-ink-soft"
                    >
                      {childName}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink/10 pt-3 text-xs text-ink-faint">
                {member.suburb && (
                  <span className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" aria-hidden="true" />
                    {member.suburb}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Member since{" "}
                  {member.joinedAt ? formatJoinedDate(member.joinedAt) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-10 text-center">
          <Users
            className="mx-auto h-8 w-8 text-ink-faint"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-ink-soft">
            No members yet
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Families who join this club will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
