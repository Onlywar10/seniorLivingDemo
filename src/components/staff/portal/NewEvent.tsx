"use client";

// One way to create or change an event, in three tabs:
// 1. Event: what it is. Start from a past event or a template, then the title, who it's for (residents, families or
//    public; all residents or any mix of floors and care areas), who leads it, room and seats, matching interests
//    (which also set its colour on the calendar), photos wanted, the newsletter, price, the description Kinlight
//    writes from those facts, and what residents will do with the time (Kinlight drafts the steps; staff can change them).
//    "Keep as a template" saves it to schedule again later; a template is not a repeat.
// 2. Time: when. The day and time, and whether it repeats (weekly on chosen days, every two weeks, monthly, with an end
//    date): every date it will be on is listed.
// 3. Preview: what everyone will see. The website calendar, the newsletter (if staff add it), the texts, and a
//    resident's week page.
// Post, Calendar's "+ Add" and Edit (from Calendar and Today, which open Post) all use this form. Editing one date of a
// repeating event asks whether the change is for that date only or for every date. Saved in this browser only.
import Link from "next/link";
import { useState } from "react";
import { categoryOf, cats, type ActivityCategory, type Cat, type EventKind } from "@/data/shared";
import type { CalEvent } from "@/data/staff/calEvents";
import type { Interest } from "@/data/staff/engage";
import type { PreviewSetup } from "@/data/staff/pool";
import type { Busy, IdeaPrefill, NewEventSetup } from "@/data/staff/post";
import { addDays, dayName, dayShort, fmtRange, fmtTime, fromIso, iso, monthName, shortDate } from "@/lib/clock";
import { interestsFromTitle } from "@/lib/eventInterests";
import { draftPlan, type PlanStep } from "@/lib/eventPlan";
import { OFF_CAMPUS, placesText, type Place } from "@/lib/places";
import { Icon } from "../../Icon";
import { useEventChanges, useEventWriter, type SavedTemplate } from "../eventStore";
import { useStaffCommunity } from "../StaffCommunity";
import { useSetLeader } from "../store";
import { EventPreview, type Draft } from "./EventPreview";
import { OffCampus } from "./OffCampus";
import { Auto, Help } from "./Help";

export { interestsFromTitle };

export interface EventPrefill { title?: string; date?: string; time?: string; minutes?: number; kind?: EventKind; cap?: number; repeat?: boolean; room?: string; cat?: Cat; interests?: Interest[]; photos?: boolean; leader?: string; lantern?: boolean; desc?: string; cost?: string; areas?: string[]; plan?: PlanStep[]; stops?: Place[] }

/** How an event repeats. */
export type RepeatKind = "none" | "weekly" | "biweekly" | "monthly";
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORD = ["1st", "2nd", "3rd", "4th", "last"];
/** "Every Tuesday and Thursday", "Every 2 weeks on Tuesday", "Monthly, 2nd Tuesday", with an end date if set. */
export function ruleText(k: RepeatKind, days: number[], d: Date, until?: string): string | undefined {
  if (k === "none") return undefined;
  const names = days.slice().sort().map((x) => dayName(addDays(d, x - d.getUTCDay())));
  const list = names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const nth = Math.min(4, Math.floor((d.getUTCDate() - 1) / 7));
  const base = k === "weekly" ? `Every ${list}` : k === "biweekly" ? `Every 2 weeks on ${list}` : `Monthly, ${ORD[nth]} ${dayName(d)}`;
  return until ? `${base}, until ${shortDate(fromIso(until))}` : base;
}

/** Every date a repeating event falls on, from its first date up to `last` (inclusive). */
export function seriesDates(first: string, pat: { k: RepeatKind; days: number[]; until?: string }, last: string): string[] {
  const end = pat.until && pat.until < last ? pat.until : last;
  const d0 = fromIso(first);
  if (pat.k === "none") return [first];
  const out: string[] = [];
  if (pat.k === "monthly") {
    const nth = Math.floor((d0.getUTCDate() - 1) / 7);
    for (let m = 0; m < 24; m++) {
      const one = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + m, 1));
      const x = addDays(one, ((d0.getUTCDay() - one.getUTCDay() + 7) % 7) + nth * 7);
      if (x.getUTCMonth() !== one.getUTCMonth()) continue;
      if (iso(x) > end) break;
      out.push(iso(x));
    }
    return out;
  }
  const sun = addDays(d0, -d0.getUTCDay());
  for (let w = 0; ; w += pat.k === "biweekly" ? 2 : 1) {
    const wk = addDays(sun, w * 7);
    if (iso(wk) > end) break;
    for (const day of [...pat.days].sort()) { const x = iso(addDays(wk, day)); if (x >= first && x <= end) out.push(x); }
  }
  return out;
}

