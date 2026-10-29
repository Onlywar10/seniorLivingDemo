// Prairie City Landing: the facts every page draws on.

export const site = {
  name: "Prairie City Landing",
  short: "PCL",
  byline: "A Tenfold Senior Living Community",
  operator: "Tenfold Senior Living",
  tagline: "Sacramento County’s award-winning luxury senior living community.",
  lifestyle: "Not just a home, but a lifestyle.",
  independent: "A truly independent lifestyle, with real apartment homes and amazing community spaces.",
  address: { street: "645 Willard Drive", city: "Folsom", state: "CA", zip: "95630" },
  addressLine: "645 Willard Drive, Folsom, CA 95630",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=645+Willard+Drive+Folsom+CA+95630",
  mapsEmbed: "https://www.google.com/maps?q=645+Willard+Drive,+Folsom,+CA+95630&output=embed",
  location: [
    "Just off US-50, next to Folsom High School",
    "Minutes from historic downtown Folsom and Sutter Street",
    "Close to the Palladio shopping center and Folsom’s hospitals",
    "About 40 minutes from Sacramento International Airport",
  ],
  phone: "(916) 458-0303",
  phoneHref: "tel:+19164580303",
  phonesAlso: ["(916) 232-7621", "(916) 226-5300"],
  email: "info@prairiecitylanding.com",
  careersEmail: "hr@tenfoldseniorliving.com",
  accessibilityEmail: "info@tenfoldseniorliving.com",
  licence: "RCFE License #342700370",
  licenceNo: "342700370",
  facebook: "https://www.facebook.com/PrairieCityLanding",
  sister: { name: "Bruceville Point", city: "Elk Grove", url: "https://brucevillepoint.com/" },
  tenfoldUrl: "https://tenfoldseniorliving.com/",
  hoursOffice: "Tours daily, 9:00 am–5:00 pm · Community Relations Mon–Sat",
};

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

export const awards = [
  { title: "Best of Folsom · Senior Living", detail: "Voted by readers eight years running", source: "Folsom Telegraph & Style Magazine", years: 8 },
  { title: "Outstanding Executive Director", detail: "Awarded to Cheryl Martin", source: "California Assisted Living Association (CALA)" },
  { title: "SageCare Certified", detail: "Annual LGBTQ+ inclusion training for every team member", source: "SAGE" },
];

export const welcome = {
  intro: "Prairie City Landing is a home for everyone. We are committed to diversity, equity and inclusion — among residents, families and our team.",
  points: [
    { title: "SageCare certified", text: "Every team member completes SageCare training each year, so LGBTQ+ older adults feel included, respected and safe here." },
    { title: "Diversity, equity and inclusion", text: "We welcome residents and team members of every race, faith, culture, ability, gender identity and sexual orientation." },
    { title: "ASL interpreters", text: "American Sign Language interpreters are available for tours, care conferences and community events. Just ask." },
    { title: "Accessible by design", text: "Our buildings, website and printed calendars are designed to be easy to see, hear, reach and read." },
  ],
};

export type LivingKey = "independent" | "assisted" | "harbor";

