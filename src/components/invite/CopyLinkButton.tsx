"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyLinkButtonProps {
  referralLink: string;
}

export default function CopyLinkButton({ referralLink }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text manually
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-[10px] bg-gold px-6 py-3 text-[15px] font-semibold text-[#3A2402] shadow-[0_4px_0_rgba(224,143,16,0.28)] transition-transform hover:-translate-y-px active:translate-y-px active:shadow-none"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy referral link
        </>
      )}
    </button>
  );
}
