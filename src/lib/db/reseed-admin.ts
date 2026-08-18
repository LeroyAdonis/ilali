/**
 * Re-seed admin users using Better Auth's own hashing.
 * Run: npx tsx src/lib/db/reseed-admin.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "./index";
import * as allSchemas from "./schema";

const schemaMap: Record<string, PgTable> = {
  user: allSchemas.users,
  session: allSchemas.authSessions,
  account: allSchemas.authAccounts,
  verification: allSchemas.authVerifications,
};

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schemaMap,
  }),
  emailAndPassword: {
    enabled: true,
  },
});

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

async function reseed() {
  // Delete existing accounts
  const user = await sql`SELECT id FROM users WHERE email = 'leroy@ilali.co'`;
  if (user[0]) {
    await sql`DELETE FROM auth_accounts WHERE user_id = ${user[0].id}`;
    console.log("Deleted old auth account for Leroy");
  }

  // Create via Better Auth (uses correct bcrypt hash)
  const ctx = await auth.api.signUpEmail({
    body: {
      email: "leroy@ilali.co",
      password: "ilali-admin-2026",
      name: "Leroy",
    },
    asResponse: false,
  });

  if (ctx?.user?.id) {
    await sql`UPDATE users SET role = 'admin' WHERE id = ${ctx.user.id}`;
    console.log("✅ Leroy recreated as admin");
  }

  // Also recreate George
  const george = await sql`SELECT id FROM users WHERE email = 'george@ilali.co'`;
  if (george[0]) {
    await sql`DELETE FROM auth_accounts WHERE user_id = ${george[0].id}`;
    console.log("Deleted old auth account for George");
  }

  const ctx2 = await auth.api.signUpEmail({
    body: {
      email: "george@ilali.co",
      password: "ilali-admin-2026",
      name: "George",
    },
    asResponse: false,
  });

  if (ctx2?.user?.id) {
    await sql`UPDATE users SET role = 'admin' WHERE id = ${ctx2.user.id}`;
    console.log("✅ George recreated as admin");
  }

  console.log("\n🎉 Admin reseed complete!");
}

reseed().catch((err) => {
  console.error("❌ Reseed failed:", err);
  process.exit(1);
});
