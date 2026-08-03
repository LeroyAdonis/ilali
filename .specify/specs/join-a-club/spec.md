# Feature Spec: Join a Club

**Date:** 2026-08-03
**Constitution:** ILALI Constitution
**Status:** Draft

## Vision Statement

Joining a club on ILALI should feel like walking into a room where everyone knows your name — and is genuinely happy you showed up. Not a database row. Not a silent subscription. A *welcome*. Points land, the chat lights up, the community sees you arrived. Ubuntu: "I am because we are" starts the moment you walk through the door.

## User Scenarios

### Scenario 1: Leroy discovers and joins Soccer Stars
**As a** parent browsing the Community Hub
**I want to** find a club my child might like and join it
**So that** I become part of that community and can participate

**Acceptance criteria:**
- [ ] Leroy browses `/clubs`, sees Soccer Stars Academy card with member count
- [ ] Taps the card → lands on club About page with "Join this club" button visible
- [ ] Taps "Join this club" → membership created instantly (no approval gate)
- [ ] +10 Ubuntu welcome points awarded (already in rewards system: `welcome` action)
- [ ] Club chat posts system message: "👋 Leroy just joined! Say hello!"
- [ ] Community Hub Ubuntu Feed shows: "Leroy joined Soccer Stars Academy"
- [ ] Member count on club page increments by 1
- [ ] Leroy appears in Members tab with "New" badge (visible for 7 days)
- [ ] Welcome card appears: member number, next event, quick links to chat/rides/members
- [ ] "Join this club" button disappears — replaced with "You're a member ✓"

### Scenario 2: Parent joins from the activity page
**As a** parent viewing an activity listing
**I want to** join the club directly from the activity detail page
**So that** I don't have to navigate back to the Community Hub

**Acceptance criteria:**
- [ ] `/activity/[slug]` page shows "Join this club" button
- [ ] Same welcome experience as Scenario 1
- [ ] After joining, button changes to "You're a member ✓ → View club"

### Scene 3: Parent is not signed in
**As a** parent browsing without an account
**I want to** know that joining is possible once I sign up
**So that** I'm motivated to create an account

**Acceptance criteria:**
- [ ] Club page shows "Join this club" button even when not signed in
- [ ] Tapping it redirects to sign-in with callback URL back to the club page
- [ ] After sign-in, the welcome flow triggers automatically

### Scenario 4: Thandi leaves a club
**As a** parent who no longer attends Soccer Stars
**I want to** leave the club gracefully
**So that** my membership status is clear and the club knows I've moved on

**Acceptance criteria:**
- [ ] On the club page, instead of "You're a member ✓", Thandi sees a small "Leave club" link
- [ ] Tapping shows a confirmation dialog: "Leaving Soccer Stars Academy? Your contributions and chat messages stay — you're part of the club's history. You can rejoin anytime."
- [ ] Confirms → membership row soft-deleted (status: "inactive")
- [ ] Chat system message: "👋 Thandi has left the club"
- [ ] Ubuntu Feed: "Thandi left Soccer Stars Academy"
- [ ] Their name remains in the members list but shows "Alumni" badge instead of "New"/regular
- [ ] Their contributions remain visible — they're part of club history
- [ ] Any open ride requests they created are cancelled
- [ ] They can rejoin anytime — same welcome flow, membership reactivated

### Scenario 5: Leroy invites a friend to his club
**As a** club member who loves Soccer Stars
**I want to** invite another parent to join
**So that** the club grows and I earn Ubuntu points for bringing them in

**Acceptance criteria:**
- [ ] Leroy is on the Members tab → sees "Invite someone" button
- [ ] Taps it → share sheet with options: Copy link, WhatsApp, Email
- [ ] The link is `https://ilali.vercel.app/clubs/soccer-stars-academy?invitedBy={leroyId}`
- [ ] He shares it with Thandi via WhatsApp
- [ ] Thandi taps the link → club page loads with a banner: "Leroy invited you to join Soccer Stars Academy!"
- [ ] Thandi taps "Join this club" → membership created
- [ ] System detects `invitedBy` param → awards inviter +50 points, invitee gets +10 welcome
- [ ] Both get a rewards ledger entry: "Club invitation — Soccer Stars Academy"
- [ ] If Thandi was already going to join anyway — the URL param is invisible unless shared via the invite flow
- [ ] Invitation tracking: `clubMemberships.invitedBy` records who invited them

## Functional Requirements

### FR-1: Join Button
A prominent "Join this club" button appears on:
- Club About page (`/clubs/[slug]`)
- Activity detail page (`/activity/[slug]`)
- Club members page (as secondary CTA)

When signed in and already a member: shows "You're a member ✓" (non-interactive badge)
When signed in and not a member: shows "Join this club" (primary CTA)
When not signed in: shows "Sign in to join" → redirects to /auth/signin?callbackUrl={currentUrl}

### FR-2: Membership Creation
`POST /api/clubs/[slug]/join` — auth required

- Validates user is signed in
- Validates club exists
- Checks user is not already a member (idempotent — returns 200 "already a member")
- Inserts row into `clubMemberships` with role: "parent"
- Awards +10 welcome points via `POST /api/rewards/earn` (action: "welcome", referenceId: clubId)
- Posts system message to club chat: "👋 {userName} just joined {clubName}! Say hello!"
- Returns: `{ joined: true, memberNumber, pointsAwarded: 10 }`

