import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { ClipboardList, Users, Building2, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(desc(providerApplications.createdAt));

  const pending = applications.filter((a) => a.status === "pending");
  const contacted = applications.filter((a) => a.status === "contacted");
  const approved = applications.filter((a) => a.status === "approved");
  const rejected = applications.filter((a) => a.status === "rejected");

  const stats = [
    {
      label: "Total Applications",
      value: applications.length,
      icon: ClipboardList,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Pending",
      value: pending.length,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Approved",
      value: approved.length,
      icon: CheckCircle,
      color: "text-teal-600",
      bg: "bg-teal-100",
    },
    {
      label: "Providers Live",
      value: approved.length,
      icon: Building2,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of provider applications and activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg ${stat.bg} p-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </div>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.slice(0, 10).map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {app.name}
                        </p>
                        <p className="text-xs text-slate-500">{app.email}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {app.activityType}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {app.location || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {app.createdAt
                        ? new Date(app.createdAt).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    contacted: "bg-blue-100 text-blue-700",
    approved: "bg-teal-100 text-teal-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status || "pending"] || styles.pending
      }`}
    >
      {status || "pending"}
    </span>
  );
}
