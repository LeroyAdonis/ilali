import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import { categories, providers } from "@/lib/constants";

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

  const filtered = providers.filter((p) => p.categorySlug === slug);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/categories"
              className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ilali-200 hover:text-white transition-colors"
            >
              ← All Categories
            </Link>
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-2xl ${cat.color}`}
              >
                {cat.icon}
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {cat.name}
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
                  {cat.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 text-sm text-slate-500">
            {filtered.length === 0
              ? "No activities found in this category yet."
              : `Showing ${filtered.length} ${
                  filtered.length === 1 ? "activity" : "activities"
                }`}
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <span className="text-4xl">{cat.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No activities yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
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
