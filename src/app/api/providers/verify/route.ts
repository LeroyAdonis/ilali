import { NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { providerVerifications } from "@/lib/db/schema";

// POST /api/providers/verify
// Accepts document upload URLs for provider verification.
// AI review is Phase 2 — for now, we store the documents and mark as pending.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { providerId, documents } = body as {
    providerId?: string;
    documents?: {
      businessReg?: string;
      safeguarding?: string;
      idDoc?: string;
    };
  };

  // Validate required fields
  if (!providerId || typeof providerId !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid providerId" },
      { status: 400 }
    );
  }

  if (!documents || typeof documents !== "object") {
    return NextResponse.json(
      { error: "Missing or invalid documents object" },
      { status: 400 }
    );
  }

  // At least one document URL is required
  const hasDoc =
    documents.businessReg || documents.safeguarding || documents.idDoc;
  if (!hasDoc) {
    return NextResponse.json(
      { error: "At least one document URL is required" },
      { status: 400 }
    );
  }

  try {
    const [verification] = await db
      .insert(providerVerifications)
      .values({
        providerId,
        documentUrls: {
          businessReg: documents.businessReg ?? null,
          safeguarding: documents.safeguarding ?? null,
          idDoc: documents.idDoc ?? null,
        },
        status: "pending",
      })
      .returning();

    return NextResponse.json(
      {
        id: verification.id,
        status: verification.status,
        message:
          "Verification documents submitted successfully. Pending admin review.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[verify] Failed to create verification:", error);
    return NextResponse.json(
      { error: "Failed to submit verification. Please try again." },
      { status: 500 }
    );
  }
}
