import type { InferSelectModel } from "drizzle-orm";
import type { reviews } from "@/lib/db/schema";
import { mockProviders } from "./providers";

export type MockReview = InferSelectModel<typeof reviews>;

const NOW = new Date("2025-07-15T10:00:00Z");
const DAY = 86400000; // milliseconds

// Helper to generate review dates spread over the past 90 days
function reviewDate(daysAgo: number): Date {
  return new Date(NOW.getTime() - daysAgo * DAY);
}

// Map slug to id for quick lookup
const slugToId: Record<string, string> = Object.fromEntries(
  mockProviders.map((p) => [p.slug, p.id])
);

export const mockReviews: MockReview[] = [
  // ── Soccer Stars Academy (0001) ──
  {
    id: "b1b2c3d4-1001-4000-8000-000000000001",
    providerId: slugToId["soccer-stars-academy"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Coach Thabo is incredible with the kids. My son has improved so much in just one term — and he absolutely loves going to practice. The Claremont fields are well-maintained too.",
    createdAt: reviewDate(3),
  },
  {
    id: "b1b2c3d4-1002-4000-8000-000000000002",
    providerId: slugToId["soccer-stars-academy"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Great coaching philosophy. They focus on skills and fun rather than just winning. My only wish is they had more sessions per week.",
    createdAt: reviewDate(14),
  },
  {
    id: "b1b2c3d4-1003-4000-8000-000000000003",
    providerId: slugToId["soccer-stars-academy"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The UEFA-licensed coaches really know their stuff. My daughter went from never kicking a ball to playing in the U10 league team. Proud mom moment!",
    createdAt: reviewDate(28),
  },

  // ── AquaKids Swimming (0002) ──
  {
    id: "b1b2c3d4-2001-4000-8000-000000000004",
    providerId: slugToId["aquakids-swimming"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Absolutely fantastic swimming school! My 4-year-old was terrified of water and now she's swimming laps. The instructors are patient and kind. Heated pool is a huge bonus in winter.",
    createdAt: reviewDate(2),
  },
  {
    id: "b1b2c3d4-2002-4000-8000-000000000005",
    providerId: slugToId["aquakids-swimming"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Coach Nadia runs a tight ship. My kids have been here for 2 years and their stroke technique is excellent. Slightly pricey but worth every cent.",
    createdAt: reviewDate(10),
  },
  {
    id: "b1b2c3d4-2003-4000-8000-000000000006",
    providerId: slugToId["aquakids-swimming"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The water safety component here is unmatched. They don't just teach swimming — they teach respect for water. Sea Point location is super convenient.",
    createdAt: reviewDate(45),
  },

  // ── Cape Cricket Academy (0003) ──
  {
    id: "b1b2c3d4-3001-4000-8000-000000000007",
    providerId: slugToId["cape-cricket-academy"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Coach JP was a provincial player and it shows. His technical coaching has transformed my son's batting. The nets in Rondebosch are top quality.",
    createdAt: reviewDate(7),
  },
  {
    id: "b1b2c3d4-3002-4000-8000-000000000008",
    providerId: slugToId["cape-cricket-academy"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Good structured program. My boy enjoys the Saturday clinics. Wish they had more weekday afternoon slots available.",
    createdAt: reviewDate(21),
  },

  // ── Creative Canvas Studio (0004) ──
  {
    id: "b1b2c3d4-4001-4000-8000-000000000009",
    providerId: slugToId["creative-canvas-studio"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Ms Aisha is a gem! My daughter comes home beaming every Tuesday clutching a new masterpiece. The studio space in Obs is bright and inspiring. All materials included is such a win for parents.",
    createdAt: reviewDate(1),
  },
  {
    id: "b1b2c3d4-4002-4000-8000-00000000000a",
    providerId: slugToId["creative-canvas-studio"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Lovely art studio with a real creative vibe. My son who 'hates art' now asks to go every week. Only reason for 4 stars is parking in Observatory can be tricky.",
    createdAt: reviewDate(15),
  },
  {
    id: "b1b2c3d4-4003-4000-8000-00000000000b",
    providerId: slugToId["creative-canvas-studio"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Watching my kids develop their artistic voice here has been beautiful. The end-of-term exhibition had me in tears. Highly recommend!",
    createdAt: reviewDate(60),
  },

  // ── Dance Dynamics CT (0005) ──
  {
    id: "b1b2c3d4-5001-4000-8000-00000000000c",
    providerId: slugToId["dance-dynamics-ct"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "My daughter has blossomed since joining Dance Dynamics. The hip-hop classes are high energy and the end-of-term show was spectacular. Ms Kim is an amazing choreographer.",
    createdAt: reviewDate(5),
  },
  {
    id: "b1b2c3d4-5002-4000-8000-00000000000d",
    providerId: slugToId["dance-dynamics-ct"],
    venueId: null,
    userId: null,
    rating: 3,
    content:
      "Classes are good but the Bellville studio can get quite crowded during peak times. My daughter enjoys it though and the free trial was a nice touch.",
    createdAt: reviewDate(18),
  },

  // ── Drama Kids Cape Town (0006) ──
  {
    id: "b1b2c3d4-6001-4000-8000-00000000000e",
    providerId: slugToId["drama-kids-cape-town"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Mr David is brilliant with shy children. My son would barely speak in class and now he's volunteering for lead roles in the mini-productions. The confidence growth is remarkable.",
    createdAt: reviewDate(8),
  },
  {
    id: "b1b2c3d4-6002-4000-8000-00000000000f",
    providerId: slugToId["drama-kids-cape-town"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Great drama program in a beautiful Constantia setting. Improv games are hilarious — even the parents get to watch sometimes. Would love more frequent performance opportunities.",
    createdAt: reviewDate(30),
  },

  // ── CodeCubs Programming Club (0007) ──
  {
    id: "b1b2c3d4-7001-4000-8000-000000000010",
    providerId: slugToId["codecubs-programming-club"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Mr Sipho makes coding so accessible. My 8-year-old built her first Scratch game in 3 weeks and is now learning Python. The laptops provided remove all barriers.",
    createdAt: reviewDate(4),
  },
  {
    id: "b1b2c3d4-7002-4000-8000-000000000011",
    providerId: slugToId["codecubs-programming-club"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Hands down the best kids coding program in Cape Town. The game-building approach keeps them engaged while learning real skills. My son now wants to be a game developer!",
    createdAt: reviewDate(12),
  },
  {
    id: "b1b2c3d4-7003-4000-8000-000000000012",
    providerId: slugToId["codecubs-programming-club"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Excellent curriculum and patient instructors. Only feedback is that the Claremont venue can be hard to find the first time — some better signage would help.",
    createdAt: reviewDate(35),
  },

  // ── ScienceLab Explorers (0008) ──
  {
    id: "b1b2c3d4-8001-4000-8000-000000000013",
    providerId: slugToId["sciencelab-explorers"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Dr Sarah is a real scientist and it shows. The experiments are mind-blowing — my kids made their own volcanoes and extracted DNA from strawberries! They beg to go every week.",
    createdAt: reviewDate(6),
  },
  {
    id: "b1b2c3d4-8002-4000-8000-000000000014",
    providerId: slugToId["sciencelab-explorers"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Fantastic hands-on science. Rondebosch location is great. The lab coats and goggles make the kids feel like proper scientists. Slightly expensive but the quality justifies it.",
    createdAt: reviewDate(22),
  },

  // ── Maths Mastery Tutoring (0009) ──
  {
    id: "b1b2c3d4-9001-4000-8000-000000000015",
    providerId: slugToId["maths-mastery-tutoring"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Mrs Fatima has been a game-changer for my Grade 9 daughter. She went from 40% to 78% in one term. CAPS-aligned so it directly supports schoolwork. Forever grateful!",
    createdAt: reviewDate(9),
  },
  {
    id: "b1b2c3d4-9002-4000-8000-000000000016",
    providerId: slugToId["maths-mastery-tutoring"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Small groups mean real individual attention. My son actually looks forward to maths now — words I never thought I'd say. Good value for the quality of tuition.",
    createdAt: reviewDate(25),
  },

  // ── Piano Pathways (000a) ──
  {
    id: "b1b2c3d4-a001-4000-8000-000000000017",
    providerId: slugToId["piano-pathways"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Ms Grace prepared my daughter for her Grade 3 ABRSM exam and she passed with distinction! One-on-one attention makes all the difference. Sea Point studio is lovely.",
    createdAt: reviewDate(11),
  },
  {
    id: "b1b2c3d4-a002-4000-8000-000000000018",
    providerId: slugToId["piano-pathways"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Quality piano tuition. I appreciate that Ms Grace lets students choose between classical and contemporary. It keeps my teenager engaged. On the pricier side but worth it.",
    createdAt: reviewDate(33),
  },

  // ── Guitar Academy SA (000b) ──
  {
    id: "b1b2c3d4-b001-4000-8000-000000000019",
    providerId: slugToId["guitar-academy-sa"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Mr Zane is the coolest teacher! My 10-year-old is already playing SA folk songs and loving it. Guitars provided means we didn't have to invest before knowing he'd stick with it.",
    createdAt: reviewDate(13),
  },
  {
    id: "b1b2c3d4-b002-4000-8000-00000000001a",
    providerId: slugToId["guitar-academy-sa"],
    venueId: null,
    userId: null,
    rating: 3,
    content:
      "Good program but group sizes can get a bit big which means less individual time. My son still enjoys it and has learned plenty. Better for beginners than intermediate players.",
    createdAt: reviewDate(40),
  },

  // ── Little Voices Community Choir (000c) ──
  {
    id: "b1b2c3d4-c001-4000-8000-00000000001b",
    providerId: slugToId["little-voices-community-choir"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "A free community choir of this quality is incredible. Ms Portia has a gift for bringing out the best in every voice. The community performances are so heartwarming.",
    createdAt: reviewDate(16),
  },
  {
    id: "b1b2c3d4-c002-4000-8000-00000000001c",
    providerId: slugToId["little-voices-community-choir"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "My kids love singing here and I love that it's free! The community spirit is amazing. Only wish they'd have more frequent rehearsals during school terms.",
    createdAt: reviewDate(42),
  },

  // ── Nature Rangers Outdoor Club (000d) ──
  {
    id: "b1b2c3d4-d001-4000-8000-00000000001d",
    providerId: slugToId["nature-rangers-outdoor-club"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Guide Themba has incredible knowledge of local flora and fauna. My kids came home from the holiday program full of facts about fynbos and birds. Great outdoor alternative to screen time.",
    createdAt: reviewDate(20),
  },
  {
    id: "b1b2c3d4-d002-4000-8000-00000000001e",
    providerId: slugToId["nature-rangers-outdoor-club"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The Green Belt hikes were amazing! My son who normally hates 'nature stuff' is now asking for hiking boots for his birthday. The conservation projects teach real responsibility.",
    createdAt: reviewDate(48),
  },

  // ── Trailblazers Horse Riding (000e) ──
  {
    id: "b1b2c3d4-e001-4000-8000-00000000001f",
    providerId: slugToId["trailblazers-horse-riding"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Ms Rachel is so patient with nervous beginners. The ponies are clearly well cared for and the Constantia setting is breathtaking. Horsemanship is taught alongside riding — exactly what I wanted.",
    createdAt: reviewDate(17),
  },
  {
    id: "b1b2c3d4-e002-4000-8000-000000000020",
    providerId: slugToId["trailblazers-horse-riding"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Wonderful riding school. The kids learn real stable management, not just riding. Expensive but you get what you pay for. Booking can be competitive during holidays.",
    createdAt: reviewDate(32),
  },

  // ── Mindful Minis (000f) ──
  {
    id: "b1b2c3d4-f001-4000-8000-000000000021",
    providerId: slugToId["mindful-minis"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Ms Lebo has a calming presence that works wonders. My anxious 7-year-old now uses breathing techniques at home when she gets overwhelmed. The games make mindfulness accessible.",
    createdAt: reviewDate(2),
  },
  {
    id: "b1b2c3d4-f002-4000-8000-000000000022",
    providerId: slugToId["mindful-minis"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Such a valuable program. Wish every school had this. My son has better emotional vocabulary now. Small groups mean each child gets attention. Observatory location is central.",
    createdAt: reviewDate(26),
  },

  // ── Extra reviews for higher-volume providers ──
  {
    id: "b1b2c3d4-e003-4000-8000-000000000023",
    providerId: slugToId["aquakids-swimming"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "Third child going through AquaKids and the standard has never dropped. From water babies to competitive swimmers, they handle every level brilliantly.",
    createdAt: reviewDate(55),
  },
  {
    id: "b1b2c3d4-e004-4000-8000-000000000024",
    providerId: slugToId["codecubs-programming-club"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The Python course is fantastic preparation for high school IT. My daughter built a whole website by the end of term 2. Mr Sipho is a patient and inspiring teacher.",
    createdAt: reviewDate(50),
  },
  {
    id: "b1b2c3d4-e005-4000-8000-000000000025",
    providerId: slugToId["soccer-stars-academy"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Solid soccer program. My twins are in different age groups and both love it. The end-of-season tournament was really well organized. Good value for the coaching quality.",
    createdAt: reviewDate(65),
  },
  {
    id: "b1b2c3d4-e006-4000-8000-000000000026",
    providerId: slugToId["sciencelab-explorers"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The chemistry module was absolutely brilliant — safe but spectacular experiments. My kids are now obsessed with the periodic table. Dr Sarah's enthusiasm is infectious!",
    createdAt: reviewDate(70),
  },
  {
    id: "b1b2c3d4-e007-4000-8000-000000000027",
    providerId: slugToId["piano-pathways"],
    venueId: null,
    userId: null,
    rating: 4,
    content:
      "Excellent piano tuition for all levels. My beginner is loving it and my advanced child is preparing for Trinity exams. Flexible scheduling is appreciated.",
    createdAt: reviewDate(75),
  },
  {
    id: "b1b2c3d4-e008-4000-8000-000000000028",
    providerId: slugToId["creative-canvas-studio"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The holiday art camp was incredible — my kids did pottery, painting, and collage over 3 days. They came home exhausted but so proud of their creations. Ms Aisha is magic.",
    createdAt: reviewDate(80),
  },
  {
    id: "b1b2c3d4-e009-4000-8000-000000000029",
    providerId: slugToId["maths-mastery-tutoring"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "After failing maths in Grade 10, my son passed matric with 65%. Mrs Fatima didn't just tutor — she rebuilt his confidence. Worth every cent ten times over.",
    createdAt: reviewDate(85),
  },
  {
    id: "b1b2c3d4-e00a-4000-8000-00000000002a",
    providerId: slugToId["drama-kids-cape-town"],
    venueId: null,
    userId: null,
    rating: 5,
    content:
      "The end-of-year production was Broadway-worthy for a kids' drama club. Every child had a moment to shine. The skills my daughter gained go way beyond acting.",
    createdAt: reviewDate(90),
  },
];

export const mockReviewsByProviderId: Record<string, MockReview[]> = {};

for (const review of mockReviews) {
  const pid = review.providerId!;
  if (!mockReviewsByProviderId[pid]) {
    mockReviewsByProviderId[pid] = [];
  }
  mockReviewsByProviderId[pid].push(review);
}
