import { Category, Provider, Venue, Testimonial } from "./types";

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
    id: "venues",
    name: "Venues",
    slug: "venues",
    description: "Studios, halls, and outdoor spaces for activities",
    icon: "🏛️",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "education",
    name: "Education",
    slug: "education",
    description: "STEM, coding, tutoring, and academic support",
    icon: "📚",
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    id: "new-used-equipment",
    name: "New & Used Equipment",
    slug: "equipment",
    description: "Buy and sell activity gear and equipment",
    icon: "🛒",
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "educational-support",
    name: "Educational Support",
    slug: "educational-support",
    description: "Extra lessons, remedial support, and coaching",
    icon: "✏️",
    color: "bg-teal-100 text-teal-600",
  },
  {
    id: "volunteering",
    name: "Volunteering",
    slug: "volunteering",
    description: "Community service and volunteer opportunities",
    icon: "🤝",
    color: "bg-rose-100 text-rose-600",
  },
  {
    id: "school-open-days",
    name: "School Open Days",
    slug: "school-open-days",
    description: "School tours, open days, and enrollment events",
    icon: "🏫",
    color: "bg-violet-100 text-violet-600",
  },
];

export const providers: Provider[] = [
  {
    id: "1",
    name: "ILALI Creative Arts Workshop",
    slug: "ilali-creative-arts-workshop",
    category: "Arts & Culture",
    categorySlug: "arts-culture",
    description:
      "A hands-on creative arts and crafts experience where children explore their imagination through various artistic mediums in a safe, guided environment.",
    providerName: "ILALI Academy",
    location: "Muizenberg",
    distance: "2.5km",
    ageRange: "12-15 years",
    ageMin: 12,
    ageMax: 15,
    rating: 0,
    reviewCount: 0,
    price: "R150",
    priceValue: 150,
    priceLabel: "per session",
    image:
      "https://jbmdbhqgmbxufqtstfgi.supabase.co/storage/v1/object/public/activity-images/ilali-academy/1770719332577-hzgrp8.png",
  },
  {
    id: "2",
    name: "QA Academy Holiday Camp",
    slug: "qa-academy-holiday-camp",
    category: "Holiday Programs",
    categorySlug: "holiday-programs",
    description:
      "Action-packed school holiday camp with sports, outdoor adventures, arts & crafts, and team-building activities for active kids during school breaks.",
    providerName: "ILALI Academy",
    location: "Muizenberg",
    distance: "2.5km",
    ageRange: "8-14 years",
    ageMin: 8,
    ageMax: 14,
    rating: 0,
    reviewCount: 0,
    price: "R2,500",
    priceValue: 2500,
    priceLabel: "per session",
    image:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800",
    featured: true,
  },
  {
    id: "3",
    name: "QA Academy Term Programme",
    slug: "qa-academy-term-programme",
    category: "Arts & Culture",
    categorySlug: "arts-culture",
    description:
      "A structured term-time arts and crafts programme designed to nurture creativity, fine motor skills, and self-expression in young children.",
    providerName: "ILALI Academy",
    location: "Muizenberg",
    distance: "2.5km",
    ageRange: "6-12 years",
    ageMin: 6,
    ageMax: 12,
    rating: 0,
    reviewCount: 0,
    price: "R1,500",
    priceValue: 1500,
    priceLabel: "per session",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
  },
  {
    id: "4",
    name: "Creative Expression Improv Through Art",
    slug: "creative-expression-improv-through-art",
    category: "Arts & Culture",
    categorySlug: "arts-culture",
    description:
      "An improv-based art programme where teens explore visual storytelling, mixed media, and creative expression in a supportive community setting.",
    providerName: "Butterfly Art Project",
    location: "Vrygrond",
    distance: "12.5km",
    ageRange: "12-18 years",
    ageMin: 12,
    ageMax: 18,
    rating: 0,
    reviewCount: 0,
    price: "Free",
    priceValue: 0,
    priceLabel: "per session",
    isFree: true,
    image:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
  },
];

export const venues: Venue[] = [
  {
    id: "1",
    name: "Main Theatre",
    slug: "main-theatre",
    type: "studio",
    location: "Newlands",
    rating: 4.5,
    reviewCount: 12,
    image: "",
    capacity: "50 people",
    amenities: ["Stage", "Sound system", "Lighting", "Parking"],
  },
  {
    id: "2",
    name: "Dance Studio",
    slug: "dance-studio",
    type: "studio",
    location: "Claremont",
    rating: 4.5,
    reviewCount: 8,
    image: "",
    capacity: "30 people",
    amenities: ["Mirrors", "Barre", "Wooden floor", "Changing rooms"],
  },
  {
    id: "3",
    name: "Training Fields",
    slug: "training-fields",
    type: "outdoor",
    location: "Newlands",
    rating: 4.5,
    reviewCount: 15,
    image: "",
    capacity: "100+ people",
    amenities: ["Floodlights", "Changing rooms", "Parking", "Canteen"],
  },
  {
    id: "4",
    name: "ILALI Academy Studio",
    slug: "ilali-academy-studio",
    type: "studio",
    location: "Muizenberg",
    rating: 4.5,
    reviewCount: 6,
    image: "",
    capacity: "40 people",
    amenities: ["WiFi", "Projector", "Kitchen", "Garden access"],
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
  { label: "Categories", href: "/categories" },
  { label: "How It Works", href: "/how-it-works" },
];

export const stats = [
  { value: "500+", label: "Providers" },
  { value: "4.8", label: "Avg Rating" },
  { value: "100%", label: "Background Checked" },
  { value: "50+", label: "Activities" },
];
