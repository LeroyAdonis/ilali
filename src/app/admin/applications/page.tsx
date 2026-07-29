import { db } from "@/lib/db/index";
import { providerApplications, providers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle, XCircle, Phone, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(desc(providerApplications.createdAt));

  const pending = applications.filter((a) => a.status === "pending");
  const contacted = applications.filter((a) => a.status === "contacted");
  const approved = applications.filter((a) => a.status === "approved");
  const rejected = applications.filter((a) => a.status === "rejected");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review and manage provider applications.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        <Tab label="All" count={applications.length} />
        <Tab label="Pending" count={pending.length} active />
        <Tab label="Contacted" count={contacted.length} />
        <Tab label="Approved" count={approved.length} />
        <Tab label="Rejected" count={rejected.length} />
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {app.name}
                    </h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {app.activityType}
                    {app.location && ` · ${app.location}`}
                  </p>
                  {app.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {app.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
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
                    <p className="mt-2 text-xs text-slate-400">
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

function Tab({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-ilali-600 text-white"
          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
      }`}
    >
      {label}
      <span
        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs ${
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    contacted: "bg-blue-100 text-blue-700 border-blue-200",
    approved: "bg-teal-100 text-teal-700 border-teal-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        styles[status || "pending"] || styles.pending
      }`}
    >
      {status || "pending"}
    </span>
  );
}
