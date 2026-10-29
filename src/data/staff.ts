// Staff back end: everything the Prairie City Landing team sees after signing in.
// Times are stored as offsets from now / today so the screens always read as current.
import { addDays, dayShort, fmtTime, hash, iso, nowMinutes, today, MONTHS } from "@/lib/clock";

/* ------------------------------------------------------------------ people */

export const user = {
  name: "Toni Glenn",
  first: "Toni",
  initials: "TG",
  role: "Events & Adventures Director",
  email: "tglenn@prairiecitylanding.com",
};

export interface StaffPerson { name: string; initials: string; role: string; color: string }
export const staffPeople: Record<string, StaffPerson> = {
  toni: { name: "Toni Glenn", initials: "TG", role: "Events & Adventures Director", color: "#ad4f36" },
  jason: { name: "Jason Cherry", initials: "JC", role: "Fitness Director", color: "#47704c" },
  cheryl: { name: "Cheryl Martin", initials: "CM", role: "Executive Director", color: "#2e4d33" },
  cynthia: { name: "Cynthia Bazin", initials: "CB", role: "Community Relations Director", color: "#4c87a2" },
  conrad: { name: "Conrad Caguimbal", initials: "CC", role: "Culinary Director", color: "#968b53" },
  mickei: { name: "Mickei Butler", initials: "MB", role: "Dining Experience Director", color: "#b0882a" },
  douglas: { name: "Douglas Wigner", initials: "DW", role: "Business Office Director", color: "#425968" },
  janelle: { name: "Janelle Zweber", initials: "JZ", role: "Harbor Memory Care Director", color: "#be4142" },
  jan: { name: "Jan McLennon", initials: "JM", role: "Resident Services Director", color: "#6b5aa6" },
  shirley: { name: "Shirley Richard", initials: "SR", role: "Lead Ambassador", color: "#7a6a3a" },
};
export type PersonKey = keyof typeof staffPeople;

/* ------------------------------------------------------------- community */

export const community = {
  residents: 212,
  harborResidents: 22,
  apartments: 172,
  occupied: 164,
  families: 186, // households opted in to updates
  harborFamilies: 21,
  contacts: 271,
  smsReachable: 183,
  emailReachable: 171,
};

export const languages = [
  { k: "English", n: 158 },
  { k: "Spanish", n: 14 },
  { k: "Russian", n: 6 },
  { k: "Tagalog", n: 4 },
  { k: "Vietnamese", n: 2 },
  { k: "Chinese", n: 2 },
];

/* ------------------------------------------------------------ time helpers */

/** "12 min ago", "3 h ago", "Yesterday, 4:10 pm", "Mon, Oct 26, 9:12 am" */
export function ago(mins: number): string {
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  let t = nowMinutes() - mins;
  if (t < 0) t -= (mins * 37) % 173;
  if (t >= 0) return mins < 6 * 60 ? `${Math.round(mins / 60)} h ago` : `Today, ${fmtTime(round5(t))}`;
  const back = Math.ceil(-t / 1440);
  const tod = Math.min(18 * 60 + 40, Math.max(7 * 60 + 50, round5(((t % 1440) + 1440) % 1440)));
  return back === 1 ? `Yesterday, ${fmtTime(tod)}` : `${dayShort(addDays(today(), -back))}, ${fmtTime(tod)}`;
}
const round5 = (m: number) => Math.min(1435, Math.round(m / 5) * 5);

/** A fixed time today, or yesterday if that time hasn't come yet. */
export function atToday(min: number): string {
  return nowMinutes() >= min ? `Today, ${fmtTime(min)}` : `Yesterday, ${fmtTime(min)}`;
}

/** Day label for an offset in days: "Today", "Tomorrow", "Yesterday", "Fri, Oct 30". */
export function dayLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return dayShort(addDays(today(), offset));
}

/** Next Sunday (or today if Sunday): when the weekly email digest goes out. */
export function nextDigest(): string {
  const t = today();
  const d = addDays(t, (7 - t.getUTCDay()) % 7 || (nowMinutes() < 17 * 60 ? 0 : 7));
  return `${dayShort(d)}, 5:00 pm`;
}

/** The scorecard month: the current month from the 25th, otherwise last month. */
export function scorecardMonths() {
  const t = today();
  const m = t.getUTCDate() >= 25 ? t.getUTCMonth() : (t.getUTCMonth() + 11) % 12;
  const y = t.getUTCDate() >= 25 || t.getUTCMonth() > 0 ? t.getUTCFullYear() : t.getUTCFullYear() - 1;
  const pm = (m + 11) % 12;
  return { label: `${MONTHS[m]} ${y}`, month: MONTHS[m], prev: MONTHS[pm] };
}

/** Deterministic daily website visits for the last n days (ending today). */
export function dailyVisits(n = 30, offset = 0) {
  const t = today();
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(t, i - n + 1 - offset);
    const wd = d.getUTCDay();
    const weekly = [150, 232, 218, 210, 214, 196, 142][wd];
    const trend = 1 + (i / n) * 0.16 - offset / 300;
    const noise = (hash(iso(d)) % 40) - 20;
    return { date: iso(d), label: `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`, v: Math.round(weekly * trend + noise) };
  });
}

/* ------------------------------------------------------------ dashboard */

