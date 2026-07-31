// Seed demo community data (club events, memberships, messages, ride requests, reward points)
// into Neon. Idempotent — skips existing rows. Mirrors src/lib/mock/communities.ts + rewards.ts.
// Usage: node scripts/seed-community.mjs
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });
import { neon } from "@neondatabase/serverless";
import crypto from "node:crypto";

const sql = neon(process.env.DATABASE_URL);

// ── Helpers ──
const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays, hour) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// ── Demo parents (created only if missing) ──
const DEMO_PARENTS = [
  { id: "demo-parent-0001-4000-8000-000000000001", email: "demo-parent-1@ilali.co", name: "Thandi Khumalo", suburb: "Claremont", children: [{ name: "Lerato", age: 9 }, { name: "Sipho", age: 6 }] },
  { id: "demo-parent-0002-4000-8000-000000000002", email: "demo-parent-2@ilali.co", name: "James Petersen", suburb: "Sea Point", children: [{ name: "Ella", age: 11 }] },
  { id: "demo-parent-0003-4000-8000-000000000003", email: "demo-parent-3@ilali.co", name: "Sarah Mokoena", suburb: "Claremont", children: [{ name: "Naledi", age: 7 }, { name: "Kagiso", age: 10 }] },
  { id: "demo-parent-0004-4000-8000-000000000004", email: "demo-parent-4@ilali.co", name: "Devon Abrahams", suburb: "Rondebosch", children: [{ name: "Zane", age: 8 }] },
  { id: "demo-parent-0005-4000-8000-000000000005", email: "demo-parent-5@ilali.co", name: "Priya Naidoo", suburb: "Sea Point", children: [{ name: "Arun", age: 13 }, { name: "Mia", age: 5 }] },
];

// ── Clubs (provider slugs from seed-providers.mjs) ──
const CLUBS = ["soccer-stars-academy", "aquakids-swimming", "codecubs-programming-club", "piano-pathways"];

// ── Events per club (title, type, dayOffset, hour, location, endOffset) ──
const EVENTS = {
  "soccer-stars-academy": [
    { title: "Practice — Thursday Session", eventType: "practice", offset: 2, hour: 15, location: "Claremont Sports Fields" },
    { title: "Match vs Swartland", eventType: "game", offset: 4, hour: 9, location: "Claremont Sports Fields" },
    { title: "Skills Clinic — Dribbling", eventType: "event", offset: 9, hour: 10, location: "Claremont Sports Fields" },
    { title: "Practice — Tuesday Session", eventType: "practice", offset: -5, hour: 15, location: "Claremont Sports Fields" },
  ],
  "aquakids-swimming": [
    { title: "Learn-to-Swim — Level 2", eventType: "practice", offset: 1, hour: 14, location: "Sea Point Pavilion Pool" },
    { title: "Water Safety Workshop", eventType: "event", offset: 6, hour: 11, location: "Sea Point Pavilion Pool" },
    { title: "Stroke Development — Freestyle", eventType: "practice", offset: 8, hour: 14, location: "Sea Point Pavilion Pool" },
    { title: "Mini Gala", eventType: "game", offset: -3, hour: 10, location: "Sea Point Pavilion Pool" },
  ],
  "codecubs-programming-club": [
    { title: "Scratch Game Jam", eventType: "event", offset: 3, hour: 16, location: "Claremont Library Hall" },
    { title: "Python Basics — Loops", eventType: "practice", offset: 5, hour: 16, location: "CodeCubs Studio, Claremont" },
    { title: "Web Dev: Build a Portfolio", eventType: "practice", offset: 10, hour: 15, location: "CodeCubs Studio, Claremont" },
    { title: "Robotics Demo Day", eventType: "event", offset: -2, hour: 17, location: "Claremont Library Hall" },
  ],
  "piano-pathways": [
    { title: "Group Theory Class", eventType: "practice", offset: 2, hour: 17, location: "Piano Pathways Studio, Sea Point" },
    { title: "Trinity Exam Prep Session", eventType: "practice", offset: 7, hour: 16, location: "Piano Pathways Studio, Sea Point" },
    { title: "Student Recital — July", eventType: "event", offset: 12, hour: 18, location: "Sea Point Community Hall" },
  ],
};

