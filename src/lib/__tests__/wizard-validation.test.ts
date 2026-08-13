import { describe, it, expect } from "vitest";
import {
  wizardOfferStepSchema,
  wizardDetailsStepSchema,
  wizardPhotosStepSchema,
  wizardSubmitSchema,
  wizardToApplicationRow,
  type WizardPayload,
} from "@/lib/validations";

function ok(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  const res = schema.safeParse(value);
  return res.success;
}

const OFFER = {
  name: "Creative Arts Workshop",
  category: "Arts & Culture",
  ageMin: 4,
  ageMax: 12,
};

const DETAILS = {
  priceValue: 150,
  priceLabel: "per session",
  location: "Muizenberg",
  schedule: "Saturdays 09:00–10:30",
  phone: "+27 82 123 4567",
};

const PHOTOS = {
  description:
    "A hands-on Saturday art club where kids explore paint, clay and collage.",
  imageUrl: "",
};

const FULL: WizardPayload = { ...OFFER, ...DETAILS, ...PHOTOS, email: "teacher@example.com" };

describe("wizardOfferStepSchema — step 1 (what do you offer)", () => {
  it("accepts a valid offer step", () => {
    expect(ok(wizardOfferStepSchema, OFFER)).toBe(true);
  });

  it("rejects a missing activity name", () => {
    expect(ok(wizardOfferStepSchema, { ...OFFER, name: "" })).toBe(false);
  });

  it("rejects a missing category", () => {
    expect(ok(wizardOfferStepSchema, { ...OFFER, category: "" })).toBe(false);
  });

  it("rejects ageMin greater than ageMax", () => {
    const res = wizardOfferStepSchema.safeParse({ ...OFFER, ageMin: 12, ageMax: 4 });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.flatten().fieldErrors.ageMax?.[0]).toMatch(/minimum/i);
    }
  });

  it("accepts empty age range", () => {
    expect(ok(wizardOfferStepSchema, { ...OFFER, ageMin: null, ageMax: null })).toBe(true);
  });
});

describe("wizardDetailsStepSchema — step 2 (details)", () => {
  it("accepts a valid details step", () => {
    expect(ok(wizardDetailsStepSchema, DETAILS)).toBe(true);
  });

  it("rejects a phone not in +27 format", () => {
    expect(ok(wizardDetailsStepSchema, { ...DETAILS, phone: "0821234567" })).toBe(false);
  });

  it("rejects a missing suburb", () => {
    expect(ok(wizardDetailsStepSchema, { ...DETAILS, location: "" })).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(ok(wizardDetailsStepSchema, { ...DETAILS, priceValue: -5 })).toBe(false);
  });

  it("accepts a free listing", () => {
    expect(ok(wizardDetailsStepSchema, { ...DETAILS, priceValue: 0, priceLabel: "free" })).toBe(true);
  });
});

describe("wizardPhotosStepSchema — step 3 (photos + description)", () => {
  it("accepts a valid photos step", () => {
    expect(ok(wizardPhotosStepSchema, PHOTOS)).toBe(true);
  });

  it("rejects a too-short description", () => {
    expect(ok(wizardPhotosStepSchema, { ...PHOTOS, description: "Nice" })).toBe(false);
  });

  it("accepts an image URL or empty", () => {
    expect(ok(wizardPhotosStepSchema, { ...PHOTOS, imageUrl: "https://example.com/x.webp" })).toBe(true);
    expect(ok(wizardPhotosStepSchema, { ...PHOTOS, imageUrl: "" })).toBe(true);
  });
});

describe("wizardSubmitSchema — merged payload on submit", () => {
  it("accepts a complete application", () => {
    expect(ok(wizardSubmitSchema, FULL)).toBe(true);
  });

  it("rejects when a step is missing (e.g. no location)", () => {
    expect(ok(wizardSubmitSchema, { ...FULL, location: "" })).toBe(false);
  });

  it("requires a valid email", () => {
    expect(ok(wizardSubmitSchema, { ...FULL, email: "not-an-email" })).toBe(false);
  });
});

describe("wizardToApplicationRow — DB row mapping", () => {
  it("maps wizard fields to providerApplications columns", () => {
    expect(wizardToApplicationRow(FULL)).toEqual({
      name: "Creative Arts Workshop",
      email: "teacher@example.com",
      phone: "+27 82 123 4567",
      activityType: "Arts & Culture",
      description:
        "A hands-on Saturday art club where kids explore paint, clay and collage.",
      location: "Muizenberg",
      ageMin: 4,
      ageMax: 12,
      priceValue: 150,
      priceLabel: "per session",
      schedule: "Saturdays 09:00–10:30",
      imageUrl: null,
    });
  });

  it("maps empty optional fields to null", () => {
    const row = wizardToApplicationRow({
      name: "Club",
      category: "Sports",
      ageMin: null,
      ageMax: null,
      priceValue: null,
      priceLabel: "per session",
      location: "Claremont",
      schedule: "",
      phone: "+27 82 123 4567",
      description: "",
      imageUrl: "",
      email: "a@b.co.za",
    });
    expect(row.ageMin).toBeNull();
    expect(row.ageMax).toBeNull();
    expect(row.priceValue).toBeNull();
    expect(row.description).toBeNull();
    expect(row.schedule).toBeNull();
  });
});
