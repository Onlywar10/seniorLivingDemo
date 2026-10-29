// Data behind the staff system: the organisation's six communities, their reach, search and
// AI-search visibility, publishing, messaging, families, tours, waitlists and monthly results.

import { communities } from "./group";
import { addDays, dayShort, longDate, rel, today, mondayOf, shortDate } from "@/lib/clock";

export const user = { name: "Catherine Hale", role: "VP, Sales & Marketing", initials: "CH", email: "chale@larkmoorliving.com" };

export type Slug = (typeof communities)[number]["slug"];

export interface CommunityStats {
  slug: string;
  short: string;
  families: number;
  familiesReached: number;
  posts: number;
  sent: number;
  openRate: number;
  replies: number;
  tours: number;
  toursPrev: number;
  enquiries: number;
  visits: number;
  visitsPrev: number;
  calendarUpdated: string;
  menuUpdated: string;
  fresh: "fresh" | "due" | "stale";
  freshNote: string;
  ed: string;
  visitsTrend: number[];
  geo: number;
  seoPos: number;
  reviews: number;
  rating: number;
  occupancy: number;
  moveIns: number;
  responseMins: number;
}

const n = (slug: string) => communities.find((c) => c.slug === slug)!;

export const stats: CommunityStats[] = [
  { slug: "larkmoor-house", short: "Larkmoor", families: 231, familiesReached: 214, posts: 14, sent: 642, openRate: 81, replies: 37, tours: 9, toursPrev: 6, enquiries: 31, visits: 4820, visitsPrev: 4110, calendarUpdated: "Today 6:55 am", menuUpdated: "Mon 7:10 am", fresh: "fresh", freshNote: "Calendar and menus current", ed: n("larkmoor-house").director, visitsTrend: [2950, 3120, 3080, 3360, 3410, 3620, 3580, 3890, 4010, 4110, 4390, 4820], geo: 78, seoPos: 2.1, reviews: 64, rating: 4.8, occupancy: 88, moveIns: 3, responseMins: 22 },
  { slug: "ashby-grove", short: "Ashby Grove", families: 362, familiesReached: 331, posts: 17, sent: 988, openRate: 77, replies: 52, tours: 12, toursPrev: 10, enquiries: 44, visits: 6240, visitsPrev: 5880, calendarUpdated: "Today 7:20 am", menuUpdated: "Mon 6:40 am", fresh: "fresh", freshNote: "Calendar and menus current", ed: n("ashby-grove").director, visitsTrend: [4410, 4620, 4580, 4900, 5020, 5180, 5240, 5410, 5600, 5880, 6010, 6240], geo: 71, seoPos: 2.6, reviews: 91, rating: 4.7, occupancy: 91, moveIns: 4, responseMins: 35 },
  { slug: "willow-bend", short: "Willow Bend", families: 188, familiesReached: 172, posts: 11, sent: 503, openRate: 79, replies: 24, tours: 7, toursPrev: 7, enquiries: 26, visits: 3390, visitsPrev: 3260, calendarUpdated: "Yesterday 4:12 pm", menuUpdated: "Mon 8:02 am", fresh: "fresh", freshNote: "Calendar and menus current", ed: n("willow-bend").director, visitsTrend: [2410, 2500, 2610, 2580, 2700, 2840, 2910, 3020, 3100, 3260, 3300, 3390], geo: 64, seoPos: 3.4, reviews: 47, rating: 4.6, occupancy: 89, moveIns: 2, responseMins: 41 },
  { slug: "harbor-view", short: "Harbor View", families: 119, familiesReached: 96, posts: 6, sent: 288, openRate: 72, replies: 11, tours: 3, toursPrev: 5, enquiries: 12, visits: 1710, visitsPrev: 1840, calendarUpdated: "8 days ago", menuUpdated: "8 days ago", fresh: "stale", freshNote: "Calendar and menus 8 days old", ed: n("harbor-view").director, visitsTrend: [1620, 1700, 1690, 1810, 1780, 1860, 1900, 1880, 1920, 1840, 1760, 1710], geo: 42, seoPos: 6.8, reviews: 22, rating: 4.4, occupancy: 84, moveIns: 1, responseMins: 96 },
  { slug: "maple-court", short: "Maple Court", families: 247, familiesReached: 229, posts: 13, sent: 701, openRate: 80, replies: 33, tours: 10, toursPrev: 8, enquiries: 35, visits: 5120, visitsPrev: 4760, calendarUpdated: "Today 8:05 am", menuUpdated: "Fri 3:30 pm", fresh: "due", freshNote: "Next week’s menu due Friday", ed: n("maple-court").director, visitsTrend: [3600, 3720, 3810, 3900, 4020, 4210, 4300, 4420, 4580, 4760, 4900, 5120], geo: 69, seoPos: 2.9, reviews: 58, rating: 4.7, occupancy: 92, moveIns: 3, responseMins: 28 },
  { slug: "fernhill", short: "Fernhill", families: 204, familiesReached: 190, posts: 12, sent: 566, openRate: 76, replies: 29, tours: 8, toursPrev: 9, enquiries: 29, visits: 4280, visitsPrev: 4140, calendarUpdated: "Today 7:45 am", menuUpdated: "Mon 7:30 am", fresh: "fresh", freshNote: "Calendar and menus current", ed: n("fernhill").director, visitsTrend: [3010, 3150, 3290, 3420, 3510, 3600, 3720, 3810, 3960, 4140, 4220, 4280], geo: 66, seoPos: 3.1, reviews: 39, rating: 4.8, occupancy: 90, moveIns: 2, responseMins: 33 },
];

