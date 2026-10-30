// Staff back end: Bruceville Point's operational records (families, prospects, messages, approvals,
// search and occupancy figures). Invented working data for the demo, at Bruceville Point's own scale:
// newer than PCL, 117 Independent Living / Assisted Living apartments plus 22 in Harbor.
//
// The staff are Bruceville Point's published team (src/data/communities/bruceville-point/site.ts `team`).
// Families, residents and prospects are invented. Anything quoted as fact about the community (prices,
// address, opening date, licence, restaurants) is taken from its published data. No review texts are
// invented for it: the Google review list stays empty until the real profile is connected.
// Times are stored as offsets from now / today so the screens always read as current.
import { bpPeople } from "./people";
import { contactMaker, type Activity, type Answer, type Approval, type Contact, type Engine, type Enquiry, type Ranking, type ScoreRow, type Send, type StaffData, type Thread, type Tour, type Waiter, type WrongFact } from "./shared";

/* ------------------------------------------------------------- community */

const community = {
  residents: 171,
  harborResidents: 21,
  apartments: 139,
  occupied: 132,
  families: 155, // households opted in to updates
  harborFamilies: 20,
  contacts: 229,
  smsReachable: 151,
  emailReachable: 143,
};

const languages = [
  { k: "English", n: 128 },
  { k: "Spanish", n: 11 },
  { k: "Chinese", n: 6 },
  { k: "Tagalog", n: 5 },
  { k: "Punjabi", n: 3 },
  { k: "Vietnamese", n: 2 },
];

/* ------------------------------------------------------------ dashboard */

const weekKpis = {
  familiesReached: 149,
  postsThisWeek: 12,
  postsLastWeek: 9,
  messagesSent: 912,
  deliveredRate: 98.9,
  openRate: 78,
  openRateLast: 75,
  toursBooked: 9,
  toursLast: 6,
};

const enquirySources = [
  { label: "Google search", value: 19 },
  { label: "Google Business Profile", value: 9 },
  { label: "A Place for Mom", value: 10 },
  { label: "AI search (ChatGPT and others)", value: 5 },
  { label: "Website chat", value: 7 },
  { label: "Referrals from residents and families", value: 4 },
  { label: "Facebook", value: 4 },
  { label: "Walk-in", value: 3 },
];
const enquirySourcesPrev = [16, 9, 8, 3, 5, 3, 3, 2];

const activity: Activity[] = [
  { who: "timothy", mins: 28, text: "posted “Halloween Happy Hour: Costumes Encouraged” to the website, 155 families and Facebook" },
  { who: "tina", mins: 85, text: "sent “Mindfulness & Mocktails with Tina” flyer for approval", tone: "wait" },
  { who: "jaime", mins: 150, text: "booked a tour for the Gill family, Monday at 11:00 am, with lunch in Stone Lakes Cafe", tone: "info" },
  { who: "eric", mins: 240, text: "published today’s menus for the Cypress Room, Stone Lakes Cafe and the Bistro" },
  { who: "amrita", mins: 60 * 20, text: "texted 20 Harbor families about Harbor Pumpkin Painting" },
  { who: "monica", mins: 60 * 22, text: "posted 9 photos from “Pumpkin Carving around the Fire Pit”" },
  { who: "breah", mins: 60 * 25, text: "submitted a pricing correction for the One Bedroom Standard (B6)", tone: "wait" },
  { who: "marianne", mins: 60 * 30, text: "approved “Paint and Sip: October” story and photos" },
  { who: "betty", mins: 60 * 44, text: "printed 50 large-print November calendars for the front desk" },
];

/* ------------------------------------------------------------ messages */

const sends: Send[] = [
  { id: "s1", title: "Halloween Happy Hour on Friday: costumes encouraged", audience: "All families", channels: "Text + email", by: "timothy", mins: 28, sent: 155, delivered: 153, opened: 112, replied: 5, lang: 27 },
  { id: "s2", title: "Harbor Pumpkin Painting tomorrow at 10:30 am", audience: "Harbor families", channels: "Text", by: "amrita", mins: 60 * 20, sent: 20, delivered: 20, opened: 18, replied: 2, lang: 3 },
  { id: "s3", title: "Your week at Bruceville Point", audience: "All families", channels: "Email digest", by: "timothy", mins: 60 * 66, sent: 143, delivered: 141, opened: 104, replied: 1, lang: 25 },
  { id: "s4", title: "Apple Hill Orchards trip: 2 seats left", audience: "All families", channels: "Text + email", by: "monica", mins: 60 * 118, sent: 155, delivered: 154, opened: 129, replied: 7, lang: 27 },
  { id: "s5", title: "Paint and Sip: October photos are up", audience: "All families", channels: "Text + email", by: "monica", mins: 60 * 200, sent: 155, delivered: 153, opened: 131, replied: 11, lang: 27 },
  { id: "s6", title: "The November calendar is live", audience: "All families", channels: "Text + email", by: "timothy", mins: 60 * 180, sent: 155, delivered: 154, opened: 122, replied: 3, lang: 27 },
];

const templates = [
  { k: "event", label: "New event", text: "New on the BP calendar: {event}. Reply YES to save a seat for your loved one, or call the front desk at (916) 226-5300." },
  { k: "photos", label: "Photos are up", text: "Photos from {event} are up! See them on our website and Facebook. Thank you for being part of the Bruceville Point family." },
  { k: "reminder", label: "Reminder", text: "Reminder: {event}. Families are always welcome to join us." },
  { k: "change", label: "Schedule change", text: "Schedule change: {event}. We’re sorry for any inconvenience. Questions? Call (916) 226-5300." },
  { k: "harbor", label: "Harbor update", text: "Harbor update from Amrita: {event}. Thank you for sharing your loved one with us." },
];

