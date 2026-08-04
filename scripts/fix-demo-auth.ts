import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const userId = "053ac8b2-3a8a-40bf-becc-4b5f5fee8651";

  // Delete the broken account
  await sql`DELETE FROM auth_accounts WHERE user_id = ${userId}`;

  // Hash with Better Auth's built-in crypto
  const hashedPassword = await hashPassword("demo1234");
  console.log("Hash:", hashedPassword.substring(0, 30) + "...");

  // Insert with correct format
  await sql`INSERT INTO auth_accounts (id, user_id, provider_id, account_id, password, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${userId}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())`;

  console.log("✅ Account recreated with Better Auth hash");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
