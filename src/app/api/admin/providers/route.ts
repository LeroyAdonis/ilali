import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
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

export const GET = withAdmin(async () => {
  const providerList = await db.select().from(providers);
  return NextResponse.json(providerList);
});

export const POST = withAdmin(async (request: NextRequest) => {
  const body = await request.json();

  const result = adminProviderSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = result.data;
  const slug = slugify(data.name);

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
      priceValue: Math.round(data.priceValue * 100),
      priceLabel: data.priceLabel || "per session",
      imageUrl: data.imageUrl || null,
      phone: data.phone || null,
      tags: data.tags || null,
      verified: data.verified || false,
      featured: data.featured || false,
    })
    .returning();

  return NextResponse.json(provider, { status: 201 });
});
