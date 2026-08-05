import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Hero Image Candidates | ILALI",
  description: "Gemini-generated hero image candidates for review.",
  robots: { index: false, follow: false },
};

interface Candidate {
  file: string;
  slot: string;
  page: string;
  note?: string;
}

const CANDIDATES: Candidate[] = [
  { file: "browse.png", slot: "browse", page: "/browse", note: "Activity wall — option" },
  { file: "categories.png", slot: "categories", page: "/categories", note: "3 kids, 3 activities" },
  { file: "categories-option2.png", slot: "categories (alt)", page: "/categories", note: "OPTION 2" },
  { file: "home.png", slot: "home", page: "/home" },
  { file: "clubs.png", slot: "clubs", page: "/clubs", note: "Team huddle" },
  { file: "how-it-works.png", slot: "how-it-works", page: "/how-it-works", note: "Blocks" },
  { file: "about.png", slot: "about", page: "/about", note: "Running girl" },
  { file: "safety.png", slot: "safety", page: "/safeguarding", note: "Coach + child" },
  { file: "contact.png", slot: "contact", page: "/contact", note: "Kids on grass" },
  { file: "locations.png", slot: "locations", page: "/locations", note: "Park map" },
  { file: "for-providers.png", slot: "for-providers", page: "/for-providers", note: "High five" },
  { file: "provider-resources.png", slot: "provider-resources", page: "/provider-resources", note: "Shoelace" },
  { file: "invite.png", slot: "invite", page: "/invite", note: "Tug of war" },
  { file: "cat-arts-culture.png", slot: "Arts & Culture", page: "/category/arts-culture" },
  { file: "cat-sports.png", slot: "Sports", page: "/category/sports" },
  { file: "cat-education.png", slot: "Education", page: "/category/education" },
  { file: "cat-music-lessons.png", slot: "Music Lessons", page: "/category/music-lessons" },
  { file: "cat-holiday-programs.png", slot: "Holiday Programs", page: "/category/holiday-programs" },
  { file: "cat-emotional-intelligence.png", slot: "Emotional Intelligence", page: "/category/emotional-intelligence" },
];

export default function HeroPreviewPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-paper">
        <div className="mx-auto w-full max-w-7xl px-4 py-10">
          <div className="mb-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              ★ GEMINI CANDIDATES
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">
              Hero Image Review Board
            </h1>
            <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
              18 Gemini-generated candidates for interior heroes + category pages.
              Landing hero untouched. Pick your winners — I&apos;ll swap them into the registry.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {CANDIDATES.map((c) => (
              <div
                key={c.file}
                className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-paper-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/hero/gemini-candidates/${c.file}`}
                    alt={c.slot}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  {c.note && (
                    <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white">
                      {c.note}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-ink/10 px-4 py-3">
                  <div>
                    <p className="font-display text-sm font-bold text-ink">{c.slot}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                      {c.page}
                    </p>
                  </div>
                  <span className="rounded-md bg-ilali-50 px-2 py-1 font-mono text-[10px] text-ilali-600">
                    {c.file}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
