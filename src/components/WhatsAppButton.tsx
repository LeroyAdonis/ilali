"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string; // +27XXXXXXXXX
  activityName: string;
  className?: string;
}

/** Pure helper — builds the wa.me deep link. `override` (e.g. a business-wide
 *  WhatsApp number from env) wins over the provider's own `phone`. */
export function buildWhatsAppUrl(
  phone: string,
  activityName: string,
  override?: string
): string {
  const contactNumber = override ?? phone;
  const message = encodeURIComponent(
    `Hi! I found your "${activityName}" listing on ILALI and I'm interested in learning more.`
  );
  return `https://wa.me/${contactNumber}?text=${message}`;
}

export default function WhatsAppButton({
  phone,
  activityName,
  className = "",
}: WhatsAppButtonProps) {
  const waUrl = buildWhatsAppUrl(
    phone,
    activityName,
    process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER
  );

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contact provider for ${activityName} on WhatsApp`}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${className}`}
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="h-4 w-4" />
      <span>Chat on WhatsApp</span>
    </a>
  );
}
