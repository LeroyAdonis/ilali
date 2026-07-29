import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db/index";
import * as allSchemas from "@/lib/db/schema";

// Map the drizzle tables to better-auth's expected model names
const schemaMap: Record<string, any> = {
  user: allSchemas.users,
  session: allSchemas.authSessions,
  account: allSchemas.authAccounts,
  verification: allSchemas.authVerifications,
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schemaMap,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  // Use nextCookies for App Router compatibility
  plugins: [nextCookies()],
  // Trust localhost for dev
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
});
