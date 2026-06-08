import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Forgot Password | ILALI",
  description: "Reset your ILALI account password.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Reset your password
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

                <button
                  type="button"
                  className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
                >
                  Send reset link
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Remember your password?{" "}
                  <Link
                    href="/auth/signin"
                    className="font-medium text-ilali-600 hover:text-ilali-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
