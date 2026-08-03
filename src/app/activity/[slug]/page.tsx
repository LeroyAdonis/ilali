import Link from "next/link";
import InteriorHero from "@/components/InteriorHero";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Calendar,
  Award,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import ComingSoon from "@/components/ComingSoon";
import ReviewSection from "@/components/ReviewSection";
import VerificationBadge from "@/components/verification/VerificationBadge";
import JoinClubButton from "@/components/community/JoinClubButton";
import {
  getProviders,
  getProviderBySlug,
  getCategories,
  getSimilarProviders,
} from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

export async function generateStaticParams() {
  const dbProviders = await getProviders();
  return dbProviders.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) return { title: "Activity Not Found — ILALI" };
  const categories = await getCategories();
  const provider = mapProvider(dbProvider, categories);
  return {
    title: `${provider.name} — ILALI`,
    description: provider.description,
  };
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();
  const categories = await getCategories();
  const provider = mapProvider(dbProvider, categories);

  // Fetch similar providers
  let similarDbProviders: Awaited<ReturnType<typeof getSimilarProviders>> = [];
  try {
    similarDbProviders = await getSimilarProviders(dbProvider.id, 3);
  } catch {
    // Silently fail — similar providers are a nice-to-have
  }
  const similarProviders = similarDbProviders.map(p => mapProvider(p, categories));

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
            <span className="text-ink font-medium">
              {provider.name}
            </span>
          </nav>
        </div>

        <InteriorHero
          eyebrow={provider.category}
          title={provider.name}
          subtitle={provider.description}
          imageSrc={`/images/providers/${provider.categorySlug}.jpg`}
          imageAlt={provider.name}
        />

        {/* Back to category */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          <Link
            href={`/category/${provider.categorySlug}`}
            className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-ilali-600 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to {provider.category}
          </Link>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-ink-faint">
                    by{" "}
                    <span className="font-semibold text-ink-soft">
                      {provider.providerName}
                    </span>
                  </p>
                  <VerificationBadge
                    providerId={dbProvider.id}
                    className="text-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-ink-faint mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-ilali-500" aria-hidden="true" />
                    {provider.location} · {provider.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    {provider.rating}
                    <span className="text-ink-faint">
                      ({provider.reviewCount} review
                      {provider.reviewCount !== 1 ? "s" : ""})
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-ilali-500" aria-hidden="true" />
                    {provider.ageRange}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-ink mb-2">
                  About this activity
                </h2>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {provider.description}
                </p>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-ink mb-3">
                  Schedule
                </h2>
                <div className="rounded-xl border border-ink/10 bg-paper-warm p-4">
                  <div className="flex items-center gap-2 text-sm text-ink-soft">
                    <Calendar className="h-4 w-4 text-ilali-500" aria-hidden="true" />
                    <span>Monday – Friday</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-faint">
                    9:00 AM – 5:00 PM
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Weekend sessions available on request
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-ink mb-3">
                  What&apos;s included
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Qualified and vetted instructors",
                    "All equipment and materials provided",
                    "Small group sizes for personalised attention",
                    "Progress reports for parents",
                    "Safe and secure environment",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-ink-soft"
                    >
                      <Award
                        className="h-4 w-4 text-ilali-500 mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reviews */}
              <div>
                <ReviewSection providerId={dbProvider.id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-ink/10 bg-white p-6 shadow-sm space-y-4">
                <div className="mb-4">
                  {provider.isFree ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-ink">
                        {provider.price}
                      </span>
                      <span className="ml-1 text-sm text-ink-faint">
                        {provider.priceLabel}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-ink-faint mb-1">Age range</p>
                <p className="text-sm font-medium text-ink-soft mb-4">
                  {provider.ageRange}
                </p>

                {/* CTA */}
                <Link
                  href="/auth/signin"
                  className="block w-full rounded-full bg-ilali-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2"
                >
                  Sign In to Book
                </Link>

                {/* WhatsApp button */}
                {provider.phone && (
                  <WhatsAppButton
                    phone={provider.phone}
                    activityName={provider.name}
                    className="w-full !bg-[#25D366]"
                  />
                )}

                {/* T054: Online booking coming soon */}
                {!provider.phone && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Coming soon
                    </span>
                    <p className="mt-1 text-xs text-amber-800">
                      Online booking available soon
                    </p>
                  </div>
                )}

                {/* Join club */}
                <div className="pt-2 border-t border-ink/10">
                  <Suspense fallback={null}>
                    <JoinClubButton clubSlug={slug} />
                  </Suspense>
                </div>

                <p className="mt-2 text-xs text-center text-ink-faint">
                  Sign in to save, book, or message the provider
                </p>
                <Link
                  href="/browse"
                  className="mt-4 flex items-center justify-center gap-1 text-xs text-ink-faint hover:text-ilali-600 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                  Back to browse
                </Link>
              </div>
            </div>
          </div>

          {/* T051: You Might Also Like */}
          {similarProviders.length > 0 && (
            <section className="mt-16 border-t border-ink/10 pt-12">
              <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                You might also like
              </h2>
              <p className="mt-1 text-sm text-ink-faint">
                Other {provider.category.toLowerCase()} activities loved by
                parents
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similarProviders.map((sp) => (
                  <ProviderCard
                    key={sp.id}
                    provider={sp}
                    verificationBadge={
                      <Suspense fallback={null}>
                        <VerificationBadge providerId={sp.id} />
                      </Suspense>
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