export const nameOf = (slug: string) => communities.find((c) => c.slug === slug)?.name ?? slug;
export const townOf = (slug: string) => communities.find((c) => c.slug === slug)?.city ?? "";

export function scope(c?: string) {
  const list = c ? stats.filter((s) => s.slug === c) : stats;
  const sum = (k: keyof CommunityStats) => list.reduce((t, s) => t + (s[k] as number), 0);
  const avg = (k: keyof CommunityStats) => Math.round((sum(k) / list.length) * 10) / 10;
  return {
    list,
    label: c ? nameOf(c) : "All communities",
    families: sum("families"),
    familiesReached: sum("familiesReached"),
    posts: sum("posts"),
    sent: sum("sent"),
    openRate: Math.round(avg("openRate")),
    replies: sum("replies"),
    tours: sum("tours"),
    toursPrev: sum("toursPrev"),
    enquiries: sum("enquiries"),
    visits: sum("visits"),
    visitsPrev: sum("visitsPrev"),
    geo: Math.round(avg("geo")),
    seoPos: avg("seoPos"),
    visitsTrend: list[0].visitsTrend.map((_, i) => list.reduce((t, s) => t + s.visitsTrend[i], 0)),
  };
}

/** Week labels for the last twelve weeks, oldest first. */
export const weekTicks = () => Array.from({ length: 12 }, (_, i) => shortDate(addDays(mondayOf(today()), -7 * (11 - i))));

export const sources = [
  { k: "Website (direct and search)", share: 0.34 },
  { k: "Google Business Profile", share: 0.21 },
  { k: "Phone", share: 0.16 },
  { k: "AI search (ChatGPT, Gemini, Perplexity)", share: 0.09 },
  { k: "Referral agency", share: 0.11 },
  { k: "Hospital and physician referral", share: 0.06 },
  { k: "Facebook", share: 0.03 },
];

export function feed() {
  return [
    { when: "6:55 am", who: "Tom Delacroix", where: "Larkmoor House", what: "published this week’s activity calendar", tone: "ok" },
    { when: "7:20 am", who: "Dana Whitley", where: "Ashby Grove", what: "published the daily calendar and 6 photos", tone: "ok" },
    { when: "8:05 am", who: "Marcus Lee", where: "Maple Court", what: "submitted a family-night flyer for approval", tone: "wait" },
    { when: "9:40 am", who: "Grace Mbeki", where: "Larkmoor House", what: "posted a photo from garden club from her phone", tone: "ok" },
    { when: "11:20 am", who: "Marianne Okafor", where: "Larkmoor House", what: "sent an urgent notice: visiting ends at 6 pm today (214 families)", tone: "urgent" },
    { when: "12:15 pm", who: "System", where: "Harbor View", what: "reminder sent: calendar and menus are 8 days old", tone: "warn" },
  ];
}

