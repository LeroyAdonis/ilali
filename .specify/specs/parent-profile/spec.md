# Feature Spec: Parent Profile & Personalised Home Page

**Date:** 2026-08-03
**Constitution:** [ILALI Constitution](../memory/constitution.md)
**Status:** Clarified

## Vision Statement

When a parent signs into ILALI, the home page should feel like THEIR home — not a generic landing page they have to scroll past. They should see their children, their upcoming week of activities, their clubs, their community, and their rewards at a glance. The page should answer "what's happening with my kids this week?" in under 2 seconds, while still offering the discovery tools (AI chat, browse, categories) for finding new activities.

The parent who has not yet added children should still feel welcome — community content is visible, popular suggestions are shown, and gentle nudges explain what becomes possible once they add their kids.

## User Scenarios

### Scenario 1: Returning parent — signed in, children added

**As a** parent with children on ILALI
**I want to** see my personalised dashboard when I sign in
**So that** I know what's happening this week, which clubs my kids are in, and what's new in my community

**Acceptance criteria:**
- [ ] Landing on `/home` after sign-in shows a personalised greeting ("Welcome back, Thandi 👋")
- [ ] "Your Kids" section shows each child with age, interests, and availability summary
- [ ] "This Week" shows upcoming scheduled club events in a calendar-style list (day, time, activity, provider, child's name)
- [ ] "This Week" also shows suggested activities based on children's age and interests, visually distinct from scheduled events (dotted border, "Suggested for Sarah" tag)
- [ ] Club cards show clubs the parent has joined, with unread chat indicators
- [ ] Points balance widget shows current Ubuntu Rewards points at a glance
- [ ] Notification bell (🔔) in the header area shows a dropdown with recent rewards, ride confirmations, and community activity
- [ ] Below the personal section, the discovery area (AI chat, trending categories, browse) remains accessible
- [ ] Scheduled events and suggestions regenerate on page load (no stale data)
- [ ] A signed-out visitor sees the current landing page unchanged

### Scenario 2: New parent — signed in, no children added

**As a** parent who signed up but hasn't added children
**I want to** see what ILALI offers and understand what I'll unlock
**So that** I'm motivated to add my children without feeling locked out

**Acceptance criteria:**
- [ ] Landing on `/home` shows "Welcome back, [Name] 👋" greeting
- [ ] A warm amber nudge card explains what adding children unlocks: personalised matches, club joining, ride sharing
- [ ] The nudge card has a prominent "Add Your Children →" button that opens the ChildForm modal
- [ ] "This Week" shows an empty state with popular suggestions (not age-filtered — just popular providers near the parent's area)
- [ ] Community feed (clubs, ride board, activity) is fully visible — not gated
- [ ] "Join Club" buttons show "Add a child to join this club" toast when clicked
- [ ] Discovery area (AI chat, browse) is fully functional

### Scenario 3: Parent wants to edit their children

**As a** parent whose child's interests or age have changed
**I want to** edit a child's profile without leaving the home page
**So that** suggestions stay relevant as my child grows

**Acceptance criteria:**
- [ ] Each child in "Your Kids" has an "Edit ✏️" button
- [ ] Clicking "Edit" opens a modal pre-filled with the child's current data (name, age, interests, suburb, availability)
- [ ] All fields from onboarding Step 2 are editable
- [ ] Saving updates the child's record and refreshes the week suggestions
- [ ] "Add another child" button opens the same modal with empty fields
- [ ] The modal works on mobile (bottom sheet style) and desktop (centered modal)

### Scenario 4: Parent wants to update their own profile

**As a** parent whose name, suburb, or notification preferences have changed
**I want to** update my profile settings
**So that** my display name is correct and I control what notifications I receive

**Acceptance criteria:**
- [ ] A gear icon ⚙️ near the greeting opens a compact settings panel
- [ ] Panel shows: display name (editable text field), suburb (dropdown or text), notification toggles (notifyNewProviders, notifyCommunity, notifyRewards)
- [ ] Saving updates the user record and notification preferences
- [ ] Changes to display name reflect immediately in the greeting and across the app

### Scenario 5: Notification check

**As a** parent
**I want to** see recent activity notifications
**So that** I know about rewards earned, ride confirmations, and community updates

**Acceptance criteria:**
- [ ] Bell icon 🔔 is visible in the header area of the personalised dashboard
- [ ] Clicking the bell opens a dropdown showing:
  - Last 5 reward point entries ("You earned +50 pts for a club invite")
  - Last 3 ride confirmations ("Thandi confirmed your ride request")
  - Last 3 community contributions you interacted with
- [ ] Read-only — no new database table, polling, or read/unread state
- [ ] Dropdown closes on clicking outside or tapping the bell again

## Functional Requirements

### FR-1: Personalised Dashboard Layout
The `/home` page MUST detect authentication state and render one of two layouts:
- **Signed out:** Current landing page (hero, AI chat, stats, categories, providers) — unchanged
- **Signed in:** Personalised dashboard above the fold, discovery sections below

### FR-2: "Your Kids" Card
Display each child from the `childProfiles` table with:
- Name and age
- Interest chips (max 4 shown, "+N more" if more exist)
- Availability summary (e.g., "Mon/Wed afternoons, Sat mornings")
- "Edit ✏️" button per child
- "+ Add another child" button at the bottom

### FR-3: Week Planner — Scheduled Events
Query `clubEvents` joined with `clubMemberships` for all clubs the parent has joined. Display upcoming events within the next 7 days, sorted by date/time. Each event shows:
- Day of week + time (Space Mono)
- Activity/provider name
- Club colour accent bar (teal/gold/purple/orange rotated)
- Child name badge (if the event has child-specific data)

Maximum 10 scheduled events shown. "View all →" link if more exist.

### FR-4: Week Planner — Suggested Activities
Score providers against each child's age range and interests using a deterministic algorithm:

**Scoring (0-100):**
- Age match (0-40): child's age falls within provider's `ageMin`-`ageMax` = 40 points. Within 1 year = 20 points. Mismatch = 0.
- Interest overlap (0-40): each shared interest between child's interests and provider's tags = 10 points, max 40.
- Proximity bonus (0-20): provider is in the same suburb as the child = 20 points. Neighbouring suburb = 10.

**Rules:**
- Max 5 suggestions per child
- Dedupe: exclude providers whose events appear in the child's scheduled list
- Scoring runs on page load (server component, no client-side computation)
- Suggestions visual: dotted border, amber tint, "Suggested for [Child Name]" tag, "View activity →" link

### FR-5: Club Cards
Show clubs the parent has joined (from `clubMemberships`), max 4 cards. Each card shows:
- Club name + provider association
- Unread chat message count (if > 0, a small badge)
- Next upcoming event date (if any)
- Link to the club page

### FR-6: Points Widget
Display the parent's current Ubuntu Rewards balance using `calculateBalance()`. Shows:
- Point total in large text with Ubuntu Rewards icon
- Link to full rewards dashboard

### FR-7: Notification Bell Dropdown
Client component with:
- Bell icon (🔔 lucide-react Bell icon)
- Click toggles dropdown panel
- Three sections: Recent Rewards (5 items), Ride Activity (3 items), Community (3 items)
- Data sources: `getRewardPoints()` filtered to current user, `getRideRequests()` filtered to current user, recent community contributions
- No polling, no read/unread state, no new database writes
- Closes on outside click (useEffect + ref)

### FR-8: Child Edit/Add Modal
A shared `ChildForm` component (extracted from onboarding Step 2) rendered in a modal:
- Mobile: bottom sheet (slides up from bottom, full-width)
- Desktop: centered modal with backdrop
- Fields: name, age (1-18), interests (chips from 15 options), suburb, availability (day toggles + time slot toggles)
- Pre-fills from existing child data when editing
- Validates on submit, calls `POST /api/children` (create) or `PATCH /api/children/[id]` (update)
- On success: closes modal, refreshes the "Your Kids" card and week suggestions

### FR-9: Profile Settings Panel
A compact slide-out panel (client component) triggered by ⚙️ icon:
- Display name: text input, pre-filled, updates `users.name`
- Suburb: text input with autocomplete from `src/lib/map/suburbs.ts`
- Notification toggles: three switches (notifyNewProviders, notifyCommunity, notifyRewards)
- Save button: calls a new `PATCH /api/profile` route
- On success: dismisses panel, updates greeting name

### FR-10: No-Children Empty State
When signed in with zero children:
- "Your Kids" card becomes a nudge card (amber background, benefit list, CTA button)
- "This Week" has no scheduled events, shows popular suggestions (top 5 featured providers, no age-filtering)
- Club cards section: hidden (can't join clubs without children)
- Points widget: shows welcome bonus if earned, otherwise shows "Earn points by adding your children and joining clubs"
- All discovery sections function normally

## Non-Functional Requirements

### NFR-1: Performance
- Page load (signed-in state) under 2s on mobile 3G
- All data queries parallelised (children, events, clubs, rewards fetched in one `Promise.all`)
- Modal opens under 200ms (no page navigation)
- Scoring algorithm completes under 50ms for up to 5 children × 19 providers

### NFR-2: Accessibility
- WCAG 2.1 AA minimum
- Modal traps focus, closes on Escape
- Bell dropdown is keyboard-navigable (Arrow keys)
- Nudge card amber text has 4.5:1 contrast minimum
- All interactive elements have visible focus rings

### NFR-3: Mobile-First
- Dashboard cards stack vertically on mobile, 3-column grid at md+
- Bottom sheet for child form on mobile
- Bell dropdown full-width on mobile, constrained on desktop
- Week planner uses responsive table on desktop, stacked cards on mobile

### NFR-4: Auth Safety
- All personalised content gated behind `auth.api.getSession()`
- No child data exposed to unauthenticated visitors
- Profile edit route validates session ownership of the user record
- Child edit/create routes validate parent ownership

## Key Entities

- **Parent (User):** Already exists — display name, email, suburb (new column or inferred)
- **Child (childProfiles):** Already exists — name, age, interests, suburb, availability
- **Club Membership (clubMemberships):** Already exists — parent+child joined to provider club
- **Club Event (clubEvents):** Already exists — scheduled activities per club
- **Reward Points (rewardPoints):** Already exists — point ledger
- **Provider (providers):** Already exists — used for suggestions

## Visual/UX Direction

### Tone
Warm, personal, community-centered. Like walking into your village community centre where someone knows your name and what your kids are up to. Clean ILALI design language — off-white backgrounds, teal accents, Bricolage Grotesque headings, Inter body, colour-wheel accent bars (teal/gold/purple/orange).

### Layout (desktop)
```
┌─────────────────────────────────────────┐
│ Header (unchanged)                       │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Welcome back, Thandi 👋      ⚙️ 🔔  │ │  ← greeting bar
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 👤 Kids  │ │ ⚽ Clubs  │ │ ⭐ 240   │ │  ← 3-column widget row
│ │ Sarah, 8 │ │ Soccer   │ │  points  │ │
│ │ Thabo, 5 │ │ Stars    │ │          │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ This Week                    [View]│ │  ← full-width week planner
│ │ MON 15:00 · Swimming · R220/wk     │ │     scheduled (solid accent)
│ │          · Sarah                    │ │
│ │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │ │
│ │ WED 16:00 · Soccer practice        │ │
│ │          · Thabo                    │ │
│ │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │ │
│ │ ✨ ArtVenture Studio (Suggested)    │ │     suggested (dotted border)
│ │    Suggested for Sarah · View →     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ───── Discover More ─────              │  ← discovery section
│ 💬 AI Chat · Trending · Browse          │
└─────────────────────────────────────────┘
```

### Layout (mobile)
Widgets stack vertically in a single column. Week planner becomes stacked cards (day header + activity + child badge). The nudge card for no-children parents spans full width.

## Assumptions

- Parents who signed up have a `users` record with a `name` field (if not, we fall back to email prefix)
- The `childProfiles` table is populated through onboarding (existing flow works)
- `clubMemberships` requires at least one child profile (enforced by current join flow)
- The scoring algorithm reuses the existing `scoreProviderMatch` logic from the chat-match concierge (simplified form)
- Notification dropdown data comes from existing tables only — no new infrastructure

## Out of Scope

- **Profile photo upload** — requires Vercel Blob storage, image processing, remotePatterns config. Defer to Phase 2.
- **Phone number field** — defer to post-WhatsApp Business API approval.
- **Parent bio / public profile page** — backlog item #11, revisit when 100+ active members.
- **Full notification system** (read/unread state, polling, new `notifications` table, push notifications) — revisit when daily active parents > 50. Add to backlog with trigger.
- **Mobile app or PWA notifications** — backlog items #1 and #7.
- **Online booking or payments** — out of scope for entire MVP per constitution principle #5.
- **Email welcome sequence for new club members** — backlog item #8.

---

## Spec Quality Checklist

- [x] No implementation details (languages, frameworks, APIs, code structure)
- [x] Focused on user value and business needs
- [x] All mandatory sections completed
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success/acceptance criteria are measurable and technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified (no children, long names, many children, zero events)
- [x] Scope is clearly bounded (Out of Scope section has 7 items)
- [x] Dependencies and assumptions identified
- [x] Visual/UX direction is concrete enough that two designers would build similar things
