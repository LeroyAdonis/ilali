import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCard from "@/components/CategoryCard";
import { categories } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Categories | ILALI",
  description:
    "Browse children's activities by category — Arts, Sports, Music, Education, Holiday Programs, and more in Cape Town.",
};

export default function CategoriesPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero header */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Browse by Category
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ilali-100 sm:text-lg">
              Find the perfect activity for your child — from sports and arts to
              music and education.
            </p>
          </div>
        </section>

        {/* Category grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                name={cat.name}
                icon={cat.icon}
                colorClasses={cat.color}
                description={cat.description}
                href={`/browse?category=${cat.slug}`}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