/* ---------------------------------------------------------------- SEO */

export function keywords(c?: string) {
  const town = c ? townOf(c) : "Millbrook Bend";
  const base = [
    { q: `assisted living ${town}`, pos: 1, prev: 3, vol: 880, clicks: 412, impr: 3920 },
    { q: `memory care ${town}`, pos: 2, prev: 2, vol: 590, clicks: 238, impr: 2710 },
    { q: "memory care near me", pos: 3, prev: 7, vol: 4400, clicks: 391, impr: 9840 },
    { q: "assisted living near me", pos: 4, prev: 6, vol: 6600, clicks: 344, impr: 12200 },
    { q: `senior living ${town}`, pos: 2, prev: 4, vol: 480, clicks: 171, impr: 1980 },
    { q: `${c ? nameOf(c) : "Larkmoor House"} reviews`, pos: 1, prev: 1, vol: 210, clicks: 156, impr: 640 },
    { q: `assisted living cost ${town}`, pos: 5, prev: 11, vol: 320, clicks: 58, impr: 1460 },
    { q: "respite care for elderly near me", pos: 8, prev: 14, vol: 1300, clicks: 41, impr: 2280 },
  ];
  if (c === "harbor-view") return base.map((k) => ({ ...k, pos: k.pos + 4, prev: k.prev + 2, clicks: Math.round(k.clicks * 0.3) }));
  return base;
}

export const seoTrend = { clicks: [1820, 1900, 1960, 2100, 2180, 2260, 2410, 2520, 2600, 2740, 2890, 3020], impressions: [41200, 42800, 43900, 45100, 47600, 48800, 50100, 52300, 53800, 55900, 57400, 59600] };

export const gbp = { views: 18420, viewsPrev: 15980, calls: 612, callsPrev: 540, directions: 488, directionsPrev: 431, website: 1290, websitePrev: 1105, rating: 4.7, reviews: 321, newReviews: 14 };

export const vitals = [
  { k: "Performance (mobile)", v: "96", good: true },
  { k: "Performance (desktop)", v: "99", good: true },
  { k: "Accessibility", v: "100", good: true },
  { k: "Largest contentful paint", v: "1.4 s", good: true },
  { k: "Interaction to next paint", v: "96 ms", good: true },
  { k: "Layout shift", v: "0.01", good: true },
];

export const attention = [
  { where: "Harbor View", page: "Activities", issue: "Calendar not updated for 8 days. Google shows last week’s events in search.", fix: "Remind Colleen Byrne to publish", sev: "high" },
  { where: "Harbor View", page: "Dining", issue: "Menu is 8 days old.", fix: "Copy this week’s cycle from the menu library", sev: "high" },
  { where: "Fernhill", page: "Apartments", issue: "3 photos have no description for screen readers or Google Images.", fix: "Add alt text (suggested for you)", sev: "med" },
  { where: "Maple Court", page: "Home", issue: "Page title is 74 characters; Google cuts it off at 60.", fix: "Use the suggested title", sev: "low" },
  { where: "Willow Bend", page: "Care team", issue: "Two staff members left last month but are still listed.", fix: "Review with HR", sev: "med" },
];

/* ---------------------------------------------------------------- GEO (AI search) */

export type Engine = "ChatGPT" | "Google AI Overviews" | "Perplexity" | "Gemini";
export const engines: Engine[] = ["ChatGPT", "Google AI Overviews", "Perplexity", "Gemini"];

