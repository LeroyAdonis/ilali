# ILALI Launch HQ — Notion Workspace Scaffold

Purpose: single source of truth for the Sept 2026 Assitej SA provider onboarding launch.
Created by Ricky for Leroy. Pushed to Notion via API once NOTION_API_KEY is available.

---

## Structure

```
ILALI Launch HQ (root page)
├── 🎯 Launch Dashboard (overview page w/ links + counts)
├── 🗄️ Launch Tasks (database)
├── 🏢 Provider Onboarding (database)
├── ⚠️ Risks & Blockers (database)
├── 📝 Decisions Log (database)
├── 🤝 Meeting Notes (database)
├── 📦 Backlog (database)
├── 🚀 Assitej SA Onboarding Plan (page)
└── 📅 Launch Checklist (page)
```

---

## Database 1: Launch Tasks

Properties:
- Name (title)
- Status (select): Backlog / This Week / In Progress / Done / Blocked / Cancelled
- Priority (select): Critical / High / Medium / Low
- Owner (select): Ricky / Leroy / George / Yvette
- Deadline (date)
- Spec Ref (rich_text) — e.g. provider-portal T023, backlog #16
- Blocked By (relation → Risks & Blockers)
- Notes (rich_text)

Initial seed rows (from audit — to be finalised after codebase scan):
| Name | Status | Priority | Owner | Deadline | Spec Ref |
|---|---|---|---|---|---|
| (populated after audit completes) | | | | | |

---

## Database 2: Provider Onboarding (per provider)

Properties:
- Provider Name (title)
- Organisation (select): Assitej SA / Direct / Referral / Other
- Contact Person (rich_text)
- Email (email)
- Phone (phone)
- Location (select): Cape Town / National / Other
- Stage (select): Listed → Applied → Approved → Account Created → Claimed → Listing Live → Needs Help
- Onboarding Date (date)
- Category (select from ILALI categories)
- Notes (rich_text)

Stages = exact pipeline states from ILALI codebase:
1. **Listed** — provider record exists (seeded or imported)
2. **Applied** — submitted application via /providers/signup
3. **Approved** — admin approved in /admin/applications
4. **Account Created** — user account + temp password created (POST /api/admin/applications/[id])
5. **Claimed** — provider logged in + set password (/auth/create-password)
6. **Listing Live** — profile complete, visible to parents

---

## Database 3: Risks & Blockers

Properties:
- Risk (title)
- Status (select): Open / Mitigating / Closed
- Severity (select): Critical / High / Medium / Low
- Owner (select)
- Mitigation (rich_text)
- Raised (date)

Seed rows:
| Risk | Status | Severity | Owner | Mitigation |
|---|---|---|---|---|
| Temp password delivery — no email infra | Open | Critical | Leroy | Claim flow via WhatsApp/phone; email once ilali.co hosting confirmed |
| Bulk import of 100+ providers absent | Open | High | Leroy | Migration script + admin bulk-create; CSV import |
| Provider adoption friction (non-technical theatre facilitators) | Open | Medium | George | Yvette + Assitej word of mouth; simple claim link |
| Neon free tier limits (256MB) | Open | Medium | Leroy | Upgrade path to $19/m |
| ilali.co email hosting unconfirmed | Open | Medium | George | Design without email; add when confirmed |

---

## Database 4: Decisions Log

Properties:
- Date (date)
- Decision (title)
- Context (rich_text)
- Options (rich_text)
- Decided By (select)

Seed rows (from existing project history):
| Date | Decision | Context | Options | Decided By |
|---|---|---|---|---|
| 2026-08-04 | Provider portal Phase 1+2 combined | Grill-me session | Separate phases vs combined | Leroy |
| 2026-08-04 | Admin approval auto-creates provider account w/ temp password | Provider portal spec | Manual account creation vs auto | Leroy |
| 2026-08-05 | Reverted Hallmark structural redesign on ILALI | Design risk — keep current layouts | Hallmark redesign vs revert | Leroy |
| 2026-08-06 | Assitej SA onboarding begins Sept 1, Cape Town first | George + Yvette Hardie agreement | National vs CT-first | George/Yvette |

---

## Database 5: Meeting Notes

Properties:
- Date (date)
- Topic (title)
- Attendees (multi_select): Leroy / George / Yvette / Ricky
- Action Items (rich_text)
- Notes (rich_text)

---

## Database 6: Backlog

Mirror of .specify/backlog.md — 25 items with triggers. Pulled into Launch Tasks when trigger met.

---

## Page: Assitej SA Onboarding Plan

Content:
- **Context:** Assitej SA (theatre for young people, CEO Yvette Hardie) was main NPO partner for BASA-funded pilot. 100s of service providers (individual facilitators + partner orgs) nationally. Yvette agrees Sept 2026 start. Cape Town first.
- **Goal:** Onboard first cohort of CT providers by Sept 1 2026; Assitej spreads word.
- **Cohort plan:** (1) Seed/import provider records → (2) claim flow or application → (3) admin approval → (4) account created → (5) provider claims + completes profile → (6) listing live.
- **Owner:** George (partner comms), Leroy (tech), Ricky (execution), Yvette (Assitej comms).
- **Milestones:** T-0 = Sept 1.

## Page: Launch Checklist

- [ ] Codebase audit complete (Ricky) — Aug 6
- [ ] Blockers fixed (temp password delivery / bulk import)
- [ ] Test suite green (81 unit + 10 E2E)
- [ ] Production deploy (main → ilali.vercel.app)
- [ ] Assitej comms ready (Yvette)
- [ ] First cohort import (CT providers)
- [ ] Onboarding day (Sept 1)