export const living: Record<LivingKey, {
  key: LivingKey; name: string; href: string; lede: string; from: string; photo: string; alt: string; points: string[];
}> = {
  independent: {
    key: "independent",
    name: "Independent Living",
    href: "/living/independent-living",
    lede: "Luxury apartment homes up to 1,417 square feet, with full kitchens, your own washer and dryer, and a calendar full of things you actually want to do.",
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
      "A space beside every front door for your personal statement",
      "No second-person fee — about $12,000 a year saved for couples",
      "Pets welcome",
    ],
  },
  assisted: {
    key: "assisted",
    name: "Assisted Living Services",
    href: "/living/assisted-living",
    lede: "Support delivered discreetly in every apartment, so you never have to move to get the help you need.",
    from: "$850 a month base support fee, plus personal care by care plan",
    photo: "/img/care-chat.jpg",
    alt: "A Care Partner chatting with a resident on her sofa",
    points: [
      "Available in every apartment — residents never have to move",
      "Delivered by the Tenfold resident services team, led by our Resident Services Director",
      "Medication management",
      "Personal care",
      "Escorts to meals, activities and appointments",
      "Coordination with your healthcare providers",
      "Additional services based on a pre-move-in assessment",
      "A limited number of studios and one-bedrooms tailored for assisted living, near the Care Partner team",
    ],
  },
  harbor: {
    key: "harbor",
    name: "Harbor Memory Care",
    href: "/living/harbor-memory-care",
    lede: "An environment of youthful optimism, where ‘we can’t’ becomes ‘how can we…’.",
    from: "From $6,400 a month",
    photo: "/img/harbor-living.jpg",
    alt: "Harbor’s bright living room with armchairs and a fireplace",
    points: [
      "A home-like, secured neighborhood with its own courtyard",
      "Its own Events & Adventures program, with weekly outings",
      "Bowling, local restaurants, golf, camping, visiting horses — even stand-up paddling",
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
  harbor: [
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

export const money = (n: number) => "$" + n.toLocaleString("en-US");

export type PlanKind = "independent" | "assisted" | "harbor";
export interface Plan {
  code: string;
  name: string;
  kind: PlanKind;
  beds: 0 | 1 | 2;
  baths: number;
  sqft?: number;
  from?: number;
  available: number; // 0 = waitlist
  waitlist: number;
  features: string[];
  /** Simple room layout used by the plan drawing and the virtual tour map: [room key, x, y, w, h] on a 100×70 grid */
  rooms: [string, number, number, number, number][];
  balcony?: boolean;
}

const ilFeatures = ["Full-size kitchen with stainless appliances", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows", "Emergency pull cords"];

export const plans: Plan[] = [
  { code: "NA1", name: "Studio", kind: "independent", beds: 0, baths: 1, sqft: 488, from: 5950, available: 1, waitlist: 0, features: ["Full kitchen with peninsula", "In-apartment washer and dryer", "Walk-in closet", "Oversized windows"], rooms: [["entry", 0, 50, 25, 20], ["kitchen", 0, 0, 30, 50], ["living", 30, 0, 70, 45], ["bath", 25, 45, 35, 25], ["closet", 60, 45, 40, 25]] },
  { code: "NB2B", name: "One Bedroom Standard", kind: "independent", beds: 1, baths: 1, sqft: 660, from: 6155, available: 2, waitlist: 0, features: ilFeatures, rooms: [["entry", 0, 48, 22, 22], ["kitchen", 0, 0, 30, 48], ["living", 30, 0, 38, 50], ["bedroom", 68, 0, 32, 50], ["bath", 22, 50, 30, 20], ["closet", 52, 50, 48, 20]] },
  { code: "NB1C", name: "One Bedroom Deluxe", kind: "independent", beds: 1, baths: 1, sqft: 782, from: 8790, available: 0, waitlist: 4, balcony: true, features: [...ilFeatures, "Private balcony"], rooms: [["entry", 0, 48, 20, 22], ["kitchen", 0, 0, 28, 48], ["living", 28, 0, 40, 52], ["bedroom", 68, 0, 32, 52], ["bath", 20, 52, 34, 18], ["closet", 54, 52, 46, 18], ["balcony", 28, -14, 40, 14]] },
  { code: "NC1", name: "Two Bedroom Deluxe", kind: "independent", beds: 2, baths: 2, sqft: 1030, from: 8600, available: 1, waitlist: 0, balcony: true, features: [...ilFeatures, "Second full bathroom", "Private balcony"], rooms: [["entry", 0, 50, 18, 20], ["kitchen", 0, 0, 26, 50], ["living", 26, 0, 38, 52], ["bedroom", 64, 0, 36, 40], ["bedroom2", 64, 40, 36, 30], ["bath", 18, 52, 24, 18], ["closet", 42, 52, 22, 18], ["balcony", 26, -14, 38, 14]] },
  { code: "NC4", name: "Two Bedroom Deluxe", kind: "independent", beds: 2, baths: 2, sqft: 1075, from: 10550, available: 0, waitlist: 6, balcony: true, features: [...ilFeatures, "Corner windows on two sides", "Second full bathroom", "Private balcony"], rooms: [["entry", 0, 50, 18, 20], ["kitchen", 0, 0, 28, 50], ["living", 28, 0, 38, 52], ["bedroom", 66, 0, 34, 40], ["bedroom2", 66, 40, 34, 30], ["bath", 18, 52, 26, 18], ["closet", 44, 52, 22, 18], ["balcony", 28, -14, 38, 14]] },
  { code: "NC6", name: "Two Bedroom Grand", kind: "independent", beds: 2, baths: 2, sqft: 1417, from: 11800, available: 1, waitlist: 2, balcony: true, features: [...ilFeatures, "Separate dining room", "Two walk-in closets", "Wrap-around balcony"], rooms: [["entry", 0, 50, 16, 20], ["kitchen", 0, 0, 24, 50], ["living", 24, 0, 42, 52], ["bedroom", 66, 0, 34, 38], ["bedroom2", 66, 38, 34, 32], ["bath", 16, 52, 26, 18], ["closet", 42, 52, 24, 18], ["balcony", 24, -14, 76, 14]] },
  { code: "AB2", name: "Assisted Living One Bedroom Standard", kind: "assisted", beds: 1, baths: 1, sqft: 602, from: 7610, available: 1, waitlist: 0, features: ["Near the Care Partner team", "Kitchenette", "Walk-in shower with grab bars", "Emergency pull cords", "Washer and dryer"], rooms: [["entry", 0, 48, 22, 22], ["kitchen", 0, 0, 28, 48], ["living", 28, 0, 38, 52], ["bedroom", 66, 0, 34, 52], ["bath", 22, 52, 36, 18], ["closet", 58, 52, 42, 18]] },
  { code: "AZ1", name: "Harbor Standard Private Room", kind: "harbor", beds: 0, baths: 1, sqft: 389, from: 8270, available: 1, waitlist: 0, features: ["Private bathroom", "Secured Harbor neighborhood", "Courtyard access", "Emergency pull cords"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 70], ["closet", 30, 50, 40, 20]] },
  { code: "AZ2", name: "Harbor Private Room with Shared Bath", kind: "harbor", beds: 0, baths: 0.5, sqft: 304, available: 0, waitlist: 2, features: ["Bathroom shared with one neighbour", "Secured Harbor neighborhood", "Courtyard access", "Emergency pull cords"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 75, 50], ["bath", 75, 0, 25, 50], ["closet", 30, 50, 45, 20]] },
  { code: "AZ3", name: "Harbor Room", kind: "harbor", beds: 0, baths: 1, available: 0, waitlist: 1, features: ["Secured Harbor neighborhood", "Courtyard access"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 50], ["closet", 30, 50, 40, 20]] },
  { code: "AZ4", name: "Harbor Room", kind: "harbor", beds: 0, baths: 1, available: 1, waitlist: 0, features: ["Secured Harbor neighborhood", "Courtyard access"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 50], ["closet", 30, 50, 40, 20]] },
  { code: "AZ5", name: "Harbor Room", kind: "harbor", beds: 0, baths: 1, available: 0, waitlist: 0, features: ["Secured Harbor neighborhood", "Courtyard access"], rooms: [["entry", 0, 50, 30, 20], ["bedroom", 0, 0, 70, 50], ["bath", 70, 0, 30, 50], ["closet", 30, 50, 40, 20]] },
];

