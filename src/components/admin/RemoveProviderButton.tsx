"use client";

import { Trash2 } from "lucide-react";

export function RemoveProviderButton({ providerId }: { providerId: string }) {
  return (
    <form
      action={`/api/admin/providers/${providerId}`}
      method="POST"
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to remove this provider?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="submit"
        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remove
      </button>
    </form>
  );
}
