export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string;
  providerName: string;
  location: string;
  distance: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  rating: number;
  reviewCount: number;
  price: string;
  priceValue: number;
  priceLabel: string;
  image: string;
  featured?: boolean;
  isFree?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  location: string;
  rating: number;
  reviewCount: number;
  image: string;
  capacity?: string;
  amenities?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: "parent" | "provider";
  location: string;
  quote: string;
  initial: string;
}

export interface FilterOption {
  id: string;
  label: string;
  options: string[];
}
