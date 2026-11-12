// One set of numbers for "this week" at a community, used everywhere it's mentioned (Today's "Kinlight did this for
// you" strip, the newsletter, its Today card and Reports), so the same week never shows two different counts.
// Server Components only.
import { newsletter } from "./newsletter";
import { communities, type CommunitySlug } from "@/data/communities";
import { addDays, dayShort, hash, iso, sundayOf, today } from "@/lib/clock";
import { handledByAI } from "./engage";

export interface WeekNumbers {
  /** "Nov 1–7" */
  range: string;
  /** Activities on the calendar this week (Sunday to Saturday), not counting services and films. */
  activities: number;
  /** Photos staff added to this week's events, and how many events they came from. */
  photos: number;
  photoEvents: number;
  /** What Kinlight did for the team this week. */
  descriptions: number;
  captions: number;
  remindersAndInvites: number;
  repliesHandled: number;
  flyers: number;
  pagesKept: number;
  /** Stories in this week's newsletter. */
  stories: number;
}

export function weekNumbers(slug: CommunitySlug): WeekNumbers {
  const c = communities[slug];
  const start = sundayOf(today());
  const days = c.staffEventsBetween(start, 7, iso(today()));
  const activities = days.flatMap((d) => d.events).filter((e) => e.cat !== "faith" && e.cat !== "movies").length;
  const h = hash(slug);
  const end = addDays(start, 6);
  const [m1, d1] = dayShort(start).split(", ")[1].split(" ");
  const [m2, d2] = dayShort(end).split(", ")[1].split(" ");
  return {
    range: m1 === m2 ? `${m1} ${d1}–${d2}` : `${m1} ${d1}–${m2} ${d2}`,
    activities,
    photos: 34 + (h % 9),
    photoEvents: 5,
    descriptions: 3,
    captions: 12,
    remindersAndInvites: 196 + (h % 40),
    repliesHandled: handledByAI(slug).length,
    flyers: 6,
    pagesKept: 3,
    stories: 6,
  };
}

export interface DidItem { k: string; n: number; label: string; list: string[] }

/** "Kinlight did this for you this week": the work staff didn't have to do, each with a short list behind it. */
export function didThisWeek(slug: CommunitySlug): DidItem[] {
  // Photos, albums and stories come from the newsletter as it stands, so both screens say the same.
  const u = newsletter(slug).used;
  const w = { ...weekNumbers(slug), photos: u.photos, photoEvents: u.photoEvents, stories: u.stories };
  const c = communities[slug];
  const start = sundayOf(today());
  const evs = c.staffEventsBetween(start, 14, iso(today())).flatMap((d) => d.events).filter((e) => e.cat !== "faith" && e.cat !== "movies");
  const special = evs.filter((e) => e.special || e.kind === "family" || e.kind === "public");
  const past = c.staffEventsBetween(start, 7, iso(today())).flatMap((d) => d.events).filter((e) => e.date <= iso(today()) && e.cat !== "faith" && e.cat !== "movies");
  const handled = handledByAI(slug);
  const reminders = Math.round(w.remindersAndInvites * 0.64);
  const titles = (xs: typeof evs, n: number) => [...new Set(xs.map((e) => e.title))].slice(0, n);
  return [
    { k: "descriptions", n: w.descriptions, label: w.descriptions === 1 ? "event description" : "event descriptions", list: titles(special, w.descriptions) },
    { k: "captions", n: w.captions, label: "photo captions", list: titles(past.filter((_, i) => i % 3 === 0), w.photoEvents).map((t) => `${t}`) },
    // Built on Thursday: Monday to Wednesday it isn't written yet.
    ...(![1, 2, 3].includes(today().getUTCDay()) ? [{ k: "newsletter", n: 1, label: "newsletter built", list: [`From ${w.activities} activities and ${w.photos} photos`, `${w.stories} stories, in every family’s language`, "Ready for review on Friday"] }] : []),
    { k: "messages", n: w.remindersAndInvites, label: "reminders and invites", list: [`${reminders} reminders before booked activities`, `${w.remindersAndInvites - reminders} personal invites from interests`] },
    { k: "replies", n: handled.length, label: "replies handled", list: handled.map((h) => `${h.from}: “${h.reply}”. ${h.did}`) },
    { k: "flyers", n: w.flyers, label: "flyers made", list: titles(special, w.flyers) },
    { k: "pages", n: w.pagesKept, label: "pages kept current", list: ["Today’s menu, every morning", "The activity calendar", "Photos and news"] },
  ];
}
