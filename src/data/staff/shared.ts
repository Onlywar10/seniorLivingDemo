// Staff back end: the types and helpers every community's staff data shares.
// Each community's operational records live in ./<slug>.ts; read them through getStaffData(slug) in ./index.ts.
// Times are stored as offsets from now / today so the screens always read as current.
import { addDays, dayShort, fmtTime, hash, iso, nowMinutes, today, MONTHS } from "@/lib/clock";
import { isCommunity, type CommunitySlug } from "@/lib/sites";

/* ------------------------------------------------------------ community selection */

/** The community the staff screens show, or "all" for the Wrenhaven-wide overview. */
export type StaffScope = CommunitySlug | "all";
export const STAFF_COOKIE = "wh-staff-community";
export const DEFAULT_STAFF_COMMUNITY: CommunitySlug = "alder-bend";
export const parseStaffScope = (v: string | null | undefined): StaffScope => (v === "all" ? "all" : isCommunity(v) ? v : DEFAULT_STAFF_COMMUNITY);

/** A page on a community's public website: siteHref("kestrel-point", "/calendar") → "/kestrel-point/calendar". */
export const siteHref = (scope: StaffScope, path = "/") => (scope === "all" ? path : path === "/" ? `/${scope}` : `/${scope}${path}`);

/* ------------------------------------------------------------ people */

export interface StaffPerson { name: string; initials: string; role: string; color: string }
/** Keys are unique across communities, so one lookup (staffPeople in ./people.ts) serves every screen. */
export type PersonKey = string;

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

/** Deterministic daily website visits for the last n days (ending today). `scale` sizes them to the community. */
export function dailyVisits(n = 30, offset = 0, scale = 1) {
  const t = today();
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(t, i - n + 1 - offset);
    const wd = d.getUTCDay();
    const weekly = [150, 232, 218, 210, 214, 196, 142][wd];
    const trend = 1 + (i / n) * 0.16 - offset / 300;
    const noise = (hash(iso(d)) % 40) - 20;
    return { date: iso(d), label: `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`, v: Math.round((weekly * trend + noise) * scale) };
  });
}

/* ------------------------------------------------------------ record types */

export interface Activity { who: PersonKey; mins: number; text: string; tone?: "ok" | "wait" | "info" }

export interface Send {
  id: string; title: string; audience: string; channels: string; by: PersonKey; mins: number;
  sent: number; delivered: number; opened: number; replied: number; lang?: number;
}

export interface Template { k: string; label: string; text: string }

export interface Thread {
  id: string; from: string; relation: string; resident: string; apt: string; lang: string;
  unread: boolean; mins: number; subject: string;
  msgs: { me?: boolean; who?: string; text: string; original?: string; mins: number }[];
}

export interface Contact {
  resident: string; apt: string; lantern?: boolean; contact: string; relation: string;
  phone: string; email: string; channel: "SMS" | "Email" | "SMS + email"; lang: string;
  sms: boolean; emailOpt: boolean; photos: boolean;
}

/** A family contact with a stable invented phone number (in the community's area code) and email. */
export function contactMaker(prefixes: string[], area = "916") {
  return (resident: string, apt: string, contact: string, relation: string, channel: Contact["channel"], lang = "English", opts = "111", lantern = false): Contact => {
    const h = hash(contact);
    const local = contact.toLowerCase().split(" ")[0].replace(/[^a-z]/g, "");
    const last = contact.toLowerCase().split(" ").slice(-1)[0].normalize("NFD").replace(/[^a-z]/g, "");
    const domains = ["gmail.com", "yahoo.com", "comcast.net", "icloud.com", "outlook.com", "sbcglobal.net"];
    return {
      resident, apt, lantern, contact, relation, channel, lang,
      phone: `(${area}) ${prefixes[h % prefixes.length]}-${String(1000 + (h % 8999)).padStart(4, "0")}`,
      email: `${local}.${last}@${domains[h % domains.length]}`,
      sms: opts[0] === "1", emailOpt: opts[1] === "1", photos: opts[2] === "1",
    };
  };
}

export interface Approval {
  id: string; by: PersonKey; mins: number; kind: string; title: string; detail: string; photo?: string;
  channels: string[]; note?: string; diff?: [string, string];
}

export interface Ranking { q: string; pos: number; change: number; volume: number; url: string; hist: number[] }

export type Engine = "ChatGPT" | "Google AI Overviews" | "Perplexity" | "Gemini";

export interface Answer {
  engine: Engine; prompt: string; text: string; accuracy: "accurate" | "partly" | "wrong";
  recommended: boolean; position?: number; competitors: string[]; mins: number; cites?: string;
}

export interface WrongFact {
  id: string; claim: string; truth: string; engines: Engine[]; source: string; fix: string; fixUrl: string;
  status: "fixed" | "in progress" | "monitoring"; mins: number;
}

export interface Waiter { name: string; plan: string; joinedDays: number; deposit: boolean; note?: string }

export interface Tour { days: number; time: number; who: string; for: string; interest: "Independent Living" | "Assisted Living" | "Lantern Memory Care"; source: string; lunch?: boolean; note?: string; with: PersonKey }

export interface Enquiry { name: string; mins: number; source: string; interest: string; status: "New" | "Contacted" | "Tour booked" | "Nurturing"; msg: string }

export interface ScoreRow { k: string; now: number; prev: number; target: number; fmt?: "pct" | "num" | "dec"; invert?: boolean }

