// Staff back end: Alder Bend's operational records (families, prospects, messages,
// approvals, search and occupancy figures). Invented working data for the demo; every name is fictional.
// Times are stored as offsets from now / today so the screens always read as current.
import { abPeople } from "./people";
import { contactMaker, type Activity, type Answer, type Approval, type Contact, type Engine, type Enquiry, type Ranking, type ScoreRow, type Send, type StaffData, type Thread, type Tour, type Waiter, type WrongFact } from "./shared";

/* ------------------------------------------------------------- community */

const community = {
  residents: 212,
  lanternResidents: 22,
  apartments: 172,
  occupied: 164,
  families: 186, // households opted in to updates
  lanternFamilies: 21,
  contacts: 271,
  smsReachable: 183,
  emailReachable: 171,
};

const languages = [
  { k: "English", n: 158 },
  { k: "Spanish", n: 14 },
  { k: "Russian", n: 6 },
  { k: "Tagalog", n: 4 },
  { k: "Vietnamese", n: 2 },
  { k: "Chinese", n: 2 },
];

/* ------------------------------------------------------------ dashboard */

const weekKpis = {
  familiesReached: 181,
  postsThisWeek: 14,
  postsLastWeek: 11,
  messagesSent: 1094,
  deliveredRate: 98.6,
  openRate: 81,
  openRateLast: 76,
  toursBooked: 7,
  toursLast: 5,
};

const enquirySources = [
  { label: "Google search", value: 17 },
  { label: "Google Business Profile", value: 11 },
  { label: "Senior living referral service", value: 7 },
  { label: "AI search (ChatGPT and others)", value: 7 },
  { label: "Website chat", value: 6 },
  { label: "Website: Open House sign-up", value: 5 },
  { label: "Referrals from residents and families", value: 5 },
  { label: "Facebook", value: 3 },
  { label: "Walk-in", value: 2 },
];
const enquirySourcesPrev = [13, 8, 8, 3, 4, 1, 4, 2, 2];

const activity: Activity[] = [
  { who: "nora", mins: 34, text: "posted “Halloween Happy Hour: Costumes Encouraged” to the website, 186 families and this week’s digest" },
  { who: "devin", mins: 96, text: "sent “Healthy Happy Hour with Devin & Priya!” flyer for approval", tone: "wait" },
  { who: "priya", mins: 140, text: "booked a tour for the Andersons, Friday at 10:00 am, with lunch in the Juniper Room", tone: "info" },
  { who: "rafael", mins: 230, text: "published today’s menus for the Juniper Room, Millpond Café and The Perch" },
  { who: "maribel", mins: 60 * 19, text: "texted 21 Lantern families about Lantern Pumpkin Painting" },
  { who: "nora", mins: 60 * 21, text: "posted 12 photos from “Happy Hour: Wes on Guitar”" },
  { who: "leonard", mins: 60 * 26, text: "submitted a pricing correction for the One Bedroom Standard (NB2B)", tone: "wait" },
  { who: "renata", mins: 60 * 28, text: "approved “The Calder Valley Memory Walk” story and photos" },
  { who: "opal", mins: 60 * 45, text: "printed 60 large-print November calendars for the front desk" },
];

/* ------------------------------------------------------------ messages */

const sends: Send[] = [
  { id: "s1", title: "Halloween Happy Hour on Friday: costumes encouraged", audience: "All families", channels: "Text + email", by: "nora", mins: 34, sent: 186, delivered: 183, opened: 129, replied: 6, lang: 28 },
  { id: "s2", title: "Lantern Pumpkin Painting tomorrow at 10:30 am", audience: "Lantern families", channels: "Text", by: "maribel", mins: 60 * 19, sent: 21, delivered: 21, opened: 20, replied: 3, lang: 2 },
  { id: "s3", title: "Your week at Alder Bend", audience: "All families", channels: "Email digest", by: "nora", mins: 60 * 67, sent: 171, delivered: 169, opened: 131, replied: 2, lang: 26 },
  { id: "s4", title: "Juniper Hills apple orchards trip: 3 seats left", audience: "All families", channels: "Text + email", by: "nora", mins: 60 * 120, sent: 186, delivered: 184, opened: 158, replied: 9, lang: 28 },
  { id: "s5", title: "Calder Valley Memory Walk: photos are up", audience: "All families", channels: "Text + email", by: "maribel", mins: 60 * 214, sent: 186, delivered: 183, opened: 162, replied: 14, lang: 28 },
  { id: "s6", title: "The November calendar is live", audience: "All families", channels: "Text + email", by: "nora", mins: 60 * 190, sent: 186, delivered: 184, opened: 151, replied: 4, lang: 28 },
];


const templates = [
  { k: "event", label: "New event", text: "New on the AB calendar: {event}. Ask for a seat for your loved one from your personal link in this week’s message, or call the front desk at (916) 555-0140." },
  { k: "photos", label: "Photos are up", text: "Photos from {event} are up! See them on our website. Thank you for being part of the AB family." },
  { k: "reminder", label: "Reminder", text: "Reminder: {event}. Families are always welcome to join us." },
  { k: "change", label: "Schedule change", text: "Schedule change: {event}. We’re sorry for any inconvenience. Questions? Call (916) 555-0140." },
  { k: "lantern", label: "Lantern update", text: "Lantern update from Maribel: {event}. Thank you for sharing your loved one with us." },
];

