/**
 * Seed the WS-7 outreach message templates.
 * Idempotent: upserts by template_key, never duplicates.
 *
 * Usage: npx tsx scripts/seed-message-templates.ts
 */
import { db } from "../src/lib/db/index";
import { eq } from "drizzle-orm";
import { messageTemplates } from "../src/lib/db/schema";

const TEMPLATES = [
  {
    templateKey: "whatsapp-outreach",
    body:
      "Hi {{providerName}}! 👋 We saw your {{activityName}} in the Fun with Kids group " +
      "and have already created your free listing on ILALI — Cape Town's home for kids' activities. " +
      "Claim your profile here: {{claimUrl}} (your code: {{claimCode}})",
  },
  {
    templateKey: "email-subject",
    body: "Your {{activityName}} listing is ready on ILALI 🎉",
  },
  {
    templateKey: "email-body",
    body:
      "Hi {{providerName}},\n\n" +
      "We spotted your {{activityName}} in the Fun with Kids group and were so impressed " +
      "that we've already created your free listing on ILALI — Cape Town's home for kids' activities.\n\n" +
      "Claim your profile here: {{claimUrl}} (your code: {{claimCode}})\n\n" +
      "No cost, no obligation. Your listing goes live as soon as you confirm.\n\n" +
      "Warm regards,\nThe ILALI team",
  },
];

async function main() {
  console.log("Seeding message templates...");
  let inserted = 0;
  let updated = 0;

  for (const t of TEMPLATES) {
    const existing = await db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.templateKey, t.templateKey));

    if (existing.length > 0) {
      await db
        .update(messageTemplates)
        .set({ body: t.body, updatedAt: new Date() })
        .where(eq(messageTemplates.templateKey, t.templateKey));
      updated++;
    } else {
      await db.insert(messageTemplates).values({
        templateKey: t.templateKey,
        body: t.body,
      });
      inserted++;
    }
  }

  console.log(`Done — ${inserted} inserted, ${updated} updated.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
