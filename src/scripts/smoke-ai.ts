// Live smoke test of the new AI chain — real OpenCode serve on zahra.
// Run with: npx tsx src/scripts/smoke-ai.ts  (env from .env.local)
import "dotenv/config";
import { chat, getAIConfig } from "../lib/ai/client";
import { extractIntent } from "../lib/ai/match";

async function main() {
  const cfg = getAIConfig();
  console.log("=== AIConfig ===");
  console.log("opencodeUrl:", cfg.opencodeUrl);
  console.log("opencodeUser:", cfg.opencodeUsername);
  console.log("opencodePass set:", Boolean(cfg.opencodePassword));
  console.log("openRouterKey set:", Boolean(cfg.openRouterKey));

  console.log("\n=== Tier 1: chat() → OpenCode serve ===");
  const started = Date.now();
  const result = await chat({
    systemPrompt:
      "You extract structured search parameters from parent queries about children's activities. Return ONLY valid JSON. Available tags: outdoor, indoor, sport, music, weekend. Output: {\"ageMin\":\"number|null\",\"ageMax\":\"number|null\",\"tags\":[\"string\"],\"location\":\"string|null\",\"priceMax\":\"number|null\"}",
    userMessage: "my 7 year old loves football, under R200, near Sea Point",
    temperature: 0.1,
    maxTokens: 300,
    timeoutMs: 60000,
    responseFormat: "json",
  });
  console.log(`elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log("result:", result);

  console.log("\n=== Tier check: extractIntent (chatWithFallback chain) ===");
  const intent = await extractIntent("my teenager likes drawing, weekends only");
  console.log("intent:", JSON.stringify(intent));
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
