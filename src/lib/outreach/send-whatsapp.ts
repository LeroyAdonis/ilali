/**
 * WS-7: WhatsApp outreach — the swappable send layer.
 *
 * Two modes behind one interface:
 *   - "wa-me" (default): returns a wa.me deep link pre-filled with the message.
 *     A human reviews and hits send in WhatsApp. Zero setup, works today.
 *   - "api": calls the WhatsApp Business API. Dormant until George provides a
 *     dedicated SIM + Meta Business verification. Enabled by WHATSAPP_AUTO_SEND=true.
 *
 * WHATSAPP_AUTO_SEND=true with no API config → sendWhatsApp returns an error
 * object, never throws.
 */
import { renderStoredTemplate, TemplateVars } from "./templates";

export interface SendWhatsAppInput {
  phone: string; // +27XXXXXXXXX
  templateKey?: string; // defaults to "whatsapp-outreach"
  vars: TemplateVars;
}

export type SendWhatsAppResult =
  | { mode: "wa-me"; waUrl: string }
  | { mode: "api"; status: "sent" | "not-configured" };

export function isAutoSendEnabled(): boolean {
  return process.env.WHATSAPP_AUTO_SEND === "true";
}

export function buildWaMeUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsApp(
  input: SendWhatsAppInput
): Promise<SendWhatsAppResult> {
  const message = await renderStoredTemplate(
    input.templateKey ?? "whatsapp-outreach",
    input.vars
  );

  if (isAutoSendEnabled()) {
    // WhatsApp Business API path — dormant until SIM + Meta verification.
    // When configured, this becomes an API call (e.g. via @whiskeysockets/baileys
    // or the official Cloud API) with the approved template.
     
    console.warn("[send-whatsapp] WHATSAPP_AUTO_SEND=true but API not configured");
    return { mode: "api", status: "not-configured" };
  }

  return { mode: "wa-me", waUrl: buildWaMeUrl(input.phone, message) };
}
