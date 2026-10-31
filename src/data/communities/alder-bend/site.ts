// Alder Bend: the facts every page draws on.
import { money, planKindLabel, type Award, type Living, type LivingKey, type Plan, type PlanKind, type Space, type Steward, type Story, type TeamMember, type Testimonial } from "@/data/shared";

export { money, planKindLabel };
export type { LivingKey, Plan, PlanKind, Space, Story, TeamMember };

export const site = {
  name: "Alder Bend",
  short: "AB",
  byline: "A Wrenhaven Senior Living Community",
  operator: "Wrenhaven Senior Living",
  tagline: "Luxury senior living in the foothills above Millpond Lake.",
  lifestyle: "A home with a full calendar.",
  independent: "Real apartments, real independence, and plenty of places to gather.",
  address: { street: "120 Alder Bend Way", city: "Fairhollow", state: "CA", zip: "95921" },
  addressLine: "120 Alder Bend Way, Fairhollow, CA 95921",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=120+Alder+Bend+Way+Fairhollow+CA+95921",
  mapsEmbed: "https://www.google.com/maps?q=120+Alder+Bend+Way,+Fairhollow,+CA+95921&output=embed",
  location: [
    "Just off the Millpond Parkway, next to Fairhollow High School",
    "Minutes from Old Town Fairhollow and the Millpond Lake shore",
    "Close to Millpond Marketplace and Fairhollow Community Hospital",
    "About 40 minutes from Calder Regional Airport",
  ],
  phone: "(916) 555-0140",
  phoneHref: "tel:+19165550140",
  phonesAlso: ["(916) 555-0193", "(916) 555-0160"],
  email: "info@alderbend.example",
  careersEmail: "hr@wrenhaven.example",
  accessibilityEmail: "info@wrenhaven.example",
  licence: "RCFE License #100000101",
  licenceNo: "100000101",
  facebook: "https://www.facebook.com/AlderBend",
  sister: { name: "Kestrel Point", city: "Rivermead", url: "https://kestrelpoint.example/" },
  wrenhavenUrl: "https://wrenhaven.example/",
  hoursOffice: "Tours daily, 9:00 am–5:00 pm · Community Relations Mon–Sat",
};

export const awards: Award[] = [
  { title: "Readers’ Choice · Senior Living", detail: "Chosen by Calder Valley Living readers eight years in a row", source: "Calder Valley Living", years: 8 },
  { title: "Executive Director of the Year", detail: "Awarded to Renata Holloway", source: "Calder Valley Senior Care Council" },
  { title: "Open Door Certified", detail: "Yearly LGBTQ+ inclusion training for every team member", source: "Open Door Alliance" },
];

export const welcome = {
  intro: "Everyone belongs at Alder Bend. Residents, families and team members of every background help make this place what it is, and we work at keeping it that way.",
  points: [
    { title: "Open Door certified", text: "Each year every team member completes Open Door inclusion training, so LGBTQ+ older adults can feel at home, respected and safe here." },
    { title: "Diversity, equity and inclusion", text: "Residents and team members of every race, faith, culture, ability, gender identity and sexual orientation are welcome here." },
    { title: "ASL interpreters", text: "We can arrange American Sign Language interpreters for tours, care conferences and community events. Just let us know." },
    { title: "Accessible by design", text: "From the hallways to the website to the printed calendar, we design everything to be easy to see, hear, reach and read." },
  ],
};

