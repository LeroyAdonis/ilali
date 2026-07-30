import { type LucideIcon } from "lucide-react";

type Status = "pending" | "contacted" | "approved" | "rejected";

const STATUS_STYLES: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-300",
  contacted: "bg-blue-100 text-blue-700 border-blue-300",
  approved: "bg-teal-100 text-teal-700 border-teal-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
};

export function AdminStatusBadge({ status }: { status: Status | null }) {
  const resolved = status || "pending";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[resolved]}`}
    >
      {resolved}
    </span>
  );
}