/** Starting points, for events that have a usual shape. */
const TEMPLATES: (EventPrefill & { label: string })[] = [
  { label: "Bus trip", title: "Bus Trip: ", kind: "resident", cap: 12, minutes: 180, time: "09:30", interests: ["Outings"], photos: true },
  { label: "Exercise class", title: "", kind: "resident", minutes: 45, time: "10:00", interests: ["Fitness"], photos: false },
  { label: "Happy hour", title: "Happy Hour", kind: "resident", minutes: 90, time: "16:00", interests: ["Music"], photos: true },
  { label: "Talk or class", title: "", kind: "resident", minutes: 60, time: "14:00", interests: ["Learning"], photos: false },
  { label: "Family party", title: "", kind: "family", minutes: 120, time: "12:00", interests: [], photos: true },
  { label: "Open house", title: "", kind: "public", minutes: 120, time: "13:00", interests: [], photos: true },
];
export interface SavedEvent {
  id: string; title: string; date: string; start: number; end: number; room: string; kind: EventKind; cat: Cat;
  cap?: number; repeat: boolean; lantern: boolean; interests: Interest[]; desc: string; cost?: string;
  /** "Every Tuesday and Thursday", "Monthly, 2nd Tuesday"; undefined for a one-off. */
  rule?: string;
  pattern: { k: RepeatKind; days: number[]; until?: string };
  category: ActivityCategory;
  /** All residents, or the floors and care areas it's for. */
  areas: string[];
  leader?: string;
  /** Whether staff would like photos from it. */
  photos: boolean;
  /** The resident whose idea it was. */
  idea?: string;
  /** Waiting for the approver (it has a price). */
  approval: boolean;
  /** In the coming newsletter. */
  newsletter: boolean;
  /** Kept as a template, to schedule again later. */
  template: boolean;
  /** What happens during it, step by step. */
  plan: PlanStep[];
  /** Off campus: where the bus goes, in order. */
  stops?: Place[];
}

/** One date of a saved event, as the calendar has it. */
export function savedToCal(s: SavedEvent, date: string, id = s.id): CalEvent {
  return {
    id, date, kind: s.kind, start: s.start, end: s.end, title: s.title, room: s.room, cat: s.cat, color: cats[s.cat].color, catLabel: cats[s.cat].label,
    cap: s.cap, taken: s.cap ? 0 : undefined, booked: s.cap ? [] : undefined, lantern: s.lantern, rule: s.rule, desc: s.desc, cost: s.cost,
    interests: s.interests, isNew: true, idea: s.idea, approval: s.approval || undefined, wanted: s.photos || undefined, newsletter: s.newsletter || undefined, plan: s.plan, stops: s.stops,
  };
}
/** What describes an event, for a change to it (not its date or repeat). */
const describe = (s: SavedEvent): Partial<CalEvent> => ({
  title: s.title, start: s.start, end: s.end, room: s.room, kind: s.kind, cat: s.cat, color: cats[s.cat].color, catLabel: cats[s.cat].label,
  cap: s.cap, lantern: s.lantern, desc: s.desc, cost: s.cost, interests: s.interests, wanted: s.photos || undefined, approval: s.approval || undefined, newsletter: s.newsletter || undefined, plan: s.plan, stops: s.stops,
});

const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const first = (n = "") => n.split(" ")[0];
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const shortTime = (m: number) => fmtTime(m).replace(":00", "");
const kindName: Record<EventKind, string> = { resident: "Residents", family: "Families", public: "Public" };
const catOf = (ints: Interest[], lantern: boolean): Cat => {
  if (lantern) return "lantern";
  const m: Partial<Record<Interest, Cat>> = { Fitness: "fitness", Faith: "faith", "Cards and games": "clubs", Outings: "trips", Music: "music", Movies: "movies" };
  return ints.map((i) => m[i]).find(Boolean) ?? "community";
};

/** The newsletter goes out on Sundays at 5 pm with the week it starts. */
function newsletterFor(dateIso: string, todayIso: string, on: boolean) {
  const d = fromIso(dateIso);
  const sun = addDays(d, -d.getUTCDay());
  if (iso(sun) < todayIso) return "Too late for its week’s newsletter: people hear by text instead.";
  return on ? `In the newsletter on Sunday, ${shortDate(sun)}.` : "Not in the newsletter (you can add it in Preview).";
}
function sendWhen(dateIso: string, todayIso: string) {
  const days = Math.round((fromIso(dateIso).getTime() - fromIso(todayIso).getTime()) / 86400000);
  if (days <= 1) return "sent now";
  return `sent ${dayName(addDays(fromIso(dateIso), -2))} at 8:30 am`;
}

