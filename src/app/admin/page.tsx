import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ClipboardList, Users, Building2, CheckCircle } from "lucide-react";
import {
  AdminStatCard,
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

  const stats = [
    {
      label: "Total Applications",
      value: applications.length,
      icon: ClipboardList,
      colorClasses: "text-slate-600 bg-slate-100",
    },
    {
      label: "Pending",
      value: pending.length,
      icon: Users,
      colorClasses: "text-amber-600 bg-amber-100",
    },
    {
      label: "Approved",
      value: approved.length,
      icon: CheckCircle,
      colorClasses: "text-teal-600 bg-teal-100",
    },
    {
      label: "Providers Live",
      value: approved.length,
      icon: Building2,
      colorClasses: "text-blue-600 bg-blue-100",
    },
  ];

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

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            colorClasses={stat.colorClasses}
          />
        ))}
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