export const living: Record<LivingKey, Living> = {
  independent: {
    key: "independent",
    name: "Independent Living",
    href: "/living/independent-living",
    lede: "Apartment homes of up to 1,417 square feet, each with a full kitchen and its own washer and dryer, plus a calendar you’ll actually want to keep up with.",
    from: "From $5,950 a month",
    photo: "/img/apt-living.jpg",
    alt: "A bright two-bedroom apartment living room and kitchen",
    points: [
      "Studio, one-bedroom and two-bedroom, two-bath apartments up to 1,417 sq ft",
      "Oversized windows and full-size kitchens with stainless appliances",
      "Solid-surface counters, pendant lights and a peninsula or bar",
      "Walk-in closets and an in-apartment washer and dryer",
      "Room for a sectional and a full dining set",
      "Balconies or patios in select apartments",
      "A display shelf beside every front door, to make the entrance your own",
      "No second-person fee — about $12,000 a year saved for couples",
      "Pets welcome",
    ],
  },
  assisted: {
    key: "assisted",
    name: "Assisted Living Services",
    href: "/living/assisted-living",
    lede: "Help comes to your own front door, so getting more support never means giving up your home.",
    from: "$850 a month base support fee, plus personal care by care plan",
    photo: "/img/care-chat.jpg",
    alt: "A Care Partner chatting with a resident on her sofa",
    points: [
      "Available in every apartment — residents never have to move",
      "Delivered by the Wrenhaven resident services team, led by our Resident Services Director",
      "Medication management",
      "Personal care",
      "Escorts to meals, activities and appointments",
      "Coordination with your healthcare providers",
      "Additional services based on a pre-move-in assessment",
      "A limited number of studios and one-bedrooms tailored for assisted living, near the Care Partner team",
    ],
  },
  lantern: {
    key: "lantern",
    name: "Lantern Memory Care",
    href: "/living/lantern-memory-care",
    lede: "A bright, secure neighborhood where the question is always what a resident can still enjoy, and how we make it happen.",
    from: "From $6,400 a month",
    photo: "/img/lantern-living.jpg",
    alt: "Lantern’s bright living room with armchairs and a fireplace",
    points: [
      "A home-like, secured neighborhood with its own courtyard",
      "Its own Events & Adventures program, with weekly outings",
      "Bowling, lunches out, golf, picnics by Millpond Lake, a horse ranch — even stand-up paddling",
      "Live music, ceramics, pet therapy, therapeutic storytelling, literature review and gardening",
      "Museum outings",
      "A simplified fitness program designed by our Fitness Director",
      "Purposeful roles in everyday community life",
      "Invited to every community event",
    ],
  },
};

export const pricing = {
  independent: [
    { name: "Studio", from: 5950 },
    { name: "One bedroom", from: 6150 },
    { name: "Two bedroom", from: 8600 },
  ],
  independentRange: [5950, 11800] as const,
  assistedBase: 850,
  lantern: [
    { name: "Studio with shared bath", from: 6400 },
    { name: "Studio with private bath", from: 8300 },
  ],
  secondPersonSaving: 12000,
  included: [
    "Weekly housekeeping, with flat linens laundered in your own washer and dryer",
    "Emergency response system, with our team on site 24 hours",
    "Secure community with camera surveillance",
    "All maintenance, plus handyman services",
    "All utilities, full internet and cable",
    "Scheduled transportation",
    "Events & Adventures, the fitness program and access to all three restaurants",
  ],
};

