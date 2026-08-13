import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { childProfiles, notificationPreferences } from "@/lib/db/schema";

// ── Types ──

interface ChildInput {
  name: string;
  age: number;
  interests?: string[];
  suburb?: string | null;
  availability?: {
    days: string[];
    timeSlots: string[];
  } | null;
}

interface NotificationPrefs {
  notifyNewProviders: boolean;
  notifyCommunity: boolean;
  notifyRewards: boolean;
}

interface OnboardingBody {
  children: ChildInput[];
  preferences: NotificationPrefs;
}

// ── Validation ──

const VALID_INTERESTS = new Set([
  "Soccer",
  "Swimming",
  "Art",
  "Music",
  "Coding",
  "Dance",
  "Drama",
  "Science",
  "Horse Riding",
  "Gymnastics",
  "Cricket",
  "Piano",
  "Guitar",
  "Nature/Outdoors",
  "Maths",
]);

const VALID_DAYS = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

const VALID_TIME_SLOTS = new Set(["Morning", "Afternoon", "Evening"]);

function validateBody(body: unknown): { ok: true; data: OnboardingBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  // Validate children
  if (!Array.isArray(b.children) || b.children.length === 0) {
    return { ok: false, error: "At least one child is required" };
  }

  for (let i = 0; i < b.children.length; i++) {
    const c = b.children[i] as Record<string, unknown>;

    if (!c.name || typeof c.name !== "string" || !c.name.trim()) {
      return { ok: false, error: `Child ${i + 1}: Name is required` };
    }

    if (typeof c.age !== "number" || !Number.isFinite(c.age) || c.age < 1 || c.age > 18) {
      return { ok: false, error: `Child ${i + 1}: Age must be between 1 and 18` };
    }

    if (c.interests !== undefined) {
      if (!Array.isArray(c.interests)) {
        return { ok: false, error: `Child ${i + 1}: Interests must be an array` };
      }
      for (const interest of c.interests) {
        if (typeof interest !== "string" || !VALID_INTERESTS.has(interest)) {
          return { ok: false, error: `Child ${i + 1}: Invalid interest "${interest}"` };
        }
      }
    }

    if (c.availability !== undefined) {
      if (!c.availability || typeof c.availability !== "object") {
        return { ok: false, error: `Child ${i + 1}: Availability must be an object` };
      }
      const avail = c.availability as Record<string, unknown>;
      if (avail.days !== undefined) {
        if (!Array.isArray(avail.days)) {
          return { ok: false, error: `Child ${i + 1}: Availability days must be an array` };
        }
        for (const day of avail.days) {
          if (typeof day !== "string" || !VALID_DAYS.has(day)) {
            return { ok: false, error: `Child ${i + 1}: Invalid day "${day}"` };
          }
        }
      }
      if (avail.timeSlots !== undefined) {
        if (!Array.isArray(avail.timeSlots)) {
          return { ok: false, error: `Child ${i + 1}: Availability timeSlots must be an array` };
        }
        for (const slot of avail.timeSlots) {
          if (typeof slot !== "string" || !VALID_TIME_SLOTS.has(slot)) {
            return { ok: false, error: `Child ${i + 1}: Invalid time slot "${slot}"` };
          }
        }
      }
    }

    if (c.suburb !== undefined && c.suburb !== null && typeof c.suburb !== "string") {
      return { ok: false, error: `Child ${i + 1}: Suburb must be a string` };
    }
  }

  // Validate preferences (all optional, default to true)
  const prefs = (b.preferences as Record<string, unknown>) || {};

  return {
    ok: true,
    data: {
      children: b.children as ChildInput[],
      preferences: {
        notifyNewProviders: typeof prefs.notifyNewProviders === "boolean" ? prefs.notifyNewProviders : true,
        notifyCommunity: typeof prefs.notifyCommunity === "boolean" ? prefs.notifyCommunity : true,
        notifyRewards: typeof prefs.notifyRewards === "boolean" ? prefs.notifyRewards : true,
      },
    },
  };
}

// ── POST Handler ──

export async function POST(request: Request) {
  try {
    // 1. Validate session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to complete onboarding" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validation = validateBody(rawBody);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { children, preferences } = validation.data;

    // 3. Insert in a transaction
    await db.transaction(async (tx) => {
      // Insert child profiles
      for (const child of children) {
        await tx.insert(childProfiles).values({
          parentId: userId,
          name: child.name.trim(),
          age: child.age,
          interests: child.interests && child.interests.length > 0 ? child.interests : null,
          availability: child.availability ?? null,
          suburb: child.suburb || null,
        });
      }

      // Insert notification preferences (upsert — user may redo onboarding)
      await tx
        .insert(notificationPreferences)
        .values({
          userId,
          notifyNewProviders: preferences.notifyNewProviders,
          notifyCommunity: preferences.notifyCommunity,
          notifyRewards: preferences.notifyRewards,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            notifyNewProviders: preferences.notifyNewProviders,
            notifyCommunity: preferences.notifyCommunity,
            notifyRewards: preferences.notifyRewards,
          },
        });
    });

    return NextResponse.json({
      success: true,
      childrenCount: children.length,
    });
  } catch (error) {
    console.error("[onboarding] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
