import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { posterImports } from "@/lib/db/schema";
import { extractPoster } from "@/lib/ai/extract-poster";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/admin/poster-import
 * Multipart: file (poster image).
 * Stores the image (base64 data URL — admin-internal, no blob infra needed),
 * runs vision extraction inline, returns the poster import + extracted fields.
 */
export async function POST(request: Request) {
  let session: { user?: { id?: string } };
  try {
    session = await requireAdmin(request as Parameters<typeof requireAdmin>[0]);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type — upload a JPG, PNG or WebP image." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image too large — max 10MB." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let base64: string;
  try {
    base64 = Buffer.from(bytes).toString("base64");
  } catch {
    return NextResponse.json({ error: "Could not read image data." }, { status: 500 });
  }
  const dataUrl = `data:${file.type};base64,${base64}`;

  const inserted = await db
    .insert(posterImports)
    .values({
      imagePath: dataUrl,
      status: "extracting",
      createdBy: session.user?.id ?? null,
    })
    .returning();

  const posterImport = inserted[0];

  const extracted = await extractPoster(dataUrl);

  const finalStatus = extracted ? "needs_review" : "extraction_failed";

  await db
    .update(posterImports)
    .set({
      extractedJson: extracted ? JSON.parse(JSON.stringify(extracted)) : null,
      status: finalStatus,
    })
    .where(eq(posterImports.id, posterImport.id));

  if (!extracted) {
    return NextResponse.json({
      posterImportId: posterImport.id,
      status: "extraction_failed",
      message:
        "AI extraction is unavailable right now — you can still fill in the profile manually.",
    });
  }

  return NextResponse.json({
    posterImportId: posterImport.id,
    status: "needs_review",
    extracted,
  });
}
