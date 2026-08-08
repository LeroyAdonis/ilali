# Feature Spec: WS-7 — Poster-to-Profile (AI Provider Intake)

**Date:** 2026-08-07
**Constitution:** [.specify/memory/constitution.md](../memory/constitution.md)
**Status:** Clarified (2026-08-07 — web enrichment in MVP; free+swappable search backend; outreach = semi-auto wa.me default + auto-ready behind flag)
**Workstream:** WS-7 (follows WS-1..5 shipped)

## Vision Statement

An admin (Leroy or George) sees a service provider's poster in the "Fun with Kids" WhatsApp group — a dance class, a holiday programme, a soccer clinic. They drop the poster into ILALI. Within a minute, ILALI has read the poster with AI, found the provider on the web, and created a complete draft profile. One click later, the provider receives a friendly WhatsApp message: *"Hi! We saw your class in the Fun with Kids group and have already listed you on ILALI. Claim your profile here."* The provider feels found, not sold. ILALI grows its supply side from a WhatsApp group — exactly the community-powered growth the constitution promises.

## User Scenarios

### Scenario 1: Admin imports a poster
**As an** ILALI admin
**I want to** upload a poster image from the Fun with Kids WhatsApp group
**So that** the provider's details are extracted automatically instead of typed by hand

**Acceptance criteria:**
- [ ] Admin uploads a poster (JPG/PNG/WebP, up to 10MB) from an admin-only page
- [ ] System shows the poster preview + extracted fields within 60 seconds
- [ ] Extracted fields: activity/business name, category, description, location/suburb, age range, price (if visible), contact phone/WhatsApp number, website/socials (if visible)
- [ ] Every field is editable before saving (AI makes mistakes — human approves)
- [ ] If AI extraction fails (NIM down), the admin sees a clear message and can fill the form manually — no dead end
- [ ] Saving creates a provider application with `onboardSource = "poster"`

### Scenario 2: Web search fills the gaps
**As an** ILALI admin
**I want to** auto-enrich the extracted profile from public web sources
**So that** the profile is complete even when the poster is sparse

**Acceptance criteria:**
- [ ] For a poster with partial info, system attempts a web search for the provider/activity name
- [ ] Found info (website, Facebook/Instagram page, reviews, fuller description) is shown as **suggestions** next to the extracted fields, clearly marked "found on the web — verify before saving"
- [ ] Admin accepts or rejects each suggestion
- [ ] No suggestion is silently merged into the profile — human confirms everything

### Scenario 3: Outreach to the provider (semi-auto today)
**As an** ILALI admin
**I want to** notify a provider that their profile exists
**So that** they come claim it (conversion)

**Acceptance criteria:**
- [ ] On the imported application, admin clicks "Notify provider"
- [ ] If the provider has a phone/WhatsApp number: opens a `wa.me/<number>` link pre-filled with a personalised message (provider name, activity name, claim link/instructions) — admin reviews and hits send in WhatsApp
- [ ] If no number: admin sees a clear note ("no contact number on poster") and a copy-ready email draft is available for manual use
- [ ] The outreach message template is centralised and editable (not hardcoded)
- [ ] Admin can mark the provider as "contacted" (timestamp recorded)

### Scenario 4: Outreach to the provider (auto — behind a flag)
**As an** ILALI admin
**I want to** trigger automatic WhatsApp sending
**So that** no human click is needed when the WhatsApp Business API is live

**Acceptance criteria:**
- [ ] A `sendWhatsApp()` function exists with a single interface; today it returns the wa.me link, tomorrow it calls the WhatsApp Business API
- [ ] When WhatsApp Business API is configured (SIM number + Meta verification + approved template), the same "Notify provider" action sends automatically
- [ ] Feature flag: `WHATSAPP_AUTO_SEND=true/false` controls which path runs — no code change needed to flip
- [ ] Sending state is tracked on the application (pending → sent → error)

## Functional Requirements

### FR-1: Poster upload & preview
Admin-only route accepts image upload (JPG/PNG/WebP, ≤10MB), stores it, shows preview. No auth bypass: non-admins get 403/redirect.

### FR-2: AI vision extraction
The image is sent to the vision model (NVIDIA NIM — free). Output is structured JSON: name, category, description, location, ageMin/ageMax, priceValue, phone, website/socials, tags. Graceful failure: if the model errors or times out, the pipeline still lands on a manual form (extraction failure is NEVER a dead end).

### FR-3: Web enrichment
Optional second stage: given the extracted name, search the web for the provider. Returns candidate facts flagged as "web-sourced, verify". Each is individually accept/reject.

### FR-4: Draft application creation
Saving creates a `providerApplications` row (reusing the WS-1 approval flow) with `onboardSource = "poster"`, the poster image stored, and all accepted fields. The application appears in the existing `/admin/applications` queue with a "poster" badge.

