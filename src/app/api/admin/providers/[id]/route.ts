import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const PATCH = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(providers)
    .set({
      ...(body.name && { name: body.name }),
      ...(body.category && { category: body.category }),
      ...(body.description && { description: body.description }),
      ...(body.location && { location: body.location }),
      ...(body.ageMin != null && { ageMin: body.ageMin }),
      ...(body.ageMax != null && { ageMax: body.ageMax }),
      ...(body.priceValue != null && { priceValue: Math.round(body.priceValue * 100) }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.verified !== undefined && { verified: body.verified }),
      ...(body.featured !== undefined && { featured: body.featured }),
    })
    .where(eq(providers.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
});

export const DELETE = withAdmin(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const [deleted] = await db.delete(providers).where(eq(providers.id, id)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});

export const POST = withAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (formData.get("_method") === "DELETE") {
    const [deleted] = await db.delete(providers).where(eq(providers.id, id)).returning();
    if (!deleted) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
    return NextResponse.redirect(new URL("/admin/providers", request.url));
  }
  return NextResponse.json({ error: "Unknown method" }, { status: 400 });
});