export const geoTrend: Record<Engine, number[]> = {
  ChatGPT: [38, 41, 44, 47, 52, 55, 58, 61, 66, 70, 73, 77],
  "Google AI Overviews": [46, 47, 51, 54, 58, 60, 64, 67, 69, 72, 75, 79],
  Perplexity: [29, 33, 35, 40, 43, 47, 52, 55, 57, 61, 64, 68],
  Gemini: [33, 35, 38, 40, 43, 46, 49, 53, 56, 58, 62, 65],
};

export interface GeoAnswer {
  engine: Engine;
  prompt: string;
  answer: string;
  accurate: "yes" | "partly" | "no";
  current: boolean;
  mentioned: boolean;
  recommended: boolean;
  cites: string[];
  checked: string;
}

export function geoAnswers(c?: string): GeoAnswer[] {
  const name = c ? nameOf(c) : "Larkmoor House";
  const town = c ? townOf(c) : "Millbrook Bend";
  return [
    { engine: "ChatGPT", prompt: `What is the best memory care in ${town}?`, answer: `${name} is frequently recommended for memory care in ${town}. It has a secure second-floor memory care household with 22 suites, a walled terrace garden and a published activity calendar that families say is genuinely updated daily. Its most recent state inspection (March 2026) found no deficiencies.`, accurate: "yes", current: true, mentioned: true, recommended: true, cites: ["larkmoorhouse.com/activities", "larkmoorhouse.com/inspection-record"], checked: "Today 5:00 am" },
    { engine: "Google AI Overviews", prompt: `assisted living ${town} cost`, answer: `Assisted living in ${town} typically costs $4,500 to $6,800 a month. At ${name}, studios start at $4,650 a month, with care added by level from $650. Rates include three meals a day, housekeeping and activities.`, accurate: "yes", current: true, mentioned: true, recommended: false, cites: ["larkmoorhouse.com/apartments", "genworth.com"], checked: "Today 5:00 am" },
    { engine: "Perplexity", prompt: `Does ${name} offer memory care?`, answer: `According to a 2021 directory listing, ${name} offers assisted living only and refers residents with dementia to other communities.`, accurate: "no", current: false, mentioned: true, recommended: false, cites: ["seniorhomes-directory.com (2021)"], checked: "Today 5:00 am" },
    { engine: "Gemini", prompt: `What are visiting hours at ${name}?`, answer: `Visiting hours at ${name} are 10 am to 4 pm by appointment, with visitors asked to check in at the front desk.`, accurate: "no", current: false, mentioned: true, recommended: false, cites: ["Facebook post, June 2021"], checked: "Today 5:00 am" },
    { engine: "ChatGPT", prompt: `Can my mother bring her cat to assisted living in ${town}?`, answer: `${name} allows cats and dogs under 25 lb with a refundable deposit, and has two resident cats on the first floor.`, accurate: "yes", current: true, mentioned: true, recommended: true, cites: ["larkmoorhouse.com/handbook"], checked: "Yesterday 5:00 am" },
    { engine: "Perplexity", prompt: `senior living with good food ${town}`, answer: `${name} publishes its weekly menu online, with vegetarian, low-sodium and soft-diet options marked on every item, and a Sunday roast that residents rate highly.`, accurate: "yes", current: true, mentioned: true, recommended: true, cites: ["larkmoorhouse.com/dining"], checked: "Yesterday 5:00 am" },
    { engine: "Google AI Overviews", prompt: "memory care near me", answer: `Nearby options include ${name}, Willow Bend and Rosewood Manor. ${name} lists a 1:5 caregiver ratio by day in memory care.`, accurate: "yes", current: true, mentioned: true, recommended: true, cites: ["larkmoorhouse.com/team", "medicare.gov"], checked: "Yesterday 5:00 am" },
    { engine: "Gemini", prompt: `How much is a studio at ${name}?`, answer: `Studios at ${name} were advertised at around $3,900 a month.`, accurate: "partly", current: false, mentioned: true, recommended: false, cites: ["caring-listings.net (2023)"], checked: "Yesterday 5:00 am" },
  ];
}

