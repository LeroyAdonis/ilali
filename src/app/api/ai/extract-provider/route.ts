import { NextResponse } from "next/server";
import { extractProviderDetails } from "@/lib/ai/extract-provider";
import { reportAiFailure } from "@/lib/ai-failure-report";

// AI route — OpenCode primary is slow (12-23s); allow up to 60s.
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { description: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = body.description?.trim();
  if (!description || description.length < 10) {
    return NextResponse.json(
      { error: "Please provide a description of at least 10 characters" },
      { status: 400 }
    );
  }

  const extracted = await extractProviderDetails(description);

  if (!extracted) {
    // ILALI degrades gracefully here, so the parent never sees an error — report it
    // or an AI outage would go completely unnoticed.
    await reportAiFailure({
      feature: "extract-provider",
      errorMessage: "AI returned no extraction for the submitted description",
    });

    return NextResponse.json(
      {
        fallback: true,
        message:
          "AI extraction unavailable right now. You can still fill in the form manually — it only takes a minute.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    fallback: false,
    extracted,
    message: `✨ AI extracted: ${extracted.name || "activity"} ${
      extracted.category ? "(" + extracted.category + ")" : ""
    }`,
  });
}