const threads: Thread[] = [
  {
    id: "t1", from: "María Hernández", relation: "Daughter", resident: "Rosa Hernández", apt: "2214", lang: "Spanish", unread: true, mins: 22,
    subject: "Halloween Happy Hour",
    msgs: [
      { me: true, text: "Halloween Happy Hour on Friday, 3:00–4:00 pm in The Perch: live music, a costume parade and prizes. Costumes encouraged!", original: "Hora Feliz de Halloween el viernes, de 3:00 a 4:00 pm en The Perch: música en vivo, desfile de disfraces y premios. ¡Los disfraces son bienvenidos!", mins: 34 },
      { who: "María", text: "Can I come with my mom to the happy hour on Friday? Do I need a costume too? She wants to dress up as Frida Kahlo, ha ha.", original: "¿Puedo acompañar a mi mamá a la hora feliz del viernes? ¿Yo también necesito disfraz? Ella quiere vestirse de Frida Kahlo, jaja.", mins: 22 },
    ],
  },
  {
    id: "t2", from: "Tom Whitaker", relation: "Son", resident: "Dorothy Whitaker", apt: "1108", lang: "English", unread: true, mins: 75,
    subject: "Orchard trip waitlist",
    msgs: [
      { me: true, text: "Juniper Hills apple orchards trip on Saturday at 9:30 am from the Lobby: 3 seats left. Ask for a seat for Dorothy from your personal link: ab.link/r/4Tw9", mins: 60 * 120 },
      { who: "Tom", text: "Mom says she’s on the waitlist for the orchard trip. Any chance a seat opens up? She’s been talking about the cider donuts all week.", mins: 75 },
    ],
  },
  {
    id: "t3", from: "Ivan Petrov", relation: "Son", resident: "Galina Petrova", apt: "3105", lang: "Russian", unread: false, mins: 60 * 20,
    subject: "Photos",
    msgs: [
      { me: true, text: "12 photos from Happy Hour: Wes on Guitar are up on our website.", original: "12 фотографий с вечера «Happy Hour: Wes on Guitar» уже на нашем сайте.", mins: 60 * 21 },
      { who: "Ivan", text: "Thank you for the photos. Mother looks so happy. We will visit on Sunday for the violin concert.", original: "Спасибо за фотографии. Мама выглядит такой счастливой. Мы приедем в воскресенье на концерт скрипки.", mins: 60 * 20 },
      { me: true, text: "Wonderful! Lorenzo plays in Millpond Café at 3:00 pm on Sunday. We’ll save you seats next to Galina.", original: "Замечательно! Лоренцо играет в Millpond Café в воскресенье в 3:00. Мы оставим вам места рядом с Галиной.", mins: 60 * 19 },
    ],
  },
  {
    id: "t4", from: "Karen Liu", relation: "Daughter", resident: "George Liu", apt: "1216", lang: "English", unread: false, mins: 60 * 50,
    subject: "Thanksgiving",
    msgs: [
      { who: "Karen", text: "Is there a Thanksgiving dinner families can join? There will be four of us plus Dad.", mins: 60 * 52 },
      { me: true, text: "Yes! Thanksgiving dinner is in the Juniper Room from 11:00 am to 3:00 pm, by reservation. I’ve passed your note to Simone Archer (ext. 160), who will call you to book a table for five.", mins: 60 * 50 },
    ],
  },
  {
    id: "t5", from: "Susan Park", relation: "Daughter", resident: "Russell Park", apt: "Lantern 7", lang: "English", unread: false, mins: 60 * 210,
    subject: "Memory Walk",
    msgs: [
      { me: true, text: "Photos from the Calder Valley Memory Walk are up. Thank you to every family who walked with us!", mins: 60 * 214 },
      { who: "Susan", text: "Dad in a tie-dye shirt is the best thing I’ve seen all year. Thank you, Maribel and team.", mins: 60 * 210 },
    ],
  },
];

/* ------------------------------------------------------------ families */

const c = contactMaker(["351", "608", "817", "984", "932", "355", "988"]);
const contacts: Contact[] = [
  c("Rosa Hernández", "2214", "María Hernández", "Daughter", "SMS", "Spanish"),
  c("Dorothy Whitaker", "1108", "Tom Whitaker", "Son", "SMS + email"),
  c("Galina Petrova", "3105", "Ivan Petrov", "Son", "SMS + email", "Russian"),
  c("George Liu", "1216", "Karen Liu", "Daughter", "Email", "English", "011"),
  c("Russell Park", "Lantern 7", "Susan Park", "Daughter", "SMS + email", "English", "111", true),
  c("Harold Jensen", "2302", "Linda Jensen", "Wife", "SMS"),
  c("Margaret O’Neill", "1310", "Kevin O’Neill", "Son", "Email", "English", "011"),
  c("Walter Kim", "3212", "Grace Kim", "Daughter", "SMS + email"),
  c("Frank Delgado", "Lantern 3", "Elena Delgado", "Wife", "SMS", "Spanish", "111", true),
  c("June Albright", "2120", "Paul Albright", "Son", "SMS + email", "English", "110"),
  c("Raymond Ochoa", "1402", "Adriana Ochoa", "Granddaughter", "SMS", "Spanish"),
  c("Evelyn Strand", "3301", "Mark Strand", "Son", "Email", "English", "011"),
  c("Patricia Moreno", "2118", "Luis Moreno", "Son", "SMS", "Spanish"),
  c("Arthur Bellamy", "Lantern 11", "Diane Bellamy", "Daughter", "SMS + email", "English", "111", true),
  c("Lorraine Sato", "1204", "Kenji Sato", "Son", "SMS + email"),
  c("Norma Fischer", "3118", "Beth Fischer-Lowe", "Daughter", "Email", "English", "010"),
  c("Stanley Nguyen", "2410", "Thu Nguyen", "Daughter", "SMS", "Vietnamese"),
  c("Gloria Medina", "Lantern 15", "Ricardo Medina", "Son", "SMS", "Spanish", "111", true),
  c("Irene Kowalski", "1320", "Anna Kowalski", "Niece", "SMS + email"),
  c("Lester Grant", "2206", "Denise Grant", "Daughter", "SMS"),
  c("Mildred Haines", "Lantern 2", "Carol Haines", "Daughter", "SMS + email", "English", "110", true),
  c("Melvin Choi", "3204", "Daniel Choi", "Son", "Email", "Chinese", "011"),
  c("Ruth Delaney", "1114", "Patrick Delaney", "Son", "SMS + email"),
  c("Nadia Koval", "2307", "Oksana Koval", "Daughter", "SMS", "Russian"),
  c("Tomas Reyes", "1411", "Marisol Reyes", "Daughter", "SMS + email", "Tagalog"),
  c("Helen Marsh", "Lantern 19", "Jim Marsh", "Husband", "SMS", "English", "111", true),
  c("Howard Bishop", "3410", "Laura Bishop-Kent", "Daughter", "Email", "English", "011"),
  c("Virginia Salas", "2104", "Carmen Salas", "Daughter", "SMS", "Spanish"),
  c("Ernest Kaplan", "1302", "Rachel Kaplan", "Daughter", "SMS + email"),
  c("Agnes Morrow", "Lantern 5", "Neil Morrow", "Son", "SMS + email", "English", "100", true),
];

