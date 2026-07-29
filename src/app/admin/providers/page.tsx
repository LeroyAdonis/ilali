import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Pencil, Check, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const providerList = await db
    .select()
    .from(providers)
    .orderBy(desc(providers.createdAt));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage activity providers on the platform.
          </p>
        </div>
        <Link
          href="/admin/providers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-ilali-600 px-4 py-2 text-sm font-medium text-white hover:bg-ilali-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </Link>
      </div>

      {providerList.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">No providers yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Flags
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providerList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500">{p.providerName}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {p.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {p.location}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
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
                    <Link
                      href={`/admin/providers/${p.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-ilali-600 hover:text-ilali-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
