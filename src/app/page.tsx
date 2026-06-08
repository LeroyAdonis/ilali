import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ILALI — Cape Town's Marketplace for Kids' Activities",
  description:
    "Discover trusted, background-checked extramural activities for your children in Cape Town. Search by category, age, location, and price. Book with confidence.",
  openGraph: {
    title: "ILALI — Cape Town's Marketplace for Kids' Activities",
    description:
      "Find vetted extramural activities your kids will love. Every provider is background-checked.",
    type: "website",
  },
};

const features = [
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "100% Vetted",
    desc: "Every provider is background-checked. We do the safety work so you don't have to.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
    title: "Search & Discover",
    desc: "Browse by category, location, age, or price. Find the perfect activity for your child in minutes.",
  },
  {
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: "Trusted Community",
    desc: "Built with ASSITEJ SA & BASA. Real reviews from real Cape Town families.",
  },
];

const steps = [
  { num: "01", title: "Search", desc: "Browse activities by category, age group, location, or price range." },
  { num: "02", title: "Compare", desc: "Read reviews, check ratings, and find the perfect fit for your child." },
  { num: "03", title: "Book", desc: "Reserve your spot directly through the platform. Simple and secure." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ───── NAV (minimal — just logo + sign in) ───── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <img
              src="/images/brand/ilali-logo-38.png"
              alt="ILALI"
              width={38}
              height={38}
              className="rounded-md"
            />
            <span className="text-lg font-bold text-slate-900">ILALI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-ilali-600 transition-colors"
            >
              Browse Activities
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-ilali-400 hover:text-ilali-600 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-ilali-600 px-5 py-2 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ───── HERO ───── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-ilali-50 via-white to-sunset-50">
          <div className="pointer-events-none absolute -top-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-ilali-100/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-warm-100/20 blur-3xl" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-36">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ilali-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-ilali-700">
              <span className="h-1.5 w-1.5 rounded-full bg-ilali-500" />
              Cape Town, South Africa
            </span>

            <h1 className="mt-8 max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find activities your{" "}
              <span className="text-ilali-600">kids will love</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              ILALI is Cape Town&apos;s trusted marketplace for children&apos;s
              extramural activities. Every provider is background-checked, every
              review is from a real family, and every booking supports local
              kids&apos; programmes.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-10 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-ilali-700 hover:shadow-xl"
              >
                Enter ILALI
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/for-providers"
                className="inline-flex items-center rounded-full border-2 border-slate-300 bg-white px-10 py-4 text-base font-semibold text-slate-700 transition-all hover:border-ilali-400 hover:text-ilali-600"
              >
                I&apos;m a provider
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              No credit card required &middot; Free to browse &middot; 500+ activities
            </p>
          </div>
        </section>

        {/* ───── LOGO STRIP / TRUST BAR ───── */}
        <section className="border-y border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
              Built in partnership with
            </p>
            <div className="mt-4 flex items-center justify-center gap-8">
              <img
                src="/images/assitej/assitej-sa-logo.png"
                alt="ASSITEJ South Africa"
                className="h-10 w-auto object-contain opacity-60"
              />
              <img
                src="/images/basa/basa-logo.png"
                alt="Business and Arts South Africa"
                className="h-8 w-auto object-contain opacity-60"
              />
            </div>
          </div>
        </section>

        {/* ───── FEATURES ───── */}
        <section className="px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Everything you need to find the right activity
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                No more scrolling through Facebook groups or asking around.
                Everything&apos;s in one place, vetted and verified.
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="group rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:border-ilali-200 hover:shadow-md">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-ilali-50 text-ilali-600 transition-colors group-hover:bg-ilali-100">
                    {f.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── HOW IT WORKS ───── */}
        <section className="bg-slate-50 px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm uppercase tracking-widest text-ilali-500 font-semibold">
                Three Simple Steps
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                How ILALI works
              </h2>
            </div>
            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.num} className="relative text-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ilali-600 text-2xl font-bold text-white shadow-lg">
                    {step.num}
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
              >
                Learn more about how ILALI works →
              </Link>
            </div>
          </div>
        </section>

        {/* ───── FOR PROVIDERS TEASER ───── */}
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-ilali-600 via-ilali-700 to-sunset-700 shadow-xl">
              <div className="relative px-8 py-16 text-center sm:px-16 sm:py-20">
                <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                  Are you a provider?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ilali-100">
                  List your activities for free and reach thousands of Cape Town
                  families looking for quality children&apos;s programmes.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/for-providers"
                    className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-ilali-700 shadow-md transition-all hover:bg-sunset-50 hover:shadow-lg"
                  >
                    Learn about listing →
                  </Link>
                  <Link
                    href="/providers/signup"
                    className="rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/60"
                  >
                    List your activity
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── FINAL CTA ───── */}
        <section className="border-t border-slate-200 bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Ready to find your child&apos;s next adventure?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                Join thousands of Cape Town families who trust ILALI for their
                children&apos;s extramural activities.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-10 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-ilali-700 hover:shadow-xl"
                >
                  Browse Activities
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-full border-2 border-slate-300 bg-white px-10 py-4 text-base font-semibold text-slate-700 transition-all hover:border-ilali-400 hover:text-ilali-600"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───── FOOTER ───── */}
        <footer className="border-t border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-3">
                <img
                  src="/images/brand/ilali-logo-38.png"
                  alt="ILALI"
                  width={32}
                  height={32}
                  className="rounded"
                />
                <span className="text-sm font-bold text-slate-800">ILALI</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
                <Link href="/about" className="hover:text-slate-700 transition-colors">About</Link>
                <Link href="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
                <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms</Link>
                <span>&copy; {new Date().getFullYear()} Arts4Youth</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