/** Residents who appear in photos. Photo consent comes from the family contact (or the resident). */
const residentsInPhotos = {
  pumpkins: [
    { name: "Dorothy Whitaker", consent: true },
    { name: "Rosa Hernández", consent: true },
    { name: "Harold Jensen", consent: true },
    { name: "Mildred Haines", consent: false },
  ],
  flag: [
    { name: "Harold Jensen", consent: true },
    { name: "Walter Kim", consent: true },
    { name: "Frank Delgado", consent: true },
  ],
  marshmallows: [
    { name: "Lorraine Sato", consent: true },
    { name: "George Liu", consent: true },
    { name: "Evelyn Strand", consent: true },
    { name: "Ruth Delaney", consent: true },
  ],
};

/** Resident names for RSVP lists. */
const residentNames = [
  "Dorothy Whitaker", "Rosa Hernández", "Galina Petrova", "Harold Jensen", "Margaret O’Neill", "Walter Kim", "June Carmichael",
  "June Albright", "Raymond Ochoa", "Evelyn Strand", "George Liu", "Patricia Moreno", "Lorraine Sato", "Eugene Pruitt", "Norma Fischer",
  "Clarence Boyd", "Herbert Lindqvist", "Irene Kowalski", "Lester Grant", "Stanley Nguyen", "Barbara Ellison", "Vernon Tate", "Joan Mackey",
  "Doris Abernathy", "Leonard Fox", "Phyllis Okafor", "Carl Rasmussen", "Ruth Delaney", "Howard Bishop", "Melvin Choi", "Edna Farrell",
  "Roy Castellanos", "Jean Whitfield", "Dale Henriksen", "Marilyn Cruz", "Wallace Reid", "Bernice Hollis", "Gerald Ames", "Lucille Varga",
  "Kenneth Oyama", "Florence Pike", "Donald Westbrook", "Virginia Salas", "Ernest Kaplan", "Albert Duarte", "Rita Sorensen", "Marvin Keel",
  "Elaine Tobin", "Nadia Koval", "Tomas Reyes",
];
const lanternNames = ["Russell Park", "Frank Delgado", "Arthur Bellamy", "Gloria Medina", "Mildred Haines", "Helen Marsh", "Agnes Morrow", "Floyd Sutton", "Hazel Ivers", "Wilma Grady", "Chester Ruiz", "Opal Lindgren"];


/* ------------------------------------------------------------ approvals */

const approvals: Approval[] = [
  {
    id: "a1", by: "devin", mins: 96, kind: "Flyer (PDF)", title: "Healthy Happy Hour with Devin & Priya!",
    detail: "Wednesday, November 18 · 3:00 pm · The Perch. Music, nutritious snacks and choreography.",
    photo: "/img/cocktail.jpg", channels: ["Website calendar", "Family text (186)", "Weekly email digest", "Large-print flyer"],
    note: "Mocktail recipes on the back. Priya is bringing the playlist.",
  },
  {
    id: "a2", by: "nora", mins: 60 * 3 + 10, kind: "News post with 6 photos", title: "Honoring our veterans",
    detail: "Veterans Day plans: the bus to the parade at 7:30 am, Veterans’ Lunch in Millpond Café, and the Veterans’ & Families Only Ceremony at 2:00 pm.",
    photo: "/img/flag.jpg", channels: ["Website news", "Family email digest", "Google Business Profile"],
    note: "All 6 residents pictured have photo consent on file.",
  },
  {
    id: "a3", by: "leonard", mins: 60 * 26, kind: "Pricing change", title: "One Bedroom Standard (NB2B) starting rate",
    detail: "Floor plans page shows $6,155; the pricing page and brochure say $6,150. Correct the floor plan to match.",
    channels: ["Website floor plans", "Google Business Profile"], diff: ["From $6,155 a month", "From $6,150 a month"],
  },
  {
    id: "a4", by: "rafael", mins: 60 * 30, kind: "Menu", title: "Thanksgiving dinner menu, Thursday, November 26",
    detail: "Juniper Room, 11:00 am–3:00 pm by reservation. Herb-roasted turkey, honey-glazed ham, wild mushroom Wellington, and pumpkin, pecan and apple desserts.",
    photo: "/img/turkey.jpg", channels: ["Website dining", "Family email digest", "Large-print menu cards"],
  },
];

const approvedRecently = [
  { title: "Calder Valley Memory Walk: story and 14 photos", by: "maribel", mins: 60 * 28, ok: true },
  { title: "November activity calendar (312 events)", by: "nora", mins: 60 * 190, ok: true },
  { title: "Paint and Sip with Talia: news post", by: "nora", mins: 60 * 24 * 19, ok: true },
  { title: "Photo post: “Guess the pumpkin” contest", by: "nora", mins: 60 * 50, ok: false, note: "Changes requested: one resident without photo consent. Re-sent with photo cropped." },
];

