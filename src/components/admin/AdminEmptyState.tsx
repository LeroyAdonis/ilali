import type { LucideIcon } from "lucide-react";

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-ink/10 bg-white px-6 py-16 text-center">
      <Icon className="h-12 w-12 text-ink-faint" />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-ink-faint">{description}</p>
      )}
    </div>
  );
}
