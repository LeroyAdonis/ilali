import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";
import { adminProviderSchema } from "@/lib/validations";

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

  // Validate with Zod
  const result = adminProviderSchema.safeParse(body);
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Validation failed", fieldErrors },
      { status: 400 }
    );
  }

  const data = result.data;
  const slug = slugify(data.name || "");

  const [provider] = await db
    .insert(providers)
    .values({
      name: data.name,
      slug,
      category: data.category,
      description: data.description,
      providerName: data.providerName || data.name,
      location: data.location,
      ageMin: data.ageMin,
      ageMax: data.ageMax,
      priceValue: Math.round(data.priceValue * 100), // Convert rands to cents
      priceLabel: data.priceLabel || "per session",
      imageUrl: data.imageUrl || null,
      phone: data.phone || null,
      tags: data.tags || null,
      verified: data.verified || false,
      featured: data.featured || false,
    })
    .returning();

  return NextResponse.json(provider, { status: 201 });
}
