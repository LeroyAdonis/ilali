import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Pencil, Check, Star, Search } from "lucide-react";
import { RemoveProviderButton } from "@/components/admin/RemoveProviderButton";

export const dynamic = "force-dynamic";

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search: searchQuery } = await searchParams;

  const providerList = await db
    .select()
    .from(providers)
    .orderBy(desc(providers.createdAt));

  const filtered = searchQuery
    ? providerList.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : providerList;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Providers</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Manage activity providers on the platform.
        </p>
      </div>

      {/* Search bar + Add Provider */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            name="search"
            defaultValue={searchQuery || ""}
            placeholder="Filter by name..."
            className="w-full rounded-lg border border-ink/10 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-ink-faint focus:border-ink/10 focus:outline-none focus:ring-1 focus:ring-ink/10"
          />
        </form>
        <Link
          href="/admin/providers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-ilali-600 px-4 py-2 text-sm font-medium text-white hover:bg-ilali-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-ink/10 bg-white px-6 py-12 text-center">
          <p className="text-sm text-ink-faint">
            {searchQuery
              ? "No providers match your search."
              : "No providers yet."}
          </p>
          {searchQuery && (
            <Link
              href="/admin/providers"
              className="mt-2 inline-block text-sm font-medium text-ilali-600 hover:text-ilali-700"
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-paper-warm/80 border-b border-ink/10">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-paper-warm/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-ink">
                        {p.name}
                      </p>
                      <p className="text-xs text-ink-faint">{p.providerName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-soft">
                      {p.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-soft">
                      {p.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-soft">
                      R{(p.priceValue / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {p.verified && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-700">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        {p.featured && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                            <Star className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/providers/${p.id}/edit`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-ilali-600 hover:text-ilali-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                        <RemoveProviderButton providerId={p.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
