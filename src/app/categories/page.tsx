import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import InteriorHero from "@/components/InteriorHero";
import { HERO_IMAGES } from "@/lib/images";
import Link from "next/link";
import { categories } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Categories | ILALI",
  description:
    "Browse children's activities by category in Cape Town — arts, sports, music, education, holiday programs, and more.",
};

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Interior Hero */}
        <InteriorHero
          eyebrow="Browse"
          title={
            <>
              Every <span className="text-teal">activity</span>,{" "}
              <span className="text-purple">sorted</span>
            </>
          }
          subtitle="From arts and sports to music and holiday camps — find exactly what your child is looking for."
          image={HERO_IMAGES['categories']}
        />

        {/* Category grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((cat, idx) => (
              <CategoryCard
                key={cat.id}
                name={cat.name}
                icon={cat.icon}
                colorClasses={cat.color}
                description={cat.description}
                href={`/category/${cat.slug}`}
                accentColor={ACCENT_ROTATION[idx % ACCENT_ROTATION.length]}
              />
            ))}
          </div>
        </section>

        {/* CTA Band */}
        <section className="border-t border-ink/5 bg-paper-warm px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-7xl text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold-deep-2">
              ★ CAN&apos;T DECIDE?
            </span>
            <h2 className="font-display mt-2 text-[clamp(1.4rem,2.5vw,1.8rem)] font-bold text-ink">
              Not sure where to start?
            </h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-sm text-ink-faint">
              Tell us what your child loves, and ILALI will match them with vetted activities in your suburb.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-[10px] bg-gold px-8 py-3.5 text-[15px] font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] transition-transform hover:-translate-y-px"
              >
                Ask the AI Concierge 🤖
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center rounded-[10px] border border-ink/15 px-8 py-3.5 text-[15px] font-semibold text-ink transition-all hover:border-teal hover:text-teal-deep"
              >
                Browse all activities →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
