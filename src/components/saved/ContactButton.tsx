"use client";

import { MessageCircle } from "lucide-react";
import { useSaved } from "./SavedProvider";

interface ContactButtonProps {
  providerId: string;
  providerName: string;
  phone: string;
  className?: string;
}

/**
 * WhatsApp contact that captures guest email at the moment of intent
 * (Painless Journeys Phase 2). Signed-in parents go straight to WhatsApp;
 * guests complete a magic link first so the provider knows who's reaching out.
 */
export default function ContactButton({
  providerId,
  providerName,
  phone,
  className = "",
}: ContactButtonProps) {
  const { requestContact } = useSaved();

  return (
    <button
      type="button"
      onClick={() => requestContact(providerId, providerName, phone)}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${className}`}
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      <span>Chat on WhatsApp</span>
    </button>
  );
}
