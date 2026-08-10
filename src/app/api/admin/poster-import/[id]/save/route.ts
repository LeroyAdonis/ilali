import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { posterImports, providerApplications } from "@/lib/db/schema";

export const runtime = "nodejs";

export interface PosterFinalFields {
  name: string;
  activityType: string;
  description?: string;
  location?: string;
  ageMin?: number;
  ageMax?: number;
  priceValue?: number;
  phone?: string;
  email?: string;
  imageUrl?: string;
  venue?: string;
  address?: string;
  dateStart?: string;
  dateEnd?: string;
  timeStart?: string;
  timeEnd?: string;
  dayOfWeek?: string;
  contactName?: string;
  bookingInfo?: string;
  additionalInfo?: string;
  logoPath?: string;
}

/**
 * POST /api/admin/poster-import/[id]/save
 * Body: { fields: PosterFinalFields } — human-approved final fields.
 * Creates a providerApplications row (onboardSource='poster'), links it to the
 * poster import, and moves the import to 'saved'.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request as Parameters<typeof requireAdmin>[0]);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;

  let body: { fields?: PosterFinalFields };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const f = body.fields;
  if (!f || !f.name?.trim() || !f.activityType?.trim()) {
    return NextResponse.json(
      { error: "Name and activity type are required." },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(posterImports)
    .where(eq(posterImports.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Poster import not found." }, { status: 404 });
  }

  const poster = rows[0];
  if (poster.applicationId) {
    return NextResponse.json(
      { error: "This poster import already has a saved application." },
      { status: 409 }
    );
  }

  // Email is NOT NULL in providerApplications — poster flow uses a placeholder
  // (same established pattern as WS-3 provider accounts), admin can update later.
  const email =
    f.email?.trim() || `poster-${poster.id.slice(0, 8)}@ilali.co`;

  const inserted = await db
    .insert(providerApplications)
    .values({
      name: f.name.trim(),
      email,
      phone: f.phone?.trim() || null,
      activityType: f.activityType.trim(),
      description: f.description?.trim() || null,
      location: f.location?.trim() || null,
      ageMin: typeof f.ageMin === "number" ? f.ageMin : null,
      ageMax: typeof f.ageMax === "number" ? f.ageMax : null,
      priceValue: typeof f.priceValue === "number" ? f.priceValue : null,
      venue: f.venue?.trim() || null,
      address: f.address?.trim() || null,
      dateStart: f.dateStart?.trim() || null,
      dateEnd: f.dateEnd?.trim() || null,
      timeStart: f.timeStart?.trim() || null,
      timeEnd: f.timeEnd?.trim() || null,
      dayOfWeek: f.dayOfWeek?.trim() || null,
      contactName: f.contactName?.trim() || null,
      bookingInfo: f.bookingInfo?.trim() || null,
      additionalInfo: f.additionalInfo?.trim() || null,
      logoPath: f.logoPath || null,
      imageUrl: f.imageUrl || poster.imagePath,
      status: "pending",
      onboardSource: "poster",
    })
    .returning();

  const application = inserted[0];

  await db
    .update(posterImports)
    .set({
      finalJson: JSON.parse(JSON.stringify(f)),
      status: "saved",
      applicationId: application.id,
    })
    .where(eq(posterImports.id, id));

  return NextResponse.json({
    applicationId: application.id,
    status: "saved",
  });
}
