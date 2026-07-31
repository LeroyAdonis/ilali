/**
 * Mock parent data with child profiles for ILALI.
 * Each parent has 1-3 children in Cape Town suburbs.
 */

export interface MockChild {
  id: string;
  name: string;
  age: number;
  interests: string[];
  availability: { days: string[]; timeSlots: string[] };
  suburb: string;
}

export interface MockParent {
  id: string;
  name: string;
  email: string;
  children: MockChild[];
}

function makeId(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(3, "0")}`;
}

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekends = ["Saturday", "Sunday"];
const allDays = [...weekdays, ...weekends];
const morning = ["08:00–10:00"];
const afternoon = ["14:00–16:00"];
const lateAfternoon = ["15:00–17:00"];
const evening = ["17:00–19:00"];
const weekendMorning = ["09:00–12:00"];
const weekendAfternoon = ["13:00–16:00"];

const interestPool = [
  "soccer",
  "swimming",
  "piano",
  "coding",
  "ballet",
  "art",
  "gymnastics",
  "tennis",
  "drama",
  "chess",
  "karate",
  "cooking",
  "hockey",
  "violin",
  "robotics",
  "climbing",
  "horse-riding",
  "surfing",
  "basketball",
  "singing",
  "pottery",
  "photography",
  "yoga",
  "gardening",
  "skateboarding",
];

const capeTownsSuburbs = [
  "Claremont",
  "Rondebosch",
  "Observatory",
  "Sea Point",
  "Constantia",
  "Bellville",
  "Newlands",
  "Kenilworth",
  "Mowbray",
  "Pinelands",
];

function pickRandom<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeAvailability(ageGroup: "toddler" | "child" | "teen"): {
  days: string[];
  timeSlots: string[];
} {
  if (ageGroup === "toddler") {
    // Toddlers (3-5): mornings and early afternoons, mostly weekdays
    return {
      days: pickRandom(weekdays, 2, 4),
      timeSlots: pickRandom([...morning, ...afternoon], 1, 2),
    };
  }
  if (ageGroup === "teen") {
    // Teens (13-17): afternoons/holiday, more weekends
    return {
      days: pickRandom(allDays, 2, 4),
      timeSlots: pickRandom(
        [...afternoon, ...lateAfternoon, ...weekendAfternoon],
        1,
        2
      ),
    };
  }
  // Children (6-12): afternoons + some weekends
  return {
    days: pickRandom(allDays, 2, 4),
    timeSlots: pickRandom(
      [...afternoon, ...lateAfternoon, ...weekendMorning],
      1,
      2
    ),
  };
}

function ageGroup(age: number): "toddler" | "child" | "teen" {
  if (age <= 5) return "toddler";
  if (age <= 12) return "child";
  return "teen";
}

// ── Raw parent data: [name, email, [child-name, age, interest-count], ...] ──
const rawParents: [
  string,
  string,
  [string, number, number][],
][] = [
  [
    "Thandi Nkosi",
    "thandi.n@example.co.za",
    [
      ["Lindiwe", 7, 3],
      ["Sipho", 4, 2],
    ],
  ],
  [
    "James van der Merwe",
    "james.vdm@example.co.za",
    [
      ["Emma", 9, 3],
      ["Liam", 6, 2],
      ["Noah", 3, 1],
    ],
  ],
  [
    "Fatima Hendricks",
    "fatima.h@example.co.za",
    [
      ["Aisha", 12, 4],
      ["Yusuf", 8, 2],
    ],
  ],
  [
    "David Petersen",
    "david.p@example.co.za",
    [
      ["Mia", 5, 2],
      ["Luke", 14, 3],
    ],
  ],
  [
    "Zanele Mthembu",
    "zanele.m@example.co.za",
    [
      ["Buhle", 11, 3],
      ["Thabo", 15, 2],
      ["Naledi", 6, 2],
    ],
  ],
  [
    "Michael Smith",
    "michael.s@example.co.za",
    [
      ["Oliver", 8, 3],
    ],
  ],
  [
    "Amahle Dlamini",
    "amahle.d@example.co.za",
    [
      ["Sibongile", 13, 2],
      ["Lwandle", 3, 1],
    ],
  ],
  [
    "Pieter du Toit",
    "pieter.dt@example.co.za",
    [
      ["Hendrik", 10, 2],
      ["Annelize", 7, 3],
    ],
  ],
  [
    "Nadia Isaacs",
    "nadia.i@example.co.za",
    [
      ["Zara", 6, 3],
      ["Raees", 16, 2],
    ],
  ],
  [
    "Sipho Mahlangu",
    "sipho.ma@example.co.za",
    [
      ["Karabo", 9, 2],
      ["Thandiwe", 5, 2],
      ["Lerato", 14, 3],
    ],
  ],
  [
    "Emily de Villiers",
    "emily.dv@example.co.za",
    [
      ["Sophia", 11, 3],
    ],
  ],
  [
    "Bongani Zulu",
    "bongani.z@example.co.za",
    [
      ["Mandla", 7, 2],
      ["Nomvula", 4, 1],
    ],
  ],
  [
    "Rachel Daniels",
    "rachel.d@example.co.za",
    [
      ["Joshua", 8, 3],
      ["Megan", 17, 2],
    ],
  ],
  [
    "Tebogo Molefe",
    "tebogo.mo@example.co.za",
    [
      ["Kabelo", 10, 2],
      ["Boitumelo", 6, 2],
    ],
  ],
  [
    "Sarah-Jane October",
    "sarahj.o@example.co.za",
    [
      ["Adam", 12, 3],
      ["Zoe", 9, 2],
      ["Lily", 5, 1],
    ],
  ],
  [
    "Mandisa Khumalo",
    "mandisa.k@example.co.za",
    [
      ["Sizwe", 16, 2],
    ],
  ],
  [
    "Chris Botha",
    "chris.b@example.co.za",
    [
      ["Daniel", 7, 2],
      ["Matthew", 15, 3],
    ],
  ],
  [
    "Lerato Moeketsi",
    "lerato.m@example.co.za",
    [
      ["Palesa", 13, 3],
      ["Khotso", 4, 1],
    ],
  ],
  [
    "Willem Jansen",
    "willem.j@example.co.za",
    [
      ["Marie", 6, 2],
      ["Johannes", 3, 1],
      ["Elna", 10, 3],
    ],
  ],
  [
    "Nomsa Ngcobo",
    "nomsa.n@example.co.za",
    [
      ["Themba", 9, 2],
      ["Zinhle", 14, 3],
    ],
  ],
  [
    "Gareth Jacobs",
    "gareth.j@example.co.za",
    [
      ["Ryan", 11, 3],
      ["Chloe", 8, 2],
    ],
  ],
  [
    "Yolanda Adams",
    "yolanda.a@example.co.za",
    [
      ["Ethan", 5, 2],
      ["Maya", 17, 2],
      ["Kai", 12, 3],
    ],
  ],
  [
    "Sibusiso Shabalala",
    "sibusiso.s@example.co.za",
    [
      ["Nkosinathi", 7, 2],
      ["Ayanda", 15, 2],
    ],
  ],
  [
    "Anneke Louw",
    "anneke.l@example.co.za",
    [
      ["Pieter-Jan", 4, 1],
      ["Cornelia", 9, 3],
    ],
  ],
  [
    "Phumzile Ndlovu",
    "phumzile.n@example.co.za",
    [
      ["Lungile", 13, 2],
    ],
  ],
];

// ── Build mock data ──
export const mockParents: MockParent[] = rawParents.map(
  ([name, email, children], i) => {
    const suburb = capeTownsSuburbs[i % capeTownsSuburbs.length];
    return {
      id: makeId("parent", i + 1),
      name,
      email,
      children: children.map(([cName, cAge, interestCount], ci) => {
        const group = ageGroup(cAge);
        return {
          id: makeId("child", i * 3 + ci + 1),
          name: cName,
          age: cAge,
          interests: pickRandom(interestPool, interestCount, interestCount),
          availability: makeAvailability(group),
          suburb,
        };
      }),
    };
  }
);

// ── Helpers ──
export function mockParentById(id: string): MockParent | undefined {
  return mockParents.find((p) => p.id === id);
}

export function childrenByParentId(parentId: string): MockChild[] {
  const parent = mockParents.find((p) => p.id === parentId);
  return parent ? parent.children : [];
}

export function allMockChildren(): MockChild[] {
  return mockParents.flatMap((p) => p.children);
}
