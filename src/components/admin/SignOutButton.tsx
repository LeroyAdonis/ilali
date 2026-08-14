"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { IlaliSpinner } from "@/components/IlaliSpinner";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      aria-label="Sign out"
      onClick={async () => {
        setBusy(true);
        try {
          await signOut();
          router.push("/auth/signin");
        } finally {
          setBusy(false);
        }
      }}
      className={className}
    >
      {busy ? <IlaliSpinner size="xs" /> : <LogOut className="h-5 w-5" />}
    </button>
  );
}

export function SignOutButtonFull({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOut();
          router.push("/auth/signin");
        } finally {
          setBusy(false);
        }
      }}
      className={className}
    >
      {busy ? (
        <>
          <IlaliSpinner size="xs" />
          Signing out…
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          Sign Out
        </>
      )}
    </button>
  );
}
