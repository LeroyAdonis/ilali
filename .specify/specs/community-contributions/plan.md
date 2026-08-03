# Implementation Plan: Community Contributions & Ubuntu Rewards

**Spec:** [spec.md](./spec.md)
**Date:** 2026-08-03

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend | Next.js 16 App Router + React 19 (existing stack) | Zero new dependencies |
| Styling | Tailwind CSS v4 + existing ILALI tokens | Brand consistency |
| Database | Neon PostgreSQL + Drizzle ORM (existing) | Two new tables, same infrastructure |
| Auth | Better Auth (existing) | All routes auth-gated |
| State | Server components for reads, client components for mutations | Next.js 16 pattern |
| Deploy | Vercel (existing) | Same pipeline |

## Data Model

### Table: `communityContributions`

```typescript
export const communityContributions = pgTable("community_contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clubId: uuid("club_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "venue-help" | "event-support" | "community-building" | "knowledge-sharing" | "outreach"
  description: text("description"), // optional, max 200 chars
  points: integer("points").notNull(),
  validationPath: text("validation_path").notNull(), // "leader" | "peer"
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "rejected" | "flagged"
  confirmedBy: text("confirmed_by").references(() => users.id), // leader who confirmed (null for peer path until vouched)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});
```

### Table: `contributionVouches`

```typescript
export const contributionVouches = pgTable("contribution_vouches", {
  id: uuid("id").defaultRandom().primaryKey(),
  contributionId: uuid("contribution_id").notNull().references(() => communityContributions.id, { onDelete: "cascade" }),
  voucherId: text("voucher_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  uniqueVouch: uniqueIndex("unique_vouch").on(t.contributionId, t.voucherId),
}));
```

### Computed: Reputation Score (no table — calculated on read)

```typescript
async function getReputation(userId: string): Promise<number> {
  const [contributions, vouchesGiven, monthsActive] = await Promise.all([
    db.select({ count: count() })
      .from(communityContributions)
      .where(and(eq(communityContributions.userId, userId), eq(communityContributions.status, "confirmed"))),
    db.select({ count: count() })
      .from(contributionVouches)
      .where(eq(contributionVouches.voucherId, userId)),
    // monthsActive from user createdAt
  ]);
  return (Number(contributions[0].count) * 10) 
       + (Number(vouchesGiven[0].count) * 5) 
       + (monthsActive * 2);
}
```

### Computed: Club Health

```typescript
async function getClubHealth(providerId: string) {
  const contributions = await db.select({
    userId: communityContributions.userId,
  }).from(communityContributions)
    .where(and(
      eq(communityContributions.clubId, providerId),
      eq(communityContributions.status, "confirmed"),
      gte(communityContributions.createdAt, subMonths(new Date(), 1))
    ));

  const totalContributors = contributions.length;
  const uniqueContributors = new Set(contributions.map(c => c.userId)).size;
  
  // Concentration: what % of contributions came from the top contributor?
  const userCounts = new Map<string, number>();
  contributions.forEach(c => userCounts.set(c.userId, (userCounts.get(c.userId) || 0) + 1));
  const maxContributions = Math.max(...userCounts.values(), 1);
  const concentrationRatio = maxContributions / totalContributors;

  // Health indicator
  const health = uniqueContributors >= 3 && concentrationRatio < 0.5 ? "green"
    : uniqueContributors >= 2 && concentrationRatio < 0.75 ? "yellow"
    : "red";

  return { totalContributors, uniqueContributors, concentrationRatio, health };
}
```

## API Contracts

### POST /api/community/contributions
Submit a community contribution.
- **Auth:** Required (any signed-in user)
- **Body:** `{ clubId: uuid, type: string, description?: string }`
- **Validation:** 
  - User must be a member of the club (check clubMemberships)
  - type must be in CONTRIBUTION_TYPES
  - User must not exceed weekly cap (based on reputation tier)
- **Logic:**
  1. Look up club leader (provider → check if has user account via users table)
  2. If leader exists → validationPath = "leader", status = "pending"
  3. If no leader → validationPath = "peer", create contribution with status = "pending"
  4. Calculate points from CONTRIBUTION_TYPES[type]
  5. Insert into communityContributions
- **Response 201:** `{ id, status, validationPath, points, vouchesNeeded }`

### POST /api/community/contributions/[id]/vouch
Vouch for a peer-path contribution.
- **Auth:** Required
- **Validation:**
  - Contribution must be peer-path and pending
  - Voucher must be signed in, member of same club
  - Voucher cannot be the submitter
  - Voucher hasn't vouched for this person in 7 days
  - User must have Elder tier to vouch (reputation ≥ 100)
