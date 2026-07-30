import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/client";

export async function POST(request: Request) {
  let body: { query: string; availableCategories: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query, availableCategories } = body;

  if (!query?.trim() || !availableCategories?.length) {
    return NextResponse.json({ error: "query and availableCategories required" }, { status: 400 });
  }

  const cats = availableCategories.join(", ");

  const systemPrompt = `You help parents find children's activities on a marketplace called ILALI in Cape Town.
When a parent searches for something we don't have, suggest the closest alternatives from what IS available.

Return ONLY valid JSON:
{
  "message": "string — warm, helpful 1-2 sentence message",
  "suggestedCategories": ["string"] — 2-4 category names from the available list
}

Rules:
- Be warm and family-friendly. Use South African English.
- The message should say something like: "We don't have X yet, but here are similar activities we do have..."
- Only suggest categories from the available list below
- If the parent searched for something generic like "sports" and we DO have Sports, don't apologize — just point them there`;

  const content = await chat({
    systemPrompt,
    userMessage: `Parent searched: "${query}"\n\nAvailable categories: ${cats}\n\nSuggest alternatives.`,
    temperature: 0.3,
    maxTokens: 250,
    timeoutMs: 4000,
  });

  if (!content) {
    return NextResponse.json({
      message: "Try browsing our categories to find something your child will love!",
      suggestedCategories: availableCategories.slice(0, 3),
    });
  }

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json({
      message: result.message || "Here are some activities your child might enjoy:",
      suggestedCategories: Array.isArray(result.suggestedCategories)
        ? result.suggestedCategories.filter((c: string) => availableCategories.includes(c)).slice(0, 4)
        : availableCategories.slice(0, 3),
    });
  } catch {
    return NextResponse.json({
      message: "Try browsing our categories to find something your child will love!",
      suggestedCategories: availableCategories.slice(0, 3),
    });
  }
}