const threads: Thread[] = [
  {
    id: "t1", from: "Lucía Ramírez", relation: "Daughter", resident: "Elena Ramírez", apt: "B214", lang: "Spanish", unread: true, mins: 19,
    subject: "Halloween Happy Hour",
    msgs: [
      { me: true, text: "Halloween Happy Hour on Friday, 3:00–4:00 pm in the Bistro: live music, a costume parade and prizes. Costumes encouraged!", original: "Hora Feliz de Halloween el viernes, de 3:00 a 4:00 pm en el Bistro: música en vivo, desfile de disfraces y premios. ¡Los disfraces son bienvenidos!", mins: 28 },
      { who: "Lucía", text: "Can my kids come to the happy hour with their grandma? They already have their costumes ready.", original: "¿Pueden mis hijos ir a la hora feliz con su abuela? Ya tienen sus disfraces listos.", mins: 19 },
    ],
  },
  {
    id: "t2", from: "Greg Halvorsen", relation: "Son", resident: "Marion Halvorsen", apt: "A305", lang: "English", unread: true, mins: 70,
    subject: "Apple Hill waitlist",
    msgs: [
      { me: true, text: "Apple Hill Orchards trip on Saturday at 9:30 am from the Lobby: 2 seats left. Reply YES to save a seat.", mins: 60 * 118 },
      { who: "Greg", text: "Mom just missed out on Apple Hill. Is she on the waitlist? She’s been talking about the apple pie all week.", mins: 70 },
    ],
  },
  {
    id: "t3", from: "Wei Chen", relation: "Son", resident: "Mei-Ling Chen", apt: "C118", lang: "Chinese", unread: false, mins: 60 * 21,
    subject: "Photos",
    msgs: [
      { me: true, text: "9 photos from Pumpkin Carving around the Fire Pit are up on our website and Facebook.", original: "“火坑旁雕南瓜”活动的 9 张照片已发布在我们的网站和 Facebook 上。", mins: 60 * 22 },
      { who: "Wei", text: "Thank you for the photos. My mother looks very happy. We will visit on Sunday for the violin duo.", original: "谢谢你们的照片。我母亲看起来很开心。我们周日会来听小提琴二重奏。", mins: 60 * 21 },
      { me: true, text: "Wonderful! The violin duo plays in Stone Lakes Cafe at 3:00 pm on Sunday. We’ll save you seats next to Mei-Ling.", original: "太好了！小提琴二重奏周日下午 3:00 在 Stone Lakes Cafe 演出。我们会在 Mei-Ling 旁边为您留座。", mins: 60 * 20 },
    ],
  },
  {
    id: "t4", from: "Rachel Okafor", relation: "Daughter", resident: "Samuel Okafor", apt: "B309", lang: "English", unread: false, mins: 60 * 48,
    subject: "Thanksgiving",
    msgs: [
      { who: "Rachel", text: "Can families join Thanksgiving dinner? There will be three of us plus Dad.", mins: 60 * 50 },
      { me: true, text: "Yes! Thanksgiving dinner is in the Cypress Room from 11:00 am to 3:00 pm, by reservation. I’ve passed your note to Danyale Liberati Shaw, who takes dining reservations and will call you to book a table for four.", mins: 60 * 48 },
    ],
  },
  {
    id: "t5", from: "Diane Foster", relation: "Daughter", resident: "Walter Foster", apt: "Harbor 6", lang: "English", unread: false, mins: 60 * 200,
    subject: "Harbor Outing",
    msgs: [
      { me: true, text: "Photos from this week’s Harbor Outing are up. Thank you to every family who came along!", mins: 60 * 205 },
      { who: "Diane", text: "Dad grinning at the cranes made my week. Thank you, Amrita and team.", mins: 60 * 200 },
    ],
  },
];

/* ------------------------------------------------------------ families */

const c = contactMaker(["478", "683", "684", "685", "686", "714", "691"]);
const contacts: Contact[] = [
  c("Elena Ramírez", "B214", "Lucía Ramírez", "Daughter", "SMS", "Spanish"),
  c("Marion Halvorsen", "A305", "Greg Halvorsen", "Son", "SMS + email"),
  c("Mei-Ling Chen", "C118", "Wei Chen", "Son", "SMS + email", "Chinese"),
  c("Samuel Okafor", "B309", "Rachel Okafor", "Daughter", "Email", "English", "011"),
  c("Walter Foster", "Harbor 6", "Diane Foster", "Daughter", "SMS + email", "English", "111", true),
  c("Dolores Avila", "A118", "Ramón Avila", "Son", "SMS", "Spanish"),
  c("Kenneth Larkin", "C210", "Shelly Larkin", "Wife", "SMS"),
  c("Rosalind Petersen", "B105", "Erik Petersen", "Son", "Email", "English", "011"),
  c("Gurdev Sandhu", "A221", "Harpreet Sandhu", "Daughter", "SMS + email", "Punjabi"),
  c("Milagros Santos", "B312", "Joy Santos-Cruz", "Daughter", "SMS", "Tagalog"),
  c("Eugene Whitley", "Harbor 2", "Pam Whitley", "Wife", "SMS", "English", "111", true),
  c("Beatrice Lowell", "A302", "Ann Lowell", "Daughter", "SMS + email", "English", "110"),
  c("Lien Tran", "C304", "Minh Tran", "Son", "SMS", "Vietnamese"),
  c("Charles Whitmore", "B201", "David Whitmore", "Son", "Email", "English", "011"),
  c("Yolanda Fuentes", "Harbor 9", "Marco Fuentes", "Son", "SMS", "Spanish", "111", true),
  c("Shirley Novak", "A107", "Kim Novak-Hale", "Niece", "SMS + email"),
  c("Arturo Bautista", "B220", "Liza Bautista", "Daughter", "SMS + email", "Tagalog"),
  c("Phyllis Grant", "C112", "Robert Grant", "Son", "SMS"),
  c("Harold Ng", "A214", "Cindy Ng", "Daughter", "Email", "Chinese", "011"),
  c("Lorraine Duffy", "Harbor 14", "Sean Duffy", "Son", "SMS + email", "English", "110", true),
  c("Vernon Lacey", "B118", "Tonya Lacey", "Daughter", "SMS + email"),
  c("Catalina Ortiz", "C215", "Sofia Ortiz", "Granddaughter", "SMS", "Spanish"),
  c("Dale Hutchins", "A310", "Megan Hutchins", "Daughter", "SMS + email"),
  c("Ruth Abernathy", "B302", "Paul Abernathy", "Son", "Email", "English", "011"),
  c("Jasbir Gill", "C301", "Navneet Gill", "Son", "SMS", "Punjabi"),
  c("Irma Kessler", "Harbor 17", "Joan Kessler", "Daughter", "SMS", "English", "111", true),
  c("Leonard Pace", "A205", "Carla Pace", "Daughter", "SMS + email"),
  c("Winifred Hale", "B108", "Thomas Hale", "Son", "SMS + email", "English", "100"),
  c("Rosario Delgado", "C207", "Ana Delgado", "Daughter", "SMS", "Spanish"),
  c("Frank Ishikawa", "Harbor 12", "Amy Ishikawa", "Daughter", "SMS + email", "English", "111", true),
];

