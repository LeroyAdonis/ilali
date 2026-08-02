import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sign Up | ILALI",
  description:
    "Create your ILALI account as a parent or provider and join our community of trusted children's activities.",
};

export default function SignUpPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
              <div className="mb-8 text-center">
                <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                  Create your account
                </h1>
                <p className="mt-2 text-sm text-ink-faint">
                  Join the ILALI community today
                </p>
              </div>

              <form className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-ink-soft"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-ink-soft"
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
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink-soft"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Create a strong password"
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-soft">
                    Account type
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-white p-3 text-sm font-medium text-ink-soft hover:bg-paper-warm has-[:checked]:border-ilali-500 has-[:checked]:bg-ilali-50 has-[:checked]:text-ilali-700">
                      <input
                        type="radio"
                        name="accountType"
                        value="parent"
                        defaultChecked
                        className="sr-only"
                      />
                      <span>Parent</span>
                    </label>
                    <label className="flex cursor-pointer items-center justify-center rounded-lg border border-ink/10 bg-white p-3 text-sm font-medium text-ink-soft hover:bg-paper-warm has-[:checked]:border-ilali-500 has-[:checked]:bg-ilali-50 has-[:checked]:text-ilali-700">
                      <input
                        type="radio"
                        name="accountType"
                        value="provider"
                        className="sr-only"
                      />
                      <span>Provider</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 h-4 w-4 rounded border-ink/10 text-ilali-600 focus:ring-ilali-500"
                  />
                  <label htmlFor="terms" className="text-xs text-ink-faint">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="font-medium text-ilali-600 underline hover:text-ilali-700"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="font-medium text-ilali-600 underline hover:text-ilali-700"
                    >
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                <button
                  type="button"
                  className="w-full rounded-full bg-ilali-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-ilali-700"
                >
                  Sign Up
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-ink-faint">
                  Already have an account?{" "}
                  <a
                    href="/auth/signin"
                    className="font-medium text-ilali-600 hover:text-ilali-700"
                  >
                    Sign in
                  </a>
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
