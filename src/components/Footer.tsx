import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const footerColumns = [
  {
    title: "DISCOVER",
    links: [
      { label: "Browse Activities", href: "/browse" },
      { label: "Browse Venues", href: "/venues" },
      { label: "Categories", href: "/categories" },
      { label: "Locations", href: "/locations" },
      { label: "How It Works", href: "/how-it-works" },
    ],
  },
  {
    title: "FOR PARENTS",
    links: [
      { label: "Getting Started", href: "/for-parents" },
      { label: "Browse Activities", href: "/browse" },
      { label: "Safety & Trust", href: "/safeguarding" },
      { label: "Ubuntu Rewards", href: "/ubuntu-rewards" },
    ],
  },
  {
    title: "FOR PROVIDERS",
    links: [
      { label: "Why List With Us", href: "/for-providers" },
      { label: "Start Provider Signup", href: "/auth/signup" },
      { label: "Refer a Provider", href: "/contact" },
      { label: "Provider Resources", href: "/provider-resources" },
    ],
  },
  {
    title: "FOR VENUES",
    links: [
      { label: "Partner With Us", href: "/for-venues" },
      { label: "List Your Venue", href: "/auth/signup" },
      { label: "Venue Resources", href: "/provider-resources" },
    ],
  },
  {
    title: "TRUST & SAFETY",
    links: [
      { label: "Safeguarding Policy", href: "/safeguarding" },
      { label: "Code of Conduct", href: "/code-of-conduct" },
      { label: "Safety Guidelines", href: "/safety-guidelines" },
      { label: "Report a Concern", href: "/contact" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "About ILALI", href: "/about" },
      { label: "Ubuntu Rewards", href: "/ubuntu-rewards" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const bottomLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/privacy" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <img
                src="/images/brand/ilali-logo-38.png"
                alt="ILALI"
                width={36}
                height={36}
                className="rounded-md"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-xs">
              A child-safety-first marketplace connecting families with vetted providers and activities. Building communities, enriching childhoods.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="text-xs font-medium text-ilali-400 hover:text-ilali-300 transition-colors"
              >
                Browse activities &rarr;
              </Link>
              <Link
                href="/for-providers"
                className="text-xs font-medium text-ilali-400 hover:text-ilali-300 transition-colors"
              >
                List your activity &rarr;
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex gap-5">
            {bottomLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