// ── Messages per club (sender index → demo parent, content) ──
const MESSAGES = {
  "soccer-stars-academy": [
    { p: 0, content: "Hi everyone! Who's driving to the match on Saturday? We have space for one more." },
    { p: 1, content: "We can help — picking up from Sea Point at 8am." },
    { p: 2, content: "Thanks James! Our Naledi is so excited for her first match 🎉" },
    { p: 0, content: "Don't forget shin guards for Saturday!" },
  ],
  "aquakids-swimming": [
    { p: 3, content: "Does anyone know if the Level 2 class needs goggles or does Coach Nadia provide them?" },
    { p: 4, content: "Coach provides them, but Zane prefers his own — got his at Sportsman's Warehouse." },
  ],
  "codecubs-programming-club": [
    { p: 2, content: "Kagiso built his first game yesterday! Thank you Mr Sipho 🙌" },
    { p: 1, content: "That's awesome! The Game Jam on Friday should be fun." },
  ],
  "piano-pathways": [
    { p: 4, content: "Is anyone doing the Trinity exam in September? Arun is nervous about sight-reading." },
    { p: 0, content: "Thandi here — Lerato did hers last year. Ms Grace prepares them really well, don't stress!" },
  ],
};

// ── Ride requests (club, eventIndex, requesterParentIdx, childIdx, direction, status, claimedByIdx?) ──
const RIDES = [
  { club: "soccer-stars-academy", event: 1, p: 2, child: 1, direction: "to", status: "open" },
  { club: "soccer-stars-academy", event: 1, p: 0, child: 0, direction: "from", status: "claimed", claimer: 1 },
  { club: "aquakids-swimming", event: 0, p: 3, child: 0, direction: "to", status: "open" },
  { club: "codecubs-programming-club", event: 0, p: 1, child: 0, direction: "from", status: "completed", claimer: 2 },
];

// ── Reward points (parentIdx, amount, action, reference) ──
const REWARDS = [
  { p: 0, amount: 100, action: "volunteer", reference: "soccer-stars-academy" },
  { p: 1, amount: 50, action: "lift", reference: "soccer-stars-academy" },
  { p: 2, amount: 200, action: "referral", reference: "codecubs-programming-club" },
  { p: 4, amount: 25, action: "review", reference: "piano-pathways" },
  { p: 0, amount: 10, action: "welcome", reference: "demo-parent-2" },
  { p: 3, amount: 50, action: "lift", reference: "aquakids-swimming" },
];

// ── Run ──
let stats = { parents: 0, children: 0, events: 0, memberships: 0, messages: 0, rides: 0, rewards: 0 };

// 1. Demo parents + child profiles
const parentIds = {};
const childIdsByParent = {};
for (const p of DEMO_PARENTS) {
  const existing = await sql.query("SELECT id FROM users WHERE email = $1", [p.email]);
  let parentId;
  if (existing.length > 0) {
    parentId = existing[0].id;
  } else {
    await sql.query(
      `INSERT INTO users (id, name, email, role, email_verified, created_at, updated_at)
       VALUES ($1,$2,$3,'parent',true,NOW(),NOW()) ON CONFLICT (email) DO NOTHING`,
      [p.id, p.name, p.email]
    );
    parentId = p.id;
    stats.parents++;
  }
  parentIds[p.id] = parentId;

  // Child profiles
  const childIds = [];
  for (const [i, c] of p.children.entries()) {
    const existingChild = await sql.query(
      "SELECT id FROM child_profiles WHERE parent_id = $1 AND name = $2",
      [parentId, c.name]
    );
    if (existingChild.length > 0) {
      childIds.push(existingChild[0].id);
      continue;
    }
    const childId = crypto.randomUUID();
    await sql.query(
      `INSERT INTO child_profiles (id, parent_id, name, age, interests, suburb, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`,
      [childId, parentId, c.name, c.age, `{"sports","music"}`, p.suburb]
    );
    childIds.push(childId);
    stats.children++;
  }
  childIdsByParent[p.id] = childIds;
}
console.log(`Parents: ${stats.parents} created, children: ${stats.children} created`);

// 2. Clubs: provider ids by slug
const providerRows = await sql.query("SELECT id, slug FROM providers WHERE slug = ANY($1)", [CLUBS]);
const providerIdBySlug = {};
for (const r of providerRows) providerIdBySlug[r.slug] = r.id;