/* ------------------------------------------------------------ SEO */

const rankings: Ranking[] = [
  { q: "senior living Fairhollow", pos: 2, change: 3, volume: 880, url: "/", hist: [7, 7, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2] },
  { q: "assisted living Fairhollow", pos: 3, change: 2, volume: 720, url: "/living/assisted-living", hist: [8, 8, 7, 6, 6, 6, 5, 5, 5, 4, 3, 3] },
  { q: "memory care Fairhollow", pos: 4, change: 5, volume: 590, url: "/living/lantern-memory-care", hist: [12, 11, 11, 10, 9, 9, 8, 7, 6, 5, 5, 4] },
  { q: "independent living Millpond Lake", pos: 6, change: 8, volume: 260, url: "/living/independent-living", hist: [19, 18, 17, 15, 14, 14, 12, 10, 9, 8, 7, 6] },
  { q: "senior apartments Fairhollow", pos: 3, change: 1, volume: 390, url: "/floor-plans", hist: [5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3] },
  { q: "retirement community Fairhollow CA", pos: 2, change: 0, volume: 320, url: "/", hist: [3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
  { q: "luxury senior living Calder", pos: 9, change: 4, volume: 210, url: "/", hist: [18, 17, 16, 15, 15, 14, 13, 13, 12, 11, 10, 9] },
  { q: "senior living events Fairhollow", pos: 1, change: 6, volume: 90, url: "/calendar", hist: [9, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1] },
  { q: "Alder Bend", pos: 1, change: 0, volume: 1300, url: "/", hist: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

const searchWeekly = {
  clicks: [412, 436, 428, 470, 455, 498, 521, 547, 566, 598, 641, 689],
  impressions: [14200, 14650, 14400, 15300, 15800, 16400, 17100, 17900, 18800, 19700, 21300, 22900],
};

const gbp = { views: 8940, viewsPrev: 7610, calls: 112, callsPrev: 94, directions: 186, directionsPrev: 161, clicks: 341, clicksPrev: 262, rating: 4.8, reviews: 163, newReviews: 6 };

const reviewsRecent = [
  { name: "Corinne D.", stars: 5, mins: 60 * 40, text: "Lantern still sees the man I married. They even got him out on a paddleboard." },
  { name: "Nathan A.", stars: 5, mins: 60 * 24 * 4, text: "Mom has a fuller social calendar than I do. The weekly family texts are a lifesaver." },
  { name: "Ron P.", stars: 4, mins: 60 * 24 * 9, text: "Beautiful community and great food. Parking for visitors can be tight on Sundays." },
];

const topPages = [
  { url: "/calendar", title: "Activity Calendar", clicks: 512, change: 41 },
  { url: "/dining", title: "Dining: today’s menus", clicks: 384, change: 63 },
  { url: "/floor-plans", title: "Floor Plans & Pricing", clicks: 341, change: 18 },
  { url: "/living/lantern-memory-care", title: "Lantern Memory Care", clicks: 188, change: 27 },
  { url: "/living/assisted-living", title: "Assisted Living Services", clicks: 161, change: 12 },
  { url: "/faq", title: "FAQs", clicks: 104, change: 88 },
];

const vitals = [
  { k: "Largest Contentful Paint", v: "1.7 s", note: "Good is under 2.5 s" },
  { k: "Interaction to Next Paint", v: "96 ms", note: "Good is under 200 ms" },
  { k: "Cumulative Layout Shift", v: "0.02", note: "Good is under 0.1" },
];

/* ------------------------------------------------------------ GEO */

const engines: { k: Engine; short: string; score: number; prev: number; color: string }[] = [
  { k: "ChatGPT", short: "ChatGPT", score: 71, prev: 52, color: "#2f7a62" },
  { k: "Google AI Overviews", short: "AI Overviews", score: 68, prev: 50, color: "#4c87a2" },
  { k: "Perplexity", short: "Perplexity", score: 63, prev: 47, color: "#425968" },
  { k: "Gemini", short: "Gemini", score: 54, prev: 41, color: "#6b5aa6" },
];
const geoTrend = [31, 33, 34, 38, 41, 44, 47, 49, 53, 57, 60, 64];

const answers: Answer[] = [
  {
    engine: "ChatGPT", prompt: "best senior living in Fairhollow", accuracy: "accurate", recommended: true, position: 1, mins: 60 * 5,
    text: "Alder Bend (120 Alder Bend Way) is a top choice in Fairhollow: a Wrenhaven Senior Living community offering Independent Living, Assisted Living Services delivered in every apartment, and Lantern Memory Care. Calder Valley Living readers have voted it their Readers’ Choice for senior living and is known for its busy Events & Adventures calendar and three on-site restaurants.",
    competitors: ["a large continuing-care campus in north Calder", "an assisted living community on the far side of Millpond Lake"], cites: "alderbend.example/calendar",
  },
  {
    engine: "Google AI Overviews", prompt: "best senior living in Fairhollow", accuracy: "accurate", recommended: true, position: 2, mins: 60 * 5,
    text: "Highly rated options include Alder Bend, a luxury community near Fairhollow High School with apartments up to 1,417 sq ft and no second-person fee, and several smaller assisted living homes in the area.",
    competitors: ["a national-chain community in Calder", "smaller residential care homes"], cites: "alderbend.example/floor-plans",
  },
  {
    engine: "Perplexity", prompt: "memory care near Fairhollow CA", accuracy: "accurate", recommended: true, position: 1, mins: 60 * 9,
    text: "Alder Bend’s Lantern is a secured memory care neighborhood with its own courtyard and weekly outings, from bowling to stand-up paddling. Studios start at $6,400 a month. RCFE License #100000101.",
    competitors: ["a memory care community in east Calder", "a memory care wing at a north Calder campus"], cites: "alderbend.example/living/lantern-memory-care",
  },
  {
    engine: "Gemini", prompt: "memory care near Fairhollow CA", accuracy: "partly", recommended: true, position: 3, mins: 60 * 9,
    text: "Options include a memory care community in east Calder and a memory care wing at a north Calder campus. Alder Bend in Fairhollow offers senior living and assisted living; check with them about memory care.",
    competitors: ["a memory care community in east Calder", "a memory care wing at a north Calder campus"],
  },
  {
    engine: "ChatGPT", prompt: "does Alder Bend charge a second person fee", accuracy: "accurate", recommended: true, mins: 60 * 30,
    text: "No. Alder Bend does not charge a second-person fee, which the community says saves couples about $12,000 a year.",
    competitors: [], cites: "alderbend.example/faq",
  },
  {
    engine: "Gemini", prompt: "does Alder Bend charge a second person fee", accuracy: "wrong", recommended: false, mins: 60 * 30,
    text: "Most communities in the Calder area charge a second-person fee of $800–$1,200 a month, and Alder Bend lists a second-occupant fee for shared apartments.",
    competitors: [],
  },
  {
    engine: "Perplexity", prompt: "what’s for lunch at Alder Bend today", accuracy: "accurate", recommended: true, mins: 60 * 2,
    text: "Today’s menus are published on the Alder Bend dining page: the Juniper Room has a daily chef’s special and soup, Millpond Café serves breakfast all morning, and The Perch has a panini of the day.",
    competitors: [], cites: "alderbend.example/dining",
  },
  {
    engine: "Google AI Overviews", prompt: "independent living Millpond Lake", accuracy: "partly", recommended: true, position: 4, mins: 60 * 50,
    text: "Nearby options include communities around Millpond Lake and in Fairhollow. Alder Bend in Fairhollow, on the north shore, offers studios to two-bedroom apartments from about $4,795 a month.",
    competitors: ["two independent living communities in Calder", "a 55+ apartment complex in Fairhollow"], cites: "a 2022 senior living directory listing",
  },
];

const wrongFacts: WrongFact[] = [
  {
    id: "w1", claim: "Quotes the spring 2021 dining menu (“prime rib Fridays, early-bird dinner at 4:30”).", truth: "Menus change daily and are published every morning.",
    engines: ["Perplexity", "ChatGPT"], source: "An old PDF menu still linked from a 2021 Facebook post",
    fix: "Live /dining menu published daily with structured menu data. Old PDF redirected to /dining.", fixUrl: "/dining", status: "fixed", mins: 60 * 24 * 6,
  },
  {
    id: "w2", claim: "Says there is a second-person fee for couples.", truth: "There is no second-person fee, saving couples about $12,000 a year.",
    engines: ["Gemini"], source: "General answer about Calder-area pricing, not about AB",
    fix: "FAQ entry “Is there a second-person fee?” with FAQ structured data, and the line added to every floor plan.", fixUrl: "/faq", status: "in progress", mins: 60 * 24 * 2,
  },
  {
    id: "w3", claim: "Lists apartments “from about $4,795 a month”.", truth: "Independent Living from $5,950 a month.",
    engines: ["Google AI Overviews"], source: "A 2022 senior living directory listing",
    fix: "Current starting prices on /floor-plans with the date they were last confirmed. Directory update requested.", fixUrl: "/floor-plans", status: "monitoring", mins: 60 * 24 * 3,
  },
  {
    id: "w4", claim: "Doesn’t mention Lantern; suggests AB may not offer memory care.", truth: "Lantern Memory Care is a secured neighborhood with its own courtyard.",
    engines: ["Gemini"], source: "No memory care service listed on the Google Business Profile",
    fix: "/living/lantern-memory-care page with care details and pricing; “Memory care” added as a Google Business Profile service.", fixUrl: "/living/lantern-memory-care", status: "in progress", mins: 60 * 24 * 1,
  },
  {
    id: "w5", claim: "Gives the phone number as (916) 555-0181.", truth: "(916) 555-0140.",
    engines: ["ChatGPT"], source: "An out-of-date local business directory",
    fix: "Phone number in the site’s organization data on every page, and on the Contact page and Google Business Profile.", fixUrl: "/contact", status: "fixed", mins: 60 * 24 * 12,
  },
  {
    id: "w6", claim: "Says pets aren’t allowed.", truth: "Dogs and cats are welcome, with an outdoor pet area in the courtyard.",
    engines: ["Perplexity"], source: "A Reddit thread about a different Fairhollow community",
    fix: "FAQ entry “Are pets welcome?” and pets listed on Independent Living.", fixUrl: "/faq", status: "monitoring", mins: 60 * 24 * 4,
  },
];

/* ------------------------------------------------------------ apartments */

const planUnits: Record<string, { units: number; notice: number }> = {
  NA1: { units: 18, notice: 0 }, NB2B: { units: 46, notice: 1 }, NB1C: { units: 22, notice: 0 }, NC1: { units: 28, notice: 0 },
  NC4: { units: 14, notice: 1 }, NC6: { units: 8, notice: 0 }, AB2: { units: 12, notice: 0 },
  AZ1: { units: 8, notice: 0 }, AZ2: { units: 10, notice: 1 }, AZ3: { units: 3, notice: 0 }, AZ4: { units: 2, notice: 0 }, AZ5: { units: 1, notice: 0 },
};

const waitlist: Waiter[] = [
  { name: "Robert & Carol Engstrom", plan: "NC4", joinedDays: 212, deposit: true, note: "Wants a corner unit facing the courtyard" },
  { name: "Margaret Tillman", plan: "NB1C", joinedDays: 188, deposit: true },
  { name: "Dennis & Joyce Albers", plan: "NC4", joinedDays: 160, deposit: true },
  { name: "Phyllis Graham", plan: "NB1C", joinedDays: 141, deposit: true, note: "Moving from Calder; flexible on floor" },
  { name: "Henry Watanabe", plan: "AZ2", joinedDays: 96, deposit: true, note: "Wife currently at home with hospice support" },
  { name: "Sandra & Leo Pacheco", plan: "NC6", joinedDays: 90, deposit: true },
  { name: "Gail Thornton", plan: "NC4", joinedDays: 84, deposit: false },
  { name: "Arnold Becker", plan: "NB1C", joinedDays: 71, deposit: true },
  { name: "The Okonkwo family (for Grace)", plan: "AZ3", joinedDays: 58, deposit: true },
  { name: "Beverly Sloane", plan: "NC4", joinedDays: 45, deposit: false },
  { name: "Jim & Nancy Rourke", plan: "NC6", joinedDays: 38, deposit: false },
  { name: "Eleanor Vasquez", plan: "NB1C", joinedDays: 30, deposit: false },
  { name: "Carl Mendelsohn", plan: "NC4", joinedDays: 21, deposit: false },
  { name: "Ruth Ann Dobbs (for her father)", plan: "AZ2", joinedDays: 12, deposit: false },
  { name: "Sharon & Mike Feld", plan: "NC4", joinedDays: 6, deposit: false },
];

const alerts = [
  { plan: "NC6", text: "Two Bedroom Grand available", days: 7, sent: 14, opened: 11, tours: 2 },
  { plan: "AZ1", text: "Lantern Standard Private Room available", days: 15, sent: 9, opened: 8, tours: 1 },
  { plan: "NB2B", text: "One Bedroom Standard available (2)", days: 24, sent: 22, opened: 17, tours: 3 },
];

const moves = {
  ins: [
    { name: "Albert Duarte", plan: "NB2B", apt: "2219", days: -18 },
    { name: "Rita & Hal Sorensen", plan: "NC1", apt: "3302", days: -11 },
    { name: "Hazel Ivers", plan: "AZ2", apt: "Lantern 9", days: -4 },
    { name: "Marvin Keel", plan: "NA1", apt: "1121", days: 3 },
  ],
  outs: [
    { name: "Apartment 1310 (notice given)", plan: "NB2B", days: 18, note: "Moving closer to family in Oregon" },
    { name: "Apartment 3114 (notice given)", plan: "NC4", days: 26, note: "30-day notice received" },
  ],
};

/* ------------------------------------------------------------ tours */

const tours: Tour[] = [
  { days: 0, time: 600, who: "Patricia Lund", for: "herself", interest: "Independent Living", source: "Google search", lunch: true, note: "Widowed last year; loves bridge", with: "priya" },
  { days: 0, time: 840, who: "David & Mei Chen", for: "David’s mother", interest: "Assisted Living", source: "AI search (ChatGPT)", note: "Asked about medication management", with: "priya" },
  { days: 1, time: 660, who: "Frank Russo", for: "himself and his wife", interest: "Independent Living", source: "Referral: Harold Jensen", lunch: true, with: "priya" },
  { days: 2, time: 600, who: "The Andersons", for: "Joan Anderson", interest: "Independent Living", source: "Google Business Profile", lunch: true, note: "Wants to see NC6 Two Bedroom Grand", with: "priya" },
  { days: 2, time: 900, who: "Lisa Moreau", for: "her father", interest: "Lantern Memory Care", source: "Senior living referral service", note: "Meet Maribel; see the Lantern courtyard", with: "maribel" },
  { days: 3, time: 690, who: "Ray & Donna Whitcomb", for: "themselves", interest: "Independent Living", source: "Facebook", lunch: true, with: "priya" },
  { days: 5, time: 600, who: "Sylvia Grant", for: "her aunt", interest: "Assisted Living", source: "Website chat", with: "priya" },
  { days: 5, time: 780, who: "Ken Ishida", for: "himself", interest: "Independent Living", source: "Google search", lunch: true, note: "Retired engineer; ask about Tech Corner", with: "priya" },
  { days: 6, time: 630, who: "Marjorie Boyle", for: "herself", interest: "Independent Living", source: "Walk-in", with: "priya" },
  { days: 7, time: 600, who: "Ben & Alicia Ortiz", for: "Alicia’s parents", interest: "Independent Living", source: "AI search (Perplexity)", lunch: true, with: "priya" },
  { days: 8, time: 840, who: "Hannah Wells", for: "her mother", interest: "Lantern Memory Care", source: "Referral: physician", with: "maribel" },
  { days: 9, time: 660, who: "George Pappas", for: "himself", interest: "Independent Living", source: "Google search", lunch: true, with: "priya" },
];

const enquiries: Enquiry[] = [
  { name: "Linda Kessler", mins: 18, source: "Website chat", interest: "Independent Living", status: "New", msg: "Do you have a two-bedroom with a balcony available in January?" },
  { name: "Mark Delacroix", mins: 64, source: "AI search (ChatGPT)", interest: "Assisted Living", status: "New", msg: "My dad needs help with medications. Is that included or extra?" },
  { name: "Jennifer Soto", mins: 60 * 5, source: "Google Business Profile", interest: "Lantern Memory Care", status: "Contacted", msg: "Called about memory care pricing; sending Lantern brochure." },
  { name: "David & Mei Chen", mins: 60 * 22, source: "AI search (ChatGPT)", interest: "Assisted Living", status: "Tour booked", msg: "Tour today 2:00 pm." },
  { name: "Carol Brandt", mins: 60 * 30, source: "Senior living referral service", interest: "Independent Living", status: "Contacted", msg: "Comparing three communities; wants pet policy in writing." },
  { name: "Steve Hollister", mins: 60 * 47, source: "Google search", interest: "Independent Living", status: "Nurturing", msg: "Planning a move in spring; on the newsletter." },
  { name: "Anita Ramos", mins: 60 * 52, source: "Referral: Rosa Hernández", interest: "Independent Living", status: "Contacted", msg: "Rosa’s friend from church; prefers Spanish." },
];

const followUps = [
  { who: "Carol Brandt", what: "Email pet policy and NB2B floor plan", due: 0, overdue: false },
  { who: "Jennifer Soto", what: "Call back after she reads the Lantern brochure", due: 1, overdue: false },
  { who: "Walter & Sue Hanley", what: "Thank-you note and pricing sheet after Saturday tour", due: -1, overdue: true },
  { who: "Steve Hollister", what: "Invite to Dessert Soirée, Nov 21", due: 3, overdue: false },
];

const funnel = [
  { label: "Enquiries", value: 152 },
  { label: "Tours", value: 63 },
  { label: "Deposits", value: 15 },
  { label: "Move-ins", value: 11 },
];

/* ------------------------------------------------------------ scorecard */

const scoreRows: ScoreRow[] = [
  { k: "Website freshness score", now: 100, prev: 82, target: 95 },
  { k: "Families reached", now: 181, prev: 172, target: 175 },
  { k: "Message open rate", now: 81, prev: 74, target: 75, fmt: "pct" },
  { k: "Posts published", now: 61, prev: 38, target: 40 },
  { k: "Website visits", now: 6140, prev: 5210, target: 5500 },
  { k: "Enquiries", now: 58, prev: 44, target: 50 },
  { k: "Tours", now: 24, prev: 19, target: 22 },
  { k: "Deposits", now: 6, prev: 4, target: 5 },
  { k: "Move-ins", now: 4, prev: 3, target: 5 },
  { k: "Occupancy", now: 95.3, prev: 94.2, target: 95, fmt: "dec" },
  { k: "AI search visibility", now: 64, prev: 49, target: 60 },
  { k: "Google rating", now: 4.8, prev: 4.8, target: 4.7, fmt: "dec" },
];

const topPosts = [
  { title: "The Calder Valley Memory Walk", kind: "Story + 14 photos", reach: 1840, opens: 162, photo: "/img/friends-walking.jpg" },
  { title: "Juniper Hills apple orchards trip: 3 seats left", kind: "Event", reach: 1210, opens: 158, photo: "/img/vineyard.jpg" },
  { title: "Paint and Sip with Talia", kind: "Story", reach: 1105, opens: 140, photo: "/img/art-studio.jpg" },
  { title: "The November calendar is live", kind: "Calendar", reach: 980, opens: 151, photo: "/img/lobby.jpg" },
];

const highlights = [
  "Every family on the list heard from us at least once a week; 181 of 186 opened at least one message.",
  "Enquiries from AI search more than doubled (3 to 7) after the FAQ and live menu pages went up.",
  "“memory care Fairhollow” climbed from 9th to 4th on Google.",
  "Two Bedroom Grand (NC6) alert went to 14 people and produced 2 tours within a week.",
  "Calendar and menus were current every day of the month, with no gaps.",
];

/* ------------------------------------------------------------ copy */

const photoPresets = [
  {
    k: "pumpkins", src: "/img/pumpkins.jpg", label: "Pumpkin carving",
    title: "Pumpkin carving in the Courtyard",
    caption: "Our residents brought their best ideas to the Courtyard for pumpkin carving this afternoon. Vote for your favorite in the Lobby on Friday!",
    people: residentsInPhotos.pumpkins,
  },
  {
    k: "flag", src: "/img/flag.jpg", label: "Veterans Day ceremony",
    title: "Honoring our veterans",
    caption: "Thank you to every veteran who calls Alder Bend home. Families joined us for a ceremony in the theater and lunch in Millpond Café.",
    people: residentsInPhotos.flag,
  },
  {
    k: "marshmallows", src: "/img/marshmallows.jpg", label: "Roasted marshmallows",
    title: "Roasted marshmallows and camp stories",
    caption: "Golden-brown (and a few on fire) marshmallows around the fire table, with camp stories from residents who grew up in the Calder Valley foothills.",
    people: residentsInPhotos.marshmallows,
  },
];

export const staff: StaffData = {
  slug: "alder-bend",
  brand: { name: "Alder Bend", short: "AB", city: "Fairhollow", phone: "(916) 555-0140", domain: "alderbend.example", facebook: "facebook.com/AlderBend", hello: "Hello from Fairhollow!" },
  people: abPeople,
  roles: { approver: "renata", tours: "priya", lantern: "maribel", menus: "rafael", calendar: "nora", gbpReplies: "renata" },
  community,
  languages,
  visitScale: 1,
  weekKpis,
  enquirySources,
  enquirySourcesPrev,
  activity,
  freshness: [
    { title: "Activity calendar", detail: "Current through November 30 · published by Nora Castellano", mins: 60 * 190 },
    { title: "Today’s menus, all three restaurants", detail: "Published by Rafael Domingo", at: 370 },
    { title: "Last photo post", detail: "Happy Hour: Wes on Guitar · 12 photos", mins: 60 * 21 },
    { title: "Apartment availability", detail: "8 available · synced with the business office", mins: 118 },
    { title: "News", detail: "The Calder Valley Memory Walk · 14 photos", mins: 60 * 28 },
  ],
  sends: [...sends].sort((a, b) => a.mins - b.mins),
  templates,
  translations: [
    {
      lang: "Spanish", code: "es", n: 14,
      tpl: {
        event: "Nuevo en el calendario de AB: {event}. Pida un lugar para su ser querido desde su enlace personal en el mensaje de esta semana, o llame a la recepción al (916) 555-0140.",
        photos: "¡Ya están las fotos de {event}! Véalas en nuestro sitio web. Gracias por ser parte de la familia de AB.",
        reminder: "Recordatorio: {event}. Las familias siempre son bienvenidas.",
        change: "Cambio de horario: {event}. Disculpe las molestias. ¿Preguntas? Llame al (916) 555-0140.",
        lantern: "Noticias de Lantern, de parte de Maribel: {event}. Gracias por confiarnos a su ser querido.",
      },
    },
    {
      lang: "Russian", code: "ru", n: 6,
      tpl: {
        event: "Новое в календаре AB: {event}. Попросите место по вашей личной ссылке в письме этой недели или позвоните на ресепшн: (916) 555-0140.",
        photos: "Фотографии с мероприятия «{event}» уже опубликованы на нашем сайте.",
        reminder: "Напоминание: {event}. Семьи всегда желанные гости.",
        change: "Изменение в расписании: {event}. Вопросы? Звоните (916) 555-0140.",
        lantern: "Новости Lantern от Марибель: {event}. Спасибо, что доверяете нам.",
      },
    },
  ],
  alsoTranslated: "Tagalog (4), Vietnamese (2) and Chinese (2). Families see the English underneath.",
  composerEvent: "Bus Trip to the Veterans Day Parade, Wed, Nov 11 at 7:30 am from the Lobby",
  threads,
  suggestions: {
    t1: "¡Claro que sí, María! Las familias son bienvenidas y el disfraz es opcional. ¡Nos encantará ver a Rosa como Frida!",
    t2: "Hi Tom! Dorothy is first on the waitlist for the orchard trip. If a seat opens I’ll text you both right away. The trip is free; lunch at the orchard is about $15.",
  },
  contacts,
  importNote: "Last import: Oct 3, from the business office system, 268 contacts",
  residentNames,
  lanternNames,
  publish: {
    eventTitle: "Larkspur Cellars",
    eventDate: "2026-11-20",
    event: {
      title: "Bus Trip: Wine Tasting at Larkspur Cellars & Lunch",
      titleEs: "Excursión: cata de vinos en Larkspur Cellars y almuerzo",
      room: "Lobby",
      desc: "A tasting of Larkspur Cellars’ Tempranillo and estate whites in the Juniper Hills, then lunch at the winery.",
      photo: "/img/vineyard.jpg",
    },
    menu: {
      title: "Thanksgiving dinner in the Juniper Room",
      titleEs: "Cena de Acción de Gracias en el Juniper Room",
      date: "2026-11-26",
      time: "11:00",
      room: "Juniper Dining Room",
      cap: "",
      desc: "Herb-roasted turkey with sage pan gravy, honey-glazed ham or wild mushroom Wellington, with all the trimmings and pumpkin, pecan or apple desserts. 11:00 am–3:00 pm, by reservation.",
      photo: "/img/turkey.jpg",
    },
    photo: {
      title: "Pumpkin carving in the Courtyard",
      titleEs: "Tallado de calabazas en el patio",
      time: "14:00",
      room: "Courtyard",
      cap: "",
      desc: "Our residents brought their best ideas to the Courtyard this afternoon. Vote for your favorite in the Lobby on Friday!",
      photo: "/img/pumpkins.jpg",
    },
    pdf: {
      title: "Healthy Happy Hour with Devin & Priya!",
      titleEs: "¡Hora feliz saludable con Devin y Priya!",
      date: "2026-11-18",
      time: "15:00",
      room: "The Perch",
      cap: "",
      desc: "Music, nutritious snacks and choreography with Devin and Priya. Mocktail recipes to take home.",
      photo: "/img/cocktail.jpg",
      file: "healthy-happy-hour-nov-18.pdf",
    },
    reserveEn: "Reserve with Simone at (916) 555-0140 ext. 160.",
    reserveEs: "Reserve con Simone al (916) 555-0140 ext. 160.",
    flyerAsk: "Nora Castellano, ext. 140",
    flyerPost: "Opal’s team will post it by the elevators and in the Lobby.",
    otherLangs: "Spanish, Russian, Tagalog, Vietnamese or Chinese",
    translated: 28,
    lanternTranslated: 2,
    lanternEmails: 19,
    digestExtra: { title: "Thanksgiving dinner", when: "Thu, Nov 26 · Juniper Room · by reservation", photo: "/img/turkey.jpg" },
  },
  photoPresets,
  menus: {
    sub: "Daily specials and soups for all three restaurants. Publishing updates the website dining page, the weekly family digest and the large-print menu cards for the Juniper Room, Millpond Café and The Perch.",
  },
  approvals,
  approvedRecently,
  approvalRules: [
    { what: "Resident photos on the website, in family texts or the digest", who: "Renata Holloway · checks photo consent is on file" },
    { what: "Pricing and availability", who: "Renata Holloway · prepared by Leonard Fisk" },
    { what: "Holiday and special-event menus", who: "Renata Holloway · prepared by Rafael Domingo" },
    { what: "Everyday events, menus and family texts", who: "Publish straight away, no approval needed" },
  ],
  rankings,
  searchWeekly,
  seo: { avgPos: 3.4, avgPosDelta: -1.6, ctrDelta: 0.3, pagesIndexed: 66 },
  gbp,
  reviewsRecent,
  topPages,
  vitals,
  engines,
  geoTrend,
  answers,
  wrongFacts,
  planUnits,
  occupancyDelta: 1.1,
  waitlist,
  alerts,
  moves,
  tours,
  tourLunch: "Juniper Room",
  enquiries,
  followUps,
  funnel,
  firstReply: { value: "38 min", delta: -41 },
  scoreRows,
  topPosts,
  highlights,
};
