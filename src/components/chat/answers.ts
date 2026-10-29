// Answers for the website chat. Everything comes from the site's own data, computed in the browser
// at the moment the question is asked, so "today", "tonight" and seats left are always current.
import { site, living, pricing, plans, money, faqs, welcome, fitness, careers, team, spaces, instructors, type PlanKind } from "@/data/site";
import { eventsOn, isHarbor, seatsLeft, type CalEvent } from "@/data/calendar";
import { menuFor, venues } from "@/data/menus";
import { today, nowMinutes, addDays, dow, fmtTime, longDate, dayShort, MONTHS, WEEKDAYS, iso } from "@/lib/clock";

export type Lang = "en" | "es";
export interface Line { time?: string; text: string; note?: string; strong?: boolean }
export interface Group { title?: string; lines: Line[] }
export interface Link { label: string; href: string }
export interface Answer {
  lang: Lang;
  text: string;
  groups?: Group[];
  after?: string;
  source?: Link;
  cta?: Link;
  chips?: string[];
  /** Offer the call-back form */
  lead?: boolean;
}

// ---------------------------------------------------------------- helpers

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’‘`]/g, "'").replace(/[¿?¡!.,;:]/g, " ").replace(/\s+/g, " ").trim();

const ES_WORDS = /\b(cuanto|cuesta|cuestan|precio|precios|costo|mascotas?|perros?|gatos?|cena|comida|almuerzo|desayuno|hoy|manana|que hay|actividades|eventos|visita|visitar|recorrido|cita|memoria|segunda persona|tarifa|cargo|hola|gracias|donde|telefono|puedo|tienen|hay|esta noche|fin de semana|sabado|domingo|lunes|martes|miercoles|jueves|viernes|vivienda|asistida|cuidado|demencia|quiero|necesito|por favor|buenos dias|buenas tardes)\b/;

export function looksSpanish(raw: string): boolean {
  if (/[¿¡ñ]/.test(raw)) return true;
  return ES_WORDS.test(norm(raw));
}

const WD_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MO_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const esDate = (d: Date) => `${WD_ES[dow(d)]} ${d.getUTCDate()} de ${MO_ES[d.getUTCMonth()]}`;
const esTime = (min: number) => fmtTime(min).replace(" am", " a. m.").replace(" pm", " p. m.");
const tm = (min: number, l: Lang) => (l === "es" ? esTime(min) : fmtTime(min));
const moneyEs = money;

const telLine = (l: Lang) => (l === "es" ? `Llámenos al ${site.phone}.` : `Call us at ${site.phone}.`);

const SRC = {
  plans: { label: "Floor Plans & Pricing", href: "/floor-plans" },
  calendar: { label: "Activity Calendar", href: "/calendar" },
  dining: { label: "Dining", href: "/dining" },
  faq: { label: "FAQs", href: "/faq" },
  il: { label: "Independent Living", href: living.independent.href },
  al: { label: "Assisted Living Services", href: living.assisted.href },
  harbor: { label: "Harbor Memory Care", href: living.harbor.href },
  tour: { label: "Schedule a Tour", href: "/tour" },
  contact: { label: "Info & Directions", href: "/contact" },
  careers: { label: "Careers", href: "/careers" },
  fitness: { label: "Fitness", href: "/fitness" },
  welcome: { label: "All Are Welcome", href: "/all-are-welcome" },
  about: { label: "About Us", href: "/about" },
  team: { label: "Our Team", href: "/team" },
  spaces: { label: "Amazing Spaces", href: "/spaces" },
  trips: { label: "Events & Adventures", href: "/events-adventures" },
};
const SRC_ES: Partial<Record<keyof typeof SRC, string>> = {
  plans: "Planos y precios",
  calendar: "Calendario de actividades",
  dining: "Restaurantes",
  faq: "Preguntas frecuentes",
  harbor: "Harbor: cuidado de la memoria",
  tour: "Agendar una visita",
  il: "Vida independiente",
};
const src = (k: keyof typeof SRC, l: Lang): Link => ({ href: SRC[k].href, label: l === "es" && SRC_ES[k] ? SRC_ES[k]! : SRC[k].label });

const faq = (start: string) => faqs.find((f) => f.q.startsWith(start))!.a;

/** Calendar events for a day, with seat counts as of today. */
const dayEvents = (d: Date) => eventsOn(d, iso(today()));
const publicEvents = (d: Date) => dayEvents(d).filter((e) => !isHarbor(e));

function seatNote(e: CalEvent, l: Lang): string | undefined {
  if (!e.cap) return undefined;
  const left = seatsLeft(e) ?? 0;
  if (l === "es") return left > 0 ? `quedan ${left} de ${e.cap} plazas` : `completo · lista de espera (${e.waitlist ?? 0})`;
  return left > 0 ? `${left} of ${e.cap} seats left` : `Full · waitlist (${e.waitlist ?? 0})`;
}

const evLine = (e: CalEvent, l: Lang, withDay = false): Line => {
  const room = e.room;
  const seats = seatNote(e, l);
  return {
    time: (withDay ? (l === "es" ? `${WD_ES[dow(new Date(e.date + "T00:00:00Z"))].slice(0, 3)} ${Number(e.date.slice(8))} · ` : `${dayShort(new Date(e.date + "T00:00:00Z"))} · `) : "") + tm(e.start, l),
    text: e.title,
    note: [room, seats].filter(Boolean).join(" · "),
    strong: !!e.special,
  };
};

/** Keep a list short but interesting: one-off events, trips and music first, then the rest, back in time order. */
function pick(evs: CalEvent[], n: number): CalEvent[] {
  if (evs.length <= n) return evs;
  const rank = (e: CalEvent) => (e.special ? 0 : e.cat === "trips" ? 1 : e.cat === "music" || e.cat === "community" ? 2 : 3);
  return [...evs].sort((a, b) => rank(a) - rank(b) || a.start - b.start).slice(0, n).sort((a, b) => a.start - b.start);
}

// ---------------------------------------------------------------- dates in questions

interface DaySpan { dates: Date[]; en: string; es: string; isToday?: boolean; tonight?: boolean }

const WD_N = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WD_N_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MO_N = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MO_N_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function single(d: Date, t: Date): DaySpan {
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diff === 0) return { dates: [d], en: "today", es: "hoy", isToday: true };
  if (diff === 1) return { dates: [d], en: "tomorrow", es: "mañana" };
  return { dates: [d], en: longDate(d), es: esDate(d) };
}

export function resolveDays(n: string): DaySpan | null {
  const t = today();
  if (/\b(tonight|this evening|esta noche)\b/.test(n)) return { dates: [t], en: "tonight", es: "esta noche", isToday: true, tonight: true };
  if (/\b(today|right now|on now|hoy|ahora)\b/.test(n)) return single(t, t);
  if (/\btomorrow\b/.test(n) || (/\bmanana\b/.test(n) && !/\b(la|por la|esta|de la) manana\b/.test(n))) return single(addDays(t, 1), t);
  if (/\b(weekend|fin de semana)\b/.test(n)) {
    const wd = dow(t);
    const sat = wd === 0 ? addDays(t, -1) : addDays(t, 6 - wd);
    const dates = (wd === 0 ? [t] : wd === 6 ? [t, addDays(t, 1)] : [sat, addDays(sat, 1)]);
    return { dates, en: "this weekend", es: "este fin de semana" };
  }
  // "November 11", "Nov 26", "11 de noviembre", "11/26"
  let m = n.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/);
  let month = -1, day = -1;
  if (m) { month = MO_N.indexOf(m[1]); day = +m[2]; }
  else if ((m = n.match(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/))) { month = MO_N_ES.indexOf(m[2]); day = +m[1]; }
  else if ((m = n.match(/\b(\d{1,2})\/(\d{1,2})\b/))) { month = +m[1] - 1; day = +m[2]; }
  if (month >= 0 && day >= 1 && day <= 31) {
    let d = new Date(Date.UTC(t.getUTCFullYear(), month, day));
    if (d.getTime() < addDays(t, -60).getTime()) d = new Date(Date.UTC(t.getUTCFullYear() + 1, month, day));
    return single(d, t);
  }
  for (let i = 0; i < 7; i++) {
    const re = new RegExp(`\\b(${WD_N[i]}s?|${WD_N_ES[i]})\\b`);
    if (re.test(n)) {
      let ahead = (i - dow(t) + 7) % 7;
      if (/\bnext\b|\bproximo\b/.test(n) && ahead === 0) ahead = 7;
      return single(addDays(t, ahead), t);
    }
  }
  return null;
}

// ---------------------------------------------------------------- answer builders

function eventsAnswer(span: DaySpan, l: Lang, harborOnly = false): Answer {
  const now = nowMinutes();
  const filterSet = (d: Date) => (harborOnly ? dayEvents(d).filter(isHarbor) : publicEvents(d));
  const chips = l === "es" ? ["¿Qué hay de cena esta noche?", "¿Cuánto cuesta?"] : ["What’s on tomorrow?", "Any trips coming up?", "What’s for dinner tonight?"];

  if (span.isToday) {
    const t = span.dates[0];
    const all = filterSet(t);
    const onNow = all.filter((e) => e.start <= now && now < (e.end ?? e.start + 60));
    let later = all.filter((e) => e.start > now);
    if (span.tonight) later = later.filter((e) => e.start >= 16 * 60 + 30);
    const groups: Group[] = [];
    if (onNow.length && !span.tonight) groups.push({ title: l === "es" ? "Ahora mismo" : "Happening now", lines: onNow.map((e) => evLine(e, l)) });
    if (later.length) {
      const [next, ...rest] = later;
      const nextSame = later.filter((e) => e.start === next.start);
      groups.push({ title: l === "es" ? "A continuación" : "Up next", lines: nextSame.map((e) => evLine(e, l)) });
      const remaining = rest.filter((e) => e.start !== next.start);
      const shown = pick(remaining, 7);
      if (shown.length) groups.push({ title: l === "es" ? "Más tarde hoy" : "Later today", lines: shown.map((e) => evLine(e, l)) });
      const more = remaining.length - shown.length;
      const head = span.tonight
        ? l === "es" ? `Esto es lo que hay esta noche, ${esDate(t)}:` : `Here’s what’s on this evening, ${longDate(t)}:`
        : l === "es" ? `Hoy es ${esDate(t)}. Esto es lo que hay en Prairie City Landing:` : `Here’s what’s on today, ${longDate(t)}:`;
      return {
        lang: l, text: head, groups,
        after: more > 0 ? (l === "es" ? `Y ${more} actividades más en el calendario.` : `Plus ${more} more on the calendar.`) : undefined,
        source: src("calendar", l), chips,
      };
    }
    // The day is done; point to tomorrow.
    const tm1 = addDays(t, 1);
    const first = pick(filterSet(tm1), 4);
    return {
      lang: l,
      text: onNow.length
        ? l === "es" ? `La última actividad de hoy ya empezó. Mañana, ${esDate(tm1)}, empieza así:` : `Today’s last event is under way. Tomorrow, ${longDate(tm1)}, starts like this:`
        : l === "es" ? `Por hoy ya terminaron las actividades. Mañana, ${esDate(tm1)}, empieza así:` : `That’s everything for ${span.tonight ? "tonight" : "today"}. Tomorrow, ${longDate(tm1)}, starts like this:`,
      groups: [
        ...(onNow.length ? [{ title: l === "es" ? "Ahora mismo" : "Happening now", lines: onNow.map((e) => evLine(e, l)) }] : []),
        { title: l === "es" ? "Mañana" : "Tomorrow", lines: first.map((e) => evLine(e, l)) },
      ],
      source: src("calendar", l), chips,
    };
  }

  const groups: Group[] = span.dates.map((d) => {
    const evs = filterSet(d);
    return { title: span.dates.length > 1 ? (l === "es" ? cap(esDate(d)) : longDate(d)) : undefined, lines: pick(evs, span.dates.length > 1 ? 6 : 9).map((e) => evLine(e, l)) };
  });
  const total = span.dates.reduce((n, d) => n + filterSet(d).length, 0);
  const shown = groups.reduce((n, g) => n + g.lines.length, 0);
  const label = span.dates.length > 1 ? (l === "es" ? span.es : span.en) : l === "es" ? (span.es === "mañana" ? `mañana, ${esDate(span.dates[0])}` : `el ${span.es}`) : span.en === "tomorrow" ? `tomorrow, ${longDate(span.dates[0])}` : span.en;
  return {
    lang: l,
    text: l === "es" ? `Esto es lo que hay ${label}:` : `Here’s what’s on ${label}:`,
    groups,
    after: total > shown ? (l === "es" ? `Y ${total - shown} más en el calendario.` : `Plus ${total - shown} more on the calendar, including the weekly classes.`) : undefined,
    source: src("calendar", l),
    chips: l === "es" ? ["¿Qué hay hoy?", "¿Puedo agendar una visita?"] : ["Any trips coming up?", "What’s on this weekend?", "Book a tour"],
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function tripsAnswer(l: Lang): Answer {
  const t = today();
  const now = nowMinutes();
  const out: CalEvent[] = [];
  for (let i = 0; i < 21 && out.length < 8; i++) {
    const d = addDays(t, i);
    for (const e of publicEvents(d)) if (e.cat === "trips" && (i > 0 || e.start > now) && !/^Shopping Trip$/.test(e.title)) out.push(e);
  }
  return {
    lang: l,
    text: "Every bus trip leaves from the Lobby, and transportation is included. Here’s what’s coming up, with seats left as of right now:",
    groups: [{ lines: out.slice(0, 8).map((e) => evLine(e, l, true)) }],
    after: "Residents sign up at the front desk or at Friday’s Activity Meeting with Toni Glenn.",
    source: src("calendar", l),
    cta: { label: "See Events & Adventures", href: "/events-adventures" },
    chips: ["What’s on this weekend?", "Do you provide transportation?"],
  };
}

function dinnerAnswer(l: Lang, span: DaySpan | null): Answer {
  const now = nowMinutes();
  let d = span?.dates[0] ?? today();
  let closedNote = "";
  const isToday = !span || span.isToday;
  if (isToday && now >= venues.cypress.close) {
    closedNote = l === "es" ? "El Cypress Room ya cerró por hoy (abre de 11:00 a. m. a 7:00 p. m.). Esto es lo de mañana. " : "The Cypress Room has finished service for today (it’s open 11:00 am–7:00 pm). Here’s tomorrow’s menu. ";
    d = addDays(d, 1);
  }
  const m = menuFor("cypress", d);
  const when = isToday && !closedNote ? (l === "es" ? "esta noche" : "tonight") : l === "es" ? esDate(d) : longDate(d);
  if (m.holiday) {
    const sec = m.sections[0];
    return {
      lang: l,
      text: closedNote + (l === "es" ? `El ${esDate(d)} servimos la cena de Acción de Gracias en el Cypress Room, de 11:00 a. m. a 3:00 p. m., con reservación:` : `${longDate(d)} is Thanksgiving: dinner in the Cypress Room is served 11:00 am–3:00 pm, by reservation.`),
      groups: [{ lines: sec.items.map((i) => ({ text: i.name, note: i.desc })) }],
      source: src("dining", l),
      chips: l === "es" ? ["¿Qué hay hoy?"] : ["What’s on Thanksgiving?", "Can my family join me for a meal?"],
    };
  }
  const mains = m.sections.find((s) => s.title === "Mains")!.items;
  const tag = (t?: string[]) => (t?.length ? ` (${t.join(", ")})` : "");
  if (l === "es") {
    return {
      lang: l,
      text: closedNote + `Cena ${when === "esta noche" ? "de esta noche" : "del " + when} en el Cypress Room (servicio de mantel blanco, de 11:00 a. m. a 7:00 p. m.):`,
      groups: [
        { title: "Especial del chef", lines: [{ text: m.special.name + tag(m.special.tags), note: m.special.desc, strong: true }] },
        { title: "Sopa del día", lines: [{ text: m.soup.name + tag(m.soup.tags) }] },
        { title: "Platos fuertes", lines: mains.map((i) => ({ text: i.name + tag(i.tags), note: i.desc })) },
      ],
      after: "GF = sin gluten · VG = vegetariano · DF = sin lácteos. El Natoma Café también sirve hasta las 7:00 p. m.",
      source: src("dining", l),
      chips: ["¿Qué hay hoy?", "¿Puedo agendar una visita?"],
    };
  }
  return {
    lang: l,
    text: closedNote + `${cap(when)} in the Cypress Room — white-tablecloth service, 11:00 am–7:00 pm:`,
    groups: [
      { title: "Chef’s special", lines: [{ text: m.special.name + tag(m.special.tags), note: m.special.desc, strong: true }] },
      { title: "Soup of the day", lines: [{ text: m.soup.name + tag(m.soup.tags) }] },
      { title: "Mains", lines: mains.map((i) => ({ text: i.name + tag(i.tags), note: i.desc })) },
    ],
    after: `Natoma Café is open until 7:00 pm too — today’s special there is ${menuFor("natoma", d).special.name}.`,
    source: src("dining", l),
    chips: ["Can my family join me for a meal?", "When is happy hour?", "What’s on tonight?"],
  };
}

function breakfastAnswer(): Answer {
  const d = today();
  const nat = menuFor("natoma", d);
  const rdv = menuFor("rendezvous", d);
  const b = nat.sections.find((s) => s.title === "Breakfast")!;
  return {
    lang: "en",
    text: "Breakfast is at Natoma Café, 7:00–10:30 am, and The Rendezvous opens at 7:00 am for coffee and pastries.",
    groups: [
      { title: "Natoma Café breakfast", lines: b.items.filter((i) => i.name !== "Sides").map((i) => ({ text: i.name })) },
      { title: "At The Rendezvous today", lines: [{ text: rdv.sections[0].items[2].name }] },
    ],
    source: src("dining", "en"),
    chips: ["What’s for lunch?", "What’s for dinner tonight?"],
  };
}

function lunchAnswer(): Answer {
  const d = today();
  const nat = menuFor("natoma", d);
  const rdv = menuFor("rendezvous", d);
  const panini = rdv.sections.find((s) => s.title === "Lunch")!.items[2];
  return {
    lang: "en",
    text: "Lunch is served in all three restaurants. Today’s highlights:",
    groups: [{ lines: [
      { text: `Cypress Room (from 11:00 am): ${menuFor("cypress", d).special.name}`, note: "Chef’s special", strong: true },
      { text: `Natoma Café: ${nat.special.name}`, note: nat.special.desc },
      { text: `The Rendezvous (11:00 am–2:00 pm): ${panini.name}`, note: panini.desc },
      { text: `Soup of the day: ${nat.soup.name}` },
    ] }],
    after: "Family and friends are always welcome to join — lunch reservations are taken by Mickei Butler, our Dining Experience Director.",
    source: src("dining", "en"),
    chips: ["What’s for dinner tonight?", "Can my family join me for a meal?"],
  };
}

function happyHourAnswer(): Answer {
  const t = today();
  const now = nowMinutes();
  const lines: Line[] = [];
  for (let i = 0; i < 14 && lines.length < 3; i++) {
    const d = addDays(t, i);
    for (const e of publicEvents(d)) {
      if (!/happy hour/i.test(e.title) || (i === 0 && (e.end ?? e.start + 60) <= now)) continue;
      const r = menuFor("rendezvous", d);
      lines.push({ time: `${dayShort(d)} · ${fmtTime(e.start)}`, text: e.title, note: `${e.room} · ${r.special.name.replace("Pour of the day: ", "Pour: ")}`, strong: !!e.special });
    }
  }
  return {
    lang: "en",
    text: "Happy hour is at The Rendezvous, Tuesdays and Fridays from 3:00 to 4:00 pm, with live music, cocktails, mocktails and complimentary snacks for friends and visitors. Coming up:",
    groups: [{ lines }],
    after: "Jason Cherry also hosts a monthly Healthy Happy Hour with music, nutritious snacks and choreography.",
    source: src("calendar", "en"),
    chips: ["What’s for dinner tonight?", "What’s on this weekend?"],
  };
}

function pricesAnswer(l: Lang): Answer {
  const [lo, hi] = pricing.independentRange;
  if (l === "es") {
    return {
      lang: l,
      text: `Los apartamentos de vida independiente van de ${moneyEs(lo)} a ${moneyEs(hi)} al mes, según el tamaño y la ubicación:`,
      groups: [
        { title: "Vida independiente", lines: pricing.independent.map((p) => ({ text: `${p.name === "Studio" ? "Estudio" : p.name === "One bedroom" ? "Una recámara" : "Dos recámaras"}: desde ${moneyEs(p.from)} al mes` })) },
        { title: "Servicios de vida asistida", lines: [{ text: `Cuota base de ${moneyEs(pricing.assistedBase)} al mes, más cuidado personal según el plan de cuidado` }] },
        { title: "Harbor (cuidado de la memoria)", lines: pricing.harbor.map((p) => ({ text: `${p.name === "Studio with shared bath" ? "Estudio con baño compartido" : "Estudio con baño privado"}: desde ${moneyEs(p.from)} al mes` })) },
      ],
      after: `No hay cargo por segunda persona: las parejas ahorran unos ${moneyEs(pricing.secondPersonSaving)} al año. La renta incluye limpieza semanal, todos los servicios, internet y cable, transporte, actividades y acceso a los tres restaurantes.`,
      source: src("plans", l),
      cta: src("tour", l),
      chips: ["¿Hay cargo por segunda persona?", "Hábleme de Harbor"],
    };
  }
  return {
    lang: l,
    text: `Independent Living apartments range from ${money(lo)} to ${money(hi)} a month, depending on size and location:`,
    groups: [
      { title: "Independent Living", lines: pricing.independent.map((p) => ({ text: `${p.name} from ${money(p.from)} a month` })) },
      { title: "Assisted Living Services", lines: [{ text: `${money(pricing.assistedBase)} a month base support fee, plus personal care by care plan` }] },
      { title: "Harbor Memory Care", lines: pricing.harbor.map((p) => ({ text: `${p.name} from ${money(p.from)} a month` })) },
    ],
    after: `There’s no second-person fee, which saves couples about ${money(pricing.secondPersonSaving)} a year. Rent includes housekeeping, all utilities, internet and cable, transportation, Events & Adventures and all three restaurants.`,
    source: src("plans", l),
    cta: src("tour", l),
    chips: ["What’s available right now?", "What’s included?", "Is there a second-person fee?"],
  };
}

function availabilityAnswer(): Answer {
  const order: PlanKind[] = ["independent", "assisted", "harbor"];
  const label: Record<PlanKind, string> = { independent: "Independent Living", assisted: "Assisted Living", harbor: "Harbor Memory Care" };
  const groups: Group[] = order.map((k) => ({
    title: label[k],
    lines: plans.filter((p) => p.kind === k && p.available > 0).map((p) => ({
      text: `${p.name} (${p.code})`,
      note: [p.sqft ? `${p.sqft.toLocaleString("en-US")} sq ft` : "", p.from ? `from ${money(p.from)}` : "", `${p.available} available`].filter(Boolean).join(" · "),
    })),
  })).filter((g) => g.lines.length);
  const wait = plans.filter((p) => p.available === 0 && p.waitlist > 0);
  return {
    lang: "en",
    text: "Here’s what’s available today:",
    groups,
    after: wait.length ? `Waitlisted: ${wait.map((p) => `${p.name} (${p.code})`).join(", ")}. Joining a waitlist is free.` : undefined,
    source: src("plans", "en"),
    cta: src("tour", "en"),
    chips: ["How big are the apartments?", "How much does it cost?"],
  };
}

function apartmentsAnswer(): Answer {
  const il = plans.filter((p) => p.kind === "independent");
  return {
    lang: "en",
    text: "Studio, one-bedroom and two-bedroom, two-bath apartments, up to 1,417 square feet. Every Independent Living apartment has a full-size kitchen with stainless appliances, an in-apartment washer and dryer, a walk-in closet and oversized windows.",
    groups: [{ title: "Independent Living floor plans", lines: il.map((p) => ({ text: `${p.name} (${p.code})`, note: [`${p.sqft?.toLocaleString("en-US")} sq ft`, p.balcony ? "balcony" : "", p.available ? `${p.available} available` : "waitlist"].filter(Boolean).join(" · ") })) }],
    after: "There’s room for a sectional and a full dining set, and select apartments have balconies or patios.",
    source: src("plans", "en"),
    cta: src("tour", "en"),
    chips: ["What’s available right now?", "How much does it cost?"],
  };
}

function harborAnswer(l: Lang): Answer {
  const avail = plans.filter((p) => p.kind === "harbor" && p.available > 0).length;
  const t = today();
  const todayH = dayEvents(t).filter(isHarbor).filter((e) => e.start > nowMinutes()).slice(0, 3);
  if (l === "es") {
    return {
      lang: l,
      text: "Harbor es nuestro vecindario seguro de cuidado de la memoria, con su propio patio, su propio programa de Events & Adventures y salidas cada semana. Un ambiente de optimismo juvenil, donde “no se puede” se convierte en “¿cómo sí podemos…?”.",
      groups: [
        { title: "Precios", lines: pricing.harbor.map((p) => ({ text: `${p.name === "Studio with shared bath" ? "Estudio con baño compartido" : "Estudio con baño privado"}: desde ${moneyEs(p.from)} al mes` })) },
        { title: "La vida en Harbor", lines: [{ text: "Boliche, restaurantes locales, golf, visitas a caballos y hasta remo de pie" }, { text: "Música en vivo, cerámica, terapia con mascotas, jardinería y narración terapéutica" }, { text: "Un programa de ejercicio simplificado, diseñado por nuestro Director de Fitness" }] },
      ],
      after: `Hoy hay ${avail} habitaciones disponibles en Harbor. La directora de Harbor es Janelle Zweber.`,
      source: src("harbor", l),
      cta: src("tour", l),
      chips: ["¿Cuánto cuesta?", "¿Puedo agendar una visita?"],
    };
  }
  return {
    lang: l,
    text: `Harbor is our secured memory care neighborhood, with its own courtyard, its own Events & Adventures program and weekly outings — ${living.harbor.lede.charAt(0).toLowerCase() + living.harbor.lede.slice(1)}`,
    groups: [
      { title: "Pricing", lines: pricing.harbor.map((p) => ({ text: `${p.name} from ${money(p.from)} a month` })) },
      { title: "Life in Harbor", lines: living.harbor.points.slice(2, 6).map((p) => ({ text: p })) },
      ...(todayH.length ? [{ title: "Still to come in Harbor today", lines: todayH.map((e) => evLine(e, l)) }] : []),
    ],
    after: `${avail} Harbor ${avail === 1 ? "room is" : "rooms are"} available today. Harbor is led by Janelle Zweber, our Harbor Memory Care Director.`,
    source: src("harbor", l),
    cta: src("tour", l),
    chips: ["Will I have to move if I need more help?", "How much does it cost?"],
  };
}

const simple = (lang: Lang, text: string, source: Link, extra: Partial<Answer> = {}): Answer => ({ lang, text, source, ...extra });

function teamAnswer(n: string): Answer | null {
  const hit = team.find((m) => {
    const [first, last] = norm(m.name).split(" ");
    return new RegExp(`\\b(${first}|${last})\\b`).test(n) || n.includes(norm(m.role));
  });
  if (!hit) return null;
  return {
    lang: "en",
    text: `${hit.name} is our ${hit.role}. ${hit.bio}`,
    after: hit.ext ? `Reach ${hit.name.split(" ")[0]} at ${site.phone}, ext. ${hit.ext}.` : undefined,
    source: src("team", "en"),
  };
}

function spaceAnswer(n: string): Answer | null {
  const alias: Record<string, RegExp> = {
    rendezvous: /rendezvous|coffee|espresso|latte|wine bar|cafe bar/,
    cypress: /cypress/,
    natoma: /natoma/,
    theatre: /theat(er|re)|movie|cinema|film/,
    art: /art studio|painting|crafts?\b/,
    salon: /salon|hair|beauty|barber|manicure/,
    club: /club room|private (party|dining)|birthday party/,
    living: /library|book club|living room|books?\b/,
    courtyard: /courtyard|garden|outdoor|barbecue|bbq|fire table/,
    lobby: /lobby/,
  };
  const key = Object.keys(alias).find((k) => alias[k].test(n));
  if (!key) return null;
  const s = spaces.find((x) => x.key === key)!;
  return {
    lang: "en",
    text: `${s.name}${s.kind && s.kind.toLowerCase() !== s.name.toLowerCase() ? ` (${s.kind.toLowerCase()})` : ""}: ${s.text}${s.hours ? ` Open ${s.hours}.` : ""}`,
    source: key === "cypress" || key === "natoma" || key === "rendezvous" ? src("dining", "en") : src("spaces", "en"),
    chips: ["What’s on today?", "Book a tour"],
  };
}

function fitnessAnswer(span: DaySpan | null): Answer {
  const s = span ?? single(today(), today());
  const d = s.dates[0];
  let evs = publicEvents(d).filter((e) => e.cat === "fitness");
  if (s.isToday) evs = evs.filter((e) => e.start > nowMinutes());
  const named = instructors.filter((i) => !/Chaplain|Fr\.|Thor/.test(i.name));
  return {
    lang: "en",
    text: `${fitness.intro} Our Fitness Director, Jason Cherry, is on site full-time.`,
    groups: [
      evs.length ? { title: s.isToday ? "Still to come today" : `Classes ${s.en === "tomorrow" ? "tomorrow" : "on " + s.en}`, lines: evs.map((e) => evLine(e, "en")) } : { lines: [{ text: s.isToday ? "Today’s classes are finished — they start again tomorrow morning." : "No classes are scheduled that day." }] },
      { title: "Instructors", lines: named.map((i) => ({ text: `${i.what} with ${i.name}` })) },
    ],
    after: `Also on the program: ${fitness.highlights.slice(0, 5).join(", ").toLowerCase().replace("vr", "VR")}, and on-site physical therapy.`,
    source: src("fitness", "en"),
    chips: ["What’s on tomorrow?", "Any trips coming up?"],
  };
}

function faithAnswer(): Answer {
  const t = today();
  const lines: Line[] = [];
  for (let i = 0; i < 8; i++) {
    const d = addDays(t, i);
    for (const e of publicEvents(d)) if (e.cat === "faith" && (i > 0 || e.start > nowMinutes())) lines.push({ ...evLine(e, "en", true), note: [e.leader, e.room].filter(Boolean).join(" · ") });
  }
  return {
    lang: "en",
    text: "Services are held in the Theatre. Chaplain Dave leads a non-denominational service every Sunday, and Fr. Giovanni Gamas of St. John the Baptist Catholic Church celebrates Mass with us. Coming up this week:",
    groups: [{ lines: lines.slice(0, 7) }],
    source: src("calendar", "en"),
    chips: ["What’s on today?", "Book a tour"],
  };
}

function holidayAnswer(dateIso: string, intro: string, extra?: string, chips?: string[], onlySpecial = false): Answer {
  const d = new Date(dateIso + "T00:00:00Z");
  return {
    lang: "en",
    text: intro,
    groups: [{ title: longDate(d), lines: dayEvents(d).filter((e) => (onlySpecial ? e.special : !isHarbor(e) || e.special)).map((e) => evLine(e, "en")) }],
    after: extra,
    source: src("calendar", "en"),
    chips,
  };
}

function leadAnswer(l: Lang): Answer {
  return l === "es"
    ? { lang: l, text: "Cynthia Bazin, nuestra Directora de Relaciones con la Comunidad, puede ayudarle con eso. Déjenos su nombre y teléfono y ella le llamará.", lead: true, chips: starters.es.slice(0, 3) }
    : { lang: l, text: "Cynthia Bazin, our Community Relations Director, can help with that. Leave your name and number and she’ll call you.", lead: true, chips: starters.en.slice(0, 3) };
}

// ---------------------------------------------------------------- intents

type Ctx = { n: string; raw: string; l: Lang; span: DaySpan | null };
type Intent = { test: (c: Ctx) => boolean; run: (c: Ctx) => Answer | null };

const has = (re: RegExp) => (c: Ctx) => re.test(c.n);

const intents: Intent[] = [
  {
    test: (c) => /^(hi|hello|hey|hiya|good (morning|afternoon|evening)|hola|buenos dias|buenas tardes|buenas noches)\b/.test(c.n) && c.n.split(" ").length <= 4,
    run: (c) => hello(c.l, true),
  },
  {
    test: has(/\b(thank|thanks|thx|gracias)\b/),
    run: (c) => ({ lang: c.l, text: c.l === "es" ? "¡Con gusto! Si quiere conocernos en persona, la comida en uno de nuestros restaurantes corre por nuestra cuenta." : "You’re very welcome. If you’d like to see us in person, lunch in one of our restaurants is on us.", cta: src("tour", c.l) }),
  },
  { test: has(/\b(talk to|speak (to|with)|call me|call back|callback|representative|real person|human|hablar con|llamenme|llameme)\b/), run: (c) => leadAnswer(c.l) },
  {
    test: has(/thanksgiving|turkey|accion de gracias/),
    run: () => holidayAnswer("2026-11-26", "Thanksgiving is Thursday, November 26. The weekly classes take the day off, and here’s the plan:", "Thanksgiving dinner is served in the Cypress Room, 11:00 am–3:00 pm, by reservation: herb-roasted turkey, honey-glazed ham, a wild mushroom Wellington, all the trimmings and three pies’ worth of dessert. Families are welcome.", ["What’s for dinner tonight?", "Can my family join me for a meal?"]),
  },
  {
    test: has(/veteran/),
    run: () => holidayAnswer("2026-11-11", "On Veterans Day, Wednesday, November 11, we honor the veterans who live and work here:", "Seats on the parade bus are limited, so residents sign up early at the front desk. The weekly classes run as usual.", ["Any trips coming up?", "What’s on this weekend?"], true),
  },
  {
    test: has(/second person|2nd person|couples?\b|spouse|husband|wife|two of us|both of us|segunda persona|pareja|esposo|esposa|matrimonio/),
    run: (c) => c.l === "es"
      ? simple(c.l, `No. En Prairie City Landing no hay cargo por segunda persona, así que las parejas ahorran unos ${moneyEs(pricing.secondPersonSaving)} al año. Los apartamentos de dos recámaras y dos baños tienen hasta 1,417 pies cuadrados.`, src("faq", c.l), { cta: src("plans", c.l), chips: ["¿Cuánto cuesta?", "¿Puedo traer a mi perro?"] })
      : simple(c.l, `${faq("Is there a second-person fee")} Our two-bedroom, two-bath apartments go up to 1,417 square feet — plenty of room for two.`, src("faq", c.l), { cta: src("plans", c.l), chips: ["How much does it cost?", "What’s available right now?"] }),
  },
  { test: has(/harbor|memory|dementia|alzheimer|memoria|demencia/), run: (c) => harborAnswer(c.l) },
  {
    test: has(/assist|have to move|need more help|more help|move again|medication|personal care|bathing|dressing|care plan|nursing|care partner|asistida/),
    run: (c) => simple(c.l, `${faq("If I need more help later")} Services include medication management, personal care, escorts to meals, activities and appointments, and coordination with your healthcare providers. Jan McLennon, our Resident Services Director, completes a pre-move-in assessment and builds each care plan with families.`, src("al", c.l), { cta: { label: "Take the Care Assessment", href: "/care-assessment" }, chips: ["Tell me about Harbor", "How much does it cost?"] }),
  },
  {
    test: has(/\b(pets?|dogs?|cats?|puppy|kitten|animals?|mascotas?|perros?|perrito|gatos?)\b/),
    run: (c) => c.l === "es"
      ? simple(c.l, "¡Sí! Los perros y gatos son bienvenidos, y el patio tiene su propia área al aire libre para ellos. También le presentamos a Thor, nuestra mascota de terapia.", src("faq", c.l), { chips: ["¿Cuánto cuesta?", "¿Qué hay hoy?"] })
      : simple(c.l, `${faq("Are pets welcome")} You’ll also meet Thor, our therapy pet, who visits the 2nd Floor Lounge and Harbor.`, src("faq", c.l), { chips: ["How big are the apartments?", "What’s on today?"] }),
  },
  {
    test: has(/lgbt|\bgay\b|lesbian|\btrans(gender)?\b|queer|sagecare|\bsage\b|inclusi|divers|pride/),
    run: (c) => simple(c.l, `${welcome.intro} ${welcome.points[0].text}`, src("welcome", c.l), { after: "Prairie City Landing is SageCare certified." }),
  },
  { test: has(/\basl\b|sign language|deaf|hard of hearing|interpreter/), run: (c) => simple(c.l, welcome.points[2].text, src("welcome", c.l), { cta: src("tour", c.l) }) },
  { test: has(/licen[cs]e|licensed|rcfe|department of social services/), run: (c) => simple(c.l, faq("Are you licensed"), src("faq", c.l)) },
  {
    test: has(/bruceville|tenfold|sister|elk grove|other communit|who owns|operator|parent company/),
    run: (c) => simple(c.l, `Prairie City Landing is a ${site.operator} community. Our sister community is ${site.sister.name} in ${site.sister.city}. Our purpose: “Each gives to each” — the line from Joaquin Miller that gave Tenfold its name.`, src("about", c.l)),
  },
  {
    test: has(/\b(jobs?|careers?|hiring|employment|apply for a job|work (here|for you|at)|openings?|positions?|empleo|trabajo)\b/),
    run: (c) => ({
      lang: c.l,
      text: careers.intro + " We’re hiring for:",
      groups: [{ lines: careers.openings.map((o) => ({ text: o.title, note: `${o.dept} · ${o.type} · ${o.pay}` })) }],
      after: `Benefits include medical, dental and vision, a 401(k) with match, tuition assistance and a free meal every day you work. Questions: ${site.careersEmail}.`,
      source: src("careers", c.l),
    }),
  },
  {
    test: has(/includ|utilit|housekeep|cable|internet|wi ?fi|maintenance|laundry|what do i get|what does the rent|incluye/),
    run: (c) => ({ lang: c.l, text: "Rent includes:", groups: [{ lines: pricing.included.map((t) => ({ text: t })) }], after: "Pets are welcome, and there’s no second-person fee.", source: src("faq", c.l), cta: src("plans", c.l), chips: ["How much does it cost?", "What’s available right now?"] }),
  },
  { test: has(/availab|vacanc|move in soon|waitlist|wait list|openings? (now|today)|disponib/), run: () => availabilityAnswer() },
  { test: has(/\b(cost|costs|price|prices|pricing|how much|rent|rates?|fees?|afford|expensive|cheap|monthly|cuanto|cuesta|cuestan|precios?|costos?|tarifas?)\b/), run: (c) => pricesAnswer(c.l) },
  {
    test: has(/\btour\b|tours\b|come see|see the (community|place|apartments)|book a visit|schedule a visit|recorrido|agendar|cita|visitar la comunidad|conocer/),
    run: (c) => c.l === "es"
      ? simple(c.l, `¡Nos encantaría recibirle! Hay visitas todos los días de 9:00 a. m. a 5:00 p. m. Reserve en línea en un minuto, o llame a Cynthia Bazin al ${site.phone}. La comida en uno de nuestros restaurantes corre por nuestra cuenta.`, src("tour", c.l), { cta: { label: "Agendar una visita", href: "/tour" } })
      : simple(c.l, `We’d love to show you around. Tours run daily, 9:00 am–5:00 pm. Book online in a minute, or call Cynthia Bazin, our Community Relations Director, at ${site.phone}. Lunch in one of our restaurants is on us.`, src("tour", c.l), { cta: { label: "Schedule a Tour", href: "/tour" }, chips: ["Where are you located?", "What’s on today?"] }),
  },
  { test: has(/happy hour|cocktail|\bwine\b|\bdrinks?\b|\bbar\b/), run: () => happyHourAnswer() },
  { test: has(/\b(trips?|outings?|excursions?|bus trip|adventures?|field trip|seats? left|sign up|salidas?|paseos?)\b/), run: (c) => tripsAnswer(c.l) },
  { test: has(/breakfast|desayuno|flapjack|pancake/), run: () => breakfastAnswer() },
  { test: has(/\blunch\b|almuerzo/) , run: (c) => (/family|guest|visitor|book|reserv|join/.test(c.n) ? null : lunchAnswer()) },
  { test: has(/dinner|supper|menu|\beat\b|eating|food|chef|special|restaurant|dining|cena|comida|menu/), run: (c) => dinnerAnswer(c.l, c.span) },
  {
    test: has(/transport|\bbus\b|shuttle|\bride\b|rides|driv|appointment|doctor|\bcar\b|parking|transporte/),
    run: (c) => simple(c.l, `${faq("Do you provide transportation")} Shopping trips run every Monday and Tuesday morning, and residents can still keep their own car.`, src("faq", c.l), { chips: ["Any trips coming up?", "What’s included?"] }),
  },
  { test: has(/fitness|exercise|class(es)?\b|yoga|\bgym\b|tai chi|zumba|balance|workout|\bwalks?\b|physical therapy|ejercicio/), run: (c) => fitnessAnswer(c.span) },
  { test: has(/church|\bmass\b|catholic|chaplain|worship|faith|religio|bible|rosary|spiritual|pray|misa|iglesia/), run: () => faithAnswer() },
  {
    test: has(/visit(ing|or|ors)?\b|family|grandkid|grandchild|guests?\b|join (me|my|us)|lunch with|book lunch|visita/),
    run: (c) => simple(c.l, `${faq("Can my family join me")} Lunch reservations are taken by Mickei Butler, our Dining Experience Director, and the Club Room can be reserved for private parties with catering from our kitchen.`, src("dining", c.l), { chips: ["What’s for lunch?", "What’s on this weekend?"] }),
  },
  { test: has(/size|square|sq ?ft|\bfeet\b|how big|floor ?plans?|layout|bedroom|studio|balcon|kitchen|washer|dryer|closet|apartments?\b/), run: () => apartmentsAnswer() },
  { test: () => true, run: (c) => teamAnswer(c.n) },
  { test: () => true, run: (c) => spaceAnswer(c.n) },
  {
    test: has(/where|address|located|location|directions|map|how far|airport|highway|\b50\b|folsom|sacramento|donde|direccion/),
    run: (c) => ({ lang: c.l, text: `We’re at ${site.addressLine}.`, groups: [{ lines: site.location.map((t) => ({ text: t })) }], source: src("contact", c.l), cta: { label: "Get directions", href: "/contact" } }),
  },
  {
    test: has(/phone|call|email|e-mail|contact|number|reach|hours|telefono|correo|llamar/),
    run: (c) => simple(c.l, `Call us at ${site.phone}, or email ${site.email}. ${site.hoursOffice}.`, src("contact", c.l), { cta: src("tour", c.l) }),
  },
  {
    test: (c) => !!c.span || /what'?s on|whats on|happening|going on|\bevents?\b|activit|calendar|schedule|to do|que hay|actividades|eventos|agenda/.test(c.n),
    run: (c) => eventsAnswer(c.span ?? single(today(), today()), c.l),
  },
];

/** Answer a question from the website's own content. */
export function answer(raw: string, siteLang: Lang = "en"): Answer {
  const n = norm(raw);
  const l: Lang = looksSpanish(raw) ? "es" : siteLang;
  const c: Ctx = { n, raw, l, span: resolveDays(n) };
  for (const it of intents) {
    if (!it.test(c)) continue;
    const a = it.run(c);
    if (a) {
      if (l === "es" && a.lang === "en") a.after = [a.after, "Esta respuesta solo está disponible en inglés por ahora. Con gusto le atendemos en español al " + site.phone + "."].filter(Boolean).join(" ");
      return a;
    }
  }
  return l === "es"
    ? { lang: l, text: "No encuentro eso en nuestro sitio web, pero Cynthia Bazin, nuestra Directora de Relaciones con la Comunidad, le puede responder. Déjenos su nombre y teléfono.", lead: true, chips: starters.es.slice(0, 4) }
    : { lang: l, text: "I don’t have that one on our website, but Cynthia Bazin, our Community Relations Director, will know. Leave your name and number and she’ll call you — or try one of these:", lead: true, chips: starters.en.slice(0, 4) };
}

export const starters: Record<Lang, string[]> = {
  en: ["What’s on today?", "What’s for dinner tonight?", "How much does it cost?", "Is there a second-person fee?", "Tell me about Harbor", "Can I bring my dog?"],
  es: ["¿Qué hay hoy?", "¿Qué hay de cena esta noche?", "¿Cuánto cuesta?", "¿Hay cargo por segunda persona?", "Hábleme de Harbor", "¿Puedo traer a mi perro?"],
};

export function hello(l: Lang, again = false): Answer {
  const h = Math.floor(nowMinutes() / 60);
  const greet = l === "es" ? (h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches") : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const d = today();
  return l === "es"
    ? { lang: l, text: `${greet}. Pregúntenos lo que quiera sobre Prairie City Landing: precios, apartamentos, la cena de esta noche o lo que hay hoy, ${esDate(d)}.`, chips: again ? starters.es.slice(0, 3) : undefined }
    : { lang: l, text: `${greet}! Ask us anything about Prairie City Landing — pricing, apartments, tonight’s dinner, or what’s on today, ${WEEKDAYS[dow(d)]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}.`, chips: again ? starters.en.slice(0, 3) : undefined };
}

/** Is Community Relations in right now? (Mon–Sat, 9:00 am–5:00 pm) */
export function officeOpen(): boolean {
  const m = nowMinutes();
  return dow(today()) !== 0 && m >= 540 && m < 1020;
}
