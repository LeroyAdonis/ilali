import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import ClubEventCard from "@/components/community/ClubEventCard";
import RoleBadge from "@/components/community/RoleBadge";
import RideRequest from "@/components/community/RideRequest";
import JoinClubButton from "@/components/community/JoinClubButton";
import WelcomeCard from "@/components/community/WelcomeCard";
import InviteBanner from "@/components/community/InviteBanner";
import ComingSoon from "@/components/ComingSoon";
import ProviderCard from "@/components/ProviderCard";
import ReviewSection from "@/components/ReviewSection";
import ContactButton from "@/components/saved/ContactButton";
import NotifyButton from "@/components/saved/NotifyButton";
import SaveButton from "@/components/saved/SaveButton";
import VerificationBadge, {
  getVerificationTier,
} from "@/components/verification/VerificationBadge";
import {
  getProviderBySlug,
  getCategories,
  getClubEvents,
  getClubStats,
  getSimilarProviders,
} from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

export default async function ClubHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invitedBy?: string }>;
}) {
  const { slug } = await params;
  const { invitedBy } = await searchParams;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  const [categories, events, stats, similarRows] = await Promise.all([
    getCategories(),
    getClubEvents(dbProvider.id),
    getClubStats(dbProvider.id),
    getSimilarProviders(dbProvider.id, 3),
  ]);
  const provider = mapProvider(dbProvider, categories);

  // Similar providers — map raw rows to UI Providers (tag-overlap query)
  const similarProviders = similarRows.map((row) =>
    mapProvider(row, categories)
  );

  // Verification tier for trust card
  const { tier } = await getVerificationTier(provider.id);

  const tierExplanation: Record<string, string> = {
    trusted: "Verified by ILALI + vouched for by 3+ parents",
    verified: "Background-checked and documents verified",
    listed: "Self-registered — verification in progress",
  };

  // Upcoming events only (data-source returns upcoming-first, already sorted)
  const now = Date.now();
  const upcomingEvents = events
    .filter((e) => e.startTime.getTime() >= now)
    .slice(0, 3);

  return (
    <>
    <div className="grid gap-10 lg:grid-cols-3">
      {/* ── Main column ── */}
      <div className="lg:col-span-2 space-y-10">
        {/* Invite banner */}
        {invitedBy && (
          <InviteBanner
            clubSlug={slug}
            clubName={provider.name}
            inviterId={invitedBy}
          />
        )}

        {/* About */}
        <section aria-labelledby="club-about">
          <h2
            id="club-about"
            className="font-display text-lg font-bold text-ink mb-2"
          >
            About this club
          </h2>
          <p className="text-sm leading-relaxed text-ink-soft">
            {provider.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-faint">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-ilali-500" aria-hidden="true" />
              {provider.location}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 text-ilali-500" aria-hidden="true" />
              {stats.memberFamilies} member famil
              {stats.memberFamilies === 1 ? "y" : "ies"}
            </span>
            <Link
              href={`/activity/${slug}`}
              className="text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
            >
              View activity listing →
            </Link>
          </div>
        </section>

        {/* Schedule (Upcoming) */}
        <section aria-labelledby="club-schedule">
          <div className="flex items-center justify-between">
            <h2
              id="club-schedule"
              className="font-display text-lg font-bold text-ink mb-2"
            >
              Upcoming events
            </h2>
            <Link
              href={`/clubs/${slug}/events`}
              className="flex items-center gap-0.5 text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <ClubEventCard
                  key={event.id}
                  event={event}
                  memberFamilies={stats.memberFamilies}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-6 text-center">
              <CalendarDays
                className="mx-auto h-6 w-6 text-ink-faint"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium text-ink-soft">
                No upcoming events yet
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                Check the full schedule for past sessions and more.
              </p>
            </div>
          )}
        </section>

        {/* Reviews — parent social proof on the canonical provider page */}
        <section aria-labelledby="club-reviews">
          <ReviewSection providerId={provider.id} />
        </section>
      </div>

      {/* ── Community sidebar ── */}
      <aside className="space-y-6">
        {/* Community panel */}
        <section
          aria-labelledby="club-community"
          className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
        >
          <h2
            id="club-community"
            className="font-display flex items-center gap-2 text-sm font-bold text-ink"
          >
            <Users className="h-4 w-4 text-ilali-500" aria-hidden="true" />
            Community
          </h2>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {stats.memberFamilies}
          </p>
          <p className="text-xs text-ink-faint">
            member famil{stats.memberFamilies === 1 ? "y" : "ies"} in this club
          </p>

          {stats.familiesBySuburb.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Families by suburb
              </p>
              {stats.familiesBySuburb.slice(0, 4).map((row) => (
                <div key={row.suburb} className="flex items-center gap-2">
                  <Home
                    className="h-3.5 w-3.5 text-ink-faint"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-ink-soft">{row.suburb}</span>
                  <span className="ml-auto text-xs font-semibold text-ink-faint">
                    {row.count} famil{row.count === 1 ? "y" : "ies"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/clubs/${slug}/members`}
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
          >
            Meet the members
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>

        {/* Trust & Safety */}
        <section
          aria-labelledby="club-trust"
          className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
        >
          <h2
            id="club-trust"
            className="font-display flex items-center gap-2 text-sm font-bold text-ink"
          >
            🛡️ Trust & Safety
          </h2>
          <div className="mt-3">
            <Suspense fallback={null}>
              <VerificationBadge providerId={provider.id} />
            </Suspense>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            {tierExplanation[tier] ?? tierExplanation.listed}
          </p>
          <Link
            href="/safeguarding"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
          >
            Our safeguarding promise
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>

        {/* Join club */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <JoinClubButton
            clubSlug={slug}
            invitedBy={invitedBy}
          />
        </section>

        {/* Contact — WhatsApp quick chat (parent win: one-tap contact) */}
        {provider.phone && (
          <section
            aria-labelledby="club-contact"
            className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
          >
            <h2
              id="club-contact"
              className="font-display flex items-center gap-2 text-sm font-bold text-ink"
            >
              <MessageCircle className="h-4 w-4 text-ilali-500" aria-hidden="true" />
              Contact this club
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Questions about sessions or availability? Chat directly with the
              club on WhatsApp.
            </p>
            <div className="mt-3">
              <ContactButton
                providerId={provider.id}
                providerName={provider.name}
                phone={provider.phone}
                className="w-full"
              />
            </div>
          </section>
        )}

        {/* Save & follow — intent capture at the moment of interest */}
        <section
          aria-labelledby="club-save"
          className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
        >
          <h2
            id="club-save"
            className="font-display flex items-center gap-2 text-sm font-bold text-ink"
          >
            <Heart className="h-4 w-4 text-ilali-500" aria-hidden="true" />
            Save &amp; follow
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Keep this club in your saved list, or get a heads-up the moment
            booking opens. No account needed to get started.
          </p>
          <div className="mt-4 grid gap-2">
            <SaveButton
              providerId={provider.id}
              providerName={provider.name}
              className="w-full"
            />
            <NotifyButton
              providerId={provider.id}
              providerName={provider.name}
              className="w-full"
            />
          </div>
        </section>

        {/* Booking status — online booking arrives with WS-6 Paystack */}
        <section aria-labelledby="club-booking">
          <ComingSoon
            title="Online booking"
            description={
              provider.phone
                ? "Book and pay online soon. For now, chat with the club on WhatsApp to reserve your spot."
                : "Book and pay online soon. Reach out to the club directly to reserve your spot."
            }
            icon="📅"
          />
        </section>

        {/* Welcome card */}
        <Suspense fallback={null}>
          <WelcomeCard
            clubName={provider.name}
            memberNumber={null}
            memberCount={stats.memberFamilies}
            clubSlug={slug}
          />
        </Suspense>

        {/* Rewards teaser — top volunteers */}
        <section
          aria-labelledby="club-volunteers"
          className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
        >
          <h2
            id="club-volunteers"
            className="font-display flex items-center gap-2 text-sm font-bold text-ink"
          >
            <Trophy className="h-4 w-4 text-sunset-500" aria-hidden="true" />
            Top volunteers
          </h2>
          {stats.topVolunteers.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {stats.topVolunteers.slice(0, 4).map((v) => (
                <li key={v.parentId} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal/10 text-sm font-bold text-ilali-700">
                    {(v.parentName ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {v.parentName ?? "Club volunteer"}
                    </p>
                    <RoleBadge role={v.role} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Be the first volunteer — earn points every season.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-faint">
            Volunteers earn rewards for helping the club run.
          </p>
        </section>

        {/* Ride requests — interactive lift club (Task 5) */}
        <RideRequest
          providerId={provider.id}
          events={events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime.toISOString(),
          }))}
        />
      </aside>
    </div>

    {/* You might also like — similar providers by tag overlap */}
    {similarProviders.length > 0 && (
      <section aria-labelledby="similar-providers" className="mt-14">
        <h2
          id="similar-providers"
          className="font-display text-lg font-bold text-ink mb-2"
        >
          You might also like
        </h2>
        <p className="text-sm text-ink-soft mb-6">
          Other clubs parents with similar interests are exploring.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {similarProviders.map((similar, idx) => (
            <ProviderCard
              key={similar.id}
              provider={similar}
              accentColor={
                ["teal", "gold", "purple", "orange"][idx % 4] as
                  | "teal"
                  | "gold"
                  | "purple"
                  | "orange"
              }
              verificationBadge={
                <Suspense fallback={null}>
                  <VerificationBadge providerId={similar.id} />
                </Suspense>
              }
            />
          ))}
        </div>
      </section>
    )}
    </>
  );
}
