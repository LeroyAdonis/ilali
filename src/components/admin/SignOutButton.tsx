"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/auth/signin");
      }}
      className={className}
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
}

export function SignOutButtonFull({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/auth/signin");
      }}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