export const planKindLabel: Record<PlanKind, string> = { independent: "Independent Living", assisted: "Assisted Living", harbor: "Harbor Memory Care" };

export interface Space { key: string; name: string; kind: string; text: string; hours?: string; photo: string; alt: string; more?: string[] }

export const spaces: Space[] = [
  { key: "rendezvous", name: "The Rendezvous", kind: "Coffeehouse & wine bar", hours: "7:00 am–7:00 pm", text: "Our Italian-style coffeehouse and wine bar is the all-day town hall — morning latte to pre-dinner wine. Frequent happy hours bring cocktails, mocktails and complimentary snacks for friends and visitors.", photo: "/img/rendezvous.jpg", alt: "The Rendezvous coffeehouse with its bar and café tables" },
  { key: "cypress", name: "The Cypress Room", kind: "Restaurant", hours: "11:00 am–7:00 pm", text: "White-tablecloth service and a seasonal, farm-to-table menu that changes every week.", photo: "/img/cypress.jpg", alt: "The Cypress Room dining room set with white tablecloths" },
  { key: "natoma", name: "Natoma Café", kind: "All-day café", hours: "7:00 am–7:00 pm", text: "California comfort food from breakfast flapjacks to fish tacos, all day long.", photo: "/img/natoma.jpg", alt: "Natoma Café’s sunny dining area" },
  { key: "theatre", name: "Theatre", kind: "Media & theater room", text: "State-of-the-art sound for movies, lectures, visiting authors and artists, and religious services.", photo: "/img/theatre.jpg", alt: "The theatre with tiered armchairs and a large screen" },
  { key: "art", name: "Art Studio", kind: "Studio", text: "Classes from visiting artists, and the home of our bridge, pinochle, knitting and flower clubs.", photo: "/img/art-studio.jpg", alt: "The art studio with long work tables and easels" },
  { key: "fitness", name: "Fitness Center", kind: "Fitness", text: "A large class studio and equipment designed for seniors, home to more than 25 classes a week.", photo: "/img/fitness-center.jpg", alt: "The fitness center with exercise machines and a class floor" },
  { key: "salon", name: "Salon", kind: "Salon", text: "A full range of beauty services, right downstairs.", photo: "/img/salon.jpg", alt: "The salon’s styling chairs and mirrors" },
  { key: "club", name: "Club Room", kind: "Private dining", text: "Reserve it for private parties with catering from our kitchen. It opens onto its own patio.", photo: "/img/club-room.jpg", alt: "The Club Room with a fireplace and dining table" },
  { key: "living", name: "Living Room", kind: "Library & lounge", text: "Home to our library, Scrabble Club and Book Club, and a favorite spot for an afternoon read.", photo: "/img/living-room.jpg", alt: "The Living Room with armchairs and bookshelves" },
  { key: "courtyard", name: "Courtyard", kind: "Outdoor living room", text: "Fire table, outdoor dining, gas barbecues, raised planters, a cutting garden — and an outdoor area for dogs and cats.", photo: "/img/courtyard-palms.jpg", alt: "The courtyard with palms, lawn and outdoor seating" },
  { key: "lounge", name: "2nd Floor Lounge", kind: "Lounge", text: "A quiet upstairs lounge for crafts, puzzles and visits from Thor, our therapy pet.", photo: "/img/lounge.jpg", alt: "The second-floor lounge" },
  { key: "lobby", name: "Lobby", kind: "Arrivals", text: "Light-filled and welcoming. Every bus trip departs from here.", photo: "/img/lobby.jpg", alt: "The double-height lobby with a staircase and sofas" },
];

