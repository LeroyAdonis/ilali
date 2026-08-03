# Implementation Plan: Join a Club

**Spec:** [spec.md](./spec.md)
**Date:** 2026-08-03

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend | Next.js 16 App Router + React 19 | Existing stack |
| Styling | Tailwind CSS v4 + ILALI tokens | Brand consistency |
| Database | Neon PostgreSQL + Drizzle ORM | 2 new columns on existing table |
| Auth | Better Auth (existing) | All join/leave routes auth-gated |
| State | Server components for reads, client for mutations | Pattern from Contribute tab |

## Database Changes

### Modify `clubMemberships` in `src/lib/db/schema.ts`

Add two new columns:
```typescript
status: text("status").notNull().default("active"), // "active" | "inactive"
invitedBy: text("invited_by"), // nullable, references users.id — set when joined via invite
```

Update types in `src/lib/db/types.ts`.

### Migration
```bash
npx drizzle-kit push
```
Existing rows get `status = "active"` and `invitedBy = null` via defaults.

## API Contracts

### POST /api/clubs/[slug]/join
- **Auth:** Required
- **Query params:** `?invitedBy=userId` (optional — from invite link)
- **Validation:**
  - Club must exist (getProviderBySlug)
  - User must not already be an active member (check existing membership)
  - If existing inactive membership → reactivate (status = "active", don't send duplicate welcome)
- **Logic:**
  1. Insert/update clubMemberships row: role = "parent", status = "active", invitedBy = query param if present
  2. Award +10 welcome points via `/api/rewards/earn` (action: "welcome")
  3. If invitedBy param: award inviter +50 points via `/api/rewards/earn` (action: "club-invite")
  4. Post system message to club chat: "👋 {userName} just joined! Say hello!"
  5. Return: `{ joined: true, memberNumber, pointsAwarded: 10, invitedBy: bool }`

### POST /api/clubs/[slug]/leave
- **Auth:** Required
- **Validation:** User must be an active member of this club
- **Logic:**
  1. Set status = "inactive"
  2. Cancel open ride requests by this member in this club
  3. Post system message to chat: "👋 {userName} has left the club"
  4. Return: `{ left: true }`

### GET /api/clubs/[slug]/membership (NEW — for checking current state)
- **Auth:** Required
- **Returns:** `{ isMember: bool, status: "active"|"inactive"|null, memberNumber, joinedAt }`
- Used by client components to decide what buttons to show

## Rewards Changes

Add to `src/lib/rewards/calculate.ts`:
```typescript
club-invite: 50, // Invite a parent to join your club
```

## Frontend Components

### 1. JoinClubButton (`src/components/community/JoinClubButton.tsx`)
- "use client" — calls GET membership → decides state → renders button
- States:
  - Not signed in: "🤝 Join this club" → redirects to /auth/signin?callbackUrl={currentUrl}
  - Signed in, not a member: "🤝 Join this club" → POST join → animate to member state
  - Signed in, active member: "✓ You're a member" — muted, non-interactive
  - Signed in, inactive (Alumni): "Rejoin this club" → POST join (reactivate)
  - Loading: spinner
  - Error: retry prompt
- Props: `clubSlug: string, invitedBy?: string`

### 2. WelcomeCard (`src/components/community/WelcomeCard.tsx`)
- "use client" — shown on club About page after joining
- Props: `clubName, memberNumber, nextEvent, memberCount`
- Dismissible — stores dismissed state in localStorage per club
- Links: Chat tab, Members tab, Rides section
- Design: bg-paper-warm, gold top border accent, rounded-xl

### 3. LeaveClubButton (`src/components/community/LeaveClubButton.tsx`)
- "use client" — shown alongside or below the member badge
- Small text link: "Leave club"
- Tapping → confirmation dialog with the spec's message
- Posts to `/api/clubs/[slug]/leave`
- On success: button changes to "Left — rejoin anytime"

### 4. InviteShareSheet (`src/components/community/InviteShareSheet.tsx`)
- "use client" — button on Members tab: "Invite someone"
- Modal/sheet with share options: Copy link, WhatsApp, Email
- Link: `{baseUrl}/clubs/{slug}?invitedBy={currentUserId}`
- Copy feedback: "Link copied!"
- WhatsApp: opens `https://wa.me/?text=...` with pre-filled message

### 5. InviteBanner (`src/components/community/InviteBanner.tsx`)
- "use client" — shown at top of club page when `?invitedBy=` param present
- Banner: "{inviterName} invited you to join {clubName}!"
- Disappears after joining or if dismissed
- Props: `clubSlug, inviterName`

## Page Updates

### Club About page (`/clubs/[slug]/page.tsx`)
- Add JoinClubButton in the sidebar (below Community panel, above RideRequest)
- If `searchParams.invitedBy` → pass to JoinClubButton
- After join → render WelcomeCard

### Club Members page (`/clubs/[slug]/members/page.tsx`)
- Add InviteShareSheet button at top
- Show Alumni badge for inactive members
- Show "New" badge for members joined within 7 days

### Activity detail page (`/activity/[slug]/page.tsx`)
- Add JoinClubButton (matches existing pattern — below hero, in the info section)

### Community Hub (`/clubs/page.tsx`)
- Club cards show "Join" button or "Member ✓" badge
- No full flow — just a quick join CTA

## Implementation Phases

### Phase 1: Backend (DB + API + Rewards)
- Schema: add status + invitedBy columns to clubMemberships
- API: POST join, POST leave, GET membership
- Rewards: add club-invite action (50 pts)
- Push to Neon

### Phase 2: Core Join/Leave UI
- JoinClubButton (all states)
- WelcomeCard (with dismiss)
- LeaveClubButton (with confirmation)
- Wire into club About page + activity detail page

### Phase 3: Invite Flow
- InviteShareSheet
- InviteBanner
- Wire into club Members page
- Handle invitedBy param in join API + JoinClubButton

## Quickstart
```bash
npx drizzle-kit push              # push new columns
npm run dev                        # start dev server
# Test: sign in → /clubs/soccer-stars-academy → tap Join → verify points + chat message
# Test: /clubs/soccer-stars-academy?invitedBy=demo-parent-001 → verify banner + inviter points
```