export function wrongFacts(c?: string) {
  const name = c ? nameOf(c) : "Larkmoor House";
  return [
    { engine: "Perplexity", claim: `${name} does not offer memory care`, truth: "Memory care household since 2014, state endorsed", source: "seniorhomes-directory.com listing from 2021", fix: "Request a correction on the directory listing (pre-written for you) and add a memory care FAQ with structured data to the website.", status: "Fix ready" },
    { engine: "Gemini", claim: "Visiting is 10 am – 4 pm by appointment", truth: "Any day, 8 am – 8 pm, no appointment", source: "A June 2021 Facebook post", fix: "Publish the visiting hours as a pinned post on Facebook and Google Business Profile; the handbook page already has them in machine-readable form.", status: "Fix ready" },
    { engine: "Gemini", claim: "Studios cost about $3,900 a month", truth: "From $4,650 a month, effective 1 July 2026", source: "caring-listings.net, 2023", fix: "Send the current rate sheet to the listing site and add a dated ‘Starting at’ price to the apartments page (done).", status: "Submitted" },
    { engine: "ChatGPT", claim: "The Executive Director is Linda Marsh", truth: "Marianne Okafor since 2017", source: "An old press release", fix: "Add an ‘About our leadership’ section with dated bios; publish a news post on Marianne’s ninth year.", status: "Fixed, confirmed " + dayShort(rel(-3)) },
  ];
}

/* ---------------------------------------------------------------- approvals */

export function approvals() {
  return [
    { id: "a1", title: "Family night flyer", kind: "Flyer", where: "Maple Court", who: "Marcus Lee", role: "Life Enrichment Director", when: "18 min ago", note: "For Thursday. Print run of 60.", photo: "/photos/dining-group.jpg" },
    { id: "a2", title: "Next month’s menu cycle", kind: "Menu", where: "Larkmoor House", who: "Luis Barrientos", role: "Dining Services Director", when: "1 hr ago", note: "Four weeks. New: Friday fish tacos stay; adds a soft-diet column.", photo: "/photos/dining-three.jpg" },
    { id: "a3", title: "New raised beds in the courtyard", kind: "News post", where: "Larkmoor House", who: "Grace Mbeki", role: "Resident Care Coordinator", when: "2 hr ago", note: "Posted from her phone. 3 photos, consent on file for all residents shown.", photo: "/photos/gardening.jpg" },
    { id: "a4", title: "Rate schedule from 1 January", kind: "Rates", where: "Ashby Grove", who: "Dana Whitley", role: "Business Office Manager", when: "Yesterday", note: "3.5% increase on apartment rates; care levels unchanged. Families get 60 days’ notice.", photo: "/photos/couch.jpg" },
    { id: "a5", title: "Welcome our new night nurse", kind: "Staff profile", where: "Fernhill", who: "Elena Marsh", role: "Executive Director", when: "Yesterday", note: "Photo and bio supplied by HR.", photo: "/photos/staff-priya.jpg" },
  ];
}

/* ---------------------------------------------------------------- messaging */

export function sends() {
  return [
    { id: "s1", title: "Visiting ends at 6 pm today", kind: "Urgent", to: "All families · Larkmoor House", when: `Today 11:20 am`, sent: 214, delivered: 212, opened: 198, replied: 9, langs: "English 171 · Spanish 31 · Vietnamese 8 · Chinese 4" },
    { id: "s2", title: "This week at Larkmoor: calendar and menus", kind: "Digest", to: "All families · Larkmoor House", when: `${dayShort(mondayOf(today()))} 7:00 am`, sent: 214, delivered: 213, opened: 171, replied: 6, langs: "English 171 · Spanish 31 · Vietnamese 8 · Chinese 4" },
    { id: "s3", title: "Family night: supper and the Larkmoor Singers", kind: "Event", to: "All families · Larkmoor House", when: dayShort(rel(-3)), sent: 214, delivered: 211, opened: 166, replied: 41, langs: "English 171 · Spanish 31 · Vietnamese 8 · Chinese 4" },
    { id: "s4", title: "Second floor: care-plan meetings next week", kind: "Wing", to: "Memory care families · Larkmoor House", when: dayShort(rel(-5)), sent: 38, delivered: 38, opened: 35, replied: 14, langs: "English 30 · Spanish 8" },
    { id: "s5", title: "Flu clinic for families", kind: "News", to: "All communities", when: dayShort(rel(-6)), sent: 1302, delivered: 1287, opened: 1001, replied: 22, langs: "8 languages" },
  ];
}

