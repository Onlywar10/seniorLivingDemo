// Wrenhaven Senior Living: the parent company's purpose, values and philosophy, shared by every community.
// Wrenhaven, its communities, people and places are fictional; this is an example site.

import type { CommunitySlug } from "@/lib/sites";

export const purpose =
  "We build communities where older adults set the terms of their own days, where every team member is known and valued, and where joy, purpose and good company are part of everyday life.";

/** Where the name comes from: a line from the founder, shown on the About pages. */
export const nameOrigin = {
  quote: "The wren is a small bird with a big voice. It builds its home wherever it is welcome, and it never stops singing.",
  author: "Helen Ashcombe, founder",
};

export const values = [
  { key: "curiosity", name: "Curiosity", text: "We ask good questions and listen closely, and we never stop learning from residents, families and one another.", icon: "/img/brand/values/curiosity.svg" },
  { key: "creativity", name: "Creativity", text: "When someone asks for something new, we start by working out how to make it happen.", icon: "/img/brand/values/creativity.svg" },
  { key: "resilience", name: "Resilience", text: "Plans change. We meet the change with patience and a sense of humour, and we get through it together.", icon: "/img/brand/values/resilience.svg" },
  { key: "compassion", name: "Compassion", text: "We walk alongside people, at their pace and on their terms.", icon: "/img/brand/values/compassion.svg" },
  { key: "intention", name: "Intention", text: "Nothing here happens by accident: the menu, the music and the first hello of the day are all chosen with care.", icon: "/img/brand/values/intention.svg" },
  { key: "contribution", name: "Contribution", text: "Everyone here has something to give, and everyone gains when they share it.", icon: "/img/brand/values/contribution.svg" },
];

/** LIVE: the four ideas behind every Wrenhaven calendar (Lively, Independent, Valued, Engaged). */
export const pillars = [
  { letter: "L", word: "Lively", text: "Picking up a new skill, laughing often and finding fresh ways to make and share things.", photo: "/img/art-studio.jpg" },
  { letter: "I", word: "Independent", text: "Your day, your decisions, with plenty of chances to say yes to something unplanned.", photo: "/img/paddleboard.jpg" },
  { letter: "V", word: "Valued", text: "Sharing what you know and what you can do, and giving something back to the people around you.", photo: "/img/gardening.jpg" },
  { letter: "E", word: "Engaged", text: "Staying strong, steady and active, with more than 25 fitness classes on the schedule every week.", photo: "/img/namaste.jpg" },
];

// ---------------------------------------------------------------------------------------------
// Parent-site data (the Wrenhaven site at /).

export const corporate = {
  name: "Wrenhaven Senior Living",
  street: "200 Market Street, Suite 300",
  city: "Calder",
  state: "CA",
  zip: "95910",
  addressLine: "200 Market Street, Suite 300, Calder, CA 95910",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=200+Market+Street+Suite+300+Calder+CA+95910",
  phone: "916-555-0100",
  phoneHref: "tel:+19165550100",
  email: "info@wrenhaven.example",
  careersEmail: "hr@wrenhaven.example",
};

/** Facts about each open community that the community data files don't all carry (published on /communities/). */
export const communityFacts: Record<CommunitySlug, { opened: string; openedYear: number; apartments: { independentAssisted: number; lantern: number }; photo: string; alt: string; first?: true }> = {
  "alder-bend": {
    opened: "February 2017",
    openedYear: 2017,
    apartments: { independentAssisted: 111, lantern: 19 },
    photo: "/img/exterior.jpg",
    alt: "Alder Bend’s entrance and gardens",
    first: true,
  },
  "kestrel-point": {
    opened: "June 2021",
    openedYear: 2021,
    apartments: { independentAssisted: 117, lantern: 22 },
    photo: "/img/juniper.jpg",
    alt: "A bright dining room at Kestrel Point",
  },
};

export interface ComingCommunity { key: string; name: string; city: string; state: string; crossStreets: string; planned: string; living: string[]; apartments: number }

export const comingCommunities: ComingCommunity[] = [
  { key: "thistle-ridge", name: "Thistle Ridge", city: "Calder", state: "CA", crossStreets: "Thistle Parkway & Ridge Road", planned: "Fall 2027", living: ["Independent Living", "Assisted Living Services"], apartments: 134 },
  { key: "sorrel-hill", name: "Sorrel Hill", city: "Sorrel Valley", state: "CA", crossStreets: "Sorrel Avenue & Orchard Lane", planned: "Fall 2027", living: ["Independent Living", "Assisted Living Services"], apartments: 115 },
];

export const leadership = [
  {
    name: "Helen Ashcombe",
    role: "Founder and Principal",
    bio: [
      "Helen came to senior living from a background in hospitality and interior design. After years of planning hotels and restaurants, she wanted to build places where older adults would feel just as much at home.",
      "She founded Wrenhaven to do exactly that, and Alder Bend was the first community she opened. She still walks through every building before it opens, checking the light, the chairs and the view from each window.",
    ],
  },
  {
    name: "Peter Lindgren",
    role: "Co-Founder and Principal",
    bio: [
      "Peter spent the early part of his career in finance and operations, helping growing companies build teams that last. He joined Helen to bring the same care to the business side of senior living.",
      "He looks after Wrenhaven’s planning, partnerships and new communities, and he has helped shape the values that guide every team.",
    ],
  },
];

/** What every Wrenhaven apartment has. */
export const apartmentFeatures = [
  { key: "kitchen", title: "A full kitchen", text: "Full-size stainless steel appliances, so you can keep cooking the dishes you love." },
  { key: "peninsula", title: "A kitchen peninsula", text: "Solid-surface counters and a peninsula with room for coffee, a quick lunch or a long chat." },
  { key: "windows", title: "Big, bright windows", text: "Generous windows that bring the California sun into every room." },
  { key: "furniture", title: "Space for your things", text: "Room for a full dining table and a sectional, so the pieces you treasure can come with you." },
  { key: "closets", title: "Walk-in closets", text: "Walk-in closets and plenty of storage, so you don’t have to give up what matters." },
  { key: "laundry", title: "Washer and dryer", text: "A full-size washer and dryer in every apartment." },
] as const;

/** Benefits for every Wrenhaven team member. */
export const benefits = [
  { title: "401K with company match", icon: "chart" },
  { title: "Paid volunteer time", icon: "heart" },
  { title: "Medical, dental and vision insurance", icon: "plus" },
  { title: "Life and disability insurance", icon: "check" },
  { title: "Flexible spending account", icon: "layers" },
  { title: "Tuition assistance", icon: "doc" },
  { title: "15 days of paid time off, rising after year four", icon: "sun" },
  { title: "6 paid holidays", icon: "calendar" },
  { title: "A free meal every day you work", icon: "fork" },
  { title: "Paid professional development", icon: "spark" },
] as const;
