/**
 * Mock community data — club events, memberships, messages, and ride requests.
 * Clubs are keyed to real provider slugs from providers.ts.
 * Dates are relative to module load so "upcoming" events stay upcoming.
 */

import type {
  ClubEvent,
  ClubMembership,
  ClubMembershipRole,
  RideRequest,
  RideRequestStatus,
  RideDirection,
  ClubMessage,
} from "@/lib/db/types";
import { mockProviders } from "./providers";
import { mockParents } from "./parents";

export type MockClubEvent = ClubEvent;
export type MockClubMembership = ClubMembership;
export type MockRideRequest = RideRequest;
export type MockClubMessage = ClubMessage;

const DAY = 86400000;
const HOUR = 3600000;

// Anchor "now" at module load — events are generated relative to it
const NOW = new Date();

function daysFromNow(days: number, hour: number, minute = 0): Date {
  const d = new Date(NOW.getTime() + days * DAY);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

// Real provider slugs → ids (see providers.ts)
const slugToId: Record<string, string> = Object.fromEntries(
  mockProviders.map((p) => [p.slug, p.id])
);

const soccer = slugToId["soccer-stars-academy"];
const aqua = slugToId["aquakids-swimming"];
const codecubs = slugToId["codecubs-programming-club"];
const piano = slugToId["piano-pathways"];

// Children per parent (from parents.ts) so childIds stay realistic
const childIdsByParentId: Record<string, string[]> = Object.fromEntries(
  mockParents.map((p) => [p.id, p.children.map((c) => c.id)])
);

// ── Club Events ──
export const mockClubEvents: MockClubEvent[] = [
  // ── Soccer Stars Academy ──
  {
    id: "c1b2c3d4-0001-4000-8000-000000000001",
    providerId: soccer,
    title: "U12 League Match vs Gardens Rangers",
    eventType: "game",
    startTime: daysFromNow(1, 8, 30),
    endTime: daysFromNow(1, 10, 0),
    location: "Claremont Sports Fields",
    createdAt: daysAgo(7),
  },
  {
    id: "c1b2c3d4-0002-4000-8000-000000000002",
    providerId: soccer,
    title: "U10 Skills Practice",
    eventType: "practice",
    startTime: daysFromNow(2, 16, 0),
    endTime: daysFromNow(2, 17, 30),
    location: "Claremont Sports Fields",
    createdAt: daysAgo(3),
  },
  {
    id: "c1b2c3d4-0003-4000-8000-000000000003",
    providerId: soccer,
    title: "End-of-Term Tournament Day",
    eventType: "event",
    startTime: daysFromNow(14, 8, 0),
    endTime: daysFromNow(14, 14, 0),
    location: "Claremont Sports Fields",
    createdAt: daysAgo(10),
  },
  {
    id: "c1b2c3d4-0004-4000-8000-000000000004",
    providerId: soccer,
    title: "Friendly vs Bishopscourt",
    eventType: "game",
    startTime: daysFromNow(-3, 9, 0),
    endTime: daysFromNow(-3, 10, 30),
    location: "Bishopscourt Primary Fields",
    createdAt: daysAgo(12),
  },

  // ── AquaKids Swimming ──
  {
    id: "c1b2c3d4-0005-4000-8000-000000000005",
    providerId: aqua,
    title: "Junior Gala — Squad Trials",
    eventType: "event",
    startTime: daysFromNow(2, 15, 0),
    endTime: daysFromNow(2, 17, 0),
    location: "Sea Point Indoor Pool",
    createdAt: daysAgo(5),
  },
  {
    id: "c1b2c3d4-0006-4000-8000-000000000006",
    providerId: aqua,
    title: "Stroke Development Practice",
    eventType: "practice",
    startTime: daysFromNow(4, 15, 30),
    endTime: daysFromNow(4, 16, 30),
    location: "Sea Point Indoor Pool",
    createdAt: daysAgo(2),
  },
  {
    id: "c1b2c3d4-0007-4000-8000-000000000007",
    providerId: aqua,
    title: "Water Safety Clinic",
    eventType: "event",
    startTime: daysFromNow(8, 9, 0),
    endTime: null,
    location: "Sea Point Indoor Pool",
    createdAt: daysAgo(6),
  },
  {
    id: "c1b2c3d4-0008-4000-8000-000000000008",
    providerId: aqua,
    title: "Winter Gala Practice",
    eventType: "practice",
    startTime: daysFromNow(-1, 15, 0),
    endTime: daysFromNow(-1, 16, 30),
    location: "Sea Point Indoor Pool",
    createdAt: daysAgo(9),
  },

  // ── CodeCubs Programming Club ──
  {
    id: "c1b2c3d4-0009-4000-8000-000000000009",
    providerId: codecubs,
    title: "Scratch Game Jam Session",
    eventType: "practice",
    startTime: daysFromNow(2, 15, 0),
    endTime: daysFromNow(2, 16, 30),
    location: "CodeCubs Lab, Claremont",
    createdAt: daysAgo(4),
  },
  {
    id: "c1b2c3d4-000a-4000-8000-00000000000a",
    providerId: codecubs,
    title: "Parents' Showcase — Build Day",
    eventType: "event",
    startTime: daysFromNow(9, 10, 0),
    endTime: daysFromNow(9, 13, 0),
    location: "CodeCubs Lab, Claremont",
    createdAt: daysAgo(7),
  },
  {
    id: "c1b2c3d4-000b-4000-8000-00000000000b",
    providerId: codecubs,
    title: "Python Basics Workshop",
    eventType: "practice",
    startTime: daysFromNow(-2, 15, 0),
    endTime: daysFromNow(-2, 16, 30),
    location: "CodeCubs Lab, Claremont",
    createdAt: daysAgo(11),
  },

  // ── Piano Pathways ──
  {
    id: "c1b2c3d4-000c-4000-8000-00000000000c",
    providerId: piano,
    title: "Winter Recital — All Students",
    eventType: "event",
    startTime: daysFromNow(7, 14, 0),
    endTime: daysFromNow(7, 16, 0),
    location: "Piano Pathways Studio, Sea Point",
    createdAt: daysAgo(8),
  },
  {
    id: "c1b2c3d4-000d-4000-8000-00000000000d",
    providerId: piano,
    title: "ABRSM Exam Prep Masterclass",
    eventType: "practice",
    startTime: daysFromNow(4, 17, 0),
    endTime: daysFromNow(4, 18, 0),
    location: "Piano Pathways Studio, Sea Point",
    createdAt: daysAgo(3),
  },
  {
    id: "c1b2c3d4-000e-4000-8000-00000000000e",
    providerId: piano,
    title: "Sight-Reading Workshop",
    eventType: "practice",
    startTime: daysFromNow(-5, 17, 0),
    endTime: null,
    location: "Piano Pathways Studio, Sea Point",
    createdAt: daysAgo(13),
  },
];

// ── Club Memberships ──
// [providerId, parentId, role, joinedDaysAgo]
const membershipSpec: [string, string, ClubMembershipRole, number][] = [
  // Soccer Stars Academy
  [soccer, "parent_001", "organizer", 210],
  [soccer, "parent_002", "volunteer", 180],
  [soccer, "parent_003", "parent", 150],
  [soccer, "parent_005", "volunteer", 120],
  [soccer, "parent_008", "parent", 90],
  [soccer, "parent_010", "parent", 45],
  // AquaKids Swimming
  [aqua, "parent_004", "organizer", 200],
  [aqua, "parent_006", "parent", 140],
  [aqua, "parent_009", "volunteer", 110],
  [aqua, "parent_012", "parent", 70],
  [aqua, "parent_015", "parent", 30],
  // CodeCubs Programming Club
  [codecubs, "parent_007", "organizer", 190],
  [codecubs, "parent_011", "parent", 130],
  [codecubs, "parent_013", "volunteer", 95],
  [codecubs, "parent_014", "parent", 60],
  [codecubs, "parent_017", "parent", 20],
  // Piano Pathways
  [piano, "parent_016", "organizer", 160],
  [piano, "parent_018", "parent", 100],
  [piano, "parent_019", "volunteer", 80],
  [piano, "parent_021", "parent", 40],
  [piano, "parent_022", "parent", 15],
];

export const mockClubMemberships: MockClubMembership[] = membershipSpec.map(
  ([providerId, parentId, role, joinedDaysAgo], i) => ({
    id: `c1b2c3d4-${1001 + i}-4000-8000-${String(i + 1).padStart(12, "0")}`,
    providerId,
    parentId,
    childIds: childIdsByParentId[parentId] ?? [],
    role,
    status: "active" as const,
    invitedBy: null,
    joinedAt: daysAgo(joinedDaysAgo),
  })
);

// ── Club Messages ──
// [clubId, senderId, content, hoursAgo]
const messageSpec: [string, string, string, number][] = [
  // Soccer Stars Academy
  [
    soccer,
    "parent_001",
    "Reminder: U12 match this Saturday 08:30 at Claremont fields. Please arrive 15 minutes early!",
    2,
  ],
  [
    soccer,
    "parent_002",
    "I can bring team snacks for Saturday — any allergies I should know about?",
    6,
  ],
  [
    soccer,
    "parent_005",
    "Anyone driving from the Rondebosch side on Saturday? Happy to split fuel.",
    26,
  ],
  [
    soccer,
    "parent_003",
    "Liam's got the flu so he'll miss Tuesday's practice. Coach, any drills we can do at home?",
    50,
  ],
  // AquaKids Swimming
  [
    aqua,
    "parent_004",
    "Junior Gala entries close Friday — please confirm squad trials on the sign-up sheet.",
    3,
  ],
  [
    aqua,
    "parent_009",
    "Zara passed her Level 2 badge today! Thank you Coach Nadia 🎉",
    28,
  ],
  [
    aqua,
    "parent_015",
    "Heated pool confirmed for winter lessons — don't forget swim caps on Friday.",
    55,
  ],
  // CodeCubs Programming Club
  [
    codecubs,
    "parent_007",
    "Scratch Game Jam this Wednesday — laptops provided, just bring your ideas!",
    4,
  ],
  [
    codecubs,
    "parent_013",
    "My son rebuilt the maze game at home after last session. This club is amazing.",
    30,
  ],
  [
    codecubs,
    "parent_011",
    "Any other kids keen to enter the national schools coding challenge?",
    75,
  ],
  // Piano Pathways
  [
    piano,
    "parent_016",
    "Winter recital this Sunday 14:00 — smart casual, sheet music will be provided.",
    7,
  ],
  [
    piano,
    "parent_019",
    "Cornelia is sitting her Grade 2 ABRSM in September — thanks for the extra practice tips!",
    32,
  ],
  [
    piano,
    "parent_018",
    "Anyone able to lend a keyboard for the recital? Ours is being serviced.",
    60,
  ],
];

export const mockClubMessages: MockClubMessage[] = messageSpec.map(
  ([clubId, senderId, content, hoursAgo], i) => ({
    id: `c1b2c3d4-${2001 + i}-4000-8000-${String(i + 1).padStart(12, "0")}`,
    clubId,
    senderId,
    content,
    createdAt: new Date(NOW.getTime() - hoursAgo * HOUR),
  })
);

// ── Ride Requests ──
// [eventId, parentId, childIndex, direction, status, claimedBy, daysAgo]
const eventByTitle: Record<string, string> = Object.fromEntries(
  mockClubEvents.map((e) => [e.title, e.id])
);

const rideSpec: [
  string,
  string,
  number,
  RideDirection,
  RideRequestStatus,
  string | null,
  number,
][] = [
  [
    eventByTitle["U12 League Match vs Gardens Rangers"],
    "parent_003",
    1,
    "to",
    "open",
    null,
    2,
  ],
  [
    eventByTitle["U12 League Match vs Gardens Rangers"],
    "parent_008",
    0,
    "from",
    "claimed",
    "parent_005",
    1,
  ],
  [
    eventByTitle["End-of-Term Tournament Day"],
    "parent_010",
    0,
    "to",
    "open",
    null,
    3,
  ],
  [
    eventByTitle["Junior Gala — Squad Trials"],
    "parent_012",
    0,
    "to",
    "open",
    null,
    1,
  ],
  [
    eventByTitle["Junior Gala — Squad Trials"],
    "parent_015",
    0,
    "from",
    "completed",
    "parent_009",
    4,
  ],
  [
    eventByTitle["Parents' Showcase — Build Day"],
    "parent_014",
    0,
    "to",
    "claimed",
    "parent_013",
    2,
  ],
  [
    eventByTitle["Winter Recital — All Students"],
    "parent_021",
    0,
    "to",
    "completed",
    "parent_016",
    5,
  ],
];

export const mockRideRequests: MockRideRequest[] = rideSpec.map(
  (
    [eventId, parentId, childIndex, direction, status, claimedBy, createdDaysAgo],
    i
  ) => ({
    id: `c1b2c3d4-${3001 + i}-4000-8000-${String(i + 1).padStart(12, "0")}`,
    eventId,
    parentId,
    childId: childIdsByParentId[parentId]?.[childIndex] ?? "",
    direction,
    status,
    claimedBy,
    // Mock rides that are completed have both sides confirmed; anything
    // open/claimed is still awaiting completion confirmation.
    requesterConfirmed: status === "completed",
    claimerConfirmed: status === "completed",
    createdAt: daysAgo(createdDaysAgo),
  })
);

// ── Lookup helpers (mirror providers.ts / reviews.ts patterns) ──

export const clubEventsByProviderId: Record<string, MockClubEvent[]> = {};

for (const event of mockClubEvents) {
  (clubEventsByProviderId[event.providerId] ??= []).push(event);
}

export const membershipsByProviderId: Record<string, MockClubMembership[]> = {};

for (const membership of mockClubMemberships) {
  (membershipsByProviderId[membership.providerId] ??= []).push(membership);
}

export const messagesByClubId: Record<string, MockClubMessage[]> = {};

for (const message of mockClubMessages) {
  (messagesByClubId[message.clubId] ??= []).push(message);
}

export const rideRequestsByEventId: Record<string, MockRideRequest[]> = {};

for (const ride of mockRideRequests) {
  (rideRequestsByEventId[ride.eventId] ??= []).push(ride);
}
