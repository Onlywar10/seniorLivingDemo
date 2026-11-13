// The kitchen's menus, built around how each restaurant already plans: a cycle menu that rolls forward, an
// always-available menu that rarely changes, or daily specials filled each morning (see MenuPlan in data/shared).
// Kinlight carries every week forward from these templates; the chef only sees what differs ("Coming up").
// Also: today's menus as live on the website, the substitution log, the dated record of menus as served, holiday menus
// waiting for the approver, and each restaurant's hours. Built from the community's own menus, so Alder Bend and
// Kestrel Point get their own restaurants. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { cycleWeek, type CycleDish, type CycleMeal, type DailySlot, type DayMenu, type Dish, type MealPeriod, type MenuCycle, type MenuPlan, type MenuTemplate, type Section, type Tag, type Venue, type VenuePlan } from "@/data/shared";
import { addDays, dayName, dayShort, dow, fmtTime, fromIso, iso, shortDate, today } from "@/lib/clock";
import { getStaffData } from "./index";
import { atToday } from "./shared";
import { themeNight } from "./dining";
import { morningMenuReach } from "./automations";

export interface HolidayMenu {
  id: string; venue: string; venueName: string; date: string; label: string; name: string; desc?: string; items: string[]; by: string; sent: string; hours?: string;
  /** Holiday menus replace a day; theme nights replace one meal. */
  kind: "holiday" | "theme";
  /** Nothing goes public until the approver says yes. */
  status: "waiting" | "approved";
  approved?: string;
  /** Where it was announced once approved. */
  announced?: string[];
  /** Booking by text: "Seatings 11:30 am and 1:30 pm · up to 4 guests" */
  booking?: string;
}

/** One restaurant on the Menus screen: its template, what Kinlight carries forward, and what the kitchen gave it. */
export interface BoardVenue {
  venue: Venue;
  bar: boolean;
  template: MenuTemplate;
  /** "Cycle menu · Week 2 of 4 · Fall/Winter" */
  line: string;
  /** What Kinlight does on its own, in one line. */
  carry: string;
  standing: Section[];
  /** "Oct 3" */
  standingChanged: string;
  /** The meals it serves and their usual times. */
  meals: MealPeriod[];
  /** The cycle; `days` is each day meal by meal, [week][day][meal], with the special as dinner's entrée. */
  cycle?: MenuCycle & { days: CycleMeal[][][]; now: number; next: number; startsLabel: string; endsLabel: string; dueLabel: string; reminders: string[]; daysToDue: number };
  slots?: DailySlot[];
  via?: VenuePlan["via"];
  /** This week's daily items, Sunday first (the chef's special, or the board's slots). */
  daily: { date: string; values: Record<string, Dish> }[];
  /** "Today, 6:40 am" for the daily board. */
  posted?: string;
  holds: NonNullable<VenuePlan["holds"]>;
  lantern?: { finger: string[] };
  /** Next week's menus, as they will publish, for the large-print card. */
  next: DayMenu[];
}

/** Something in a coming week that differs from the template, for the chef to confirm with one tap. */
export interface ComingCheck {
  id: string;
  kind: "tags" | "unsure" | "holiday" | "skip" | "hours";
  venue: string;
  venueName: string;
  date?: string;
  title: string;
  detail: string;
  options: { label: string; answer: string }[];
  /** "Something else": the chef types it. */
  other?: string;
  /** The holiday menu this check follows (approved by the approver, not here). */
  holiday?: string;
}
export interface ComingWeek {
  key: string;
  /** "Next week" or "Thanksgiving week" */
  tab: string;
  range: string;
  rangeLong: string;
  dates: string[];
  /** What each restaurant does this week, without anyone touching it. */
  plan: { venue: string; name: string; line: string }[];
  checks: ComingCheck[];
}

/** A change to a menu after it was published: what changed, when, who. */
export interface SubEntry { id: string; date: string; when: string; venue: string; venueName: string; what: string; why?: string; by: string }
/** One day's menus as actually served, kept for at least 30 days. */
export interface ServedDay { date: string; label: string; menus: { venue: string; name: string; lines: string[] }[]; changes: number }

