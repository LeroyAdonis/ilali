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
  "Discover and book trusted children's extramural activities in your community. Every provider is background-checked for your peace of mind.";
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
      "As a working mom, having everything in one place with safety checks done for me is a game-changer.",
    initial: "S",
  },
  {
    id: "4",
    name: "Natasha I.",
    role: "provider",
    location: "Observatory",
    quote:
      "ILALI has transformed how we connect with families. The vetting process gives parents confidence, and our bookings have grown 40% since joining.",
    initial: "N",
  },
  {
    id: "5",
    name: "Marcus O.",
    role: "provider",
    location: "Woodstock",
    quote:
      "The platform handles all the admin so I can focus on teaching. Parents love the transparency and trust signals.",
    initial: "M",
  },
  {
    id: "6",
    name: "Mariam S.",
    role: "provider",
    location: "Athlone",
    quote:
      "Being part of a vetted community has elevated our reputation. The referral system brings us quality families who value what we do.",
    initial: "M",
  },
];

export const navLinks = [
  { label: "Browse", href: "/browse" },
  { label: "Map", href: "/map" },
  { label: "Categories", href: "/categories" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Ubuntu Rewards", href: "/ubuntu-rewards" },
];

export const stats = [
  { value: "19", label: "Vetted Providers" },
  { value: "6", label: "Categories" },
  { value: "100%", label: "Background Checked" },
  { value: "0", label: "Booking Fees" },
];
