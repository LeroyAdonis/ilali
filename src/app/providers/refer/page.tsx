import Link from "next/link";
import { Heart, Share2, Gift, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReferralForm from "./form";

export const metadata = {
  title: "Refer a Provider — ILALI",
};

export default function ReferPage() {
  const steps = [
    {
      icon: Heart,
      title: "1. Think of a provider",
      desc: "Know a great children's activity provider who should be on ILALI? It could be a sports coach, art teacher, music instructor, or tutor.",
    },
    {
      icon: Share2,
      title: "2. Send us their details",
      desc: "Fill in the form below with their name and contact info. We'll reach out and guide them through the sign-up process.",
    },
    {
      icon: Gift,
      title: "3. Earn rewards",
      desc: "When your referred provider signs up and lists their first activity, you earn Ubuntu Rewards points that can be redeemed for discounts and perks.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-sunset-500 to-sunset-700 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 mb-6">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Refer a Provider
            </h1>
            <p className="mt-4 text-base leading-relaxed text-sunset-100 sm:text-lg">
              Help us build a safer community. Know a great children&apos;s activity provider?
              Refer them to ILALI and earn <strong className="text-white">Ubuntu Rewards</strong>.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              How it works
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.title} className="text-center">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-sunset-100 text-sunset-600 mb-4">
                    <s.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rewards */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="h-6 w-6 text-sunset-500" />
                <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Ubuntu Rewards
                </h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 mb-6">
                Every time someone you refer signs up and lists their first activity, you earn
                Ubuntu Rewards points. Accumulate points and redeem them for:
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Discounts on bookings", emoji: "🎟️" },
                  { label: "Free activity sessions", emoji: "🎯" },
                  { label: "Exclusive ILALI merch", emoji: "👕" },
                  { label: "Featured provider badge", emoji: "⭐" },
                  { label: "Priority support access", emoji: "💬" },
                  { label: "Community recognition", emoji: "🏆" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                    <span>{item.emoji}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Referral Form */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Refer a provider
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Fill in your details and the provider&apos;s information below.
            </p>
            <ReferralForm />

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">
                Already a provider?{" "}
                <Link href="/providers/signup" className="text-ilali-600 font-semibold hover:underline">
                  List your activity
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
