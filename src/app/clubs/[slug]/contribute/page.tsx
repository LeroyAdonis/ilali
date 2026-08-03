import { notFound } from "next/navigation";
import { getProviderBySlug, getCategories } from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";
import ContributionPicker from "@/components/community/ContributionPicker";
import ContributionFeed from "@/components/community/ContributionFeed";
import ClubHealthCard from "@/components/community/ClubHealthCard";

export default async function ClubContributePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  const categories = await getCategories();
  const provider = mapProvider(dbProvider, categories);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* ── Main column: picker + feed ── */}
      <div className="space-y-8 lg:col-span-2">
        <ContributionPicker clubId={dbProvider.id} clubName={provider.name} />
        <ContributionFeed clubId={dbProvider.id} />
      </div>

      {/* ── Sidebar: health card ── */}
      <aside className="space-y-6">
        <ClubHealthCard slug={slug} />
      </aside>
    </div>
  );
}
