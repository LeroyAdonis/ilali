/**
 * Quick smoke-test for queries.ts — run with:
 *   export $(grep -v '^#' /root/ilali/.env.local | xargs) && npx tsx /root/ilali/src/lib/db/test-queries.ts
 */
import {
  getCategories,
  getProviders,
  getProviderBySlug,
  getVenues,
  getVenueBySlug,
  searchProviders,
  getSimilarProviders,
} from "./queries";

async function main() {
  let passed = 0;
  let failed = 0;

  const check = (label: string, ok: boolean, detail?: string) => {
    if (ok) {
      console.log(`  ✅ ${label}`, detail ? `(${detail})` : "");
      passed++;
    } else {
      console.log(`  ❌ ${label}`, detail ? `(${detail})` : "");
      failed++;
    }
  };

  // 1. getCategories
  console.log("\n📋 getCategories()");
  const cats = await getCategories();
  check("Returns array", Array.isArray(cats));
  check("Has 11 categories", cats.length === 11, `got ${cats.length}`);
  check("First has name", !!cats[0]?.name, cats[0]?.name);
  check("Icon is emoji", typeof cats[0]?.icon === "string", cats[0]?.icon);

  // 2. getProviders (no filters)
  console.log("\n📋 getProviders() — no filters");
  const allProviders = await getProviders();
  check("Returns array", Array.isArray(allProviders));
  check("Has 4 providers", allProviders.length === 4, `got ${allProviders.length}`);
  check("First has slug", !!allProviders[0]?.slug, allProviders[0]?.slug);

  // 3. getProviders with filters
  console.log("\n📋 getProviders() — filtered");
  const artProviders = await getProviders({ category: "arts-culture" });
  check("arts-culture filter", artProviders.length === 3, `got ${artProviders.length}`);

  const holidayProviders = await getProviders({ category: "holiday-programs" });
  check("holiday-programs filter", holidayProviders.length === 1, `got ${holidayProviders.length}`);

  const ageProviders = await getProviders({ ageMin: 10, ageMax: 16 });
  check("age 10-16 filter", ageProviders.length >= 1, `got ${ageProviders.length}`);

  const freeProviders = await getProviders({ maxPrice: 0 });
  check("maxPrice=0 filter", freeProviders.length === 1, `got ${freeProviders.length}`);

  // 4. getProviderBySlug
  console.log("\n📋 getProviderBySlug()");
  const found = await getProviderBySlug("ilali-creative-arts-workshop");
  check("Finds by slug", !!found, found?.name);

  const notFound = await getProviderBySlug("nonexistent-slug");
  check("Returns null for missing", notFound === null);

  // 5. getVenues
  console.log("\n📋 getVenues()");
  const allVenues = await getVenues();
  check("Returns array", Array.isArray(allVenues));
  check("Has 4 venues", allVenues.length === 4, `got ${allVenues.length}`);

  // 6. getVenueBySlug (with amenities)
  console.log("\n📋 getVenueBySlug()");
  const venue = await getVenueBySlug("dance-studio");
  check("Finds venue by slug", !!venue, venue?.name);
  const venueAmenities = (venue as unknown as { amenities?: unknown[] } | null)?.amenities;
  check("Has amenities array", Array.isArray(venueAmenities), String(venueAmenities?.length));
  check("Has 4 amenities", venueAmenities?.length === 4, JSON.stringify(venueAmenities));

  const venueNotFound = await getVenueBySlug("no-such-venue");
  check("Returns null for missing", venueNotFound === null);

  // 7. searchProviders
  console.log("\n📋 searchProviders()");
  const search1 = await searchProviders("creative");
  check("Search 'creative' finds results", search1.length >= 2, `got ${search1.length}`);

  const search2 = await searchProviders("holiday");
  check("Search 'holiday' finds results", search2.length >= 1, `got ${search2.length}`);

  const search3 = await searchProviders("Muizenberg");
  check("Search location 'Muizenberg'", search3.length >= 2, `got ${search3.length}`);

  const search4 = await searchProviders("nonexistent");
  check("Search 'nonexistent' returns empty", search4.length === 0, `got ${search4.length}`);

  // 8. getSimilarProviders
  console.log("\n📋 getSimilarProviders()");
  const creativeArts = await getProviderBySlug("ilali-creative-arts-workshop");
  if (creativeArts) {
    const similar = await getSimilarProviders(creativeArts.id);
    check("Finds similar providers", similar.length >= 1, `got ${similar.length}`);
    check("Does not include self", !similar.find((s) => s.id === creativeArts.id));
  } else {
    check("SKIP similar — no creative arts provider", false, "prerequisite missing");
  }

  // Summary
  console.log(`\n${"─".repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
