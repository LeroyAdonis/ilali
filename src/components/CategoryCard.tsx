import Link from "next/link";

interface CategoryCardProps {
  name: string;
  icon: string;
  colorClasses: string;
  description?: string;
  href: string;
}

export default function CategoryCard({
  name,
  icon,
  colorClasses,
  description,
  href,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div
        className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full text-xl ${colorClasses}`}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 group-hover:text-ilali-600 transition-colors">
        {name}
      </h3>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-2">
          {description}
        </p>
      )}
    </Link>
  );
}
