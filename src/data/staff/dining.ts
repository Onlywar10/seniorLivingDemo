// Dining requests by text (staff Menus → Requests): residents and families text in plain words; Kinlight reads the
// message, checks the restaurant's rules, confirms, reminds, and passes on only what needs a person. Also the count per
// meal that goes to the kitchen the day before, and the holiday tally. Health stays out: a diet or allergy message goes
// to the kitchen as a conversation and nothing about it is kept. Billing stays in the kitchen's own system ("a guest
// charge applies"). Built from each community's own people, restaurants and calendar. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { addDays, dayName, fmtTime, fromIso, iso, shortDate, today } from "@/lib/clock";
import { getStaffData } from "./index";
import { sampleFamily } from "./alpha";

export type RequestKind = "reservation" | "guest" | "holiday" | "family" | "togo" | "special" | "theme" | "feedback" | "health";
export type RequestStatus = "confirmed" | "asked" | "waitlist" | "waiting-resident" | "needs-person" | "to-kitchen" | "logged";

export interface DiningRequest {
  id: string;
  kind: RequestKind;
  venue: string;
  venueName: string;
  from: string;
  /** "Resident" or "Daughter of Dorothy Whitaker" */
  fromLabel: string;
  at: string;
  text: string;
  /** The meal it's for: "Fri dinner" */
  meal?: string;
  /** What Kinlight checked, in a line. */
  checked: string;
  status: RequestStatus;
  /** Kinlight's reply, as sent. */
  reply: string;
  /** Why a person is needed. */
  why?: string;
  /** Not in alpha: the reply says so, and staff take it from there. */
  beta?: string;
}
export interface MealTally { key: string; label: string; venue: string; venueName: string; date: string; booked: number; guests: number; togo: number; special: number; seatings?: string }
export interface HolidayTally {
  name: string; venue: string; venueName: string; date: string; label: string;
  opens: string; closes: string;
  seatings: { time: string; cap: number; booked: number }[];
  guests: { adults: number; children: number };
  prices: string; takeout: number; notes: number; perApartment: number;
}
export interface RequestRule { kind: RequestKind; label: string; rules: string[]; who: string; beta?: string }

export const kindLabel: Record<RequestKind, string> = {
  reservation: "Reservation", guest: "Guest meal", holiday: "Holiday meal", family: "Family joining", togo: "To-go or tray",
  special: "Special request", theme: "Theme night", feedback: "Feedback", health: "Health question",
};

const first = (n: string) => n.split(" ")[0];

/** The rules each request is checked against (shown behind "?" and in Settings later). From the vault's research. */
export function requestRules(slug: CommunitySlug): RequestRule[] {
  const c = communities[slug];
  const [main, cafe] = c.venueOrder.map((k) => c.venues[k].name);
  return [
    { kind: "reservation", label: "Dinner and Sunday reservations", who: "Front desk or dining host", rules: [`${main}: dinner seatings 4:30, 5:30 and 6:30 pm`, "Up to 6 at a table; larger parties go to a person", "Book up to 7 days ahead, until 3 pm the same day", "A reminder text at 3 pm"] },
    { kind: "guest", label: "Guest meals", who: "Dining host", rules: ["2 hours’ notice", "Up to 4 guests per resident", "“A guest charge applies” (billed by the kitchen’s own system)"] },
    { kind: "holiday", label: "Holiday meals", who: "Culinary director", rules: ["Booking opens and closes on set dates", "Set seatings, seats per seating", "Guests per apartment", "Adult and child prices, from the kitchen’s menu", "Take-home plates", "A note for the kitchen, passed on with the booking"] },
    { kind: "family", label: "Family joining their resident", who: "Dining host", rules: ["The resident says yes first", "Then the same rules as a guest meal"] },
    { kind: "special", label: "Special requests to the chef", who: "Chef", rules: ["By 3 pm for dinner, 10 am for lunch", "“If ingredients allow”"] },
    { kind: "theme", label: "Theme nights and limited meals", who: "Dining host", rules: ["A seat cap", "A waitlist, offered in order"] },
    { kind: "feedback", label: "Feedback", who: "Culinary director", rules: ["Thanked by text", "Logged for the dining committee"] },
    { kind: "togo", label: "To-go and tray delivery", who: "Kitchen", beta: "Coming in Beta", rules: [`${cafe}: orders 11 am–1:30 pm and 4:30–6:30 pm`, "“A delivery fee applies”", "Until Beta, Kinlight passes the order to the kitchen"] },
  ];
}

