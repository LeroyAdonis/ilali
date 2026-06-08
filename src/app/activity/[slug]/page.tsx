import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star, Clock, Calendar, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { providers } from "@/lib/constants";
import type { Provider } from "@/lib/types";

export function generateStaticParams() {
  return providers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = providers.find((p: Provider) => p.slug === slug);
  if (!provider) return { title: "Activity Not Found — ILALI" };
  return {
    title: `${provider.name} — ILALI`,
    description: provider.description,
  };
}

export default async function ActivityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const provider = providers.find((p: Provider) => p.slug === slug);
  if (!provider) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/home" className="hover:text-ilali-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-ilali-600 transition-colors">Browse</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{provider.name}</span>
          </nav>
        </div>

        {/* Hero Image */}
        <div className="relative mt-4 h-56 sm:h-72 lg:h-96 w-full overflow-hidden bg-gradient-to-br from-ilali-200 to-sunset-200">
          {provider.image ? (
            <img src={provider.image} alt={provider.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-4xl">
                {provider.name.charAt(0)}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 sm:left-10">
            <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur-sm mb-2">
              {provider.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              {provider.name}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">by <span className="font-semibold text-slate-700">{provider.providerName}</span></p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-ilali-500" />
                    {provider.location} · {provider.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {provider.rating}
                    <span className="text-slate-400">({provider.reviewCount} reviews)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-ilali-500" />
                    {provider.ageRange}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">About this activity</h2>
                <p className="text-sm leading-relaxed text-slate-600">{provider.description}</p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Schedule</h2>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Calendar className="h-4 w-4 text-ilali-500" />
                    <span>Monday – Friday</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">9:00 AM – 5:00 PM</p>
                  <p className="mt-1 text-xs text-slate-400">Weekend sessions available on request</p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">What's included</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Qualified and vetted instructors",
                    "All equipment and materials provided",
                    "Small group sizes for personalised attention",
                    "Progress reports for parents",
                    "Safe and secure environment",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <Award className="h-4 w-4 text-ilali-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4">
                  {provider.isFree ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-slate-900">{provider.price}</span>
                      <span className="ml-1 text-sm text-slate-500">{provider.priceLabel}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-1">Age range</p>
                <p className="text-sm font-medium text-slate-700 mb-4">{provider.ageRange}</p>
                <Link
                  href="/auth/signin"
                  className="block w-full rounded-full bg-ilali-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
                >
                  Sign In to Book
                </Link>
                <p className="mt-2 text-xs text-center text-slate-400">Sign in to save, book, or message the provider</p>
                <Link
                  href="/browse"
                  className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-ilali-600 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to browse
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
