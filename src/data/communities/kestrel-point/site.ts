// Kestrel Point: the facts every page draws on. Fictional example content.
// Mirrors src/data/communities/alder-bend/site.ts export for export.
//
// SHARED, NOT HERE: `purpose`, `nameOrigin`, `values` and `pillars` are Wrenhaven-wide, not per
// community. Import them from the shared Wrenhaven module.
//
// SHAPE DIFFERENCES FROM THE ALDER BEND MODULE
// - `site`: same keys. `phonesAlso` holds a second listed number.
//   Extra keys: `opened` ("June 2021"), `apartments` (apartment counts), `sister` points at AB.
// - `awards`: empty. Kestrel Point lists no awards.
// - `steward`: `null`. No Team Steward of the Month. Type: `Steward | null`.
// - `TeamMember`: adds `unnamed?: true` for roles with no named person (the role is used
//   as the name). No extensions are listed, so `ext` is never set.
// - `instructors`: adds `unnamed?: true` (role-only entries).
// - `Plan`: `baths` is `number | null`. Bath count is stated only for C2 (“Two Bath”) and
//   the Lantern plans (“w/ Private Bath”). Studios and one-bedrooms use 1; C1 and C3 are `null`.
//   `available` / `waitlist` are operational figures from the business office.
//   Room key "den" is new (B7). FloorPlan.tsx has no label or door rule for it yet.
// - `pricing`: same keys. There is no assisted-living-only plan, so `plans` has no
//   `kind: "assisted"` entries (services are delivered in any apartment).
//   Deliberate discrepancies, used by the staff demo's pricing-correction approval: Lantern
//   studio headline “$8,750” vs plan MC1 “$8,715”; one-bedroom headline “$5,250” vs plan B6 “$5,235”.
// - `Story`: adds optional `link` (the post's permalink on kestrelpoint.example).
// - `guides`: `pages` is `number | null`.
// - `careers.openings[].pay` is `string | null`. Extra keys: `applyUrl`, `generalInterestUrl`,
//   `quotes` (team member quotes for /careers/).
// - `testimonials`: adds `source` (the page the quote appears on).
//
// PHOTOS: community photos live in public/img/kp/ (team portraits, furnished 3D floor plans, the Bistro,
// the Club Room). Everything else uses the shared photos in public/img.

import { money, planKindLabel, type Award, type Living, type LivingKey, type Plan, type PlanKind, type Space, type Steward, type Story, type TeamMember, type Testimonial } from "@/data/shared";

export { money, planKindLabel };

export type { LivingKey, Plan, PlanKind, Space, Story, TeamMember };

export const site = {
  name: "Kestrel Point",
  short: "KP",
  byline: "A Wrenhaven Senior Living Community",
  operator: "Wrenhaven Senior Living",
  tagline: "Calder County’s newest luxury senior living community.",
  lifestyle: "Designed Around You",
  independent: "Independent living at Kestrel Point means your days, on your own terms.",
  address: { street: "4400 Kestrel Point Drive", city: "Rivermead", state: "CA", zip: "95934" },
  addressLine: "4400 Kestrel Point Drive, Rivermead, CA 95934",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=4400+Kestrel+Point+Drive+Rivermead+CA+95934",
  mapsEmbed: "https://www.google.com/maps?q=4400+Kestrel+Point+Drive,+Rivermead,+CA+95934&output=embed",
  location: [
    "Just off Kestrel Road, a few blocks south of Rivermead Boulevard",
    "Minutes from Old Town Rivermead and Rivermead Regional Park",
    "A short drive to Meadowbrook National Wildlife Refuge",
    "About 25 minutes from downtown Calder and Calder Regional Airport",
  ],
  phone: "(916) 555-0160",
  phoneHref: "tel:+19165550160",
  phonesAlso: ["(916) 555-0172"],
  email: "info@kestrelpoint.example",
  careersEmail: "hr@wrenhaven.example",
  accessibilityEmail: "info@wrenhaven.example",
  licence: "RCFE License #100000202",
  licenceNo: "100000202",
  facebook: "https://www.facebook.com/KestrelPoint",
  sister: { name: "Alder Bend", city: "Fairhollow", url: "https://alderbend.example/" },
  wrenhavenUrl: "https://wrenhaven.example/",
  hoursOffice: "Tours by appointment · call (916) 555-0160",
  opened: "June 2021",
  apartments: { independentAssisted: 117, lantern: 22 },
};

export const awards: Award[] = [];

