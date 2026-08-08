/**
 * WS-7: Outreach message templates.
 * Loads from the message_templates table (seeded by scripts/seed-message-templates.ts),
 * falls back to built-in defaults if the table is empty (e.g. mock mode).
 */
import { db } from "@/lib/db/index";
import { messageTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface TemplateVars {
  providerName?: string;
  activityName?: string;
  claimUrl?: string;
  claimCode?: string;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  "whatsapp-outreach":
    "Hi {{providerName}}! 👋 We saw your {{activityName}} in the Fun with Kids group " +
    "and have already created your free listing on ILALI — Cape Town's home for kids' activities. " +
    "Claim your profile here: {{claimUrl}} (your code: {{claimCode}})",
  "email-subject": "Your {{activityName}} listing is ready on ILALI 🎉",
  "email-body":
    "Hi {{providerName}},\n\n" +
    "We spotted your {{activityName}} in the Fun with Kids group and were so impressed " +
    "that we've already created your free listing on ILALI — Cape Town's home for kids' activities.\n\n" +
    "Claim your profile here: {{claimUrl}} (your code: {{claimCode}})\n\n" +
    "No cost, no obligation. Your listing goes live as soon as you confirm.\n\n" +
    "Warm regards,\nThe ILALI team",
};

export function renderTemplate(body: string, vars: TemplateVars): string {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = vars[key as keyof TemplateVars];
    return value ?? match;
  });
}

export async function getTemplateBody(templateKey: string): Promise<string> {
  try {
    const rows = await db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.templateKey, templateKey))
      .limit(1);
    if (rows.length > 0) return rows[0].body;
  } catch {
    // mock mode / DB unavailable — fall through to defaults
  }
  return DEFAULT_TEMPLATES[templateKey] ?? "";
}

export async function renderStoredTemplate(
  templateKey: string,
  vars: TemplateVars
): Promise<string> {
  const body = await getTemplateBody(templateKey);
  return renderTemplate(body, vars);
}
