// Surveys: every survey a community runs, made the way an event is made (from a template, a past survey or blank),
// sent as a short invitation with a personal link to a survey page, printed for anyone who prefers paper, or read
// aloud. The ready-made ones (the family survey, the resident survey, the staff pulse) are templates on a repeating
// schedule. Results are built only from the answers below: averages, the recommend score, results by group (never
// for fewer than 5 people), trends over each send, and themes from written answers, each linked to the answers
// behind it. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { addDays, dayName, dow, fmtTime, fromIso, hash, iso, MONTHS, nowMinutes, shortDate, today } from "@/lib/clock";
import { weekToken } from "@/lib/residentLink";
import { roster, type Person } from "./automations";
import { diningRequests } from "./dining";
import { getStaffData, planRows } from "./index";
import { fitnessKey, type StaffData, type StaffRole } from "./shared";
import type { L } from "./autoText";
import { BANK, TEMPLATES, THANKS, minutes, savedTemplate, type Area, type Audience, type Question, type Repeat, type Template, type Trigger } from "./surveyKit";

const first = (n = "") => n.split(" ")[0];

/* ------------------------------------------------------------ shapes */

export type SurveyStatus = "draft" | "waiting" | "scheduled" | "open" | "repeating" | "automatic" | "closed";
export type Channel = "Text" | "Email" | "Paper" | "Read aloud" | "Post";

export interface Answer { id: string; who?: string; rel?: string; group: string; lang: string; channel: Channel; at: string; answers: Record<string, string | number | string[]>;
  /** An answer that needed a person: a concern (to Feedback, named surveys only), care (a flag to the care team), a thank-you. */
  flag?: { kind: "concern" | "care" | "thanks"; note: string };
  /** The original, when written in another language (the English is in `answers`). */
  original?: string;
}
export interface Send { label: string; sent: number; answered: number; perQ: Record<string, number> }
export interface Survey {
  id: string; title: string; template?: string; templateName?: string;
  started: "template" | "copy" | "blank" | "write"; goal?: string;
  owner: StaffRole; ownerName: string; area: Area;
  audience: Audience[]; audienceLabel: string; goesTo: string;
  anonymous: boolean; status: SurveyStatus;
  sentLabel?: string; closes?: string; closesLabel?: string; nextLabel?: string;
  repeat?: Repeat; trigger?: Trigger; triggerNote?: string;
  reminder: boolean; reminderNote: string;
  questions: Question[]; thankYou: L; topic: L;
  event?: string;
  /** How people answer. */
  ways: Channel[];
  sendsTo: number; answered: number;
  byGroup: { label: string; sent: number; answered: number }[];
  history: Send[];
  answers: Answer[];
  /** Waiting for approval: who wrote it and who approves. */
  approval?: { by: string; to: string; at: string };
  approvedNote?: string;
}

/* ------------------------------------------------------------ helpers */

