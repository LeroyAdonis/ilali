"use client";

import { useCallback, useState } from "react";
import {
  Share2,
  Link as LinkIcon,
  MessageCircle,
  Mail,
  X,
  Check,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface InviteShareSheetProps {
  clubSlug: string;
  clubName: string;
}

/**
 * InviteShareSheet — share options for inviting someone to a club.
 * Modal overlay with 3 options: copy link, WhatsApp, email.
 */
export default function InviteShareSheet({
  clubSlug,
  clubName,
}: InviteShareSheetProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const userId = session?.user?.id;
  const inviteLink = userId
    ? `https://ilali.vercel.app/clubs/${clubSlug}?invitedBy=${userId}`
    : `https://ilali.vercel.app/clubs/${clubSlug}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [inviteLink]);

  const handleWhatsApp = useCallback(() => {
    const message = encodeURIComponent(
      `Join me at ${clubName} on ILALI! ${inviteLink}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }, [clubName, inviteLink]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Join me at ${clubName} on ILALI!`);
    const body = encodeURIComponent(
      `Hey! Check out ${clubName} on ILALI — a community for parents and kids in Cape Town.\n\nJoin here: ${inviteLink}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [clubName, inviteLink]);

  if (!session) return null;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Invite someone
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-t-xl bg-white p-6 shadow-xl sm:rounded-xl">
            <div className="flex items-start justify-between">
              <p className="text-sm font-bold text-ink">Invite to {clubName}</p>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-ink-faint hover:text-ink-soft transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 rounded-xl border border-ink/10 p-4 text-left hover:bg-paper-warm transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ilali-50 text-ilali-600">
                  {copied ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <LinkIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {copied ? "Link copied!" : "Copy link"}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {copied
                      ? "Share it anywhere"
                      : "Copy the club invite link"}
                  </p>
                </div>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-3 rounded-xl border border-ink/10 p-4 text-left hover:bg-paper-warm transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">WhatsApp</p>
                  <p className="text-xs text-ink-faint">
                    Send a quick WhatsApp message
                  </p>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={handleEmail}
                className="flex items-center gap-3 rounded-xl border border-ink/10 p-4 text-left hover:bg-paper-warm transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Email</p>
                  <p className="text-xs text-ink-faint">
                    Send an email invitation
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
