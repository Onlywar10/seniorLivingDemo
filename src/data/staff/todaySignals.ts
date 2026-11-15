// The things that need a person but used to wait inside their own sections (Calendar, Feedback, Communications,
// Menus, Website, Prospects, Reports), gathered for Today. Each becomes one card, grouped where there are several of
// the same kind ("Take attendance · 4 activities"), with its deadline, who it's for and why, and what happens if it
// isn't done. Everything comes from the demo's own data; signals with no data (a post sent back, failing texts, a
// menu missing at 5 am) simply don't appear. Server Components only.
import type { CommunitySlug } from "@/data/communities";
import { addDays, dayName, dayShort, fmtTime, fromIso, iso, nowMinutes, today } from "@/lib/clock";
import { promises } from "./alpha";
import { engagement } from "./engage";
import { calendarEvents } from "./calEvents";
import { diningRequests } from "./dining";
import { getStaffData } from "./index";
import { menuBoard } from "./menus";
import { inbox } from "./messages";
import type { QItem } from "./portal";
import { ago, STAFF_ROLES, tourCheckIns, type StaffRole } from "./shared";
import { newsletter } from "./newsletter";
import { surveySignals } from "./surveys";

type Task = Extract<QItem, { kind: "task" }>;
const first = (n = "") => n.split(" ")[0];
const hashOf = (x: string) => { let h = 0; for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0; return Math.abs(h); };

