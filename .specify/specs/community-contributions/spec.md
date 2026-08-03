# Feature Spec: Community Contributions & Ubuntu Rewards

**Date:** 2026-08-03
**Constitution:** [ILALI Constitution](#constitution)
**Status:** Draft

## Vision Statement

ILALI rewards not just transactions but *contributions* — the small acts of community upliftment that make a village work. A parent helps set up the soccer field, a provider mentors a newcomer, a family distributes flyers for the holiday camp. Every act, big or small, earns Ubuntu Rewards points. The community validates the community — no central authority, no police. Sunlight is the disinfectant.

## User Scenarios

### Scenario 1: Thandi — Club leader confirms
**As a** parent who helped set up equipment at Soccer Stars
**I want to** log my contribution and have the coach confirm it
**So that** I earn Ubuntu points instantly and build my reputation

**Acceptance criteria:**
- [ ] Thandi navigates to Soccer Stars club → "Contribute" tab
- [ ] Taps "I helped today" and selects the contribution type from a short picker
- [ ] System notifies Coach Nadia (if the club leader is on ILALI): "Thandi says she helped. Confirm?"
- [ ] Coach taps ✅ → Thandi receives points instantly (mirrored on Ubuntu Feed)
- [ ] Thandi's reputation score ticks up

### Scenario 2: James — Peer vouching
**As a** parent who covered a shift at the holiday camp
**I want to** submit my contribution even though the camp leader isn't on ILALI
**So that** other parents who saw me can vouch and I earn points

**Acceptance criteria:**
- [ ] James submits "I helped at Holiday Camp — covered a shift"
- [ ] System posts to the club's community feed: "James says he helped. Can anyone confirm?"
- [ ] Two other parents from the same club see it, tap "I saw this ✅"
- [ ] After the required number of vouches (based on James's reputation tier), points are awarded
- [ ] Each voucher is publicly visible with the voucher's name

## Functional Requirements

### FR-1: Contribution Logging
Users can submit a community contribution from any club page. Each submission includes:
- Club (auto-selected if submitted from a club page)
- Contribution type from a curated taxonomy
- Optional: brief description (max 200 chars)
- Validation path (auto-selected: leader confirmation if leader exists on platform, otherwise peer vouching)

### FR-2: Contribution Taxonomy
Six categories of rewardable community acts:

| Category | Examples | Points |
|---|---|---|
| 🧹 Venue help | Set up equipment, clean up, fix something, pack up after session | 25-50 |
| 🎪 Event support | Help at tournament day, assist coach, bring snacks, marshal parking | 30-75 |
| 🤝 Community building | Welcome a new member, show a new parent around, organise a social | 20-50 |
| 📚 Knowledge sharing | Share a skill/workshop, mentor a new provider, help with admin | 50-100 |
| 📣 Outreach | Get a business to sponsor, bring in a new provider, distribute flyers | 50-200 |
| 🚗 Lift share | Existing ride-sharing system | 50 (unchanged) |

### FR-3: Two Validation Paths
**Path A — Club Leader Confirmation:**
- Available when the club's leader/provider has an ILALI account
- Leader receives notification of pending confirmation
- Leader taps confirm/deny → points awarded or rejected
- Leader's approvals are publicly visible

**Path B — Peer Vouching:**
- Available when no club leader on platform, OR as fallback
- Submission appears on club feed + global Ubuntu Feed
- Required vouches depend on submitter's reputation tier
- Voucher must: be signed in, be a member of the same club, not be the submitter, not have vouched for the same person in the past 7 days

### FR-4: Reputation System
Every user has a hidden Ubuntu Reputation Score:
```
Reputation = (verified contributions × 10) + (vouches given that were accepted × 5) + (months active × 2)
```

| Tier | Score | Vouches needed | Weekly cap | Can vouch for others? |
|---|---|---|---|---|
| Newcomer | 0-20 | 3 | 2 acts/week | No |
| Trusted | 21-100 | 2 | 3 acts/week | No |
| Elder | 100+ | 1 | 5 acts/week | Yes — becomes a validator |

### FR-5: Public Approval Ledger
Every contribution confirmation is visible on:
- The club's "Contribute" tab — chronological feed
- The global Ubuntu Feed on the Community Hub — cross-club visibility
- Format: "Name contributed Type at Club +N pts — confirmed by Confirmer"

### FR-6: Club Health Score
Each club page displays a public health metric:
```
🟢/🟡/🔴 indicator + top-line stats:
  · X members contributed this month
  · Y unique contributors
  · Top contributor spread (healthy if no single person dominates)
```

### FR-7: Anti-Gaming Safeguards
- Leader approving same member >3 times in 7 days → requires 2nd confirmation from ANOTHER club's leader or an Elder
- Leader approving same member >5 times in 14 days → 3 confirmations required + leader reputation paused
- Flagged submission → points reversed → 7-day reputation freeze
- Repeat flags → club leader review → permanent reputation cap
- Cannot vouch for: yourself, family members, same person twice in 7 days

### FR-8: Ubuntu Feed (Global)
The Community Hub (`/clubs`) gains an "Ubuntu Feed" section showing:
- Recent contributions across ALL clubs (last 7 days)
- Each item: contributor name + avatar, club name, contribution type, points, who confirmed/vouched
- Sorted by recency
- Filterable by club

### FR-9: Club Contribute Tab
Every club page at `/clubs/[slug]` gains a "Contribute" tab alongside Events, Members, Chat. Shows:
- "Log a contribution" button (primary CTA)
- Recent contributions for THIS club (chronological feed)
- Club health score card

### FR-10: Points Integration
Contributions integrate with the existing rewards earn API:
- Each confirmed contribution triggers `POST /api/rewards/earn` with `action: "community"`
- Points are mapped server-side from the contribution taxonomy (same pattern as existing earn route)
- Points appear in the user's rewards dashboard ledger

## Non-Functional Requirements

### NFR-1: Performance
- Contribution submission < 1s response time
- Ubuntu Feed loads within 2s for up to 100 items
- Vouch actions are optimistic (UI updates immediately, server syncs in background)

### NFR-2: Accessibility
- Contribution picker is keyboard-navigable
- Vouch buttons have clear focus states
- Feed items readable by screen readers (contributor → action → club → points)

### NFR-3: Trust & Transparency
- All approval/vouch actions are permanently visible
- Club health scores are computed from live data, never cached for more than 1 hour
- Reputation scores are private but tier is visible on the user's own profile

## Key Entities

- **CommunityContributions** — new table: userId, clubId, type, description, points, validationPath (leader/peer), status (pending/confirmed/flagged/rejected), confirmedBy (userId or null), createdAt
- **ContributionVouches** — vouches on peer-path submissions: contributionId, voucherId, createdAt
- **ReputationScore** — computed field on users: derived from contributions + vouches + monthsActive (no new table — calculated on read)
- **ClubHealth** — computed per club: memberContributorCount, uniqueContributors, concentrationRatio (top contributor / total)

## Visual/UX Direction

The Contribute tab should feel like a community noticeboard — warm, inviting, personal. Small acts celebrated publicly.

- **Contribution picker**: A grid of emoji-led cards (🧹 Venue help, 🎪 Event support, 🤝 Community, 📚 Knowledge, 📣 Outreach) — tap one, confirm, done. No complex forms.
- **Confirmation flow**: A subtle toast/banner for the club leader: "Thandi says she helped set up today — confirm?" with ✅ and ✕ buttons. Non-intrusive, quick.
- **Ubuntu Feed**: Cards with contributor avatar + name + club badge + contribution type + confirmer name. Small emoji reaction row. Feels alive.
- **Club Health**: A small dashboard card — green/orange/red dot + 3 numbers. Clean, glanceable.
- **Empty state**: "Be the first to contribute! Help out at {club name} and earn Ubuntu points." Warm tone.

## Assumptions

- Club leaders (providers) are already on ILALI and have accounts — Path A works for most clubs
- The existing rewards earn/redeem API infrastructure handles the points side
- The existing club pages with tabs (Events, Members, Chat) support adding a new tab without breaking layout
- Contribution vouching doesn't need mobile notifications yet — feed visibility is sufficient for MVP
- Reputation is a computed field, not a separate DB table — recalculated on every read (acceptable at our scale)

## Out of Scope

- Mobile push notifications for vouching requests (in-app feed is MVP)
- Leaderboard / ranking of top contributors (privacy-first — contributions are visible but not competitive)
- Redeeming community contribution points for anything beyond existing reward types
- AI-powered contribution suggestion ("You've been at 3 Soccer Stars practices this week — log a contribution?")
- Integration with external verification (geofencing at venues, QR code check-ins)
- WhatsApp-based contribution logging (email/web-app only for MVP)