const monthStart = (back: number) => { const t = today(); return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + back, 1)); };
const mlabel = (d: Date) => `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
const nextFriday = () => { const t = today(); return addDays(t, ((5 - dow(t) + 7) % 7) || 7); };
const roleKey = (s: StaffData, r: StaffRole) => ({ manager: s.roles.approver, events: s.roles.calendar, kitchen: s.roles.menus, sales: s.roles.tours, lantern: s.roles.lantern, desk: s.roles.desk, caregiver: s.roles.calendar, fitness: fitnessKey(s) })[r];
const nameOf = (s: StaffData, r: StaffRole) => s.people[roleKey(s, r)]?.name ?? "";

/** A 1–5 answer from a deterministic spread around a target average. */
function rate(seed: string, target: number): number {
  const a = Math.min(0.95, Math.max(0.02, target - 3.78));
  const b = Math.max(0, 0.85 - a);
  const r = (hash(seed) % 1000) / 1000;
  return r < a ? 5 : r < a + b ? 4 : r < a + b + 0.1 ? 3 : r < a + b + 0.13 ? 2 : 1;
}
/** 0–10 for the recommend question, around a target. */
function nps(seed: string, target: number): number {
  const r = (hash(seed) % 1000) / 1000;
  const base = Math.round(target + (r - 0.5) * 4);
  return Math.max(0, Math.min(10, base));
}

interface Written { text: string; lang?: string; original?: string; flag?: Answer["flag"] }

/* ------------------------------------------------------------ what people wrote (each used once) */

function familyWritten(s: StaffData): Written[] {
  const desk = s.people[s.roles.desk]?.name ?? "the front desk";
  return [
    { text: "More evening events please, but earlier. 7 pm is too late for Mom." },
    { text: "The evening concerts start too late for Dad. Could they be at 5?" },
    { text: "Evening events would be great if they started before dark." },
    { text: "Mom would go to the evening movies if they started earlier." },
    { text: "Something in the evenings on weekends. It’s very quiet after dinner." },
    { text: "Evening programs run late; Dad is tired by 7." },
    { text: "Could the evening trivia move to the late afternoon?" },
    { text: "We’d come to evening events if we heard about them earlier in the week." },
    { text: "Earlier start times for evening music would help." },
    { text: "Dad says the evenings are long. More to do after dinner." },
    { text: "Evening events are at a hard time for families who work. 6 pm would be better." },
    { text: "Photos from the bus trips, please!" },
    { text: "Send photos a bit more often." },
    { text: "The newsletter is lovely. More photos of residents doing things." },
    { text: "More notice before trips so we can join Mom." },
    { text: "Parking for visitors on Sundays is hard to find." },
    { text: "Parking is tight on weekends." },
    { text: "Texts at 8 am on weekends are early for us on the West Coast." },
    { text: "Fewer texts about the menu; the Sunday email is enough." },
    { text: "I love getting the messages in Spanish. My dad looks happy in the photos.", lang: "Spanish", original: "Me encanta recibir los mensajes en español. Mi papá se ve feliz en las fotos." },
    { text: "Nothing, honestly. We’re very happy." },
    { text: `Please thank ${first(desk)} at the front desk. Always so kind when we visit.`, flag: { kind: "thanks", note: `Passed to ${desk}` } },
    { text: "Mom has been losing weight. Is she eating enough?", flag: { kind: "care", note: "Flagged to the care team. Not kept here as a care record." } },
  ];
}
function diningWritten(s: StaffData, mainName: string): Written[] {
  const chef = first(s.people[s.roles.menus]?.name);
  const list: Written[] = [
    { text: "The salmon was overcooked and the server forgot Mom’s side twice. Nobody checked back.", flag: { kind: "concern", note: `Became a dining concern in Feedback, owned by ${chef}` } },
    { text: "Soup was cold by the time it reached the table." },
    { text: "Dinner came very late on Tuesday." },
    { text: "More fish, please, and not always fried." },
    { text: "The Sunday brunch is the highlight of the week." },
    { text: "Lighter portions at dinner would help." },
    { text: `The new specials at ${mainName} are wonderful.` },
    { text: "Service is slow at the 5:30 seating." },
    { text: "More vegetarian choices." },
    { text: "Please keep the crab cakes!" },
    { text: "Tables by the window fill up fast." },
    { text: "More grilled fish, please.", lang: "Spanish", original: "Más pescado a la plancha, por favor." },
  ];
  return list;
}
function residentWritten(s: StaffData): Written[] {
  const desk = s.people[s.roles.desk]?.name ?? "the front desk";
  return [
    { text: `Thank you to ${first(desk)} at the front desk for helping me with my phone.`, flag: { kind: "thanks", note: `Passed to ${desk}, without a name` } },
    { text: "My room hasn’t been cleaned in a week.", flag: { kind: "concern", note: "Anonymous: flagged here only, no name and no Feedback item" } },
    { text: "I’d like more music in the afternoons." },
    { text: "The bus trips are my favorite." },
    { text: "More chair exercise classes, please." },
  ];
}

/* ------------------------------------------------------------ building answers */

function build(slug: CommunitySlug, sv: Omit<Survey, "answers" | "answered" | "byGroup"> & { answeredN: number; targets: Record<string, number>; written: Written[]; pool: Person[]; groupOf?: (p: Person | undefined, i: number) => string; channels: Channel[]; atDays: number }): Survey {
  const s = getStaffData(slug);
  const t = today();
  const answers: Answer[] = [];
  const text = sv.questions.filter((x) => x.type === "text");
  const langOf = (i: number) => {
    // The community's languages, in proportion.
    const total = s.languages.reduce((n, l) => n + l.n, 0);
    let x = hash(`${sv.id}:lang:${i}`) % total;
    for (const l of s.languages) { if (x < l.n) return l.k; x -= l.n; }
    return "English";
  };
  for (let i = 0; i < sv.answeredN; i++) {
    const seed = `${slug}:${sv.id}:${i}`;
    const p = sv.anonymous ? undefined : sv.pool[i % Math.max(1, sv.pool.length)];
    const a: Answer["answers"] = {};
    for (const qq of sv.questions) {
      if (qq.type === "rating") a[qq.id] = rate(`${seed}:${qq.id}`, sv.targets[qq.id] ?? 4.2);
      if (qq.type === "nps") a[qq.id] = nps(`${seed}:${qq.id}`, sv.targets[qq.id] ?? 8);
      if (qq.type === "yesno") a[qq.id] = hash(`${seed}:${qq.id}`) % 100 < (sv.targets[qq.id] ?? 80) ? "Yes" : "No";
      if (qq.type === "one" && qq.options) a[qq.id] = qq.options[hash(`${seed}:${qq.id}`) % qq.options.length].en;
      if (qq.type === "many" && qq.options) a[qq.id] = qq.options.filter((_, k) => hash(`${seed}:${qq.id}:${k}`) % 3 === 0).map((x) => x.en);
    }
    // Written answers: the ones people actually wrote, each once.
    const w = sv.written[i];
    let flag: Answer["flag"];
    let original: string | undefined;
    if (w && text.length) {
      const target = /wrong|went wrong/i.test(w.text) || /overcooked|cold by|very late/.test(w.text) ? text.find((x) => x.id === "wrong") ?? text[0] : text.find((x) => x.id !== "wrong") ?? text[0];
      a[target.id] = w.text;
      if (target.id === "wrong" && "food" in a) a.food = 2;
      flag = w.flag;
      original = w.original;
    }
    const lang = w?.lang ?? (sv.audience.includes("staff") ? "English" : langOf(i));
    const ch = sv.channels[hash(`${seed}:ch`) % sv.channels.length];
    const day = addDays(t, -(sv.atDays - (i % Math.max(1, sv.atDays))));
    answers.push({ id: `${sv.id}-a${i}`, who: p?.name, rel: p ? (p.kind === "resident" ? "Resident" : `${p.relation} of ${p.resident}`) : undefined, group: sv.groupOf ? sv.groupOf(p, i) : sv.audience.includes("staff") ? "Staff" : p?.kind === "resident" ? "Residents" : "Families", lang, channel: ch, at: shortDate(day), answers: a, flag, original });
  }
  const groups = new Map<string, number>();
  answers.forEach((x) => groups.set(x.group, (groups.get(x.group) ?? 0) + 1));
  const byGroup = [...groups.entries()].map(([label, n]) => ({ label, answered: n, sent: Math.round((n / Math.max(1, sv.answeredN)) * sv.sendsTo) }));
  const { answeredN: _a, targets: _t, written: _w, pool: _p, groupOf: _g, channels: _c, atDays: _d, ...rest } = sv;
  void _a; void _t; void _w; void _p; void _g; void _c; void _d;
  return { ...rest, answers, answered: answers.length, byGroup };
}

/* ------------------------------------------------------------ the community's surveys */

const cache = new Map<string, Survey[]>();
export function surveysOf(slug: CommunitySlug): Survey[] {
  const k = `${slug}|${iso(today())}`;
  const hit = cache.get(k);
  if (hit) return hit;
  for (const key of cache.keys()) if (key.startsWith(slug)) cache.delete(key);
  const out = make(slug);
  cache.set(k, out);
  return out;
}

function make(slug: CommunitySlug): Survey[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const ppl = roster(slug);
  const families = ppl.filter((p) => p.kind === "family");
  const residents = ppl.filter((p) => p.kind === "resident" && !p.lantern);
  const T = (id: string) => TEMPLATES.find((x) => x.id === id)!;
  const main = c.venueOrder[0];
  const mainName = c.venues[main].name;
  const fam = s.community.families;
  const out: Survey[] = [];
  const approver = nameOf(s, "manager");

  // Family satisfaction: before go-live, at day 90, and every six months since. Named, so a concern can be followed up.
  const famT = T("t-family");
  const last = monthStart(-1), mid = monthStart(-4), firstSend = monthStart(-7);
  out.push(build(slug, {
    id: "family", title: famT.name, template: famT.id, templateName: famT.name, started: "template", owner: "manager", ownerName: approver, area: "community",
    audience: ["families"], audienceLabel: "Every family who gets our news", goesTo: `${fam} families`,
    anonymous: false, status: "repeating", sentLabel: mlabel(last), closesLabel: mlabel(addDays(last, 14)), nextLabel: mlabel(monthStart(5)),
    repeat: "6 months", trigger: "move-in-30", triggerNote: "Also at day 90 for each new family", reminder: true, reminderNote: "One reminder after 3 days (sent)",
    questions: famT.questions, thankYou: THANKS, topic: famT.topic, ways: ["Text", "Email", "Post"], sendsTo: fam,
    history: [
      { label: `${mlabel(firstSend)} · before go-live`, sent: Math.round(fam * 0.97), answered: Math.round(fam * 0.97 * 0.41), perQ: { know: 3.4, part: 3.3, useful: 3.9, nps: 7.4 } },
      { label: `${mlabel(mid)} · day 90`, sent: Math.round(fam * 0.99), answered: Math.round(fam * 0.99 * 0.55), perQ: { know: 4.0, part: 3.8, useful: 4.2, nps: 8.0 } },
    ],
    answeredN: Math.round(fam * 0.64), targets: { know: 4.5, part: 4.1, useful: 4.45, nps: 8.3 },
    written: familyWritten(s), pool: families, channels: ["Text", "Text", "Email", "Email", "Text"], atDays: 14,
    groupOf: (_p, i) => (i % 9 === 4 ? "By post" : ["Text", "Email"][i % 2] === "Text" ? "By text" : "By email"),
  }));

  // Dining experience: Rafael, from the template, to everyone booked at the main restaurant this week, closing Friday.
  const dinT = T("t-dining");
  const dr = diningRequests(slug);
  const diners = dr.meals.filter((m) => m.venue === main).reduce((n, m) => n + m.booked, 0);
  const sentOn = addDays(t, -3);
  const fri = nextFriday();
  out.push(build(slug, {
    id: "dining", title: dinT.name, template: dinT.id, templateName: dinT.name, started: "template", owner: "kitchen", ownerName: nameOf(s, "kitchen"), area: "dining",
    audience: ["residents", "families"], audienceLabel: `Residents and families who ate at ${mainName} this week`, goesTo: `${diners} people who ate at ${mainName}`,
    anonymous: false, status: "open", sentLabel: `${dayName(sentOn)}, ${mlabel(sentOn)}`, closes: iso(fri), closesLabel: `${dayName(fri)}, ${mlabel(fri)}`,
    reminder: true, reminderNote: nowMinutes() >= 10 * 60 ? "One reminder sent this morning at 10:00 am to anyone who hadn’t answered" : "One reminder today at 10:00 am to anyone who hasn’t answered",
    questions: dinT.questions, thankYou: THANKS, topic: dinT.topic, ways: ["Text", "Email", "Paper"], sendsTo: diners,
    approvedNote: "From an approved template: sent without asking again",
    history: [
      { label: `${mlabel(monthStart(-6))}`, sent: Math.round(diners * 0.9), answered: Math.round(diners * 0.9 * 0.35), perQ: { food: 3.8, service: 4.0 } },
      { label: `${mlabel(monthStart(-2))}`, sent: Math.round(diners * 0.95), answered: Math.round(diners * 0.95 * 0.64), perQ: { food: 4.0, service: 4.2 } },
    ],
    answeredN: Math.round(diners * 0.38), targets: { food: 4.15, service: 4.3 },
    written: diningWritten(s, mainName), pool: [...families.filter((p) => !p.lantern), ...residents], channels: ["Text", "Text", "Email", "Paper"], atDays: 3,
    groupOf: (p) => (p?.kind === "resident" ? "Residents" : "Families"),
  }));

  // After an event: sent the day after every bus trip, two questions.
  const evT = T("t-event");
  const trips = c.staffEventsBetween(addDays(t, -21), 22, iso(t)).flatMap((d) => d.events).filter((e) => (e.cat === "trips" || /^Bus Trip/.test(e.title)) && !e.lantern && e.date < iso(t));
  const lastTrip = trips[trips.length - 1];
  const tripBooked = lastTrip?.taken ?? 12;
  out.push(build(slug, {
    id: "trips", title: "After a bus trip", template: evT.id, templateName: evT.name, started: "template", owner: "events", ownerName: nameOf(s, "events"), area: "activities",
    audience: ["residents"], audienceLabel: "Everyone who went on the trip", goesTo: "Everyone booked on each trip", event: lastTrip ? lastTrip.title.replace(/^Bus Trip: /, "") : "the bus trip",
    anonymous: false, status: "automatic", trigger: "after-trip", triggerNote: "The day after every bus trip, at 10:00 am", reminder: false, reminderNote: "No reminder: it’s two quick questions",
    sentLabel: lastTrip ? `${dayName(addDays(fromIso(lastTrip.date), 1))}, ${mlabel(addDays(fromIso(lastTrip.date), 1))}` : undefined,
    questions: evT.questions.filter((x) => x.id !== "evnote"), thankYou: THANKS, topic: evT.topic, ways: ["Text", "Read aloud"], sendsTo: tripBooked,
    history: trips.slice(-4, -1).map((e, i) => ({ label: `${e.title.replace(/^Bus Trip: /, "")} · ${mlabel(fromIso(e.date))}`, sent: e.taken ?? 12, answered: Math.round((e.taken ?? 12) * (0.6 + i * 0.05)), perQ: { enjoy: [4.4, 4.6, 4.3][i % 3], again: [86, 91, 80][i % 3] } })),
    answeredN: Math.round(tripBooked * 0.7), targets: { enjoy: 4.4, again: 88 },
    written: [], pool: residents, channels: ["Text", "Text", "Read aloud"], atDays: 1,
    groupOf: (_p, i) => (i % 4 === 3 ? "Read aloud" : "By text"),
  }));

  // Resident satisfaction: printed, or read aloud. Anonymous.
  const resT = T("t-resident");
  const resN = s.community.residents - s.community.lanternResidents;
  out.push(build(slug, {
    id: "resident", title: resT.name, template: resT.id, templateName: resT.name, started: "template", owner: "manager", ownerName: approver, area: "community",
    audience: ["residents"], audienceLabel: "Every resident, on paper or read aloud", goesTo: `${resN} residents · ${s.community.lanternResidents} in Lantern, asked in person`,
    anonymous: true, status: "repeating", sentLabel: mlabel(last), closesLabel: mlabel(addDays(last, 21)), nextLabel: mlabel(monthStart(5)), repeat: "6 months", reminder: false, reminderNote: "No reminder: the front desk hands out a second copy",
    questions: resT.questions, thankYou: THANKS, topic: resT.topic, ways: ["Paper", "Read aloud", "Text"], sendsTo: resN,
    history: [{ label: `${mlabel(firstSend)} · before go-live`, sent: resN, answered: Math.round(resN * 0.26), perQ: { week: 2.9, part: 3.3, ideas: 2.5 } }],
    answeredN: Math.round(resN * 0.3), targets: { week: 3.55, part: 3.7, ideas: 3.2 },
    written: residentWritten(s), pool: [], channels: ["Paper", "Paper", "Read aloud", "Text"], atDays: 21,
    groupOf: (_p, i) => (i % 3 === 1 ? "Read aloud" : "On paper"),
  }));

  // The staff pulse: monthly, anonymous.
  const stT = T("t-staff");
  const staffN = Object.keys(s.people).length;
  out.push(build(slug, {
    id: "staff", title: stT.name, template: stT.id, templateName: stT.name, started: "template", owner: "manager", ownerName: approver, area: "staff",
    audience: ["staff"], audienceLabel: "Everyone on the team", goesTo: `${staffN} staff`, anonymous: true, status: "repeating", repeat: "monthly",
    sentLabel: mlabel(addDays(monthStart(0), dow(monthStart(0)) === 1 ? 0 : (8 - dow(monthStart(0))) % 7)), nextLabel: "The first Monday of next month", reminder: true, reminderNote: "One reminder after 3 days",
    questions: stT.questions, thankYou: THANKS, topic: stT.topic, ways: ["Text", "Email"], sendsTo: staffN,
    history: [
      { label: MONTHS[(t.getUTCMonth() + 10) % 12].slice(0, 3), sent: staffN, answered: staffN - 2, perQ: { stime: 3.1, sknow: 2.8, srec: 3.4 } },
      { label: MONTHS[(t.getUTCMonth() + 11) % 12].slice(0, 3), sent: staffN, answered: staffN - 1, perQ: { stime: 3.9, sknow: 3.7, srec: 4.0 } },
    ],
    answeredN: staffN - 1, targets: { stime: 4.3, sknow: 4.2, srec: 4.4 },
    written: [{ text: "The photo post from my phone is the part I use every day." }, { text: "Menu import from the PDF still needs a second look on soups." }],
    pool: [], channels: ["Text", "Email"], atDays: 5, groupOf: () => "Staff",
  }));

  // A draft: "Evening events", written with "Write it for me", waiting for the approver.
  const nora = nameOf(s, "events");
  out.push({
    id: "evening", title: "Evening events", started: "write", goal: "Find out why fewer residents come to evening events", owner: "events", ownerName: nora, area: "activities",
    audience: ["residents"], audienceLabel: "Every resident who gets texts, plus paper copies at the front desk", goesTo: `${residents.length} residents by text · paper copies for the rest`,
    anonymous: true, status: "waiting", closesLabel: mlabel(addDays(t, 16)), reminder: true, reminderNote: "One reminder after 3 days",
    questions: ["evtime", "evwhy", "evwish", "week"].map((id) => ({ ...BANK[id] })), thankYou: THANKS, topic: { en: "evening events", es: "los eventos de la tarde", zh: "傍晚活动" },
    ways: ["Text", "Paper", "Read aloud"], sendsTo: residents.length, answered: 0, byGroup: [], history: [], answers: [],
    approval: { by: nora, to: approver, at: `Yesterday, ${fmtTime(16 * 60 + 40)}` },
  });

  // A past dining survey, to copy from ("Dining survey · Sep · 64% replied").
  const sep = monthStart(-2);
  out.push({
    id: "dining-past", title: "Dining survey", template: dinT.id, templateName: dinT.name, started: "template", owner: "kitchen", ownerName: nameOf(s, "kitchen"), area: "dining",
    audience: ["residents", "families"], audienceLabel: `Residents and families who ate at ${mainName}`, goesTo: `${Math.round(diners * 0.95)} people`, anonymous: false, status: "closed",
    sentLabel: mlabel(sep), closesLabel: mlabel(addDays(sep, 10)), reminder: true, reminderNote: "One reminder after 3 days (sent)", questions: dinT.questions, thankYou: THANKS, topic: dinT.topic,
    ways: ["Text", "Email", "Paper"], sendsTo: Math.round(diners * 0.95), answered: Math.round(diners * 0.95 * 0.64), byGroup: [], history: [], answers: [],
  });
  return out;
}

export const surveyById = (slug: CommunitySlug, id: string) => surveysOf(slug).find((x) => x.id === id);

/** Templates: the built-in ones, approved and ready, plus any the community saved. */
export function templatesOf(slug: CommunitySlug): Template[] {
  const s = getStaffData(slug);
  return [...TEMPLATES, savedTemplate(first(nameOf(s, "events")))];
}

/** Who may create, and for which area: the administrator and approvers anything; area owners their own area. */
export const SURVEY_AREA: Partial<Record<StaffRole, Area | "all">> = { manager: "all", events: "all", kitchen: "dining", lantern: "lantern" };
export const mayManage = (as: StaffRole, sv: { owner: StaffRole; area: Area }) => SURVEY_AREA[as] === "all" || sv.owner === as || SURVEY_AREA[as] === sv.area;

/* ------------------------------------------------------------ results */

export interface QResult { q: Question; n: number; avg?: number; yes?: number; options?: { label: string; n: number }[]; nps?: { score: number; promoters: number; detractors: number }; texts?: Answer[] }
export interface Theme { name: string; n: number; mostly?: string; quotes: Answer[]; ids: string[] }

export function results(sv: Survey): { rate: number; avg: number; qs: QResult[]; themes: Theme[]; hidden: boolean; flagged: Answer[] } {
  const rate = sv.sendsTo ? Math.round((sv.answered / sv.sendsTo) * 100) : 0;
  // Anonymous: nothing shows until at least 5 people have answered.
  const hidden = sv.anonymous && sv.answered < 5;
  const qs: QResult[] = sv.questions.map((q) => {
    const got = sv.answers.filter((a) => a.answers[q.id] !== undefined && a.answers[q.id] !== "");
    const vals = got.map((a) => a.answers[q.id]);
    const r: QResult = { q, n: got.length };
    if (q.type === "rating") r.avg = vals.length ? vals.reduce((n: number, v) => n + Number(v), 0) / vals.length : undefined;
    if (q.type === "yesno") r.yes = vals.length ? Math.round((vals.filter((v) => v === "Yes").length / vals.length) * 100) : undefined;
    if (q.type === "one" || q.type === "many") r.options = (q.options ?? []).map((o) => ({ label: o.en, n: vals.filter((v) => (Array.isArray(v) ? v.includes(o.en) : v === o.en)).length }));
    if (q.type === "nps" && vals.length) {
      const p = vals.filter((v) => Number(v) >= 9).length, d = vals.filter((v) => Number(v) <= 6).length;
      r.nps = { score: Math.round(((p - d) / vals.length) * 100), promoters: p, detractors: d };
      r.avg = vals.reduce((n: number, v) => n + Number(v), 0) / vals.length;
    }
    if (q.type === "text") r.texts = got;
    return r;
  });
  const ratings = qs.filter((x) => x.q.type === "rating" && x.avg !== undefined);
  const avg = ratings.length ? ratings.reduce((n, x) => n + (x.avg ?? 0), 0) / ratings.length : 0;
  return { rate, avg, qs, themes: themesOf(sv), hidden, flagged: sv.answers.filter((a) => a.flag) };
}

/** Kinlight groups written answers into themes by what they mention. Every theme links to the answers behind it. */
const THEMES: { name: string; re: RegExp; parts?: { label: string; re: RegExp }[] }[] = [
  { name: "Evening events", re: /evening|after dinner|long\. More to do/i, parts: [{ label: "timing", re: /late|early|earlier|start|before dark|by 7|\b[5-7] ?pm|afternoon|at 5|hard time/i }, { label: "more to do", re: /more to do|quiet|something/i }] },
  { name: "Photos", re: /photo/i },
  { name: "Notice before trips", re: /notice before trips|heard about them earlier/i },
  { name: "Parking", re: /parking/i },
  { name: "How often we text", re: /texts? at|fewer texts|8 am/i },
  { name: "Service at the table", re: /server|service|slow|checked back|very late/i },
  { name: "Fish", re: /fish|salmon/i },
  { name: "Food temperature", re: /cold/i },
  { name: "Portions", re: /portion/i },
  { name: "Praise", re: /wonderful|highlight|keep the|best trip|happy|love getting|kind/i },
  { name: "Afternoon activities", re: /afternoon|exercise|music in/i },
];
function themesOf(sv: Survey): Theme[] {
  const texts = sv.answers.filter((a) => Object.entries(a.answers).some(([k, v]) => typeof v === "string" && sv.questions.find((q) => q.id === k)?.type === "text"));
  const textOf = (a: Answer) => Object.entries(a.answers).filter(([k]) => sv.questions.find((q) => q.id === k)?.type === "text").map(([, v]) => String(v)).join(" ");
  const out: Theme[] = [];
  for (const th of THEMES) {
    const hits = texts.filter((a) => th.re.test(textOf(a)) && !out.some((o) => o.ids.includes(a.id)));
    if (hits.length < 2) continue;
    let mostly: string | undefined;
    if (th.parts) {
      const counts = th.parts.map((p) => ({ p, n: hits.filter((a) => p.re.test(textOf(a))).length })).sort((a, b) => b.n - a.n);
      if (counts[0].n > hits.length / 2) mostly = counts[0].p.label;
    }
    out.push({ name: th.name, n: hits.length, mostly, quotes: hits.slice(0, 3), ids: hits.map((a) => a.id) });
  }
  return out.sort((a, b) => b.n - a.n);
}

/** The latest average for each question, and the trend over each send ("Dining: 3.9 → 4.2 since May"). */
export function trend(sv: Survey): { label: string; avg: number; rate: number }[] {
  const r = results(sv);
  const avgOf = (perQ: Record<string, number>) => { const xs = sv.questions.filter((q) => q.type === "rating" && perQ[q.id] !== undefined).map((q) => perQ[q.id]); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; };
  return [...sv.history.map((h) => ({ label: h.label, avg: avgOf(h.perQ), rate: Math.round((h.answered / Math.max(1, h.sent)) * 100) })), ...(sv.answered ? [{ label: sv.sentLabel ?? "Now", avg: r.avg, rate: r.rate }] : [])];
}

/* ------------------------------------------------------------ who it goes to */

/** The numbers the builder counts from: "Goes to 181 families · 12 in Spanish · 4 by post". */
export interface AudienceFacts {
  families: number; residents: number; lantern: number; staff: number; prospects: number;
  languages: { k: string; n: number }[];
  /** Families with no mobile or email on file: they get it by post. Residents who prefer paper. */
  familiesByPost: number; residentsOnPaper: number;
  areas: { k: string; n: number }[];
  interests: { k: string; share: number }[];
  events: { id: string; title: string; when: string; came: number }[];
  restaurants: { k: string; name: string; n: number }[];
  newResidents: number; newFamilies: number;
}
export function audienceFacts(slug: CommunitySlug): AudienceFacts {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const ppl = roster(slug);
  const named = ppl.filter((p) => p.kind === "resident" && !p.lantern);
  const ints = ["Music", "Cards and games", "Faith", "Outings", "Fitness", "Crafts", "Learning", "Gardening", "Movies", "Cooking"];
  const intsOf = (name: string) => { const h = hash(name); return [ints[h % 10], ints[(h >> 3) % 10]]; };
  const plans = planRows(slug);
  const al = plans.filter((p) => /assisted/i.test(p.kind ?? "")).reduce((n, p) => n + p.units, 0);
  const nonL = s.community.residents - s.community.lanternResidents;
  const alShare = Math.min(nonL, Math.round(al * 1.1));
  const dr = diningRequests(slug);
  const past = c.staffEventsBetween(addDays(t, -7), 7, iso(t)).flatMap((d) => d.events).filter((e) => !e.lantern && e.cap).slice(-6);
  return {
    families: s.community.families, residents: nonL, lantern: s.community.lanternResidents, staff: Object.keys(s.people).length, prospects: s.tours.length + s.enquiries.length,
    languages: s.languages, familiesByPost: Math.max(0, s.community.families - Math.max(s.community.smsReachable, s.community.emailReachable)), residentsOnPaper: Math.round(nonL * 0.2),
    areas: [{ k: "Independent Living", n: nonL - alShare }, { k: "Assisted Living", n: alShare }, { k: "Lantern", n: s.community.lanternResidents }],
    interests: ints.map((k) => ({ k, share: named.filter((p) => intsOf(p.name).includes(k)).length / Math.max(1, named.length) })),
    events: past.map((e) => ({ id: e.id, title: e.title, when: `${dayName(fromIso(e.date)).slice(0, 3)}, ${shortDate(fromIso(e.date))}`, came: Math.round((e.taken ?? 10) * 0.85) })),
    restaurants: c.venueOrder.map((k) => ({ k, name: c.venues[k].name, n: dr.meals.filter((m) => m.venue === k).reduce((n, m) => n + m.booked, 0) })).filter((r) => r.n > 0),
    newResidents: 2, newFamilies: 3,
  };
}

/** Who "Preview as" shows: a resident, a family member, someone who reads Spanish or Chinese, a Lantern resident and
 *  their legal representative. Real people from this community. */
export function previewPeople(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const ppl = roster(slug);
  const res = ppl.find((p) => p.kind === "resident" && !p.lantern && p.text && p.lang === "English");
  const fam = ppl.find((p) => p.kind === "family" && p.lang === "English" && !p.lantern);
  const es = ppl.find((p) => p.kind === "family" && p.lang === "Spanish");
  const zh = ppl.find((p) => p.lang === "Chinese" && p.kind !== "prospect");
  const lc = s.contacts.find((c) => c.lantern);
  return { resident: res?.name ?? "", family: fam?.name ?? "", spanish: es?.name ?? fam?.name ?? "", chinese: zh?.name ?? fam?.name ?? "", lantern: lc?.resident ?? s.lanternNames[0], legal: lc ? `${lc.contact} (${lc.relation.toLowerCase()})` : "their legal representative" };
}

/** A list line for each survey: who it's for, when, how many answered, the average and the trend. */
export function surveyRows(slug: CommunitySlug, as: StaffRole) {
  return surveysOf(slug).filter((sv) => mayManage(as, sv)).map((sv) => {
    const r = results(sv);
    const tr = trend(sv);
    const firstT = tr[0], lastT = tr[tr.length - 1];
    const rating = sv.questions.some((q) => q.type === "rating");
    return {
      id: sv.id, title: sv.title, status: sv.status, owner: sv.ownerName, area: sv.area, audience: sv.goesTo,
      when: sv.status === "waiting" ? `Written ${sv.approval?.at ?? ""}, for ${sv.approval?.to.split(" ")[0]} to approve` : sv.status === "open" ? `Sent ${sv.sentLabel}, closes ${sv.closesLabel}` : sv.status === "automatic" ? `${sv.triggerNote}` : sv.status === "repeating" ? `${sv.repeat === "monthly" ? "Monthly" : `Every ${sv.repeat}`} · last sent ${sv.sentLabel} · next ${sv.nextLabel}` : `${sv.sentLabel}`,
      rate: r.rate, answered: sv.answered, sendsTo: sv.sendsTo, anonymous: sv.anonymous,
      avg: rating && sv.answered && !r.hidden ? `${r.avg.toFixed(1)} out of 5` : undefined,
      trend: rating && tr.length > 1 && firstT.avg ? `${firstT.avg.toFixed(1)} → ${lastT.avg.toFixed(1)} since ${firstT.label.split(" ")[0]}` : undefined,
      note: sv.status === "closed" ? `${r.rate}% replied` : undefined,
      mine: sv.owner === as,
    };
  });
}

/* ------------------------------------------------------------ links to the survey page */

/** A personal link: it knows who it's for, or is anonymous if the survey is. */
export function surveyToken(sv: Pick<Survey, "id" | "anonymous">, name: string) {
  return sv.anonymous ? `${sv.id}~a${(hash(sv.id + name) % 0xffffff).toString(36)}` : `${sv.id}~${weekToken(name)}`;
}
export const surveyHref = (slug: CommunitySlug, token: string) => `/s/${slug}/${token}`;

/** Who a link is for (nobody, if anonymous), and their language. */
export function resolveToken(slug: CommunitySlug, token: string): { sv: Survey; person?: Person; lang: string } | null {
  const [id, who] = token.split("~");
  const sv = surveyById(slug, id);
  if (!sv || !who) return null;
  if (who.startsWith("a")) {
    const p = roster(slug).find((x) => surveyToken(sv, x.name) === token);
    return { sv, lang: p?.lang ?? "English" };
  }
  const p = roster(slug).find((x) => weekToken(x.name) === who);
  return p ? { sv, person: p, lang: p.lang } : null;
}

/** A few real links, for staff to open the survey page as someone would. */
export function sampleLinks(slug: CommunitySlug, sv: Survey): { who: string; note: string; href: string }[] {
  const done = new Set(sv.answers.map((a) => a.who));
  // People who haven't answered yet first, so the link opens the questions rather than "already answered".
  const ppl = [...roster(slug)].sort((a, b) => Number(done.has(a.name)) - Number(done.has(b.name)));
  const pick = (f: (p: Person) => boolean) => ppl.find(f);
  const res = sv.audience.includes("residents");
  const xs = [
    res ? pick((p) => p.kind === "resident" && !p.lantern && p.text && p.lang === "English") : pick((p) => p.kind === "family" && p.lang === "English"),
    pick((p) => (res ? p.kind === "resident" && !p.lantern : p.kind === "family") && p.lang === "Spanish"),
    pick((p) => (res ? p.kind === "resident" && !p.lantern : p.kind === "family") && p.lang === "Chinese") ?? pick((p) => p.lang === "Chinese" && p.kind !== "prospect"),
  ].filter(Boolean) as Person[];
  return xs.map((p) => ({ who: p.name, note: `${p.kind === "resident" ? "Resident" : `${p.relation} of ${p.resident}`} · ${p.lang}`, href: surveyHref(slug, surveyToken(sv, p.name)) }));
}

/* ------------------------------------------------------------ Today, Feedback and the scorecard */

/** Cards for Today: a survey to approve, one closing tomorrow with few replies, results that are in. */
export function surveySignals(slug: CommunitySlug) {
  const t = today();
  const tomorrow = iso(addDays(t, 1));
  return surveysOf(slug).flatMap((sv) => {
    const out: { kind: "approve" | "closing" | "results"; sv: Survey; line: string }[] = [];
    if (sv.status === "waiting") out.push({ kind: "approve", sv, line: `${first(sv.ownerName)} wrote it${sv.started === "write" ? " with “Write it for me”" : ""} · ${sv.questions.length} questions · ${sv.audienceLabel.toLowerCase()}` });
    if (sv.status === "open" && sv.closes && sv.closes <= tomorrow) {
      const rate = Math.round((sv.answered / Math.max(1, sv.sendsTo)) * 100);
      if (rate < 40) out.push({ kind: "closing", sv, line: `Closes ${sv.closes === iso(t) ? "today" : "tomorrow"} with ${rate}% replied (${sv.answered} of ${sv.sendsTo})` });
    }
    if (sv.status === "automatic" && sv.answered >= 5) out.push({ kind: "results", sv, line: `${sv.answered} answers from ${sv.event}: ${results(sv).qs.find((q) => q.avg !== undefined)?.avg?.toFixed(1)} out of 5` });
    return out;
  });
}

/** The answer that became a dining concern in Feedback (named surveys only). */
export function surveyConcern(slug: CommunitySlug) {
  const sv = surveyById(slug, "dining");
  const a = sv?.answers.find((x) => x.flag?.kind === "concern");
  if (!a || !a.who) return null;
  const s = getStaffData(slug);
  const c = s.contacts.find((x) => x.contact === a.who);
  return { from: a.who, relation: c?.relation ?? "Family", resident: c?.resident ?? (a.rel?.split(" of ")[1] ?? ""), text: String(a.answers.wrong ?? a.answers.dine ?? "") };
}

/** A thank-you naming staff, written in the (named) family survey. */
export function surveyThanks(slug: CommunitySlug) {
  const sv = surveyById(slug, "family");
  const a = sv?.answers.find((x) => x.flag?.kind === "thanks" && x.who);
  if (!a?.who) return null;
  const s = getStaffData(slug);
  const c = s.contacts.find((x) => x.contact === a.who);
  return { from: a.who, relation: c?.relation ?? "Family", resident: c?.resident ?? "", text: String(a.answers.better ?? "") };
}

/** For the scorecard: family and resident satisfaction, before and now, from this section. */
export function scorecardSurveys(slug: CommunitySlug) {
  const fam = surveyById(slug, "family")!;
  const res = surveyById(slug, "resident")!;
  const now = (sv: Survey, id: string) => results(sv).qs.find((x) => x.q.id === id)?.avg ?? 0;
  const pct = (v: number) => Math.round(((v - 1) / 4) * 100);
  return {
    family: { sent: fam.sendsTo, answered: fam.answered, qs: fam.questions.filter((q) => q.type === "rating" || q.type === "nps").map((q) => ({ q: q.text.en.replace("{community}", communities[slug].site.name), before: q.type === "nps" ? fam.history[0].perQ[q.id] : pct(fam.history[0].perQ[q.id]), now: q.type === "nps" ? Number(now(fam, q.id).toFixed(1)) : pct(now(fam, q.id)) })) },
    resident: { answered: res.answered, qs: res.questions.filter((q) => q.type === "rating").map((q) => ({ q: q.text.en, before: pct(res.history[0].perQ[q.id]), now: pct(now(res, q.id)) })) },
  };
}

export const surveyMinutes = (sv: Survey) => minutes(sv.questions);
