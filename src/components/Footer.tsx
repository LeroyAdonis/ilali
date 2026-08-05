import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

const footerColumns = [
  {
    title: "FOR PARENTS",
    links: [
      { label: "Getting Started", href: "/for-parents" },
      { label: "Browse Venues", href: "/venues" },
      { label: "Locations", href: "/locations" },
      { label: "Help Centre", href: "/help-centre" },
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
];

const bottomLinks = [
  { label: "About ILALI", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/privacy" },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper-warm text-ink-soft">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <img
                src="/images/brand/ilali-logo-76-t.png"
                alt="ILALI"
                width={48}
                height={48}
                className="h-12 w-12"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft max-w-xs">
              A child-safety-first marketplace connecting Cape Town families with vetted activities for kids.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="text-xs font-medium text-teal-deep hover:text-teal transition-colors"
              >
                Browse activities &rarr;
              </Link>
              <Link
                href="/for-providers"
                className="text-xs font-medium text-teal-deep hover:text-teal transition-colors"
              >
                List your activity &rarr;
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft hover:text-teal-deep transition-colors"
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
      <div className="border-t border-ink/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-ink-faint">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            {bottomLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-ink-faint hover:text-teal-deep transition-colors"
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
