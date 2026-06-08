import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star, Users, Wifi } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { venues } from "@/lib/constants";
import type { Venue } from "@/lib/types";

export function generateStaticParams() {
  return venues.map((v: Venue) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = venues.find((v: Venue) => v.slug === slug);
  if (!venue) return { title: "Venue Not Found — ILALI" };
  return {
    title: `${venue.name} — ILALI Venues`,
    description: `${venue.name} — ${venue.type} venue in ${venue.location}.`,
  };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const venue = venues.find((v: Venue) => v.slug === slug);
  if (!venue) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/home" className="hover:text-ilali-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/venues" className="hover:text-ilali-600 transition-colors">Venues</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{venue.name}</span>
          </nav>
        </div>

        {/* Hero */}
        <div className="relative mt-4 h-48 sm:h-64 w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-400">
          {venue.image ? (
            <img src={venue.image} alt={venue.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center text-3xl">
                {venue.name.charAt(0)}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 sm:left-10">
            <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 capitalize backdrop-blur-sm mb-2">
              {venue.type}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
              {venue.name}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-ilali-500" />
                  {venue.location}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {venue.rating}
                  <span className="text-slate-400">({venue.reviewCount} reviews)</span>
                </span>
                {venue.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-ilali-500" />
                    Capacity: {venue.capacity}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">About this venue</h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  {venue.name} is a premier {venue.type} venue located in {venue.location}. Perfect for
                  children&apos;s activities, workshops, and events. The space is child-safe, clean, and
                  fully equipped for a variety of programs.
                </p>
              </div>

              {venue.amenities && venue.amenities.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        <Wifi className="h-3 w-3 text-ilali-500" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Available for</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  {[
                    "Children's extramural activities",
                    "Birthday parties and events",
                    "Workshops and classes",
                    "Holiday programs",
                    "Community gatherings",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-ilali-500 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-bold text-slate-900">{venue.rating}</span>
                  <span className="text-sm text-slate-400">({venue.reviewCount} reviews)</span>
                </div>

                {venue.capacity && (
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">Capacity</p>
                    <p className="text-sm font-medium text-slate-700">{venue.capacity} people</p>
                  </div>
                )}

                <Link
                  href="/contact"
                  className="block w-full rounded-full bg-ilali-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
                >
                  Contact Host
                </Link>
                <p className="mt-2 text-xs text-center text-slate-400">
                  Inquire about availability and pricing
                </p>
                <Link
                  href="/venues"
                  className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-ilali-600 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  All venues
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
