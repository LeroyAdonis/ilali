import Link from "next/link";
import { Users, Shield, Zap, Check, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderSignupForm from "./form";

export function generateMetadata() {
  return { title: "Provider Sign Up — ILALI" };
}

export default function ProviderSignupPage() {
  const benefits = [
    {
      icon: Users,
      title: "Reach Local Families",
      desc: "Connect with parents actively searching for quality activities for their children in your area.",
    },
    {
      icon: Shield,
      title: "Trusted & Vetted",
      desc: "Join a platform built on trust. Every provider is verified, giving parents peace of mind.",
    },
    {
      icon: Zap,
      title: "Simple Setup",
      desc: "No long contracts or hidden fees. Start listing in minutes and manage everything from one dashboard.",
    },
  ];

  const features = [
    "Easy activity listing management",
    "Built-in booking and scheduling system",
    "Secure payment processing",
    "Customer reviews and ratings",
    "Ubuntu Rewards loyalty programme",
    "Dedicated provider support",
    "Marketing exposure to thousands of families",
    "Performance analytics dashboard",
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-ilali-600 to-ilali-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs uppercase tracking-widest text-ilali-200 font-semibold">
              Provider sign up
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              List Your Activity on <span className="text-warm-300">ILALI</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ilali-100 sm:text-lg">
              Join South Africa&apos;s fastest-growing marketplace for children&apos;s activities.
              Reach thousands of local families looking for trusted programs.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl font-extrabold text-white">R99</span>
              <span className="text-sm text-ilali-200">/month — first 30 days free</span>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Why list with ILALI?
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ilali-100 text-ilali-600 mb-4">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Everything you need to grow
            </h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-3 text-sm text-slate-700">
                  <Check className="h-5 w-5 text-ilali-500 mt-0.5 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <ProviderSignupForm />
      </main>
      <Footer />
    </div>
  );
}
