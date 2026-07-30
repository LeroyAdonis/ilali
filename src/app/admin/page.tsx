import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import {
  AdminStatusBadge,
  AdminTable,
  AdminPageHeader,
} from "@/components/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(desc(providerApplications.createdAt));

  const pending = applications.filter((a) => a.status === "pending");
  const approved = applications.filter((a) => a.status === "approved");

  const headers = ["Name", "Activity", "Location", "Status", "Date"];
  const rows = applications.slice(0, 10).map((app) => [
    <div key="name">
      <p className="text-sm font-medium text-slate-900">{app.name}</p>
      <p className="text-xs text-slate-500">{app.email}</p>
    </div>,
    <span key="activity" className="whitespace-nowrap">{app.activityType}</span>,
    <span key="location" className="whitespace-nowrap">{app.location || "—"}</span>,
    <AdminStatusBadge key="status" status={app.status as "pending" | "contacted" | "approved" | "rejected" | null} />,
    <span key="date" className="whitespace-nowrap">
      {app.createdAt
        ? new Date(app.createdAt).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—"}
    </span>,
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of provider applications and activity."
      />

      {/* T4 Numbered stat strip — Hallmark */}
      <div className="mb-8 flex flex-wrap divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid sm:grid-cols-2 lg:flex">
        <div className="flex flex-1 flex-col justify-center px-6 py-4 sm:px-5 sm:py-4">
          <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
            {applications.length}
          </span>
          <span className="mt-0.5 text-xs text-slate-500">total applications</span>
        </div>
        <div className="flex flex-1 flex-col justify-center border-t border-slate-200 px-6 py-4 sm:border-t-0 sm:px-5 sm:py-4">
          <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
            {pending.length}
          </span>
          <span className="mt-0.5 text-xs text-slate-500">pending</span>
        </div>
        <div className="flex flex-1 flex-col justify-center border-t border-slate-200 px-6 py-4 sm:border-t-0 sm:px-5 sm:py-4">
          <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
            {approved.length}
          </span>
          <span className="mt-0.5 text-xs text-slate-500">approved</span>
        </div>
        <div className="flex flex-1 flex-col justify-center border-t border-slate-200 px-6 py-4 sm:border-t-0 sm:px-5 sm:py-4">
          <span className="text-2xl font-extrabold tabular-nums text-slate-900 sm:text-3xl">
            {approved.length}
          </span>
          <span className="mt-0.5 text-xs text-slate-500">providers live</span>
        </div>
      </div>

      {/* Recent applications */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Applications
          </h2>
          <Link
            href="/admin/applications"
            className="text-sm font-medium text-ilali-600 hover:text-ilali-700"
          >
            View all
          </Link>
        </div>
        {applications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No applications yet.
            </p>
          </div>
        ) : (
          <AdminTable
            headers={headers}
            rows={rows}
            emptyMessage="No applications yet."
            bare
          />
        )}
      </div>
    </div>
  );
}
