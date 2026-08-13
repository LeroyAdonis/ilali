import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { users, notificationPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

// ── Zod Schema ──

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  suburb: z.string().min(1).optional(),
  notifyNewProviders: z.boolean().optional(),
  notifyCommunity: z.boolean().optional(),
  notifyRewards: z.boolean().optional(),
  notifyBookings: z.boolean().optional(),
  notifyReminders: z.boolean().optional(),
  notifyDigest: z.boolean().optional(),
});

// ── PATCH Handler ──

export async function PATCH(request: Request) {
  try {
    // 1. Validate session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parseResult = updateProfileSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const {
      name,
      suburb,
      notifyNewProviders,
      notifyCommunity,
      notifyRewards,
      notifyBookings,
      notifyReminders,
      notifyDigest,
    } = parseResult.data;

    // 3. Update user record if name or suburb provided
    if (name !== undefined || suburb !== undefined) {
      const userUpdate: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (name !== undefined) userUpdate.name = name.trim();
      if (suburb !== undefined) userUpdate.suburb = suburb.trim();

      await db.update(users).set(userUpdate).where(eq(users.id, userId));
    }

    // 4. Upsert notification preferences if any provided
    const hasNotifUpdates =
      notifyNewProviders !== undefined ||
      notifyCommunity !== undefined ||
      notifyRewards !== undefined ||
      notifyBookings !== undefined ||
      notifyReminders !== undefined ||
      notifyDigest !== undefined;

    if (hasNotifUpdates) {
      await db
        .insert(notificationPreferences)
        .values({
          userId,
          ...(notifyNewProviders !== undefined && { notifyNewProviders }),
          ...(notifyCommunity !== undefined && { notifyCommunity }),
          ...(notifyRewards !== undefined && { notifyRewards }),
          ...(notifyBookings !== undefined && { notifyBookings }),
          ...(notifyReminders !== undefined && { notifyReminders }),
          ...(notifyDigest !== undefined && { notifyDigest }),
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            ...(notifyNewProviders !== undefined && { notifyNewProviders }),
            ...(notifyCommunity !== undefined && { notifyCommunity }),
            ...(notifyRewards !== undefined && { notifyRewards }),
            ...(notifyBookings !== undefined && { notifyBookings }),
            ...(notifyReminders !== undefined && { notifyReminders }),
            ...(notifyDigest !== undefined && { notifyDigest }),
          },
        });
    }

    // 5. Fetch and return updated profile
    const [updatedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        suburb: users.suburb,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    let prefs = null;
    try {
      const [prefsRow] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);
      if (prefsRow) {
        prefs = {
          notifyNewProviders: prefsRow.notifyNewProviders,
          notifyCommunity: prefsRow.notifyCommunity,
          notifyRewards: prefsRow.notifyRewards,
          notifyBookings: prefsRow.notifyBookings,
          notifyReminders: prefsRow.notifyReminders,
          notifyDigest: prefsRow.notifyDigest,
        };
      }
    } catch {
      // Preferences may not exist yet — that's fine
    }

    return NextResponse.json({
      ...updatedUser,
      createdAt: updatedUser?.createdAt ?? new Date(),
      updatedAt: updatedUser?.updatedAt ?? new Date(),
      preferences: prefs ?? {
        notifyNewProviders: notifyNewProviders ?? true,
        notifyCommunity: notifyCommunity ?? true,
        notifyRewards: notifyRewards ?? true,
        notifyBookings: notifyBookings ?? true,
        notifyReminders: notifyReminders ?? true,
        notifyDigest: notifyDigest ?? true,
      },
    });
  } catch (error) {
    console.error("[profile] PATCH error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
