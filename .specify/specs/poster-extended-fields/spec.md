# Poster Import — Extended Capture Fields (George)

Spec status: APPROVED 2026-08-10 (Leroy via chat; George requested the field list)
Build status: schema pushed; implementation in flight.

## Why

George reviews poster uploads in `/admin/poster-import`. The current pipeline captures
only core fields (name, category, description, location, ages, price, phone, website,
email, tags). Posters carry much more — venue, dates, times, booking info — which
George currently has to look up again after the draft is saved. He asked for the
poster pipeline to capture the full picture into the editable draft profile.

## Field list (George, verbatim)

| Field | DB column | Type | Notes |
|---|---|---|---|
| Venue | `venue` | text | e.g. "Sea Point Community Hall" |
| Address | `address` | text | full street address |
| Dates (start/end) | `date_start`, `date_end` | text | free text (posters are messy): "12 July" or ISO |
| Times (start/end) | `time_start`, `time_end` | text | free text: "14:00" / "15:30" |
| Day of week | `day_of_week` | text | "Mon, Wed, Fri" or "Saturdays" |
| Contact name | `contact_name` | text | person to contact |
| Booking information | `booking_info` | text | "WhatsApp to book", "limited spaces" |
| Additional information | `additional_info` | text | capture ALL text on the poster not covered above |
| Image | `image_url` (existing) | text | the poster itself is the listing image (already captured as `poster.imagePath` → `imageUrl` on save) |
| Logo | `logo_path` | text | optional logo upload (base64 data URL, same pattern as poster image) |

## Scope

1. **AI extraction** (`src/lib/ai/extract-poster.ts`): extend `PosterExtract` interface
   (DONE), the system prompt (new fields with rules), and `normaliseExtract` to pass
   the new string fields through.
2. **Review desk form** (`src/app/admin/poster-import/poster-import-client.tsx`):
   extend `FormState` + add inputs for all new fields; add a Logo file upload
   (base64 → `logoPath`); populate from `extracted` on upload; include new fields
   in the save body.
3. **Save route** (`src/app/api/admin/poster-import/[id]/save/route.ts`): persist the
   new fields into `providerApplications`.
4. **Draft edit form** (`src/app/admin/applications/ApplicationEditForm.tsx`):
   add the new fields so George can edit them post-save.
5. **ApplicationCard** (`src/app/admin/applications/ApplicationCard.tsx`): extend the
   `Application` type + show venue/address/contact/booking line when present.
6. **priceValue unit**: `providerApplications.priceValue` is Rands (whole) — do NOT
   multiply/divide. Cents conversion happens at approval (`approveApplication`).

## Acceptance criteria

- [ ] Uploading a poster with venue/dates/times/booking text → AI extraction fills the new fields
- [ ] Review desk shows all new fields as editable inputs; Logo upload works (base64 preview)
- [ ] Save persists all new fields into `providerApplications`
- [ ] Applications list "Edit draft" form includes the new fields and PATCHes them
- [ ] ApplicationCard shows a venue/address/contact line when data exists
- [ ] `npx tsc --noEmit` clean; `npx vitest run` green; build + deploy to ilali.vercel.app

## Not in scope (backlog)

- Displaying the extended fields on the live provider/club pages (`/clubs/[slug]`) —
  that's a provider-portal/profile-page change, separate ticket.
- Structured date/time columns with validation (posters are free text; keep text).
