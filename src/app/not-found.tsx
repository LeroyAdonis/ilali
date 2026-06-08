import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-ilali-50 via-white to-sunset-50 px-4">
      <div className="text-center">
        <span className="text-7xl">🔍</span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500">
          Looks like this activity hasn&apos;t been listed yet. Or maybe we
          took a wrong turn. Either way, let&apos;s get you back on track.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/home"
            className="rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-ilali-700 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/browse"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-ilali-400 hover:text-ilali-600 transition-colors"
          >
            Browse activities
          </Link>
          <Link
            href="/categories"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-ilali-400 hover:text-ilali-600 transition-colors"
          >
            Browse categories
          </Link>
        </div>
      </div>
    </div>
  );
}
