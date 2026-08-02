import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star, Users, Wifi } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewSection from "@/components/ReviewSection";
import { getVenues, getVenueBySlug } from "@/lib/data-source";
import { mapVenue } from "@/lib/db/mappers";

export async function generateStaticParams() {
  const dbVenues = await getVenues();
  return dbVenues.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbVenue = await getVenueBySlug(slug);
  if (!dbVenue) return { title: "Venue Not Found — ILALI" };
  const venue = mapVenue(dbVenue);
  return {
    title: `${venue.name} — ILALI Venues`,
    description: `${venue.name} — ${venue.type} venue in ${venue.location}.`,
  };
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbVenue = await getVenueBySlug(slug);
  if (!dbVenue) notFound();
  const venue = mapVenue(dbVenue);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs text-ink-faint">
            <Link href="/home" className="hover:text-ilali-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/venues" className="hover:text-ilali-600 transition-colors">Venues</Link>
            <span>/</span>
            <span className="text-ink font-medium">{venue.name}</span>
          </nav>
        </div>

        {/* Hero */}
        <div className="relative mt-4 h-48 sm:h-64 w-full overflow-hidden bg-paper-warm">
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
            <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-soft capitalize backdrop-blur-sm mb-2">
              {venue.type}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg">
              {venue.name}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-faint">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-ilali-500" />
                  {venue.location}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {venue.rating}
                  <span className="text-ink-faint">({venue.reviewCount} reviews)</span>
                </span>
                {venue.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-ilali-500" />
                    Capacity: {venue.capacity}
                  </span>
                )}
              </div>

              <div>
                <h2 className="font-display text-lg font-bold text-ink mb-2">About this venue</h2>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {venue.name} is a premier {venue.type} venue located in {venue.location}. Perfect for
                  children&apos;s activities, workshops, and events. The space is child-safe, clean, and
                  fully equipped for a variety of programs.
                </p>
              </div>

              {venue.amenities && venue.amenities.length > 0 && (
                <div>
                  <h2 className="font-display text-lg font-bold text-ink mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-3 py-1.5 text-xs font-medium text-ink-soft"
                      >
                        <Wifi className="h-3 w-3 text-ilali-500" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="font-display text-lg font-bold text-ink mb-3">Available for</h2>
                <ul className="space-y-2 text-sm text-ink-soft">
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

              {/* Reviews */}
              <div>
                <ReviewSection providerId="" venueId={dbVenue.id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-ink/10 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-bold text-ink">{venue.rating}</span>
                  <span className="text-sm text-ink-faint">({venue.reviewCount} reviews)</span>
                </div>

                {venue.capacity && (
                  <div className="mb-4 pb-4 border-b border-ink/10">
                    <p className="text-xs text-ink-faint mb-1">Capacity</p>
                    <p className="text-sm font-medium text-ink-soft">{venue.capacity} people</p>
                  </div>
                )}

                <Link
                  href="/contact"
                  className="block w-full rounded-full bg-ilali-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
                >
                  Contact Host
                </Link>
                <p className="mt-2 text-xs text-center text-ink-faint">
                  Inquire about availability and pricing
                </p>
                <Link
                  href="/venues"
                  className="mt-4 flex items-center justify-center gap-1 text-xs text-ink-faint hover:text-ilali-600 transition-colors"
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
