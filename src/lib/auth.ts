import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/lib/db/index";
import * as allSchemas from "@/lib/db/schema";
import { sendMagicLinkEmail, sendWelcomeEmail } from "@/lib/mail/index";

// Map the drizzle tables to better-auth's expected model names
const schemaMap: Record<string, PgTable> = {
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
  // Include role field in session user object
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "parent",
      },
    },
  },
  // Use nextCookies for App Router compatibility
  plugins: [
    // Email-first auth: magic link sign-in/sign-up. New users are created on
    // first link click (signup is enabled by default — there is no
    // `enableOnLinkSignup` option in Better Auth v1.6.25). Links reuse the
    // existing auth_verifications table (no schema change) and expire in 5 min.
    magicLink({
      expiresIn: 5 * 60,
      sendMagicLink: async ({ email, url }) => {
        // The mail helper never throws; a failed send degrades to a warn so
        // sign-in still returns success (the UI offers a resend).
        const result = await sendMagicLinkEmail({ email, url });
        if ("sent" in result && result.sent === false) {
          console.warn(`[auth] Magic link email not sent to ${email}: ${result.error}`);
        }
      },
    }),
    nextCookies(),
  ],
  // Welcome email for brand-new users (magic-link signups and email/password
  // signups). Admin-created provider accounts bypass this — they insert users
  // directly and send their own provider welcome (temp password). The hook
  // never throws: a welcome email must never break account creation.
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const result = await sendWelcomeEmail({ email: user.email, name: user.name });
            if ("sent" in result && result.sent === false) {
              console.warn(`[auth] Welcome email not sent to ${user.email}: ${result.error}`);
            }
          } catch (e) {
            console.warn(`[auth] Welcome email failed for ${user.email}:`, e);
          }
        },
      },
    },
  },
  // Trust localhost for dev
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "http://localhost:3001",
  ],
});
