import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  linkHref?: string;
  linkLabel?: string;
  icon?: string; // emoji or unicode character
}

export default function ComingSoon({
  title,
  description,
  linkHref,
  linkLabel,
  icon = "🚀",
}: ComingSoonProps) {
  return (
    <div
      className="rounded-xl border border-ilali-200 bg-ilali-50/50 p-6 text-center shadow-sm"
      style={{ maxWidth: 375 }}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-2xl" role="img" aria-hidden="true">
        {icon}
      </span>
      <div className="mt-3 flex items-center justify-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
          Coming soon
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="mt-4 inline-flex items-center text-sm font-medium text-ilali-600 hover:text-ilali-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ilali-400 focus:ring-offset-2 rounded-md px-2 py-1"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
