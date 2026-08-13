import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { Heart, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { savedActivities, providers, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import VerificationBadge from "@/components/verification/VerificationBadge";
import { mapProvider } from "@/lib/db/mappers";

export const metadata: Metadata = {
  title: "Saved activities | ILALI",
  description: "Your saved activities — pick up where you left off.",
};

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}

export default async function SavedPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // ── Guests: a short, friendly sign-in prompt (browsing never requires auth) ──
  if (!session) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ilali-50">
            <Heart className="h-7 w-7 text-ilali-600" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Your saved activities</h1>
          <p className="mt-2 text-sm text-ink-faint">
            Sign in with a magic link to see everything you&apos;ve saved — no password
            needed.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
          >
            Sign in with a magic link
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Signed in: list saved activities with provider details ──
  const [rows, categoryRows] = await Promise.all([
    db
      .select()
      .from(savedActivities)
      .innerJoin(providers, eq(savedActivities.providerId, providers.id))
      .where(eq(savedActivities.parentId, session.user.id))
      .orderBy(savedActivities.createdAt),
    db.select({ id: categories.id, name: categories.name }).from(categories),
  ]);

  const savedProviders = rows.map((row) => mapProvider(row.providers, categoryRows));

  return (
    <PageShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Saved activities
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            {savedProviders.length > 0
              ? `${savedProviders.length} saved — tap the heart to remove, or open one to pick up where you left off.`
              : "Pick up where you left off."}
          </p>
        </div>
        <Link
          href="/home"
          className="text-xs font-semibold text-ilali-600 hover:text-ilali-700 transition-colors"
        >
          Manage children &amp; profile →
        </Link>
      </div>

      {savedProviders.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedProviders.map((provider, idx) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              accentColor={["teal", "gold", "purple", "orange"][idx % 4] as
                | "teal"
                | "gold"
                | "purple"
                | "orange"}
              verificationBadge={
                <Suspense fallback={null}>
                  <VerificationBadge providerId={provider.id} />
                </Suspense>
              }
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-ink/10 bg-paper-warm p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white">
            <Search className="h-7 w-7 text-ink-faint" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-bold text-ink">Nothing saved yet</h2>
          <p className="mt-2 text-sm text-ink-faint">
            Tap the heart on any activity to keep it here — even as a guest, and
            it&apos;ll sync to your account when you sign in.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
          >
            Browse activities
          </Link>
        </div>
      )}
    </PageShell>
  );
}
