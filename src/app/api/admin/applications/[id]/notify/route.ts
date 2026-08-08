import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications, posterImports } from "@/lib/db/schema";
import { sendWhatsApp } from "@/lib/outreach/send-whatsapp";
import { renderStoredTemplate } from "@/lib/outreach/templates";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://ilali.vercel.app";

/**
 * POST /api/admin/applications/[id]/notify
 * Body: { method?: "wa-me" | "email-draft" } (defaults to auto/wa-me)
 * Renders the outreach template and either returns a pre-filled wa.me link
 * (semi-auto, human hits send) or, when WHATSAPP_AUTO_SEND=true, calls the
 * Business API path. Idempotent — already-contacted returns the same link.
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
    .from(providerApplications)
    .where(eq(providerApplications.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const app = rows[0];

  let body: { method?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — default method
  }

  const vars = {
    providerName: app.name || "",
    activityName: app.activityType || "activity",
    claimUrl: `${SITE_URL}/providers/claim`,
    claimCode: "",
  };

  // Email draft: return the rendered copy for manual use.
  if (body.method === "email-draft") {
    const subject = await renderStoredTemplate("email-subject", vars);
    const emailBody = await renderStoredTemplate("email-body", vars);
    return NextResponse.json({ method: "email-draft", subject, body: emailBody });
  }

  // WhatsApp path (default).
  if (!app.phone) {
    return NextResponse.json(
      {
        error: "No phone number on this application — use the email draft instead.",
        method: "email-draft",
      },
      { status: 400 }
    );
  }

  const result = await sendWhatsApp({
    phone: app.phone,
    vars,
  });

  // Mark contacted (idempotent — only set once).
  const poster = app.onboardSource === "poster"
    ? await db
        .select()
        .from(posterImports)
        .where(eq(posterImports.applicationId, id))
        .limit(1)
    : [];

  if (poster.length > 0 && !poster[0].contactedAt) {
    await db
      .update(posterImports)
      .set({
        contactedAt: new Date(),
        outreachMethod: result.mode === "api" ? "whatsapp-api" : "wa-me",
      })
      .where(eq(posterImports.id, poster[0].id));
  }

  if (result.mode === "api") {
    if (result.status === "not-configured") {
      return NextResponse.json(
        { error: "WhatsApp auto-send is enabled but not configured yet." },
        { status: 500 }
      );
    }
    return NextResponse.json({ method: "whatsapp-api", status: "sent" });
  }

  return NextResponse.json({ method: "wa-me", waUrl: result.waUrl });
}