/** Residents who appear in photos. Photo consent comes from the family contact (or the resident). */
const residentsInPhotos = {
  pumpkins: [
    { name: "Marion Halvorsen", consent: true },
    { name: "Elena Ramírez", consent: true },
    { name: "Kenneth Larkin", consent: true },
    { name: "Lorraine Duffy", consent: false },
  ],
  flag: [
    { name: "Kenneth Larkin", consent: true },
    { name: "Charles Whitmore", consent: true },
    { name: "Eugene Whitley", consent: true },
  ],
  marshmallows: [
    { name: "Mei-Ling Chen", consent: true },
    { name: "Samuel Okafor", consent: true },
    { name: "Beatrice Lowell", consent: true },
    { name: "Dale Hutchins", consent: true },
  ],
};

/** Resident names for RSVP lists. */
const residentNames = [
  "Marion Halvorsen", "Elena Ramírez", "Mei-Ling Chen", "Samuel Okafor", "Dolores Avila", "Kenneth Larkin", "Rosalind Petersen",
  "Gurdev Sandhu", "Milagros Santos", "Beatrice Lowell", "Lien Tran", "Charles Whitmore", "Shirley Novak", "Arturo Bautista", "Phyllis Grant",
  "Harold Ng", "Vernon Lacey", "Catalina Ortiz", "Dale Hutchins", "Ruth Abernathy", "Jasbir Gill", "Leonard Pace", "Winifred Hale",
  "Rosario Delgado", "Gloria Mendez", "Harold Bergstrom", "June Bergstrom", "Patricia Doyle", "Raymond Cole", "Myrtle Vance", "Otis Freeman",
  "Constance Reyes", "Albert Lindahl", "Evangeline Cho", "Norman Pruett", "Hattie Simmons", "Russell Akana", "Theresa Kovac", "Bernard Lowe",
  "Ida Marquez", "Clifford Haynes", "Joyce Tanaka", "Warren Ellis", "Agnes Fairbanks", "Herman Ruiz", "Lucille Barnett", "Stanley Dhillon",
  "Opal Whitaker", "Frederick Moss", "Mabel Quintero",
];
const harborNames = ["Walter Foster", "Eugene Whitley", "Yolanda Fuentes", "Lorraine Duffy", "Irma Kessler", "Frank Ishikawa", "Edith Carrow", "Leroy Banks", "Verna Holt", "Manuel Ochoa", "Dorothy Ames", "Clara Becker"];

/* ------------------------------------------------------------ approvals */

const approvals: Approval[] = [
  {
    id: "a1", by: "tina", mins: 85, kind: "Flyer (PDF)", title: "Mindfulness & Mocktails with Tina",
    detail: "Wednesday, November 18 · 3:00 pm · The Bistro. A short mindfulness session, then nutritious snacks and mocktails.",
    photo: "/img/cocktail.jpg", channels: ["Website calendar", "Family text (155)", "Large-print flyer", "Facebook"],
    note: "Mocktail recipes on the back.",
  },
  {
    id: "a2", by: "timothy", mins: 60 * 3, kind: "News post with 8 photos", title: "Honoring our veterans",
    detail: "Veterans Day plans: the Flag Ceremony in the Courtyard at 9:30 am, Veterans’ Lunch in Stone Lakes Cafe, and the Veterans’ & Families Only Ceremony in the Theatre at 2:00 pm.",
    photo: "/img/flag.jpg", channels: ["Website news", "Family email digest", "Facebook", "Google Business Profile"],
    note: "All 8 residents pictured have photo consent on file.",
  },
  {
    id: "a3", by: "breah", mins: 60 * 25, kind: "Pricing change", title: "One Bedroom Standard (B6) starting rate",
    detail: "The pricing page headline says one-bedrooms start at $5,250; the B6 floor plan says $5,235. Match the headline to the floor plan.",
    channels: ["Website pricing", "Google Business Profile"], diff: ["From $5,250 a month", "From $5,235 a month"],
  },
  {
    id: "a4", by: "eric", mins: 60 * 31, kind: "Menu", title: "Thanksgiving dinner menu, Thursday, November 26",
    detail: "Cypress Room, 11:00 am–3:00 pm by reservation. Herb-roasted turkey, honey-glazed ham, wild mushroom Wellington, and pumpkin pie, pecan pie and apple crisp.",
    photo: "/img/turkey.jpg", channels: ["Website dining", "Digital signage", "Family email digest"],
  },
  {
    id: "a5", by: "monica", mins: 60 * 40, kind: "Facebook post with 5 photos", title: "Bocce Tournament: Round One sign-ups",
    detail: "Five photos from last week’s practice on the courtyard court, inviting residents to sign up for Round One on Thursday, November 5.",
    photo: "/img/bocce.jpg", channels: ["Facebook", "Website news"],
    note: "All 5 residents pictured have photo consent on file.",
  },
];

