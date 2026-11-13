// The things that need a person but used to wait inside their own sections (Calendar, Feedback, Communications,
// Menus, Website, Prospects, Reports), gathered for Today. Each becomes one card, grouped where there are several of
// the same kind ("Take attendance · 4 activities"), with its deadline, who it's for and why, and what happens if it
// isn't done. Everything comes from the demo's own data; signals with no data (a post sent back, failing texts, a
// menu missing at 5 am) simply don't appear. Server Components only.
import type { CommunitySlug } from "@/data/communities";
import { addDays, dayShort, fmtTime, fromIso, iso, nowMinutes, today } from "@/lib/clock";
import { promises, suggestions } from "./alpha";
import { calendarEvents } from "./calEvents";
import { diningRequests } from "./dining";
import { getStaffData } from "./index";
import { menuBoard } from "./menus";
import { inbox } from "./messages";
import type { QItem } from "./portal";
import { ago, STAFF_ROLES, type StaffRole } from "./shared";
import { sitePages } from "./website";
import { unreachableFamilies } from "./automations";
import { surveySignals } from "./surveys";

type Task = Extract<QItem, { kind: "task" }>;
const first = (n = "") => n.split(" ")[0];

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
      main: { label: "Take attendance", href: evs.length === 1 ? `/staff/calendar?event=${encodeURIComponent(evs[0].id)}&date=${evs[0].date}` : "/staff/calendar" },
    });
  }
  for (const [r, evs] of byOwner(noPhotos)) {
    task({
      id: `ph-${r}`, signal: "photos", for: [r], owner: r, type: "Photos wanted", icon: "image", mins: 90,
      title: evs.length === 1 ? `Photos from ${evs[0].title}` : `Photos from ${evs.length} activities`,
      context: evs.length === 1 ? "Photos wanted, none added yet" : "Each asked for photos when it was added",
      lines: evs.length > 1 ? evs.map((e) => `${e.title} · ${e.wanted} wanted`) : undefined,
      why: r === "fitness" && !evs.some((e) => roleOfName(e.leader) === "fitness") ? "You run the fitness classes, and they asked for photos" : "You led it, and it asked for photos", ifNot: "or this week’s newsletter goes without them",
      help: "Kinlight suggests who’s in each photo from who came, checks consent and writes the caption.",
      due: 1439, dueLabel: "by the end of today",
      main: { label: "Add photos", href: evs.length === 1 ? `/staff/calendar?event=${encodeURIComponent(evs[0].id)}&date=${evs[0].date}&photos=1` : "/staff/calendar?photos=1" },
    });
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

  /* ---------- Feedback: residents' ideas waiting for an answer */
  const ideas = suggestions(slug).filter((x) => x.status === "New");
  if (ideas.length) {
    const oldest = Math.max(...ideas.map((x) => x.days));
    task({
      id: "ideas", signal: "idea", for: ["events"], owner: "events", type: "Resident idea", icon: "heart", mins: oldest * 1440,
      title: ideas.length === 1 ? `“${ideas[0].text}”` : `${ideas.length} resident ideas waiting`,
      context: ideas.length === 1 ? `From ${ideas[0].who ?? "a resident"}` : "Each one hears back once you reply or put it on the calendar",
      lines: ideas.length > 1 ? ideas.map((x) => `“${x.text}”${x.who ? ` · ${x.who}` : ""}`) : undefined,
      why: "You look after residents’ ideas", ifNot: "or residents stop suggesting things",
      help: "Reply to say thank you, or schedule it: the resident hears “your idea made the calendar”.",
      due: Math.max(1440 + 17 * 60, (7 - oldest) * 1440 + 17 * 60), main: { label: "Reply or schedule", href: "/staff/feedback?tab=ideas" },
    });
  }

  /* ---------- Communications: questions the AI can't answer, each with one owner by topic */
  const convos = inbox(slug, "manager").convos.filter((c) => c.needsReply && c.owner);
  for (const r of STAFF_ROLES) {
    const mine = convos.filter((c) => c.owner === r);
    if (!mine.length) continue;
    const lead = mine.filter((c) => r === ("sales" as StaffRole) && /assisted living|move|moving/i.test(c.msgs.map((m) => m.text).join(" ")));
    const rest = mine.filter((c) => !lead.includes(c));
    for (const c of lead) {
      task({
        id: `lead-${c.id}`, signal: "sales-lead", for: ["sales"], owner: "sales", type: "Moving-in question", icon: "building", mins: c.last ?? 60,
        title: `${c.name} asked about more care for ${first(c.resident)}`, context: `${c.relation} of ${c.resident} · in Communications`,
        quote: [...c.msgs].reverse().find((m) => !m.me)?.text,
        why: "Questions about moving in or more care go to sales", ifNot: "or the family is left wondering",
        help: "Kinlight spotted that it’s about moving to assisted living and sent it to you, not the activities team. Nothing about care itself is answered here.",
        due: Math.max(now + 90, 1439 - 60), main: { label: "Reply", href: "/staff/messages" },
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

  /* ---------- Automations: a family nobody can reach by text any more (they replied STOP, with no email on file) */
  for (const pb of unreachableFamilies(slug)) {
    const r = pb.owner;
    task({
      id: `unreach-${pb.who}`, signal: "unreachable", for: [r], owner: r, about: pb.resident, type: "Can’t reach", icon: "sms",
      mins: Math.max(30, now - pb.at),
      title: `${first(pb.resident)}’s family can’t be reached by text`,
      context: `${pb.who}, ${pb.rel.toLowerCase()}, replied STOP`,
      why: "A family nobody can reach is an operations matter, so it comes to you",
      ifNot: `or ${first(pb.resident)}’s family hears nothing from us: no reminders, no family events`,
      help: "They were the only family member on file who takes texts. A call to ask how they’d like to hear from us: email, another family member, or texts again (they reply START).",
      due: 1439, dueLabel: "today",
      main: { label: "Call them", href: pb.phone ? `tel:+1${pb.phone.replace(/\D/g, "")}` : "/staff/automations?tab=problems", done: `Called about ${first(pb.resident)}’s family` },
      second: { label: "Open in Automations", href: "/staff/automations?tab=problems" },
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

  /* ---------- Website: pages due for their update, for each page's owner */
  const pages = sitePages(slug).filter((p) => p.dueIn <= 2);
  for (const r of STAFF_ROLES) {
    const mine = pages.filter((p) => p.ownerRole === r);
    if (!mine.length) continue;
    const soonest = Math.min(...mine.map((p) => p.dueIn));
    task({
      id: `pages-${r}`, signal: "page-due", for: [r], owner: r, type: "Page to update", icon: "globe", mins: 60 * 24,
      title: mine.length === 1 ? `${mine[0].title} page` : `${mine.length} website pages due`,
      context: mine.length === 1 ? `Updated ${mine[0].rhythm.toLowerCase()}` : "Each has a rhythm you set",
      lines: mine.length > 1 ? mine.map((p) => `${p.title} · ${p.dueIn <= 0 ? "due now" : p.dueIn === 1 ? "due tomorrow" : `due in ${p.dueIn} days`}`) : undefined,
      why: "It’s your page", ifNot: "or it shows out-of-date news to families and visitors",
      help: "Each page has an owner and a rhythm; Kinlight reminds the owner before it goes stale.",
      due: Math.max(now + 120, soonest * 1440 + 17 * 60), main: { label: "Update it", href: mine.length === 1 ? `/staff/website?page=${encodeURIComponent(mine[0].id)}` : "/staff/website" },
    });
  }

  /* ---------- Apartments (front desk): today's finished tours, counted. Kinlight doesn't do sales in the alpha, so
     the only thing asked is whether the tour happened: that's the tour number on the scorecard. The waitlist is told
     about an opening automatically, so it needs nobody. */
  const done = s.tours.filter((x) => x.days === 0 && x.time + 60 <= now);
  if (done.length) {
    task({
      id: "tours-today", signal: "tour", for: ["desk"], owner: "desk", type: "Tours to count", icon: "building", mins: now - (done[0].time + 60),
      title: done.length === 1 ? `Did ${done[0].who}’s tour happen?` : `Did today’s ${done.length} tours happen?`,
      context: done.length === 1 ? `${fmtTime(done[0].time)} · ${done[0].interest}` : "Booked through the website chat and the tour page",
      lines: done.length > 1 ? done.map((x) => `${fmtTime(x.time)} · ${x.who}`) : undefined,
      why: "You keep the tour count", ifNot: "or this month’s tour number is short",
      help: "Only whether each tour happened, for the monthly tour number. No notes about the visitor.",
      due: 1439, main: { label: done.length === 1 ? "It happened" : "Count them", href: "/staff/prospects#tours" },
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
