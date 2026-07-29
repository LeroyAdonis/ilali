import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["pending", "contacted", "approved", "rejected"];

// Valid transitions: pending→contacted→approved, pending→contacted→rejected
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["contacted"],
  contacted: ["approved", "rejected"],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth gate
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const newStatus = formData.get("status") as string;

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  // Fetch current application
  const [application] = await db
    .select()
    .from(providerApplications)
    .where(eq(providerApplications.id, id));

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  const currentStatus = application.status || "pending";

  // Validate transition
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${allowedNext?.join(", ") || "none"}`,
      },
      { status: 400 }
    );
  }

  // Update status
  const [updated] = await db
    .update(providerApplications)
    .set({ status: newStatus })
    .where(eq(providerApplications.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth gate
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const newStatus = body.status;

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const [application] = await db
    .select()
    .from(providerApplications)
    .where(eq(providerApplications.id, id));

  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  const currentStatus = application.status || "pending";
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(providerApplications)
    .set({ status: newStatus })
    .where(eq(providerApplications.id, id))
    .returning();

  return NextResponse.json(updated);
}
