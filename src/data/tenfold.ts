// Tenfold Senior Living: the parent company's purpose, values and philosophy, shared by every community.

import type { CommunitySlug } from "@/lib/sites";

export const purpose =
  "We are driven to create communities where older adults choose how they live, team members are seen and appreciated, and everyone is inspired to embrace joy, purpose and connection.";

export const nameOrigin = {
  quote: "Each gives to each, and like the star gets back its gift in tenfold pay.",
  author: "Joaquin Miller",
};

export const values = [
  { key: "curiosity", name: "Curiosity", text: "We ask, we listen and we keep learning — from residents, families and each other.", icon: "/img/brand/curiosity.png" },
  { key: "creativity", name: "Creativity", text: "We look for the ‘how can we’ in every request, and we make room for self-expression.", icon: "/img/brand/creativity.png" },
  { key: "resilience", name: "Resilience", text: "We adapt with good humour and keep moving forward together.", icon: "/img/brand/resilience.png" },
  { key: "compassion", name: "Compassion", text: "Being with, not doing to.", icon: "/img/brand/compassion.png" },
  { key: "intention", name: "Intention", text: "Every detail, from the menu to the morning greeting, is chosen on purpose.", icon: "/img/brand/purpose.png" },
  { key: "contribution", name: "Contribution", text: "Each gives to each — residents and team members alike.", icon: "/img/brand/contribution.png" },
];

export const yusm = [
  { letter: "Y", word: "Youthful", text: "Learning something new, laughing often and finding new ways to express yourself.", photo: "/img/art-studio.jpg" },
  { letter: "U", word: "Useful", text: "Contributing your knowledge and skills, and giving back to the community around you.", photo: "/img/gardening.jpg" },
  { letter: "S", word: "Spontaneous", text: "Making your own decisions — and saying yes to the unexpected through Events & Adventures.", photo: "/img/paddleboard.jpg" },
  { letter: "M", word: "Mobile", text: "Fitness that keeps you from ‘stepping back’ from life, with more than 25 classes every week.", photo: "/img/namaste.jpg" },
];

// ---------------------------------------------------------------------------------------------
// Parent-site data (the Tenfold site at /). Sources: tenfoldseniorliving.com (/, /about-tenfold/,
// /communities/), checked October 2026.


export const corporate = {
  name: "Tenfold Senior Living",
  street: "985 SW Disk Drive, Suite 120",
  city: "Bend",
  state: "OR",
  zip: "97702",
  addressLine: "985 SW Disk Drive, Suite 120, Bend, OR 97702",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=985+SW+Disk+Drive+Suite+120+Bend+OR+97702",
  phone: "916-500-0705",
  phoneHref: "tel:+19165000705",
  email: "info@tenfoldseniorliving.com",
  careersEmail: "hr@tenfoldseniorliving.com",
};

/** Facts about each open community that the community data files don't all carry (published on /communities/). */
export const communityFacts: Record<CommunitySlug, { opened: string; openedYear: number; apartments: { independentAssisted: number; harbor: number }; photo: string; alt: string; first?: true }> = {
  "prairie-city-landing": {
    opened: "February 2017",
    openedYear: 2017,
    apartments: { independentAssisted: 111, harbor: 19 },
    photo: "/img/exterior.jpg",
    alt: "Prairie City Landing’s entrance and gardens",
    first: true,
  },
  "bruceville-point": {
    opened: "June 2021",
    openedYear: 2021,
    apartments: { independentAssisted: 117, harbor: 22 },
    photo: "/img/cypress.jpg", // TODO photo: a Bruceville Point exterior
    alt: "A bright dining room at Bruceville Point",
  },
};

export interface ComingCommunity { key: string; name: string; city: string; state: string; crossStreets: string; planned: string; living: string[]; apartments: number }

export const comingCommunities: ComingCommunity[] = [
  { key: "arena-landing", name: "Arena Landing", city: "Sacramento", state: "CA", crossStreets: "Arena Boulevard & Truxel Road", planned: "Fall 2027", living: ["Independent Living", "Assisted Living Services"], apartments: 134 },
  { key: "morgan-hill-landing", name: "Morgan Hill Landing", city: "Morgan Hill", state: "CA", crossStreets: "Jarvis Drive & Butterfield Boulevard", planned: "Fall 2027", living: ["Independent Living", "Assisted Living Services"], apartments: 115 },
];

export const leadership = [
  {
    name: "Brigid Flanigan",
    role: "Founder and Principal",
    bio: [
      "Brigid has been developing senior living communities since 1992, in California and the Northwest. Before founding Tenfold she developed five assisted living projects in Northern California and two near Portland, Oregon.",
      "Prairie City Landing was her first Tenfold community. She also served eight years as a commissioner on the City of Portland Design Commission.",
    ],
  },
  {
    name: "Thomas Bahrman",
    role: "Co-Founder and Principal",
    bio: [
      "Thomas holds a bachelor’s degree in computer science from the University of Puget Sound, an MBA from the Atkinson Graduate School of Management and a law degree from Willamette University College of Law.",
      "He has helped shape the values-based culture that runs through every Tenfold community.",
    ],
  },
];

/** What every Tenfold apartment has. */
export const apartmentFeatures = [
  { key: "kitchen", title: "Full-sized stainless kitchens", text: "A real kitchen with full-size stainless steel appliances, for the meals you still love to cook." },
  { key: "peninsula", title: "Solid-surface peninsula", text: "Solid-surface counters and a peninsula for morning coffee, casual dinners and conversation." },
  { key: "windows", title: "Oversized windows", text: "Big windows that fill every room with California light." },
  { key: "furniture", title: "Room for your furniture", text: "Space for a full dining set and a sectional, so your favourite pieces come with you." },
  { key: "closets", title: "Walk-in closets", text: "Walk-in closets and generous storage, so nothing has to be left behind." },
  { key: "laundry", title: "Washer and dryer", text: "A full-size washer and dryer in every apartment." },
] as const;

/** Benefits for every Tenfold team member (tenfoldseniorliving.com/about-tenfold/). */
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
