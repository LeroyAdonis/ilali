import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { posterImports } from "@/lib/db/schema";

export const runtime = "nodejs";

/**
 * GET /api/admin/poster-imports
 * Lists recent poster imports (newest first) for the admin page.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request as Parameters<typeof requireAdmin>[0]);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const imports = await db
    .select({
      id: posterImports.id,
      status: posterImports.status,
      contactedAt: posterImports.contactedAt,
      outreachMethod: posterImports.outreachMethod,
      applicationId: posterImports.applicationId,
      createdAt: posterImports.createdAt,
      extractedJson: posterImports.extractedJson,
    })
    .from(posterImports)
    .orderBy(desc(posterImports.createdAt))
    .limit(50);

  return NextResponse.json(imports);
}
