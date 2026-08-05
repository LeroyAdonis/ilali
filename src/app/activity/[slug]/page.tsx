import { redirect } from "next/navigation";
import { getProviderBySlug } from "@/lib/data-source";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const { getProviders } = await import("@/lib/data-source");
  const dbProviders = await getProviders();
  return dbProviders.map((p) => ({ slug: p.slug }));
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  // Permanent redirect to the canonical club page
  redirect(`/clubs/${slug}`);
}