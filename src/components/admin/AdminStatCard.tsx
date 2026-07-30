import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClasses?: string;
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  colorClasses = "text-slate-600 bg-slate-100",
}: AdminStatCardProps) {
  // colorClasses is a combined string like "text-amber-600 bg-amber-100"
  const [textColor, bgColor] = colorClasses.split(" ");

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 min-h-[88px]">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${bgColor || "bg-slate-100"}`}>
        <Icon className={`h-5 w-5 ${textColor || "text-slate-600"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