export function replies() {
  return [
    { id: "r1", from: "María González", resident: "Rosa González, apt 208", lang: "Spanish", original: "Gracias por avisar. ¿Puedo venir a las 4 para traerle la cena a mi mamá?", translated: "Thanks for letting us know. Can I come at 4 to bring my mom dinner?", when: "11:48 am", about: "Visiting ends at 6 pm today", unread: true },
    { id: "r2", from: "Tom Becker", resident: "Harold Becker, apt 117", lang: "English", original: "Will the bus still run to Dad’s appointment tomorrow if the wind is bad?", translated: "", when: "11:36 am", about: "Visiting ends at 6 pm today", unread: true },
    { id: "r3", from: "Linh Tran", resident: "Mai Tran, apt 214", lang: "Vietnamese", original: "Cảm ơn. Tôi sẽ đến vào thứ Năm cho buổi tối gia đình, hai người.", translated: "Thank you. I will come on Thursday for family night, two people.", when: "Yesterday", about: "Family night", unread: false },
    { id: "r4", from: "Karen Whitfield", resident: "Margaret Whitfield, apt 132", lang: "English", original: "Mum loved the photos from garden club! Could you send me the one of her with the tulips?", translated: "", when: "Yesterday", about: "This week at Larkmoor", unread: false },
    { id: "r5", from: "Wei Chen", resident: "Li Chen, apt 221", lang: "Chinese", original: "请问下周的护理计划会议可以电话参加吗？", translated: "Can I join next week’s care-plan meeting by phone?", when: dayShort(rel(-4)), about: "Second floor: care-plan meetings", unread: false },
  ];
}

/* ---------------------------------------------------------------- families */

const fam = (name: string, resident: string, rel_: string, channel: string, lang: string, opt: string[], last: string, wing: string) => ({ name, resident, rel: rel_, channel, lang, opt, last, wing });

export const families = [
  fam("Karen Whitfield", "Margaret Whitfield · 132", "Daughter", "Text + email", "English", ["Calendar", "Menus", "News", "Urgent"], "Today", "First floor"),
  fam("María González", "Rosa González · 208", "Daughter", "Text", "Spanish", ["Calendar", "News", "Urgent"], "Today", "Memory care"),
  fam("Tom Becker", "Harold Becker · 117", "Son", "Text + email", "English", ["Calendar", "Menus", "Urgent"], "Today", "First floor"),
  fam("Linh Tran", "Mai Tran · 214", "Daughter", "Text", "Vietnamese", ["Calendar", "Menus", "News", "Urgent"], "Yesterday", "Memory care"),
  fam("Walter Reyes", "Arturo Reyes · 109", "Brother", "Email", "English", ["Calendar", "News", "Urgent"], "Yesterday", "First floor"),
  fam("Wei Chen", "Li Chen · 221", "Son", "Text", "Chinese", ["News", "Urgent"], "2 days ago", "Memory care"),
  fam("James Okonkwo", "Samuel Okonkwo · 226", "Son", "Text + email", "English", ["Calendar", "Menus", "News", "Urgent"], "Today", "Memory care"),
  fam("Ana Lucía Ortiz", "Elena Ortiz · 121", "Granddaughter", "Text", "Spanish", ["Calendar", "Urgent"], "3 days ago", "First floor"),
  fam("Peter Lindqvist", "Dorothy Lindqvist · 114", "Son", "Email", "English", ["Calendar", "Menus", "News", "Urgent"], "Today", "First floor"),
  fam("Grace Park", "Young-ja Park · 140", "Daughter", "Text + email", "Korean", ["Calendar", "News", "Urgent"], "Yesterday", "First floor"),
  fam("Rosa Delgado", "Manuel Delgado · 105", "Wife", "Text", "Spanish", ["Calendar", "Menus", "News", "Urgent"], "Today", "First floor"),
  fam("David Abrams", "Ruth Abrams · 230", "Son", "Email", "English", ["Urgent"], "1 week ago", "Memory care"),
];