export const welcome = {
  intro: "Everyone belongs at Kestrel Point. Across Wrenhaven, we set out to build warm, open communities where differences are welcomed, support is fair and every neighbor feels at home.",
  points: [
    { title: "Diversity, broadly understood", text: "Whatever your background, beliefs, abilities, identity, orientation or life story, there is a place for you at our table." },
    { title: "Equity", text: "We look for the obstacles that hold people back and clear them, so each resident gets the help that fits them." },
    { title: "ASL interpreters", text: "Residents and guests who are deaf or hard of hearing can ask us to book an American Sign Language interpreter, in person or by video." },
    { title: "Accommodations", text: "If a disability or hearing loss makes something harder than it should be, tell the front desk and we will work out a reasonable accommodation together." },
  ],
};

export const living: Record<LivingKey, Living> = {
  independent: {
    key: "independent",
    name: "Independent Living",
    href: "/living/independent-living",
    lede: "Bright studios and one- and two-bedroom apartments of up to 1,184 square feet, each with a full kitchen, its own washer and dryer, and space for the furniture you love.",
    from: "From $5,100 a month",
    photo: "/img/apt-living.jpg",
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
    lede: "Help with daily life comes to you, privately and in your own apartment, so your home stays your home whatever changes.",
    from: "$950 a month base support fee, plus personal care by care plan",
    photo: "/img/care-chat.jpg",
    alt: "A Care Partner chatting with a resident on her sofa",
    points: [
      "Available in every Kestrel Point apartment — residents never have to move",
      "Delivered and managed by the Wrenhaven resident services team",
      "The Resident Services Director tailors your services as your needs change",
      "Medication management",
      "Assistance with personal care",
      "Escorts to meals, activities and appointments",
      "Coordination with healthcare providers and allied health services",
      "Additional services based on a personal assessment before move-in",
    ],
  },
  lantern: {
    key: "lantern",
    name: "Lantern Memory Care",
    href: "/living/lantern-memory-care",
    lede: "A small, secure neighborhood where every day starts with what each resident can still enjoy, and the team finds a way to make it happen.",
    from: "From $8,750 a month",
    photo: "/img/lantern-living.jpg",
    alt: "Lantern’s bright living room with armchairs",
    points: [
      "22 private apartments in a home-like, secured neighborhood",
      "A secure courtyard with raised planters, seating, activity tables, walking paths and a putting green",
      "Separate living, dining and activity spaces",
      "Activity programming 12 hours a day, 7 days a week, by a dedicated activity team",
      "Its own Events & Adventures calendar, with outings beyond the community",
      "Ceramics, music, pet therapy, therapeutic storytelling, literature review and gardening",
      "Outings to museums, the putting green, farms and the riverside, planned around each resident",
      "Daily fitness classes designed by our Fitness Director",
      "Meals prepared within Lantern, and welcome at every community event",
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
  lantern: [
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
const lanternFeatures = ["Private bathroom", "Secured Lantern neighborhood", "Direct access to the Lantern courtyard", "Emergency response system"];

export const plans: Plan[] = [
  { code: "A1", render: "/img/kp/plans/A1.png", name: "Studio", kind: "independent", beds: 0, baths: 1, sqft: 643, from: 5100, available: 1, waitlist: 0, features: ["Full kitchen with peninsula", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows"], rooms: [["kitchen", 0, 0, 28, 46], ["living", 28, 0, 72, 46], ["entry", 0, 46, 24, 24], ["bath", 24, 46, 34, 24], ["closet", 58, 46, 42, 24]] },
  { code: "B6", render: "/img/kp/plans/B6.png", name: "One Bedroom Standard", kind: "independent", beds: 1, baths: 1, sqft: 667, from: 5235, available: 1, waitlist: 0, features: ilFeatures, rooms: [["kitchen", 0, 0, 28, 48], ["living", 28, 0, 36, 48], ["bedroom", 64, 0, 36, 48], ["entry", 0, 48, 22, 22], ["bath", 22, 48, 32, 22], ["closet", 54, 48, 46, 22]] },
  { code: "B1", render: "/img/kp/plans/B1.png", name: "One Bedroom - Deluxe", kind: "independent", beds: 1, baths: 1, sqft: 709, from: 5370, available: 0, waitlist: 2, features: ilFeatures, rooms: [["kitchen", 0, 0, 28, 48], ["living", 28, 0, 38, 48], ["bedroom", 66, 0, 34, 48], ["entry", 0, 48, 22, 22], ["bath", 22, 48, 34, 22], ["closet", 56, 48, 44, 22]] },
  { code: "B2", render: "/img/kp/plans/B2.png", name: "One Bedroom - Premium", kind: "independent", beds: 1, baths: 1, sqft: 773, from: 6060, available: 1, waitlist: 0, features: ilFeatures, rooms: [["kitchen", 0, 0, 26, 50], ["living", 26, 0, 38, 50], ["bedroom", 64, 0, 36, 50], ["entry", 0, 50, 20, 20], ["bath", 20, 50, 36, 20], ["closet", 56, 50, 44, 20]] },
  { code: "B5", render: "/img/kp/plans/B5.png", name: "One Bedroom - Select Premium", kind: "independent", beds: 1, baths: 1, sqft: 820, from: 6360, available: 0, waitlist: 1, features: ilFeatures, rooms: [["kitchen", 0, 0, 28, 50], ["living", 28, 0, 40, 50], ["bedroom", 68, 0, 32, 50], ["entry", 0, 50, 18, 20], ["bath", 18, 50, 30, 20], ["closet", 48, 50, 52, 20]] },
  { code: "B7", render: "/img/kp/plans/B7.png", name: "One Bedroom w/ Den", kind: "independent", beds: 1, baths: 1, sqft: 830, from: 6425, available: 0, waitlist: 3, features: [...ilFeatures, "Den for a study, hobby room or guest"], rooms: [["kitchen", 0, 0, 24, 46], ["living", 24, 0, 40, 46], ["bedroom", 64, 0, 36, 46], ["entry", 0, 46, 20, 24], ["den", 20, 46, 26, 24], ["bath", 46, 46, 22, 24], ["closet", 68, 46, 32, 24]] },
  { code: "B3", render: "/img/kp/plans/B3.png", name: "One Bedroom Premium", kind: "independent", beds: 1, baths: 1, sqft: 835, from: 6500, available: 1, waitlist: 0, features: ilFeatures, rooms: [["kitchen", 0, 0, 26, 44], ["living", 26, 0, 40, 52], ["bedroom", 66, 0, 34, 52], ["entry", 0, 44, 26, 26], ["bath", 26, 52, 30, 18], ["closet", 56, 52, 44, 18]] },
  { code: "B4", render: "/img/kp/plans/B4.png", name: "One Bedroom - Entry Tower Unit", kind: "independent", beds: 1, baths: 1, sqft: 878, from: 6820, available: 0, waitlist: 2, features: [...ilFeatures, "Tower corner with windows on two sides"], rooms: [["kitchen", 0, 0, 24, 48], ["living", 24, 0, 44, 48], ["bedroom", 68, 0, 32, 70], ["entry", 0, 48, 20, 22], ["bath", 20, 48, 26, 22], ["closet", 46, 48, 22, 22]] },
  { code: "C1", render: "/img/kp/plans/C1.png", name: "Two Bedroom Deluxe", kind: "independent", beds: 2, baths: null, sqft: 943, from: 7550, available: 1, waitlist: 0, features: [...ilFeatures, "Second bedroom"], rooms: [["kitchen", 0, 0, 26, 50], ["living", 26, 0, 38, 50], ["bedroom", 64, 0, 36, 38], ["bedroom2", 64, 38, 36, 32], ["entry", 0, 50, 18, 20], ["bath", 18, 50, 24, 20], ["closet", 42, 50, 22, 20]] },
  { code: "C3", render: "/img/kp/plans/C3.png", name: "Two Bedroom Tower Unit", kind: "independent", beds: 2, baths: null, sqft: 975, from: 7815, available: 0, waitlist: 2, features: [...ilFeatures, "Tower corner with windows on two sides", "Second bedroom"], rooms: [["kitchen", 0, 0, 24, 50], ["living", 24, 0, 42, 50], ["bedroom", 66, 0, 34, 36], ["bedroom2", 66, 36, 34, 34], ["entry", 0, 50, 18, 20], ["bath", 18, 50, 26, 20], ["closet", 44, 50, 22, 20]] },
  { code: "C2", render: "/img/kp/plans/C2.png", name: "Two Bedroom/Two Bath Premium", kind: "independent", beds: 2, baths: 2, sqft: 1184, from: 9655, available: 0, waitlist: 4, features: [...ilFeatures, "Second full bathroom", "Second bedroom"], rooms: [["kitchen", 0, 0, 24, 50], ["living", 24, 0, 44, 50], ["bedroom", 68, 0, 32, 38], ["bedroom2", 68, 38, 32, 32], ["entry", 0, 50, 16, 20], ["bath", 16, 50, 28, 20], ["closet", 44, 50, 24, 20]] },
  { code: "MC1", render: "/img/kp/plans/MC1.png", name: "Studio w/ Private Bath", kind: "lantern", beds: 0, baths: 1, sqft: 357, from: 8715, available: 1, waitlist: 0, features: lanternFeatures, rooms: [["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 70], ["entry", 0, 50, 30, 20], ["closet", 30, 50, 40, 20]] },
  { code: "MC2", render: "/img/kp/plans/MC2.png", name: "Studio - Premium w/ Private Bath", kind: "lantern", beds: 0, baths: 1, sqft: 420, from: 9110, available: 0, waitlist: 1, features: lanternFeatures, rooms: [["bedroom", 0, 0, 72, 48], ["bath", 72, 0, 28, 70], ["entry", 0, 48, 32, 22], ["closet", 32, 48, 40, 22]] },
  { code: "MC6", render: "/img/kp/plans/MC6.png", name: "Tower Studio w/ Private Bath", kind: "lantern", beds: 0, baths: 1, sqft: 560, from: 9905, available: 0, waitlist: 0, features: [...lanternFeatures, "Tower corner with a sitting area"], rooms: [["living", 0, 0, 40, 50], ["bedroom", 40, 0, 60, 46], ["entry", 0, 50, 26, 20], ["bath", 26, 50, 34, 20], ["closet", 60, 46, 40, 24]] },
  { code: "MC4", render: "/img/kp/plans/MC4.png", name: "1 Bedroom w/ Private Bath", kind: "lantern", beds: 1, baths: 1, sqft: 584, from: 11010, available: 1, waitlist: 0, features: [...lanternFeatures, "Separate living room"], rooms: [["living", 0, 0, 42, 50], ["bedroom", 42, 0, 58, 48], ["entry", 0, 50, 22, 20], ["bath", 22, 50, 34, 20], ["closet", 56, 48, 44, 22]] },
  { code: "MC3", render: "/img/kp/plans/MC3.png", name: "1 Bedroom w/ Private Bath", kind: "lantern", beds: 1, baths: 1, sqft: 632, from: 11515, available: 0, waitlist: 1, features: [...lanternFeatures, "Separate living room"], rooms: [["living", 0, 0, 46, 50], ["bedroom", 46, 0, 54, 46], ["entry", 0, 50, 24, 20], ["bath", 24, 50, 36, 20], ["closet", 60, 46, 40, 24]] },
];

export const spaces: Space[] = [
  { key: "bistro", name: "The Bistro", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", text: "Part coffeehouse, part wine bar and the place everyone ends up: espresso in the morning, a glass of wine with family before dinner, and a happy hour every day with cocktails, mocktails and snacks on the house.", photo: "/img/kp/bistro.jpg", alt: "The Bistro’s fireside lounge, with armchairs by a two-sided fireplace and café tables beyond" },
  { key: "juniper", name: "The Juniper Room", kind: "Restaurant", hours: "11:00 am–7:00 pm", text: "Our white-tablecloth restaurant, with a menu that changes every week and follows the season and the Calder Valley farms.", photo: "/img/juniper.jpg", alt: "A dining room set with white tablecloths" },
  { key: "meadowbrook", name: "Meadowbrook Cafe", kind: "All-day café", hours: "7:00 am–7:00 pm", text: "Easygoing dining from breakfast to dinner: comfort food, soups, salads, sandwiches, pasta and a chef’s special that changes daily.", photo: "/img/millpond.jpg", alt: "A sunny café dining area" },
  { key: "theatre", name: "Theatre", kind: "Media & theater room", text: "Tiered seats and a big screen for films, talks and visiting performers, plus the Fitness Director’s sessions on nutrition and mindfulness.", photo: "/img/theatre.jpg", alt: "A theatre with tiered armchairs and a large screen" },
  { key: "art", name: "Art Studio", kind: "Studio", text: "A light, well-stocked studio for painting, crafts and clay, with visiting teachers now and then and our monthly Paint and Sip.", photo: "/img/art-studio.jpg", alt: "An art studio with long work tables and easels" },
  { key: "fitness", name: "Gym", kind: "Fitness", text: "Plenty of room for more than 25 group classes a week, plus senior-friendly machines for working out on your own.", photo: "/img/fitness-center.jpg", alt: "A gym with exercise machines and a class floor" },
  { key: "salon", name: "Salon", kind: "Salon", text: "Haircuts, color and a fresh set before the party, without leaving the building.", photo: "/img/salon.jpg", alt: "Salon styling chairs and mirrors" },
  { key: "club", name: "Club Room", kind: "Private dining", text: "Book it for birthdays, anniversaries and family dinners, with catering from our kitchen and a patio next door for when the party spills outside.", photo: "/img/kp/club-room.jpg", alt: "The Club Room, with teal walls, a sofa and a table set for a private gathering" },
  { key: "courtyard", name: "Courtyard", kind: "Outdoor living room", text: "Our landscaped outdoor living room, with sunny and shady seating, a bocce court, a fire pit, gas BBQs for outdoor meals, raised beds for herbs and vegetables, and a cutting garden of lavender and roses.", photo: "/img/courtyard-bocce.jpg", alt: "A landscaped courtyard with a bocce court", more: ["An exercise area for dogs and cats, with seating that overlooks the courtyard", "Walking paths for a morning loop"] },
  { key: "lantern-courtyard", name: "Lantern Courtyard", kind: "Secure garden", text: "Lantern’s own secure courtyard, with raised planter boxes, seating, activity tables, walking paths and a putting green.", photo: "/img/lantern-garden.jpg", alt: "A secure garden courtyard with raised planters" },
  { key: "lobby", name: "Lobby", kind: "Arrivals", text: "The front desk team greets every guest here.", photo: "/img/lobby.jpg", alt: "A bright lobby with sofas" },
];

export const team: TeamMember[] = [
  { name: "Joanna Kessel", photo: "/img/kp/team/joanna.jpg", role: "Executive Director", dept: "Leadership", key: true, bio: "Joanna became Executive Director in December 2025. She started out waiting tables in a senior living dining room, fell for the work, and has run communities ever since. Her rule: “If you want to know how a place is doing, ask the residents at lunch.”" },
  { name: "Mateo Ruiz", photo: "/img/kp/team/mateo.jpg", role: "Community Relations Director", dept: "Tours & move-ins", key: true, bio: "Mateo shows visitors around, talks through apartments and prices, and helps families plan a move one step at a time. He knows which windows catch the best afternoon light." },
  { name: "Tessa Morrow", photo: "/img/kp/team/tessa.jpg", role: "Resident Services Director", dept: "Assisted Living Services", key: true, bio: "Tessa is a nurse by training. She leads the resident services team and adjusts each resident’s Assisted Living Services as life changes, always starting with a conversation." },
  { name: "Anjali Rao", photo: "/img/kp/team/anjali.jpg", role: "Lantern Director", dept: "Lantern", key: true, bio: "Anjali runs Lantern Memory Care. She plans its days around each resident’s history and habits, and keeps families in the loop with a quick note most afternoons." },
  { name: "Grant Ellison", photo: "/img/kp/team/grant.jpg", role: "Events and Adventures Director", dept: "Events & Adventures", bio: "Grant builds the monthly calendar of classes, clubs, outings and parties, and is always collecting ideas for the next trip. Ask him about the Calder Valley’s best pie stops." },
  { name: "Callie Brooks", role: "Events and Adventures Assistant", dept: "Events & Adventures", bio: "Callie helps Grant run the calendar, sets up the games and keeps the energy high at the weekly Bingo in the Bistro." },
  { name: "Kara Lindqvist", photo: "/img/kp/team/kara.jpg", role: "Fitness Director", dept: "Fitness", bio: "Kara is our full-time Fitness Director. She teaches most of the 25-plus weekly classes, leads the active outings and hosts the talks on nutrition and mindfulness. Her classes end with a joke, good or bad." },
  { name: "Personal Trainer", role: "Personal Trainer", dept: "Fitness", unnamed: true, bio: "Private sessions in the gym for residents who want a plan of their own, alongside the group classes." },
  { name: "Celeste Okonkwo", photo: "/img/kp/team/celeste.jpg", role: "Dining Experience Director", dept: "Dining", bio: "Celeste oversees all three restaurants and books lunches and private dinners. Once a month she trades the dining room for a demo kitchen and teaches residents a favorite recipe." },
  { name: "Julien Marchand", photo: "/img/kp/team/julien.jpg", role: "Culinary Director", dept: "Dining", bio: "Julien writes the menus for the Juniper Room, Meadowbrook Cafe and the Bistro, and shops the farms of the Calder Valley for whatever is in season." },
  { name: "Imani Price", photo: "/img/kp/team/imani.jpg", role: "Business Office Director", dept: "Business office", bio: "Imani handles billing, leases and paperwork, and is glad to walk anyone through a statement line by line." },
  { name: "Ray Castillo", photo: "/img/kp/team/ray.jpg", role: "Maintenance Director", dept: "Maintenance", bio: "Ray and his crew keep the buildings, grounds and apartments in shape, from leaky taps to hanging a family’s favorite paintings." },
  { name: "June Tolliver", photo: "/img/kp/team/june.jpg", role: "Lead Ambassador", dept: "Front desk", bio: "June leads the Ambassador team at the front desk, which means she knows everyone’s name, and usually their dog’s too." },
  { name: "Bernie Kowalski", photo: "/img/kp/team/bernie.jpg", role: "Resident Council President", dept: "Resident Council", bio: "Bernie, a retired civil engineer, chairs the Resident Council and makes sure every neighbor’s idea gets heard." },
];

/** No Team Steward of the Month is published for Kestrel Point. */
export const steward: Steward | null = null;

/** Who leads the regular classes. Only Kara Lindqvist is named; the rest are roles. */
export const instructors: { name: string; what: string; unnamed?: true }[] = [
  { name: "Kara Lindqvist", what: "Fitness Director · strength, balance, Step Aerobics and more" },
  { name: "Personal Trainer", what: "One-to-one training in the gym", unnamed: true },
  { name: "Visiting art instructor", what: "Occasional Art Studio classes", unnamed: true },
  { name: "Visiting chaplain", what: "Non-Denominational Service", unnamed: true },
];

export const fitness = {
  intro: "Our full-time Fitness Director runs more than 25 classes a week, with a personal trainer on hand and outings that keep you strong, steady, flexible and on the move.",
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

const post = (slug: string) => `https://kestrelpoint.example/${slug}/`;

// News posts, newest first. Long-form bodies are in ./articles.
export const stories: Story[] = [
  {
    slug: "i-moved-here-to-thrive",
    kind: "News",
    title: "More Life, Not Less",
    dek: "Meet Doreen, the retired librarian who turned one shelf in the Bistro into the community’s favorite meeting place.",
    date: "2026-09-15",
    photo: "/img/friends-laugh.jpg",
    alt: "Two residents laughing together",
    link: post("i-moved-here-to-thrive"),
    body: ["When Doreen sold the house with too many stairs, she worried she was giving something up. Instead, she found more to do than ever, starting with a bookshelf."],
  },
  {
    slug: "engage-connect-celebrate-every-day",
    kind: "Events & Adventures",
    author: "Margot",
    title: "A Summer Week of Small Victories",
    dek: "A high school volunteer spends a week with the Events & Adventures team, loses at cribbage and helps run the Courtyard Games.",
    date: "2026-08-17",
    photo: "/img/wine-pong.jpg",
    alt: "Residents enjoying a game together",
    link: post("engage-connect-celebrate-every-day"),
    body: ["Margot, a high school junior from Rivermead, volunteered with the Events & Adventures team for a week this summer and wrote about what she learned."],
  },
  {
    slug: "finding-camaraderie-and-care",
    kind: "News",
    title: "Coffee, Company and Common Ground",
    dek: "Walt, Desmond and Gene each cared for a wife at home. Now they share a table, and a standing coffee date, every Thursday.",
    date: "2026-06-22",
    photo: "/img/bocce-men.jpg",
    alt: "Three men talking outdoors",
    link: post("finding-camaraderie-and-care"),
    body: ["Three neighbors who know the work of caregiving talk about the loneliness it can bring, and the friendship that started over a bocce game."],
  },
  {
    slug: "people-make-all-the-difference",
    kind: "Careers",
    title: "The People Behind the Place",
    dek: "Ask residents about the team and the team about the residents, and you hear the same few words.",
    date: "2026-05-28",
    photo: "/img/care-laugh.jpg",
    alt: "A Care Partner laughing with a resident",
    link: post("people-make-all-the-difference"),
    body: ["The buildings are lovely and the benefits are good, but what keeps people at Kestrel Point, on both sides of the front desk, is each other."],
  },
  {
    slug: "shared-stories-bring-connection",
    kind: "News",
    title: "Every Table Has a Story",
    dek: "Marguerite and Sol baked bread in Calder for forty years. Now they save two empty chairs at dinner for whoever wants them.",
    date: "2026-04-22",
    photo: "/img/wine-toast.jpg",
    alt: "Two glasses of wine raised in a toast",
    link: post("shared-stories-bring-connection"),
    body: ["Every resident arrives with a story. Marguerite and Sol’s involves a family bakery, a 4 am alarm clock and a sourdough starter older than their children."],
  },
  {
    slug: "assistance-is-the-path-to-independence",
    kind: "Wellness",
    title: "A Little Help, a Lot More Living",
    dek: "Accepting some support isn’t the end of independence. Often it is how you keep it.",
    date: "2026-03-20",
    photo: "/img/care-outdoors.jpg",
    alt: "A Care Partner walking with a resident outdoors",
    link: post("assistance-is-the-path-to-independence"),
    body: ["At Kestrel Point, help is something that comes to you, in any apartment, as much or as little as you want."],
  },
  {
    slug: "deciding-when-to-move-to-senior-living",
    kind: "News",
    title: "When Is the Right Time to Move?",
    dek: "Nobody can pick the date for you, but deciding before a crisis keeps the choice in your hands.",
    date: "2026-02-25",
    photo: "/img/mother-daughter.jpg",
    alt: "A mother and daughter talking",
    link: post("deciding-when-to-move-to-senior-living"),
    body: ["There is no perfect moment to move. There is, though, a big difference between choosing a move and having one chosen for you."],
  },
  {
    slug: "respect-defines-kestrel-point",
    kind: "News",
    author: "Margot",
    title: "Listening Across the Years",
    dek: "A ninth grader comes to record residents’ stories for a school project, and finds out how good it feels to be heard.",
    date: "2026-01-23",
    photo: "/img/courtyard-palms.jpg",
    alt: "A sunny courtyard",
    link: post("respect-defines-kestrel-point"),
    body: ["Margot arrived with a recorder and a list of questions for an oral-history assignment. She left with new friends and a lot to think about."],
  },
  {
    slug: "home-for-the-holidays",
    kind: "News",
    title: "Holiday Visits, Honest Conversations",
    dek: "Five ways to talk about what you noticed over the holidays, without spoiling the visit.",
    date: "2025-12-16",
    photo: "/img/reading-together.jpg",
    alt: "Family members reading together",
    link: post("home-for-the-holidays"),
    body: ["Notice without diagnosing, ask before telling, share the load, plan the next talk and keep the visit a happy one."],
  },
  {
    slug: "welcoming-joanna-kessel",
    kind: "News",
    title: "Welcoming Joanna Kessel",
    dek: "Meet Kestrel Point’s new Executive Director.",
    date: "2025-12-12",
    photo: "/img/lobby.jpg",
    alt: "A bright lobby",
    link: post("welcoming-joanna-kessel"),
    body: ["Joanna Kessel joins Kestrel Point as Executive Director, after a career that began in a senior living dining room."],
  },
  {
    slug: "doughnut-bread-pudding",
    kind: "Dining",
    title: "A Doughnut Bread Pudding Worth Sharing",
    dek: "This month’s cooking lesson with Celeste, and a recipe you can make at home.",
    date: "2025-11-20",
    photo: "/img/dish-dessert.jpg",
    alt: "A plated dessert",
    link: post("doughnut-bread-pudding"),
    body: ["Once a month our Dining Experience Director teaches residents a recipe. This time it was a bread pudding made with day-old doughnuts."],
  },
  {
    slug: "care-centered-around-being-with",
    kind: "Wellness",
    title: "Care That Starts with Getting to Know You",
    dek: "A resident mentioned she missed dancing. Her Care Partners turned the hallway into a ballroom.",
    date: "2025-10-29",
    photo: "/img/care-chat.jpg",
    alt: "A Care Partner chatting with a resident",
    link: post("care-centered-around-being-with"),
    body: ["Good care is less about tasks and more about people, and sometimes that means a waltz before lunch."],
  },
];

/** The free Wrenhaven guides offered on the guides page. */
export const guides: { title: string; pages: number | null; photo: string }[] = [
  { title: "Questions Families Ask", pages: null, photo: "/img/coffee-woman.jpg" },
  { title: "Our Signature Programs", pages: null, photo: "/img/paddleboard.jpg" },
  { title: "Independent Living at a Glance", pages: null, photo: "/img/apt-living.jpg" },
  { title: "Assisted Living at a Glance", pages: null, photo: "/img/care-outdoors.jpg" },
  { title: "Memory Care at a Glance", pages: null, photo: "/img/lantern-couple.jpg" },
  { title: "Senior Living: A First Look", pages: null, photo: "/img/mother-daughter.jpg" },
  { title: "Paying for Senior Living", pages: null, photo: "/img/couple-hands.jpg" },
  { title: "Staying Home or Moving?", pages: null, photo: "/img/reading-together.jpg" },
  { title: "Deciding Together: A Family Guide", pages: null, photo: "/img/friends-walking.jpg" },
];

export const faqs = [
  { q: "Is there a second-person fee?", a: "No. Couples share an apartment for the same monthly rent as one person, which works out to roughly $10,000 a year saved." },
  { q: "Are pets welcome?", a: "Yes, dogs and cats are part of the family here. There is even a pet exercise area off the courtyard, with benches for the humans." },
  { q: "What’s included in the monthly rent?", a: "Your rent covers weekly housekeeping (including flat linens, washed in your own machine), an emergency response system backed by a team on site around the clock, gated entry, all maintenance and handyman help, and every utility, including internet and cable. Covered parking is also available." },
  { q: "If I need more help later, will I have to move?", a: "No. Our resident services team brings Assisted Living Services to whichever apartment you live in. Support starts with a $950 monthly base fee, and any personal care is priced according to your care plan." },
  { q: "What is Lantern?", a: "Lantern is our secure memory care neighborhood: 22 private apartments, a courtyard and putting green of its own, activities 12 hours a day and regular outings. Studios with a private bath start at $8,750 a month, and care level rates are set after a personal assessment." },
  { q: "Do you provide transportation?", a: "Yes. Our drivers handle every Events & Adventures trip, from museum visits to walks in the park. The front desk can also arrange rides for shopping and appointments." },
  { q: "Can my family join me for a meal?", a: "Please do. Family and friends are always welcome at the table. Book lunch online or ask our Dining Experience Director." },
  { q: "Are you licensed?", a: "Yes. The California Department of Social Services licenses Kestrel Point as a Residential Care Facility for the Elderly (RCFE License #100000202)." },
  { q: "How do I schedule a tour?", a: "Book a time online, or call Mateo Ruiz, our Community Relations Director, at (916) 555-0160. He will plan the visit around what you want to see." },
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
  intro: "A job at Kestrel Point comes with good pay and benefits, and with something harder to find: a place where your ideas count and residents and coworkers look out for you.",
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
    { title: "Apply online", text: "Pick a role on our careers portal and send your application. Every one is read by a recruiter." },
    { title: "Recruiter phone screen", text: "When your experience matches, a recruiter calls for a short conversation about the job." },
    { title: "Community interview", text: "Come to Kestrel Point, meet the director you would work with and take a look around." },
    { title: "Next steps", text: "Once interviews wrap up, we make a decision and let every candidate know where they stand." },
  ],
  // Roles Kestrel Point commonly hires for. Current openings and pay are on the careers portal, not published here.
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
  applyUrl: "https://wrenhaven.example/careers",
  generalInterestUrl: "https://wrenhaven.example/careers",
  quotes: [
    { quote: "I come in smiling and I leave smiling.", name: "Priya" },
    { quote: "The residents teach me something every shift.", name: "Denise" },
    { quote: "It feels like working with family.", name: "Callie" },
    { quote: "Everybody pitches in here.", name: "Marcus" },
  ],
};

/** Resident quotes, with the page each one appears on. */
export const testimonials: Testimonial[] = [
  { quote: "What sold me was knowing that if I ever need more help, it comes to my door. No more moving.", name: "Vern", relation: "Resident", source: "https://kestrelpoint.example/" },
  { quote: "I didn’t move here to slow down. I moved here to have time for the good parts.", name: "Doreen", relation: "Resident", source: post("i-moved-here-to-thrive") },
  { quote: "There’s a class for every kind of day. Some weeks I make it to six.", name: "Lloyd", relation: "Resident", source: "https://kestrelpoint.example/fitness/" },
  { quote: "Every meal here is a chance to meet somebody new.", name: "Marguerite", relation: "Resident", source: post("shared-stories-bring-connection") },
  { quote: "If there’s something you want to try here, just ask. Somebody will help you make it happen.", name: "Corinne", relation: "Resident", source: "https://kestrelpoint.example/" },
];

/** Quick links shown in the header navigation (community-relative; the community prefix is added by the router). */
export const nav = [
  { label: "Living Options", href: "/living", children: [
    { label: "Independent Living", href: "/living/independent-living" },
    { label: "Assisted Living Services", href: "/living/assisted-living" },
    { label: "Lantern Memory Care", href: "/living/lantern-memory-care" },
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
    { label: "Clubs & Groups", href: "/clubs" },
    { label: "Photo Albums", href: "/photos" },
    { label: "What is LIVE?", href: "/lifestyle#live" },
  ] },
  { label: "Calendar", href: "/calendar" },
  { label: "Dining", href: "/dining" },
  { label: "For Families", href: "/stay-connected", children: [
    { label: "Stay Connected", href: "/stay-connected" },
    { label: "Photo Albums", href: "/photos" },
    { label: "Activity Calendar", href: "/calendar" },
  ] },
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
