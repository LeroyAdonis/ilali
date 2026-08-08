import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { posterImports } from "@/lib/db/schema";
import { enrichProvider } from "@/lib/web/enrich";

export const runtime = "nodejs";

/**
 * POST /api/admin/poster-import/[id]/enrich
 * Body: {} — uses the stored extractedJson name/category/location to search the web.
 * Returns suggestions the admin accepts/rejects individually. Idempotent: re-runs
 * fresh each call and replaces enrichmentJson.
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

  const rows = await db
    .select()
    .from(posterImports)
    .where(eq(posterImports.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Poster import not found." }, { status: 404 });
  }

  const poster = rows[0];
  const extracted = poster.extractedJson as
    | { name?: string; category?: string; location?: string }
    | null
    | undefined;

  const name = extracted?.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "No extracted name to search for. Fill the name field first." },
      { status: 400 }
    );
  }

  const suggestions = await enrichProvider(name, extracted?.category, extracted?.location);

  await db
    .update(posterImports)
    .set({ enrichmentJson: suggestions })
    .where(eq(posterImports.id, id));

  return NextResponse.json({ suggestions });
}
