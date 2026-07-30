import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["pending", "contacted", "approved", "rejected"];
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["contacted"],
  contacted: ["approved", "rejected"],
};

export const GET = withAdmin(async () => {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(providerApplications.createdAt);
  return NextResponse.json(applications);
});

export const POST = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  // Try formData first (HTML form submissions), fall back to JSON
  let newStatus: string;
  try {
    const formData = await request.formData();
    newStatus = formData.get("status") as string;
  } catch {
    const body = await request.json();
    newStatus = body.status;
  }

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
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const currentStatus = application.status || "pending";
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${currentStatus}" to "${newStatus}"` },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(providerApplications)
    .set({ status: newStatus })
    .where(eq(providerApplications.id, id))
    .returning();

  // Always redirect after POST — all submissions come from HTML forms
  return NextResponse.redirect(new URL("/admin/applications", request.url));
});

export const PATCH = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const currentStatus = application.status || "pending";
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${currentStatus}" to "${newStatus}"` },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(providerApplications)
    .set({ status: newStatus })
    .where(eq(providerApplications.id, id))
    .returning();

  return NextResponse.json(updated);
});