const approvedRecently = [
  { title: "Paint and Sip: October story and 11 photos", by: "monica", mins: 60 * 30, ok: true },
  { title: "November activity calendar (287 events)", by: "timothy", mins: 60 * 180, ok: true },
  { title: "Axe throwing: news post", by: "tina", mins: 60 * 24 * 12, ok: true },
  { title: "Facebook post: pumpkin carving contest", by: "monica", mins: 60 * 46, ok: false, note: "Changes requested: one resident without photo consent. Re-sent with photo cropped." },
];

/* ------------------------------------------------------------ SEO */

const rankings: Ranking[] = [
  { q: "senior living Elk Grove", pos: 3, change: 2, volume: 720, url: "/", hist: [9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3] },
  { q: "assisted living Elk Grove", pos: 4, change: 3, volume: 590, url: "/living/assisted-living", hist: [10, 10, 9, 9, 8, 8, 7, 7, 6, 5, 5, 4] },
  { q: "memory care Elk Grove", pos: 5, change: 3, volume: 480, url: "/living/harbor-memory-care", hist: [14, 13, 13, 12, 11, 10, 9, 8, 7, 6, 6, 5] },
  { q: "independent living Elk Grove", pos: 4, change: 3, volume: 320, url: "/living/independent-living", hist: [11, 11, 10, 9, 9, 8, 7, 7, 6, 5, 5, 4] },
  { q: "senior apartments Elk Grove", pos: 6, change: 2, volume: 410, url: "/floor-plans", hist: [12, 12, 11, 11, 10, 9, 9, 8, 8, 7, 7, 6] },
  { q: "retirement community Elk Grove CA", pos: 3, change: 1, volume: 260, url: "/", hist: [6, 6, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3] },
  { q: "luxury senior living Sacramento", pos: 11, change: 3, volume: 210, url: "/", hist: [22, 21, 20, 19, 18, 17, 15, 14, 13, 12, 12, 11] },
  { q: "senior living events Elk Grove", pos: 2, change: 2, volume: 70, url: "/calendar", hist: [12, 11, 10, 9, 8, 6, 5, 4, 3, 3, 2, 2] },
  { q: "Bruceville Point", pos: 1, change: 0, volume: 880, url: "/", hist: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

const searchWeekly = {
  clicks: [301, 318, 322, 340, 352, 371, 388, 402, 425, 441, 468, 497],
  impressions: [11800, 12100, 12350, 12900, 13400, 13900, 14500, 15200, 15900, 16600, 17500, 18600],
};

const gbp = { views: 7420, viewsPrev: 6510, calls: 128, callsPrev: 103, directions: 211, directionsPrev: 176, clicks: 288, clicksPrev: 231, rating: 4.7, reviews: 96, newReviews: 5 };

const topPages = [
  { url: "/calendar", title: "Activity Calendar", clicks: 398, change: 36 },
  { url: "/floor-plans", title: "Floor Plans & Pricing", clicks: 352, change: 22 },
  { url: "/dining", title: "Dining: today’s menus", clicks: 297, change: 58 },
  { url: "/living/harbor-memory-care", title: "Harbor Memory Care", clicks: 171, change: 31 },
  { url: "/living/assisted-living", title: "Assisted Living Services", clicks: 149, change: 14 },
  { url: "/faq", title: "FAQs", clicks: 88, change: 71 },
];

const vitals = [
  { k: "Largest Contentful Paint", v: "1.8 s", note: "Good is under 2.5 s" },
  { k: "Interaction to Next Paint", v: "104 ms", note: "Good is under 200 ms" },
  { k: "Cumulative Layout Shift", v: "0.03", note: "Good is under 0.1" },
];

/* ------------------------------------------------------------ GEO */

const engines: { k: Engine; short: string; score: number; prev: number; color: string }[] = [
  { k: "ChatGPT", short: "ChatGPT", score: 64, prev: 44, color: "#2f7a62" },
  { k: "Google AI Overviews", short: "AI Overviews", score: 61, prev: 45, color: "#4c87a2" },
  { k: "Perplexity", short: "Perplexity", score: 58, prev: 41, color: "#425968" },
  { k: "Gemini", short: "Gemini", score: 47, prev: 36, color: "#6b5aa6" },
];
const geoTrend = [26, 27, 29, 31, 34, 37, 40, 43, 46, 50, 53, 57];

const answers: Answer[] = [
  {
    engine: "ChatGPT", prompt: "best senior living in Elk Grove", accuracy: "accurate", recommended: true, position: 1, mins: 60 * 5,
    text: "Bruceville Point (9730 Backer Ranch Road) is one of the newest options in Elk Grove: a Tenfold Senior Living community, opened in 2021, offering Independent Living, Assisted Living Services delivered in your own apartment, and Harbor Memory Care. It has three restaurants (the Cypress Room, Stone Lakes Cafe and the Bistro) and more than 25 fitness classes a week.",
    competitors: ["a large senior community off Elk Grove Boulevard", "an assisted living community in Laguna"], cites: "brucevillepoint.com",
  },
  {
    engine: "Google AI Overviews", prompt: "best senior living in Elk Grove", accuracy: "accurate", recommended: true, position: 2, mins: 60 * 5,
    text: "Options include Bruceville Point, a luxury community just off Bruceville Road with studio to two-bedroom apartments up to 1,184 sq ft and no second-person fee, and several smaller residential care homes in the area.",
    competitors: ["a national-chain community in south Sacramento", "smaller residential care homes"], cites: "brucevillepoint.com/floor-plans",
  },
  {
    engine: "Perplexity", prompt: "memory care Elk Grove", accuracy: "accurate", recommended: true, position: 1, mins: 60 * 8,
    text: "Bruceville Point’s Harbor is a secured memory care neighborhood with its own courtyard, raised planters and a putting green. Studios with a private bath start at $8,715 a month. RCFE License #342701040.",
    competitors: ["a memory care community in south Sacramento", "a memory care wing at a Laguna community"], cites: "brucevillepoint.com/living/harbor-memory-care",
  },
  {
    engine: "Gemini", prompt: "memory care Elk Grove", accuracy: "partly", recommended: true, position: 3, mins: 60 * 8,
    text: "Options include memory care communities in Elk Grove and south Sacramento. Bruceville Point offers independent and assisted living; contact them about memory care.",
    competitors: ["a memory care community in south Sacramento", "a memory care wing at a Laguna community"],
  },
  {
    engine: "ChatGPT", prompt: "does Bruceville Point charge a second person fee", accuracy: "accurate", recommended: true, mins: 60 * 28,
    text: "No. Bruceville Point does not charge a second-person fee, which the community says saves couples about $10,000 a year.",
    competitors: [], cites: "brucevillepoint.com/faq",
  },
  {
    engine: "Gemini", prompt: "does Bruceville Point charge a second person fee", accuracy: "wrong", recommended: false, mins: 60 * 28,
    text: "Most communities in the Sacramento area charge a second-person fee, and Bruceville Point likely adds a monthly fee for a second occupant.",
    competitors: [],
  },
  {
    engine: "Perplexity", prompt: "is Bruceville Point open", accuracy: "partly", recommended: true, mins: 60 * 30,
    text: "Bruceville Point is a new Tenfold Senior Living community in Elk Grove that was scheduled to open in 2021. Contact the leasing office for move-in dates.",
    competitors: [], cites: "a 2020 pre-opening press release",
  },
  {
    engine: "Google AI Overviews", prompt: "independent living Elk Grove", accuracy: "accurate", recommended: true, position: 3, mins: 60 * 50,
    text: "Bruceville Point in Elk Grove offers Independent Living from $5,100 a month, with full kitchens, a washer and dryer in every apartment, and Assisted Living Services available in any apartment.",
    competitors: ["two independent living communities in Elk Grove", "a 55+ apartment complex in Laguna"], cites: "brucevillepoint.com/living/independent-living",
  },
];

const wrongFacts: WrongFact[] = [
  {
    id: "w1", claim: "Says Bruceville Point is still under construction and taking deposits ahead of a 2021 opening.", truth: "Bruceville Point opened in June 2021. Tours are by appointment.",
    engines: ["Perplexity", "ChatGPT"], source: "A 2020 pre-opening press release and leasing-office listing",
    fix: "The About page states the opening date, and the old pre-leasing page redirects to /floor-plans. Directory update requested.", fixUrl: "/about", status: "fixed", mins: 60 * 24 * 5,
  },
  {
    id: "w2", claim: "Says there is a second-person fee for couples.", truth: "There is no second-person fee, saving couples about $10,000 a year.",
    engines: ["Gemini"], source: "General answer about Sacramento-area pricing, not about Bruceville Point",
    fix: "FAQ entry “Is there a second-person fee?” with FAQ structured data, and the line added to every floor plan.", fixUrl: "/faq", status: "in progress", mins: 60 * 24 * 2,
  },
  {
    id: "w3", claim: "Doesn’t mention Harbor; suggests Bruceville Point may not offer memory care.", truth: "Harbor Memory Care is a secured neighborhood with its own courtyard and putting green.",
    engines: ["Gemini"], source: "No memory care service listed on the Google Business Profile",
    fix: "/living/harbor-memory-care page with care details and pricing; “Memory care” added as a Google Business Profile service.", fixUrl: "/living/harbor-memory-care", status: "in progress", mins: 60 * 24 * 1,
  },
  {
    id: "w4", claim: "Gives the phone number of a different Elk Grove community.", truth: "(916) 226-5300.",
    engines: ["ChatGPT"], source: "An out-of-date local business directory",
    fix: "Phone number in the site’s organization data on every page, and on the Contact page and Google Business Profile.", fixUrl: "/contact", status: "fixed", mins: 60 * 24 * 10,
  },
  {
    id: "w5", claim: "Says residents who need assisted living move to a separate wing.", truth: "Assisted Living Services come to every apartment, so residents never have to move.",
    engines: ["Google AI Overviews", "Perplexity"], source: "A generic senior living directory description",
    fix: "The Assisted Living page explains that services come to your apartment, with FAQ structured data.", fixUrl: "/living/assisted-living", status: "monitoring", mins: 60 * 24 * 4,
  },
  {
    id: "w6", claim: "Says pets aren’t allowed.", truth: "Dogs and cats are welcome, with an exercise area for pets in the courtyard.",
    engines: ["Perplexity"], source: "A rental listing for a nearby apartment complex",
    fix: "FAQ entry “Are pets welcome?” and pets listed on Independent Living.", fixUrl: "/faq", status: "monitoring", mins: 60 * 24 * 3,
  },
];

/* ------------------------------------------------------------ apartments */

// 117 Independent Living / Assisted Living apartments and 22 Harbor apartments, by floor plan.
const planUnits: Record<string, { units: number; notice: number }> = {
  A1: { units: 10, notice: 0 }, B6: { units: 16, notice: 0 }, B1: { units: 14, notice: 1 }, B2: { units: 12, notice: 0 },
  B5: { units: 10, notice: 0 }, B7: { units: 9, notice: 0 }, B3: { units: 10, notice: 0 }, B4: { units: 6, notice: 0 },
  C1: { units: 14, notice: 0 }, C3: { units: 6, notice: 1 }, C2: { units: 10, notice: 0 },
  MC1: { units: 8, notice: 0 }, MC2: { units: 6, notice: 0 }, MC6: { units: 2, notice: 0 }, MC4: { units: 4, notice: 0 }, MC3: { units: 2, notice: 0 },
};

const waitlist: Waiter[] = [
  { name: "Gerald & Ann Whitcomb", plan: "C2", joinedDays: 230, deposit: true, note: "Want the two-bath plan with a courtyard view" },
  { name: "Lillian Sato", plan: "B7", joinedDays: 196, deposit: true, note: "Needs the den for her sewing room" },
  { name: "Robert & Nancy Amador", plan: "C2", joinedDays: 171, deposit: true },
  { name: "Doris Kaplan", plan: "B4", joinedDays: 150, deposit: true, note: "Prefers a tower corner on an upper floor" },
  { name: "The Bhatia family (for Kamla)", plan: "MC2", joinedDays: 104, deposit: true, note: "Currently in respite care nearby" },
  { name: "Earl Whitfield", plan: "B7", joinedDays: 97, deposit: true },
  { name: "Margaret & Joe Lindqvist", plan: "C3", joinedDays: 88, deposit: true },
  { name: "Carmen Villanueva", plan: "B1", joinedDays: 75, deposit: false, note: "Moving from Galt; flexible on floor" },
  { name: "Howard Pena", plan: "C2", joinedDays: 63, deposit: true },
  { name: "Sylvia Marsh (for her mother)", plan: "MC3", joinedDays: 52, deposit: true },
  { name: "Thomas & Rita Garvey", plan: "B4", joinedDays: 44, deposit: false },
  { name: "Elaine Fong", plan: "B5", joinedDays: 37, deposit: false },
  { name: "Walt & Bonnie Kerrigan", plan: "C3", joinedDays: 29, deposit: false },
  { name: "Juanita Morales", plan: "B1", joinedDays: 19, deposit: false },
  { name: "Arthur Penhall", plan: "B7", joinedDays: 11, deposit: false },
  { name: "Gail & Vince Romero", plan: "C2", joinedDays: 4, deposit: false },
];

const alerts = [
  { plan: "C1", text: "Two Bedroom Deluxe available", days: 6, sent: 11, opened: 9, tours: 2 },
  { plan: "MC1", text: "Harbor Studio w/ Private Bath available", days: 12, sent: 7, opened: 7, tours: 1 },
  { plan: "B6", text: "One Bedroom Standard available", days: 20, sent: 18, opened: 14, tours: 3 },
];

const moves = {
  ins: [
    { name: "Harold & June Bergstrom", plan: "C1", apt: "C204", days: -21 },
    { name: "Gloria Mendez", plan: "B6", apt: "A112", days: -13 },
    { name: "Frank Ishikawa", plan: "MC2", apt: "Harbor 12", days: -6 },
    { name: "Patricia Doyle", plan: "A1", apt: "A318", days: 2 },
    { name: "Raymond Cole", plan: "B2", apt: "B207", days: 9 },
  ],
  outs: [
    { name: "Apartment B115 (notice given)", plan: "B1", days: 16, note: "Moving in with her daughter in Reno" },
    { name: "Apartment C302 (notice given)", plan: "C3", days: 27, note: "30-day notice received" },
  ],
};

/* ------------------------------------------------------------ tours */

const tours: Tour[] = [
  { days: 0, time: 630, who: "Beverly Nakamura", for: "herself", interest: "Independent Living", source: "Google search", lunch: true, note: "Recently widowed; keen gardener", with: "jaime" },
  { days: 0, time: 870, who: "Andre & Kim Dubois", for: "Andre’s father", interest: "Assisted Living", source: "A Place for Mom", note: "Asked how care works in his own apartment", with: "jaime" },
  { days: 1, time: 600, who: "Lorraine Pike", for: "herself", interest: "Independent Living", source: "Referral: Marion Halvorsen", lunch: true, with: "jaime" },
  { days: 3, time: 660, who: "The Gill family", for: "Jasbir’s brother", interest: "Independent Living", source: "Referral: Jasbir Gill", lunch: true, note: "Prefers Punjabi; Navneet will translate", with: "jaime" },
  { days: 3, time: 900, who: "Tom Reilly", for: "his wife", interest: "Harbor Memory Care", source: "Google Business Profile", note: "Meet Amrita; see the Harbor Courtyard", with: "amrita" },
  { days: 4, time: 690, who: "Maureen & Phil Easton", for: "themselves", interest: "Independent Living", source: "Facebook", lunch: true, note: "Want to see the C2 two-bath plan", with: "jaime" },
  { days: 4, time: 840, who: "Kevin Huang", for: "his mother", interest: "Assisted Living", source: "AI search (ChatGPT)", with: "jaime" },
  { days: 5, time: 600, who: "Delia Fortunato", for: "herself", interest: "Independent Living", source: "Website chat", lunch: true, with: "jaime" },
  { days: 6, time: 630, who: "Hank Brennan", for: "himself", interest: "Independent Living", source: "Walk-in", note: "Retired pilot; mention the Aerospace Museum trip", with: "jaime" },
  { days: 7, time: 600, who: "Sandra & Luis Ochoa", for: "Sandra’s parents", interest: "Independent Living", source: "Google search", lunch: true, with: "jaime" },
  { days: 8, time: 840, who: "Pamela Grier", for: "her father", interest: "Harbor Memory Care", source: "Referral: physician", with: "amrita" },
  { days: 9, time: 660, who: "Victor Alvarez", for: "himself", interest: "Independent Living", source: "A Place for Mom", lunch: true, with: "jaime" },
  { days: 10, time: 600, who: "Nora & Dean Fiske", for: "themselves", interest: "Independent Living", source: "AI search (Perplexity)", lunch: true, with: "jaime" },
];

const enquiries: Enquiry[] = [
  { name: "Judith Marlowe", mins: 24, source: "Website chat", interest: "Independent Living", status: "New", msg: "Is a one-bedroom with a den available after the holidays?" },
  { name: "Samir Patel", mins: 58, source: "AI search (ChatGPT)", interest: "Assisted Living", status: "New", msg: "Can my mother get help with bathing and medications without moving apartments?" },
  { name: "Connie Brandt", mins: 60 * 4, source: "A Place for Mom", interest: "Independent Living", status: "New", msg: "Comparing communities in Elk Grove; wants a pricing sheet." },
  { name: "Tom Reilly", mins: 60 * 20, source: "Google Business Profile", interest: "Harbor Memory Care", status: "Tour booked", msg: "Tour on Monday at 3:00 pm with Amrita." },
  { name: "Marisol Vega", mins: 60 * 27, source: "Google search", interest: "Harbor Memory Care", status: "Contacted", msg: "Called about Harbor availability; sending the Harbor brochure." },
  { name: "Kevin Huang", mins: 60 * 33, source: "AI search (ChatGPT)", interest: "Assisted Living", status: "Tour booked", msg: "Tour on Tuesday at 2:00 pm." },
  { name: "Arlene Fitch", mins: 60 * 49, source: "Facebook", interest: "Independent Living", status: "Nurturing", msg: "Planning a move next summer; on the newsletter." },
  { name: "Bill Tanaka", mins: 60 * 55, source: "Referral: Harold Ng", interest: "Independent Living", status: "Contacted", msg: "Harold’s friend from the senior center; wants to see the Bistro." },
];

const followUps = [
  { who: "Connie Brandt", what: "Email the pricing sheet and the B6 floor plan", due: 0, overdue: false },
  { who: "Marisol Vega", what: "Call back after she reads the Harbor brochure", due: 1, overdue: false },
  { who: "Carl & Edna Mayhew", what: "Thank-you note and pricing sheet after Saturday’s tour", due: -1, overdue: true },
  { who: "Arlene Fitch", what: "Invite to the Dessert Soirée, Nov 21", due: 4, overdue: false },
];

const funnel = [
  { label: "Enquiries", value: 171 },
  { label: "Tours", value: 72 },
  { label: "Deposits", value: 18 },
  { label: "Move-ins", value: 13 },
];

/* ------------------------------------------------------------ scorecard */

const scoreRows: ScoreRow[] = [
  { k: "Website freshness score", now: 100, prev: 88, target: 95 },
  { k: "Families reached", now: 149, prev: 141, target: 145 },
  { k: "Message open rate", now: 78, prev: 75, target: 75, fmt: "pct" },
  { k: "Posts published", now: 52, prev: 41, target: 40 },
  { k: "Website visits", now: 5480, prev: 4790, target: 5000 },
  { k: "Enquiries", now: 61, prev: 49, target: 55 },
  { k: "Tours", now: 27, prev: 21, target: 25 },
  { k: "Deposits", now: 7, prev: 5, target: 6 },
  { k: "Move-ins", now: 5, prev: 4, target: 6 },
  { k: "Occupancy", now: 95.0, prev: 94.2, target: 95, fmt: "dec" },
  { k: "AI search visibility", now: 57, prev: 46, target: 55 },
  { k: "Google rating", now: 4.7, prev: 4.7, target: 4.7, fmt: "dec" },
];

const topPosts = [
  { title: "Paint and Sip: October", kind: "Story + 11 photos", reach: 1520, opens: 131, photo: "/img/art-studio.jpg" },
  { title: "Apple Hill Orchards trip: 2 seats left", kind: "Event", reach: 1090, opens: 129, photo: "/img/vineyard.jpg" },
  { title: "Bocce on the courtyard court", kind: "Story", reach: 980, opens: 118, photo: "/img/courtyard-bocce.jpg" },
  { title: "The November calendar is live", kind: "Calendar", reach: 860, opens: 122, photo: "/img/lobby.jpg" },
];

const highlights = [
  "Every family on the list heard from us at least once a week; 149 of 155 opened at least one message.",
  "Enquiries from AI search grew from 3 to 5 after the FAQ went up and the out-of-date opening date was corrected.",
  "“memory care Elk Grove” climbed from 8th to 5th on Google.",
  "The Two Bedroom Deluxe (C1) alert went to 11 people and produced 2 tours within a week.",
  "Calendar and menus were current every day of the month, with no gaps.",
];

/* ------------------------------------------------------------ copy */

const photoPresets = [
  {
    k: "pumpkins", src: "/img/pumpkins.jpg", label: "Pumpkin carving",
    title: "Pumpkin carving around the Fire Pit",
    caption: "Our residents brought their best ideas to the fire pit in the Courtyard for pumpkin carving. Vote for your favorite on Facebook on Friday!",
    people: residentsInPhotos.pumpkins,
  },
  {
    k: "flag", src: "/img/flag.jpg", label: "Veterans Day ceremony",
    title: "Honoring our veterans",
    caption: "Thank you to every veteran who calls Bruceville Point home. Families joined us for the flag ceremony in the Courtyard and lunch in Stone Lakes Cafe.",
    people: residentsInPhotos.flag,
  },
  {
    k: "marshmallows", src: "/img/marshmallows.jpg", label: "S’mores at the fire pit",
    title: "S’mores and stories at the fire pit",
    caption: "Golden-brown (and a few on fire) marshmallows around the courtyard fire pit, with stories from residents who grew up along the Delta.",
    people: residentsInPhotos.marshmallows,
  },
];

export const staff: StaffData = {
  slug: "bruceville-point",
  brand: { name: "Bruceville Point", short: "BP", city: "Elk Grove", phone: "(916) 226-5300", domain: "brucevillepoint.com", facebook: "facebook.com/BrucevillePoint", hello: "Hello from Elk Grove!" },
  people: bpPeople,
  roles: { approver: "marianne", tours: "jaime", harbor: "amrita", menus: "eric", calendar: "timothy", gbpReplies: "marianne" },
  community,
  languages,
  visitScale: 0.9,
  weekKpis,
  enquirySources,
  enquirySourcesPrev,
  activity,
  freshness: [
    { title: "Activity calendar", detail: "Current through November 30 · published by Timothy Smith", mins: 60 * 180 },
    { title: "Today’s menus, all three restaurants", detail: "Published by Eric Auclair", at: 380 },
    { title: "Last photo post", detail: "Pumpkin Carving around the Fire Pit · 9 photos", mins: 60 * 22 },
    { title: "Apartment availability", detail: "7 available · synced with the business office", mins: 95 },
    { title: "News", detail: "Paint and Sip: October · 11 photos", mins: 60 * 30 },
  ],
  sends: [...sends].sort((a, b) => a.mins - b.mins),
  templates,
  translations: [
    {
      lang: "Spanish", code: "es", n: 11,
      tpl: {
        event: "Nuevo en el calendario de BP: {event}. Responda SÍ para reservar un lugar para su ser querido, o llame a la recepción al (916) 226-5300.",
        photos: "¡Ya están las fotos de {event}! Véalas en nuestro sitio web y en Facebook. Gracias por ser parte de la familia de Bruceville Point.",
        reminder: "Recordatorio: {event}. Las familias siempre son bienvenidas.",
        change: "Cambio de horario: {event}. Disculpe las molestias. ¿Preguntas? Llame al (916) 226-5300.",
        harbor: "Noticias de Harbor, de parte de Amrita: {event}. Gracias por confiarnos a su ser querido.",
      },
    },
    {
      lang: "Chinese", code: "zh", n: 6,
      tpl: {
        event: "Bruceville Point 活动日历新增：{event}。回复 YES 为您的家人预留座位，或致电前台 (916) 226-5300。",
        photos: "“{event}”的照片已发布！请在我们的网站和 Facebook 上查看。感谢您成为 Bruceville Point 大家庭的一员。",
        reminder: "提醒：{event}。欢迎家人随时参加。",
        change: "日程变更：{event}。给您带来不便，敬请谅解。如有疑问，请致电 (916) 226-5300。",
        harbor: "来自 Amrita 的 Harbor 消息：{event}。感谢您把家人托付给我们。",
      },
    },
  ],
  alsoTranslated: "Tagalog (5), Punjabi (3) and Vietnamese (2). Families see the English underneath.",
  composerEvent: "Veterans Day Flag Ceremony, Wed, Nov 11 at 9:30 am in the Courtyard",
  threads,
  suggestions: {
    t1: "¡Claro que sí, Lucía! Los nietos son bienvenidos, con o sin disfraz. ¡A Elena le va a encantar!",
    t2: "Hi Greg! Marion is first on the waitlist. If a seat opens I’ll text you both right away.",
  },
  contacts,
  importNote: "Last import: Oct 6, from the business office (Yardi), 226 contacts",
  residentNames,
  harborNames,
  publish: {
    eventTitle: "Wine Tasting in Lodi",
    eventDate: "2026-11-20",
    event: {
      title: "Bus Trip: Wine Tasting in Lodi & Lunch",
      titleEs: "Excursión: cata de vinos en Lodi y almuerzo",
      room: "Lobby",
      desc: "A tasting among Lodi’s old-vine Zinfandel, then lunch. The bus leaves from the Lobby.",
      photo: "/img/vineyard.jpg",
    },
    menu: {
      title: "Thanksgiving dinner in the Cypress Room",
      titleEs: "Cena de Acción de Gracias en el Cypress Room",
      date: "2026-11-26",
      time: "11:00",
      room: "Cypress Room",
      cap: "",
      desc: "Herb-roasted turkey with sage pan gravy, honey-glazed ham or wild mushroom Wellington, with all the trimmings and pumpkin pie, pecan pie or apple crisp. 11:00 am–3:00 pm, by reservation.",
      photo: "/img/turkey.jpg",
    },
    photo: {
      title: "Pumpkin carving around the Fire Pit",
      titleEs: "Tallado de calabazas junto a la fogata",
      time: "14:00",
      room: "Courtyard",
      cap: "",
      desc: "Our residents brought their best ideas to the fire pit this afternoon. Vote for your favorite on Facebook on Friday!",
      photo: "/img/pumpkins.jpg",
    },
    pdf: {
      title: "Mindfulness & Mocktails with Tina",
      titleEs: "Atención plena y mocktails con Tina",
      date: "2026-11-18",
      time: "15:00",
      room: "The Bistro",
      cap: "",
      desc: "A short mindfulness session with Tina, then nutritious snacks and mocktails. Recipes to take home.",
      photo: "/img/cocktail.jpg",
      file: "mindfulness-mocktails-nov-18.pdf",
    },
    reserveEn: "Reserve with Danyale at (916) 226-5300.",
    reserveEs: "Reserve con Danyale al (916) 226-5300.",
    flyerAsk: "Timothy Smith",
    flyerPost: "Betty’s team will post it by the elevators and in the Lobby.",
    otherLangs: "Spanish, Chinese, Tagalog, Punjabi or Vietnamese",
    translated: 27,
    harborTranslated: 3,
    harborEmails: 18,
    digestExtra: { title: "Thanksgiving dinner", when: "Thu, Nov 26 · Cypress Room · by reservation", photo: "/img/turkey.jpg" },
  },
  photoPresets,
  menus: {
    sub: "Daily specials and soups for all three restaurants. Publishing updates the website dining page and the digital signage in the Lobby, Stone Lakes Cafe and the Bistro.",
    screens: ["Lobby screen", "Stone Lakes Cafe screen", "The Bistro screen"],
  },
  approvals,
  approvedRecently,
  approvalRules: [
    { what: "Resident photos on Facebook or the website", who: "Marianne Richardson · checks photo consent is on file" },
    { what: "Pricing and availability", who: "Marianne Richardson · prepared by Breah Taylor" },
    { what: "Holiday and special-event menus", who: "Marianne Richardson · prepared by Eric Auclair" },
    { what: "Everyday events, menus and family texts", who: "Publish straight away, no approval needed" },
  ],
  rankings,
  searchWeekly,
  seo: { avgPos: 4.6, avgPosDelta: -1.2, ctrDelta: 0.2, pagesIndexed: 64 },
  gbp,
  reviewsRecent: [],
  topPages,
  vitals,
  engines,
  geoTrend,
  answers,
  wrongFacts,
  planUnits,
  occupancyDelta: 0.8,
  waitlist,
  alerts,
  moves,
  tours,
  tourLunch: "Stone Lakes Cafe",
  enquiries,
  followUps,
  funnel,
  firstReply: { value: "44 min", delta: -33 },
  scoreRows,
  topPosts,
  highlights,
};
