import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log("Tables:", tables.map((r: any) => r.table_name).join(", "));
  
  const counts = await sql`
    SELECT 
      (SELECT count(*) FROM categories) as categories,
      (SELECT count(*) FROM providers) as providers,
      (SELECT count(*) FROM venues) as venues,
      (SELECT count(*) FROM venue_amenities) as amenities
  `;
  console.log("Counts:", counts[0]);
  
  const provs = await sql`SELECT name, slug, location, price_value, tags, verified FROM providers ORDER BY name`;
  console.log("\nProviders:");
  for (const p of provs) console.log(`  ${p.name} | ${p.location} | R${p.price_value} | tags: ${p.tags} | verified: ${p.verified}`);
}

main().catch(console.error);
