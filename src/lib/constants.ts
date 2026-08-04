import { Category, Testimonial } from "./types";

// ── DEPRECATED DATA SOURCES ──
// `providers` and `venues` have been migrated to the database (Neon + Drizzle).
// These arrays are removed. Use src/lib/db/queries.ts for dynamic data:
//   import { getProviders, getVenues } from "@/lib/db/queries";
//   import { mapProvider, mapVenue, mapProviders } from "@/lib/db/mappers";
//
// `categories` is kept as a static fallback — use DB getCategories() for live data.
// `testimonials`, `navLinks`, and `stats` remain static for now.

export const SITE_NAME = "ILALI";
export const SITE_TAGLINE = "It takes a village";
export const SITE_DESCRIPTION =
  "Find background-checked activities your kids will love. Every provider is vetted — because your child's safety matters.";
export const SITE_URL = "https://preview.ilali.co";

export const categories: Category[] = [
  {
    id: "arts-culture",
    name: "Arts & Culture",
    slug: "arts-culture",
    description: "Painting, drawing, pottery, and creative expression",
    icon: "🎨",
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    description: "Football, cricket, swimming, and team sports",
    icon: "⚽",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "emotional-intelligence",
    name: "Emotional Intel.",
    slug: "emotional-intelligence",
    description: "Mindfulness, resilience, and emotional growth",
    icon: "🧠",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "holiday-programs",
    name: "Holiday Programs",
    slug: "holiday-programs",
    description: "School holiday camps and workshops",
    icon: "🏕️",
    color: "bg-green-100 text-green-600",
  },
  {
    id: "music-lessons",
    name: "Music Lessons",
    slug: "music-lessons",
    description: "Piano, guitar, voice, and instrumental training",
    icon: "🎵",
    color: "bg-amber-100 text-amber-600",
  },
  {
    id: "education",
    name: "Education",
    slug: "education",
    description: "STEM, coding, tutoring, and academic support",
    icon: "📚",
    color: "bg-cyan-100 text-cyan-600",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Lindiwe M.",
    role: "parent",
    location: "Claremont",
    quote:
      "Finally a platform I can trust! My daughter loves her art classes and I love knowing the providers are properly vetted.",
    initial: "L",
  },
  {
    id: "2",
    name: "James K.",
    role: "parent",
    location: "Southern Suburbs",
    quote:
      "The booking process is so easy. We found an amazing coding club for our son within minutes.",
    initial: "J",
  },
  {
    id: "3",
    name: "Sarah P.",
    role: "parent",
    location: "Rondebosch",
    quote:
      "As a working mom, having everything in one place with safety checks already done makes life so much easier.",
    initial: "S",
  },
  {
    id: "4",
    name: "Natasha I.",
    role: "provider",
    location: "Observatory",
    quote:
      "ILALI has changed how we connect with families. Parents trust the vetting process, and our bookings are up 40% since we joined.",
    initial: "N",
  },
  {
    id: "5",
    name: "Marcus O.",
    role: "provider",
    location: "Woodstock",
    quote:
      "The platform handles all the admin so I can focus on teaching. Parents love the transparency and knowing their kids are safe.",
    initial: "M",
  },
  {
    id: "6",
    name: "Mariam S.",
    role: "provider",
    location: "Athlone",
    quote:
      "Being part of a vetted community has been great for our reputation. The referral system brings us families who really value what we do.",
    initial: "M",
  },
];

export const navLinks = [
  { label: "Browse", href: "/browse" },
  { label: "Map", href: "/map" },
  { label: "Categories", href: "/categories" },
  { label: "Community", href: "/clubs" },
  { label: "Rewards", href: "/rewards" },
  { label: "How It Works", href: "/how-it-works" },
];

export const stats = [
  { value: "19", label: "Vetted Providers" },
  { value: "6", label: "Categories" },
  { value: "100%", label: "Background Checked" },
  { value: "0", label: "No Booking Fees" },
];
