// Bruceville Point: the facts every page draws on.
// Mirrors src/data/site.ts (Prairie City Landing) export for export.
//
// Sources: brucevillepoint.com (home, /about/, /contact-us/, /floor-plans-and-pricing/,
// /independent-living/, /assisted-living/, /memory-care/, /amazing-spaces/, /dining/,
// /fitness/, /events-adventures/, /careers/, /all-are-welcome/, /senior-living-guides/,
// /blog-events/ and the posts it lists), checked October 2026.
//
// SHARED, NOT HERE: `purpose`, `nameOrigin`, `values` and `yusm` are Tenfold-wide, not per
// community. Import them from the shared Tenfold module (today: src/data/site.ts).
//
// SHAPE DIFFERENCES FROM src/data/site.ts
// - `site`: same keys. `phonesAlso` holds the second number from the Tenfold communities page.
//   Extra keys: `opened` ("June 2021"), `apartments` (published counts), `sister` points at PCL.
// - `awards`: empty. The site states no awards for Bruceville Point.
// - `steward`: `null`. No Team Steward of the Month is published. Type: `Steward | null`.
// - `TeamMember`: adds `unnamed?: true` for roles with no published name (the role is used
//   as the name). No extensions are published, so `ext` is never set.
// - `instructors`: adds `unnamed?: true` (role-only entries).
// - `Plan`: `baths` is `number | null`. Bath count is published only for C2 (“Two Bath”) and
//   the Harbor plans (“w/ Private Bath”). Studios and one-bedrooms use 1 (one bath is the only
//   layout that fits their size); C1 and C3 are `null` because the site does not say.
//   `available` / `waitlist` are not published; they are operational figures like PCL’s and
//   should come from the business office.
//   Room key "den" is new (B7). FloorPlan.tsx has no label or door rule for it yet.
// - `pricing`: same keys, published figures. There is no assisted-living-only plan, so
//   `plans` has no `kind: "assisted"` entries (services are delivered in any apartment).
//   Published discrepancies kept as published: Harbor studio headline “$8,750” vs plan
//   MC1 “$8,715”; one-bedroom headline “$5,250” vs plan B6 “$5,235”.
// - `Story`: adds optional `link` (the original post on brucevillepoint.com).
// - `guides`: `pages` is `number | null`. Page counts are not published.
// - `careers.openings[].pay` is `string | null`. Pay is not published. Extra keys:
//   `applyUrl`, `generalInterestUrl`, `quotes` (team member quotes published on /careers/).
// - `testimonials`: adds `source` (the page the quote appears on).
//
// PHOTOS: Bruceville Point’s own photos from brucevillepoint.com are in public/img/bp/: team portraits,
// the furnished 3D floor plans, the Bistro, the Club Room and the dining team. Everything else is still a stand-in
// from public/img, marked `// TODO photo`.

import { money, planKindLabel, type Award, type Living, type LivingKey, type Plan, type PlanKind, type Space, type Steward, type Story, type TeamMember, type Testimonial } from "@/data/shared";

export { money, planKindLabel };

export type { LivingKey, Plan, PlanKind, Space, Story, TeamMember };

export const site = {
  name: "Bruceville Point",
  short: "BP",
  byline: "A Tenfold Senior Living Community",
  operator: "Tenfold Senior Living",
  tagline: "Sacramento County’s newest luxury senior living community.",
  lifestyle: "Different By Design",
  independent: "You’ll love the truly independent lifestyle at Bruceville Point.",
  address: { street: "9730 Backer Ranch Road", city: "Elk Grove", state: "CA", zip: "95757" },
  addressLine: "9730 Backer Ranch Road, Elk Grove, CA 95757",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=9730+Backer+Ranch+Road+Elk+Grove+CA+95757",
  mapsEmbed: "https://www.google.com/maps?q=9730+Backer+Ranch+Road,+Elk+Grove,+CA+95757&output=embed",
  location: [
    "Just off Bruceville Road, a few blocks south of Elk Grove Boulevard",
    "Minutes from Old Town Elk Grove and Elk Grove Regional Park",
    "A short drive to Stone Lakes National Wildlife Refuge",
    "About 25 minutes from downtown Sacramento and Sacramento International Airport",
  ],
  phone: "(916) 226-5300",
  phoneHref: "tel:+19162265300",
  phonesAlso: ["(916) 249-2792"],
  email: "info@brucevillepoint.com",
  careersEmail: "hr@tenfoldseniorliving.com",
  accessibilityEmail: "info@tenfoldseniorliving.com",
  licence: "RCFE License #342701040",
  licenceNo: "342701040",
  facebook: "https://www.facebook.com/BrucevillePoint",
  sister: { name: "Prairie City Landing", city: "Folsom", url: "https://prairiecitylanding.com/" },
  tenfoldUrl: "https://tenfoldseniorliving.com/",
  hoursOffice: "Tours by appointment · call (916) 226-5300",
  opened: "June 2021",
  apartments: { independentAssisted: 117, harbor: 22 },
};

export const awards: Award[] = [];