export interface MenuBoard {
  community: string;
  domain: string;
  chef: string;
  chefFirst: string;
  approver: string;
  approverFirst: string;
  venues: BoardVenue[];
  coming: ComingWeek[];
  live: { date: string; label: string; published: string; menus: { venue: Venue; bar: boolean; menu: DayMenu }[] };
  holidays: HolidayMenu[];
  subs: SubEntry[];
  served: ServedDay[];
  sendsBy: string;
  /** Residents and families who get the morning menu text. */
  textOptIns: number;
  /** "Next week’s menus published Fri, Nov 6" */
  publishedAhead: string;
  /** Next week, per restaurant: "Ready", "2 to check" or "Filled each morning". */
  nextStatus: Record<string, { label: string; tone: "good" | "warn" | "info"; checks: number }>;
}

const first = (n: string) => n.split(" ")[0];
const isBar = (v: Venue) => /coffee/i.test(v.kind);
const label = (isoDate: string) => shortDate(fromIso(isoDate));
const range = (a: Date, b: Date) => (a.getUTCMonth() === b.getUTCMonth() ? `${shortDate(a)}–${b.getUTCDate()}` : `${shortDate(a)}–${shortDate(b)}`);

/**
 * A plan for a community whose kitchen hasn't set one up: read from its menus, the first restaurant as a cycle that
 * repeats weekly, the second as an always-available menu with a chef's special, the third as daily specials.
 */
function planFromMenus(slug: CommunitySlug): MenuPlan {
  const c = communities[slug];
  const t = today();
  const sun = addDays(t, -dow(t));
  const plan: MenuPlan = {};
  c.venueOrder.forEach((k, i) => {
    const days = Array.from({ length: 7 }, (_, d) => c.menuFor(k, addDays(sun, d)));
    const base = days.find((d) => !d.holiday) ?? days[0];
    const standing = base.sections.map((s) => ({ ...s, items: s.items.filter((it) => it.name !== base.special.name) }));
    if (i === 0) {
      const dish = (x: Dish): CycleDish => ({ ...x, plain: x.name });
      plan[k] = {
        template: "cycle", standing, standingChanged: iso(addDays(t, -40)),
        cycle: { season: "Fall/Winter", nextSeason: "Spring/Summer", anchor: iso(sun), weeks: 1, starts: "2026-10-04", ends: "2027-03-27", nextDue: "2027-03-01", specials: [days.map((d) => dish(d.special))], soups: [days.map((d) => dish(d.soup))], periods: [c.venues[k].hours] },
      };
    } else if (i === 1) plan[k] = { template: "standing", standing, standingChanged: iso(addDays(t, -38)), slots: [{ key: "special", label: "Chef’s special", period: "All day" }], via: "text" };
    else plan[k] = { template: "daily", standing, standingChanged: iso(addDays(t, -60)), slots: [{ key: "special", label: "Special", period: "All day" }, { key: "soup", label: "Soup of the day", period: "Lunch" }], via: "photo" };
  });
  return plan;
}