export const weekKpis = {
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

export const enquirySources = [
  { label: "Google search", value: 17 },
  { label: "Google Business Profile", value: 11 },
  { label: "A Place for Mom", value: 7 },
  { label: "AI search (ChatGPT and others)", value: 7 },
  { label: "Website chat", value: 6 },
  { label: "Referrals from residents and families", value: 5 },
  { label: "Facebook", value: 3 },
  { label: "Walk-in", value: 2 },
];
export const enquirySourcesPrev = [13, 8, 8, 3, 4, 4, 2, 2];

export interface Activity { who: PersonKey; mins: number; text: string; tone?: "ok" | "wait" | "info" }
export const activity: Activity[] = [
  { who: "toni", mins: 34, text: "posted “Halloween Happy Hour: Costumes Encouraged” to the website, 186 families and Facebook" },
  { who: "jason", mins: 96, text: "sent “Healthy Happy Hour with Jason & Cynthia!” flyer for approval", tone: "wait" },
  { who: "cynthia", mins: 140, text: "booked a tour for the Andersons, Friday at 10:00 am, with lunch in the Cypress Room", tone: "info" },
  { who: "conrad", mins: 230, text: "published today’s menus for the Cypress Room, Natoma Café and The Rendezvous" },
  { who: "janelle", mins: 60 * 19, text: "texted 21 Harbor families about Harbor Pumpkin Painting" },
  { who: "toni", mins: 60 * 21, text: "posted 12 photos from “Happy Hour: Jeremy on Guitar”" },
  { who: "douglas", mins: 60 * 26, text: "submitted a pricing correction for the One Bedroom Standard (NB2B)", tone: "wait" },
  { who: "cheryl", mins: 60 * 28, text: "approved “Walk to End Alzheimer’s” story and photos" },
  { who: "shirley", mins: 60 * 45, text: "printed 60 large-print November calendars for the front desk" },
];

/* ------------------------------------------------------------ messages */

export interface Send {
  id: string; title: string; audience: string; channels: string; by: PersonKey; mins: number;
  sent: number; delivered: number; opened: number; replied: number; lang?: number;
}
export const sends: Send[] = [
  { id: "s1", title: "Halloween Happy Hour on Friday: costumes encouraged", audience: "All families", channels: "Text + email", by: "toni", mins: 34, sent: 186, delivered: 183, opened: 129, replied: 6, lang: 28 },
  { id: "s2", title: "Harbor Pumpkin Painting tomorrow at 10:30 am", audience: "Harbor families", channels: "Text", by: "janelle", mins: 60 * 19, sent: 21, delivered: 21, opened: 20, replied: 3, lang: 2 },
  { id: "s3", title: "Your week at Prairie City Landing", audience: "All families", channels: "Email digest", by: "toni", mins: 60 * 67, sent: 171, delivered: 169, opened: 131, replied: 2, lang: 26 },
  { id: "s4", title: "Apple Hill Orchards trip: 3 seats left", audience: "All families", channels: "Text + email", by: "toni", mins: 60 * 120, sent: 186, delivered: 184, opened: 158, replied: 9, lang: 28 },
  { id: "s5", title: "Walk to End Alzheimer’s: photos are up", audience: "All families", channels: "Text + email", by: "janelle", mins: 60 * 214, sent: 186, delivered: 183, opened: 162, replied: 14, lang: 28 },
  { id: "s6", title: "The November calendar is live", audience: "All families", channels: "Text + email", by: "toni", mins: 60 * 190, sent: 186, delivered: 184, opened: 151, replied: 4, lang: 28 },
];
sends.sort((a, b) => a.mins - b.mins);

export const templates = [
  { k: "event", label: "New event", text: "New on the PCL calendar: {event}. Reply YES to save a seat for your loved one, or call the front desk at (916) 458-0303." },
  { k: "photos", label: "Photos are up", text: "Photos from {event} are up! See them on our website and Facebook. Thank you for being part of the PCL family." },
  { k: "reminder", label: "Reminder", text: "Reminder: {event}. Families are always welcome to join us." },
  { k: "change", label: "Schedule change", text: "Schedule change: {event}. We’re sorry for any inconvenience. Questions? Call (916) 458-0303." },
  { k: "harbor", label: "Harbor update", text: "Harbor update from Janelle: {event}. Thank you for sharing your loved one with us." },
];

export interface Thread {
  id: string; from: string; relation: string; resident: string; apt: string; lang: "English" | "Spanish" | "Russian";
  unread: boolean; mins: number; subject: string;
  msgs: { me?: boolean; who?: string; text: string; original?: string; mins: number }[];
}
export const threads: Thread[] = [
  {
    id: "t1", from: "María Hernández", relation: "Daughter", resident: "Rosa Hernández", apt: "2214", lang: "Spanish", unread: true, mins: 22,
    subject: "Halloween Happy Hour",
    msgs: [
      { me: true, text: "Halloween Happy Hour on Friday, 3:00–4:00 pm in The Rendezvous: live music, a costume parade and prizes. Costumes encouraged!", original: "Hora Feliz de Halloween el viernes, de 3:00 a 4:00 pm en The Rendezvous: música en vivo, desfile de disfraces y premios. ¡Los disfraces son bienvenidos!", mins: 34 },
      { who: "María", text: "Can I come with my mom to the happy hour on Friday? Do I need a costume too? She wants to dress up as Frida Kahlo, ha ha.", original: "¿Puedo acompañar a mi mamá a la hora feliz del viernes? ¿Yo también necesito disfraz? Ella quiere vestirse de Frida Kahlo, jaja.", mins: 22 },
    ],
  },
  {
    id: "t2", from: "Tom Whitaker", relation: "Son", resident: "Dorothy Whitaker", apt: "1108", lang: "English", unread: true, mins: 75,
    subject: "Apple Hill waitlist",
    msgs: [
      { me: true, text: "Apple Hill Orchards trip on Saturday at 9:30 am from the Lobby: 3 seats left. Reply YES to save a seat.", mins: 60 * 120 },
      { who: "Tom", text: "Mom says she’s on the waitlist for Apple Hill. Any chance a seat opens up? She’s been talking about the apple cider donuts all week.", mins: 75 },
    ],
  },
  {
    id: "t3", from: "Ivan Petrov", relation: "Son", resident: "Galina Petrova", apt: "3105", lang: "Russian", unread: false, mins: 60 * 20,
    subject: "Photos",
    msgs: [
      { me: true, text: "12 photos from Happy Hour: Jeremy on Guitar are up on our website and Facebook.", original: "12 фотографий с вечера «Happy Hour: Jeremy on Guitar» уже на нашем сайте и в Facebook.", mins: 60 * 21 },
      { who: "Ivan", text: "Thank you for the photos. Mother looks so happy. We will visit on Sunday for the violin concert.", original: "Спасибо за фотографии. Мама выглядит такой счастливой. Мы приедем в воскресенье на концерт скрипки.", mins: 60 * 20 },
      { me: true, text: "Wonderful! Antonio plays in Natoma Café at 3:00 pm on Sunday. We’ll save you seats next to Galina.", original: "Замечательно! Антонио играет в Natoma Café в воскресенье в 3:00. Мы оставим вам места рядом с Галиной.", mins: 60 * 19 },
    ],
  },
  {
    id: "t4", from: "Karen Liu", relation: "Daughter", resident: "George Liu", apt: "1216", lang: "English", unread: false, mins: 60 * 50,
    subject: "Thanksgiving",
    msgs: [
      { who: "Karen", text: "Is there a Thanksgiving dinner families can join? There will be four of us plus Dad.", mins: 60 * 52 },
      { me: true, text: "Yes! Thanksgiving dinner is in the Cypress Room from 11:00 am to 3:00 pm, by reservation. I’ve passed your note to Mickei Butler (ext. 160), who will call you to book a table for five.", mins: 60 * 50 },
    ],
  },
  {
    id: "t5", from: "Susan Park", relation: "Daughter", resident: "Russell Park", apt: "Harbor 7", lang: "English", unread: false, mins: 60 * 210,
    subject: "Walk to End Alzheimer’s",
    msgs: [
      { me: true, text: "Photos from the Walk to End Alzheimer’s are up. Thank you to every family who walked with us!", mins: 60 * 214 },
      { who: "Susan", text: "Dad in a tie-dye shirt is the best thing I’ve seen all year. Thank you, Janelle and team.", mins: 60 * 210 },
    ],
  },
];

/* ------------------------------------------------------------ families */

export interface Contact {
  resident: string; apt: string; harbor?: boolean; contact: string; relation: string;
  phone: string; email: string; channel: "SMS" | "Email" | "SMS + email"; lang: string;
  sms: boolean; emailOpt: boolean; photos: boolean;
}
const c = (resident: string, apt: string, contact: string, relation: string, channel: Contact["channel"], lang = "English", opts = "111", harbor = false): Contact => {
  const h = hash(contact);
  const local = contact.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
  const last = contact.toLowerCase().split(" ").slice(-1)[0].normalize("NFD").replace(/[^a-z]/g, "");
  const domains = ["gmail.com", "yahoo.com", "comcast.net", "icloud.com", "outlook.com", "sbcglobal.net"];
  return {
    resident, apt, harbor, contact, relation, channel, lang,
    phone: `(916) ${["351", "608", "817", "984", "932", "355", "988"][h % 7]}-${String(1000 + (h % 8999)).padStart(4, "0")}`,
    email: `${local}.${last}@${domains[h % domains.length]}`,
    sms: opts[0] === "1", emailOpt: opts[1] === "1", photos: opts[2] === "1",
  };
};
export const contacts: Contact[] = [
  c("Rosa Hernández", "2214", "María Hernández", "Daughter", "SMS", "Spanish"),
  c("Dorothy Whitaker", "1108", "Tom Whitaker", "Son", "SMS + email"),
  c("Galina Petrova", "3105", "Ivan Petrov", "Son", "SMS + email", "Russian"),
  c("George Liu", "1216", "Karen Liu", "Daughter", "Email", "English", "011"),
  c("Russell Park", "Harbor 7", "Susan Park", "Daughter", "SMS + email", "English", "111", true),
  c("Harold Jensen", "2302", "Linda Jensen", "Wife", "SMS"),
  c("Margaret O’Neill", "1310", "Kevin O’Neill", "Son", "Email", "English", "011"),
  c("Walter Kim", "3212", "Grace Kim", "Daughter", "SMS + email"),
  c("Frank Delgado", "Harbor 3", "Elena Delgado", "Wife", "SMS", "Spanish", "111", true),
  c("June Albright", "2120", "Paul Albright", "Son", "SMS + email", "English", "110"),
  c("Raymond Ochoa", "1402", "Adriana Ochoa", "Granddaughter", "SMS", "Spanish"),
  c("Evelyn Strand", "3301", "Mark Strand", "Son", "Email", "English", "011"),
  c("Patricia Moreno", "2118", "Luis Moreno", "Son", "SMS", "Spanish"),
  c("Arthur Bellamy", "Harbor 11", "Diane Bellamy", "Daughter", "SMS + email", "English", "111", true),
  c("Lorraine Sato", "1204", "Kenji Sato", "Son", "SMS + email"),
  c("Norma Fischer", "3118", "Beth Fischer-Lowe", "Daughter", "Email", "English", "010"),
  c("Stanley Nguyen", "2410", "Thu Nguyen", "Daughter", "SMS", "Vietnamese"),
  c("Gloria Medina", "Harbor 15", "Ricardo Medina", "Son", "SMS", "Spanish", "111", true),
  c("Irene Kowalski", "1320", "Anna Kowalski", "Niece", "SMS + email"),
  c("Lester Grant", "2206", "Denise Grant", "Daughter", "SMS"),
  c("Mildred Haines", "Harbor 2", "Carol Haines", "Daughter", "SMS + email", "English", "110", true),
  c("Melvin Choi", "3204", "Daniel Choi", "Son", "Email", "Chinese", "011"),
  c("Ruth Delaney", "1114", "Patrick Delaney", "Son", "SMS + email"),
  c("Nadia Koval", "2307", "Oksana Koval", "Daughter", "SMS", "Russian"),
  c("Tomas Reyes", "1411", "Marisol Reyes", "Daughter", "SMS + email", "Tagalog"),
  c("Helen Marsh", "Harbor 19", "Jim Marsh", "Husband", "SMS", "English", "111", true),
  c("Howard Bishop", "3410", "Laura Bishop-Kent", "Daughter", "Email", "English", "011"),
  c("Virginia Salas", "2104", "Carmen Salas", "Daughter", "SMS", "Spanish"),
  c("Ernest Kaplan", "1302", "Rachel Kaplan", "Daughter", "SMS + email"),
  c("Agnes Morrow", "Harbor 5", "Bill Morrow", "Son", "SMS + email", "English", "100", true),
];

/** Residents who appear in photos. Photo consent comes from the family contact (or the resident). */
export const residentsInPhotos = {
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
export const residentNames = [
  "Dorothy Whitaker", "Rosa Hernández", "Galina Petrova", "Harold Jensen", "Margaret O’Neill", "Walter Kim", "Betty Lou Carmichael",
  "June Albright", "Raymond Ochoa", "Evelyn Strand", "George Liu", "Patricia Moreno", "Lorraine Sato", "Eugene Pruitt", "Norma Fischer",
  "Clarence Boyd", "Herbert Lindqvist", "Irene Kowalski", "Lester Grant", "Stanley Nguyen", "Barbara Ellison", "Vernon Tate", "Joan Mackey",
  "Doris Abernathy", "Leonard Fox", "Phyllis Okafor", "Carl Rasmussen", "Ruth Delaney", "Howard Bishop", "Melvin Choi", "Edna Farrell",
  "Roy Castellanos", "Jean Whitfield", "Dale Henriksen", "Marilyn Cruz", "Wallace Reid", "Bernice Hollis", "Gerald Ames", "Lucille Varga",
  "Kenneth Oyama", "Florence Pike", "Donald Westbrook", "Virginia Salas", "Ernest Kaplan", "Albert Duarte", "Rita Sorensen", "Marvin Keel",
  "Elaine Tobin", "Nadia Koval", "Tomas Reyes",
];
export const harborNames = ["Russell Park", "Frank Delgado", "Arthur Bellamy", "Gloria Medina", "Mildred Haines", "Helen Marsh", "Agnes Morrow", "Floyd Sutton", "Hazel Ivers", "Wilma Grady", "Chester Ruiz", "Opal Lindgren"];

/** A stable RSVP list and waitlist for a capped event. */
export function rsvpFor(id: string, taken: number, waitlist: number, harbor = false) {
  const pool = harbor ? [...harborNames, ...residentNames] : residentNames;
  const start = hash(id) % pool.length;
  const pick = (n: number, from: number) => Array.from({ length: n }, (_, i) => pool[(from + i * 7) % pool.length]);
  const all = pick(taken + waitlist, start);
  return { going: all.slice(0, taken), waiting: all.slice(taken) };
}

/* ------------------------------------------------------------ approvals */

export interface Approval {
  id: string; by: PersonKey; mins: number; kind: string; title: string; detail: string; photo?: string;
  channels: string[]; note?: string; diff?: [string, string];
}
export const approvals: Approval[] = [
  {
    id: "a1", by: "jason", mins: 96, kind: "Flyer (PDF)", title: "Healthy Happy Hour with Jason & Cynthia!",
    detail: "Wednesday, November 18 · 3:00 pm · The Rendezvous. Music, nutritious snacks and choreography.",
    photo: "/img/cocktail.jpg", channels: ["Website calendar", "Family text (186)", "Large-print flyer", "Facebook"],
    note: "Mocktail recipes on the back. Cynthia is bringing the playlist.",
  },
  {
    id: "a2", by: "toni", mins: 60 * 3 + 10, kind: "News post with 6 photos", title: "Honoring our veterans",
    detail: "Veterans Day plans: the bus to the parade at 7:30 am, Veterans’ Lunch in Natoma Café, and the Veterans’ & Families Only Ceremony at 2:00 pm.",
    photo: "/img/flag.jpg", channels: ["Website news", "Family email digest", "Facebook", "Google Business Profile"],
    note: "All 6 residents pictured have photo consent on file.",
  },
  {
    id: "a3", by: "douglas", mins: 60 * 26, kind: "Pricing change", title: "One Bedroom Standard (NB2B) starting rate",
    detail: "Floor plans page shows $6,155; the pricing page and brochure say $6,150. Correct the floor plan to match.",
    channels: ["Website floor plans", "Google Business Profile"], diff: ["From $6,155 a month", "From $6,150 a month"],
  },
  {
    id: "a4", by: "conrad", mins: 60 * 30, kind: "Menu", title: "Thanksgiving dinner menu, Thursday, November 26",
    detail: "Cypress Room, 11:00 am–3:00 pm by reservation. Herb-roasted turkey, honey-glazed ham, wild mushroom Wellington, and pumpkin, pecan and apple desserts.",
    photo: "/img/turkey.jpg", channels: ["Website dining", "Digital signage", "Family email digest"],
  },
];

export const approvedRecently = [
  { title: "Walk to End Alzheimer’s: story and 14 photos", by: "janelle" as PersonKey, mins: 60 * 28, ok: true },
  { title: "November activity calendar (312 events)", by: "toni" as PersonKey, mins: 60 * 190, ok: true },
  { title: "Paint and Sip by Cassandra: news post", by: "toni" as PersonKey, mins: 60 * 24 * 19, ok: true },
  { title: "Facebook post: “Guess the pumpkin” contest", by: "toni" as PersonKey, mins: 60 * 50, ok: false, note: "Changes requested: one resident without photo consent. Re-sent with photo cropped." },
];

/* ------------------------------------------------------------ SEO */

export interface Ranking { q: string; pos: number; change: number; volume: number; url: string; hist: number[] }
export const rankings: Ranking[] = [
  { q: "senior living Folsom", pos: 2, change: 3, volume: 880, url: "/", hist: [7, 7, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2] },
  { q: "assisted living Folsom", pos: 3, change: 2, volume: 720, url: "/living/assisted-living", hist: [8, 8, 7, 6, 6, 6, 5, 5, 5, 4, 3, 3] },
  { q: "memory care Folsom", pos: 4, change: 5, volume: 590, url: "/living/harbor-memory-care", hist: [12, 11, 11, 10, 9, 9, 8, 7, 6, 5, 5, 4] },
  { q: "independent living El Dorado Hills", pos: 6, change: 8, volume: 260, url: "/living/independent-living", hist: [19, 18, 17, 15, 14, 14, 12, 10, 9, 8, 7, 6] },
  { q: "senior apartments Folsom", pos: 3, change: 1, volume: 390, url: "/floor-plans", hist: [5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3] },
  { q: "retirement community Folsom CA", pos: 2, change: 0, volume: 320, url: "/", hist: [3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2] },
  { q: "luxury senior living Sacramento", pos: 9, change: 4, volume: 210, url: "/", hist: [18, 17, 16, 15, 15, 14, 13, 13, 12, 11, 10, 9] },
  { q: "senior living events Folsom", pos: 1, change: 6, volume: 90, url: "/calendar", hist: [9, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1] },
  { q: "Prairie City Landing", pos: 1, change: 0, volume: 1300, url: "/", hist: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

export const searchWeekly = {
  clicks: [412, 436, 428, 470, 455, 498, 521, 547, 566, 598, 641, 689],
  impressions: [14200, 14650, 14400, 15300, 15800, 16400, 17100, 17900, 18800, 19700, 21300, 22900],
};

export const gbp = { views: 8940, viewsPrev: 7610, calls: 112, callsPrev: 94, directions: 186, directionsPrev: 161, clicks: 341, clicksPrev: 262, rating: 4.8, reviews: 163, newReviews: 6 };

export const reviewsRecent = [
  { name: "Linda M.", stars: 5, mins: 60 * 40, text: "They took my husband paddleboarding. Harbor sees him for who he still is." },
  { name: "Greg A.", stars: 5, mins: 60 * 24 * 4, text: "Mom has a fuller social calendar than I do. The weekly family texts are a lifesaver." },
  { name: "Ron P.", stars: 4, mins: 60 * 24 * 9, text: "Beautiful community and great food. Parking for visitors can be tight on Sundays." },
];

export const topPages = [
  { url: "/calendar", title: "Activity Calendar", clicks: 512, change: 41 },
  { url: "/dining", title: "Dining: today’s menus", clicks: 384, change: 63 },
  { url: "/floor-plans", title: "Floor Plans & Pricing", clicks: 341, change: 18 },
  { url: "/living/harbor-memory-care", title: "Harbor Memory Care", clicks: 188, change: 27 },
  { url: "/living/assisted-living", title: "Assisted Living Services", clicks: 161, change: 12 },
  { url: "/faq", title: "FAQs", clicks: 104, change: 88 },
];

export const vitals = [
  { k: "Largest Contentful Paint", v: "1.7 s", note: "Good is under 2.5 s" },
  { k: "Interaction to Next Paint", v: "96 ms", note: "Good is under 200 ms" },
  { k: "Cumulative Layout Shift", v: "0.02", note: "Good is under 0.1" },
];

/* ------------------------------------------------------------ GEO */

export type Engine = "ChatGPT" | "Google AI Overviews" | "Perplexity" | "Gemini";
export const engines: { k: Engine; short: string; score: number; prev: number; color: string }[] = [
  { k: "ChatGPT", short: "ChatGPT", score: 71, prev: 52, color: "#2f7a62" },
  { k: "Google AI Overviews", short: "AI Overviews", score: 68, prev: 50, color: "#4c87a2" },
  { k: "Perplexity", short: "Perplexity", score: 63, prev: 47, color: "#425968" },
  { k: "Gemini", short: "Gemini", score: 54, prev: 41, color: "#6b5aa6" },
];
export const geoTrend = [31, 33, 34, 38, 41, 44, 47, 49, 53, 57, 60, 64];

export interface Answer {
  engine: Engine; prompt: string; text: string; accuracy: "accurate" | "partly" | "wrong";
  recommended: boolean; position?: number; competitors: string[]; mins: number; cites?: string;
}
export const answers: Answer[] = [
  {
    engine: "ChatGPT", prompt: "best senior living in Folsom", accuracy: "accurate", recommended: true, position: 1, mins: 60 * 5,
    text: "Prairie City Landing (645 Willard Drive) is a top choice in Folsom: a Tenfold Senior Living community offering Independent Living, Assisted Living Services delivered in every apartment, and Harbor Memory Care. It’s been voted Best of Folsom for senior living and is known for its busy Events & Adventures calendar and three on-site restaurants.",
    competitors: ["a large continuing-care campus in Roseville", "an assisted living community near Blue Ravine Road"], cites: "prairiecitylanding.com/calendar",
  },
  {
    engine: "Google AI Overviews", prompt: "best senior living in Folsom", accuracy: "accurate", recommended: true, position: 2, mins: 60 * 5,
    text: "Highly rated options include Prairie City Landing, a luxury community near Folsom High School with apartments up to 1,417 sq ft and no second-person fee, and several smaller assisted living homes in the area.",
    competitors: ["a national-chain community in El Dorado Hills", "smaller residential care homes"], cites: "prairiecitylanding.com/floor-plans",
  },
  {
    engine: "Perplexity", prompt: "memory care near Folsom CA", accuracy: "accurate", recommended: true, position: 1, mins: 60 * 9,
    text: "Prairie City Landing’s Harbor is a secured memory care neighborhood with its own courtyard and weekly outings, from bowling to stand-up paddling. Studios start at $6,400 a month. RCFE License #342700370.",
    competitors: ["a memory care community in Rancho Cordova", "a memory care wing at a Roseville community"], cites: "prairiecitylanding.com/living/harbor-memory-care",
  },
  {
    engine: "Gemini", prompt: "memory care near Folsom CA", accuracy: "partly", recommended: true, position: 3, mins: 60 * 9,
    text: "Options include a memory care community in Rancho Cordova and a memory care wing in Roseville. Prairie City Landing in Folsom offers senior living and assisted living; check with them about memory care.",
    competitors: ["a memory care community in Rancho Cordova", "a memory care wing at a Roseville community"],
  },
  {
    engine: "ChatGPT", prompt: "does Prairie City Landing charge a second person fee", accuracy: "accurate", recommended: true, mins: 60 * 30,
    text: "No. Prairie City Landing does not charge a second-person fee, which the community says saves couples about $12,000 a year.",
    competitors: [], cites: "prairiecitylanding.com/faq",
  },
  {
    engine: "Gemini", prompt: "does Prairie City Landing charge a second person fee", accuracy: "wrong", recommended: false, mins: 60 * 30,
    text: "Most communities in the Sacramento area charge a second-person fee of $800–$1,200 a month, and Prairie City Landing lists a second-occupant fee for shared apartments.",
    competitors: [],
  },
  {
    engine: "Perplexity", prompt: "what’s for lunch at Prairie City Landing today", accuracy: "accurate", recommended: true, mins: 60 * 2,
    text: "Today’s menus are published on the Prairie City Landing dining page: the Cypress Room has a daily chef’s special and soup, Natoma Café serves breakfast all morning, and The Rendezvous has a panini of the day.",
    competitors: [], cites: "prairiecitylanding.com/dining",
  },
  {
    engine: "Google AI Overviews", prompt: "independent living El Dorado Hills", accuracy: "partly", recommended: true, position: 4, mins: 60 * 50,
    text: "Nearby options include communities in El Dorado Hills and Folsom. Prairie City Landing in Folsom, about 10 minutes away, offers studios to two-bedroom apartments from about $4,795 a month.",
    competitors: ["two independent living communities in El Dorado Hills", "a 55+ apartment complex in Folsom"], cites: "a 2022 senior living directory listing",
  },
];

export interface WrongFact {
  id: string; claim: string; truth: string; engines: Engine[]; source: string; fix: string; fixUrl: string;
  status: "fixed" | "in progress" | "monitoring"; mins: number;
}
export const wrongFacts: WrongFact[] = [
  {
    id: "w1", claim: "Quotes the spring 2021 dining menu (“prime rib Fridays, early-bird dinner at 4:30”).", truth: "Menus change daily and are published every morning.",
    engines: ["Perplexity", "ChatGPT"], source: "An old PDF menu still linked from a 2021 Facebook post",
    fix: "Live /dining menu published daily with structured menu data. Old PDF redirected to /dining.", fixUrl: "/dining", status: "fixed", mins: 60 * 24 * 6,
  },
  {
    id: "w2", claim: "Says there is a second-person fee for couples.", truth: "There is no second-person fee, saving couples about $12,000 a year.",
    engines: ["Gemini"], source: "General answer about Sacramento-area pricing, not about PCL",
    fix: "FAQ entry “Is there a second-person fee?” with FAQ structured data, and the line added to every floor plan.", fixUrl: "/faq", status: "in progress", mins: 60 * 24 * 2,
  },
  {
    id: "w3", claim: "Lists apartments “from about $4,795 a month”.", truth: "Independent Living from $5,950 a month.",
    engines: ["Google AI Overviews"], source: "A 2022 senior living directory listing",
    fix: "Current starting prices on /floor-plans with the date they were last confirmed. Directory update requested.", fixUrl: "/floor-plans", status: "monitoring", mins: 60 * 24 * 3,
  },
  {
    id: "w4", claim: "Doesn’t mention Harbor; suggests PCL may not offer memory care.", truth: "Harbor Memory Care is a secured neighborhood with its own courtyard.",
    engines: ["Gemini"], source: "No memory care service listed on the Google Business Profile",
    fix: "/living/harbor-memory-care page with care details and pricing; “Memory care” added as a Google Business Profile service.", fixUrl: "/living/harbor-memory-care", status: "in progress", mins: 60 * 24 * 1,
  },
  {
    id: "w5", claim: "Gives the phone number as (916) 985-2210.", truth: "(916) 458-0303.",
    engines: ["ChatGPT"], source: "An out-of-date local business directory",
    fix: "Phone number in the site’s organization data on every page, and on the Contact page and Google Business Profile.", fixUrl: "/contact", status: "fixed", mins: 60 * 24 * 12,
  },
  {
    id: "w6", claim: "Says pets aren’t allowed.", truth: "Dogs and cats are welcome, with an outdoor pet area in the courtyard.",
    engines: ["Perplexity"], source: "A Reddit thread about a different Folsom community",
    fix: "FAQ entry “Are pets welcome?” and pets listed on Independent Living.", fixUrl: "/faq", status: "monitoring", mins: 60 * 24 * 4,
  },
];

/* ------------------------------------------------------------ apartments */

export const planUnits: Record<string, { units: number; notice: number }> = {
  NA1: { units: 18, notice: 0 }, NB2B: { units: 46, notice: 1 }, NB1C: { units: 22, notice: 0 }, NC1: { units: 28, notice: 0 },
  NC4: { units: 14, notice: 1 }, NC6: { units: 8, notice: 0 }, AB2: { units: 12, notice: 0 },
  AZ1: { units: 8, notice: 0 }, AZ2: { units: 10, notice: 1 }, AZ3: { units: 3, notice: 0 }, AZ4: { units: 2, notice: 0 }, AZ5: { units: 1, notice: 0 },
};

export interface Waiter { name: string; plan: string; joinedDays: number; deposit: boolean; note?: string }
export const waitlist: Waiter[] = [
  { name: "Robert & Carol Engstrom", plan: "NC4", joinedDays: 212, deposit: true, note: "Wants a corner unit facing the courtyard" },
  { name: "Margaret Tillman", plan: "NB1C", joinedDays: 188, deposit: true },
  { name: "Dennis & Joyce Albers", plan: "NC4", joinedDays: 160, deposit: true },
  { name: "Phyllis Graham", plan: "NB1C", joinedDays: 141, deposit: true, note: "Moving from Granite Bay; flexible on floor" },
  { name: "Henry Watanabe", plan: "AZ2", joinedDays: 96, deposit: true, note: "Wife currently at home with hospice support" },
  { name: "Sandra & Lou Pacheco", plan: "NC6", joinedDays: 90, deposit: true },
  { name: "Gail Thornton", plan: "NC4", joinedDays: 84, deposit: false },
  { name: "Arnold Becker", plan: "NB1C", joinedDays: 71, deposit: true },
  { name: "The Okonkwo family (for Grace)", plan: "AZ3", joinedDays: 58, deposit: true },
  { name: "Beverly Sloane", plan: "NC4", joinedDays: 45, deposit: false },
  { name: "Jim & Patty Rourke", plan: "NC6", joinedDays: 38, deposit: false },
  { name: "Eleanor Vasquez", plan: "NB1C", joinedDays: 30, deposit: false },
  { name: "Carl Mendelsohn", plan: "NC4", joinedDays: 21, deposit: false },
  { name: "Ruth Ann Dobbs (for her father)", plan: "AZ2", joinedDays: 12, deposit: false },
  { name: "Sharon & Mike Feld", plan: "NC4", joinedDays: 6, deposit: false },
];

export const alerts = [
  { plan: "NC6", text: "Two Bedroom Grand available", days: 7, sent: 14, opened: 11, tours: 2 },
  { plan: "AZ1", text: "Harbor Standard Private Room available", days: 15, sent: 9, opened: 8, tours: 1 },
  { plan: "NB2B", text: "One Bedroom Standard available (2)", days: 24, sent: 22, opened: 17, tours: 3 },
];

export const moves = {
  ins: [
    { name: "Albert Duarte", plan: "NB2B", apt: "2219", days: -18 },
    { name: "Rita & Hal Sorensen", plan: "NC1", apt: "3302", days: -11 },
    { name: "Hazel Ivers", plan: "AZ2", apt: "Harbor 9", days: -4 },
    { name: "Marvin Keel", plan: "NA1", apt: "1121", days: 3 },
  ],
  outs: [
    { name: "Apartment 1310 (notice given)", plan: "NB2B", days: 18, note: "Moving closer to family in Oregon" },
    { name: "Apartment 3114 (notice given)", plan: "NC4", days: 26, note: "30-day notice received" },
  ],
};

/* ------------------------------------------------------------ tours */

export interface Tour { days: number; time: number; who: string; for: string; interest: "Independent Living" | "Assisted Living" | "Harbor Memory Care"; source: string; lunch?: boolean; note?: string; with: PersonKey }
export const tours: Tour[] = [
  { days: 0, time: 600, who: "Patricia Lund", for: "herself", interest: "Independent Living", source: "Google search", lunch: true, note: "Widowed last year; loves bridge", with: "cynthia" },
  { days: 0, time: 840, who: "David & Mei Chen", for: "David’s mother", interest: "Assisted Living", source: "AI search (ChatGPT)", note: "Asked about medication management", with: "cynthia" },
  { days: 1, time: 660, who: "Frank Russo", for: "himself and his wife", interest: "Independent Living", source: "Referral: Harold Jensen", lunch: true, with: "cynthia" },
  { days: 2, time: 600, who: "The Andersons", for: "Joan Anderson", interest: "Independent Living", source: "Google Business Profile", lunch: true, note: "Wants to see NC6 Two Bedroom Grand", with: "cynthia" },
  { days: 2, time: 900, who: "Lisa Moreau", for: "her father", interest: "Harbor Memory Care", source: "A Place for Mom", note: "Meet Janelle; see the Harbor courtyard", with: "janelle" },
  { days: 3, time: 690, who: "Ray & Donna Whitcomb", for: "themselves", interest: "Independent Living", source: "Facebook", lunch: true, with: "cynthia" },
  { days: 5, time: 600, who: "Sylvia Grant", for: "her aunt", interest: "Assisted Living", source: "Website chat", with: "cynthia" },
  { days: 5, time: 780, who: "Ken Ishida", for: "himself", interest: "Independent Living", source: "Google search", lunch: true, note: "Retired engineer; ask about Tech Corner", with: "cynthia" },
  { days: 6, time: 630, who: "Marjorie Boyle", for: "herself", interest: "Independent Living", source: "Walk-in", with: "cynthia" },
  { days: 7, time: 600, who: "Ben & Alicia Ortiz", for: "Alicia’s parents", interest: "Independent Living", source: "AI search (Perplexity)", lunch: true, with: "cynthia" },
  { days: 8, time: 840, who: "Hannah Wells", for: "her mother", interest: "Harbor Memory Care", source: "Referral: physician", with: "janelle" },
  { days: 9, time: 660, who: "George Pappas", for: "himself", interest: "Independent Living", source: "Google search", lunch: true, with: "cynthia" },
];

export interface Enquiry { name: string; mins: number; source: string; interest: string; status: "New" | "Contacted" | "Tour booked" | "Nurturing"; msg: string }
export const enquiries: Enquiry[] = [
  { name: "Linda Kessler", mins: 18, source: "Website chat", interest: "Independent Living", status: "New", msg: "Do you have a two-bedroom with a balcony available in January?" },
  { name: "Mark Delacroix", mins: 64, source: "AI search (ChatGPT)", interest: "Assisted Living", status: "New", msg: "My dad needs help with medications. Is that included or extra?" },
  { name: "Jennifer Soto", mins: 60 * 5, source: "Google Business Profile", interest: "Harbor Memory Care", status: "Contacted", msg: "Called about memory care pricing; sending Harbor brochure." },
  { name: "David & Mei Chen", mins: 60 * 22, source: "AI search (ChatGPT)", interest: "Assisted Living", status: "Tour booked", msg: "Tour today 2:00 pm." },
  { name: "Carol Brandt", mins: 60 * 30, source: "A Place for Mom", interest: "Independent Living", status: "Contacted", msg: "Comparing three communities; wants pet policy in writing." },
  { name: "Steve Hollister", mins: 60 * 47, source: "Google search", interest: "Independent Living", status: "Nurturing", msg: "Planning a move in spring; on the newsletter." },
  { name: "Anita Ramos", mins: 60 * 52, source: "Referral: Rosa Hernández", interest: "Independent Living", status: "Contacted", msg: "Rosa’s friend from church; prefers Spanish." },
];

export const followUps = [
  { who: "Carol Brandt", what: "Email pet policy and NB2B floor plan", due: 0, overdue: false },
  { who: "Jennifer Soto", what: "Call back after she reads the Harbor brochure", due: 1, overdue: false },
  { who: "Walter & Sue Hanley", what: "Thank-you note and pricing sheet after Saturday tour", due: -1, overdue: true },
  { who: "Steve Hollister", what: "Invite to Dessert Soirée, Nov 21", due: 3, overdue: false },
];

export const funnel = [
  { label: "Enquiries", value: 152 },
  { label: "Tours", value: 63 },
  { label: "Deposits", value: 15 },
  { label: "Move-ins", value: 11 },
];

/* ------------------------------------------------------------ scorecard */

export interface ScoreRow { k: string; now: number; prev: number; target: number; fmt?: "pct" | "num" | "dec"; invert?: boolean }
export const scoreRows: ScoreRow[] = [
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

export const topPosts = [
  { title: "Walk to End Alzheimer’s", kind: "Story + 14 photos", reach: 1840, opens: 162, photo: "/img/friends-walking.jpg" },
  { title: "Apple Hill Orchards trip: 3 seats left", kind: "Event", reach: 1210, opens: 158, photo: "/img/vineyard.jpg" },
  { title: "Paint and Sip by Cassandra", kind: "Story", reach: 1105, opens: 140, photo: "/img/art-studio.jpg" },
  { title: "The November calendar is live", kind: "Calendar", reach: 980, opens: 151, photo: "/img/lobby.jpg" },
];

export const highlights = [
  "Every family on the list heard from us at least once a week; 181 of 186 opened at least one message.",
  "Enquiries from AI search more than doubled (3 to 7) after the FAQ and live menu pages went up.",
  "“memory care Folsom” climbed from 9th to 4th on Google.",
  "Two Bedroom Grand (NC6) alert went to 14 people and produced 2 tours within a week.",
  "Calendar and menus were current every day of the month, with no gaps.",
];
