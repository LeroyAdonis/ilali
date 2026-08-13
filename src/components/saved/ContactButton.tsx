"use client";

import { useSaved } from "./SavedProvider";
import WhatsAppButton from "@/components/WhatsAppButton";

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
 * Renders the shared WhatsAppButton (single markup source) and only
 * intercepts the click for guests.
 */
export default function ContactButton({
  providerId,
  providerName,
  phone,
  className = "",
}: ContactButtonProps) {
  const { requestContact } = useSaved();

  return (
    <WhatsAppButton
      phone={phone}
      activityName={providerName}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        requestContact(providerId, providerName, phone);
      }}
    />
  );
}
