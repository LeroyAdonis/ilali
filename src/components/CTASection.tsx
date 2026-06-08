import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Column 1: For providers */}
          <div className="rounded-2xl bg-gradient-to-br from-ilali-50 to-ilali-100 p-8 sm:p-10">
            <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Are you a provider or venue?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              List your children&apos;s activities and connect with families
              seeking trusted, vetted programs in your community.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/providers/signup"
                className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-ilali-700 transition-colors"
              >
                List your activity
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/providers/why-list"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-ilali-400 hover:text-ilali-600 transition-colors"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Column 2: Refer */}
          <div className="rounded-2xl bg-gradient-to-br from-sunset-50 to-warm-50 p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-sunset-500" />
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Know a great provider?
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Help us build a safer community. Refer a trusted children&apos;s
              activity provider and earn Ubuntu Rewards.
            </p>
            <Link
              href="/providers/refer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-sunset-300 bg-white px-6 py-3 text-sm font-semibold text-sunset-600 hover:bg-sunset-50 transition-colors"
            >
              Refer a provider
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