### FR-5: Outreach
"Notify provider" on an application:
- Semi-auto (default): generates personalised `wa.me` deep link + copy-ready email draft fallback
- Auto (flagged): calls `sendWhatsApp()` which will hit the Business API when configured
- Both paths record a "contacted" timestamp and are idempotent (no double-send)

### FR-6: Outreach message templates
Central, editable template store (at minimum: WhatsApp message, email subject, email body) with `{{providerName}}`, `{{activityName}}`, `{{claimUrl}}` variables.

## Non-Functional Requirements

### NFR-1: Performance
Poster upload → extraction results visible within 60s (NIM vision ~5-10s typical, upload + web search dominate). Admin page loads < 2s.

### NFR-2: Security
Upload + extraction + outreach endpoints admin-gated (Better Auth role=admin). Uploaded images sanitised (extension + MIME check, no executable content). No provider PII exposed outside admin.

### NFR-3: Reliability
NIM down → manual form fallback, no blocked workflow. WhatsApp API absent → semi-auto path, no broken send. Outreach idempotent.

### NFR-4: Accessibility (admin UI)
WCAG 2.1 AA: keyboard navigable, labelled form fields, focus states.

## Key Entities

- **ProviderApplication** (existing) — gains `onboardSource: "poster"` values; linked to poster metadata
- **PosterImport** (new, small) — id, original image path, extracted JSON snapshot, enrichment suggestions JSON, status (draft/saved/contacted), contactedAt, outreachMethod
- **Provider** (existing) — created on approval, unchanged
- **MessageTemplate** (new, small) — key (whatsapp/email-subject/email-body), subject, body, updatedAt

## Visual/UX Direction

Admin experience, consistent with existing ILALI admin (light, teal `ilali-*` tokens, rounded cards, Inter). The import page feels like a two-pane "review desk":
- Left pane: the poster image, large, with a status strip (extracting → complete/failed)
- Right pane: the extracted profile form with fields, each showing an "AI found: X" state; web-sourced fields show a small globe icon + "verify" chip; accept/reject buttons inline
- Bottom bar: sticky actions — "Save application" / "Notify provider" / "Cancel"
The feeling: the admin is reviewing an AI's homework — fast, but the human signs off. Success state after notify shows a warm confirmation: "✅ Message ready — sent via WhatsApp" (semi-auto) or "✅ Sent automatically" (auto).

## Assumptions

- **NVIDIA NIM vision model** (`meta/llama-3.2-90b-vision-instruct`) is free and available — poster OCR + extraction runs on it (matches the vision bake-off winner)
- **Email (Resend) remains blocked** until ilali.co is verified — outreach primary channel is WhatsApp; email draft is a manual fallback only
- **WhatsApp Business API** requires a dedicated SIM + Meta Business verification — both pending on George; the auto path ships dormant behind the flag
- **Fun with Kids group posters** contain phone/WhatsApp numbers often enough (majority) that semi-auto outreach is viable
- Reuse the existing admin approval flow (WS-1) — no new auth/approval machinery
- **Web enrichment backend = free, swappable** (confirmed with Leroy 2026-08-07): DuckDuckGo HTML search via Jina Reader (`r.jina.ai`, zero key, verified working) → scrape top results → NVIDIA NIM text model synthesizes suggested fields. Mirrors the agent-reach skill approach already proven in Hermes. Upgrade path: Webclaw (already on zahra, v0.6.16) for bot-protected pages, or Serper/Tavily/Exa key (~R50-300/mo) if quality is poor. `WEB_SEARCH_PROVIDER` env var selects the backend — code is swappable without rebuild.

## Out of Scope

- **Actual WhatsApp Business API sending** until George provides SIM + Meta verification (auto path is architected but flagged-off; will be activated in a follow-up WS)
- **Email delivery automation** (blocked by ilali.co verification — separate WS-2 dependency)
- **Social media posting** (Postiz pipeline — separate initiative)
- **Batch/queue processing** of many posters at once (MVP = one poster at a time; bulk import of posters is a future spec)
- **Public-facing "claim your profile" self-serve page** beyond the existing claim flow (WS-3) — outreach links to the existing claim page

## Spec Quality Checklist
- [x] No implementation details beyond naming existing systems (intentional, for reuse clarity)
- [x] Focused on user value and business needs
- [x] All mandatory sections completed
- [ ] `[NEEDS CLARIFICATION]` markers: none yet — clarify phase to confirm open questions (below)
- [x] Requirements testable and unambiguous
- [x] Acceptance criteria measurable
- [x] Edge cases identified (NIM down, no phone, web enrichment rejection, double-send)
- [x] Scope bounded (5 out-of-scope items)
- [x] Dependencies and assumptions identified
- [x] Visual/UX direction concrete
