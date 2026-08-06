import { db } from "@/lib/db/index";
import { providerApplications, users } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import Link from "next/link";
import { Building2, Download } from "lucide-react";
import { ApplicationCard } from "./ApplicationCard";

export const dynamic = "force-dynamic";

const TAB_STATUSES = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Contacted", value: "contacted" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
] as const;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: activeStatus } = await searchParams;

  const all = await db
    .select()
    .from(providerApplications)
    .orderBy(desc(providerApplications.createdAt));

  const applications = activeStatus
    ? all.filter((a) => a.status === activeStatus)
    : all;

  // Compute counts for each tab from the full list
  const counts: Record<string, number> = {};
  for (const tab of TAB_STATUSES) {
    counts[tab.value] = tab.value
      ? all.filter((a) => a.status === tab.value).length
      : all.length;
  }

  // Which application emails already have a user account — drives the
  // "Account created: [email]" state on approved applications.
  const emails = all
    .map((a) => a.email?.toLowerCase().trim())
    .filter((e): e is string => Boolean(e));
  const accountUsers = emails.length
    ? await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.email, emails))
    : [];
  const emailsWithAccount = new Set(accountUsers.map((u) => u.email.toLowerCase()));

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
              tab.value === (activeStatus ?? "") ||
              (!activeStatus && tab.value === "");
            return (
              <Link
                key={tab.value}
                href={tab.value ? `?status=${tab.value}` : "?"}
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
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-warm transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="rounded-xl border border-ink/10 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-ink-faint" />
          <p className="mt-3 text-sm text-ink-faint">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              accountExists={emailsWithAccount.has(
                (app.email || "").toLowerCase().trim()
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
