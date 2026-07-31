// Seed the 15 realistic mock providers into Neon (idempotent — skips existing slugs).
// Usage: node scripts/seed-providers.mjs
import dotenv from "dotenv";
dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const NOW = new Date("2025-07-01T12:00:00Z").toISOString();

// Same data as src/lib/mock/providers.ts (kept inline so this script is standalone)
const PROVIDERS = [
  // ─── SPORTS ───
  { id: "a1b2c3d4-0001-4000-8000-000000000001", name: "Soccer Stars Academy", slug: "soccer-stars-academy", category: "sports", description: "Premier youth soccer training for ages 5-14. Our UEFA-licensed coaches develop technical skills, teamwork, and a love for the beautiful game in a fun, supportive environment.", providerName: "Coach Thabo", location: "Claremont", lat: "-33.9806", lng: "18.4647", ageMin: 5, ageMax: 14, rating: "4.8", reviewCount: 47, priceValue: 15000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800", phone: "+27712345656", tags: ["outdoor", "team-sport", "high-energy", "coordination"], featured: true, isFree: false, verified: true },
  { id: "a1b2c3d4-0002-4000-8000-000000000002", name: "AquaKids Swimming", slug: "aquakids-swimming", category: "sports", description: "Learn-to-swim and stroke development for children aged 3-16. Small class sizes, heated indoor pool, and nationally certified instructors. Water safety is our top priority.", providerName: "Coach Nadia", location: "Sea Point", lat: "-33.9167", lng: "18.3833", ageMin: 3, ageMax: 16, rating: "4.9", reviewCount: 63, priceValue: 18000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1622682718141-15469c2d27b7?w=800", phone: "+27712345657", tags: ["indoor", "water-sport", "safety", "individual"], featured: true, isFree: false, verified: true },
  { id: "a1b2c3d4-0003-4000-8000-000000000003", name: "Cape Cricket Academy", slug: "cape-cricket-academy", category: "sports", description: "Professional cricket coaching for aspiring young cricketers. Batting, bowling, and fielding clinics for ages 7-18. Our coaches include former provincial players.", providerName: "Coach JP", location: "Rondebosch", lat: "-33.9628", lng: "18.4761", ageMin: 7, ageMax: 18, rating: "4.6", reviewCount: 31, priceValue: 12000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800", phone: "+27712345658", tags: ["outdoor", "team-sport", "technique", "competitive"], featured: false, isFree: false, verified: true },
  // ─── ARTS & CULTURE ───
  { id: "a1b2c3d4-0004-4000-8000-000000000004", name: "Creative Canvas Studio", slug: "creative-canvas-studio", category: "arts-culture", description: "A vibrant art studio where children explore painting, drawing, collage, and mixed media. All materials supplied. We believe every child is an artist — we just give them the tools.", providerName: "Ms Aisha", location: "Observatory", lat: "-33.9383", lng: "18.4719", ageMin: 4, ageMax: 12, rating: "4.7", reviewCount: 38, priceValue: 10000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800", phone: "+27712345659", tags: ["indoor", "creative", "messy-play", "fine-motor"], featured: true, isFree: false, verified: true },
  { id: "a1b2c3d4-0005-4000-8000-000000000005", name: "Dance Dynamics CT", slug: "dance-dynamics-ct", category: "arts-culture", description: "Hip-hop, contemporary, and ballet classes for ages 3-16. End-of-term showcase performances build confidence and stage presence. First trial class is free!", providerName: "Ms Kim", location: "Bellville", lat: "-33.9000", lng: "18.6333", ageMin: 3, ageMax: 16, rating: "4.5", reviewCount: 24, priceValue: 9000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800", phone: "+27712345660", tags: ["indoor", "creative", "confidence", "performance"], featured: false, isFree: false, verified: false },
  { id: "a1b2c3d4-0006-4000-8000-000000000006", name: "Drama Kids Cape Town", slug: "drama-kids-cape-town", category: "arts-culture", description: "Build confidence through drama! Improvisation, role-play, and mini-productions for ages 5-15. Our curriculum develops communication skills while having serious fun.", providerName: "Mr David", location: "Constantia", lat: "-34.0200", lng: "18.4500", ageMin: 5, ageMax: 15, rating: "4.4", reviewCount: 19, priceValue: 11000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1585699324267-45fd1afee2f6?w=800", phone: "+27712345661", tags: ["indoor", "creative", "confidence", "teamwork", "communication"], featured: false, isFree: false, verified: false },
  // ─── EDUCATION ───
  { id: "a1b2c3d4-0007-4000-8000-000000000007", name: "CodeCubs Programming Club", slug: "codecubs-programming-club", category: "education", description: "Fun, hands-on coding classes for kids aged 6-16. Learn Scratch, Python, and web development through game-building projects. Laptops provided. No experience needed!", providerName: "Mr Sipho", location: "Claremont", lat: "-33.9806", lng: "18.4647", ageMin: 6, ageMax: 16, rating: "4.8", reviewCount: 52, priceValue: 20000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800", phone: "+27712345662", tags: ["indoor", "tech", "problem-solving", "creative", "STEM"], featured: false, isFree: false, verified: true },
  { id: "a1b2c3d4-0008-4000-8000-000000000008", name: "ScienceLab Explorers", slug: "sciencelab-explorers", category: "education", description: "Hands-on science experiments that make learning unforgettable! Chemistry, physics, and biology for curious minds aged 7-14. Lab coats and safety goggles provided.", providerName: "Dr Sarah", location: "Rondebosch", lat: "-33.9628", lng: "18.4761", ageMin: 7, ageMax: 14, rating: "4.9", reviewCount: 41, priceValue: 18000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800", phone: "+27712345663", tags: ["indoor", "STEM", "hands-on", "experiments", "critical-thinking"], featured: false, isFree: false, verified: true },
  { id: "a1b2c3d4-0009-4000-8000-000000000009", name: "Maths Mastery Tutoring", slug: "maths-mastery-tutoring", category: "education", description: "Small-group maths tutoring for grades 3-12. CAPS-aligned curriculum with individual attention. We turn 'I can't do maths' into 'I love maths!'", providerName: "Mrs Fatima", location: "Observatory", lat: "-33.9383", lng: "18.4719", ageMin: 8, ageMax: 18, rating: "4.7", reviewCount: 35, priceValue: 16000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800", phone: "+27712345664", tags: ["indoor", "academic", "individual", "CAPS", "problem-solving"], featured: false, isFree: false, verified: true },
  // ─── MUSIC LESSONS ───
  { id: "a1b2c3d4-000a-4000-8000-00000000000a", name: "Piano Pathways", slug: "piano-pathways", category: "music-lessons", description: "One-on-one piano lessons from beginner to advanced, ages 5+. Trinity and ABRSM exam preparation available. Learn classical, jazz, or pop — your choice!", providerName: "Ms Grace", location: "Sea Point", lat: "-33.9167", lng: "18.3833", ageMin: 5, ageMax: 99, rating: "4.8", reviewCount: 29, priceValue: 25000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1552422535-c45813c61732?w=800", phone: "+27812345665", tags: ["indoor", "individual", "creative", "technique", "discipline"], featured: false, isFree: false, verified: true },
  { id: "a1b2c3d4-000b-4000-8000-00000000000b", name: "Guitar Academy SA", slug: "guitar-academy-sa", category: "music-lessons", description: "Learn acoustic or electric guitar in a supportive group setting. Ages 8-18. Guitars provided for beginners. Rock, folk, and SA contemporary music.", providerName: "Mr Zane", location: "Claremont", lat: "-33.9806", lng: "18.4647", ageMin: 8, ageMax: 18, rating: "4.6", reviewCount: 22, priceValue: 14000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800", phone: "+27812345666", tags: ["indoor", "creative", "group", "instrument", "confidence"], featured: false, isFree: false, verified: false },
  { id: "a1b2c3d4-000c-4000-8000-00000000000c", name: "Little Voices Community Choir", slug: "little-voices-community-choir", category: "music-lessons", description: "Free community choir for children aged 6-14. No auditions, no fees — just a love of singing! Perform at community events and build lasting friendships.", providerName: "Ms Portia", location: "Rondebosch", lat: "-33.9628", lng: "18.4761", ageMin: 6, ageMax: 14, rating: "4.5", reviewCount: 18, priceValue: 0, priceLabel: "free", imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800", phone: "+27812345667", tags: ["indoor", "creative", "community", "group", "confidence"], featured: false, isFree: true, verified: false },
  // ─── HOLIDAY PROGRAMS ───
  { id: "a1b2c3d4-000d-4000-8000-00000000000d", name: "Nature Rangers Outdoor Club", slug: "nature-rangers-outdoor-club", category: "holiday-programs", description: "School holiday adventure programs exploring Cape Town's natural beauty. Hiking, nature journaling, bird watching, and conservation projects for ages 6-14.", providerName: "Guide Themba", location: "Constantia", lat: "-34.0200", lng: "18.4500", ageMin: 6, ageMax: 14, rating: "4.3", reviewCount: 12, priceValue: 30000, priceLabel: "per day", imageUrl: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800", phone: "+27812345668", tags: ["outdoor", "nature", "adventure", "environmental", "teamwork"], featured: false, isFree: false, verified: true },
  // ─── EQUINE / OUTDOOR SPORTS ───
  { id: "a1b2c3d4-000e-4000-8000-00000000000e", name: "Trailblazers Horse Riding", slug: "trailblazers-horse-riding", category: "sports", description: "Learn to ride in the beautiful Constantia valley. Beginner to intermediate lessons for ages 6-16. Well-schooled ponies, qualified instructors, and a focus on horsemanship.", providerName: "Ms Rachel", location: "Constantia", lat: "-34.0200", lng: "18.4500", ageMin: 6, ageMax: 16, rating: "4.7", reviewCount: 26, priceValue: 28000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800", phone: "+27812345669", tags: ["outdoor", "individual", "nature", "confidence", "coordination"], featured: false, isFree: false, verified: false },
  // ─── EMOTIONAL INTELLIGENCE ───
  { id: "a1b2c3d4-000f-4000-8000-00000000000f", name: "Mindful Minis", slug: "mindful-minis", category: "emotional-intelligence", description: "Mindfulness and emotional intelligence workshops for children aged 5-12. Through stories, games, and breathing exercises, we help kids understand and manage their emotions.", providerName: "Ms Lebo", location: "Observatory", lat: "-33.9383", lng: "18.4719", ageMin: 5, ageMax: 12, rating: "4.4", reviewCount: 15, priceValue: 8000, priceLabel: "per session", imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800", phone: "+27812345670", tags: ["indoor", "wellness", "confidence", "emotional-regulation", "individual"], featured: false, isFree: false, verified: false },
];

const existing = await sql.query('SELECT slug FROM providers');
const existingSlugs = new Set(existing.map((r) => r.slug));
const toInsert = PROVIDERS.filter((p) => !existingSlugs.has(p.slug));

console.log(`Existing: ${existing.length} | To insert: ${toInsert.length}`);

let inserted = 0;
for (const p of toInsert) {
  try {
    await sql.query(
      `INSERT INTO providers
        (id, name, slug, category, description, provider_name, location, lat, lng,
         age_min, age_max, rating, review_count, price_value, price_label,
         image_url, phone, tags, featured, is_free, verified, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       ON CONFLICT (slug) DO NOTHING`,
      [
        p.id, p.name, p.slug, p.category, p.description, p.providerName, p.location,
        p.lat, p.lng, p.ageMin, p.ageMax, p.rating, p.reviewCount, p.priceValue,
        p.priceLabel, p.imageUrl, p.phone,
        `{${p.tags.map((t) => `"${t}"`).join(",")}}`, p.featured,
        p.isFree, p.verified, NOW, NOW,
      ]
    );
    inserted++;
    console.log(`  + ${p.name} (${p.category})`);
  } catch (e) {
    console.error(`  ✗ ${p.name}: ${e.message}`);
  }
}

const total = await sql.query('SELECT COUNT(*) AS n FROM providers');
console.log(`Done. Inserted ${inserted}, total providers now: ${total[0].n}`);
