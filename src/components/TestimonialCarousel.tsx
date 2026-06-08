"use client";

import { useState } from "react";
import { testimonials } from "@/lib/constants";
import type { Testimonial } from "@/lib/types";

export default function TestimonialCarousel() {
  const [activeTab, setActiveTab] = useState<"parent" | "provider">("parent");

  const filtered = testimonials.filter((t) => t.role === activeTab);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading + tabs */}
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {activeTab === "parent" ? "What parents say" : "What providers say"}
          </h2>
          <div className="mt-4 flex gap-2 rounded-full bg-slate-100 p-1">
            <button
              onClick={() => setActiveTab("parent")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "parent"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Parents
            </button>
            <button
              onClick={() => setActiveTab("provider")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                activeTab === "provider"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Providers
            </button>
          </div>
        </div>

        {/* Cards – horizontal scroll on mobile, grid on desktop */}
        <div className="mt-10 flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:snap-none sm:pb-0">
          {filtered.map((t: Testimonial) => (
            <div
              key={t.id}
              className="flex min-w-[280px] shrink-0 snap-start flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:min-w-0"
            >
              {/* Quote */}
              <p className="text-sm leading-relaxed text-slate-600 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ilali-100 text-sm font-bold text-ilali-700">
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-500">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