export function menuBoard(slug: CommunitySlug): MenuBoard {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const plan = c.menuPlan ?? planFromMenus(slug);
  const chef = s.people[s.roles.menus].name;
  const approver = s.people[s.roles.approver].name;
  const dining = Object.values(s.people).find((p) => /Dining Experience/.test(p.role))?.name ?? chef;
  const sun = addDays(t, -dow(t));
  const nextSun = addDays(sun, 7);
  const thisWeek = Array.from({ length: 7 }, (_, i) => addDays(sun, i));
  const nextWeek = Array.from({ length: 7 }, (_, i) => addDays(nextSun, i));
  const slotsOf = (k: string, d: Date): Record<string, Dish> => {
    const got = c.slotsFor?.(k, d);
    if (got && Object.keys(got).length) return got;
    const m = c.menuFor(k, d);
    return { special: m.special, soup: m.soup };
  };

  const venues: BoardVenue[] = c.venueOrder.map((k) => {
    const venue = c.venues[k];
    const p = plan[k];
    const changed = label(p.standingChanged);
    let cycle: BoardVenue["cycle"];
    let line: string;
    let carry: string;
    if (p.template === "cycle" && p.cycle) {
      const cy = p.cycle;
      const now = cycleWeek(cy, t);
      const due = fromIso(cy.nextDue);
      cycle = {
        ...cy, days: [], now, next: cycleWeek(cy, nextSun),
        startsLabel: label(cy.starts), endsLabel: label(cy.ends), dueLabel: label(cy.nextDue),
        reminders: [label(iso(addDays(due, -28))), label(iso(addDays(due, -7)))],
        daysToDue: Math.round((due.getTime() - t.getTime()) / 86400000),
      };
      line = cy.weeks > 1 ? `${cy.weeks}-week ${cy.season} cycle · this week is cycle week ${now + 1}` : `${cy.season} menu, the same every week`;
      carry = cy.weeks > 1 ? `Moves on to the next cycle week every Sunday, back to cycle week 1 after week ${cy.weeks}` : "Puts the same menu up again every Sunday";
    } else if (p.template === "standing") {
      line = `Always available · last changed ${changed}`;
      carry = p.slots?.length ? "Keeps the standing menu; adds each day’s chef’s special" : "Keeps the standing menu up every day";
    } else {
      line = `Daily specials · today posted ${atToday(400).replace("Today, ", "").replace("Yesterday, ", "yesterday ")}`;
      carry = `Puts ${p.slots?.length ?? 0} slots up each morning from ${p.via === "photo" ? "a photo of the board" : p.via === "text" ? "a text" : "a quick form"}`;
    }
    const meals = mealPeriods(venue, p.standing, isBar(venue));
    if (cycle) cycle.days = cycleDays(cycle, meals);
    return {
      venue, bar: isBar(venue), template: p.template, line, carry, meals,
      standing: p.standing, standingChanged: changed, cycle, slots: p.slots, via: p.via,
      daily: p.slots?.length ? thisWeek.map((d) => ({ date: iso(d), values: slotsOf(k, d) })) : [],
      posted: p.template === "daily" ? atToday(400) : undefined,
      holds: p.holds ?? [], lantern: p.lantern,
      next: nextWeek.map((d) => c.menuFor(k, d)),
    };
  });

  // Holiday and special menus in the next five weeks, sent to the approver first.
  const uploadedOn = dayShort(addDays(t, -1)).split(",")[0];
  const holidays: HolidayMenu[] = [];
  for (let i = 0; i < 35; i++) {
    const d = addDays(t, i);
    for (const k of c.venueOrder) {
      const m = c.menuFor(k, d);
      if (!m.holiday) continue;
      holidays.push({
        kind: "holiday", status: "approved", approved: `${first(approver)} approved Nov 4`,
        announced: ["Website dining page", "Sunday newsletter", `Text to ${morningMenuReach(slug)} opted-in residents and families`],
        booking: "Seatings 11:30 am and 1:30 pm · up to 4 guests per apartment · reply to book",
        id: `hol-${k}-${m.date}`, venue: k, venueName: c.venues[k].name, date: m.date, label: dayShort(d), name: m.special.name, desc: m.special.desc,
        items: m.sections.flatMap((x) => x.items.map((it) => it.name)).slice(0, 6), by: chef, sent: `${uploadedOn}, 3:55 pm`,
        hours: m.sections[0]?.title.split(" · ")[1],
      });
    }
  }

  // A theme night (approved, so it's announced and taking bookings) and a holiday menu still waiting for the
  // approver, which stays off every public page until it's approved.
  const theme = themeNight(slug);
  const mainK = c.venueOrder[0];
  holidays.push({
    kind: "theme", status: "approved", approved: `${first(approver)} approved Nov 9`, id: `theme-${theme.date}`, venue: mainK, venueName: c.venues[mainK].name,
    date: theme.date, label: dayShort(fromIso(theme.date)), name: theme.name, desc: "Replaces dinner that evening", items: ["Dungeness crab cakes", "Cioppino", "Grilled swordfish", "Key lime pie"],
    by: chef, sent: "Mon, 2:10 pm", hours: "5:00–7:00 pm", booking: `${theme.cap} seats · full · waitlist ${theme.waitlist}`,
    announced: ["Website dining page", "Sunday newsletter", "Text to residents who opted in"],
  });
  holidays.push({
    kind: "holiday", status: "waiting", id: `hol-xmas-eve`, venue: mainK, venueName: c.venues[mainK].name, date: "2026-12-24", label: dayShort(fromIso("2026-12-24")),
    name: "Christmas Eve Dinner", desc: "Replaces dinner that evening", items: ["Prime rib with Yorkshire pudding", "Maple-glazed salmon", "Chestnut soup", "Bûche de Noël"],
    by: chef, sent: `${uploadedOn}, 4:20 pm`, hours: "4:00–7:00 pm", booking: "Seatings 4:00 and 6:00 pm · up to 4 guests per apartment",
  });

  // "Coming up": next week, and any later week in the next three with a holiday in it.
  const weekStarts = [nextSun, ...[1, 2].map((n) => addDays(nextSun, 7 * n)).filter((w) => holidays.some((h) => h.date >= iso(w) && h.date <= iso(addDays(w, 6))))];
  const coming: ComingWeek[] = weekStarts.map((ws, wi) => {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const end = dates[6];
    const hols = holidays.filter((h) => h.date >= iso(ws) && h.date <= iso(end));
    const checks: ComingCheck[] = [];
    // Tags an ingredient contradicts, until the chef answers (the same question every week).
    for (const v of venues) for (const h of v.holds) {
      checks.push({
        id: `tags-${v.venue.key}-${h.dish}`, kind: "tags", venue: v.venue.key, venueName: v.venue.name,
        title: `${h.dish}: check the dietary tags`,
        detail: `Your menu says ${h.tags.map((x) => tagNames[x]).join(" · ")}, but it has ${h.why.join("; ")}. Kinlight is holding the tags back until you say.`,
        options: [{ label: h.tags.length > 1 ? "Take the tags off" : "Take the tag off", answer: "No tags" }, ...(h.maybe ?? []).map((m) => ({ label: `Keep ${tagNames[m.tag]}: ${m.if}`, answer: `${tagNames[m.tag]} only` }))],
      });
    }
    if (wi === 0) {
      // Something Kinlight read but wasn't sure of: one line of the chef's text about Thursday's special.
      const sv = venues.find((v) => v.template === "standing" && v.slots?.length);
      if (sv) {
        const thu = dates[4];
        const same = slotsOf(sv.venue.key, addDays(thu, -7)).special ?? Object.values(slotsOf(sv.venue.key, addDays(thu, -7)))[0];
        const word = same.name.split(" ").slice(-1)[0].toLowerCase();
        checks.push({
          id: `unsure-${sv.venue.key}-${iso(thu)}`, kind: "unsure", venue: sv.venue.key, venueName: sv.venue.name, date: iso(thu),
          title: `Thursday’s chef’s special: “${word}”`,
          detail: `${first(chef)}’s text said “Thu – ${word}”. Kinlight only found one dish like that on your menus.`,
          options: [{ label: `${same.name}, as last Thursday`, answer: same.name }],
          other: "Type the special",
        });
      }
    }
    for (const h of hols) {
      const v = venues.find((x) => x.venue.key === h.venue)!;
      const hd = fromIso(h.date);
      checks.push({ id: `hol-${h.id}`, kind: "holiday", venue: h.venue, venueName: h.venueName, date: h.date, holiday: h.id, title: `${h.name} replaces ${dayName(hd)}`, detail: `The holiday menu goes up instead of the template that day.`, options: [] });
      if (v.cycle) {
        const wk = cycleWeek(v.cycle, hd);
        const skipped = v.cycle.specials[wk][dow(hd)];
        const friday = v.cycle.specials[wk][(dow(hd) + 1) % 7];
        checks.push({
          id: `skip-${h.id}`, kind: "skip", venue: h.venue, venueName: h.venueName, date: h.date,
          title: `${dayShort(hd)}: ${skipped.name} won’t be served`,
          detail: `It’s on cycle week ${wk + 1}, and the holiday menu takes its place.`,
          options: [{ label: "Skip it this time", answer: "Skipped this time" }, { label: `Add it to ${dayName(addDays(hd, 1))} beside ${friday.name}`, answer: `Also on ${dayName(addDays(hd, 1))}` }],
        });
      }
      if (h.hours) {
        checks.push({
          id: `hours-${h.id}`, kind: "hours", venue: h.venue, venueName: h.venueName, date: h.date,
          title: `${h.venueName} hours on ${dayShort(hd)}: ${h.hours}`,
          detail: `Read from the holiday menu. Usual hours: ${v.venue.hours}.`,
          options: [{ label: "Use these hours that day", answer: `${h.hours} on ${dayShort(hd)}` }, { label: "Keep the usual hours", answer: "Usual hours" }],
        });
      }
    }
    const planLines = venues.map((v) => {
      const hol = hols.find((h) => h.venue === v.venue.key);
      if (v.template === "cycle" && v.cycle) {
        const wk = cycleWeek(v.cycle, ws);
        const base = v.cycle.weeks > 1 ? `Filled from your cycle, Week ${wk + 1} of ${v.cycle.weeks} (${v.cycle.season})` : `Filled from your ${v.cycle.season} menu`;
        return { venue: v.venue.key, name: v.venue.name, line: hol ? `${base}; ${hol.name} on ${dayName(fromIso(hol.date))}` : `${base}: nothing to upload` };
      }
      if (v.template === "standing") return { venue: v.venue.key, name: v.venue.name, line: `Standing menu, unchanged${v.slots?.length ? `; chef’s specials from ${first(chef)}’s text` : ""}` };
      return { venue: v.venue.key, name: v.venue.name, line: `${v.slots?.length ?? 0} slots a day, waiting: filled each morning` };
    });
    return {
      key: wi === 0 ? "next" : `w${wi}`,
      tab: wi === 0 ? "Next week" : hols.length ? `${hols[0].name.replace(/ (Dinner|Lunch|Brunch|Menu)$/, "")} week` : `Week of ${shortDate(ws)}`,
      range: range(ws, end), rangeLong: `${dayShort(ws)} – ${dayShort(end)}`, dates: dates.map(iso), plan: planLines, checks,
    };
  });

  // The substitution log: changes made after a menu went up, newest first. Today's changes are added on the screen.
  const sub = (back: number, at: number, vi: number, what: (m: DayMenu) => string, why: string, by: string): SubEntry => {
    const d = addDays(t, -back);
    const k = c.venueOrder[vi % c.venueOrder.length];
    return { id: `sub-${back}-${k}`, date: iso(d), when: `${back === 1 ? "Yesterday" : dayShort(d)}, ${fmtTime(at)}`, venue: k, venueName: c.venues[k].name, what: what(c.menuFor(k, d)), why, by };
  };
  const subs: SubEntry[] = [
    sub(1, 18 * 60 + 15, 0, (m) => `${m.special.name} taken off`, "Sold out", chef),
    sub(2, 11 * 60 + 40, 1, (m) => `Grilled cheese and tomato soup instead of ${m.special.name}`, "Delivery late", chef),
    sub(5, 7 * 60 + 5, 2, (m) => `Banana bread instead of ${m.sections[0]?.items[2]?.name.replace(/^Pastry of the day: /, "") ?? "the pastry"}`, "Oven down", dining),
    sub(9, 16 * 60 + 30, 0, (m) => `${m.sections[1]?.items[2]?.name ?? m.soup.name} taken off`, "Out of stock", chef),
  ];

  // Menus as served, the last 30 days, dated: each restaurant's rotating items, with that day's changes.
  const served: ServedDay[] = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(t, -(i + 1));
    const day = iso(d);
    return {
      date: day, label: dayShort(d), changes: subs.filter((x) => x.date === day).length,
      menus: c.venueOrder.map((k) => {
        const m = c.menuFor(k, d);
        const x = subs.filter((y) => y.date === day && y.venue === k).map((y) => `Changed: ${y.what}`);
        const p = plan[k];
        const lines = p.template === "daily"
          ? Object.entries(slotsOf(k, d)).map(([sk, v]) => `${p.slots?.find((z) => z.key === sk)?.label ?? sk}: ${v.name}`)
          : [`${m.holiday ?? (p.template === "cycle" ? "Special" : "Chef’s special")}: ${m.special.name}`, `Soup: ${m.soup.name}`, "Plus the standing menu"];
        return { venue: k, name: c.venues[k].name, lines: [...lines, ...x] };
      }),
    };
  });

  const fresh = s.freshness.find((f) => f.at !== undefined)?.at ?? 370;
  return {
    community: s.brand.name, domain: s.brand.domain, chef, chefFirst: first(chef), approver, approverFirst: first(approver),
    venues, coming, holidays, subs, served,
    live: { date: iso(t), label: dayShort(t), published: `${atToday(fresh)} by ${chef}`, menus: c.venueOrder.map((k) => ({ venue: c.venues[k], bar: isBar(c.venues[k]), menu: c.menuFor(k, t) })) },
    sendsBy: `${dayName(nextSun)}, ${shortDate(nextSun)} at 5 am`,
    // The same people Automations → Morning menu reaches.
    textOptIns: morningMenuReach(slug),
    publishedAhead: `Next week’s menus published ${dayShort(addDays(sun, -2))}`,
    nextStatus: Object.fromEntries(venues.map((v) => {
      const n = coming[0]?.checks.filter((x) => x.venue === v.venue.key && x.kind !== "holiday").length ?? 0;
      if (v.template === "daily") return [v.venue.key, { label: "Filled each morning", tone: "info" as const, checks: 0 }];
      return [v.venue.key, n ? { label: `${n} to check`, tone: "warn" as const, checks: n } : { label: "Ready", tone: "good" as const, checks: 0 }];
    })),
  };
}