export interface TeamMember { name: string; role: string; dept: string; bio: string; key?: boolean; ext?: string }

export const team: TeamMember[] = [
  { name: "Cheryl Martin", role: "Executive Director", dept: "Leadership", key: true, ext: "101", bio: "Cheryl leads the community and received the California Assisted Living Association’s Outstanding Executive Director Award. Her door is open, and she hosts a monthly Town Hall with residents." },
  { name: "Cynthia Bazin", role: "Community Relations Director", dept: "Tours & move-ins", key: true, ext: "110", bio: "Cynthia is your first call. She leads every tour, answers every question about apartments and pricing, and helps families plan a move at their own pace." },
  { name: "Jan McLennon", role: "Resident Services Director", dept: "Assisted Living Services", key: true, ext: "120", bio: "Jan leads the Care Partner team, completes pre-move-in assessments and builds each resident’s care plan with families and healthcare providers." },
  { name: "Janelle Zweber", role: "Harbor Memory Care Director", dept: "Harbor", key: true, ext: "130", bio: "Janelle runs Harbor with an eye for possibility — turning ‘we can’t’ into ‘how can we…’ for every resident and family." },
  { name: "Toni Glenn", role: "Events & Adventures Director", dept: "Events & Adventures", ext: "140", bio: "Toni plans everything from Monday trivia to Gold Rush-era mine tours, and runs the Friday Activity Meeting where residents shape next week’s calendar." },
  { name: "Jason Cherry", role: "Fitness Director", dept: "Fitness", ext: "150", bio: "Jason is full-time on site and teaches more than 25 classes a week. He is the author of “Social Fitness”, and leads the Monday nature walks and the monthly Healthy Happy Hour." },
  { name: "Mickei Butler", role: "Dining Experience Director", dept: "Dining", ext: "160", bio: "Mickei runs all three restaurants and takes your lunch and private dining reservations." },
  { name: "Conrad Caguimbal", role: "Culinary Director", dept: "Dining", ext: "161", bio: "Conrad designs every menu, from the Cypress Room’s weekly farm-to-table dinner to Natoma Café’s flapjacks, and hosts Conversations with Chef." },
  { name: "Douglas Wigner", role: "Business Office Director", dept: "Business office", ext: "170", bio: "Douglas looks after billing, leases and everything administrative, so families always know where they stand." },
  { name: "Shirley Richard", role: "Lead Ambassador", dept: "Front desk", ext: "100", bio: "Shirley and the Ambassador team are the first smile in the lobby, seven days a week." },
  { name: "Bill Hagemeyer", role: "President of the Resident Council", dept: "Resident Council", bio: "Bill chairs the All-Resident Council Meeting each month and is happy to tell prospective neighbours what life here is really like." },
];

