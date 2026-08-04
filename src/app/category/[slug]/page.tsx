/* Hallmark · macrostructure: Feature Stack · genre: playful · theme: ilali-native
 * Designed-as-app · design-system: ilali-tokens
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import InteriorHero from "@/components/InteriorHero";
import { categories } from "@/lib/constants";
import { getProviders, getCategories } from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Category Not Found | ILALI" };

  return {
    title: `${cat.name} Activities | ILALI`,
    description: `Browse ${cat.name.toLowerCase()} activities for children in Cape Town. ${cat.description}.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const [dbProviders, dbCategories] = await Promise.all([
    getProviders({ category: slug }),
    getCategories(),
  ]);
  const providers = dbProviders.map(p => mapProvider(p, dbCategories));
  const filtered = providers.filter((p) => p.categorySlug === slug);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero — photo-backed with category image */}
        <InteriorHero
          eyebrow={cat.name}
          title={<>{cat.icon} {cat.name}</>}
          subtitle={cat.description}
          imageSrc={`/images/providers/${slug}.jpg`}
          imageAlt={`${cat.name} activities in Cape Town`}
        />

        {/* Breadcrumb + metadata bar */}
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/categories"
              className="inline-flex items-center gap-1 text-sm font-medium text-ink-faint hover:text-teal-deep transition-colors"
            >
              ← All Categories
            </Link>
            <span className="text-xs font-semibold text-ink-faint">
              {filtered.length} {filtered.length === 1 ? "activity" : "activities"} · ⚡ All vetted
            </span>
          </div>
        </div>

        {/* Results — Feature Stack approach: each provider as a distinct feature block */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((provider, idx) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-ink/10 bg-white p-12 text-center shadow-sm">
              <span className="text-4xl">{cat.icon}</span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                No activities yet
              </h3>
              <p className="mt-2 text-sm text-ink-faint">
                We&apos;re adding new providers in this category soon. Check
                back later or browse other categories.
              </p>
              <Link
                href="/browse"
                className="mt-6 inline-flex items-center rounded-full bg-ilali-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
              >
                Browse all activities
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
