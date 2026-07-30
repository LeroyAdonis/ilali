import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import {
  ClipboardList,
  Users,
  CheckCircle,
  Building2,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AdminStatusBadge,
  AdminTable,
  AdminStatCard,
  AdminPageHeader,
} from "@/components/admin";

export const dynamic = "force-dynamic";

const PER_PAGE = 10;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search: searchQuery, page: pageStr } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(desc(providerApplications.createdAt));

  const pending = applications.filter((a) => a.status === "pending");
  const approved = applications.filter((a) => a.status === "approved");

  // Filter by search
  const filtered = searchQuery
    ? applications.filter((a) => {
        const q = searchQuery.toLowerCase();
        return (
          a.name?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.activityType?.toLowerCase().includes(q) ||
          a.location?.toLowerCase().includes(q)
        );
      })
    : applications;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const paged = filtered.slice(start, start + PER_PAGE);

  const headers = ["Name", "Activity", "Location", "Status", "Date"];
  const rows = paged.map((app) => [
    <div key="name">
      <p className="text-sm font-medium text-slate-900">{app.name}</p>
      <p className="text-xs text-slate-500">{app.email}</p>
    </div>,
    <span key="activity" className="whitespace-nowrap">
      {app.activityType}
    </span>,
    <span key="location" className="whitespace-nowrap">
      {app.location || "—"}
    </span>,
    <AdminStatusBadge
      key="status"
      status={
        app.status as "pending" | "contacted" | "approved" | "rejected" | null
      }
    />,
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

      {/* Stat cards — arhamkhnz 4-up grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          title="Total Applications"
          value={applications.length}
          icon={ClipboardList}
          iconColor="bg-slate-100 text-slate-600"
        />
        <AdminStatCard
          title="Pending"
          value={pending.length}
          change={{ value: `${pending.length}`, positive: false }}
          description="Awaiting review"
          icon={Users}
          iconColor="bg-amber-100 text-amber-600"
        />
        <AdminStatCard
          title="Approved"
          value={approved.length}
          icon={CheckCircle}
          iconColor="bg-teal-100 text-teal-600"
        />
        <AdminStatCard
          title="Providers Live"
          value={approved.length}
          icon={Building2}
          iconColor="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Recent applications */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Applications
          </h2>
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <form className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery || ""}
                placeholder="Search applications..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </form>
            {/* Export button */}
            <Link
              href="/admin/applications"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </Link>
            <Link
              href="/admin/applications"
              className="text-sm font-medium text-ilali-600 hover:text-ilali-700"
            >
              View all
            </Link>
          </div>
        </div>

        {paged.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              {searchQuery
                ? "No applications match your search."
                : "No applications yet."}
            </p>
            {searchQuery && (
              <Link
                href="/admin"
                className="mt-2 inline-block text-sm font-medium text-ilali-600 hover:text-ilali-700"
              >
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <>
            <AdminTable
              headers={headers}
              rows={rows}
              emptyMessage="No applications yet."
              bare
            />

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
              <p className="text-sm text-slate-500">
                Showing {start + 1}–{Math.min(start + PER_PAGE, filtered.length)}{" "}
                of {filtered.length} applications
              </p>
              <div className="flex items-center gap-1">
                {safePage > 1 ? (
                  <Link
                    href={`/admin?page=${safePage - 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-300 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" />
                  </span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Link
                      key={page}
                      href={`/admin?page=${page}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        page === safePage
                          ? "bg-ilali-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </Link>
                  )
                )}

                {safePage < totalPages ? (
                  <Link
                    href={`/admin?page=${safePage + 1}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-300 cursor-not-allowed">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
