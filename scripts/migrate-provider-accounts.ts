/**
 * Migration script: Create user accounts for existing providers.
 *
 * Reads all providers WHERE userId IS NULL, creates a user account
 * for each with needsClaim=true, role='provider', and links via userId.
 * Idempotent — skips providers that already have userId.
 *
 * Usage: npx tsx scripts/migrate-provider-accounts.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq, isNull } from "drizzle-orm";

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  // Find all providers without a linked userId
  const unlinkedProviders = await db
    .select()
    .from(schema.providers)
    .where(isNull(schema.providers.userId));

  console.log(`Found ${unlinkedProviders.length} providers without linked user accounts`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const provider of unlinkedProviders) {
    try {
      // Generate a random UUID for the new user
      const userId = crypto.randomUUID();

      // Check if a user with this placeholder email already exists
      const placeholderEmail = `${provider.slug}@ilali.co`;
      const [existingUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, placeholderEmail))
        .limit(1);

      if (existingUser) {
        // Link existing user to this provider
        await db
          .update(schema.providers)
          .set({ userId: existingUser.id })
          .where(eq(schema.providers.id, provider.id));
        skipped++;
        console.log(`  [SKIP] "${provider.name}" — existing user found (${existingUser.email}), linked`);
        continue;
      }

      // Create user account with needsClaim=true, no password
      await db.insert(schema.users).values({
        id: userId,
        name: provider.providerName,
        email: placeholderEmail,
        role: "provider",
        needsClaim: true,
        passwordResetRequired: false,
      });

      // Link provider to user
      await db
        .update(schema.providers)
        .set({ userId })
        .where(eq(schema.providers.id, provider.id));

      created++;
      console.log(`  [CREATED] "${provider.name}" → user ${userId.slice(0, 8)}...`);
    } catch (e) {
      errors++;
      console.error(`  [ERROR] "${provider.name}":`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