/** Everything Kinlight does with a new event, one short line each. */
function effectsOf(o: { date: string; kind: EventKind; repeat: boolean; lantern: boolean; cap?: number; interests: Interest[]; invited: number; photos: boolean; idea?: IdeaPrefill; approval: boolean; newsletter: boolean; template: boolean; setup: NewEventSetup }): string[] {
  const d = fromIso(o.date);
  const out: string[] = [];
  if (o.approval) out.push(`Waits for ${o.setup.approver.first} to approve it (it has a price). Then:`);
  out.push(o.kind === "resident" ? "Website calendar: name, day, time and description only." : o.kind === "family" ? "Website calendar, with RSVP by replying to the text." : "Website calendar with a sign-up form; each sign-up reaches sales.");
  out.push(`Large-print ${monthName(d)} calendar${o.repeat ? `, every ${dayName(d)}` : ""}, and a flyer for the front desk.`);
  if (!o.lantern) out.push("On every resident’s week page (the link in Sunday’s text), picked out for those whose interests match.");
  if (o.lantern) out.push("Lantern residents are invited in person by the care team.");
  else if (o.invited) out.push(`Personal invites to ${o.invited} residents who like ${andList(o.interests.map((i) => i.toLowerCase()))}, ${sendWhen(o.date, o.setup.todayIso)}, and a reminder the day before if they haven’t answered.`);
  if (o.kind === "family") out.push(`A text to ${o.setup.families} families; each resident says yes first.`);
  out.push(`Reminders on the day${o.cap ? `; a waitlist if the ${o.cap} seats fill` : ""}.`);
  out.push(newsletterFor(o.date, o.setup.todayIso, o.newsletter));
  if (o.kind === "public") out.push("Google Business Profile, on Search and Maps.");
  if (o.photos) out.push("Asks the leader for photos when it ends.");
  if (o.idea?.who) out.push(`${first(o.idea.who)} hears “your idea made the calendar”.`);
  if (o.template) out.push("Kept as a template, to schedule again later.");
  return out;
}

/** Editing an event that exists: the same form, filled in, saved over it. */
export interface Editing { id: string; title: string; date: string; orig?: string; start: number; room: string; desc?: string; cost?: string; lantern?: boolean; rule?: string; newsletter?: boolean }

type Tab = "event" | "time" | "preview";

