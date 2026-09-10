// The operator above the community site. Everything here is fictional.

export const group = {
  name: "Larkmoor Senior Living",
  short: "Larkmoor",
  tagline: "Six family-owned communities in Oregon and Washington, run the same careful way since 2009.",
  phone: "(503) 555-0100",
  phoneHref: "tel:+15035550100",
  office: "210 Oak Street, Suite 300, Salem, OR 97301",
  founded: 2009,
};

export type CareLevel = "Independent living" | "Assisted living" | "Memory care";

export interface Community {
  slug: string;
  name: string;
  city: string;
  state: "OR" | "WA";
  zip: string;
  address: string;
  phone: string;
  phoneHref: string;
  care: CareLevel[];
  residents: number;
  apartments: number;
  opened: number;
  licence: string;
  lastSurvey: string;
  director: string;
  photo: string;
  alt: string;
  line: string;
  href?: string; // full community site, where one exists
  lat: number;
  lng: number;
}

export const communities: Community[] = [
  {
    slug: "larkmoor-house",
    name: "Larkmoor House",
    city: "Millbrook Bend",
    state: "OR",
    zip: "97xxx",
    address: "1400 Fern Street, Millbrook Bend, OR",
    phone: "(503) 555-0142",
    phoneHref: "tel:+15035550142",
    care: ["Assisted living", "Memory care"],
    residents: 84,
    apartments: 96,
    opened: 2009,
    licence: "AL-1024-0417",
    lastSurvey: "18 March 2026, no deficiencies",
    director: "Marianne Okafor",
    photo: "/photos/building-garden.jpg",
    alt: "Larkmoor House from the courtyard garden",
    line: "Our first home: a brick house on a quiet street, with a courtyard garden and a choir.",
    href: "/larkmoor-house",
    lat: 45.02,
    lng: -122.98,
  },
  {
    slug: "ashby-grove",
    name: "Ashby Grove",
    city: "Salem",
    state: "OR",
    zip: "97302",
    address: "3200 Ashby Grove Lane, Salem, OR",
    phone: "(503) 555-0161",
    phoneHref: "tel:+15035550161",
    care: ["Independent living", "Assisted living", "Memory care"],
    residents: 132,
    apartments: 148,
    opened: 2013,
    licence: "AL-1024-0588",
    lastSurvey: "6 May 2026, no deficiencies",
    director: "Robert Alvarado",
    photo: "/photos/home-ashby.jpg",
    alt: "Ashby Grove, a large house set in lawns and gardens",
    line: "Our largest home, with cottages for independent living in the grounds.",
    lat: 44.9,
    lng: -123.04,
  },
  {
    slug: "willow-bend",
    name: "Willow Bend",
    city: "Eugene",
    state: "OR",
    zip: "97405",
    address: "88 Willow Bend Road, Eugene, OR",
    phone: "(541) 555-0177",
    phoneHref: "tel:+15415550177",
    care: ["Assisted living", "Memory care"],
    residents: 71,
    apartments: 80,
    opened: 2016,
    licence: "AL-2041-0233",
    lastSurvey: "22 January 2026, no deficiencies",
    director: "Susan Ihara",
    photo: "/photos/home-willow.jpg",
    alt: "Willow Bend on its wooded hillside",
    line: "On a wooded hillside above the river, ten minutes from the university.",
    lat: 44.02,
    lng: -123.1,
  },
  {
    slug: "harbor-view",
    name: "Harbor View",
    city: "Astoria",
    state: "OR",
    zip: "97103",
    address: "415 Harbor View Terrace, Astoria, OR",
    phone: "(503) 555-0190",
    phoneHref: "tel:+15035550190",
    care: ["Assisted living"],
    residents: 46,
    apartments: 52,
    opened: 2018,
    licence: "AL-1071-0102",
    lastSurvey: "3 December 2025, 1 citation corrected in 9 days",
    director: "Colleen Byrne",
    photo: "/photos/home-harbor.jpg",
    alt: "Harbor View’s terraced garden with stone steps",
    line: "Our smallest home, on the hill above the river mouth, with a terraced garden.",
    lat: 46.19,
    lng: -123.83,
  },
  {
    slug: "maple-court",
    name: "Maple Court",
    city: "Vancouver",
    state: "WA",
    zip: "98663",
    address: "1901 Maple Court, Vancouver, WA",
    phone: "(360) 555-0128",
    phoneHref: "tel:+13605550128",
    care: ["Assisted living", "Memory care"],
    residents: 94,
    apartments: 104,
    opened: 2020,
    licence: "ALF-2296",
    lastSurvey: "14 April 2026, no deficiencies",
    director: "Ken Watanabe",
    photo: "/photos/home-maple.jpg",
    alt: "Maple Court’s stone frontage with climbing roses",
    line: "Our only Washington home, across the river from Portland, with a memory care garden on the roof.",
    lat: 45.64,
    lng: -122.66,
  },
  {
    slug: "fernhill",
    name: "Fernhill",
    city: "Bend",
    state: "OR",
    zip: "97702",
    address: "650 Fernhill Drive, Bend, OR",
    phone: "(541) 555-0114",
    phoneHref: "tel:+15415550114",
    care: ["Independent living", "Assisted living"],
    residents: 88,
    apartments: 96,
    opened: 2022,
    licence: "AL-2087-0341",
    lastSurvey: "9 July 2026, no deficiencies",
    director: "Elena Marsh",
    photo: "/photos/home-fernhill.jpg",
    alt: "Fernhill with its blooming front garden",
    line: "Our newest home, on the east side of Bend, with independent-living apartments and a walking trail.",
    lat: 44.05,
    lng: -121.28,
  },
];