const ilFeatures = ["Full-size kitchen with stainless appliances", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows", "Emergency pull cords"];

export const plans: Plan[] = [
  { code: "NA1", name: "Studio", kind: "independent", beds: 0, baths: 1, sqft: 488, from: 5950, available: 1, waitlist: 0, features: ["Full kitchen with peninsula", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows"], rooms: [["entry", 0, 50, 25, 20], ["kitchen", 0, 0, 30, 50], ["living", 30, 0, 70, 45], ["bath", 25, 45, 35, 25], ["closet", 60, 45, 40, 25]] },
  { code: "NB2B", name: "One Bedroom Standard", kind: "independent", beds: 1, baths: 1, sqft: 660, from: 6155, available: 2, waitlist: 0, features: ilFeatures, rooms: [["entry", 0, 48, 22, 22], ["kitchen", 0, 0, 30, 48], ["living", 30, 0, 38, 50], ["bedroom", 68, 0, 32, 50], ["bath", 22, 50, 30, 20], ["closet", 52, 50, 48, 20]] },
  { code: "NB1C", name: "One Bedroom Deluxe", kind: "independent", beds: 1, baths: 1, sqft: 782, from: 8790, available: 0, waitlist: 4, balcony: true, features: [...ilFeatures, "Private balcony"], rooms: [["entry", 0, 48, 20, 22], ["kitchen", 0, 0, 28, 48], ["living", 28, 0, 40, 52], ["bedroom", 68, 0, 32, 52], ["bath", 20, 52, 34, 18], ["closet", 54, 52, 46, 18], ["balcony", 28, -14, 40, 14]] },
  { code: "NC1", name: "Two Bedroom Deluxe", kind: "independent", beds: 2, baths: 2, sqft: 1030, from: 8600, available: 1, waitlist: 0, balcony: true, features: [...ilFeatures, "Second full bathroom", "Private balcony"], rooms: [["entry", 0, 50, 18, 20], ["kitchen", 0, 0, 26, 50], ["living", 26, 0, 38, 52], ["bedroom", 64, 0, 36, 40], ["bedroom2", 64, 40, 36, 30], ["bath", 18, 52, 24, 18], ["closet", 42, 52, 22, 18], ["balcony", 26, -14, 38, 14]] },
  { code: "NC4", name: "Two Bedroom Deluxe", kind: "independent", beds: 2, baths: 2, sqft: 1075, from: 10550, available: 0, waitlist: 6, balcony: true, features: [...ilFeatures, "Corner windows on two sides", "Second full bathroom", "Private balcony"], rooms: [["entry", 0, 50, 18, 20], ["kitchen", 0, 0, 28, 50], ["living", 28, 0, 38, 52], ["bedroom", 66, 0, 34, 40], ["bedroom2", 66, 40, 34, 30], ["bath", 18, 52, 26, 18], ["closet", 44, 52, 22, 18], ["balcony", 28, -14, 38, 14]] },
  { code: "NC6", name: "Two Bedroom Grand", kind: "independent", beds: 2, baths: 2, sqft: 1417, from: 11800, available: 1, waitlist: 2, balcony: true, features: [...ilFeatures, "Separate dining room", "Two walk-in closets", "Wrap-around balcony"], rooms: [["entry", 0, 50, 16, 20], ["kitchen", 0, 0, 24, 50], ["living", 24, 0, 42, 52], ["bedroom", 66, 0, 34, 38], ["bedroom2", 66, 38, 34, 32], ["bath", 16, 52, 26, 18], ["closet", 42, 52, 24, 18], ["balcony", 24, -14, 76, 14]] },
  { code: "AB2", name: "Assisted Living One Bedroom Standard", kind: "assisted", beds: 1, baths: 1, sqft: 602, from: 7610, available: 1, waitlist: 0, features: ["Near the Care Partner team", "Kitchenette", "Walk-in shower with grab bars", "Emergency pull cords", "Washer and dryer"], rooms: [["entry", 0, 48, 22, 22], ["kitchen", 0, 0, 28, 48], ["living", 28, 0, 38, 52], ["bedroom", 66, 0, 34, 52], ["bath", 22, 52, 36, 18], ["closet", 58, 52, 42, 18]] },
  { code: "AZ1", name: "Lantern Standard Private Room", kind: "lantern", beds: 0, baths: 1, sqft: 389, from: 8270, available: 1, waitlist: 0, features: ["Private bathroom", "Secured Lantern neighborhood", "Courtyard access", "Emergency pull cords"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 70], ["closet", 30, 50, 40, 20]] },
  { code: "AZ2", name: "Lantern Private Room with Shared Bath", kind: "lantern", beds: 0, baths: 0.5, sqft: 304, available: 0, waitlist: 2, features: ["Bathroom shared with one neighbour", "Secured Lantern neighborhood", "Courtyard access", "Emergency pull cords"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 75, 50], ["bath", 75, 0, 25, 50], ["closet", 30, 50, 45, 20]] },
  { code: "AZ3", name: "Lantern Room", kind: "lantern", beds: 0, baths: 1, available: 0, waitlist: 1, features: ["Secured Lantern neighborhood", "Courtyard access"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 50], ["closet", 30, 50, 40, 20]] },
  { code: "AZ4", name: "Lantern Room", kind: "lantern", beds: 0, baths: 1, available: 1, waitlist: 0, features: ["Secured Lantern neighborhood", "Courtyard access"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 50], ["closet", 30, 50, 40, 20]] },
  { code: "AZ5", name: "Lantern Room", kind: "lantern", beds: 0, baths: 1, available: 0, waitlist: 0, features: ["Secured Lantern neighborhood", "Courtyard access"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 50], ["closet", 30, 50, 40, 20]] },
];