export const languages = [
  { k: "English", n: 171 },
  { k: "Spanish", n: 31 },
  { k: "Vietnamese", n: 8 },
  { k: "Chinese", n: 4 },
  { k: "Korean", n: 3 },
  { k: "Tagalog", n: 2 },
];

/* ---------------------------------------------------------------- tours, enquiries, waitlist */

export function tours() {
  const d = (k: number) => longDate(rel(k));
  return [
    { when: `${d(1)}, 11:00 am`, who: "Susan Albright", forWhom: "Her father, 84, at home in Salem", where: "Larkmoor House", source: "Website: tour booking", host: "Daniel Whitcombe", status: "Confirmed · reminder scheduled" },
    { when: `${d(1)}, 3:00 pm`, who: "Robert & Jean Fisk", forWhom: "Themselves, independent living", where: "Ashby Grove", source: "Google Business Profile", host: "Dana Whitley", status: "Confirmed" },
    { when: `${d(2)}, 9:30 am`, who: "Michelle Ortega", forWhom: "Her mother, memory care", where: "Larkmoor House", source: "ChatGPT referral", host: "Daniel Whitcombe", status: "Confirmed · reminder scheduled" },
    { when: `${d(2)}, 1:30 pm`, who: "Kevin Nakamura", forWhom: "His aunt, after a hospital stay", where: "Maple Court", source: "Hospital discharge planner", host: "Ken Watanabe", status: "Confirmed" },
    { when: `${d(3)}, 11:00 am`, who: "Patricia Moore", forWhom: "Her husband", where: "Willow Bend", source: "Website: virtual tour → booking", host: "Susan Ihara", status: "Confirmed · stays for lunch" },
    { when: `${d(4)}, 4:30 pm`, who: "The Hendricks family", forWhom: "Grandmother, assisted living", where: "Fernhill", source: "Open house RSVP", host: "Elena Marsh", status: "Awaiting call back" },
  ];
}

export function enquiries() {
  return [
    { when: "12:41 pm", who: "Diane Kowalski", about: "Memory care for her mother; wants to know about waitlist", where: "Larkmoor House", source: "Website chat", routed: "Daniel Whitcombe", status: "New" },
    { when: "11:58 am", who: "Carlos Ruiz", about: "Pricing for a one-bedroom; prefers Spanish", where: "Ashby Grove", source: "Google Business Profile call", routed: "Dana Whitley (Spanish)", status: "Called back" },
    { when: "10:15 am", who: "Hannah Stein", about: "Respite stay for two weeks in December", where: "Willow Bend", source: "Perplexity answer → website", routed: "Susan Ihara", status: "New" },
    { when: "9:02 am", who: "Gregory Adams", about: "Whether his VA benefit applies", where: "Larkmoor House", source: "Website enquiry form", routed: "Daniel Whitcombe", status: "Replied by email" },
    { when: "Yesterday", who: "Mei Lin", about: "Companion suite for her parents", where: "Maple Court", source: "Referral agency", routed: "Ken Watanabe", status: "Tour booked" },
    { when: "Yesterday", who: "Joan Prescott", about: "Availability alerts for a studio", where: "Larkmoor House", source: "Apartments page waitlist", routed: "Daniel Whitcombe", status: "On waitlist" },
  ];
}

