"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Star, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import ProfileWizard from "@/components/provider/ProfileWizard";
import ListingCardPreview from "@/components/provider/ListingCardPreview";
import ActivityStats from "@/components/provider/ActivityStats";
import StatusTracker from "@/components/provider/StatusTracker";
import { mapProvider } from "@/lib/db/mappers";
import { IlaliSpinner } from "@/components/IlaliSpinner";

interface DashboardData {
  provider: Record<string, unknown> | null;
  application: {
    id: string;
    name: string | null;
    status: string | null;
    activityType: string | null;
    location: string | null;
    createdAt: string | null;
  } | null;
  inquiries: unknown[];
  stats: {
    inquiryCount: number;
    memberCount: number;
    eventCount: number;
    reviewCount: number;
  };
  upcomingEvents: Array<{
    id: string;
    title: string;
    eventType: string;
    startTime: string;
    location: string | null;
    endTime: string | null;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    content: string | null;
    createdAt: string;
    userId: string | null;
  }>;
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Auth check — the provider layout gates non-provider roles; here we only
  // bounce guests after showing dashboard context for first-time visitors.
  useEffect(() => {
    if (!sessionLoading && !session) {
      // Don't redirect immediately — let the render show provider context
    }
  }, [session, sessionLoading]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/provider");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace("/auth/signin");
          return;
        }
        throw new Error("Failed to load dashboard data");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!sessionLoading && session) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session?.user?.id, fetchData]);

  const handleWizardSave = useCallback(
    async (fields: Record<string, unknown>) => {
      setSaving(true);
      try {
        const res = await fetch("/api/provider", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Save failed" }));
          throw new Error(err.error || "Save failed");
        }
        // Refresh data after save
        await fetchData();
      } catch (e) {
        throw e; // let the wizard handle it
      } finally {
        setSaving(false);
      }
    },
    [fetchData]
  );

  // Loading state — only spinner while the session resolves OR while a
  // signed-in user's data loads. Signed-out users skip data loading entirely
  // and get the provider-context view (FR-5).
  if (sessionLoading || (loading && session)) {
    return (
      <div className="flex items-center justify-center py-20">
        <IlaliSpinner size="md" />
      </div>
    );
  }

  // Auth gate — show dashboard context for signed-out visitors instead of
  // redirecting straight to sign-in.
  if (!session) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Manage your activity listings
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Track bookings, update your listing, and connect with families — all in one place.
          </p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-ilali-50 p-3">
              <Sparkles className="h-6 w-6 text-ilali-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-ink">
                New here?
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                List your activity for free and reach thousands of Cape Town families. It takes about 5 minutes.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/providers/signup"
                  className="inline-flex min-h-[44px] items-center rounded-lg bg-ilali-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
                >
                  List your activity
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-warm"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-red-50 p-3 mb-4">
          <MessageSquare className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-ink-faint">{error || "Failed to load dashboard"}</p>
        <button
          onClick={fetchData}
          className="mt-4 rounded-full bg-ilali-600 px-5 py-2 text-sm font-semibold text-white hover:bg-ilali-700"
        >
          Try again
        </button>
      </div>
    );
  }

  // ── Pre-live: no providers row yet — show the status tracker ──
  if (!data.provider) {
    const appStatus = data.application?.status ?? null;
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            {appStatus === "draft" || appStatus === null
              ? "Create your listing"
              : "Your listing is on its way"}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Follow the steps below — we&apos;ll email you the moment you go live.
          </p>
        </div>

        <StatusTracker
          status={appStatus}
          providerName={data.application?.name}
        />

        {appStatus === null && (
          <div className="rounded-xl border border-ink/10 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-ilali-50 p-3">
                <Sparkles className="h-6 w-6 text-ilali-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-ink">
                  You haven&apos;t started a listing yet
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Set up your activity in about 5 minutes — it&apos;s free and
                  there&apos;s no pressure until you submit.
                </p>
                <Link
                  href="/providers/signup"
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-ilali-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
                >
                  Start your listing
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { provider: rawProvider, stats, upcomingEvents, recentReviews } = data;
  const categories = [{ id: rawProvider.category as string, name: rawProvider.category as string }];
  const mappedProvider = mapProvider(rawProvider as Parameters<typeof mapProvider>[0], categories);
  const clubEventCount = (upcomingEvents ?? []).length;

  // Stars helper
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-ink/15"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Welcome back, {rawProvider.providerName as string}
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          Here&apos;s how your listing is doing
        </p>
      </div>

      {/* Profile Wizard */}
      <ProfileWizard
        provider={{
          name: rawProvider.name as string,
          category: rawProvider.category as string,
          ageMin: rawProvider.ageMin as number,
          ageMax: rawProvider.ageMax as number,
          priceValue: rawProvider.priceValue as number,
          imageUrl: rawProvider.imageUrl as string | null,
          description: rawProvider.description as string,
          tags: rawProvider.tags as string[] | null,
          priceLabel: rawProvider.priceLabel as string | undefined,
          isFree: rawProvider.isFree as boolean | undefined,
        }}
        clubEventCount={clubEventCount}
        onSave={handleWizardSave}
      />

      {/* Listing Card Preview */}
      <section>
        <ListingCardPreview provider={mappedProvider} />
      </section>

      {/* Activity Stats */}
      <section>
        <ActivityStats
          inquiries={stats.inquiryCount}
          members={stats.memberCount}
          events={stats.eventCount}
          reviews={stats.reviewCount}
        />
      </section>

      {/* Two-column: Events + Reviews */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple" />
              Upcoming Events
            </h2>
            <Link
              href="/provider/events"
              className="text-xs font-medium text-ilali-600 hover:text-ilali-700 flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-ink/10 bg-white p-6 text-center">
              <p className="text-sm text-ink-faint">
                No upcoming events yet. Create your first event to start building
                your community! 🌱
              </p>
              <Link
                href="/provider/events"
                className="mt-3 inline-block rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white hover:bg-ilali-700"
              >
                Create event
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">
                        {event.title}
                      </h3>
                      <p className="text-xs text-ink-faint capitalize">
                        {event.eventType}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-ink-faint whitespace-nowrap">
                      {new Date(event.startTime).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Reviews */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Star className="h-5 w-5 text-gold" />
              Recent Reviews
            </h2>
            <Link
              href="/provider/reviews"
              className="text-xs font-medium text-ilali-600 hover:text-ilali-700 flex items-center gap-1"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <div className="rounded-xl border border-ink/10 bg-white p-6 text-center">
              <p className="text-sm text-ink-faint">
                No reviews yet. Reviews will appear here once parents share their
                experiences. ✨
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentReviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-1">
                    {renderStars(review.rating)}
                    <span className="text-xs text-ink-faint whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {review.content && (
                    <p className="text-sm text-ink-soft line-clamp-3">
                      {review.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
