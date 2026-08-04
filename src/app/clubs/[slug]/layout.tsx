/* Hallmark · macrostructure: Workbench · genre: playful · theme: ilali-native
 * Designed-as-app · design-system: ilali-tokens
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerificationBadge from "@/components/verification/VerificationBadge";
import ClubTabs from "@/components/community/ClubTabs";
import { getProviderBySlug, getCategories } from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) return { title: "Club Not Found — ILALI" };
  return {
    title: `${dbProvider.name} Club — ILALI`,
    description: dbProvider.description,
  };
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  const categories = await getCategories();
  const provider = mapProvider(dbProvider, categories);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb — tight, utilitarian */}
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <nav
            className="flex items-center gap-2 text-xs text-ink-faint"
            aria-label="Breadcrumb"
          >
            <Link
              href="/home"
              className="hover:text-ilali-600 transition-colors"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/browse"
              className="hover:text-ilali-600 transition-colors"
            >
              Browse
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-medium">{provider.name}</span>
          </nav>
        </div>

        {/* ── Hero — framed Workbench-style header ── */}
        <div className="mx-auto max-w-7xl mt-5 px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
            {/* Provider image strip */}
            <div className="relative h-40 sm:h-52 w-full overflow-hidden bg-teal/5">
              {provider.image ? (
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div
                    className="h-20 w-20 rounded-2xl bg-teal/10 flex items-center justify-center text-4xl"
                    aria-hidden="true"
                  >
                    {provider.name.charAt(0)}
                  </div>
                </div>
              )}
              {/* Lighter overlay — photo breathes more */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>

            {/* Club identity bar — distinct from the photo */}
            <div className="px-5 pb-5 sm:px-8 sm:pb-6 -mt-2 relative z-10">
              <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="mb-1.5">
                    <Suspense fallback={null}>
                      <VerificationBadge
                        providerId={dbProvider.id}
                        className="text-xs"
                      />
                    </Suspense>
                  </div>
                  <h1 className="font-display text-xl sm:text-3xl font-extrabold text-ink leading-[1.15]">
                    {provider.name}
                  </h1>
                  <p className="mt-1 text-sm text-ink-faint">
                    {provider.category} · Ages {provider.ageRange.split(" years")[0]} ·{" "}
                    {provider.isFree ? "Free" : provider.price}
                  </p>
                </div>
                <Link
                  href={`/activity/${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-ink/15 px-4 py-2 text-xs font-semibold text-ink hover:border-teal hover:text-teal-deep transition-colors shrink-0"
                >
                  View activity listing →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab navigation — framed instrument panel ── */}
        <div className="mx-auto max-w-7xl mt-5 px-4 sm:px-6 lg:px-8">
          <ClubTabs slug={slug} />
        </div>

        {/* ── Content area ── */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