export const waitlist = [
  { where: "Larkmoor House", type: "Studio", available: 2, waiting: 0, alerts: 5 },
  { where: "Larkmoor House", type: "One bedroom", available: 1, waiting: 3, alerts: 11 },
  { where: "Larkmoor House", type: "Companion suite", available: 0, waiting: 2, alerts: 4 },
  { where: "Larkmoor House", type: "Memory care suite", available: 1, waiting: 0, alerts: 7 },
  { where: "Ashby Grove", type: "Cottage", available: 0, waiting: 6, alerts: 14 },
  { where: "Ashby Grove", type: "One bedroom", available: 2, waiting: 1, alerts: 8 },
  { where: "Willow Bend", type: "Studio", available: 1, waiting: 0, alerts: 3 },
  { where: "Willow Bend", type: "Memory care suite", available: 0, waiting: 4, alerts: 9 },
  { where: "Harbor View", type: "One bedroom", available: 3, waiting: 0, alerts: 2 },
  { where: "Maple Court", type: "Memory care suite", available: 0, waiting: 5, alerts: 12 },
  { where: "Maple Court", type: "Two bedroom", available: 1, waiting: 0, alerts: 4 },
  { where: "Fernhill", type: "Independent living one bedroom", available: 2, waiting: 2, alerts: 10 },
];

export function waitlistSignups() {
  return [
    { who: "Joan Prescott", wants: "Studio · Larkmoor House", when: "Yesterday", timing: "In the next three months", contact: "Text + email" },
    { who: "Arthur Bell", wants: "One bedroom · Larkmoor House", when: dayShort(rel(-2)), timing: "As soon as possible", contact: "Email" },
    { who: "The Nguyen family", wants: "Memory care suite · Maple Court", when: dayShort(rel(-3)), timing: "As soon as possible", contact: "Text" },
    { who: "Ruth Sandoval", wants: "Cottage · Ashby Grove", when: dayShort(rel(-4)), timing: "Just planning ahead", contact: "Email" },
  ];
}

export function alertsSent() {
  return [
    { when: dayShort(rel(-1)), what: "Studio came free at Larkmoor House", to: "5 people on alerts", result: "2 tours booked within 3 hours" },
    { when: dayShort(rel(-6)), what: "One bedroom came free at Harbor View", to: "2 people on alerts", result: "1 tour booked" },
    { when: dayShort(rel(-9)), what: "Memory care suite at Larkmoor House", to: "7 people on alerts", result: "Deposit taken" },
  ];
}

/* ---------------------------------------------------------------- content library */

export const library = [
  { title: "Fall costume parade", kind: "Activity idea", tags: ["Social", "Seasonal"], used: 5, photo: "/photos/dancing.jpg", text: "Residents, staff and visiting children parade through the dining room; prizes for best hat." },
  { title: "Veterans Day tea", kind: "Activity idea", tags: ["Social", "Seasonal"], used: 6, photo: "/photos/tea.jpg", text: "Honour resident veterans with a tea, a reading of names and a flag presentation." },
  { title: "Gratitude tree", kind: "Activity idea", tags: ["Arts", "Memory care"], used: 4, photo: "/photos/painting.jpg", text: "Paper leaves with what residents are thankful for, added through November." },
  { title: "Chair yoga series", kind: "Activity idea", tags: ["Fitness"], used: 6, photo: "/photos/game.jpg", text: "Six-week seated yoga series with a printable handout for each session." },
  { title: "Weekly calendar, large print", kind: "Template", tags: ["Print"], used: 6, photo: "/photos/puzzle.jpg", text: "One page per week, 20 pt type, colour-coded by activity type." },
  { title: "Event flyer", kind: "Template", tags: ["Print", "Email"], used: 6, photo: "/photos/dining-group.jpg", text: "Photo, title, date and RSVP line. Prints at letter size or as a 5×7 card." },
  { title: "Family digest", kind: "Template", tags: ["Email"], used: 6, photo: "/photos/knitting.jpg", text: "Monday morning email with the week’s calendar, menus and three photos." },
  { title: "Four-week fall menu cycle", kind: "Menu", tags: ["Dining"], used: 3, photo: "/photos/dining-three.jpg", text: "Tested at Ashby Grove; dietary tags already applied." },
];