### FR-3: Welcome Card
After joining, the club About page shows a dismissible Welcome Card above the club content:

```
┌──────────────────────────────────────┐
│ 🎉 Welcome to {clubName}!             │
│                                      │
│ You're member #{memberNumber}        │
│                                      │
│ 📅 Next event: {nextEventTitle},     │
│    {nextEventTime}                   │
│ 💬 Say hi in the club chat →         │
│ 🤝 Meet {memberCount-1} other        │
│    members →                          │
│ 🚗 Need a lift? →                    │
│                                      │
│ [Dismiss]                             │
└──────────────────────────────────────┘
```

The welcome card appears once — dismissed state stored in localStorage per club. Does NOT reappear on page reload.

### FR-4: Public Visibility
Joining is a public, celebratory event:

| Place | What shows |
|---|---|
| Club chat | System message: "👋 {name} just joined! Say hello!" |
| Ubuntu Feed | Card: "{name} joined {clubName}" with timestamp |
| Members tab | New member appears with "New" badge for 7 days |
| Member count | Increments by 1 on club page + Community Hub card |
| Rewards ledger | "+10 pts — Welcome to {clubName}" |

### FR-5: Post-Join Pathways
From the Welcome Card, the parent has 3 immediate actions:
1. **Say hi in chat** — links to club Chat tab
2. **Meet other members** — links to club Members tab
3. **Need a lift?** — links to Rides section on club page

### FR-6: Leave a Club
Members can leave a club gracefully. No data is destroyed — the member becomes an "Alumni".

- Endpoint: `POST /api/clubs/[slug]/leave` — auth required
- Membership status set to "inactive" (soft delete)
- Chat system message: "👋 {name} has left the club"
- Ubuntu Feed entry: "{name} left {clubName}"
- Member appears in Members tab with "Alumni" badge
- Any open ride requests by this member are cancelled
- Rejoining: set status back to "active", same welcome flow without duplicate chat message
- Leave confirmation dialog text: "Leaving {clubName}? Your contributions and chat messages stay — you're part of the club's history. You can rejoin anytime."

### FR-7: Invite a Friend to a Club
Members can invite other parents to join their club. Successful invitations reward both parties.

- "Invite someone" button on Members tab (visible to signed-in club members)
- Generates shareable link: `{baseUrl}/clubs/{slug}?invitedBy={userId}`
- Share options: Copy link, WhatsApp, Email
- When invitee lands on the club page via invite link:
  - Banner shows: "{inviterName} invited you to join {clubName}!"
  - "Join this club" button with the banner
- On successful join via invite:
  - `clubMemberships.invitedBy` set to inviter's userId
  - Inviter awarded +50 points via `POST /api/rewards/earn` (action: "club-invite")
  - Invitee awarded standard +10 welcome points
  - Both get rewards ledger entries
  - Invite banner disappears after joining
- Invite links are public — anyone with the link can join (no auth required to see the banner, but joining still requires sign-in)
- New rewards action: `club-invite: 50` added to `REWARD_ACTIONS` in calculate.ts

## Key Entities

- `clubMemberships` — existing table, needs 2 new columns:
  - `status`: text, default "active" — values: "active" | "inactive" (for soft-delete on leave)
  - `invitedBy`: text, nullable — references `users.id`, set when joined via invite link
- `clubMessages` — existing table: system messages use senderId: "system"
- `rewardPoints` — existing table: action: "welcome" (10 pts), new action "club-invite" (50 pts)

No new tables needed — this is purely a UX layer on existing infrastructure.

## Non-Functional Requirements

### NFR-1: Performance
- Join API call completes in < 500ms (single DB insert + fire-and-forget chat message + rewards)
- Welcome card renders in the same server response as the page

### NFR-2: Idempotency
- Tapping "Join" twice does not create duplicate memberships
- Returns 200 "already a member" with existing member number

### NFR-3: Accessibility
- Join button has clear focus state
- Welcome card is keyboard-dismissible
- "New" badge uses color + text (not color alone)

## Visual/UX Direction

The Join button should feel warm and inviting — not a cold "Subscribe" button:

- **Shape**: Full-width pill button with rounded-full
- **Color**: `bg-teal-deep` or the club's accent color
- **Icon**: 🤝 handshake emoji next to the text
- **Before joining**: "🤝 Join this club" — warm green, solid background
- **After joining**: "✓ You're a member" — muted, lighter, non-interactive
- **Hover**: Slight scale-up (transform: scale(1.02))
- **Welcome Card**: `bg-paper-warm` with rounded-xl border, gold accent top border, dismissible with × button
- **Chat system message**: Distinct background (`bg-ilali-50`), emoji-led, centered text

## Assumptions

- The existing `clubMemberships` table structure is sufficient (no new columns needed)
- The rewards welcome action (10 pts) already exists in `REWARD_ACTIONS`
- Club chat supports system messages (senderId: "system") — may need to handle this if not already supported
- The Ubuntu Feed already renders community contributions — joining events should appear alongside them
- Callback URL pattern for sign-in redirect works with Next.js 16 Better Auth

## Out of Scope

- Push notifications for new members
- Email welcome sequence
- Club leader notification for new members (chat message is sufficient for MVP)
- Parent profiles visible beyond the club members list (Phase 3 of community plan)
- Bulk invite (invite multiple people at once)
- Invite tracking dashboard (who invited the most members)
- Club leader approval for membership (open joining is the Ubuntu promise)
