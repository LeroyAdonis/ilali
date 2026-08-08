/**
 * WS-7: Web enrichment — given a provider/activity name, search the web and
 * return suggested fields to fill gaps the poster left blank.
 *
 * Backend is swappable via WEB_SEARCH_PROVIDER env:
 *   - "jina" (default): DuckDuckGo HTML search through Jina Reader (r.jina.ai),
 *     zero API key, mirrors the agent-reach skill approach.
 *   - "webclaw": future — point at zahra webclaw instance for bot-protected pages.
 *   - "serper": future — SERPER_API_KEY for paid, more reliable search.
 *
 * Suggested fields are ALWAYS human-verified in the UI — never silently merged.
 */
import { chat } from "@/lib/ai/client";

export interface EnrichmentSuggestion {
  field: string; // e.g. "website", "instagram", "facebook", "description", "phone", "priceValue"
  value: string;
  sourceUrl: string;
}

const JINA_SEARCH = (q: string) =>
  `https://r.jina.ai/https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;

const TIMEOUT_MS = 20000;

/** Extract result links from a DDG HTML (via Jina) response. */
function parseDdgLinks(markdown: string, limit = 5): string[] {
  const urls: string[] = [];
  // DDG HTML result links look like: [Title](https://duckduckgo.com/l/?uddg=ENCODED_URL&rut=...)
  const re = /\]\(https:\/\/duckduckgo\.com\/l\/\?uddg=([^&)]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null && urls.length < limit) {
    try {
      urls.push(decodeURIComponent(m[1]));
    } catch {
      // skip malformed
    }
  }
  return urls;
}

async function searchDdg(query: string): Promise<string[]> {
  const res = await fetch(JINA_SEARCH(query), {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const text = await res.text();
  return parseDdgLinks(text);
}

/** Fetch a page as markdown via Jina Reader. */
async function readPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/**
 * Enrich a provider profile from public web sources.
 * Returns suggestions that the admin accepts/rejects individually.
 */
export async function enrichProvider(
  name: string,
  category?: string,
  location?: string
): Promise<EnrichmentSuggestion[]> {
  const query = [name, category, location, "Cape Town kids activities"]
    .filter(Boolean)
    .join(" ");

  const urls = await searchDdg(query);
  if (urls.length === 0) {
    console.warn("[enrich] no results for:", query);
    return [];
  }

  // Read the top 3 pages (limit cost; each is a Jina fetch).
  const pages: string[] = [];
  for (const url of urls.slice(0, 3)) {
    const text = await readPage(url);
    if (text) pages.push(`SOURCE: ${url}\n${text.slice(0, 3000)}`);
    if (pages.length >= 3) break;
  }

  if (pages.length === 0) return [];

  const systemPrompt = `You enrich a children's activity provider profile using web search results.
Given the provider name and the source pages below, extract VERIFIED facts only.
Return ONLY valid JSON, no other text, no markdown.

Output format (array):
[
  {
    "field": "website | instagram | facebook | phone | description | priceValue",
    "value": "the found value",
    "sourceUrl": "the source URL it came from"
  }
]

Rules:
- Only include facts actually present in the source text — never invent
- website: full URL; instagram/facebook: handle or page URL
- phone: normalise to +27XXXXXXXXX
- description: only if source has a clear description of the activity
- priceValue: only if a price is stated (in Rands)
- Max 6 suggestions. If nothing verifiable, return []`;

  const content = await chat({
    systemPrompt,
    userMessage: `Provider name: ${name}\n\n--- SOURCE PAGES ---\n${pages.join("\n\n---\n\n")}`,
    temperature: 0.1,
    maxTokens: 800,
    timeoutMs: TIMEOUT_MS,
    responseFormat: "json",
  });

  if (!content) return [];

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Array<{
      field?: string;
      value?: string;
      sourceUrl?: string;
    }>;

    if (!Array.isArray(parsed)) return [];

    const allowed = new Set([
      "website", "instagram", "facebook", "phone", "description", "priceValue",
    ]);

    return parsed
      .filter((s) => s.field && allowed.has(s.field) && typeof s.value === "string" && s.value.length > 0)
      .map((s) => ({
        field: s.field as string,
        value: s.value as string,
        sourceUrl: typeof s.sourceUrl === "string" ? s.sourceUrl : "",
      }))
      .slice(0, 6);
  } catch {
    console.warn("[enrich] Failed to parse AI response");
    return [];
  }
}
