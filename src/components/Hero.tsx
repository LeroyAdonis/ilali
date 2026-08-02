import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ilali-50 via-white to-sunset-50">
      <div className="relative mx-auto flex max-w-7xl flex-col items-start px-4 py-20 text-left sm:px-6 lg:px-8 lg:py-32">
        {/* Tagline */}
        <span className="text-sm uppercase tracking-widest text-ilali-500 font-semibold mb-5">
          IT TAKES A VILLAGE
        </span>

        {/* Heading */}
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Find activities your kids will love
        </h1>

        {/* Description */}
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
          Discover vetted extramural activities in your community. Every
          provider is background-checked for your peace of mind.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-4">
          <Link
            href="/browse"
            className="rounded-full bg-ilali-600 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-ilali-700 transition-colors"
          >
            Browse activities
          </Link>
          <Link
            href="/providers/signup"
            className="rounded-full border-2 border-ink/10 bg-white px-8 py-3 text-sm font-semibold text-ink-soft hover:border-ilali-400 hover:text-ilali-600 transition-colors"
          >
            List your activity
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-10 flex items-center gap-2 text-sm text-ink-faint">
          <span className="font-semibold text-ink-soft">500+</span>
          <span>providers</span>
          <span className="mx-2 text-ink-faint">|</span>
          <span className="font-semibold text-ink-soft">4.8</span>
          <span>avg rating</span>
        </div>
      </div>
    </section>
  );
}