/** This week's sample messages, the per-meal counts and the holiday tally. */
export function diningRequests(slug: CommunitySlug) {
  const c = communities[slug];
  const s = getStaffData(slug);
  const t = today();
  const [main, cafe] = c.venueOrder;
  const mainName = c.venues[main].name;
  const cafeName = c.venues[cafe].name;
  const chef = s.people[s.roles.menus].name;
  const R = s.residentNames.filter((n) => n !== sampleFamily(slug).resident);
  const fam = sampleFamily(slug);
  const mom = first(fam.resident);
  const daughter = s.contacts.find((x) => x.relation === "Daughter" && x.resident !== fam.resident) ?? s.contacts[1];
  const health = s.contacts.find((x) => x.resident !== fam.resident && x.resident !== daughter.resident && x.sms) ?? s.contacts[2];
  const dShort = (d: Date) => dayName(d).slice(0, 3);
  const fri = addDays(t, (5 - t.getUTCDay() + 7) % 7 || 7);
  const sun = addDays(t, 7 - t.getUTCDay());
  const tomorrow = addDays(t, 1);
  const theme = themeNight(slug);
  const tg = THANKSGIVING;

  const requests: DiningRequest[] = [
    { id: "rq-1", kind: "reservation", venue: main, venueName: mainName, from: R[0], fromLabel: "Resident", at: "Today, 8:12 am", text: "Table for 2 at 5:30 Friday?", meal: `${dShort(fri)} dinner`, checked: "5:30 seating on Friday: 6 tables free · within 7 days", status: "confirmed", reply: `You’re booked: a table for 2 at 5:30 pm on ${dayName(fri)}, ${shortDate(fri)}, at ${mainName}. We’ll text a reminder 2 hours before. Reply CANCEL to cancel.` },
    { id: "rq-2", kind: "guest", venue: main, venueName: mainName, from: R[1], fromLabel: "Resident", at: "Today, 8:40 am", text: "Bringing my daughter to lunch tomorrow", meal: `${dShort(tomorrow)} lunch`, checked: "More than 2 hours’ notice · 1 guest (up to 4)", status: "confirmed", reply: `Lovely! Your daughter is booked for lunch tomorrow, ${dayName(tomorrow)}, at ${mainName}, 11:00 am–1:30 pm. A guest charge applies.` },
    { id: "rq-3", kind: "holiday", venue: main, venueName: mainName, from: daughter.contact, fromLabel: `${daughter.relation} of ${daughter.resident}`, at: "Today, 9:05 am", text: "Thanksgiving, 3 of us at the 12:30 seating", meal: "Thanksgiving", checked: "No 12:30 seating: offered 11:30 and 1:30 · 3 guests (up to 4 per apartment)", status: "asked", reply: `Happy to! Thanksgiving dinner has seatings at 11:30 am and 1:30 pm. Which would you like? Reply 1 for 11:30 or 2 for 1:30. Guests: $32 adults, $16 children 12 and under.` },
    { id: "rq-4", kind: "family", venue: main, venueName: mainName, from: fam.contact, fromLabel: `${fam.relation} of ${fam.resident}`, at: "Today, 9:31 am", text: `Can I join ${fam.relation === "Son" || fam.relation === "Daughter" ? "Mom" : mom} for Sunday brunch?`, meal: `${dShort(sun)} lunch`, checked: `${mom} says yes first · then a guest meal`, status: "waiting-resident", reply: `We’ve asked ${mom} first. We’ll text you as soon as she replies.` },
    { id: "rq-5", kind: "special", venue: main, venueName: mainName, from: R[2], fromLabel: "Resident", at: "Today, 10:02 am", text: "Could I have the salmon without the butter?", meal: `${dShort(t)} dinner`, checked: "Before the 3 pm cutoff · “if ingredients allow”", status: "to-kitchen", reply: `Passed to Chef ${first(chef)}: grilled salmon without the butter, tonight at ${mainName}, if ingredients allow. He’ll let you know if not.` },
    { id: "rq-6", kind: "theme", venue: main, venueName: mainName, from: R[3], fromLabel: "Resident", at: "Today, 10:15 am", text: "Put me down for seafood night", meal: `${theme.name}, ${dShort(fromIso(theme.date))} ${shortDate(fromIso(theme.date))}`, checked: `${theme.cap} seats: full · waitlist #2`, status: "waitlist", reply: `${theme.name} is full, so you’re #2 on the waitlist. We’ll text you the moment a seat opens.` },
    { id: "rq-7", kind: "health", venue: main, venueName: mainName, from: health.contact, fromLabel: `${health.relation} of ${health.resident}`, at: "Today, 10:48 am", text: `Can ${first(health.resident)} get the soup without the cream? The doctor wants less dairy`, checked: "A health question: to the kitchen as a conversation · nothing kept", status: "needs-person", why: "Diet questions are for the kitchen. Kinlight doesn’t store diets or allergies.", reply: `Thanks for letting us know. I’ve passed your message to Chef ${first(chef)}, who will reply to you directly.` },
    { id: "rq-8", kind: "togo", venue: cafe, venueName: cafeName, from: R[4], fromLabel: "Resident", at: "Today, 11:20 am", text: "Can I get the soup sent up at noon?", meal: `${dShort(t)} lunch`, checked: "Within the lunch order window · a delivery fee applies", status: "needs-person", beta: "To-go and tray orders by text are coming in Beta. Until then Kinlight passes them to the kitchen.", why: "The kitchen confirms the delivery.", reply: `Thanks! I’ve passed your order to the ${cafeName} kitchen; they’ll confirm by noon. A delivery fee applies.` },
    { id: "rq-9", kind: "reservation", venue: main, venueName: mainName, from: R[5], fromLabel: "Resident", at: "Today, 11:42 am", text: "Table for 8 on Sunday for my birthday!", meal: `${dShort(sun)} dinner`, checked: "8 at a table: more than 6, so to a person", status: "needs-person", why: "Larger than a table for 6. Private dining by text is coming in Beta.", reply: `Happy birthday! A table for 8 needs a little planning, so our dining host will call you today to arrange it.` },
    { id: "rq-10", kind: "feedback", venue: main, venueName: mainName, from: R[6], fromLabel: "Resident", at: "Yesterday, 7:55 pm", text: "The short rib was wonderful", checked: "Thanked · logged for the dining committee", status: "logged", reply: `Thank you! I’ll pass that on to Chef ${first(chef)} and the dining committee.` },
    { id: "rq-11", kind: "guest", venue: cafe, venueName: cafeName, from: R[7], fromLabel: "Resident", at: "Yesterday, 4:30 pm", text: "My son and grandson are coming for lunch Saturday", meal: "Sat lunch", checked: "2 guests (up to 4) · walk-in for lunch", status: "confirmed", reply: `Wonderful. ${cafeName} is ready for 3 of you at lunch on Saturday. A guest charge applies for your guests.` },
  ];

  // What goes to the kitchen the day before: each meal's count, with guests, to-go and special requests.
  const scale = s.visitScale;
  const n = (x: number) => Math.round(x * scale);
  const meals: MealTally[] = [
    { key: "tonight", label: `${dShort(t)} dinner`, venue: main, venueName: mainName, date: iso(t), booked: n(38), guests: n(7), togo: 2, special: 1, seatings: "4:30 · 5:30 · 6:30" },
    { key: "tomorrow-lunch", label: `${dShort(tomorrow)} lunch`, venue: main, venueName: mainName, date: iso(tomorrow), booked: n(29), guests: n(5), togo: 1, special: 0 },
    { key: "tomorrow", label: `${dShort(tomorrow)} dinner`, venue: main, venueName: mainName, date: iso(tomorrow), booked: n(42), guests: n(11), togo: 3, special: 1, seatings: "4:30 · 5:30 · 6:30" },
    { key: "fri", label: `${dShort(fri)} dinner`, venue: main, venueName: mainName, date: iso(fri), booked: n(47), guests: n(9), togo: 2, special: 0, seatings: "4:30 · 5:30 · 6:30" },
    { key: "cafe-tomorrow", label: `${dShort(tomorrow)} lunch`, venue: cafe, venueName: cafeName, date: iso(tomorrow), booked: n(18), guests: n(4), togo: 6, special: 0 },
  ];

  const holiday: HolidayTally = {
    name: "Thanksgiving Dinner", venue: main, venueName: mainName, date: tg, label: `${dayName(fromIso(tg))}, ${shortDate(fromIso(tg))}`,
    opens: "Nov 2", closes: "Fri, Nov 20",
    seatings: [{ time: "11:30 am", cap: 64, booked: n(51) }, { time: "1:30 pm", cap: 64, booked: n(38) }],
    guests: { adults: n(24), children: n(7) }, prices: "Guests: $32 adults, $16 children 12 and under", takeout: n(9), notes: 4, perApartment: 4,
  };

  // Who is booked for the current meal, by restaurant: told by text if a dish is swapped or taken off.
  const bookedNow: Record<string, { name: string; who: string }[]> = Object.fromEntries(c.venueOrder.map((k, i) => [k, [
    ...R.slice(8 + i * 3, 8 + i * 3 + (i === 0 ? 9 : i === 1 ? 5 : 0)).map((name) => ({ name, who: "Resident, booked" })),
    ...(i === 0 ? [{ name: daughter.contact, who: `Guest of ${daughter.resident}` }, { name: fam.contact, who: `Guest of ${fam.resident}` }] : []),
  ]]));

  return { requests, meals, holiday, rules: requestRules(slug), bookedNow, chef, firstMeal: fmtTime(16 * 60 + 30) };
}

export const THANKSGIVING = "2026-11-26";

/** A theme night that replaces one dinner, with a seat cap and a waitlist (approved, so it's public). */
export function themeNight(slug: CommunitySlug) {
  const c = communities[slug];
  const t = today();
  const date = iso(addDays(t, ((5 - t.getUTCDay() + 7) % 7 || 7) + 7));
  return { name: "Seafood Night", venue: c.venueOrder[0], date, cap: 40, booked: 40, waitlist: 2 };
}
