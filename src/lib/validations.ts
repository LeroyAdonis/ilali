import { z } from "zod";

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
