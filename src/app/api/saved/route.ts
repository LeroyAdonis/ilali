import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { savedActivities, providers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendNotification } from "@/lib/notifications";
import { appUrl } from "@/lib/mail";

export const dynamic = "force-dynamic";

// ── Shared helpers ──

async function requireUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// ── GET /api/saved ──
// List the signed-in parent's saved activities with provider details.
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to view saved activities" }, { status: 401 });
    }

    const rows = await db
      .select({
        id: savedActivities.id,
        notifyWhenOpen: savedActivities.notifyWhenOpen,
        createdAt: savedActivities.createdAt,
        provider: {
          id: providers.id,
          name: providers.name,
          slug: providers.slug,
          category: providers.category,
          location: providers.location,
          imageUrl: providers.imageUrl,
          priceValue: providers.priceValue,
          priceLabel: providers.priceLabel,
          rating: providers.rating,
          reviewCount: providers.reviewCount,
        },
      })
      .from(savedActivities)
      .innerJoin(providers, eq(savedActivities.providerId, providers.id))
      .where(eq(savedActivities.parentId, user.id))
      .orderBy(savedActivities.createdAt);

    return NextResponse.json({ saved: rows, ids: rows.map((r) => r.provider.id) });
  } catch (error) {
    console.error("[saved] GET error:", error);
    return NextResponse.json({ error: "Failed to load saved activities" }, { status: 500 });
  }
}

// ── POST /api/saved ──
// Upsert a save. Idempotent — repeating a save (e.g. after completing a
// magic link from a guest intent) is a no-op thanks to the unique
// (parentId, providerId) constraint.
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to save activities" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    if (!b.providerId || typeof b.providerId !== "string" || !isUuid(b.providerId)) {
      return NextResponse.json({ error: "providerId is required and must be a valid UUID" }, { status: 400 });
    }

    const hasNotifyFlag = b.notifyWhenOpen !== undefined;
    const notifyWhenOpen = b.notifyWhenOpen === true;

    const [provider] = await db
      .select({ id: providers.id, name: providers.name, slug: providers.slug })
      .from(providers)
      .where(eq(providers.id, b.providerId))
      .limit(1);

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const insert = db.insert(savedActivities).values({
      parentId: user.id,
      providerId: provider.id,
      notifyWhenOpen,
    });

    // A plain save must NOT clobber an existing "notify me" intent; only
    // touch notifyWhenOpen when the request explicitly carries it.
    if (hasNotifyFlag) {
      await insert.onConflictDoUpdate({
        target: [savedActivities.parentId, savedActivities.providerId],
        set: { notifyWhenOpen },
      });
    } else {
      await insert.onConflictDoNothing({
        target: [savedActivities.parentId, savedActivities.providerId],
      });
    }

    // Painless Journeys FR-6: "notify me when booking opens" → fire the
    // `saved` notification right away so the parent knows we've got them.
    // The sendNotification service never throws, so a notification problem
    // can never fail the save itself.
    if (hasNotifyFlag && notifyWhenOpen) {
      const activityName = provider.name;
      // Don't block the save POST on email round-trips — fire and log.
      void sendNotification(user.id, "saved", {
        providerName: activityName,
        activityName,
        link: `${appUrl()}/activity/${provider.slug}`,
      }).then((r) => {
        if (r.status === "failed") console.warn(`[saved] notify-me send failed: ${r.reason}`);
      });
    }

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[saved] POST error:", error);
    return NextResponse.json({ error: "Failed to save activity" }, { status: 500 });
  }
}

// ── DELETE /api/saved ──
// Remove a save. Accepts providerId as a query param or JSON body.
export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ error: "You must be signed in to remove saved activities" }, { status: 401 });
    }

    const url = new URL(request.url);
    let providerId = url.searchParams.get("providerId");

    if (!providerId) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        // no body — fall through
      }
      providerId = (body as Record<string, unknown>)?.providerId as string | null;
    }

    if (!providerId || typeof providerId !== "string" || !isUuid(providerId)) {
      return NextResponse.json({ error: "providerId is required and must be a valid UUID" }, { status: 400 });
    }

    await db
      .delete(savedActivities)
      .where(and(eq(savedActivities.parentId, user.id), eq(savedActivities.providerId, providerId)));

    return NextResponse.json({ saved: false });
  } catch (error) {
    console.error("[saved] DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove saved activity" }, { status: 500 });
  }
}