// 3. Events
const eventIds = {};
for (const slug of CLUBS) {
  eventIds[slug] = [];
  if (!providerIdBySlug[slug]) {
    console.warn(`  ⚠ provider not found: ${slug}`);
    continue;
  }
  for (const [i, e] of (EVENTS[slug] ?? []).entries()) {
    const existing = await sql.query(
      "SELECT id FROM club_events WHERE provider_id = $1 AND title = $2",
      [providerIdBySlug[slug], e.title]
    );
    if (existing.length > 0) {
      eventIds[slug].push(existing[0].id);
      continue;
    }
    const id = crypto.randomUUID();
    await sql.query(
      `INSERT INTO club_events (id, provider_id, title, event_type, start_time, end_time, location, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) ON CONFLICT (id) DO NOTHING`,
      [id, providerIdBySlug[slug], e.title, e.eventType, iso(e.offset, e.hour), iso(e.offset, e.hour + 1), e.location]
    );
    eventIds[slug].push(id);
    stats.events++;
  }
}
console.log(`Events: ${stats.events} created`);

// 4. Memberships — every demo parent joins every club (roles vary), unique (provider_id, parent_id)
const ROLES = ["parent", "parent", "parent", "volunteer", "organizer"];
const parentKeys = Object.keys(parentIds);
for (const slug of CLUBS) {
  if (!providerIdBySlug[slug]) continue;
  for (const [pi, pKey] of parentKeys.entries()) {
    const childIds = childIdsByParent[pKey];
    const role = ROLES[pi % ROLES.length];
    await sql.query(
      `INSERT INTO club_memberships (provider_id, parent_id, child_ids, role, joined_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (provider_id, parent_id) DO NOTHING`,
      [providerIdBySlug[slug], parentIds[pKey], `{${childIds.map((c) => `"${c}"`).join(",")}}`, role]
    );
    stats.memberships++;
  }
}
console.log(`Memberships: ${stats.memberships} ensured`);

// 5. Messages
for (const slug of CLUBS) {
  if (!providerIdBySlug[slug]) continue;
  for (const [i, m] of (MESSAGES[slug] ?? []).entries()) {
    const parentKey = DEMO_PARENTS[m.p].id;
    await sql.query(
      `INSERT INTO club_messages (club_id, sender_id, content, created_at)
       VALUES ($1,$2,$3, NOW() - ($4 || ' hours')::interval)`,
      [providerIdBySlug[slug], parentIds[parentKey], m.content, (MESSAGES[slug].length - i) * 3]
    );
    stats.messages++;
  }
}
console.log(`Messages: ${stats.messages} created`);

// 6. Ride requests
for (const [i, r] of RIDES.entries()) {
  const eventId = eventIds[r.club]?.[r.event];
  if (!eventId) {
    console.warn(`  ⚠ ride skipped — event missing: ${r.club} #${r.event}`);
    continue;
  }
  const requesterKey = DEMO_PARENTS[r.p].id;
  const childId = childIdsByParent[requesterKey]?.[r.child];
  if (!childId) {
    console.warn(`  ⚠ ride skipped — child missing for ${requesterKey}`);
    continue;
  }
  const claimerId = r.claimer != null ? parentIds[DEMO_PARENTS[r.claimer].id] : null;
  const existing = await sql.query(
    "SELECT id FROM ride_requests WHERE event_id = $1 AND parent_id = $2 AND child_id = $3",
    [eventId, parentIds[requesterKey], childId]
  );
  if (existing.length > 0) continue;
  await sql.query(
    `INSERT INTO ride_requests (id, event_id, parent_id, child_id, direction, status, claimed_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
    [crypto.randomUUID(), eventId, parentIds[requesterKey], childId, r.direction, r.status, claimerId]
  );
  stats.rides++;
}
console.log(`Rides: ${stats.rides} created`);

// 7. Reward points
for (const r of REWARDS) {
  const parentKey = DEMO_PARENTS[r.p].id;
  const existing = await sql.query(
    "SELECT id FROM reward_points WHERE user_id = $1 AND action = $2 AND reference_id = $3",
    [parentIds[parentKey], r.action, r.reference]
  );
  if (existing.length > 0) continue;
  await sql.query(
    `INSERT INTO reward_points (user_id, amount, action, reference_id, created_at)
     VALUES ($1,$2,$3,$4,NOW())`,
    [parentIds[parentKey], r.amount, r.action, r.reference]
  );
  stats.rewards++;
}
console.log(`Rewards: ${stats.rewards} created`);

// ── Summary ──
const totals = await sql.query(`
  SELECT
    (SELECT COUNT(*) FROM club_events) AS events,
    (SELECT COUNT(*) FROM club_memberships) AS memberships,
    (SELECT COUNT(*) FROM club_messages) AS messages,
    (SELECT COUNT(*) FROM ride_requests) AS rides,
    (SELECT COUNT(*) FROM reward_points) AS rewards
`);
console.log("Totals:", totals[0]);
console.log("Done ✅");
