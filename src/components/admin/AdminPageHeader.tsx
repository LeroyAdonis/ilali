import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    icon?: string; // icon name as string, we resolve to Lucide
  };
}

function resolveIcon(name: string): LucideIcon {
  // Only supporting Plus for now — extend as needed
  if (name === "Plus") return Plus;
  return Plus;
}

export function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  const ActionIcon = action?.icon ? resolveIcon(action.icon) : null;

  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex h-11 items-center gap-2 self-start rounded-lg bg-ilali-600 px-5 text-sm font-medium text-white hover:bg-ilali-700 transition-colors"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {action.label}
        </Link>
      )}
    </div>
  );
}
