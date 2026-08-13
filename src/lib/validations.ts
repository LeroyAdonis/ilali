import { z } from "zod";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CHILD_AGE_MIN = 1;
export const CHILD_AGE_MAX = 18;

// ── Provider Application Schema ──
export const providerApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(
      /^\+27\s?\d{2}\s?\d{3}\s?\d{4}$/,
      "Phone must be in +27 format (e.g. +27 82 123 4567)"
    )
    .optional()
    .or(z.literal("")),
  activity_type: z.string().min(1, "Please select an activity type"),
  description: z.string().optional(),
  location: z.string().optional(),
  age_min: z
    .number()
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(18, "Age max is 18")
    .optional()
    .nullable(),
  age_max: z
    .number()
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(18, "Age max is 18")
    .optional()
    .nullable(),
  price_value: z
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .optional()
    .nullable(),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type ProviderApplicationInput = z.infer<
  typeof providerApplicationSchema
>;

// ── Referral Schema ──
export const referralSchema = z.object({
  referrer_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  referrer_email: z.string().email("Please enter a valid email address"),
  provider_name: z
    .string()
    .min(2, "Provider name must be at least 2 characters")
    .max(100),
  provider_email: z.string().email("Please enter a valid email address"),
  provider_phone: z.string().optional().or(z.literal("")),
});

export type ReferralInput = z.infer<typeof referralSchema>;

// ── Admin: Provider Creation ──
export const adminProviderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  providerName: z.string().min(1, "Provider name is required"),
  location: z.string().min(1, "Location is required"),
  ageMin: z.number().int().min(0).max(18),
  ageMax: z.number().int().min(0).max(18),
  priceValue: z.number().min(0), // in rands, converted to cents
  priceLabel: z.string().optional().default("per session"),
  imageUrl: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  verified: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
}).refine(data => data.ageMin <= data.ageMax, {
  message: "Minimum age cannot be greater than maximum age",
  path: ["ageMax"],
});

export type AdminProviderInput = z.infer<typeof adminProviderSchema>;
