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
            className="flex items-center gap-2 text-xs text-slate-500"
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
            <span className="text-slate-800 font-medium">{provider.name}</span>
          </nav>
        </div>

        {/* Hero header */}
        <div className="relative mt-4 h-40 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-ilali-200 to-sunset-200">
          {provider.image ? (
            <img
              src={provider.image}
              alt={provider.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="h-20 w-20 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-4xl"
                aria-hidden="true"
              >
                {provider.name.charAt(0)}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-5 left-4 sm:left-10">
            <Suspense fallback={null}>
              <VerificationBadge
                providerId={dbProvider.id}
                className="mb-2 shadow-sm backdrop-blur-sm text-xs"
              />
            </Suspense>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              {provider.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-white/90 drop-shadow">
              {provider.category} · Ages {provider.ageRange.split(" years")[0]} ·{" "}
              {provider.isFree ? "Free" : provider.price}
            </p>
          </div>
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