export const welcome = {
  intro: "Bruceville Point is a home for everyone. Tenfold works to create compassionate communities that value diversity, promote equity and foster inclusion.",
  points: [
    { title: "Diversity, broadly understood", text: "Race, ethnicity, age, ability, gender identity and expression, sexual orientation, socioeconomic status and life experience all belong here." },
    { title: "Equity", text: "We work to remove barriers, so every resident gets the support they need to thrive." },
    { title: "ASL interpreters", text: "For residents and visitors who are deaf or hard of hearing, we arrange live or online American Sign Language interpreters when appropriate." },
    { title: "Accommodations", text: "We make reasonable accommodations for people with disabilities, including hearing impairment. Just ask the front desk team." },
  ],
};

export const living: Record<LivingKey, Living> = {
  independent: {
    key: "independent",
    name: "Independent Living",
    href: "/living/independent-living",
    lede: "Roomy, light-filled studio, one- and two-bedroom apartments up to 1,184 square feet, with full kitchens, your own washer and dryer, and room for full-sized furniture.",
    from: "From $5,100 a month",
    photo: "/img/apt-living.jpg", // TODO photo
    alt: "A bright apartment living room and kitchen",
    points: [
      "Studio, one-bedroom, one-bedroom with den and two-bedroom apartments, 643 to 1,184 sq ft",
      "Oversized windows and full-size kitchens with stainless steel appliances",
      "Solid-surface countertops and a peninsula for casual dining",
      "Walk-in closets and plenty of storage",
      "A full-size washer and dryer in every apartment",
      "Balconies or patios in select apartments",
      "Covered parking available",
      "No second-person fee — about $10,000 a year saved for couples",
      "Assisted Living Services available in every apartment",
    ],
  },
  assisted: {
    key: "assisted",
    name: "Assisted Living Services",
    href: "/living/assisted-living",
    lede: "A full range of Assisted Living Services, delivered privately in your own apartment, so you can stay in your home as your needs change.",
    from: "$950 a month base support fee, plus personal care by care plan",
    photo: "/img/care-chat.jpg", // TODO photo
    alt: "A Care Partner chatting with a resident on her sofa",
    points: [
      "Available in every Bruceville Point apartment — residents never have to move",
      "Delivered and managed by the Tenfold resident services team",
      "The Resident Services Director tailors your services as your needs change",
      "Medication management",
      "Assistance with personal care",
      "Escorts to meals, activities and appointments",
      "Coordination with healthcare providers and allied health services",
      "Additional services based on a personal assessment before move-in",
    ],
  },
  harbor: {
    key: "harbor",
    name: "Harbor Memory Care",
    href: "/living/harbor-memory-care",
    lede: "An environment of youthful optimism, where ‘we can’t’ becomes ‘how can we…?’ for every resident.",
    from: "From $8,750 a month",
    photo: "/img/harbor-living.jpg", // TODO photo
    alt: "Harbor’s bright living room with armchairs",
    points: [
      "22 private apartments in a home-like, secured neighborhood",
      "A secure courtyard with raised planters, seating, activity tables, walking paths and a putting green",
      "Separate living, dining and activity spaces",
      "Activity programming 12 hours a day, 7 days a week, by a dedicated activity team",
      "Its own Events & Adventures calendar, with outings beyond the community",
      "Ceramics, music, pet therapy, therapeutic storytelling, literature review and gardening",
      "Museum outings, golf, camping, visits with horses — even stand-up paddling",
      "Daily fitness classes designed by our Fitness Director",
      "Meals prepared within Harbor, and welcome at every community event",
      "Physical therapy and hospice care available when needed",
    ],
  },
};

export const pricing = {
  independent: [
    { name: "Studio", from: 5100 },
    { name: "One bedroom", from: 5250 },
    { name: "Two bedroom", from: 7550 },
  ],
  independentRange: [5100, 9655] as const,
  assistedBase: 950,
  harbor: [
    { name: "Studio with private bath", from: 8750 },
    { name: "One bedroom with private bath", from: 11000 },
  ],
  secondPersonSaving: 10000,
  included: [
    "Weekly housekeeping, with flat linens laundered in your own washer and dryer",
    "Emergency response system in every apartment, with our team on site 24 hours",
    "Secure gated access with coded entry and all-hours camera surveillance",
    "Covered parking available",
    "All maintenance, with handyman services as needed",
    "All utilities, full internet and cable",
    "Assisted Living Services available in your own apartment",
  ],
};

