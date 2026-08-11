import { describe, it, expect } from "vitest";
import { extractIntentDeterministic } from "@/lib/ai/deterministic";
import { MATCH_TAGS } from "@/lib/ai/match";

/** All returned tags must be MATCH_TAGS-valid (same contract as the AI path). */
function expectValidTags(tags: string[]): void {
  for (const t of tags) {
    expect(MATCH_TAGS).toContain(t);
  }
}

describe("extractIntentDeterministic — rule-based intent parsing (fast path)", () => {
  it("parses age + activity + suburb: 'football for my 7 year old near Sea Point'", () => {
    const intent = extractIntentDeterministic(
      "football for my 7 year old near Sea Point"
    );
    expect(intent).not.toBeNull();
    expect(intent!.ageMin).toBe(7);
    expect(intent!.ageMax).toBe(7);
    expect(intent!.tags).toEqual(
      expect.arrayContaining(["sport", "outdoor"])
    );
    expect(intent!.location).toBe("Sea Point");
    expectValidTags(intent!.tags);
  });

  it("parses activity + suburb without age: 'swimming in Claremont'", () => {
    const intent = extractIntentDeterministic("swimming in Claremont");
    expect(intent).not.toBeNull();
    expect(intent!.ageMin).toBeUndefined();
    expect(intent!.ageMax).toBeUndefined();
    expect(intent!.tags).toContain("sport");
    expect(intent!.location).toBe("Claremont");
    expectValidTags(intent!.tags);
  });

  it("parses an explicit age range: 'ages 5-10 music'", () => {
    const intent = extractIntentDeterministic("ages 5-10 music");
    expect(intent).not.toBeNull();
    expect(intent!.ageMin).toBe(5);
    expect(intent!.ageMax).toBe(10);
    expect(intent!.tags).toContain("music");
    expectValidTags(intent!.tags);
  });

  it("parses a free price signal: 'free art classes'", () => {
    const intent = extractIntentDeterministic("free art classes");
    expect(intent).not.toBeNull();
    expect(intent!.priceMax).toBe(0);
    expect(intent!.tags).toContain("creative");
    expectValidTags(intent!.tags);
  });

  it("parses a budget price signal: 'under R150'", () => {
    const intent = extractIntentDeterministic("under R150");
    expect(intent).not.toBeNull();
    expect(intent!.priceMax).toBe(150);
  });

  it("returns null for vague queries: 'something fun'", () => {
    expect(extractIntentDeterministic("something fun")).toBeNull();
  });

  it("returns null for empty and short queries", () => {
    expect(extractIntentDeterministic("")).toBeNull();
    expect(extractIntentDeterministic("   ")).toBeNull();
    expect(extractIntentDeterministic("x")).toBeNull();
    expect(extractIntentDeterministic("ab")).toBeNull();
  });
});
