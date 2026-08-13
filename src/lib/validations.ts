import { z } from "zod";
import type { providerApplications } from "@/lib/db/schema";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CHILD_AGE_MIN = 1;
export const CHILD_AGE_MAX = 18;

/** Shared atoms so the provider + wizard schemas can't drift silently. */
export const PHONE_RE = /^\+27\s?\d{2}\s?\d{3}\s?\d{4}$/;
export const AGE_BOUNDS = { min: 0, max: 18 };

// ── Provider Application Schema ──
export const providerApplicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(PHONE_RE, "Phone must be in +27 format (e.g. +27 82 123 4567)")
    .optional()
    .or(z.literal("")),
  activity_type: z.string().min(1, "Please select an activity type"),
  description: z.string().optional(),
  location: z.string().optional(),
  age_min: z
    .number()
    .int("Age must be a whole number")
    .min(AGE_BOUNDS.min, "Age cannot be negative")
    .max(AGE_BOUNDS.max, `Age max is ${AGE_BOUNDS.max}`)
    .optional()
    .nullable(),
  age_max: z
    .number()
    .int("Age must be a whole number")
    .min(AGE_BOUNDS.min, "Age cannot be negative")
    .max(AGE_BOUNDS.max, `Age max is ${AGE_BOUNDS.max}`)
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

// ── Provider Wizard Step Schemas (Painless Journeys Phase 4, T024/T025) ──
// One schema per wizard step — the client validates + autosaves a step at a
// time, and the final submit re-validates the merged payload. All schemas are
// pure (no DB access) so they stay unit-testable.
export const WIZARD_STEP_COUNT = 4;

export const wizardOfferStepSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Give your activity a name (at least 2 characters)")
      .max(100),
    category: z.string().min(1, "Pick a category"),
    ageMin: z
      .number()
      .int("Age must be a whole number")
      .min(0, "Age cannot be negative")
      .max(18, "Age max is 18")
      .optional()
      .nullable(),
    ageMax: z
      .number()
      .int("Age must be a whole number")
      .min(0, "Age cannot be negative")
      .max(18, "Age max is 18")
      .optional()
      .nullable(),
  })
  .refine(
    (d) => d.ageMin == null || d.ageMax == null || d.ageMin <= d.ageMax,
    {
      message: "Minimum age cannot be greater than maximum age",
      path: ["ageMax"],
    }
  );

export const wizardDetailsStepSchema = z.object({
  priceValue: z
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .optional()
    .nullable(),
  priceLabel: z.string().trim().min(1).default("per session"),
  location: z.string().trim().min(1, "Pick the suburb where you run your activity"),
  schedule: z.string().max(300, "Keep your schedule short (300 characters max)").optional(),
  phone: z
    .string()
    .regex(
      /^\+27\s?\d{2}\s?\d{3}\s?\d{4}$/,
      "Phone must be in +27 format (e.g. +27 82 123 4567)"
    ),
});

export const wizardPhotosStepSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Tell parents a bit more (at least 10 characters)")
    .max(1500),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const wizardSubmitSchema = z.object({
  ...wizardOfferStepSchema.shape,
  ...wizardDetailsStepSchema.shape,
  ...wizardPhotosStepSchema.shape,
  email: z.string().email("Please enter a valid email address"),
});

/** All wizard step schemas in order — single source for client + server. */
export const WIZARD_STEP_SCHEMAS = [
  wizardOfferStepSchema,
  wizardDetailsStepSchema,
  wizardPhotosStepSchema,
  wizardSubmitSchema,
] as const;

/** Map wizard form keys to providerApplications columns (single source). */
export const WIZARD_COLUMN_MAP: Record<
  string,
  keyof typeof providerApplications.$inferInsert
> = {
  name: "name",
  category: "activityType",
  ageMin: "ageMin",
  ageMax: "ageMax",
  priceValue: "priceValue",
  priceLabel: "priceLabel",
  location: "location",
  schedule: "schedule",
  phone: "phone",
  description: "description",
  imageUrl: "imageUrl",
};

export type WizardPayload = z.infer<typeof wizardSubmitSchema>;

/** Map a merged wizard payload onto providerApplications column names. */
export function wizardToApplicationRow(payload: WizardPayload) {
  return {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    activityType: payload.category,
    description: payload.description || null,
    location: payload.location || null,
    ageMin: payload.ageMin ?? null,
    ageMax: payload.ageMax ?? null,
    priceValue: payload.priceValue ?? null,
    priceLabel: payload.priceLabel ?? null,
    schedule: payload.schedule || null,
    imageUrl: payload.imageUrl || null,
  };
}

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