export function todaySignals(slug: CommunitySlug, roleOfName: (name?: string) => StaffRole | undefined, names: Record<StaffRole, string>): QItem[] {
  const s = getStaffData(slug);
  const t = today();
  const todayIso = iso(t);
  const now = nowMinutes();
  const out: Task[] = [];
  const at = (date: string, min: number) => Math.round((fromIso(date).getTime() - t.getTime()) / 864e5) * 1440 + min;
  const task = (x: Omit<Task, "kind" | "ago"> & { ago?: string }): void => { out.push({ kind: "task", ago: x.ago ?? ago(x.mins), ...x }); };

  /* ---------- Calendar: finished activities with no attendance, or no photos yet, by whoever led them */
  const week = calendarEvents(slug, addDays(t, -6), 7);
  const ended = (e: (typeof week)[number]) => e.date < todayIso || (e.date === todayIso && (e.end ?? e.start + 60) <= now);
  const noAttendance = week.filter((e) => ended(e) && !e.came && !e.cancelled && e.cat !== "movies" && e.cat !== "faith");
  const noPhotos = week.filter((e) => ended(e) && !e.cancelled && e.wanted && !(e.photos?.length) && e.date === todayIso);
  // Whoever led it, if they sign in; fitness classes (often taught by visiting instructors) belong to the fitness
  // director; everything else to the activities director.
  const byOwner = <T extends { leader?: string; cat?: string }>(xs: T[]) => {
    const m = new Map<StaffRole, T[]>();
    for (const x of xs) { const r = roleOfName(x.leader) ?? (x.cat === "fitness" ? "fitness" : "events"); m.set(r, [...(m.get(r) ?? []), x]); }
    return m;
  };
  for (const [r, evs] of byOwner(noAttendance)) {
    const oldest = evs.reduce((a, b) => (a.date < b.date ? a : b));
    task({
      id: `att-${r}`, signal: "attendance", for: [r], owner: r, type: "Take attendance", icon: "users",
      mins: Math.max(30, now - at(oldest.date, oldest.end ?? oldest.start + 60)),
      title: evs.length === 1 ? `Attendance for ${evs[0].title}` : `Attendance for ${evs.length} activities`,
      context: evs.length === 1 ? `${dayShort(fromIso(evs[0].date))}, ${fmtTime(evs[0].start)} · ${evs[0].room}` : "Finished, and nobody has said who came",
      lines: evs.length > 1 ? evs.sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start).map((e) => `${e.title} · ${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}`) : undefined,
      why: r === "fitness" && !evs.some((e) => roleOfName(e.leader) === "fitness") ? "You run the fitness classes" : r === "events" && !evs.some((e) => e.leader) ? "You run the activities calendar" : "You led it",
      ifNot: "or Reports and “what worked” miss who came",
      help: "Tap the names, scan residents’ check-in cards, or photograph the paper sheet. Families are never told about attendance automatically.",
      due: 1439, dueLabel: "by the end of today",
      main: { label: "Take attendance", href: `/staff/calendar?event=${encodeURIComponent(evs[0].id)}&date=${evs[0].date}` },
      events: evs.map((e) => ({ id: e.id, date: e.date, title: e.title, when: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}` })), focus: "attend",
    });
  }
  for (const [r, evs] of byOwner(noPhotos)) {
    task({
      id: `ph-${r}`, signal: "photos", for: [r], owner: r, type: "Photos wanted", icon: "image", mins: 90,
      title: evs.length === 1 ? `Photos from ${evs[0].title}` : `Photos from ${evs.length} activities`,
      context: evs.length === 1 ? "Photos wanted, none added yet" : "Each asked for photos when it was added",
      lines: evs.length > 1 ? evs.map((e) => e.title) : undefined,
      why: r === "fitness" && !evs.some((e) => roleOfName(e.leader) === "fitness") ? "You run the fitness classes, and they asked for photos" : "You led it, and it asked for photos", ifNot: "or this week’s newsletter goes without them",
      help: "Kinlight suggests who’s in each photo from who came, checks consent and writes the caption.",
      due: 1439, dueLabel: "by the end of today",
      main: { label: "Add photos", href: `/staff/calendar?event=${encodeURIComponent(evs[0].id)}&date=${evs[0].date}&photos=1` },
      events: evs.map((e) => ({ id: e.id, date: e.date, title: e.title, when: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)}` })), focus: "photos",
    });
  }

  /* ---------- People: a resident who likes fitness but hasn't been to a fitness class in three weeks or more. The
     fitness director is asked whether to send a personal invite to a class coming up; Kinlight drafts the text, and it
     goes from Communications, from them. Optional: nothing is sent unless they choose to, and families aren't told. */
  {
    const eng = engagement(slug);
    const lantern = new Set(s.lanternNames);
    const past = calendarEvents(slug, addDays(t, -28), 28).filter((e) => e.cat === "fitness" && !e.lantern && e.date < todayIso);
    const next = calendarEvents(slug, t, 7)
      .filter((e) => e.cat === "fitness" && !e.lantern && !e.cancelled && (e.date > todayIso || e.start > now + 120) && (!e.cap || (e.taken ?? 0) < e.cap))
      .filter((e, i, a) => a.findIndex((x) => x.title === e.title) === i)
      .slice(0, 3);
    const lapsed = Object.values(eng)
      .filter((r) => !lantern.has(r.name) && r.interests.includes("Fitness") && hashOf(r.name + "fit") % 4 === 0)
      .map((r) => ({ r, days: 21 + (hashOf(r.name) % 19), missed: past[hashOf(r.name) % Math.max(1, past.length)]?.title ?? "the fitness classes" }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 2);
    const from = names.fitness;
    if (next.length && from) for (const { r, days, missed } of lapsed) {
      const fn = first(r.name);
      task({
        id: `lapsed-fit-${hashOf(r.name)}`, signal: "lapsed", for: ["fitness"], owner: "fitness", about: r.name, type: "Hasn’t been lately", icon: "heart",
        mins: days * 1440, ago: `${days} days`,
        title: `${fn} hasn’t been to a fitness class in ${days} days`,
        context: `Fitness is one of ${fn}’s interests · last came to ${missed}`,
        why: "You run the fitness classes, and fitness is one of their interests",
        help: `Kinlight noticed ${fn} hasn’t signed up for or come to a fitness class in ${days} days, though they told us they like it. A personal invite from you often works better than a reminder. Pick a class, change the words if you like, and it opens in Communications to send from you. Nothing is sent unless you send it, and families aren’t told.`,
        due: 1440 + 17 * 60, dueLabel: "by tomorrow",
        main: { label: "Review and send" },
        second: { label: "Not now", done: `Noted. ${fn} won’t come up again for two weeks.` },
        invite: { resident: r.name, from, team: "the fitness team", missed, events: next.map((e) => ({ id: e.id, date: e.date, title: e.title, day: e.date === todayIso ? "today" : e.date === iso(addDays(t, 1)) ? "tomorrow" : dayName(fromIso(e.date)), time: fmtTime(e.start).replace(":00", ""), room: e.room })) },
      });
    }
  }

  /* ---------- Calendar: room clashes in the next two days, and events coming up with few sign-ups */
  const soon = calendarEvents(slug, t, 3).filter((e) => !e.cancelled && (e.date > todayIso || e.start > now));
  const clashes = soon.filter((e) => e.clash).filter((e, i, a) => a.findIndex((x) => x.date === e.date && x.room === e.room && x.start === e.start) === i);
  for (const e of clashes) {
    task({
      id: `clash-${e.id}-${e.date}`, signal: "clash", for: ["events"], owner: "events", type: "Room clash", icon: "alert", mins: 60 * 5,
      title: `${e.title} and ${e.clash}`, context: `${dayShort(fromIso(e.date))}, ${fmtTime(e.start)} · both in ${e.room}`,
      why: "You run the activities calendar", ifNot: "or two groups arrive at one room",
      help: "Move one, change a room, or let them share. Everyone booked is told if it moves.",
      due: Math.min(at(e.date, e.start), 1439), main: { label: "Sort it out", href: `/staff/calendar?clash=${encodeURIComponent(e.id)}&date=${e.date}` },
    });
  }
  const thin = soon.filter((e) => e.date > todayIso && e.cap && (e.taken ?? 0) / e.cap < 0.5 && !e.lantern);
  if (thin.length) {
    const next = thin.reduce((a, b) => (at(a.date, a.start) < at(b.date, b.start) ? a : b));
    task({
      id: "thin", signal: "few-signups", for: ["events"], owner: "events", type: "Few sign-ups", icon: "users", mins: 60 * 8,
      title: thin.length === 1 ? `${thin[0].title}: ${thin[0].taken ?? 0} of ${thin[0].cap} seats taken` : `${thin.length} events with few sign-ups`,
      context: thin.length === 1 ? `${dayShort(fromIso(thin[0].date))}, ${fmtTime(thin[0].start)}` : "In the next two days",
      lines: thin.length > 1 ? thin.map((e) => `${e.title} · ${dayShort(fromIso(e.date))} · ${e.taken ?? 0} of ${e.cap}`) : undefined,
      why: "You run the activities calendar", ifNot: "or it runs half empty",
      help: "Personal invites go to residents whose interests match; you choose who and when.",
      due: Math.max(1440, at(next.date, next.start) - 1440), main: { label: "Send invites", href: `/staff/calendar?event=${encodeURIComponent(next.id)}&date=${next.date}` },
    });
  }

  // Residents' ideas aren't a Today card for now: they wait in Feedback, Ideas.

  /* ---------- Communications: questions the AI can't answer, each with one owner by topic */
  const convos = inbox(slug, "manager").convos.filter((c) => c.needsReply && c.owner);
  for (const r of STAFF_ROLES) {
    // The activities director answers family messages in Communications; there's no Today card for them.
    if (r === "events") continue;
    const mine = convos.filter((c) => c.owner === r);
    if (!mine.length) continue;
    // Questions from people thinking of living here: the front desk answers them. Kinlight already sent one
    // acknowledgement; this is "answer the question", never a sales follow-up.
    const asked = mine.filter((c) => c.relation === "Asked about living here");
    const rest = mine.filter((c) => !asked.includes(c));
    if (asked.length) {
      const oldest = Math.max(...asked.map((c) => c.last ?? 60));
      const one = asked.length === 1 ? asked[0] : undefined;
      task({
        id: `asked-${r}`, signal: "inquiry", for: [r], owner: r, type: "Question to answer", icon: "building", mins: oldest,
        title: one ? `${one.name} asked about ${one.resident}` : `${asked.length} questions about living here`,
        context: one ? `From the website · the acknowledgement went straight away` : "From the website and the chat · each got the acknowledgement straight away",
        quote: one ? [...one.msgs].reverse().find((m) => !m.me)?.text : undefined,
        lines: one ? undefined : asked.map((c) => `${c.name} (${c.resident}): “${[...c.msgs].reverse().find((m) => !m.me)?.text ?? ""}”`),
        why: "Questions from people thinking of living here come to the front desk", ifNot: "or it shows as overdue to your manager",
        help: "Kinlight sends one automatic acknowledgement, day or night, and passes the question to you within 5 minutes. A person answers; there are no automatic follow-ups.",
        due: Math.max(now + 60, 1439 - 60), main: { label: one ? "Reply" : "Open Communications", href: "/staff/messages" },
      });
    }
    if (rest.length) {
      const oldest = Math.max(...rest.map((c) => c.last ?? 60));
      const topic: Partial<Record<StaffRole, string>> = { manager: "Billing and anything sensitive come to you", kitchen: "Meals and diets come to you", desk: "Visits, deliveries and the waitlist come to you", events: "Activities come to you", sales: "Prospects and the waitlist come to you", caregiver: "Your residents’ families come to you", lantern: "Lantern families come to you" };
      task({
        id: `msg-${r}`, signal: "message", for: [r], owner: r, type: "Message to answer", icon: "sms", mins: oldest,
        title: rest.length === 1 ? `${rest[0].name} is waiting for a reply` : `${rest.length} family messages to answer`,
        context: rest.length === 1 ? `${rest[0].relation} of ${rest[0].resident} · ${rest[0].why ?? "the AI doesn’t answer this kind"}` : "The AI doesn’t answer these: bills, health, open questions",
        lines: rest.length > 1 ? rest.map((c) => `${c.name} (${first(c.resident)}): ${c.why ?? "a question for staff"}`) : undefined,
        why: topic[r] ?? "It’s yours by topic", ifNot: "or the family waits past one business day",
        help: r === "manager" ? "Billing questions are answered with the business office; you see them because the AI never answers money." : "Kinlight answers clear replies to its own questions. Anything else comes to one person, by topic.",
        due: Math.max(now + 30, 1440 - oldest + now), main: { label: rest.length === 1 ? "Reply" : "Open Communications", href: "/staff/messages" },
      });
    }
  }

  // A family member who replied STOP isn't a card: Kinlight stops texting them at once and marks it on their record
  // ("No automatic texts: replied STOP"). Staff see it there and in Automations, and nothing needs doing.

  /* ---------- Newsletter: built on Thursday, sent Sunday 5 pm. The activities director approves the issue as a whole:
     the events Kinlight picked, with the photos and captions it chose. Photo captions aren't a card of their own. */
  const nl = newsletter(slug);
  if (nl.timeline.stage === "ready") {
    const toSun = (7 - t.getUTCDay()) % 7 || 7;
    const shown = nl.stories.filter((x) => x.owner === "events");
    const pics = shown.filter((x) => x.photo).length;
    task({
      id: "newsletter", signal: "review", for: ["events"], owner: "events", type: "Newsletter to approve", icon: "check", mins: 60 * 30,
      title: "Your section of this week’s newsletter",
      context: `Sends ${nl.timeline.sendsShort} · Kinlight picked ${shown.length} event stories and ${pics} photos, with captions`,
      lines: shown.map((x) => `${x.title}${x.photo ? " · with a photo" : ""}`),
      why: "You run the activities, and the newsletter is made from them",
      ifNot: "or your section sends as Kinlight wrote it",
      help: "Only the stories about events and activities are yours. The kitchen checks the menu, and the executive director their own note. Change any story, photo or caption of yours, then approve your section.",
      due: toSun * 1440 + 12 * 60, main: { label: "Open the newsletter", href: "/staff/newsletter?from=card" },
    });
  }

  /* ---------- Surveys: one to approve (the approver), one closing tomorrow with few replies (its owner) */
  for (const x of surveySignals(slug)) {
    if (x.kind === "approve") task({
      id: `sv-ap-${x.sv.id}`, signal: "survey-approve", for: ["manager"], owner: "manager", type: "Survey to approve", icon: "list", mins: 60 * 20,
      title: `“${x.sv.title}” is ready to approve`, context: x.line, why: "You approve new surveys",
      ifNot: "or it doesn’t go out", help: "A new survey goes to the approver once before it first sends. Open it to preview exactly what residents and families will see.",
      due: 1439, dueLabel: "today", main: { label: "Review and approve", href: `/staff/surveys/${x.sv.id}` },
    });
    if (x.kind === "closing") task({
      id: `sv-cl-${x.sv.id}`, signal: "survey-closing", for: [x.sv.owner], owner: x.sv.owner, type: "Survey closing", icon: "list", mins: 60 * 2,
      title: `“${x.sv.title}” closes soon with few replies`, context: x.line, why: "It’s your survey",
      ifNot: "or the results rest on few answers", help: "Send a reminder now, extend the closing date, or leave paper copies at the front desk.",
      due: 1439, dueLabel: "today", main: { label: "Open the survey", href: `/staff/surveys/${x.sv.id}` },
    });
  }

  /* ---------- Menus: next week's checks and dining requests, in the kitchen's queue */
  const board = menuBoard(slug);
  const checks = board.venues.filter((v) => board.nextStatus[v.venue.key]?.checks);
  if (checks.length) {
    const toSun = (7 - t.getUTCDay()) % 7 || 7;
    task({
      id: "menu-checks", signal: "menu-checks", for: ["kitchen"], owner: "kitchen", type: "Menu checks", icon: "fork", mins: 60 * 20,
      title: checks.length === 1 ? `${checks[0].venue.name}: ${board.nextStatus[checks[0].venue.key].label} for next week` : `Next week’s menus: ${checks.length} restaurants to check`,
      context: "Kinlight filled next week; a few dishes need your answer",
      lines: checks.length > 1 ? checks.map((v) => `${v.venue.name} · ${board.nextStatus[v.venue.key].label}`) : undefined,
      why: "You run the menus", ifNot: "or those days go out with last week’s dishes",
      help: "A quick yes or no on the dishes Kinlight wasn’t sure of. Everything else publishes day by day on its own.",
      due: (toSun - 1) * 1440 + 17 * 60, main: { label: "Check them", href: `/staff/menus?room=${checks[0].venue.key}` },
    });
  }
  const reqs = diningRequests(slug).requests.filter((r) => r.status === "needs-person");
  if (reqs.length) {
    task({
      id: "dining", signal: "dining-request", for: ["kitchen"], owner: "kitchen", type: "Dining request", icon: "fork", mins: 60 * 2,
      title: reqs.length === 1 ? `${reqs[0].from}: “${reqs[0].text}”` : `${reqs.length} dining requests to answer`,
      context: reqs.length === 1 ? reqs[0].fromLabel : "Kinlight couldn’t answer these on its own",
      lines: reqs.length > 1 ? reqs.map((r) => `${r.from}: “${r.text}”`) : undefined,
      why: "Requests the kitchen has to decide come to you", ifNot: "or the resident hears nothing before the meal",
      help: "A table booking, something off the menu or a delivery to a room: a person decides, then the resident is told.",
      due: 15 * 60, main: { label: "Answer", href: `/staff/menus?room=${board.venues[0].venue.key}&start=requests` },
    });
  }

  // No "page to update" card: the website's pages fill themselves from the calendar, menus and photos.

  /* ---------- Apartments (front desk): tours count themselves when the visitor checks in (they reply HERE to the
     reminder, or the desk taps Arrived). Only a finished tour with no check-in comes here: did they come, or was it a
     no-show? That's the tour number on the scorecard. The waitlist is told about an opening automatically. */
  const ins = tourCheckIns(s.tours, now);
  for (const x of s.tours.filter((y) => y.days === 0 && y.time + 60 <= now && !ins.has(y.who))) {
    const rep = s.people[x.with]?.name.split(" ")[0];
    task({
      id: `tour-${x.who}`, signal: "tour", for: ["desk"], owner: "desk", type: "No check-in", icon: "building", mins: Math.max(5, now - (x.time + 60)),
      title: `${x.who} never checked in for their tour`,
      context: `${fmtTime(x.time)} · ${x.interest}${rep ? ` · with ${rep}` : ""}`,
      why: "You keep the tour count", ifNot: "or it isn’t in this month’s tour number",
      help: "Visitors check in by replying HERE to their reminder text, or you tap Arrived when they come in, and the tour counts itself. This one has no check-in, so say whether they came. No notes about the visitor.",
      due: 1439, dueLabel: "by the end of today",
      main: { label: "They came", done: `Counted: ${x.who}’s tour.` },
      second: { label: "No-show", done: `Noted: ${x.who} didn’t come. It isn’t counted.` },
    });
  }

  /* ---------- Reports: a promise at risk this month */
  for (const p of promises(slug).filter((x) => x.status === "At risk")) {
    task({
      id: `promise-${p.code}`, signal: "promise", for: ["manager"], owner: "manager", type: "Promise at risk", icon: "chart", mins: 60 * 48,
      title: `${p.promise} (${p.code})`, context: p.target, quote: p.evidence,
      why: "You see every promise Kinlight makes to your community", ifNot: "or it’s missed at the month’s review",
      help: "One of the promises in your agreement is behind this month. Reports shows the evidence.",
      due: 3 * 1440 + 12 * 60, main: { label: "See why", href: "/staff/reports" },
    });
  }

  void names;
  return out;
}
