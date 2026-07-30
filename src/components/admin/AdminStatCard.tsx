import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function AdminStatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
  iconColor = "bg-slate-100 text-slate-600",
}: AdminStatCardProps) {
  const [bgColor, textColor] = iconColor.split(" ");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          bgColor || "bg-slate-100"
        } ${textColor || "text-slate-600"}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {change && (
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              change.positive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {change.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change.value}
          </span>
        </div>
      )}
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}