export const shared = [
  { title: "A nurse in the building, day and night", text: "Every home has a licensed nurse on site 24 hours a day and a caregiver ratio we publish, not a target." },
  { title: "This week’s calendar and menus, online", text: "Every home publishes its real activity calendar and menus a week ahead, with times, rooms and dietary options." },
  { title: "Named people, and who to call", text: "Every home lists its directors and nurses by name, with what to call them about and how." },
  { title: "Family owned since 2009", text: "One family, six homes, no outside investors. The Executive Director of each home reports to a person, not a fund." },
  { title: "Notices that reach you first", text: "Urgent notices go to every family contact by text, email and app within a minute, in their language." },
  { title: "The state record, published", text: "Every home publishes its full state inspection history, including any citation and how quickly it was corrected." },
];

export const groupFaqs = [
  { q: "How do I choose between your communities?", a: "Start with where family can visit easily; most people choose the home closest to a daughter or son. Then match the care level: independent living is at Ashby Grove and Fernhill, memory care is at four of the six. Ring the central office and we will tell you honestly which homes have space for the care your family member needs." },
  { q: "Can a resident move between communities?", a: "Yes. If a family moves, or care needs change and a different home fits better, the move is arranged between the two Executive Directors with no new community fee." },
  { q: "Are the homes all run the same way?", a: "The same standards, the same published calendar and menus, the same nurse cover and the same family handbook. Each home has its own Executive Director, its own kitchen and its own character." },
  { q: "How are rates set?", a: "Each home publishes its own rate schedule with an effective date. Your monthly cost is the apartment rate plus the care level from the nurse’s assessment, reviewed every 90 days. Ask any home for its current schedule." },
  { q: "Do you take Medicaid?", a: "Every Oregon home holds a number of Medicaid waiver apartments for residents after two years of private residency. Maple Court, in Washington, works with the state’s COPES program." },
  { q: "Who do I speak to if something is wrong?", a: "The Executive Director of the home first. If you are not satisfied, the family liaison at the central office, and after that the state ombudsman, whose number is on every home’s handbook page." },
];
