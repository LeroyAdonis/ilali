import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clubMessages } from "@/lib/db/schema";
import { getClubMessages } from "@/lib/data-source";

export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = 500;
const FETCH_LIMIT = 100;

/**
 * GET /api/clubs/[id]/messages
 * Public read — club pages are public. Returns messages newest-first.
 * Optional ?after=<ISO timestamp> filters to messages created after the
 * given timestamp (used by the polling client for incremental fetches).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const afterParam = request.nextUrl.searchParams.get("after");
  let after: Date | null = null;
  if (afterParam) {
    const parsed = new Date(afterParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid 'after' timestamp — expected an ISO date" },
        { status: 400 }
      );
    }
    after = parsed;
  }

  try {
    const messages = await getClubMessages(id, FETCH_LIMIT);
    const filtered = after
      ? messages.filter(
          (m) => m.createdAt && m.createdAt.getTime() > (after as Date).getTime()
        )
      : messages;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("[club-messages] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load club messages. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clubs/[id]/messages
 * Auth required. Body: { content: string } — 1–500 chars after trimming.
 * Returns the created message (with sender name) for immediate display.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to send a message" },
        { status: 401 }
      );
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const content =
      body && typeof body === "object" && "content" in body
        ? (body as { content: unknown }).content
        : null;

    if (typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    const trimmed = content.trim();
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Message must be ${MAX_CONTENT_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    // Lazy import keeps mock-mode builds from touching DATABASE_URL at module scope
    const { db } = await import("@/lib/db/index");

    const [created] = await db
      .insert(clubMessages)
      .values({
        clubId: id,
        senderId: session.user.id,
        content: trimmed,
      })
      .returning();

    return NextResponse.json({
      ...created,
      senderName: session.user.name ?? "Club member",
    });
  } catch (error) {
    console.error("[club-messages] POST error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