- **Logic:**
  1. Insert vouch row (unique constraint prevents double-vouch)
  2. Count total vouches for this contribution
  3. If vouches ≥ vouchesNeeded (based on submitter's reputation):
     - Update status → "confirmed", confirmedAt = now()
     - Fire POST to /api/rewards/earn with userId, action: "community", referenceId, points
  4. Else: status stays "pending"
- **Response 200:** `{ vouched: true, vouchesSoFar, vouchesNeeded, status }`

### POST /api/community/contributions/[id]/confirm
Club leader confirms a leader-path contribution.
- **Auth:** Required (must be the club leader/provider)
- **Validation:**
  - Contribution must be leader-path and pending
  - Confirmer must be the provider linked to this club
  - Anti-collusion: if leader has confirmed this user >3 times in 7 days, require 2nd confirmation
- **Logic:**
  1. Check collusion guard
  2. If collusion detected → status stays "pending", flag for secondary review, return `{ collusionFlag: true }`
  3. If clear → status → "confirmed", confirmedBy = leaderId, confirmedAt = now()
  4. Fire POST to /api/rewards/earn
- **Response 200:** `{ confirmed: true, points }` or `{ collusionFlag: true }`

### GET /api/community/contributions
List contributions, filterable.
- **Auth:** None (public read)
- **Query params:** `?clubId=uuid&limit=20&offset=0`
- **Response:** `{ contributions: [{ id, userName, clubName, type, description, points, status, confirmedByName, createdAt }], total }`

### GET /api/clubs/[slug]/health
Club health score.
- **Auth:** None
- **Response:** `{ health: "green"|"yellow"|"red", totalContributors, uniqueContributors, concentrationRatio }`

## Implementation Phases

### Phase 1: Schema + API (backend)
**Goal:** Database tables and all API routes working
**Tasks:**
- Add communityContributions + contributionVouches to schema.ts
- Add contribution types + points map to calculate.ts
- Create POST /api/community/contributions
- Create POST /api/community/contributions/[id]/vouch
- Create POST /api/community/contributions/[id]/confirm
- Create GET /api/community/contributions
- Create GET /api/clubs/[slug]/health
- Add reputation calculation utility
- Run drizzle-kit push
- Add data-source wrappers (mock + DB)

**Verification:** `curl` each endpoint, verify DB rows, verify points appear in rewards ledger

### Phase 2: Club "Contribute" Tab (frontend)
**Goal:** Parents can see and submit contributions from club pages
**Tasks:**
- Add "Contribute" tab to club page layout (existing ClubTabs pattern)
- Create `src/app/clubs/[slug]/contribute/page.tsx`
- Create ContributionPicker component (emoji grid)
- Create ContributionForm component (type + optional description)
- Create ContributionFeed component (chronological, this club only)
- Create ClubHealthCard component
- Add data-source functions for contributions (getClubContributions)

**Verification:** Navigate to any club → Contribute tab → submit → see in feed

### Phase 3: Ubuntu Feed on Community Hub (frontend)
**Goal:** Global visibility of community contributions
**Tasks:**
- Add Ubuntu Feed section to `src/app/clubs/page.tsx`
- Create UbuntuFeed component (cross-club, recent, filterable)
- Create ContributionCard component (avatar + name + club + type + confirmer)
- Add voucher button to peer-path contributions in the feed

**Verification:** Community Hub shows contributions from all clubs, filterable

### Phase 4: Leader Confirmation Flow
**Goal:** Club leaders get notified and can confirm contributions
**Tasks:**
- Create PendingConfirmations component (for club leaders)
- Show on club Contribute tab when user is the club leader
- Implement confirm/deny buttons
- Implement collusion guard UI feedback

**Verification:** Leader account sees pending, confirms → points awarded → shows in feed

## Quickstart (Post-Build Validation)

```bash
# 1. Verify schema
npx drizzle-kit push

# 2. Verify API
curl -X POST http://localhost:3001/api/community/contributions \
  -H "Content-Type: application/json" \
  -d '{"clubId": "<soccer-stars-id>", "type": "venue-help", "description": "Set up goals"}'

# 3. Verify feed
curl http://localhost:3001/api/community/contributions

# 4. Verify club health
curl http://localhost:3001/api/clubs/soccer-stars-academy/health

# 5. Full build
npm run build && npx tsc --noEmit
```
