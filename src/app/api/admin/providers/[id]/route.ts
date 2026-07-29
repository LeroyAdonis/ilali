import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.providerName !== undefined) updateData.providerName = body.providerName;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.ageMin !== undefined) updateData.ageMin = body.ageMin;
  if (body.ageMax !== undefined) updateData.ageMax = body.ageMax;
  if (body.priceValue !== undefined) updateData.priceValue = body.priceValue;
  if (body.priceLabel !== undefined) updateData.priceLabel = body.priceLabel;
  if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.verified !== undefined) updateData.verified = body.verified;
  if (body.featured !== undefined) updateData.featured = body.featured;

  const [updated] = await db
    .update(providers)
    .set(updateData)
    .where(eq(providers.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Provider not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}