export function NewEvent({ setup, prefill, idea, inDrawer = false, extraBusy = [], onSaved, onAnother, editing, onCancel, preview, keepLocal = false, back }: {
  setup: NewEventSetup; prefill?: EventPrefill; idea?: IdeaPrefill; inDrawer?: boolean; extraBusy?: Busy[]; onSaved?: (e: SavedEvent) => void; onAnother?: () => void; editing?: Editing; onCancel?: () => void;
  /** The weeks ahead's events and the newsletter's name, for the Preview tab. */
  preview?: PreviewSetup;
  /** Don't put it on the calendar (an import's details, confirmed later). */
  keepLocal?: boolean;
  /** Where to go back to after an edit: Calendar or Today. */
  back?: { href: string; label: string };
}) {
  const { site } = useStaffCommunity();
  const writer = useEventWriter();
  const setLeader = useSetLeader();
  const { templates: mineTpls } = useEventChanges();
  const tomorrow = iso(addDays(fromIso(setup.todayIso), 1));
  // Post opens with a sample event, so the numbers below are real; Calendar's "+ Add" and ideas start from their own.
  const p: EventPrefill = prefill ?? (idea ? {} : { ...setup.sample });
  const [tab, setTab] = useState<Tab>("event");
  const [f, setF] = useState({
    title: p.title ?? idea?.title ?? "", date: p.date ?? tomorrow, time: p.time ?? "14:00", end: hhmm(toMin(p.time ?? "14:00") + (p.minutes ?? 60)),
    room: p.room ?? setup.rooms.find((r) => /club|activity|living/i.test(r)) ?? setup.rooms[0], cap: p.cap ? String(p.cap) : "", cost: editing?.cost ?? p.cost ?? "",
  });
  const [kind, setKind] = useState<EventKind>(p.kind ?? "resident");
  const d0 = fromIso(p.date ?? tomorrow);
  const [initPat] = useState(() => ({ rk: (p.repeat ? "weekly" : "none") as RepeatKind, days: [d0.getUTCDay()] }));
  const [rk, setRk] = useState<RepeatKind>(initPat.rk);
  const [days, setDays] = useState<number[]>(initPat.days);
  const [until, setUntil] = useState("");
  const repeat = rk !== "none";
  const [areas, setAreas] = useState<string[]>(p.areas ?? (editing?.lantern || p.lantern ? setup.areas.filter((a) => /lantern/i.test(a)) : []));
  const lantern = areas.length > 0 && areas.every((a) => /lantern/i.test(a));
  const [leader, setLeaderSel] = useState(p.leader ?? (editing ? "" : setup.me));
  const [startKey, setStartKey] = useState("");
  const [ints, setInts] = useState<Interest[] | null>(p.interests ?? null);
  const [desc, setDesc] = useState<string | null>(editing?.desc ?? p.desc ?? null);
  const [share, setShare] = useState(false);
  const [wantPhotos, setWantPhotos] = useState(p.photos ?? true);
  const [planSel, setPlan] = useState<PlanStep[] | null>(p.plan?.length ? p.plan : null);
  const [stops, setStops] = useState<Place[]>(p.stops ?? []);
  const [news, setNews] = useState(editing?.newsletter ?? (p.kind ?? "resident") !== "resident");
  const [keepTpl, setKeepTpl] = useState(false);
  const [askScope, setAskScope] = useState(false);
  const [saved, setSaved] = useState<(SavedEvent & { scope?: "one" | "all" }) | null>(null);

  /** Fill the form from a past event or a template; the day stays as chosen. */
  const apply = (x: EventPrefill, key: string) => {
    setStartKey(key);
    const t0 = x.time ?? f.time;
    setF({ ...f, title: x.title ?? "", date: x.date ?? f.date, time: t0, end: hhmm(toMin(t0) + (x.minutes ?? 60)), room: x.room ?? f.room, cap: x.cap ? String(x.cap) : "", cost: x.cost ?? "" });
    setKind(x.kind ?? "resident");
    setRk(x.repeat ? "weekly" : "none");
    if (x.date) setDays([fromIso(x.date).getUTCDay()]);
    setInts(x.interests?.length ? x.interests : null);
    setWantPhotos(!!x.photos);
    setDesc(x.desc ?? null);
    setAreas(x.areas ?? []);
    if (x.leader !== undefined) setLeaderSel(x.leader);
    setNews((x.kind ?? "resident") !== "resident");
    setPlan(x.plan?.length ? x.plan : null);
    setStops(x.stops ?? []);
  };
  const fromTpl = (t: SavedTemplate): EventPrefill => ({ title: t.title, kind: t.kind, time: t.time, minutes: t.minutes, room: t.room, cap: t.cap, interests: t.interests, photos: !!t.photos, desc: t.desc, cost: t.cost, areas: t.areas, leader: t.leader });

  const start = toMin(f.time), end = Math.max(toMin(f.end), start + 15);
  const d = fromIso(f.date || tomorrow);
  const interests = ints ?? interestsFromTitle(f.title);
  const category = categoryOf({ cat: catOf(interests, lantern), title: f.title });
  const pattern = { k: rk, days: days.length ? days : [d.getUTCDay()], until: until || undefined };
  const rule = ruleText(rk, pattern.days, d, until || undefined);
  const areaText = areas.length ? andList(areas) : "All residents";
  const cap = Number(f.cap) || undefined;
  const photos = wantPhotos;
  const set = (k: keyof typeof f) => (ev: { target: { value: string } }) => setF({ ...f, [k]: ev.target.value });
  const toggleInt = (i: Interest) => setInts(interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i]);
  // The dates it's on: a repeat with no end date is shown for the next eight weeks.
  const horizon = until || iso(addDays(d, 7 * 8));
  const known = seriesDates(f.date || tomorrow, pattern, horizon);
  const lastSave = until || iso(addDays(fromIso(setup.todayIso), 7 * 12));

  // Room clashes: the same room at an overlapping time, on that day (or on any later week, if it repeats).
  const offCampus = f.room === OFF_CAMPUS;
  const clash = setup.shared.includes(f.room) || offCampus ? undefined
    : [...setup.busy, ...extraBusy].filter((b) => !(editing && b.title === editing.title && b.room === editing.room && b.start === editing.start)).find((b) => b.room === f.room && start < b.end && end > b.start && (b.date === f.date || (repeat && b.date > f.date && fromIso(b.date).getUTCDay() === d.getUTCDay())));

  // What Kinlight writes, from the facts entered and nothing else.
  const when = repeat && rule ? `${rule.replace(/, until .*$/, "").replace(/^Every/, "every").replace(/^Monthly,/, "monthly on the")} at ${fmtTime(start)}` : `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}, at ${fmtTime(start)}`;
  const place = offCampus ? (stops.length ? `at ${placesText(stops)}` : "off campus") : f.room === "All floors" ? "on every floor" : `in the ${f.room.replace(/^The /, "")}`;
  const tripLine = offCampus && stops.length ? ` A trip to ${placesText(stops)}; the bus leaves from the lobby.` : "";
  const likes = andList(interests.map((i) => i.toLowerCase()));
  const written = !f.title ? "" :
    kind === "resident" ? `${f.title}, ${when}.${tripLine}${likes ? ` For residents who enjoy ${likes}.` : ""}${cap ? " Tap I’ll go on your week page, sign up at the front desk, or reply YES to your invite." : ""}${f.cost ? ` Cost: ${f.cost}.` : ""}` :
    kind === "family" ? `${f.title}, ${when}, ${place}. Families are welcome: reply to your text with how many are coming.${f.cost ? ` Cost: ${f.cost}.` : ""}` :
    `${f.title} at ${setup.brand.name}, ${when}, ${place}. Open to everyone: sign up on this page.${f.cost ? ` Cost: ${f.cost}.` : ""}`;
  const text = desc ?? written;
  // What residents will do with the time: Kinlight's draft until staff change a step.
  const plan = planSel ?? draftPlan({ title: f.title || "The activity", cat: catOf(interests, lantern), start, end, room: offCampus ? undefined : f.room, stops: offCampus ? stops : undefined });
  const setStep = (i: number, patch: Partial<PlanStep>) => setPlan(plan.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const newsSun = addDays(d, -d.getUTCDay());
  const newsTooLate = iso(newsSun) < setup.todayIso;

  const invited = lantern ? [] : setup.invitees.filter((r) => r.interests.some((x) => interests.includes(x))).map((r) => r.name);
  const isToday = f.date === setup.todayIso;
  const short = f.title.replace(/^Bus Trip: /, "") || "Your event";
  const sampleWhen = repeat ? `every ${dayName(d)}` : isToday ? (start >= 17 * 60 ? "tonight" : "today") : dayName(d);
  const sample = `${first(invited[0] ?? "Dorothy")}, ${short.split(":")[0]} is ${sampleWhen} at ${shortTime(start)}. ${cap ? "Want a seat?" : "Want to come?"} Reply YES.`;
  const approval = !!f.cost.trim() && !setup.isApprover;
  const effects = effectsOf({ date: f.date, kind, repeat, lantern, cap, interests, invited: invited.length, photos, idea, approval, newsletter: news, template: keepTpl, setup });
  const blocked = !!clash && !share;
  const patternTouched = rk !== initPat.rk || until !== "" || pattern.days.join() !== initPat.days.join();
  const repeating = !!editing?.rule;

  const build = (): SavedEvent => ({
    id: editing?.id ?? `new-${f.date}-${start}-${f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, title: f.title, date: f.date, start, end, room: f.room, kind, cat: catOf(interests, lantern), cap, repeat, lantern, interests, desc: text, cost: f.cost || undefined, photos,
    idea: idea?.who ?? (idea ? "a resident" : undefined), approval, rule, pattern, category, areas, leader: leader || undefined, newsletter: news && !newsTooLate, template: keepTpl, plan, stops: offCampus ? stops : undefined,
  });

  /** Save it: new events go on the calendar (every date, if it repeats); a change goes to one date or every date. */
  const commit = (scope: "one" | "all") => {
    const s = build();
    if (!keepLocal) {
      if (editing) {
        const target = { id: editing.id, date: editing.date, orig: editing.orig };
        if (scope === "all" && (patternTouched || !repeating)) {
          writer.reshape(target, seriesDates(s.date, pattern, lastSave).map((date) => savedToCal(s, date, editing.id)));
        } else if (scope === "all") {
          const shift = Math.round((fromIso(s.date).getTime() - fromIso(editing.date).getTime()) / 864e5);
          writer.series(target, { ...describe(s), rule: shift ? ruleText(rk, pattern.days.map((x) => (x + shift + 7) % 7), d) : editing.rule }, shift || undefined);
        } else {
          writer.one(target, { ...describe(s), date: s.date });
        }
        if (s.leader !== (prefill?.leader || undefined)) setLeader(editing.id, s.leader ?? null);
      } else {
        writer.add(seriesDates(s.date, pattern, lastSave).map((date) => savedToCal(s, date)));
        if (s.leader) setLeader(s.id, s.leader);
      }
      if (keepTpl) writer.keepTemplate({ k: s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: s.title, title: s.title, kind, time: f.time, minutes: end - start, room: f.room, cap, interests, photos, desc: text, cost: f.cost || undefined, areas, leader: leader || undefined });
    }
    setAskScope(false);
    setSaved({ ...s, scope: editing ? scope : undefined });
    onSaved?.(s);
    if (!inDrawer) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = () => {
    if (!f.title) { setTab("event"); return; }
    if (offCampus && !stops.length) { setTab("event"); window.setTimeout(() => document.querySelector<HTMLInputElement>(".oc-search input")?.focus(), 50); return; }
    if (blocked) { setTab("time"); return; }
    if (editing && (repeating || patternTouched)) { setAskScope(true); return; }
    commit("one");
  };

  if (saved) {
    const sd = fromIso(saved.date);
    const editLine = saved.scope === "all" ? `Every date from ${dayShort(sd)} on` : editing ? `Only ${dayShort(sd)}` : null;
    return (
      <div className={`po-done${inDrawer ? "" : " sx-card sx-card-body"}`} role="status">
        <div className="po-done-h">
          <Icon name={saved.approval ? "clock" : "check"} />
          <div>
            <h2>{saved.approval ? `Sent to ${setup.approver.first}` : editing ? `${saved.title} is saved` : `${saved.title} is on the calendar`}</h2>
            <p>{dayName(sd)}, {monthName(sd)} {sd.getUTCDate()} · {fmtRange(saved.start, saved.end)} · {saved.room} · {areaText}{saved.rule ? ` · ${saved.rule}` : ""}{saved.leader ? ` · led by ${saved.leader === setup.me ? "you" : saved.leader}` : ""}</p>
            {editLine && <p className="po-done-scope"><Icon name="layers" /> {editLine}. The website, newsletter, week pages and invites are updated, and everyone booked is told if the day, time or room changed.</p>}
          </div>
        </div>
        {!editing && !saved.lantern && invited.length > 0 && <p className="po-done-stat"><b>{invited.length}</b> residents invited by text</p>}
        {!editing && saved.repeat && <p className="po-done-stat"><b>{seriesDates(saved.date, saved.pattern, lastSave).length}</b> dates on the calendar · {saved.rule}</p>}
        {saved.template && <p className="po-done-stat"><Icon name="star" /> Kept as a template</p>}
        {!editing && <Auto summary="Everything Kinlight did"><ul>{effects.map((x) => <li key={x}>{x}</li>)}</ul></Auto>}
        <div className="pt-act">
          {back && <Link className="sx-btn sx-btn-primary" href={back.href}><Icon name="left" /> {back.label}</Link>}
          {!saved.approval && <Link className={`sx-btn${back ? "" : " sx-btn-primary"}`} href={site("/calendar")} target="_blank"><Icon name="globe" /> See it on the website</Link>}
          {!inDrawer && !back && <Link className="sx-btn" href="/staff/calendar">Open the calendar</Link>}
          {onAnother && !editing && <button type="button" className="sx-btn" onClick={onAnother}>Add another</button>}
        </div>
      </div>
    );
  }

  const tabs: [Tab, string, string][] = [
    ["event", "Event", f.title || "What it is"],
    ["time", "Time", repeat && rule ? rule : `${dayShort(d)} · ${fmtTime(start)}`],
    ["preview", "Preview", "What everyone sees"],
  ];
  const next: Partial<Record<Tab, Tab>> = { event: "time", time: "preview" };
  const prev: Partial<Record<Tab, Tab>> = { time: "event", preview: "time" };
  const go = (t: Tab) => { setTab(t); if (!inDrawer) document.getElementById("po-tabs")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };

  const eventTab = (
    <>
      {idea && (
        <p className="po-idea"><Icon name="heart" /> <span>“{idea.text}” <small>{idea.who ? `${idea.who}’s idea` : "A resident’s idea"}</small></span></p>
      )}
      {!editing && !idea && (
        <div className="po-start">
          <label>
            <span className="sx-lbl"><Icon name="layers" /> Copy a past event</span>
            <select value={startKey.startsWith("past:") ? startKey : ""} onChange={(ev) => { const x = setup.past.find((y) => `past:${y.title}` === ev.target.value); if (x) apply({ ...x, repeat: true }, ev.target.value); }}>
              <option value="">Choose one</option>
              {setup.past.map((x) => <option key={x.title} value={`past:${x.title}`}>{x.label}</option>)}
            </select>
          </label>
          <div>
            <span className="sx-lbl">Or start from a template</span>
            <div className="sx-chips" role="group" aria-label="Templates">
              {mineTpls.map((t) => <button key={t.k} type="button" className="po-mytpl" aria-pressed={startKey === `mine:${t.k}`} onClick={() => apply(fromTpl(t), `mine:${t.k}`)}><Icon name="star" />{t.label}</button>)}
              {TEMPLATES.map((x) => <button key={x.label} type="button" aria-pressed={startKey === `tpl:${x.label}`} onClick={() => apply(x, `tpl:${x.label}`)}>{x.label}</button>)}
            </div>
          </div>
        </div>
      )}
      <label>
        Title
        <input value={f.title} onChange={set("title")} placeholder="Bridge Club" autoComplete="off" />
      </label>
      <div className="po-pair">
        <div className="sx-seg po-seg" role="group" aria-label="Who it’s for">
          {(["resident", "family", "public"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{kindName[k]}</button>
          ))}
        </div>
        <Help label="Who sees it" align="end">
          <p><b>Residents:</b> the website shows name, day, time and description only. Residents tap I’ll go on their week page, reply YES or sign up at the desk; families can ask for a seat.</p>
          <p><b>Families:</b> families reply to the text with how many are coming; the resident says yes first.</p>
          <p><b>Public:</b> anyone can sign up on the website, and each sign-up is a lead for sales.</p>
        </Help>
      </div>
      <fieldset className="po-field">
        <legend className="sx-lbl">Which residents</legend>
        <div className="sx-chips" role="group" aria-label="Which residents">
          <button type="button" aria-pressed={!areas.length} onClick={() => setAreas([])}>All residents</button>
          {setup.areas.map((a) => <button key={a} type="button" aria-pressed={areas.includes(a)} onClick={() => setAreas((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))}>{a}</button>)}
        </div>
      </fieldset>
      <div className="sx-row">
        <label>Led by<select value={leader} onChange={(ev) => setLeaderSel(ev.target.value)}><option value="">Nobody yet</option>{setup.staff.map((n) => <option key={n} value={n}>{n === setup.me ? `${n} (you)` : n}</option>)}</select></label>
        <label>Room<select value={f.room} onChange={set("room")}>{setup.rooms.map((r) => <option key={r}>{r}</option>)}<option value={OFF_CAMPUS}>Off campus (a trip)</option></select></label>
      </div>
      {offCampus && <OffCampus stops={stops} onChange={(x) => { setStops(x); if (!planSel) setPlan(null); }} from={setup.brand.name} minutes={end - start} />}
      <div className="sx-row">
        <label>Seats<input type="number" min={0} inputMode="numeric" value={f.cap} onChange={set("cap")} placeholder="No limit" /></label>
      </div>
      <fieldset className="po-field">
        <legend className="sx-lbl">Interests</legend>
        <div className="sx-chips po-ints" role="group" aria-label="Matching interests">
          {setup.interests.map((i) => <button key={i} type="button" aria-pressed={interests.includes(i)} onClick={() => toggleInt(i)}>{interests.includes(i) && <Icon name="check" />}{i}</button>)}
        </div>
        <div className="po-invited">
          {lantern ? "Lantern: invited in person" : <><b>{invited.length}</b> residents invited, and it’s picked out on their week page</>}
          <Help label="How invites work">
            <p>Each resident who chose one of these interests gets a personal text: “{sample}”</p>
            <p>It’s also picked out for them on their week page, the link in Sunday’s text. A YES or “I’ll go” books them. Lantern residents aren’t texted; the care team asks in person.</p>
            {!ints && f.title && <p>Suggested from the title; tap to change.</p>}
          </Help>
        </div>
      </fieldset>
      <div className="po-pair po-opts">
        <label className="sx-check"><input type="checkbox" checked={wantPhotos} onChange={(ev) => setWantPhotos(ev.target.checked)} /> Photos wanted</label>
        <label className={`sx-check${newsTooLate ? " po-off" : ""}`} title={newsTooLate ? "That week’s newsletter has already gone out" : undefined}>
          <input type="checkbox" checked={news && !newsTooLate} disabled={newsTooLate} onChange={(ev) => setNews(ev.target.checked)} /> Include in the newsletter
          <span className="sx-hint">{newsTooLate ? "(too late for that week’s issue)" : `(Sunday, ${shortDate(newsSun)})`}</span>
        </label>
      </div>
      <label>
        <span className="po-lbl">Price <span className="sx-hint">optional</span>{!setup.isApprover && <span className="po-tag">Approval needed</span>}</span>
        <input value={f.cost} onChange={set("cost")} placeholder="Free" inputMode="decimal" />
      </label>
      <label className="po-written">
        <span className="po-lbl">Description</span>
        <textarea aria-label="Description" rows={3} value={text} onChange={(ev) => setDesc(ev.target.value)} placeholder="Written once there’s a title." />
      </label>
      <fieldset className="po-field po-plan">
        <legend className="sx-lbl">What they’ll do <span className="sx-hint">{planSel ? "your plan" : "Kinlight’s draft, from the title and times"}</span></legend>
        <ol>
          {plan.map((x, i) => (
            <li key={i}>
              <input type="time" aria-label={`Step ${i + 1} time`} value={hhmm(x.at)} step={300} onChange={(ev) => setStep(i, { at: toMin(ev.target.value) })} />
              <input aria-label={`Step ${i + 1}`} value={x.what} onChange={(ev) => setStep(i, { what: ev.target.value })} />
              <button type="button" className="sx-x" aria-label={`Remove step ${i + 1}`} onClick={() => setPlan(plan.filter((_, j) => j !== i))}><Icon name="x" /></button>
            </li>
          ))}
        </ol>
        <div className="po-plan-act">
          <button type="button" className="sx-link" onClick={() => setPlan([...plan, { at: plan.length ? Math.min(end, plan[plan.length - 1].at + 15) : start, what: "" }])}><Icon name="plus" /> Add a step</button>
          {planSel && <button type="button" className="sx-link" onClick={() => setPlan(null)}>Use Kinlight’s draft</button>}
        </div>
        <p className="sx-hint">Residents see this when they open the activity on their week page.</p>
      </fieldset>
      {!keepLocal && (
        <label className="sx-check po-keep">
          <input type="checkbox" checked={keepTpl} onChange={(ev) => setKeepTpl(ev.target.checked)} />
          <span>
            <b>Keep as a template</b>
            <small>For something you’ll run again. It saves the event’s details (not its dates) under “Start from a template”, so next time you only pick a time.</small>
          </span>
        </label>
      )}
    </>
  );

  const timeTab = (
    <>
      <div className="sx-row3 po-when">
        <label>Day<input type="date" value={f.date} min={editing && editing.date < setup.todayIso ? editing.date : setup.todayIso} onChange={set("date")} required /></label>
        <label>Starts<input type="time" value={f.time} onChange={(ev) => { const s0 = toMin(ev.target.value); setF({ ...f, time: ev.target.value, end: hhmm(s0 + Math.max(15, end - start)) }); }} step={300} required /></label>
        <label>Ends<input type="time" value={f.end} onChange={set("end")} step={300} /></label>
      </div>
      <fieldset className="po-field po-repeat">
        <legend className="sx-lbl">Repeats</legend>
        <div className="sx-seg" role="group" aria-label="Repeats">
          {([["none", "One-off"], ["weekly", "Weekly"], ["biweekly", "Every 2 weeks"], ["monthly", "Monthly"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={rk === k} onClick={() => { setRk(k); if (!days.includes(d.getUTCDay())) setDays([d.getUTCDay()]); }}>{l}</button>
          ))}
        </div>
        {(rk === "weekly" || rk === "biweekly") && (
          <div className="sx-chips po-days" role="group" aria-label="On these days">
            {WD.map((w, i) => <button key={w} type="button" aria-pressed={days.includes(i)} onClick={() => setDays((x) => (x.includes(i) ? (x.length > 1 ? x.filter((y) => y !== i) : x) : [...x, i]))}>{w}</button>)}
          </div>
        )}
        {repeat && (
          <div className="po-until">
            <span className="sx-hint">{rule}</span>
            <label>Ends <input type="date" value={until} min={f.date} onChange={(ev) => setUntil(ev.target.value)} aria-label="End date" /></label>
            {until && <button type="button" className="sx-link" onClick={() => setUntil("")}>No end date</button>}
          </div>
        )}
      </fieldset>
      <div className="po-dates">
        <p className="sx-lbl">{repeat ? (until ? `The ${known.length} dates it’s on` : `The next ${known.length} dates`) : "The date it’s on"}</p>
        <ul>
          {known.slice(0, 12).map((x) => <li key={x}>{dayShort(fromIso(x))}</li>)}
          {known.length > 12 && <li className="po-dates-more">and {known.length - 12} more</li>}
        </ul>
        {repeat && !until && <p className="sx-hint">It keeps going until you set an end date. Each date is the same event: change one later and you’ll be asked whether it’s that date or every date.</p>}
      </div>
      {clash ? (
        <div className="sx-callout" role="alert">
          <Icon name="alert" />
          <p>
            <b>Room clash:</b> {clash.title}, {clash.date === f.date ? "" : `${dayName(fromIso(clash.date))}s `}{fmtRange(clash.start, clash.end)}, in {f.room}.{" "}
            {share ? "They’ll share the room." : <><button type="button" className="sx-link pt-linkbtn" onClick={() => setShare(true)}>They can share</button>, or change the room on the Event tab.</>}
          </p>
        </div>
      ) : (
        <p className="po-free"><Icon name="check" /> {offCampus ? (stops.length ? `Off campus: ${placesText(stops)}` : "Off campus: add where it’s going on the Event tab") : `${f.room} is free`}</p>
      )}
    </>
  );

  const draft: Draft = { id: editing?.id ?? "draft", title: f.title, date: f.date || tomorrow, start, end, room: f.room, kind, cat: catOf(interests, lantern), desc: text, cap, interests, lantern, rule, dates: known, approval, plan, stops: offCampus ? stops : undefined };
  const previewTab = <EventPreview draft={draft} setup={setup} preview={preview} newsletter={news} setNewsletter={setNews} invited={invited} />;

  const sd = fromIso(editing?.date ?? f.date);
  return (
    <form className={`sx-form pt-form po-evform${inDrawer ? "" : " sx-card sx-card-body"}`} onSubmit={(ev) => { ev.preventDefault(); submit(); }} aria-label={editing ? "Edit event" : "New event"}>
      <div className="po-tabs" id="po-tabs" role="tablist" aria-label="Steps">
        {tabs.map(([k, label, hint], i) => (
          <button key={k} type="button" role="tab" id={`po-tab-${k}`} aria-controls={`po-panel-${k}`} aria-selected={tab === k} onClick={() => setTab(k)}>
            <span className="po-tab-n" aria-hidden="true">{i + 1}</span>
            <span className="po-tab-t"><b>{label}</b><small>{hint}</small></span>
          </button>
        ))}
      </div>
      <div className="po-panel" role="tabpanel" id={`po-panel-${tab}`} aria-labelledby={`po-tab-${tab}`}>
        {tab === "event" ? eventTab : tab === "time" ? timeTab : previewTab}
      </div>

      {askScope && editing ? (
        <div className="po-scope" role="alertdialog" aria-labelledby="po-scope-h">
          <h3 id="po-scope-h"><Icon name="layers" /> Change every {f.title || editing.title}, or just this one?</h3>
          <p>{repeating ? <>This is one date of an event that repeats ({editing.rule}).</> : <>You made it repeat.</>} Where should these changes go?</p>
          <div className="po-scope-opts">
            {repeating && !patternTouched && (
              <button type="button" className="sx-btn sx-btn-lg" onClick={() => commit("one")}>
                <b>Only {dayShort(sd)}</b><small>The other dates stay as they are.</small>
              </button>
            )}
            <button type="button" className="sx-btn sx-btn-lg sx-btn-primary" onClick={() => commit("all")}>
              <b>Every date from {dayShort(sd)} on</b><small>{patternTouched ? `Its dates become: ${rule ?? "one-off"}.` : "Earlier dates stay as they were."}</small>
            </button>
          </div>
          <button type="button" className="sx-link" onClick={() => setAskScope(false)}>Go back to the form</button>
        </div>
      ) : (
        <div className="pt-submit po-foot">
          <Auto summary={approval ? `Goes to ${setup.approver.first} first` : "Then Kinlight does the rest"}><ul>{effects.map((x) => <li key={x}>{x}</li>)}</ul></Auto>
          <div className="po-foot-btns">
            {prev[tab] && <button type="button" className="sx-btn sx-btn-lg" onClick={() => go(prev[tab]!)}><Icon name="left" /> Back</button>}
            {editing && onCancel && tab === "event" && <button type="button" className="sx-btn sx-btn-lg" onClick={onCancel}>Cancel</button>}
            {next[tab] && <button type="button" className={`sx-btn sx-btn-lg${editing ? "" : " sx-btn-primary"}`} onClick={() => go(next[tab]!)}>Next: {next[tab] === "time" ? "Time" : "Preview"} <Icon name="right" /></button>}
            {(tab === "preview" || editing) && (
              <button type="submit" className="sx-btn sx-btn-lg sx-btn-primary" disabled={blocked}>
                <Icon name={approval ? "send" : "check"} /> {approval ? `Send to ${setup.approver.first}` : editing ? "Save changes" : "Add the event"}
              </button>
            )}
          </div>
          {!f.title && tab !== "event" && <p className="sx-hint po-need">Give it a title on the Event tab first.</p>}
          {offCampus && !stops.length && <p className="sx-hint po-need">It’s off campus: add where it’s going on the Event tab.</p>}
        </div>
      )}
    </form>
  );
}