// ---------------------------------------------------------------- meal periods and the courses of each cycle day

/** "7:00–10:30 am", "11:00 am–2:00 pm", "3:00–4:00 pm" → minutes from midnight. */
function parseRange(s?: string): { start: number; end: number } | null {
  const m = s?.match(/(\d{1,2}):(\d{2})\s*(am|pm)?\s*[–-]\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return null;
  const at = (h: string, mm: string, ap: string) => ((Number(h) % 12) + (ap.toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(mm);
  return { start: at(m[1], m[2], m[3] ?? m[6]), end: at(m[4], m[5], m[6]) };
}
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");

/**
 * The meals a restaurant serves and their usual times, as a dining program plans them: breakfast, lunch and dinner
 * inside the restaurant's hours, with any times the kitchen printed on its menu ("Breakfast · 7:00–10:30 am") winning.
 * A coffeehouse keeps its own periods (morning, lunch, happy hour) straight from its menu.
 */
function mealPeriods(venue: Venue, standing: Section[], bar: boolean): MealPeriod[] {
  const printed = standing.flatMap((s) => { const r = parseRange(s.note); return r ? [{ key: slug(s.title), label: s.title, ...r }] : []; });
  if (bar && printed.length) return printed;
  const out: MealPeriod[] = [];
  if (venue.open <= 8 * 60) out.push({ key: "breakfast", label: "Breakfast", start: venue.open, end: 10 * 60 + 30 });
  if (venue.open <= 13 * 60) out.push({ key: "lunch", label: "Lunch", start: Math.max(venue.open, out.length ? 11 * 60 + 30 : venue.open), end: 13 * 60 + 30 });
  if (venue.close >= 18 * 60) out.push({ key: "dinner", label: "Dinner", start: 16 * 60 + 30, end: venue.close });
  for (const p of printed) {
    const same = out.find((o) => o.label.toLowerCase() === p.label.toLowerCase());
    if (same) { same.start = p.start; same.end = p.end; }
  }
  return out;
}

// What a kitchen's cycle plans around each special: lunch plates, alternates, sides and desserts. A demo's stand-in
// for the rest of the uploaded cycle; every name is something the kitchen would have written.
const pool = {
  breakfast: ["Buttermilk pancakes with warm maple syrup", "Vegetable frittata", "Biscuits and country gravy", "Cinnamon French toast", "Spinach and feta omelet", "Steel-cut oatmeal with berries", "Huevos rancheros", "Lemon ricotta pancakes", "Eggs Benedict", "Sausage and potato scramble", "Belgian waffle with strawberries", "Breakfast burrito"],
  breakfastAlt: ["Eggs any style", "Yogurt parfait", "Oatmeal with brown sugar", "Two eggs with toast"],
  breakfastSide: ["Breakfast potatoes", "Hash browns", "Wheat toast", "Fresh fruit cup", "Turkey sausage", "Applewood bacon"],
  lunch: ["Chicken Caesar wrap", "Turkey club sandwich", "Cobb salad", "Tuna melt on rye", "Chicken pot pie", "French dip with au jus", "Spinach quiche", "Grilled salmon salad", "BLT on sourdough", "Chicken salad croissant", "Beef chili with cornbread", "Caprese panini", "Shepherd’s pie", "Fish tacos"],
  lunchAlt: ["Grilled cheese", "Chef’s salad", "Cottage cheese and fruit plate", "Garden burger"],
  dinnerAlt: ["Grilled chicken breast", "Baked salmon", "Vegetable stir-fry", "Petite sirloin", "Pasta primavera", "Herb-roasted turkey"],
  starch: ["Mashed potatoes", "Rice pilaf", "Roasted red potatoes", "Buttered egg noodles", "Wild rice", "Baked sweet potato"],
  vegetable: ["Green beans", "Glazed carrots", "Steamed broccoli", "Roasted zucchini", "Buttered peas", "Sautéed spinach", "Corn"],
  dessert: ["Apple crisp", "Chocolate pudding", "Lemon bars", "Peach cobbler", "Carrot cake", "Rice pudding", "Strawberry shortcake", "Brownie", "Banana cream pie", "Fresh fruit"],
};
const tagged: Record<string, Tag[]> = {
  "Vegetable frittata": ["GF", "VG"], "Spinach and feta omelet": ["GF", "VG"], "Steel-cut oatmeal with berries": ["VG", "DF"], "Huevos rancheros": ["GF", "VG"],
  "Eggs any style": ["GF", "VG", "DF"], "Yogurt parfait": ["VG"], "Fresh fruit cup": ["GF", "VG", "DF"], "Cobb salad": ["GF"], "Spinach quiche": ["VG"],
  "Grilled salmon salad": ["GF", "DF"], "Caprese panini": ["VG"], "Grilled cheese": ["VG"], "Cottage cheese and fruit plate": ["GF", "VG"], "Garden burger": ["VG"],
  "Grilled chicken breast": ["GF", "DF"], "Baked salmon": ["GF", "DF"], "Vegetable stir-fry": ["VG", "DF"], "Petite sirloin": ["GF", "DF"], "Pasta primavera": ["VG"],
  "Mashed potatoes": ["GF", "VG"], "Rice pilaf": ["DF"], "Roasted red potatoes": ["GF", "VG", "DF"], "Wild rice": ["GF", "VG", "DF"], "Baked sweet potato": ["GF", "VG", "DF"],
  "Green beans": ["GF", "VG", "DF"], "Glazed carrots": ["GF", "VG"], "Steamed broccoli": ["GF", "VG", "DF"], "Roasted zucchini": ["GF", "VG", "DF"], "Sautéed spinach": ["GF", "VG", "DF"], "Corn": ["GF", "VG"],
  "Rice pudding": ["GF", "VG"], "Fresh fruit": ["GF", "VG", "DF"], "Chocolate pudding": ["GF", "VG"],
};
const dish = (name: string): CycleDish => ({ name, plain: name, ...(tagged[name] ? { tags: tagged[name] } : {}) });
const pick = (list: string[], n: number) => dish(list[((n % list.length) + list.length) % list.length]);

/** The sides already in a special's description ("Thyme jus, carrots, parsnips, fingerling potatoes"), if any. */
function sideIn(desc: string | undefined, kind: "starch" | "vegetable"): CycleDish | undefined {
  const re = kind === "starch" ? /potato|rice|noodle|polenta|grits|couscous|pilaf|spaghetti|dumpling|risotto|bread|sourdough|pudding/i : /bean|carrot|asparagus|cabbage|spinach|cauliflower|fennel|slaw|broccoli|parsnip|onion|salsa/i;
  const part = desc?.split(/,| over | with /).map((x) => x.trim()).find((x) => re.test(x));
  return part ? dish(part.charAt(0).toUpperCase() + part.slice(1)) : undefined;
}

/** Each day of a cycle, meal by meal: the special is dinner's entrée, the soup of the day goes with lunch and dinner. */
function cycleDays(cy: MenuCycle, periods: MealPeriod[]): CycleMeal[][][] {
  return cy.specials.map((wk, w) => wk.map((special, d) => {
    const n = w * 7 + d;
    const soup = cy.soups[w][d];
    return periods.map((p): CycleMeal => {
      if (/breakfast|morning|brunch/i.test(p.key)) return { period: p.key, courses: { entree: pick(pool.breakfast, n), alternate: pick(pool.breakfastAlt, n), starch: pick(pool.breakfastSide, n + w) } };
      if (/lunch/i.test(p.key)) return { period: p.key, courses: { entree: pick(pool.lunch, n + 3 * w), alternate: pick(pool.lunchAlt, n), soup, dessert: pick(pool.dessert, n + 5) } };
      return {
        period: p.key,
        courses: {
          entree: special, alternate: pick(pool.dinnerAlt, n + w),
          starch: sideIn(special.desc, "starch") ?? pick(pool.starch, n), vegetable: sideIn(special.desc, "vegetable") ?? pick(pool.vegetable, n + w),
          soup, dessert: pick(pool.dessert, n),
        },
      };
    });
  }));
}

const tagNames: Record<Tag, string> = { GF: "Gluten free", VG: "Vegetarian", DF: "Dairy free" };
