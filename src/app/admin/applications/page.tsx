import { db } from "@/lib/db/index";
import { providerApplications, providers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle, XCircle, Phone, Mail, Download } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin";

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
            <div
              key={app.id}
              className="rounded-xl border border-ink/10 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {app.name}
                    </h3>
                    <AdminStatusBadge status={app.status as "pending" | "contacted" | "approved" | "rejected" | null} />
                  </div>
                  <p className="mt-1 text-sm text-ink-faint">
                    {app.activityType}
                    {app.location && ` · ${app.location}`}
                  </p>
                  {app.description && (
                    <p className="mt-2 text-sm text-ink-soft line-clamp-2">
                      {app.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-faint">
                    {app.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {app.email}
                      </span>
                    )}
                    {app.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {app.phone}
                      </span>
                    )}
                    {app.createdAt && (
                      <span>
                        {new Date(app.createdAt).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  {app.ageMin != null && app.ageMax != null && (
                    <p className="mt-2 text-xs text-ink-faint">
                      Ages {app.ageMin}–{app.ageMax}
                      {app.priceValue != null &&
                        ` · R${(app.priceValue / 100).toFixed(2)}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col gap-2">
                  {app.status === "pending" && (
                    <form
                      action={`/api/admin/applications/${app.id}`}
                      method="POST"
                    >
                      <input type="hidden" name="status" value="contacted" />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Mark Contacted
                      </button>
                    </form>
                  )}
                  {(app.status === "pending" ||
                    app.status === "contacted") && (
                    <>
                      <form
                        action={`/api/admin/applications/${app.id}`}
                        method="POST"
                      >
                        <input type="hidden" name="status" value="approved" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      </form>
                      <form
                        action={`/api/admin/applications/${app.id}`}
                        method="POST"
                      >
                        <input type="hidden" name="status" value="rejected" />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </form>
                    </>
                  )}
                  {app.status === "approved" && (
                    <Link
                      href={`/admin/providers/new?applicationId=${app.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-ilali-50 px-3 py-1.5 text-xs font-medium text-ilali-700 hover:bg-ilali-100 transition-colors"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      Create Provider
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
