/**
 * Seed admin users for ILALI.
 *
 * Usage: npx tsx src/lib/db/seed.ts
 *
 * Creates admin users if they don't already exist:
 * - leroy@ilali.co (Leroy)
 * - george@ilali.co (George)
 *
 * Default password: "ilali-admin-2026" (change on first login)
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Set it in .env.local or environment.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const ADMIN_USERS = [
  { name: "Leroy", email: "leroy@ilali.co" },
  { name: "George", email: "george@ilali.co" },
];

const DEFAULT_PASSWORD = "ilali-admin-2026";

async function seed() {
  console.log("🔐 Hashing default password...");
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log("✅ Password hashed");

  for (const admin of ADMIN_USERS) {
    // Check if user already exists
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, admin.email));

    if (existing) {
      // Update to admin role if not already
      if (existing.role !== "admin") {
        await db
          .update(schema.users)
          .set({ role: "admin" })
          .where(eq(schema.users.email, admin.email));
        console.log(`🔄 Updated ${admin.email} to admin role`);
      } else {
        console.log(`⏭️  ${admin.email} already exists as admin`);
      }

      // Upsert the password account
      const [existingAccount] = await db
        .select()
        .from(schema.authAccounts)
        .where(eq(schema.authAccounts.userId, existing.id));

      if (existingAccount) {
        console.log(`⏭️  Auth account for ${admin.email} already exists`);
      } else {
        await db.insert(schema.authAccounts).values({
          id: crypto.randomUUID(),
          userId: existing.id,
          providerId: "credential",
          accountId: existing.id,
          password: hashedPassword,
        });
        console.log(`🔑 Created auth account for ${admin.email}`);
      }
    } else {
      // Create the user
      const userId = crypto.randomUUID();
      await db.insert(schema.users).values({
        id: userId,
        name: admin.name,
        email: admin.email,
        role: "admin",
        emailVerified: true,
      });
      console.log(`👤 Created admin user: ${admin.email}`);

      // Create the auth account with password
      await db.insert(schema.authAccounts).values({
        id: crypto.randomUUID(),
        userId,
        providerId: "credential",
        accountId: userId,
        password: hashedPassword,
      });
      console.log(`🔑 Created auth account for ${admin.email}`);
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Admin credentials:");
  console.log("   Email: leroy@ilali.co / george@ilali.co");
  console.log("   Password: ilali-admin-2026");
  console.log("   ⚠️  Change the password after first login!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
