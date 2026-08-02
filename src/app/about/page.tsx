import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About | ILALI",
  description:
    "Learn about ILALI's mission, story, and values. We connect families with trusted children's activities in Cape Town and beyond.",
};

const values = [
  {
    title: "Safety",
    description:
      "Every provider on our platform is background-checked. Child safety is our non-negotiable foundation.",
    icon: "🛡️",
  },
  {
    title: "Community",
    description:
      "We believe in the power of community — connecting families with local providers to build stronger neighbourhoods.",
    icon: "🤝",
  },
  {
    title: "Accessibility",
    description:
      "Activities should be available to every child. We keep our platform simple and our pricing transparent.",
    icon: "🌍",
  },
  {
    title: "Trust",
    description:
      "Verified reviews, secure payments, and clear communication build trust between parents and providers.",
    icon: "⭐",
  },
];

const partners = [
  {
    name: "ASSITEJ SA",
    description:
      "International Association of Theatre for Children and Young People — South Africa chapter. Partnering to bring performing arts to more children.",
    icon: "🎭",
  },
  {
    name: "BASA",
    description:
      "Business and Arts South Africa. Working together to foster creative and cultural activities for young people.",
    icon: "🎨",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-paper-warm px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              About ILALI
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Connecting families with trusted children's activities — because
              it takes a village.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Our Mission
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              ILALI exists to help every child discover their passion in a safe,
              nurturing environment. We connect parents with trusted,
              background-checked activity providers so families can explore,
              learn, and grow together.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              We believe that when children have access to quality extramural
              activities — from sports and arts to music and coding — they build
              confidence, make friends, and develop skills that last a lifetime.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Our Story */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Our Story
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Founded in Cape Town, ILALI was born from a simple observation:
              parents across South Africa struggled to find and trust children's
              activity providers. Reviews were scattered, backgrounds were
              unchecked, and booking was a manual mess.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              We set out to change that. Starting with local providers in Cape
              Town, we built a platform where child safety comes first, where
              every provider is vetted, and where families can discover amazing
              activities with confidence.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Today, ILALI is growing into a trusted community hub — connecting
              hundreds of families with the best activities their neighbourhoods
              have to offer.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Values */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Our Values
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-ink/10 bg-white p-6 text-center shadow-sm"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl">
                  {value.icon}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <hr className="border-ink/10" />
        </div>

        {/* Partnerships */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Our Partners
            </h2>
            <p className="mt-2 text-sm text-ink-faint">
              Working together to enrich children's lives
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="rounded-xl border border-ink/10 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-paper-warm text-2xl">
                    {partner.icon}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">
                      {partner.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                      {partner.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
