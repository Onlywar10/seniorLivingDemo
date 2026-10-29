import { community, getToday, getTodayMenu, getWeek, apartments, money, handbook, staff, categories, getPublicEvents, urgentNotice, quality, serviceHours } from "@/data/community";
import { group, communities } from "@/data/group";

export interface Answer {
  text: string;
  bullets?: string[];
  source: { label: string; href: string };
}

const topic = (title: string) => handbook.topics.find((t) => t.title === title)!.body;

type Intent = { keys: RegExp; answer: () => Answer };

const intents: Intent[] = [
  {
    keys: /dinner|tonight|supper|menu|eat|food|lunch|breakfast|meal|diet|sodium|vegetarian/i,
    answer: () => {
      const m = getTodayMenu();
      const dinner = m.meals.find((x) => x.name === "Dinner")!;
      return {
        text: `Dinner tonight is served ${dinner.hours} in the Main Dining Room:`,
        bullets: dinner.items.map((i) => i.name + (i.diet ? ` (${i.diet.join(", ")})` : "")),
        source: { label: `Dining · ${m.day}’s menu`, href: "/larkmoor-house/dining" },
      };
    },
  },
  {
    keys: /visit|come in|visiting hours/i,
    answer: () => ({
      text: `${topic("Visiting hours")} Today only: ${urgentNotice.title.toLowerCase()}. ${urgentNotice.body.split(". ")[1] ?? ""}`,
      source: { label: "Family handbook · Visiting hours", href: "/larkmoor-house/handbook" },
    }),
  },
  {
    keys: /pet|cat|dog|animal/i,
    answer: () => ({ text: topic("Pets"), source: { label: "Family handbook · Pets", href: "/larkmoor-house/handbook" } }),
  },
  {
    keys: /today|happening|going on|on now|this afternoon|this morning/i,
    answer: () => {
      const d = getToday();
      return {
        text: `Here is what is on today, ${d.long}:`,
        bullets: d.events.map((e) => `${e.time} · ${e.name}, ${e.room}`),
        source: { label: "Activities · today", href: "/larkmoor-house/activities" },
      };
    },
  },
  {
    keys: /event|activit|week|calendar|weekend|outing|trip|exercise|fitness|music|church|service|faith/i,
    answer: () => {
      const week = getWeek().filter((d) => !d.past);
      const picks = week.flatMap((d) => d.events.filter((e) => ["social", "outings", "faith"].includes(e.cat)).slice(0, 1).map((e) => `${d.name} ${e.time} · ${e.name} (${categories[e.cat]})`));
      return {
        text: "A few highlights from the rest of this week. Families are welcome at everything:",
        bullets: picks.slice(0, 6),
        source: { label: "Activities · this week", href: "/larkmoor-house/activities" },
      };
    },
  },
  {
    keys: /memory|dementia|alzheimer/i,
    answer: () => ({
      text: "Our memory care household is a secure second floor with 22 suites, a walled terrace garden and one caregiver to five residents by day. It is led by Hannah Steinberg, a Certified Dementia Practitioner, and holds the state memory care endorsement (last reviewed March 2026). Memory care suites start at " + money(apartments.find((a) => a.key === "suite")!.from) + " a month, with care level 2 and above included.",
      source: { label: "Care team · Hannah Steinberg", href: "/larkmoor-house/team" },
    }),
  },
  {
    keys: /care|nurse|medic|help with|bathing|assist/i,
    answer: () => ({
      text: "We offer assisted living and memory care. A licensed nurse is in the building 24 hours a day. Care is set at one of four levels after a free nursing assessment, and reassessed every 90 days and after any hospital stay, with 14 days’ notice of any change.",
      source: { label: "Care team", href: "/larkmoor-house/team" },
    }),
  },
  {
    keys: /cost|price|rate|how much|afford|fee|monthly|expensive/i,
    answer: () => ({
      text: "Monthly rates start at:",
      bullets: apartments.map((a) => `${a.name}: from ${money(a.from)}`),
      source: { label: "Apartments and availability", href: "/larkmoor-house/apartments" },
    }),
  },
  {
    keys: /apartment|available|availability|waitlist|wait list|room|suite|studio|bedroom|floor plan/i,
    answer: () => ({
      text: "Availability today:",
      bullets: apartments.map((a) => `${a.name} (${a.size}): ${a.available ? `${a.available} available` : `waitlist of ${a.waitlist}`}, from ${money(a.from)} a month`),
      source: { label: "Apartments · virtual tours", href: "/larkmoor-house/apartments" },
    }),
  },
  {
    keys: /tour|see the|look round|look around|book|appointment/i,
    answer: () => ({
      text: `Tours run any day from 9 to 6 and take about an hour, with lunch if you like. You can pick a time online, or call ${community.phone} and ask for Daniel.`,
      source: { label: "Book a tour", href: "/larkmoor-house/tour" },
    }),
  },
  {
    keys: /medicaid|insurance|va |veteran|pay for|payment/i,
    answer: () => ({
      text: "We take private pay and long-term care insurance, and after two years of residency the Oregon Medicaid waiver for up to twelve apartments. Daniel Whitcombe (ext. 105) can go through VA benefits and what applies to you.",
      source: { label: "Family handbook · documents", href: "/larkmoor-house/handbook#documents" },
    }),
  },
  {
    keys: /bus|transport|drive|doctor|appointment/i,
    answer: () => ({ text: topic("Transport"), source: { label: "Family handbook · Transport", href: "/larkmoor-house/handbook" } }),
  },
  {
    keys: /bring|move in|moving|furniture/i,
    answer: () => ({ text: topic("What to bring"), source: { label: "Family handbook · What to bring", href: "/larkmoor-house/handbook" } }),
  },
  {
    keys: /concern|complain|problem|ombudsman|unhappy/i,
    answer: () => ({ text: topic("Raising a concern"), source: { label: "Family handbook · Raising a concern", href: "/larkmoor-house/handbook" } }),
  },
  {
    keys: /licen|inspect|survey|state|citation|record/i,
    answer: () => ({
      text: `Larkmoor House is licensed by the State of Oregon as an assisted living facility, licence ${community.licence}, with a memory care endorsement. ${quality.plain[0]}`,
      source: { label: "State inspection record", href: "/larkmoor-house/inspection-record" },
    }),
  },
  {
    keys: /open house|family night|rsvp|public/i,
    answer: () => ({
      text: "Coming up, open to everyone:",
      bullets: getPublicEvents().map((e) => `${e.title}: ${e.when}, ${e.time}`),
      source: { label: "Events and RSVP", href: "/larkmoor-house/events" },
    }),
  },
  {
    keys: /staff|who|director|contact|phone|call|email|speak/i,
    answer: () => ({
      text: `The front desk is on ${community.phone}, 6 am to 10 pm, and the nurse line is answered 24 hours. Who to ask for:`,
      bullets: staff.filter((s) => s.key).map((s) => `${s.name}, ${s.role} (ext. ${s.ext}): ${s.call}`),
      source: { label: "Care team", href: "/larkmoor-house/team" },
    }),
  },
  {
    keys: /bistro|coffee|snack/i,
    answer: () => ({
      text: "Meal times:",
      bullets: serviceHours.map((s) => `${s.meal}: ${s.hours}, ${s.where}`),
      source: { label: "Dining · service hours", href: "/larkmoor-house/dining" },
    }),
  },
  {
    keys: /other (homes|communities)|locations|near|salem|eugene|bend|astoria|vancouver/i,
    answer: () => ({
      text: `${group.name} has six communities:`,
      bullets: communities.map((c) => `${c.name}, ${c.city} ${c.state} · ${c.care.join(", ")} · ${c.phone}`),
      source: { label: "Find a location", href: "/#find" },
    }),
  },
];

export function answer(q: string): Answer {
  const hit = intents.find((i) => i.keys.test(q));
  if (hit) return hit.answer();
  return {
    text: `I can help with visiting, care, apartments and prices, this week’s activities and tonight’s dinner. For anything about a particular resident, please call the front desk on ${community.phone}; the nurse line is answered 24 hours.`,
    source: { label: "Contact the front desk", href: community.phoneHref },
  };
}

export const suggestions = ["What’s for dinner tonight?", "What are the visiting hours?", "Can Mum bring her cat?", "What’s on this week?", "Do you have memory care?", "How much does it cost?"];
