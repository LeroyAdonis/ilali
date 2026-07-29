import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
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

  const providerList = await db.select().from(providers);
  return NextResponse.json(providerList);
}

export async function POST(request: NextRequest) {
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

  const body = await request.json();

  const slug = slugify(body.name || "");

  const [provider] = await db
    .insert(providers)
    .values({
      name: body.name,
      slug,
      category: body.category,
      description: body.description || "",
      providerName: body.providerName || body.name,
      location: body.location,
      ageMin: body.ageMin || 0,
      ageMax: body.ageMax || 0,
      priceValue: Math.round((body.priceValue || 0) * 100), // Convert rands to cents
      priceLabel: body.priceLabel || "per session",
      imageUrl: body.imageUrl || null,
      phone: body.phone || null,
      tags: body.tags || null,
      verified: body.verified || false,
      featured: body.featured || false,
    })
    .returning();

  return NextResponse.json(provider, { status: 201 });
}