export interface PhotoPerson { name: string; consent: boolean }
export interface PhotoPreset { k: string; src: string; label: string; title: string; caption: string; people: PhotoPerson[] }

/** One "Post once" starting point. `match` finds the real calendar event the preset is about (its date, time and seats). */
export interface PublishPreset { title: string; date: string; time: string; room: string; cap: string; desc: string; photo: string; titleEs: string }

/* ------------------------------------------------------------ one community's staff data */

export interface StaffData {
  slug: CommunitySlug;
  /** How the community appears on staff screens, texts, emails and flyers. */
  brand: {
    name: string; short: string; city: string; phone: string; domain: string; facebook: string;
    /** "Hello from Fairhollow!" */
    hello: string;
  };
  people: Record<PersonKey, StaffPerson>;
  /** Who does what, so screens can say "Waiting for Renata" or "for Priya Nandakumar". */
  roles: { approver: PersonKey; tours: PersonKey; lantern: PersonKey; menus: PersonKey; calendar: PersonKey; gbpReplies: PersonKey };

  community: { residents: number; lanternResidents: number; apartments: number; occupied: number; families: number; lanternFamilies: number; contacts: number; smsReachable: number; emailReachable: number };
  languages: { k: string; n: number }[];
  /** Website traffic relative to the baseline curve in dailyVisits(). */
  visitScale: number;

  // dashboard
  weekKpis: { familiesReached: number; postsThisWeek: number; postsLastWeek: number; messagesSent: number; deliveredRate: number; openRate: number; openRateLast: number; toursBooked: number; toursLast: number };
  enquirySources: { label: string; value: number }[];
  enquirySourcesPrev: number[];
  activity: Activity[];
  /** Website freshness checklist. `mins` → "3 h ago"; `at` → a time today. */
  freshness: { title: string; detail: string; mins?: number; at?: number }[];

  // messages
  sends: Send[];
  templates: Template[];
  /** Two languages previewed in the composer, with the templates translated. */
  translations: { lang: string; code: string; n: number; tpl: Record<string, string> }[];
  alsoTranslated: string;
  composerEvent: string;
  threads: Thread[];
  /** Suggested replies by thread id. */
  suggestions: Record<string, string>;

  // families
  contacts: Contact[];
  importNote: string;
  residentNames: string[];
  lanternNames: string[];

  // publishing
  publish: {
    /** Finds the calendar event the "Event" preset is about. */
    eventTitle: string;
    eventDate: string;
    event: Omit<PublishPreset, "date" | "time" | "cap">;
    menu: PublishPreset;
    photo: Omit<PublishPreset, "date">;
    pdf: PublishPreset & { file: string };
    reserveEn: string;
    reserveEs: string;
    flyerAsk: string;
    flyerPost: string;
    /** Translated texts go out in these languages. */
    otherLangs: string;
    translated: number;
    lanternTranslated: number;
    lanternEmails: number;
    digestExtra: { title: string; when: string; photo: string };
  };
  photoPresets: PhotoPreset[];
  menus: { sub: string; screens: string[] };
  approvals: Approval[];
  approvedRecently: { title: string; by: PersonKey; mins: number; ok: boolean; note?: string }[];
  approvalRules: { what: string; who: string }[];

  // SEO
  rankings: Ranking[];
  searchWeekly: { clicks: number[]; impressions: number[] };
  seo: { avgPos: number; avgPosDelta: number; ctrDelta: number; pagesIndexed: number };
  gbp: { views: number; viewsPrev: number; calls: number; callsPrev: number; directions: number; directionsPrev: number; clicks: number; clicksPrev: number; rating: number; reviews: number; newReviews: number };
  reviewsRecent: { name: string; stars: number; mins: number; text: string }[];
  topPages: { url: string; title: string; clicks: number; change: number }[];
  vitals: { k: string; v: string; note: string }[];

  // GEO
  engines: { k: Engine; short: string; score: number; prev: number; color: string }[];
  geoTrend: number[];
  answers: Answer[];
  wrongFacts: WrongFact[];

  // apartments
  planUnits: Record<string, { units: number; notice: number }>;
  occupancyDelta: number;
  waitlist: Waiter[];
  alerts: { plan: string; text: string; days: number; sent: number; opened: number; tours: number }[];
  moves: { ins: { name: string; plan: string; apt: string; days: number }[]; outs: { name: string; plan: string; days: number; note: string }[] };

  // tours
  tours: Tour[];
  tourLunch: string;
  enquiries: Enquiry[];
  followUps: { who: string; what: string; due: number; overdue: boolean }[];
  funnel: { label: string; value: number }[];
  firstReply: { value: string; delta: number };

  // scorecard
  scoreRows: ScoreRow[];
  topPosts: { title: string; kind: string; reach: number; opens: number; photo: string }[];
  highlights: string[];
}

/** A stable RSVP list and waitlist for a capped event. */
export function rsvpFor(d: Pick<StaffData, "residentNames" | "lanternNames">, id: string, taken: number, waitlist: number, lantern = false) {
  const pool = lantern ? [...d.lanternNames, ...d.residentNames] : d.residentNames;
  const start = hash(id) % pool.length;
  const pick = (n: number, from: number) => Array.from({ length: n }, (_, i) => pool[(from + i * 7) % pool.length]);
  const all = pick(taken + waitlist, start);
  return { going: all.slice(0, taken), waiting: all.slice(taken) };
}
