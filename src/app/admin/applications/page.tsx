import { db } from "@/lib/db/index";
import { providerApplications, users } from "@/lib/db/schema";
import { desc, inArray, ne } from "drizzle-orm";
import Link from "next/link";
import { Download } from "lucide-react";
import { ApplicationsList } from "./ApplicationsList";

export const dynamic = "force-dynamic";

const TAB_STATUSES = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Contacted", value: "contacted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
] as const;

const SOURCES = [
  { label: "Bulk imports", value: "bulk-import" },
  { label: "Posters", value: "poster" },
] as const;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string }>;
}) {
  const params = await searchParams;
  const activeStatus = params.status ?? "";
  const activeSource =
    params.source === "bulk-import" || params.source === "poster"
      ? params.source
      : null;

  // Wizard autosave rows stay out of the admin desk until submitted — filter
  // in SQL so accumulating drafts never ship to every desk load.
  const reviewed = await db
    .select()
    .from(providerApplications)
    .where(ne(providerApplications.status, "draft"))
    .orderBy(desc(providerApplications.createdAt));

  // Source filter (WS-4: bulk-import chip) applies first, then status tab.
  const sourceFiltered = activeSource
    ? reviewed.filter((a) => a.onboardSource === activeSource)
    : reviewed;

  const applications = activeStatus
    ? sourceFiltered.filter((a) => a.status === activeStatus)
    : sourceFiltered;

  // Compute counts for each tab from the source-filtered list
  const counts: Record<string, number> = {};
  for (const tab of TAB_STATUSES) {
    counts[tab.value] = tab.value
      ? sourceFiltered.filter((a) => a.status === tab.value).length
      : sourceFiltered.length;
  }

  // Which application emails already have a user account — drives the
  // "Account created: [email]" state on approved applications.
  const emails = reviewed
    .map((a) => a.email?.toLowerCase().trim())
    .filter((e): e is string => Boolean(e));
  const accountUsers = emails.length
    ? await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.email, emails))
    : [];
  const emailsWithAccount = new Set(accountUsers.map((u) => u.email.toLowerCase()));

  function tabHref(status: string): string {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (activeSource) qs.set("source", activeSource);
    const str = qs.toString();
    return str ? `?${str}` : "?";
  }

  function sourceHref(value: string): string {
    const qs = new URLSearchParams();
    if (activeStatus) qs.set("status", activeStatus);
    if (activeSource !== value) qs.set("source", value);
    const str = qs.toString();
    return str ? `?${str}` : "?";
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Applications</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Review and manage provider applications.
        </p>
      </div>

      {/* C1 Outlined chip filter tabs — Hallmark */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TAB_STATUSES.map((tab) => {
            const isActive =
              tab.value === activeStatus || (!activeStatus && tab.value === "");
            return (
              <Link
                key={tab.value}
                href={tabHref(tab.value)}
                scroll={false}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-ilali-600 text-white border-ilali-600"
                    : "border-ink/10 text-ink-soft hover:border-ink/10 hover:text-ink"
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-paper-warm text-ink-soft"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              </Link>
            );
          })}

          {/* Source filter chip (WS-4) */}
          {SOURCES.map((source) => {
            const isActive = activeSource === source.value;
            return (
              <Link
                key={source.value}
                href={sourceHref(source.value)}
                scroll={false}
                aria-pressed={isActive}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-600 text-white border-amber-600"
                    : "border-ink/10 text-ink-soft hover:border-ink/10 hover:text-ink"
                }`}
              >
                {source.label}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-paper-warm text-ink-soft"
                  }`}
                >
                  {sourceFiltered.length}
                </span>
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-warm transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Applications list — selection + bulk approve live in the client wrapper */}
      <ApplicationsList
        applications={applications}
        emailsWithAccount={emailsWithAccount}
      />
    </div>
  );
}
