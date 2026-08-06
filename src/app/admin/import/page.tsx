import Link from "next/link";
import { FileUp, History } from "lucide-react";
import ImportUpload from "./ImportUpload";
import ImportHistory from "./ImportHistory";

export const dynamic = "force-dynamic";

const TABS = [
  { label: "Upload", value: "upload", icon: FileUp },
  { label: "History", value: "history", icon: History },
] as const;

/**
 * /admin/import (spec Scenario 1–4, T013).
 * Server shell — admin layout gates access. Upload tab (multi-format intake →
 * preview → commit) and History tab (batch audit trail with derived counts).
 */
export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: activeTab } = await searchParams;
  const tab = activeTab === "history" ? "history" : "upload";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Bulk import</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Import providers from a CSV, Excel file, or pasted text — preview
          first, then commit to the application queue.
        </p>
      </div>

      {/* C1 Outlined chip tabs — same pattern as /admin/applications */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const isActive = t.value === tab;
          return (
            <Link
              key={t.value}
              href={t.value === "upload" ? "/admin/import" : "/admin/import?tab=history"}
              scroll={false}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-ilali-600 text-white border-ilali-600"
                  : "border-ink/10 text-ink-soft hover:border-ink/10 hover:text-ink"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "history" ? <ImportHistory /> : <ImportUpload />}
    </div>
  );
}
