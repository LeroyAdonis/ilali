/**
 * Migration script: Create user accounts for existing providers (WS-3).
 *
 * Reads all providers WHERE userId IS NULL, creates a user account for each
 * with needsClaim=true, role='provider', issues an admin claim code (WS-3),
 * and links via userId. Idempotent — skips providers that already have userId.
 *
 * Claim codes: only the bcrypt hash is stored on the user; the PLAINTEXT code
 * is written to a CSV (default ./claim-codes.csv, override with CLAIM_CODES_CSV)
 * for the admin to distribute out-of-band. Codes are stable — a provider whose
 * user already has claimCodeHash keeps their code.
 *
 * Also backfills codes for any needsClaim users that were created by a
 * pre-WS-3 run and never got a code (so every claimable user has one).
 *
 * Usage: npx tsx scripts/migrate-provider-accounts.ts
 * NOTE: run `npx drizzle-kit push` first so the new users columns exist.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { setClaimCode } from "../src/lib/claim-codes";

const CSV_PATH = process.env.CLAIM_CODES_CSV || "claim-codes.csv";
const CSV_HEADER = "providerName,slug,email,claimCode";

function ensureCsvHeader() {
  if (!existsSync(CSV_PATH)) {
    writeFileSync(CSV_PATH, CSV_HEADER + "\n");
  }
}

/** Append one row, CSV-quoting every field. */
function appendCodeRow(
  providerName: string,
  slug: string,
  email: string,
  claimCode: string
) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  appendFileSync(
    CSV_PATH,
    [providerName, slug, email, claimCode].map(esc).join(",") + "\n"
  );
}

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });
  ensureCsvHeader();

  // Find all providers without a linked userId
  const unlinkedProviders = await db
    .select()
    .from(schema.providers)
    .where(isNull(schema.providers.userId));

  console.log(`Found ${unlinkedProviders.length} providers without linked user accounts`);

  let created = 0;
  let skipped = 0;
  let errors = 0;
  let codesIssued = 0;

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
        // WS-3: if the existing user has no claim code, issue one (codes are
        // stable — never regenerate one that already exists).
        if (!existingUser.claimCodeHash) {
          const { claimCode, claimCodeHash, claimCodeExpiresAt } = await setClaimCode();
          await db
            .update(schema.users)
            .set({
              claimCodeHash,
              claimCodeExpiresAt,
              claimAttempts: 0,
              claimLockedUntil: null,
            })
            .where(eq(schema.users.id, existingUser.id));
          appendCodeRow(provider.name, provider.slug, existingUser.email, claimCode);
          codesIssued++;
          console.log(`  [CODE]  "${provider.name}" — existing user got a claim code`);
        }
        continue;
      }

      // Create user account with needsClaim=true, no password, plus a WS-3
      // claim code (hash only — plaintext goes to the CSV).
      const { claimCode, claimCodeHash, claimCodeExpiresAt } = await setClaimCode();
      await db.insert(schema.users).values({
        id: userId,
        name: provider.providerName,
        email: placeholderEmail,
        role: "provider",
        needsClaim: true,
        passwordResetRequired: false,
        claimCodeHash,
        claimCodeExpiresAt,
        claimAttempts: 0,
        claimLockedUntil: null,
      });

      // Link provider to user
      await db
        .update(schema.providers)
        .set({ userId })
        .where(eq(schema.providers.id, provider.id));

      appendCodeRow(provider.name, provider.slug, placeholderEmail, claimCode);
      created++;
      codesIssued++;
      console.log(`  [CREATED] "${provider.name}" → user ${userId.slice(0, 8)}... + claim code ${claimCode}`);
    } catch (e) {
      errors++;
      console.error(`  [ERROR] "${provider.name}":`, e instanceof Error ? e.message : e);
    }
  }

  // Backfill: needsClaim users created by an earlier pre-WS-3 run that never
  // received a claim code (idempotent — users with codes are excluded).
  const codeless = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.needsClaim, true), isNull(schema.users.claimCodeHash)));

  for (const user of codeless) {
    try {
      const { claimCode, claimCodeHash, claimCodeExpiresAt } = await setClaimCode();
      await db
        .update(schema.users)
        .set({
          claimCodeHash,
          claimCodeExpiresAt,
          claimAttempts: 0,
          claimLockedUntil: null,
        })
        .where(eq(schema.users.id, user.id));
      const [prov] = await db
        .select()
        .from(schema.providers)
        .where(eq(schema.providers.userId, user.id))
        .limit(1);
      appendCodeRow(prov?.name || user.name, prov?.slug || "", user.email, claimCode);
      codesIssued++;
      console.log(`  [BACKFILL] "${user.name}" (${user.email}) — claim code issued`);
    } catch (e) {
      errors++;
      console.error(`  [ERROR] backfill "${user.email}":`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}, Claim codes issued: ${codesIssued}`);
  console.log(`Plaintext claim codes written to ${CSV_PATH} (distribute out-of-band; delete after use)`);
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
