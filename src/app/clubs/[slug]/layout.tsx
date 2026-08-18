import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InteriorHero from "@/components/InteriorHero";
import VerificationBadge from "@/components/verification/VerificationBadge";
import ClubTabs from "@/components/community/ClubTabs";
import { CATEGORY_IMAGES, CLUB_IMAGES, HERO_IMAGES } from "@/lib/images";
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

/**
 * Club layout — hero header (name + verification badge + category · ages ·
 * price) and the About | Schedule | Members | Chat tab nav shared by all
 * club sub-pages. Every provider IS a club.
 */
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
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
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

        {/* Hero header — InteriorHero standard (height, image crop, and
            title-in-body-container match every other page) */}
        <InteriorHero
          eyebrow={provider.category}
          title={provider.name}
          subtitle={`Ages ${provider.ageRange.split(" years")[0]} · ${provider.price}`}
          image={
            CLUB_IMAGES[provider.slug] ??
            (provider.image
              ? { src: provider.image, alt: provider.name }
              : (CATEGORY_IMAGES[provider.categorySlug] ?? HERO_IMAGES.browse))
          }
          badge={
            <Suspense fallback={null}>
              <VerificationBadge providerId={dbProvider.id} />
            </Suspense>
          }
        />

        {/* Back link — matches category page pattern */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Link
            href="/clubs"
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-faint hover:text-teal-deep transition-colors"
          >
            ← All Clubs
          </Link>
        </div>

        {/* Section tabs */}
        <div className="mt-6">
          <ClubTabs slug={slug} />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