export const steward = {
  title: "Team Steward of the Month",
  name: "Esther Timoshenko",
  role: "Med Tech",
  month: "October 2026",
  praise: ["communication", "cheerfulness", "attentiveness"],
  quotes: [
    "She is kind and communicates well with both team members and residents.",
    "Esther always has a smile, and she notices the little things before anyone has to ask.",
    "Residents light up when she comes down the hall.",
  ],
};

export const instructors = [
  { name: "Sonya", what: "Chair Yoga" },
  { name: "Shaun", what: "Sit To Be Fit" },
  { name: "Showen", what: "Tai Chi" },
  { name: "Rhea", what: "Zumba" },
  { name: "Ava", what: "Brain Busters" },
  { name: "Chaplain Dave", what: "Non-Denominational Service" },
  { name: "Fr. Giovanni Gamas", what: "Catholic Mass, St. John the Baptist Catholic Church" },
  { name: "Thor", what: "Therapy pet" },
];

export const fitness = {
  intro: "More than 25 classes a week, taught by a full-time Fitness Director, and adventures that get you out the door.",
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

export interface Story { slug: string; title: string; dek: string; date: string; photo: string; alt: string; credit?: string; body: string[]; kind: "Events & Adventures" | "News" | "Dining" | "Wellness" | "Careers"; author?: string }

export const stories: Story[] = [
  {
    slug: "walk-to-end-alzheimers",
    kind: "Events & Adventures",
    title: "Walk to End Alzheimer’s",
    dek: "Harbor residents tie-dyed their own shirts, then families, Care Partners and residents walked together.",
    date: "2026-10-17",
    photo: "/img/friends-walking.jpg",
    alt: "Residents and family members walking together outdoors",
    body: [
      "Harbor residents spent the week before the walk tie-dyeing shirts in every color of the rainbow — no two alike.",
      "On the day, families, Care Partners and residents walked side by side. Some went the full route; some cheered from the shade with lemonade. Everyone came home proud.",
    ],
  },
  {
    slug: "paint-and-sip-with-cassandra",
    kind: "Events & Adventures",
    title: "Paint and Sip by Cassandra",
    dek: "One of our Care Partners — a career med tech now studying design at Sacramento State — taught an art class.",
    date: "2026-10-08",
    photo: "/img/art-studio.jpg",
    alt: "The art studio set up for a painting class",
    body: [
      "Cassandra has spent her career as a med tech. Now she is studying design at Sacramento State, and she brought her new skills to the Art Studio.",
      "Residents painted, sipped and laughed through the afternoon, and the finished canvases lined the hallway for a week.",
    ],
  },
  {
    slug: "gold-bug-mine",
    kind: "Events & Adventures",
    title: "Into the Gold Bug Mine",
    dek: "Hard hats on, lamps lit: a trip deep into the Gold Rush-era mine in Placerville.",
    date: "2026-09-24",
    photo: "/img/gold-bug-mine.jpg",
    alt: "The timbered entrance to the Gold Bug Mine, with an ore cart outside",
    credit: "Photo: KLOTZ, CC BY-SA 3.0, via Wikimedia Commons",
    body: [
      "Our bus headed up the hill to Placerville’s Gold Bug Park, where residents put on hard hats and lights and walked into a real Gold Rush-era mine.",
      "It is exactly the kind of can-do adventure Events & Adventures is about — from everyday enjoyment to once-in-a-lifetime bucket list items.",
    ],
  },
  {
    slug: "social-fitness",
    kind: "Wellness",
    author: "Robin Johnson",
    title: "Social Fitness",
    dek: "Why Jason Cherry believes the best workout is the one you do with friends.",
    date: "2026-08-20",
    photo: "/img/fitness-center.jpg",
    alt: "The fitness center",
    body: [
      "Fitness Director Jason Cherry teaches more than 25 classes a week, and he has a theory: people keep moving when they move together.",
      "From Better Balance to the Monday nature walks, every class is built to be as social as it is physical — which is why residents keep coming back.",
    ],
  },
  {
    slug: "relationships-make-prairie-city-landing-home",
    kind: "News",
    title: "Relationships Make Prairie City Landing Home",
    dek: "The friendships between residents and team members are what turn an apartment into a home.",
    date: "2026-07-30",
    photo: "/img/friends-laugh.jpg",
    alt: "Two residents laughing together",
    body: ["Ask any resident what makes Prairie City Landing feel like home and you will hear names: the Ambassador who remembers your coffee order, the neighbour who saves you a seat at trivia."],
  },
  {
    slug: "gather-around-the-table",
    kind: "Dining",
    title: "Gather Around the Table",
    dek: "Three restaurants, one idea: good food is better shared.",
    date: "2026-06-18",
    photo: "/img/cypress-people.jpg",
    alt: "Residents sharing dinner in the Cypress Room",
    body: ["Culinary Director Conrad Caguimbal designs every menu around the season — and around the conversations that happen over it."],
  },
  {
    slug: "cheryl-receives-outstanding-executive-director-award",
    kind: "News",
    title: "Cheryl Receives the Outstanding Executive Director Award!",
    dek: "The California Assisted Living Association honors our Executive Director.",
    date: "2026-05-12",
    photo: "/img/lobby.jpg",
    alt: "The Prairie City Landing lobby",
    body: ["Congratulations to Executive Director Cheryl Martin, recipient of CALA’s Outstanding Executive Director Award."],
  },
  {
    slug: "a-great-place-to-work",
    kind: "Careers",
    title: "Not Just a Great Place to Live, Also a Great Place to Work",
    dek: "Team members who are seen and appreciated make residents feel the same way.",
    date: "2026-04-02",
    photo: "/img/care-laugh.jpg",
    alt: "A Care Partner laughing with a resident",
    body: ["Our purpose includes our team: a community where team members are seen and appreciated."],
  },
  {
    slug: "what-makes-an-amazing-community",
    kind: "News",
    title: "What Makes an Amazing Community",
    dek: "Spaces matter. People matter more.",
    date: "2026-02-26",
    photo: "/img/courtyard-dining.jpg",
    alt: "Residents dining outdoors in the courtyard",
    body: ["Amazing spaces get people out of their apartments. Amazing people make them want to stay."],
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
  { q: "Is there a second-person fee?", a: "No. There is no second-person fee at Prairie City Landing, which saves couples about $12,000 a year." },
  { q: "Are pets welcome?", a: "Yes. Dogs and cats are welcome, and the courtyard has its own outdoor area for them." },
  { q: "What’s included in the monthly rent?", a: "Weekly housekeeping, all utilities with full internet and cable, all maintenance and handyman services, the 24-hour emergency response system, scheduled transportation, Events & Adventures, the fitness program, and access to all three restaurants." },
  { q: "If I need more help later, will I have to move?", a: "No. Assisted Living Services are available in every apartment, delivered discreetly by our resident services team. The base support fee is $850 a month, plus personal care by care plan." },
  { q: "What is Harbor?", a: "Harbor is our secured memory care neighborhood, with its own courtyard, its own Events & Adventures program and weekly outings. Studios start at $6,400 a month." },
  { q: "Do you provide transportation?", a: "Yes. Scheduled transportation is included — shopping trips, appointments, and every bus trip on the calendar, which depart from the Lobby." },
  { q: "Can my family join me for a meal?", a: "Of course. Families and visitors are always welcome, and you can book lunch online or with our Dining Experience Director." },
  { q: "Are you licensed?", a: "Yes. Prairie City Landing is licensed by the California Department of Social Services as a Residential Care Facility for the Elderly, RCFE License #342700370." },
  { q: "How do I schedule a tour?", a: "Book online any time, or call Cynthia Bazin, our Community Relations Director, at (916) 458-0303. Lunch in one of our restaurants is on us." },
];

export const careers = {
  intro: "We’re a community where team members are seen and appreciated — and where the work matters.",
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
    { title: "Community interview", text: "Meet the department director at Prairie City Landing and see the community for yourself." },
    { title: "Next steps", text: "We’ll follow up quickly with an offer or feedback — either way, you’ll hear from us." },
  ],
  openings: [
    { title: "Care Partner", dept: "Resident Services", type: "Full-time · Days, evenings, NOCs", pay: "$21–$24/hr" },
    { title: "Med Tech", dept: "Resident Services", type: "Full-time · Days", pay: "$23–$26/hr" },
    { title: "Line Cook", dept: "Culinary", type: "Full-time", pay: "$20–$23/hr" },
    { title: "Server", dept: "Dining", type: "Part-time · Evenings & weekends", pay: "$17.50/hr + tips pool" },
    { title: "Harbor Engagement Partner", dept: "Harbor Memory Care", type: "Full-time", pay: "$21–$23/hr" },
    { title: "Concierge Ambassador", dept: "Front desk", type: "Part-time · Weekends", pay: "$19/hr" },
  ],
};

export const testimonials = [
  { quote: "I moved here for the apartment. I stayed for the people. I haven’t been this busy since I retired.", name: "Marlene", relation: "Resident since 2022" },
  { quote: "Mom calls me after happy hour now instead of the other way round. That says everything.", name: "Greg", relation: "Son of a resident" },
  { quote: "Harbor sees my husband for who he still is. They took him paddleboarding. Paddleboarding!", name: "Linda", relation: "Wife of a Harbor resident" },
];

/** Quick links shown in the header navigation */
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
