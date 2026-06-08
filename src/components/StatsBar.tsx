import { stats } from "@/lib/constants";

export default function StatsBar() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <span className="text-3xl font-extrabold text-ilali-600 sm:text-4xl">
                {stat.value}
              </span>
              <span className="mt-1 text-sm font-medium text-slate-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