export const spaces: Space[] = [
  { key: "perch", name: "The Perch", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", text: "Where the day starts and ends: espresso in the morning, a glass of wine before dinner. Regular happy hours add cocktails, mocktails and free snacks for residents and their guests.", photo: "/img/perch.jpg", alt: "The Perch coffeehouse with its bar and café tables" },
  { key: "juniper", name: "The Juniper Room", kind: "Restaurant", hours: "11:00 am–7:00 pm", text: "Tablecloths, attentive service and a menu built around the season, with something new every week.", photo: "/img/juniper.jpg", alt: "The Juniper Room dining room set with white tablecloths" },
  { key: "millpond", name: "Millpond Café", kind: "All-day café", hours: "7:00 am–7:00 pm", text: "Easygoing California food from morning flapjacks to afternoon fish tacos.", photo: "/img/millpond.jpg", alt: "Millpond Café’s sunny dining area" },
  { key: "theatre", name: "Theatre", kind: "Media & theater room", text: "A big screen and clear sound for films, talks, visiting authors and performers, and weekly services.", photo: "/img/theatre.jpg", alt: "The theatre with tiered armchairs and a large screen" },
  { key: "art", name: "Art Studio", kind: "Studio", text: "Visiting artists teach here, and it doubles as the clubhouse for bridge, pinochle, knitting and the flower club.", photo: "/img/art-studio.jpg", alt: "The art studio with long work tables and easels" },
  { key: "fitness", name: "Fitness Center", kind: "Fitness", text: "A roomy class studio and senior-friendly equipment, busy with more than 25 classes every week.", photo: "/img/fitness-center.jpg", alt: "The fitness center with exercise machines and a class floor" },
  { key: "salon", name: "Salon", kind: "Salon", text: "Haircuts, color, manicures and more, without leaving the building.", photo: "/img/salon.jpg", alt: "The salon’s styling chairs and mirrors" },
  { key: "club", name: "Club Room", kind: "Private dining", text: "Book it for a birthday or family dinner, catered by our kitchen, with its own private patio.", photo: "/img/club-room.jpg", alt: "The Club Room with a fireplace and dining table" },
  { key: "living", name: "Living Room", kind: "Library & lounge", text: "The library, the Scrabble Club, the Book Club and the best armchairs in the house for an afternoon with a novel.", photo: "/img/living-room.jpg", alt: "The Living Room with armchairs and bookshelves" },
  { key: "courtyard", name: "Courtyard", kind: "Outdoor living room", text: "A fire table, outdoor dining, gas grills, raised garden beds, a cutting garden, and a fenced corner for dogs and cats.", photo: "/img/courtyard-palms.jpg", alt: "The courtyard with palms, lawn and outdoor seating" },
  { key: "lounge", name: "2nd Floor Lounge", kind: "Lounge", text: "A calm upstairs spot for crafts and jigsaws, and for visits from Thor, our therapy dog.", photo: "/img/lounge.jpg", alt: "The second-floor lounge" },
  { key: "lobby", name: "Lobby", kind: "Arrivals", text: "Bright, open and the meeting point for every bus trip.", photo: "/img/lobby.jpg", alt: "The double-height lobby with a staircase and sofas" },
];

export const team: TeamMember[] = [
  { name: "Renata Holloway", role: "Executive Director", dept: "Leadership", key: true, ext: "101", bio: "Renata has led Alder Bend since it opened and was named Executive Director of the Year by the Calder Valley Senior Care Council. She keeps her office door propped open and hosts a Town Hall every month." },
  { name: "Priya Nandakumar", role: "Community Relations Director", dept: "Tours & move-ins", key: true, ext: "110", bio: "Priya is the person to call first. She shows families around, talks through apartments and prices, and lets everyone plan a move on their own timeline." },
  { name: "Colleen Ashby", role: "Resident Services Director", dept: "Assisted Living Services", key: true, ext: "120", bio: "Colleen heads the Care Partner team. She meets every new resident before move-in and writes each care plan together with families and doctors." },
  { name: "Maribel Ortiz", role: "Lantern Memory Care Director", dept: "Lantern", key: true, ext: "130", bio: "Maribel runs Lantern by asking what each resident can still enjoy, then finding a way to make it happen, for residents and their families alike." },
  { name: "Nora Castellano", role: "Events & Adventures Director", dept: "Events & Adventures", ext: "140", bio: "Nora fills the calendar, from Monday trivia to trips into the Copper Creek Mine, and chairs the Friday Activity Meeting where residents choose what comes next." },
  { name: "Devin Marsh", role: "Fitness Director", dept: "Fitness", ext: "150", bio: "Devin works on site full time and teaches more than 25 classes a week. He believes friends are the best motivation, and he leads the Monday nature walks and the monthly Healthy Happy Hour." },
  { name: "Simone Archer", role: "Dining Experience Director", dept: "Dining", ext: "160", bio: "Simone oversees all three restaurants and handles lunch and private dining reservations." },
  { name: "Rafael Domingo", role: "Culinary Director", dept: "Dining", ext: "161", bio: "Rafael writes every menu, from the Juniper Room’s weekly seasonal dinner to the flapjacks at Millpond Café, and hosts Conversations with Chef each month." },
  { name: "Leonard Fisk", role: "Business Office Director", dept: "Business office", ext: "170", bio: "Leonard handles billing, leases and the paperwork, and makes sure families always get a clear answer." },
  { name: "Opal Merriweather", role: "Lead Ambassador", dept: "Front desk", ext: "100", bio: "Opal and the Ambassador team greet everyone who comes through the lobby, every day of the week." },
  { name: "Walt Pemberton", role: "President of the Resident Council", dept: "Resident Council", bio: "Walt runs the monthly All-Resident Council Meeting and is always glad to tell future neighbours how life here really goes." },
];

export const steward: Steward | null = {
  title: "Team Steward of the Month",
  name: "Lucia Ferrante",
  role: "Med Tech",
  month: "October 2026",
  praise: ["communication", "cheerfulness", "attentiveness"],
  quotes: [
    "Lucia explains things clearly and patiently, to residents and to the rest of the team.",
    "She spots when someone is having an off day and quietly makes it better.",
    "You can hear her laughing from the other end of the hallway, and it cheers everyone up.",
  ],
};

export const instructors = [
  { name: "Sonya", what: "Chair Yoga" },
  { name: "Shaun", what: "Sit To Be Fit" },
  { name: "Mei", what: "Tai Chi" },
  { name: "Rhea", what: "Zumba" },
  { name: "Ava", what: "Brain Busters" },
  { name: "Chaplain Miriam", what: "Non-Denominational Service" },
  { name: "Fr. Daniel Brennan", what: "Catholic Mass, St. Columba’s Parish" },
  { name: "Thor", what: "Therapy pet" },
];

export const fitness = {
  intro: "Over 25 classes a week with our full-time Fitness Director, plus outings that get everyone moving.",
  highlights: [
    "VR golf",
    "Nature walks in local parks",
    "Line dancing",
    "Axe throwing",
    "Monthly Healthy Happy Hour — music, nutritious snacks and choreography",
    "Cognitive aerobics",
    "Mindful meditation",
    "On-site physical therapy",
  ],
};

export const stories: Story[] = [
  {
    slug: "calder-valley-memory-walk",
    kind: "Events & Adventures",
    title: "The Calder Valley Memory Walk",
    dek: "Lantern residents dyed their own team shirts, then walked the riverside route with families and Care Partners.",
    date: "2026-10-17",
    photo: "/img/friends-walking.jpg",
    alt: "Residents and family members walking together outdoors",
    body: [
      "In the days before the Memory Walk, Lantern residents dyed a stack of plain white shirts in bright swirls of color, each one different.",
      "On the morning of the walk, residents, families and Care Partners set off as one team. Some covered every step; others cheered from a shady bench. All of them came home pleased with themselves.",
    ],
  },
  {
    slug: "paint-and-sip-with-talia",
    kind: "Events & Adventures",
    title: "Paint and Sip with Talia",
    dek: "A Care Partner who paints in her spare time turned the Art Studio into a one-afternoon gallery.",
    date: "2026-10-08",
    photo: "/img/art-studio.jpg",
    alt: "The art studio set up for a painting class",
    body: [
      "Talia works evenings on our Care Partner team and spends her weekends painting landscapes. This month she brought her brushes to the Art Studio.",
      "Residents painted, sipped and chatted all afternoon, and their canvases hung in the hallway for the rest of the week.",
    ],
  },
  {
    slug: "mine-tour",
    kind: "Events & Adventures",
    title: "Down into the Copper Creek Mine",
    dek: "Hard hats, headlamps and a walk through the tunnels that built Fairhollow.",
    date: "2026-09-24",
    photo: "/img/mine-tour.jpg",
    alt: "The timbered entrance to the Copper Creek Mine, with an ore cart outside",
    body: [
      "The bus wound up into the hills above Fairhollow to the Copper Creek Mine, where residents put on hard hats and headlamps and followed a guide into tunnels dug during the gold rush.",
      "It is the kind of outing Events & Adventures exists for: part history lesson, part adventure, and something to talk about at dinner for a week.",
    ],
  },
  {
    slug: "social-fitness",
    kind: "Wellness",
    author: "Avery Collins",
    title: "Social Fitness",
    dek: "Devin Marsh on why the best exercise is the kind you do alongside friends.",
    date: "2026-08-20",
    photo: "/img/fitness-center.jpg",
    alt: "The fitness center",
    body: [
      "Fitness Director Devin Marsh leads more than 25 classes a week, and he has noticed something: residents who come with a friend keep coming.",
      "So every class, from Better Balance to the Monday nature walk, is planned to be as much about company as about exercise.",
    ],
  },
  {
    slug: "relationships-make-alder-bend-home",
    kind: "News",
    title: "Relationships Make Alder Bend Home",
    dek: "It is the people you get to know, more than the floor plan, that make a place feel like yours.",
    date: "2026-07-30",
    photo: "/img/friends-laugh.jpg",
    alt: "Two residents laughing together",
    body: ["Ask residents what makes Alder Bend home and they start naming people: the Ambassador who has their coffee ready, the neighbour who keeps a chair free at trivia."],
  },
  {
    slug: "gather-around-the-table",
    kind: "Dining",
    title: "Gather Around the Table",
    dek: "Three restaurants, one belief: a meal tastes better with company.",
    date: "2026-06-18",
    photo: "/img/juniper-people.jpg",
    alt: "Residents sharing dinner in the Juniper Room",
    body: ["Culinary Director Rafael Domingo plans every menu around what is in season, and around the conversations it starts."],
  },
  {
    slug: "renata-named-executive-director-of-the-year",
    kind: "News",
    title: "Renata Named Executive Director of the Year!",
    dek: "The Calder Valley Senior Care Council honors our Executive Director.",
    date: "2026-05-12",
    photo: "/img/lobby.jpg",
    alt: "The Alder Bend lobby",
    body: ["Congratulations to Executive Director Renata Holloway, named Executive Director of the Year by the Calder Valley Senior Care Council."],
  },
  {
    slug: "a-great-place-to-work",
    kind: "Careers",
    title: "Not Just a Great Place to Live, Also a Great Place to Work",
    dek: "When team members feel valued, residents can tell.",
    date: "2026-04-02",
    photo: "/img/care-laugh.jpg",
    alt: "A Care Partner laughing with a resident",
    body: ["Looking after residents starts with looking after the people who care for them."],
  },
  {
    slug: "what-makes-an-amazing-community",
    kind: "News",
    title: "What Makes an Amazing Community",
    dek: "Good rooms help. Good company matters most.",
    date: "2026-02-26",
    photo: "/img/courtyard-dining.jpg",
    alt: "Residents dining outdoors in the courtyard",
    body: ["Beautiful rooms bring people out of their apartments. The people they find there are what keep them coming back."],
  },
];

export const guides = [
  { title: "Is Senior Living the Right Choice?", pages: 8, photo: "/img/mother-daughter.jpg" },
  { title: "Weighing the Senior Living Care Options", pages: 10, photo: "/img/care-outdoors.jpg" },
  { title: "Understanding the Cost of Senior Living", pages: 9, photo: "/img/coffee-woman.jpg" },
  { title: "10 Senior Living Funding Sources", pages: 12, photo: "/img/couple-hands.jpg" },
  { title: "Tips for Funding Senior Living", pages: 7, photo: "/img/reading-together.jpg" },
  { title: "Insurance Options for Senior Living", pages: 8, photo: "/img/care-meds.jpg" },
  { title: "VA Aid and Attendance", pages: 6, photo: "/img/flag.jpg" },
  { title: "7 Ways Senior Living Communities Provide Safety & Security", pages: 7, photo: "/img/lobby-tall.jpg" },
  { title: "Staying Social in Senior Living", pages: 6, photo: "/img/friends-walking.jpg" },
];

export const faqs = [
  { q: "Is there a second-person fee?", a: "No. A second resident in the same apartment pays nothing extra, which leaves couples about $12,000 a year better off." },
  { q: "Are pets welcome?", a: "Yes. Cats and dogs are part of the community, and there is a fenced pet area in the courtyard." },
  { q: "What’s included in the monthly rent?", a: "Housekeeping every week; utilities, internet and cable; maintenance and handyman help; the 24-hour emergency response system; scheduled transportation; Events & Adventures; the fitness program; and use of all three restaurants." },
  { q: "If I need more help later, will I have to move?", a: "No. Our resident services team can bring Assisted Living Services to any apartment. Support starts at a base fee of $850 a month, with personal care priced by care plan." },
  { q: "What is Lantern?", a: "Lantern is our secure memory care neighborhood. It has its own courtyard, its own Events & Adventures program and an outing every week. Studios start at $6,400 a month." },
  { q: "Do you provide transportation?", a: "Yes, it is included. The bus covers shopping trips, appointments and every outing on the calendar, all leaving from the Lobby." },
  { q: "Can my family join me for a meal?", a: "Yes, any time. Book lunch online or ask our Dining Experience Director to save you a table." },
  { q: "Are you licensed?", a: "Yes. The California Department of Social Services licenses Alder Bend as a Residential Care Facility for the Elderly, RCFE License #100000101." },
  { q: "How do I schedule a tour?", a: "Book online whenever it suits you, or call Priya Nandakumar, our Community Relations Director, at (916) 555-0140. Lunch in one of our restaurants is on us." },
];

export const careers = {
  intro: "Good care starts with a team that feels valued, and the work here makes a real difference every day.",
  benefits: [
    "Medical, dental and vision insurance",
    "Life and disability insurance",
    "Flexible spending account",
    "15 days’ PTO, increasing after year four",
    "6 paid holidays",
    "Paid volunteer time",
    "401(k) with company match",
    "Tuition assistance",
    "Paid professional development",
    "A free meal every day you work",
  ],
  steps: [
    { title: "Apply online", text: "Find the role that suits you and send your application. It takes about ten minutes." },
    { title: "Recruiter phone screen", text: "A short call with our recruiter to talk about the role, your schedule and your questions." },
    { title: "Community interview", text: "Meet the department director at Alder Bend and see the community for yourself." },
    { title: "Next steps", text: "We’ll follow up quickly with an offer or feedback — either way, you’ll hear from us." },
  ],
  openings: [
    { title: "Care Partner", dept: "Resident Services", type: "Full-time · Days, evenings, NOCs", pay: "$21–$24/hr" },
    { title: "Med Tech", dept: "Resident Services", type: "Full-time · Days", pay: "$23–$26/hr" },
    { title: "Line Cook", dept: "Culinary", type: "Full-time", pay: "$20–$23/hr" },
    { title: "Server", dept: "Dining", type: "Part-time · Evenings & weekends", pay: "$17.50/hr + tips pool" },
    { title: "Lantern Engagement Partner", dept: "Lantern Memory Care", type: "Full-time", pay: "$21–$23/hr" },
    { title: "Concierge Ambassador", dept: "Front desk", type: "Part-time · Weekends", pay: "$19/hr" },
  ],
};

export const testimonials: Testimonial[] = [
  { quote: "I came for a nicer kitchen and ended up with forty new friends. My calendar is fuller than it was when I worked.", name: "Dolores", relation: "Resident since 2022" },
  { quote: "These days I have to book a time to call my father. Between bridge and the Friday trips, he’s never in.", name: "Nathan", relation: "Son of a resident" },
  { quote: "At Lantern they still see the man I married. Last month they had him out on a paddleboard on Millpond Lake.", name: "Corinne", relation: "Wife of a Lantern resident" },
];

/** Quick links shown in the header navigation */
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
    { label: "What is LIVE?", href: "/lifestyle#live" },
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