const ilFeatures = ["Full kitchen with stainless steel appliances", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows", "Emergency response system"];
const harborFeatures = ["Private bathroom", "Secured Harbor neighborhood", "Direct access to the Harbor courtyard", "Emergency response system"];

export const plans: Plan[] = [
  { code: "A1", render: "/img/bp/plans/A1.png", name: "Studio", kind: "independent", beds: 0, baths: 1, sqft: 643, from: 5100, available: 1, waitlist: 0, features: ["Full kitchen with peninsula", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows"], rooms: [["kitchen", 0, 0, 28, 46], ["living", 28, 0, 72, 46], ["entry", 0, 46, 24, 24], ["bath", 24, 46, 34, 24], ["closet", 58, 46, 42, 24]] },
  { code: "B6", render: "/img/bp/plans/B6.png", name: "One Bedroom Standard", kind: "independent", beds: 1, baths: 1, sqft: 667, from: 5235, available: 1, waitlist: 0, features: ilFeatures, rooms: [["kitchen", 0, 0, 28, 48], ["living", 28, 0, 36, 48], ["bedroom", 64, 0, 36, 48], ["entry", 0, 48, 22, 22], ["bath", 22, 48, 32, 22], ["closet", 54, 48, 46, 22]] },
  { code: "B1", render: "/img/bp/plans/B1.png", name: "One Bedroom - Deluxe", kind: "independent", beds: 1, baths: 1, sqft: 709, from: 5370, available: 0, waitlist: 2, features: ilFeatures, rooms: [["kitchen", 0, 0, 28, 48], ["living", 28, 0, 38, 48], ["bedroom", 66, 0, 34, 48], ["entry", 0, 48, 22, 22], ["bath", 22, 48, 34, 22], ["closet", 56, 48, 44, 22]] },
  { code: "B2", render: "/img/bp/plans/B2.png", name: "One Bedroom - Premium", kind: "independent", beds: 1, baths: 1, sqft: 773, from: 6060, available: 1, waitlist: 0, features: ilFeatures, rooms: [["kitchen", 0, 0, 26, 50], ["living", 26, 0, 38, 50], ["bedroom", 64, 0, 36, 50], ["entry", 0, 50, 20, 20], ["bath", 20, 50, 36, 20], ["closet", 56, 50, 44, 20]] },
  { code: "B5", render: "/img/bp/plans/B5.png", name: "One Bedroom - Select Premium", kind: "independent", beds: 1, baths: 1, sqft: 820, from: 6360, available: 0, waitlist: 1, features: ilFeatures, rooms: [["kitchen", 0, 0, 28, 50], ["living", 28, 0, 40, 50], ["bedroom", 68, 0, 32, 50], ["entry", 0, 50, 18, 20], ["bath", 18, 50, 30, 20], ["closet", 48, 50, 52, 20]] },
  { code: "B7", render: "/img/bp/plans/B7.png", name: "One Bedroom w/ Den", kind: "independent", beds: 1, baths: 1, sqft: 830, from: 6425, available: 0, waitlist: 3, features: [...ilFeatures, "Den for a study, hobby room or guest"], rooms: [["kitchen", 0, 0, 24, 46], ["living", 24, 0, 40, 46], ["bedroom", 64, 0, 36, 46], ["entry", 0, 46, 20, 24], ["den", 20, 46, 26, 24], ["bath", 46, 46, 22, 24], ["closet", 68, 46, 32, 24]] },
  { code: "B3", render: "/img/bp/plans/B3.png", name: "One Bedroom Premium", kind: "independent", beds: 1, baths: 1, sqft: 835, from: 6500, available: 1, waitlist: 0, features: ilFeatures, rooms: [["kitchen", 0, 0, 26, 44], ["living", 26, 0, 40, 52], ["bedroom", 66, 0, 34, 52], ["entry", 0, 44, 26, 26], ["bath", 26, 52, 30, 18], ["closet", 56, 52, 44, 18]] },
  { code: "B4", render: "/img/bp/plans/B4.png", name: "One Bedroom - Entry Tower Unit", kind: "independent", beds: 1, baths: 1, sqft: 878, from: 6820, available: 0, waitlist: 2, features: [...ilFeatures, "Tower corner with windows on two sides"], rooms: [["kitchen", 0, 0, 24, 48], ["living", 24, 0, 44, 48], ["bedroom", 68, 0, 32, 70], ["entry", 0, 48, 20, 22], ["bath", 20, 48, 26, 22], ["closet", 46, 48, 22, 22]] },
  { code: "C1", render: "/img/bp/plans/C1.png", name: "Two Bedroom Deluxe", kind: "independent", beds: 2, baths: null, sqft: 943, from: 7550, available: 1, waitlist: 0, features: [...ilFeatures, "Second bedroom"], rooms: [["kitchen", 0, 0, 26, 50], ["living", 26, 0, 38, 50], ["bedroom", 64, 0, 36, 38], ["bedroom2", 64, 38, 36, 32], ["entry", 0, 50, 18, 20], ["bath", 18, 50, 24, 20], ["closet", 42, 50, 22, 20]] },
  { code: "C3", render: "/img/bp/plans/C3.png", name: "Two Bedroom Tower Unit", kind: "independent", beds: 2, baths: null, sqft: 975, from: 7815, available: 0, waitlist: 2, features: [...ilFeatures, "Tower corner with windows on two sides", "Second bedroom"], rooms: [["kitchen", 0, 0, 24, 50], ["living", 24, 0, 42, 50], ["bedroom", 66, 0, 34, 36], ["bedroom2", 66, 36, 34, 34], ["entry", 0, 50, 18, 20], ["bath", 18, 50, 26, 20], ["closet", 44, 50, 22, 20]] },
  { code: "C2", render: "/img/bp/plans/C2.png", name: "Two Bedroom/Two Bath Premium", kind: "independent", beds: 2, baths: 2, sqft: 1184, from: 9655, available: 0, waitlist: 4, features: [...ilFeatures, "Second full bathroom", "Second bedroom"], rooms: [["kitchen", 0, 0, 24, 50], ["living", 24, 0, 44, 50], ["bedroom", 68, 0, 32, 38], ["bedroom2", 68, 38, 32, 32], ["entry", 0, 50, 16, 20], ["bath", 16, 50, 28, 20], ["closet", 44, 50, 24, 20]] },
  { code: "MC1", render: "/img/bp/plans/MC1.png", name: "Studio w/ Private Bath", kind: "harbor", beds: 0, baths: 1, sqft: 357, from: 8715, available: 1, waitlist: 0, features: harborFeatures, rooms: [["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 70], ["entry", 0, 50, 30, 20], ["closet", 30, 50, 40, 20]] },
  { code: "MC2", render: "/img/bp/plans/MC2.png", name: "Studio - Premium w/ Private Bath", kind: "harbor", beds: 0, baths: 1, sqft: 420, from: 9110, available: 0, waitlist: 1, features: harborFeatures, rooms: [["bedroom", 0, 0, 72, 48], ["bath", 72, 0, 28, 70], ["entry", 0, 48, 32, 22], ["closet", 32, 48, 40, 22]] },
  { code: "MC6", render: "/img/bp/plans/MC6.png", name: "Tower Studio w/ Private Bath", kind: "harbor", beds: 0, baths: 1, sqft: 560, from: 9905, available: 0, waitlist: 0, features: [...harborFeatures, "Tower corner with a sitting area"], rooms: [["living", 0, 0, 40, 50], ["bedroom", 40, 0, 60, 46], ["entry", 0, 50, 26, 20], ["bath", 26, 50, 34, 20], ["closet", 60, 46, 40, 24]] },
  { code: "MC4", render: "/img/bp/plans/MC4.png", name: "1 Bedroom w/ Private Bath", kind: "harbor", beds: 1, baths: 1, sqft: 584, from: 11010, available: 1, waitlist: 0, features: [...harborFeatures, "Separate living room"], rooms: [["living", 0, 0, 42, 50], ["bedroom", 42, 0, 58, 48], ["entry", 0, 50, 22, 20], ["bath", 22, 50, 34, 20], ["closet", 56, 48, 44, 22]] },
  { code: "MC3", render: "/img/bp/plans/MC3.png", name: "1 Bedroom w/ Private Bath", kind: "harbor", beds: 1, baths: 1, sqft: 632, from: 11515, available: 0, waitlist: 1, features: [...harborFeatures, "Separate living room"], rooms: [["living", 0, 0, 46, 50], ["bedroom", 46, 0, 54, 46], ["entry", 0, 50, 24, 20], ["bath", 24, 50, 36, 20], ["closet", 60, 46, 40, 24]] },
];

export const spaces: Space[] = [
  { key: "bistro", name: "The Bistro", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", text: "Our Italian-style coffeehouse and wine bar is the all-day ‘town hall’ — a latte to start the day, a glass of wine with friends and family before dinner, and a daily happy hour with cocktails, mocktails and complimentary snacks.", photo: "/img/bp/bistro.jpg", alt: "The Bistro’s fireside lounge, with armchairs by a two-sided fireplace and café tables beyond" },
  { key: "cypress", name: "The Cypress Room", kind: "Restaurant", hours: "11:00 am–7:00 pm", text: "White-tablecloth service and a seasonally inspired weekly menu featuring local, market-fresh ingredients.", photo: "/img/cypress.jpg", alt: "A dining room set with white tablecloths" }, // TODO photo
  { key: "stonelakes", name: "Stone Lakes Cafe", kind: "All-day café", hours: "7:00 am–7:00 pm", text: "Relaxed, all-day, California-casual dining: modern comfort food, soups, salads, sandwiches, pasta and a daily chef’s special.", photo: "/img/natoma.jpg", alt: "A sunny café dining area" }, // TODO photo
  { key: "theatre", name: "Theatre", kind: "Media & theater room", text: "A state-of-the-art theatre for movies, lectures and performances by visiting artists — and the Fitness Director’s talks on nutrition and mindfulness.", photo: "/img/theatre.jpg", alt: "A theatre with tiered armchairs and a large screen" }, // TODO photo
  { key: "art", name: "Art Studio", kind: "Studio", text: "A dedicated, well-equipped studio for all things creative, with visiting instructors for occasional classes and our monthly Paint and Sip.", photo: "/img/art-studio.jpg", alt: "An art studio with long work tables and easels" }, // TODO photo
  { key: "fitness", name: "Gym", kind: "Fitness", text: "Generous space for group exercise — more than 25 classes a week — and equipment designed specifically for seniors for individual workouts.", photo: "/img/fitness-center.jpg", alt: "A gym with exercise machines and a class floor" }, // TODO photo
  { key: "salon", name: "Salon", kind: "Salon", text: "Our on-site salon, so you look great for every event.", photo: "/img/salon.jpg", alt: "Salon styling chairs and mirrors" }, // TODO photo
  { key: "club", name: "Club Room", kind: "Private dining", text: "A social space you can reserve for private parties, with catering available. When the celebration moves outside, the adjacent patio is ready.", photo: "/img/bp/club-room.jpg", alt: "The Club Room, with teal walls, a sofa and a table set for a private gathering" },
  { key: "courtyard", name: "Courtyard", kind: "Outdoor living room", text: "A beautifully landscaped courtyard with seating for sun-worshippers and shade-lovers, a bocce court, a fire pit, outdoor dining with gas BBQs, raised planters for herbs and vegetables, and a cutting garden of lavender and tea roses.", photo: "/img/courtyard-bocce.jpg", alt: "A landscaped courtyard with a bocce court", more: ["An exercise area for dogs and cats, with seating that overlooks the courtyard", "Walking paths for a morning loop"] }, // TODO photo
  { key: "harbor-courtyard", name: "Harbor Courtyard", kind: "Secure garden", text: "Harbor’s own secure courtyard, with raised planter boxes, seating, activity tables, walking paths and a putting green.", photo: "/img/harbor-garden.jpg", alt: "A secure garden courtyard with raised planters" }, // TODO photo
  { key: "lobby", name: "Lobby", kind: "Arrivals", text: "Where the front desk team welcomes visitors and every outing departs.", photo: "/img/lobby.jpg", alt: "A bright lobby with sofas" }, // TODO photo
];

export const team: TeamMember[] = [
  { name: "Marianne Richardson", photo: "/img/bp/team/marianne.jpg", role: "Executive Director", dept: "Leadership", key: true, bio: "Marianne joined Bruceville Point as Executive Director in December 2025, after more than fifteen years leading senior living communities. In her words: “Laughter breaks down walls. I love being a goofball whenever I can.”" },
  { name: "Jaime Cervantes", photo: "/img/bp/team/jaime.jpg", role: "Community Relations Director", dept: "Tours & move-ins", key: true, bio: "Jaime is your first call for tours, apartments, pricing and planning a move." },
  { name: "Nicole Grayson", photo: "/img/bp/team/nicole.jpg", role: "Resident Services Director", dept: "Assisted Living Services", key: true, bio: "Nicole leads the resident services team and tailors Assisted Living Services to each resident as their needs change." },
  { name: "Amrita Sapkota", photo: "/img/bp/team/amrita.jpg", role: "Harbor Director", dept: "Harbor", key: true, bio: "Amrita leads Harbor Memory Care and its own Events & Adventures calendar." },
  { name: "Timothy Smith", photo: "/img/bp/team/timothy.jpg", role: "Events and Adventures Director", dept: "Events & Adventures", bio: "Timothy leads the Events & Adventures team and the calendar of classes, clubs, outings and celebrations." },
  { name: "Monica Thayer", role: "Events and Adventures Assistant", dept: "Events & Adventures", bio: "Monica works alongside Timothy on the calendar — and calls the numbers at the weekly Bingo in the Bistro." },
  { name: "Tina Trillo", photo: "/img/bp/team/tina.jpg", role: "Fitness Director", dept: "Fitness", bio: "Tina is our full-time, in-house Fitness Director. She leads more than 25 classes a week, active outings and talks on nutrition and mindfulness." },
  { name: "Personal Trainer", role: "Personal Trainer", dept: "Fitness", unnamed: true, bio: "One-to-one training in the gym, alongside the group class program." },
  { name: "Danyale Liberati Shaw", photo: "/img/bp/team/danyale.jpg", role: "Dining Experience Director", dept: "Dining", bio: "Danyale runs all three restaurants, takes lunch and private dining reservations, and gives residents a cooking lesson each month." },
  { name: "Eric Auclair", photo: "/img/bp/team/eric.jpg", role: "Culinary Director", dept: "Dining", bio: "Eric designs the menus for the Cypress Room, Stone Lakes Cafe and the Bistro." },
  { name: "Breah Taylor", photo: "/img/bp/team/breah.jpg", role: "Business Office Director", dept: "Business office", bio: "Breah looks after billing, leases and everything administrative." },
  { name: "Joe Mora", photo: "/img/bp/team/joe.jpg", role: "Maintenance Director", dept: "Maintenance", bio: "Joe and his team look after the buildings, grounds and every apartment, with handyman services as needed." },
  { name: "Betty Phelps", photo: "/img/bp/team/betty.jpg", role: "Lead Ambassador", dept: "Front desk", bio: "Betty and the Ambassador team are the first smile in the Lobby." },
  { name: "Pat Smith", photo: "/img/bp/team/pat.jpg", role: "Resident Council President", dept: "Resident Council", bio: "Pat chairs the Resident Council." },
];

/** No Team Steward of the Month is published for Bruceville Point. */
export const steward: Steward | null = null;

/** Who leads the regular classes. Only Tina Trillo is named on the site; the rest are roles. */
export const instructors: { name: string; what: string; unnamed?: true }[] = [
  { name: "Tina Trillo", what: "Fitness Director · strength, balance, Step Aerobics and more" },
  { name: "Personal Trainer", what: "One-to-one training in the gym", unnamed: true },
  { name: "Visiting art instructor", what: "Occasional Art Studio classes", unnamed: true },
  { name: "Visiting chaplain", what: "Non-Denominational Service", unnamed: true },
];

export const fitness = {
  intro: "More than 25 indoor classes a week with our full-time, in-house Fitness Director, plus a personal trainer and active outings that build strength, endurance, flexibility and balance.",
  highlights: [
    "Step Aerobics",
    "Strength training and resistance bands",
    "Sit and stretch",
    "Outings to local trails, parks and recreation areas",
    "Disc golf, basketball and Olympic rings",
    "Bocce tournaments on the courtyard court",
    "Axe throwing",
    "Talks on nutrition and mindfulness in the Theatre",
    "Gardening in the courtyard’s raised beds",
    "Community walking paths",
  ],
};

const post = (slug: string) => `https://brucevillepoint.com/${slug}/`;

// Real posts from brucevillepoint.com/blog-events/, newest first. Summaries are in our own words.
export const stories: Story[] = [
  {
    slug: "i-moved-here-to-thrive",
    kind: "News",
    title: "I moved here to thrive",
    dek: "Meet Linda, the star of our Day in the Life video, and the friendships that turned a quiet house into a lively life.",
    date: "2026-09-15",
    photo: "/img/friends-laugh.jpg", // TODO photo
    alt: "Two residents laughing together",
    link: post("i-moved-here-to-thrive"),
    body: ["After nearly fifty years of marriage, Linda found herself alone in a two-story house full of heirlooms. She moved to Bruceville Point for a livelier life, not a smaller one."],
  },
  {
    slug: "engage-connect-celebrate-every-day",
    kind: "Events & Adventures",
    author: "Liesl",
    title: "Engage, Connect, Celebrate Every Day",
    dek: "A high school visitor joins the Events & Adventures team for Bingo in the Bistro — and leads an axe-throwing class.",
    date: "2026-08-17",
    photo: "/img/wine-pong.jpg", // TODO photo
    alt: "Residents enjoying a game together",
    link: post("engage-connect-celebrate-every-day"),
    body: ["Liesl, a high school sophomore, spent several days with residents and the Events & Adventures team, and wrote about what she saw."],
  },
  {
    slug: "finding-camaraderie-and-care",
    kind: "News",
    title: "Finding Camaraderie and Care",
    dek: "Bob, Bill and Lou — veterans and caregivers — on the friendships that eased the loneliness of caring for a loved one.",
    date: "2026-06-22",
    photo: "/img/bocce-men.jpg", // TODO photo
    alt: "Three men talking outdoors",
    link: post("finding-camaraderie-and-care"),
    body: ["Three residents who served in the Air Force, the Coast Guard and beyond talk about caregiving, living alone and the neighbours who understand."],
  },
  {
    slug: "people-make-all-the-difference",
    kind: "Careers",
    title: "People Make all the Difference",
    dek: "Working at Bruceville Point is more than a paycheck. Residents and team members describe each other in the same words.",
    date: "2026-05-28",
    photo: "/img/care-laugh.jpg", // TODO photo
    alt: "A Care Partner laughing with a resident",
    link: post("people-make-all-the-difference"),
    body: ["Beautiful buildings and good benefits matter, but what sets Bruceville Point apart is the way residents and team members care for one another."],
  },
  {
    slug: "shared-stories-bring-connection",
    kind: "News",
    title: "Shared Stories Bring Connection",
    dek: "Meet Shirley and Leon, founders of Sobon Wine, who sit at a table for four so they can invite others to join them.",
    date: "2026-04-22",
    photo: "/img/wine-toast.jpg", // TODO photo
    alt: "Two glasses of wine raised in a toast",
    link: post("shared-stories-bring-connection"),
    body: ["Every resident brings a story. Shirley and Leon’s blends a three-generation family winery with fitness classes and courtyard walks."],
  },
  {
    slug: "assistance-is-the-path-to-independence",
    kind: "Wellness",
    title: "Assistance is the Path to Independence",
    dek: "A little support doesn’t take independence away. It makes room for more of what you want to do.",
    date: "2026-03-20",
    photo: "/img/care-outdoors.jpg", // TODO photo
    alt: "A Care Partner walking with a resident outdoors",
    link: post("assistance-is-the-path-to-independence"),
    body: ["At Bruceville Point, assistance is a service, not a place: residents in any apartment can add support at any time."],
  },
  {
    slug: "deciding-when-to-move-to-senior-living",
    kind: "News",
    title: "Deciding when to move to senior living",
    dek: "Residents rarely say they moved too soon. Thinking about “need” and “yet” before a crisis decides for you.",
    date: "2026-02-25",
    photo: "/img/mother-daughter.jpg", // TODO photo
    alt: "A mother and daughter talking",
    link: post("deciding-when-to-move-to-senior-living"),
    body: ["Choosing the moment to move is hard. Making the choice early keeps it yours."],
  },
  {
    slug: "respect-defines-bruceville-point",
    kind: "News",
    author: "Liesl",
    title: "Respect Defines Bruceville Point",
    dek: "A teenager’s view of senior living: how it feels to be listened to, at 13 or at 93.",
    date: "2026-01-23",
    photo: "/img/courtyard-palms.jpg", // TODO photo
    alt: "A sunny courtyard",
    link: post("respect-defines-bruceville-point"),
    body: ["Liesl expected to be a tag-along on her mom’s work trip. Instead, she felt welcomed by the team within the first hour."],
  },
  {
    slug: "home-for-the-holidays",
    kind: "News",
    title: "Home for the Holidays",
    dek: "Five tips for the difficult conversations that holiday visits can bring.",
    date: "2025-12-16",
    photo: "/img/reading-together.jpg", // TODO photo
    alt: "Family members reading together",
    link: post("home-for-the-holidays"),
    body: ["Start early, don’t parent your parent, be honest, be curious and keep it small."],
  },
  {
    slug: "welcoming-marianne-richardson",
    kind: "News",
    title: "Welcoming Marianne Richardson",
    dek: "Meet Bruceville Point’s new Executive Director.",
    date: "2025-12-12",
    photo: "/img/lobby.jpg", // TODO photo
    alt: "A bright lobby",
    link: post("welcoming-marianne-richardson"),
    body: ["Marianne Richardson takes over as Executive Director from Eric Hostetter, bringing more than fifteen years of senior living leadership."],
  },
  {
    slug: "doughnut-bread-pudding",
    kind: "Dining",
    title: "Doughnut Bread Pudding?! Yes, please! (Recipe below)",
    dek: "Danyale’s monthly cooking lesson: Comfort Crumb Custard, with the recipe to make at home.",
    date: "2025-11-20",
    photo: "/img/dish-dessert.jpg", // TODO photo
    alt: "A plated dessert",
    link: post("doughnut-bread-pudding"),
    body: ["Each month our Dining Experience Director gives residents a cooking lesson. This time: doughnut bread pudding."],
  },
  {
    slug: "care-centered-around-being-with",
    kind: "Wellness",
    title: "Care Centered Around Being With",
    dek: "A resident wanted a tattoo before she died. The Care Partners threw her a (temporary) tattoo party.",
    date: "2025-10-29",
    photo: "/img/care-chat.jpg", // TODO photo
    alt: "A Care Partner chatting with a resident",
    link: post("care-centered-around-being-with"),
    body: ["Care here is about being with residents, not doing to them — and sometimes that means a tattoo party."],
  },
];

/** The free Tenfold guides offered on brucevillepoint.com/senior-living-guides/. Page counts are not published. */
export const guides: { title: string; pages: number | null; photo: string }[] = [
  { title: "Frequently Asked Questions", pages: null, photo: "/img/coffee-woman.jpg" },
  { title: "Signature Programs", pages: null, photo: "/img/paddleboard.jpg" },
  { title: "Just the Facts: Independent Living", pages: null, photo: "/img/apt-living.jpg" },
  { title: "Just the Facts: Assisted Living", pages: null, photo: "/img/care-outdoors.jpg" },
  { title: "Just the Facts: Memory Care", pages: null, photo: "/img/harbor-couple.jpg" },
  { title: "Senior Living 101", pages: null, photo: "/img/mother-daughter.jpg" },
  { title: "Funding Care", pages: null, photo: "/img/couple-hands.jpg" },
  { title: "Stay or Go?", pages: null, photo: "/img/reading-together.jpg" },
  { title: "Family Decision Toolkit", pages: null, photo: "/img/friends-walking.jpg" },
];

export const faqs = [
  { q: "Is there a second-person fee?", a: "No. We never charge a second-person fee, which saves couples about $10,000 a year." },
  { q: "Are pets welcome?", a: "Yes. The courtyard has its own exercise area for dogs and cats, with seating that overlooks the courtyard." },
  { q: "What’s included in the monthly rent?", a: "Weekly housekeeping with flat linens laundered in your own washer and dryer, an emergency response system with our team on site 24 hours, secure gated access, all maintenance with handyman services, and all utilities with full internet and cable. Covered parking is available." },
  { q: "If I need more help later, will I have to move?", a: "No. Assisted Living Services are available in every apartment, delivered privately by our resident services team. The base support fee is $950 a month, and additional personal care fees may apply based on your care plan." },
  { q: "What is Harbor?", a: "Harbor is our secured memory care neighborhood of 22 private apartments, with its own courtyard and putting green, activity programming 12 hours a day, and outings beyond the community. Studios with a private bath start at $8,750 a month; additional care level rates apply based on a personal assessment." },
  { q: "Do you provide transportation?", a: "Yes. Our drivers take residents on Events & Adventures outings, from museum tours to park walks, and every trip departs from the Lobby. Ask the front desk about rides to shopping and appointments." },
  { q: "Can my family join me for a meal?", a: "Of course. Families and visitors are always welcome, and you can book lunch online or with our Dining Experience Director." },
  { q: "Are you licensed?", a: "Yes. Bruceville Point is licensed by the California Department of Social Services as a Residential Care Facility for the Elderly, RCFE License #342701040." },
  { q: "How do I schedule a tour?", a: "Book online any time, or call Jaime Cervantes, our Community Relations Director, at (916) 226-5300." },
];

export const careers: {
  intro: string;
  benefits: string[];
  steps: { title: string; text: string }[];
  openings: { title: string; dept: string; type: string; pay: string | null }[];
  applyUrl: string;
  generalInterestUrl: string;
  quotes: { quote: string; name: string }[];
} = {
  intro: "Working at Bruceville Point is more than a paycheck. It’s a community where people are seen and heard, and where team members and residents care for one another.",
  benefits: [
    "Medical, dental and vision insurance for full-time team members",
    "Life and disability insurance",
    "Flexible spending plan",
    "15 days’ PTO, increasing after year four",
    "6 paid holidays",
    "Paid volunteer time",
    "401(k) with company match",
    "Tuition assistance",
    "Paid professional development",
    "A free meal every day you work",
  ],
  steps: [
    { title: "Apply online", text: "Find the role that suits you and apply through our careers portal. A recruiter reviews every application." },
    { title: "Recruiter phone screen", text: "If your experience fits the role, a recruiter will call to talk it through." },
    { title: "Community interview", text: "Meet the department director at Bruceville Point and see the community for yourself." },
    { title: "Next steps", text: "After interviews, the team decides and gets back in touch with every candidate." },
  ],
  // Roles Bruceville Point commonly hires for. Current openings and pay are on the careers portal, not published here.
  openings: [
    { title: "Care Partner", dept: "Resident Services", type: "See current openings", pay: null },
    { title: "Med Tech", dept: "Resident Services", type: "See current openings", pay: null },
    { title: "Cook", dept: "Culinary", type: "See current openings", pay: null },
    { title: "Server", dept: "Dining", type: "See current openings", pay: null },
    { title: "Housekeeper", dept: "Housekeeping", type: "See current openings", pay: null },
    { title: "Receptionist", dept: "Front desk", type: "See current openings", pay: null },
    { title: "Driver", dept: "Transportation", type: "See current openings", pay: null },
    { title: "Maintenance Technician", dept: "Maintenance", type: "See current openings", pay: null },
  ],
  applyUrl: "https://recruiting.paylocity.com/recruiting/jobs/All/cf654c6a-8892-4c40-90ba-60b919c3dcaf/Bruceville-Point",
  generalInterestUrl: "https://recruiting.paylocity.com/Recruiting/PublicLeads/New/cf654c6a-8892-4c40-90ba-60b919c3dcaf",
  quotes: [
    { quote: "I love my job.", name: "Allison" },
    { quote: "They are the best!", name: "Amanda" },
    { quote: "It truly feels like home.", name: "Monica" },
    { quote: "We’re all a family here.", name: "Gabe" },
  ],
};

/** Verbatim from brucevillepoint.com, attributed as on the site. */
export const testimonials: Testimonial[] = [
  { quote: "I liked knowing that when I moved to Bruceville Point, if I needed more help in the future, I could get it.", name: "Jack", relation: "Resident", source: "https://brucevillepoint.com/" },
  { quote: "I moved here to thrive instead of just survive.", name: "Linda", relation: "Resident", source: post("i-moved-here-to-thrive") },
  { quote: "I love all the classes because they offer a variety of ways to help us stay fit.", name: "Bob", relation: "Resident", source: "https://brucevillepoint.com/fitness/" },
  { quote: "This is just a positive place.", name: "Shirley", relation: "Resident", source: post("shared-stories-bring-connection") },
  { quote: "I’m taking advantage of all the things that will help me move forward. At Bruceville Point if you’re not doing something, it’s probably because you didn’t ask if it’s possible.", name: "Ellen", relation: "Resident", source: "https://brucevillepoint.com/" },
];

/** Quick links shown in the header navigation (community-relative; the community prefix is added by the router). */
export const nav = [
  { label: "Living Options", href: "/living", children: [
    { label: "Independent Living", href: "/living/independent-living" },
    { label: "Assisted Living Services", href: "/living/assisted-living" },
    { label: "Harbor Memory Care", href: "/living/harbor-memory-care" },
    { label: "Floor Plans & Pricing", href: "/floor-plans" },
    { label: "Care Assessment", href: "/care-assessment" },
    { label: "Cost Comparison", href: "/cost-comparison" },
  ] },
  { label: "Lifestyle", href: "/lifestyle", children: [
    { label: "Activity Calendar", href: "/calendar" },
    { label: "Dining", href: "/dining" },
    { label: "Events & Adventures", href: "/events-adventures" },
    { label: "Fitness", href: "/fitness" },
    { label: "Amazing Spaces", href: "/spaces" },
    { label: "What is YUSM?", href: "/lifestyle#yusm" },
  ] },
  { label: "Calendar", href: "/calendar" },
  { label: "Dining", href: "/dining" },
  { label: "About", href: "/about", children: [
    { label: "Our Team", href: "/team" },
    { label: "Purpose & Values", href: "/about" },
    { label: "All Are Welcome", href: "/all-are-welcome" },
    { label: "News", href: "/news" },
    { label: "Senior Living Guides", href: "/guides" },
    { label: "FAQs", href: "/faq" },
    { label: "Careers", href: "/careers" },
    { label: "Info & Directions", href: "/contact" },
  ] },
];
