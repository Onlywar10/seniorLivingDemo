// Answers for the website chat. Everything comes from the community's own data, computed in the browser
// at the moment the question is asked, so "today" and "tonight" are always current.
// Events come redacted (Community.eventsOn): no seat counts, waitlists or pickup points ever reach the chat.
// Every answer is about the community passed in (useCommunity()); nothing here names a particular community.
import type { Community } from "@/data/communities";
import { isLantern, kindOf, money, type CalEvent, type DayMenu, type PlanKind, type Space, type Venue } from "@/data/shared";
import { today, nowMinutes, addDays, dow, fmtTime, longDate, dayShort, MONTHS, WEEKDAYS, iso } from "@/lib/clock";

export type Lang = "en" | "es" | "zh";
export interface Line { time?: string; text: string; note?: string; strong?: boolean }
export interface Group { title?: string; lines: Line[] }
export interface Link { label: string; href: string }
export interface Answer {
  lang: Lang;
  text: string;
  groups?: Group[];
  after?: string;
  /** Community-relative site paths without a language prefix; the chat localizes them with href() when it renders. */
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

/** Any CJK ideograph means the question was written in Chinese. */
export const looksChinese = (raw: string): boolean => /[㐀-鿿豈-﫿]/.test(raw);

/** The language a piece of text (a question or a chip) is written in, or null when it can't be told. */
export function langOf(raw: string): Lang | null {
  if (looksChinese(raw)) return "zh";
  if (looksSpanish(raw)) return "es";
  return /[a-z]/i.test(raw) ? "en" : null;
}

/**
 * Translator for site data (dish names, event titles, bios…) in the page's language, set for the duration of one answer.
 * It is only used when the answer is in the page language; otherwise the data stays in English.
 */
let tr: (s: string) => string = (s) => s;

/** The community being asked about, set for the duration of one answer (or greeting). */
let C: Community;

const WD_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MO_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const esDate = (d: Date) => `${WD_ES[dow(d)]} ${d.getUTCDate()} de ${MO_ES[d.getUTCMonth()]}`;
const esTime = (min: number) => fmtTime(min).replace(" am", " a. m.").replace(" pm", " p. m.");

const WD_ZH = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WD_ZH_SHORT = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
/** "10月29日 星期四" */
const zhDate = (d: Date) => `${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${WD_ZH[dow(d)]}`;
/** "10月29日 周四" */
const zhShort = (d: Date) => `${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${WD_ZH_SHORT[dow(d)]}`;
/** Period of the day before the clock time, as on the rest of the site: 上午 / 中午 / 下午 / 晚上. */
function zhPeriod(h24: number): string {
  if (h24 < 5) return "凌晨";
  if (h24 < 12) return "上午";
  if (h24 < 13) return "中午";
  return h24 < 18 ? "下午" : "晚上";
}
/** 540 → "上午9:00" */
const zhTime = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return `${zhPeriod(h)}${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}`;
};
/** "7:00–10:30 am" → "7:00 am–10:30 am", so both ends carry am/pm. */
const fullRange = (s: string) => s.replace(/(^|\D)(\d{1,2}:\d{2})–(\d{1,2}:\d{2}) (am|pm)/g, "$1$2 $4–$3 $4");
/** "7:00 am–7:00 pm" → "上午7:00至晚上7:00" */
const zhHours = (s: string) =>
  fullRange(s).replace(/(\d{1,2}):(\d{2}) (am|pm)/g, (_, h, m, ap) => zhTime(((+h % 12) + (ap === "pm" ? 12 : 0)) * 60 + +m)).replace("–", "至");
/** "11:00 am–7:00 pm" → "de 11:00 a. m. a 7:00 p. m." */
const esHours = (s: string) => "de " + s.replace(/ am\b/g, " a. m.").replace(/ pm\b/g, " p. m.").replace("–", " a ");
/** The first clock-time range in a string ("Thanksgiving Dinner · 11:00 am–3:00 pm, by reservation" → "11:00 am–3:00 pm"). */
const rangeIn = (s: string) => fullRange(s).match(/\d{1,2}:\d{2} [ap]m–\d{1,2}:\d{2} [ap]m/)?.[0];

const tm = (min: number, l: Lang) => (l === "es" ? esTime(min) : l === "zh" ? zhTime(min) : fmtTime(min));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Lower-case the first letter, unless the word is an acronym ("VR golf" stays). */
const lcFirst = (s: string) => (/^[A-Z][A-Z]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
/** "a, b and c" */
const andList = (xs: string[], and = "and") =>
  xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")}${and === "and" && xs.length > 2 && xs.some((x) => / and /.test(x)) ? "," : ""} ${and} ${xs[xs.length - 1]}`;
const say = (l: Lang, en: string, es: string, zh: string) => (l === "es" ? es : l === "zh" ? zh : en);

// ---------------------------------------------------------------- the community's data

const SRC = {
  plans: { label: "Floor Plans & Pricing", href: "/floor-plans" },
  calendar: { label: "Activity Calendar", href: "/calendar" },
  dining: { label: "Dining", href: "/dining" },
  faq: { label: "FAQs", href: "/faq" },
  il: { label: "Independent Living", href: "/living/independent-living" },
  al: { label: "Assisted Living Services", href: "/living/assisted-living" },
  lantern: { label: "Lantern Memory Care", href: "/living/lantern-memory-care" },
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
type SrcKey = keyof typeof SRC;
const SRC_ES: Partial<Record<SrcKey, string>> = {
  plans: "Planos y precios",
  calendar: "Calendario de actividades",
  dining: "Restaurantes",
  faq: "Preguntas frecuentes",
  lantern: "Lantern: cuidado de la memoria",
  tour: "Agendar una visita",
  il: "Vida independiente",
};
const SRC_ZH: Record<SrcKey, string> = {
  plans: "户型与价格",
  calendar: "活动日历",
  dining: "餐饮",
  faq: "常见问题",
  il: "独立生活",
  al: "协助生活服务",
  lantern: "Lantern 记忆护理",
  tour: "预约参观",
  contact: "信息与交通",
  careers: "招聘",
  fitness: "健身",
  welcome: "欢迎所有人",
  about: "关于我们",
  team: "我们的团队",
  spaces: "精彩空间",
  trips: "活动与探险",
};
/** A source link; the living-option pages take their paths from the community's own data. */
const src = (k: SrcKey, l: Lang): Link => {
  const href = k === "il" ? C.living.independent.href : k === "al" ? C.living.assisted.href : k === "lantern" ? C.living.lantern.href : SRC[k].href;
  return { href, label: l === "zh" ? SRC_ZH[k] : l === "es" && SRC_ES[k] ? SRC_ES[k]! : SRC[k].label };
};

/** A published FAQ answer, by the start of its question ("" if this community doesn't publish it). */
const faq = (start: string) => C.faqs.find((f) => f.q.startsWith(start))?.a ?? "";

/** Calendar events for a day, as the public website shows them. */
const dayEvents = (d: Date) => C.eventsOn(d, iso(today()));
const publicEvents = (d: Date) => dayEvents(d).filter((e) => !isLantern(e));

/** The first day in the next `days` that passes `pred`. */
function findDay(pred: (d: Date) => boolean, days = 120): Date | null {
  const t = today();
  for (let i = 0; i < days; i++) {
    const d = addDays(t, i);
    if (pred(d)) return d;
  }
  return null;
}

// Restaurants, by the role their menu plays (each community names its own).
const venueWith = (section: RegExp, d = today()): Venue | undefined => {
  const k = C.venueOrder.find((v) => C.menuFor(v, d).sections.some((s) => section.test(s.title)));
  return k ? C.venues[k] : undefined;
};
/** The restaurant that serves dinner mains (the white-tablecloth room). */
const mainVenue = () => venueWith(/^mains$/i) ?? C.venues[C.venueOrder[0]];
/** The all-day café, which serves breakfast. */
const cafeVenue = () => venueWith(/^breakfast$/i);
/** The coffeehouse and bar, where happy hour is. */
const barVenue = () => venueWith(/^happy hour$/i);
const menu = (v: Venue, d: Date) => C.menuFor(v.key, d);
/** "The Juniper Room" → "Juniper Room"; for Chinese and Spanish sentences. */
const bare = (v: Venue) => v.name.replace(/^The /, "");
/** "in the Juniper Room" / "at Millpond Café" */
const enIn = (v: Venue) => (/^The /.test(v.name) ? `in the ${bare(v)}` : `at ${v.name}`);
const enAt = (v: Venue) => (/^The /.test(v.name) ? `at the ${bare(v)}` : `at ${v.name}`);
/** "en el Juniper Room" / "en Millpond Café" */
const esIn = (v: Venue) => (/^The /.test(v.name) ? `en el ${bare(v)}` : `en ${v.name}`);
const RESTAURANTS_EN = ["", "", "both", "all three", "all four", "all five"];
const RESTAURANTS_ZH = ["", "一", "两", "三", "四", "五"];

// People, from "who to call" and the team list.
interface Person { name: string; role?: string; first: string; ext?: string | null; unnamed?: boolean }
function who(topic: RegExp, role?: RegExp): Person | null {
  const w = C.whoToCall.find((x) => topic.test(x.topic));
  const m = w ? C.team.find((t) => t.name === w.name) : role ? C.team.find((t) => role.test(t.role)) : undefined;
  const name = w?.name ?? m?.name;
  if (!name) return null;
  return { name, role: m?.role, first: m?.unnamed ? name : name.split(" ")[0], ext: w?.ext ?? m?.ext, unnamed: m?.unnamed };
}
const contact = () => who(/tour/i, /community relations/i);
/** "Mateo Ruiz, our Community Relations Director" (or just the role, for a role with no published name) */
const enWho = (p: Person) => (p.unnamed ? `our ${p.role ?? p.name}` : p.role ? `${p.name}, our ${p.role}` : p.name);
/** As the subject of a sentence: "Mateo Ruiz, our Community Relations Director," */
const enSubj = (p: Person) => cap(enWho(p)) + (p.role && !p.unnamed ? "," : "");
const esWho = (p: Person) => (p.unnamed || !p.role ? tr(p.role ?? p.name) : `${p.name} (${tr(p.role)})`);
/** "我们的社区关系部总监 Mateo Ruiz" */
const zhWho = (p: Person) => (p.unnamed ? `我们的${tr(p.role ?? p.name)}` : p.role ? `我们的${tr(p.role)} ${p.name}` : p.name);

/** The first name of whoever returns call-back requests (null when the community names no one). */
export function callbackName(c: Community): string | null {
  const prev = C;
  C = c;
  try {
    const p = contact();
    return p && !p.unnamed ? p.first : null;
  } finally {
    C = prev;
  }
}

/** Put the person's name into a sentence that names only their role ("…with our Dining Experience Director." → "…with Celeste Okonkwo, our Dining Experience Director."). */
const named = (text: string, p: Person | null) =>
  p && !p.unnamed && p.role && text.includes(`our ${p.role}`) ? text.replace(`our ${p.role}`, enWho(p)) : text;

/** True where the community's tour FAQ offers a free lunch. */
const lunchOnUs = () => /lunch .*on us/i.test(faq("How do I schedule a tour"));

/** How to sign up for resident activities and outings: never on the website. */
const SIGNUP_EN = "Residents: sign up with the activities team. Families: ask for a seat from your weekly message.";
const SIGNUP_ES = "Residentes: inscríbanse con el equipo de actividades. Familias: pidan un lugar desde su mensaje semanal.";
const SIGNUP_ZH = "住户请向活动团队报名；家属请通过每周消息中的链接为家人预留位置。";

const evLine = (e: CalEvent, l: Lang, withDay = false): Line => {
  const room = l === "zh" && e.room ? tr(e.room) : e.room;
  const day = new Date(e.date + "T00:00:00Z");
  const dayLabel = !withDay ? "" : l === "es" ? `${WD_ES[dow(day)].slice(0, 3)} ${Number(e.date.slice(8))} · ` : l === "zh" ? `${zhShort(day)} · ` : `${dayShort(day)} · `;
  return {
    time: dayLabel + tm(e.start, l),
    text: l === "zh" ? tr(e.title) : e.title,
    note: room || undefined,
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

interface DaySpan { dates: Date[]; en: string; es: string; zh: string; isToday?: boolean; tonight?: boolean }

const WD_N = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WD_N_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const WD_N_ZH = ["[日天]", "一", "二", "三", "四", "五", "六"];
const MO_N = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MO_N_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function single(d: Date, t: Date): DaySpan {
  const diff = Math.round((d.getTime() - t.getTime()) / 86_400_000);
  if (diff === 0) return { dates: [d], en: "today", es: "hoy", zh: "今天", isToday: true };
  if (diff === 1) return { dates: [d], en: "tomorrow", es: "mañana", zh: "明天" };
  return { dates: [d], en: longDate(d), es: esDate(d), zh: zhDate(d) };
}

/** Days named in a question. `n` is the normalized question; Chinese is matched as typed. */
export function resolveDays(n: string): DaySpan | null {
  const t = today();
  if (/\b(tonight|this evening|esta noche)\b/.test(n) || /今晚|今天晚上|今夜/.test(n)) return { dates: [t], en: "tonight", es: "esta noche", zh: "今晚", isToday: true, tonight: true };
  if (/\b(today|right now|on now|hoy|ahora)\b/.test(n) || /今天|今日|现在|目前/.test(n)) return single(t, t);
  if (/\btomorrow\b/.test(n) || (/\bmanana\b/.test(n) && !/\b(la|por la|esta|de la) manana\b/.test(n)) || /明天|明日/.test(n)) return single(addDays(t, 1), t);
  if (/\b(weekend|fin de semana)\b/.test(n) || /周末/.test(n)) {
    const wd = dow(t);
    const sat = wd === 0 ? addDays(t, -1) : addDays(t, 6 - wd);
    const dates = (wd === 0 ? [t] : wd === 6 ? [t, addDays(t, 1)] : [sat, addDays(sat, 1)]);
    return { dates, en: "this weekend", es: "este fin de semana", zh: "本周末" };
  }
  // "November 11", "Nov 26", "11 de noviembre", "11/26", "11月26日"
  let m = n.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/);
  let month = -1, day = -1;
  if (m) { month = MO_N.indexOf(m[1]); day = +m[2]; }
  else if ((m = n.match(/\b(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/))) { month = MO_N_ES.indexOf(m[2]); day = +m[1]; }
  else if ((m = n.match(/(\d{1,2})\s*月\s*(\d{1,2})/))) { month = +m[1] - 1; day = +m[2]; }
  else if ((m = n.match(/\b(\d{1,2})\/(\d{1,2})\b/))) { month = +m[1] - 1; day = +m[2]; }
  if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
    let d = new Date(Date.UTC(t.getUTCFullYear(), month, day));
    if (d.getTime() < addDays(t, -60).getTime()) d = new Date(Date.UTC(t.getUTCFullYear() + 1, month, day));
    return single(d, t);
  }
  for (let i = 0; i < 7; i++) {
    const re = new RegExp(`\\b(${WD_N[i]}s?|${WD_N_ES[i]})\\b`);
    const zh = new RegExp(`(星期|周|礼拜)${WD_N_ZH[i]}`);
    if (re.test(n) || zh.test(n)) {
      let ahead = (i - dow(t) + 7) % 7;
      if ((/\bnext\b|\bproximo\b/.test(n) || /下(个)?(星期|周|礼拜)/.test(n)) && ahead === 0) ahead = 7;
      return single(addDays(t, ahead), t);
    }
  }
  return null;
}

// ---------------------------------------------------------------- answer builders

function eventsAnswer(span: DaySpan, l: Lang, lanternOnly = false): Answer {
  const now = nowMinutes();
  const filterSet = (d: Date) => (lanternOnly ? dayEvents(d).filter(isLantern) : publicEvents(d));
  const chips =
    l === "es" ? ["¿Qué hay de cena esta noche?", "¿Cuánto cuesta?"]
    : l === "zh" ? ["明天有什么活动？", "近期有出游活动吗？", "今晚吃什么？"]
    : ["What’s on tomorrow?", "Any trips coming up?", "What’s for dinner tonight?"];
  const s3 = (en: string, es: string, zh: string) => say(l, en, es, zh);

  if (span.isToday) {
    const t = span.dates[0];
    const all = filterSet(t);
    const onNow = all.filter((e) => e.start <= now && now < (e.end ?? e.start + 60));
    let later = all.filter((e) => e.start > now);
    if (span.tonight) later = later.filter((e) => e.start >= 16 * 60 + 30);
    const groups: Group[] = [];
    if (onNow.length && !span.tonight) groups.push({ title: s3("Happening now", "Ahora mismo", "正在进行"), lines: onNow.map((e) => evLine(e, l)) });
    if (later.length) {
      const [next, ...rest] = later;
      const nextSame = later.filter((e) => e.start === next.start);
      groups.push({ title: s3("Up next", "A continuación", "接下来"), lines: nextSame.map((e) => evLine(e, l)) });
      const remaining = rest.filter((e) => e.start !== next.start);
      const shown = pick(remaining, 7);
      if (shown.length) groups.push({ title: s3("Later today", "Más tarde hoy", "今天稍晚"), lines: shown.map((e) => evLine(e, l)) });
      const more = remaining.length - shown.length;
      const head = span.tonight
        ? s3(`Here’s what’s on this evening, ${longDate(t)}:`, `Esto es lo que hay esta noche, ${esDate(t)}:`, `今晚（${zhDate(t)}）的活动如下：`)
        : s3(`Here’s what’s on today, ${longDate(t)}:`, `Hoy es ${esDate(t)}. Esto es lo que hay en ${C.site.name}:`, `今天是${zhDate(t)}。以下是 ${C.site.name} 今天的活动：`);
      return {
        lang: l, text: head, groups,
        after: more > 0 ? s3(`Plus ${more} more on the calendar.`, `Y ${more} actividades más en el calendario.`, `活动日历上还有另外 ${more} 项活动。`) : undefined,
        source: src("calendar", l), chips,
      };
    }
    // The day is done; point to tomorrow.
    const tm1 = addDays(t, 1);
    const first = pick(filterSet(tm1), 4);
    return {
      lang: l,
      text: onNow.length
        ? s3(`Today’s last event is under way. Tomorrow, ${longDate(tm1)}, starts like this:`, `La última actividad de hoy ya empezó. Mañana, ${esDate(tm1)}, empieza así:`, `今天的最后一项活动正在进行中。明天（${zhDate(tm1)}）的安排如下：`)
        : s3(`That’s everything for ${span.tonight ? "tonight" : "today"}. Tomorrow, ${longDate(tm1)}, starts like this:`, `Por hoy ya terminaron las actividades. Mañana, ${esDate(tm1)}, empieza así:`, `${span.tonight ? "今晚" : "今天"}的活动已经全部结束。明天（${zhDate(tm1)}）的安排如下：`),
      groups: [
        ...(onNow.length ? [{ title: s3("Happening now", "Ahora mismo", "正在进行"), lines: onNow.map((e) => evLine(e, l)) }] : []),
        { title: s3("Tomorrow", "Mañana", "明天"), lines: first.map((e) => evLine(e, l)) },
      ],
      source: src("calendar", l), chips,
    };
  }

  const groups: Group[] = span.dates.map((d) => {
    const evs = filterSet(d);
    return { title: span.dates.length > 1 ? s3(longDate(d), cap(esDate(d)), zhDate(d)) : undefined, lines: pick(evs, span.dates.length > 1 ? 6 : 9).map((e) => evLine(e, l)) };
  });
  const total = span.dates.reduce((n, d) => n + filterSet(d).length, 0);
  const shown = groups.reduce((n, g) => n + g.lines.length, 0);
  const multi = span.dates.length > 1;
  const label = {
    en: multi ? span.en : span.en === "tomorrow" ? `tomorrow, ${longDate(span.dates[0])}` : span.en,
    es: multi ? span.es : span.es === "mañana" ? `mañana, ${esDate(span.dates[0])}` : `el ${span.es}`,
    zh: multi ? span.zh : span.zh === "明天" ? `明天（${zhDate(span.dates[0])}）` : span.zh,
  };
  return {
    lang: l,
    text: s3(`Here’s what’s on ${label.en}:`, `Esto es lo que hay ${label.es}:`, `${label.zh}的活动如下：`),
    groups,
    after: total > shown ? s3(`Plus ${total - shown} more on the calendar, including the weekly classes.`, `Y ${total - shown} más en el calendario.`, `活动日历上还有另外 ${total - shown} 项活动，包括每周的固定课程。`) : undefined,
    source: src("calendar", l),
    chips:
      l === "es" ? ["¿Qué hay hoy?", "¿Puedo agendar una visita?"]
      : l === "zh" ? ["近期有出游活动吗？", "这个周末有什么活动？", "预约参观"]
      : ["Any trips coming up?", "What’s on this weekend?", "Book a tour"],
  };
}

function tripsAnswer(l: Lang): Answer {
  const t = today();
  const now = nowMinutes();
  const out: CalEvent[] = [];
  for (let i = 0; i < 21 && out.length < 8; i++) {
    const d = addDays(t, i);
    for (const e of publicEvents(d)) if (e.cat === "trips" && (i > 0 || e.start > now) && !/^Shopping Trip$/.test(e.title)) out.push(e);
  }
  const transportIncluded = C.pricing.included.some((x) => /transport/i.test(x));
  if (l === "zh") {
    return {
      lang: l,
      text: `${transportIncluded ? "出游交通已包含在内。" : ""}以下是近期的出游安排：`,
      groups: [{ lines: out.slice(0, 8).map((e) => evLine(e, l, true)) }],
      after: SIGNUP_ZH,
      source: src("calendar", l),
      cta: { label: "查看活动与探险", href: "/events-adventures" },
      chips: ["这个周末有什么活动？", "是否提供交通接送？"],
    };
  }
  if (l === "es") {
    return {
      lang: l,
      text: `${transportIncluded ? "El transporte está incluido. " : ""}Estas son las próximas salidas:`,
      groups: [{ lines: out.slice(0, 8).map((e) => evLine(e, l, true)) }],
      after: SIGNUP_ES,
      source: src("calendar", l),
      cta: { label: "Ver Eventos y Aventuras", href: "/events-adventures" },
      chips: ["¿Qué hay hoy?", "¿Puedo agendar una visita?"],
    };
  }
  return {
    lang: "en",
    text: `${transportIncluded ? "Transportation is included. " : ""}Here’s what’s coming up:`,
    groups: [{ lines: out.slice(0, 8).map((e) => evLine(e, "en", true)) }],
    after: SIGNUP_EN,
    source: src("calendar", "en"),
    cta: { label: "See Events & Adventures", href: "/events-adventures" },
    chips: ["What’s on this weekend?", "Do you provide transportation?"],
  };
}

/** A holiday menu's serving hours and booking rule, read from its section title. */
function holidayInfo(m: DayMenu) {
  const sec = m.sections[0];
  return { sec, hrs: rangeIn(sec.title), byRes: /reserv/i.test(sec.title), thanksgiving: /thanksgiving/i.test(m.holiday ?? "") };
}

function dinnerAnswer(l: Lang, span: DaySpan | null): Answer {
  const now = nowMinutes();
  const main = mainVenue();
  const cafe = cafeVenue();
  let d = span?.dates[0] ?? today();
  let closedNote = "";
  const isToday = !span || span.isToday;
  if (isToday && now >= main.close) {
    closedNote = say(l,
      `${main.name} has finished service for today (it’s open ${main.hours}). Here’s tomorrow’s menu. `,
      `${cap(esIn(main).slice(3))} ya cerró por hoy (abre ${esHours(main.hours)}). Esto es lo de mañana. `,
      `${bare(main)} 今天的餐点供应已经结束（营业时间为${zhHours(main.hours)}）。以下是明天的菜单。`);
    d = addDays(d, 1);
  }
  const m = menu(main, d);
  const tonight = isToday && !closedNote;
  const when = tonight ? (l === "es" ? "esta noche" : "tonight") : l === "es" ? esDate(d) : longDate(d);
  if (m.holiday) {
    const { sec, hrs, byRes, thanksgiving } = holidayInfo(m);
    if (l === "zh") {
      return {
        lang: l,
        text: closedNote + `${zhDate(d)}是${thanksgiving ? "感恩节" : tr(m.holiday)}：${bare(main)} ${hrs ? `于${zhHours(hrs)}` : ""}供应节日大餐${byRes ? "，需提前预订" : ""}。`,
        groups: [{ lines: sec.items.map((i) => ({ text: tr(i.name), note: i.desc && tr(i.desc) })) }],
        source: src("dining", l),
        chips: ["感恩节有什么安排？", "家人可以来一起用餐吗？"],
      };
    }
    return {
      lang: l,
      text: closedNote + (l === "es"
        ? `El ${esDate(d)} servimos la cena de ${thanksgiving ? "Acción de Gracias" : m.holiday} ${esIn(main)}${hrs ? `, ${esHours(hrs)}` : ""}${byRes ? ", con reservación" : ""}:`
        : `${longDate(d)} is ${m.holiday}: dinner ${enIn(main)} is served${hrs ? ` ${hrs}` : ""}${byRes ? ", by reservation" : ""}.`),
      groups: [{ lines: sec.items.map((i) => ({ text: i.name, note: i.desc })) }],
      source: src("dining", l),
      chips: l === "es" ? ["¿Qué hay hoy?"] : ["What’s on Thanksgiving?", "Can my family join me for a meal?"],
    };
  }
  const mains = (m.sections.find((s) => /^mains$/i.test(s.title)) ?? m.sections[0]).items;
  const tag = (t?: string[]) => (t?.length ? ` (${t.join(", ")})` : "");
  const cafeSpecial = cafe && cafe.key !== main.key ? menu(cafe, d).special.name : null;
  if (l === "zh") {
    return {
      lang: l,
      text: closedNote + `${tonight ? "今晚" : zhDate(d)} ${bare(main)} 的晚餐（${tr(main.kind)}，${zhHours(main.hours)}）：`,
      groups: [
        { title: "主厨特选", lines: [{ text: tr(m.special.name) + tag(m.special.tags), note: m.special.desc && tr(m.special.desc), strong: true }] },
        { title: "今日例汤", lines: [{ text: tr(m.soup.name) + tag(m.soup.tags) }] },
        { title: "主菜", lines: mains.map((i) => ({ text: tr(i.name) + tag(i.tags), note: i.desc && tr(i.desc) })) },
      ],
      after: `GF = 无麸质 · VG = 素食 · DF = 无乳制品。${cafe && cafeSpecial ? `${cafe.name} 同样营业至${zhTime(cafe.close)}，今天的特色菜是 ${tr(cafeSpecial)}。` : ""}`,
      source: src("dining", l),
      chips: ["家人可以来一起用餐吗？", "欢乐时光是什么时候？", "今晚有什么活动？"],
    };
  }
  if (l === "es") {
    return {
      lang: l,
      text: closedNote + `Cena ${when === "esta noche" ? "de esta noche" : "del " + when} ${esIn(main)} (${tr(main.kind)}, ${esHours(main.hours)}):`,
      groups: [
        { title: "Especial del chef", lines: [{ text: m.special.name + tag(m.special.tags), note: m.special.desc, strong: true }] },
        { title: "Sopa del día", lines: [{ text: m.soup.name + tag(m.soup.tags) }] },
        { title: "Platos fuertes", lines: mains.map((i) => ({ text: i.name + tag(i.tags), note: i.desc })) },
      ],
      after: `GF = sin gluten · VG = vegetariano · DF = sin lácteos.${cafe && cafeSpecial ? ` ${cafe.name} también sirve hasta las ${esTime(cafe.close).replace(/\.$/, "")}.` : ""}`,
      source: src("dining", l),
      chips: ["¿Qué hay hoy?", "¿Puedo agendar una visita?"],
    };
  }
  return {
    lang: l,
    text: closedNote + `${cap(when)} ${enIn(main)} — ${lcFirst(main.kind)}, ${main.hours}:`,
    groups: [
      { title: "Chef’s special", lines: [{ text: m.special.name + tag(m.special.tags), note: m.special.desc, strong: true }] },
      { title: "Soup of the day", lines: [{ text: m.soup.name + tag(m.soup.tags) }] },
      { title: "Mains", lines: mains.map((i) => ({ text: i.name + tag(i.tags), note: i.desc })) },
    ],
    after: cafe && cafeSpecial ? `${cafe.name} is open until ${fmtTime(cafe.close)} too — today’s special there is ${cafeSpecial}.` : undefined,
    source: src("dining", l),
    chips: ["Can my family join me for a meal?", "When is happy hour?", "What’s on tonight?"],
  };
}

function breakfastAnswer(l: Lang): Answer | null {
  const d = today();
  const cafe = cafeVenue();
  if (!cafe) return null;
  const b = menu(cafe, d).sections.find((s) => /^breakfast$/i.test(s.title))!;
  const items = b.items.filter((i) => i.name !== "Sides");
  const bar = barVenue();
  const morning = bar ? menu(bar, d).sections.find((s) => /morning/i.test(s.title)) : undefined;
  const pastry = morning ? morning.items.find((i) => /pastry/i.test(i.name)) ?? morning.items[0] : undefined;
  const hours = b.note ?? cafe.hours;
  if (l === "zh") {
    return {
      lang: l,
      text: `早餐在 ${cafe.name} 供应，时间为${zhHours(hours)}${bar && pastry ? `；${bare(bar)} ${zhTime(bar.open)}开门，供应咖啡和糕点` : ""}。`,
      groups: [
        { title: `${cafe.name} 早餐`, lines: items.map((i) => ({ text: tr(i.name) })) },
        ...(bar && pastry ? [{ title: `${bare(bar)} 今日供应`, lines: [{ text: tr(pastry.name) }] }] : []),
      ],
      source: src("dining", l),
      chips: ["午餐吃什么？", "今晚吃什么？"],
    };
  }
  return {
    lang: "en",
    text: `Breakfast is ${enAt(cafe)}, ${hours}${bar && pastry ? `, and ${bar.name} opens at ${fmtTime(bar.open)} for coffee and pastries` : ""}.`,
    groups: [
      { title: `${cafe.name} breakfast`, lines: items.map((i) => ({ text: i.name })) },
      ...(bar && pastry ? [{ title: `${cap(enAt(bar))} today`, lines: [{ text: pastry.name }] }] : []),
    ],
    source: src("dining", "en"),
    chips: ["What’s for lunch?", "What’s for dinner tonight?"],
  };
}

function lunchAnswer(l: Lang): Answer {
  const d = today();
  const main = mainVenue();
  const cafe = cafeVenue();
  const bar = barVenue();
  const cafeMenu = cafe ? menu(cafe, d) : null;
  const barLunch = bar ? menu(bar, d).sections.find((s) => !/morning|happy hour/i.test(s.title)) : undefined;
  const panini = barLunch ? barLunch.items.find((i) => /panini|sandwich/i.test(i.name)) ?? barLunch.items[0] : undefined;
  const special = menu(main, d).special.name;
  const soup = (cafeMenu ?? menu(main, d)).soup.name;
  const n = C.venueOrder.length;
  const diner = who(/lunch/i, /dining experience/i);
  if (l === "zh") {
    return {
      lang: l,
      text: `${n > 1 ? `${RESTAURANTS_ZH[n] ?? n}家餐厅都供应午餐。` : ""}今天的推荐：`,
      groups: [{ lines: [
        { text: `${bare(main)}（${zhTime(main.open)}起）：${tr(special)}`, note: "主厨特选", strong: true },
        ...(cafe && cafeMenu ? [{ text: `${cafe.name}：${tr(cafeMenu.special.name)}`, note: cafeMenu.special.desc && tr(cafeMenu.special.desc) }] : []),
        ...(bar && panini ? [{ text: `${bare(bar)}${barLunch?.note ? `（${zhHours(barLunch.note)}）` : ""}：${tr(panini.name)}`, note: panini.desc && tr(panini.desc) }] : []),
        { text: `今日例汤：${tr(soup)}` },
      ] }],
      after: `随时欢迎家人和朋友一同用餐。${diner ? `午餐预订由${zhWho(diner)}负责。` : ""}`,
      source: src("dining", l),
      chips: ["今晚吃什么？", "家人可以来一起用餐吗？"],
    };
  }
  return {
    lang: "en",
    text: `${n > 1 ? `Lunch is served in ${RESTAURANTS_EN[n] ?? "all " + n} restaurants. ` : ""}Today’s highlights:`,
    groups: [{ lines: [
      { text: `${bare(main)} (from ${fmtTime(main.open)}): ${special}`, note: "Chef’s special", strong: true },
      ...(cafe && cafeMenu ? [{ text: `${cafe.name}: ${cafeMenu.special.name}`, note: cafeMenu.special.desc }] : []),
      ...(bar && panini ? [{ text: `${bar.name}${barLunch?.note ? ` (${barLunch.note})` : ""}: ${panini.name}`, note: panini.desc }] : []),
      { text: `Soup of the day: ${soup}` },
    ] }],
    after: `Family and friends are always welcome to join${diner ? ` — lunch reservations are taken by ${enWho(diner)}` : ""}.`,
    source: src("dining", "en"),
    chips: ["What’s for dinner tonight?", "Can my family join me for a meal?"],
  };
}

function happyHourAnswer(l: Lang): Answer | null {
  const bar = barVenue();
  if (!bar) return null;
  const t = today();
  const now = nowMinutes();
  const zh = l === "zh";
  const lines: Line[] = [];
  for (let i = 0; i < 14 && lines.length < 3; i++) {
    const d = addDays(t, i);
    for (const e of publicEvents(d)) {
      if (!/happy hour/i.test(e.title) || (i === 0 && (e.end ?? e.start + 60) <= now)) continue;
      const r = menu(bar, d);
      lines.push(zh
        ? { time: `${zhShort(d)} · ${zhTime(e.start)}`, text: tr(e.title), note: [e.room && tr(e.room), tr(r.special.name)].filter(Boolean).join(" · "), strong: !!e.special }
        : { time: `${dayShort(d)} · ${fmtTime(e.start)}`, text: e.title, note: [e.room, r.special.name.replace("Pour of the day: ", "Pour: ")].filter(Boolean).join(" · "), strong: !!e.special });
    }
  }
  const when = menu(bar, t).sections.find((s) => /^happy hour$/i.test(s.title))?.note;
  // A Healthy Happy Hour is only mentioned where the fitness program lists one.
  const healthy = C.fitness.highlights.find((h) => /healthy happy hour/i.test(h));
  const fd = who(/fitness/i, /fitness director/i);
  if (zh) {
    return {
      lang: l,
      text: `欢乐时光在 ${bare(bar)} 举行${when ? `（${tr(when)}）` : ""}，有鸡尾酒和无酒精特调，并为亲友和访客免费提供小食。近期安排：`,
      groups: [{ lines }],
      after: healthy ? `${fd && !fd.unnamed ? fd.name : "我们的健身总监"} 每月还会主持一次健康欢乐时光（Healthy Happy Hour）。` : undefined,
      source: src("calendar", l),
      chips: ["今晚吃什么？", "这个周末有什么活动？"],
    };
  }
  return {
    lang: "en",
    text: `Happy hour is ${enAt(bar)}${when ? ` (${when})` : ""}, with cocktails, mocktails and complimentary snacks for friends and visitors. Coming up:`,
    groups: [{ lines }],
    after: healthy ? `${fd && !fd.unnamed ? `${fd.name}, our Fitness Director,` : "Our Fitness Director"} also hosts a ${lcFirst(healthy)}.` : undefined,
    source: src("calendar", "en"),
    chips: ["What’s for dinner tonight?", "What’s on this weekend?"],
  };
}

const ZH_PLAN: Record<string, string> = {
  Studio: "单间公寓",
  "One bedroom": "一居室",
  "Two bedroom": "两居室",
  "Studio with shared bath": "单间（共用卫浴）",
  "Studio with private bath": "单间（独立卫浴）",
  "One bedroom with private bath": "一居室（独立卫浴）",
};
const ES_PLAN: Record<string, string> = {
  Studio: "Estudio",
  "One bedroom": "Una recámara",
  "Two bedroom": "Dos recámaras",
  "Studio with shared bath": "Estudio con baño compartido",
  "Studio with private bath": "Estudio con baño privado",
  "One bedroom with private bath": "Una recámara con baño privado",
};

/** The headline inclusions in rent, read from the community's own list. */
function includedShort(l: Lang): string[] {
  const n = C.venueOrder.length;
  const rules: [RegExp, string, string, string][] = [
    [/housekeep/i, "housekeeping", "limpieza semanal", "每周清洁"],
    [/utilit/i, "all utilities", "todos los servicios", "全部水电杂费"],
    [/internet|cable/i, "internet and cable", "internet y cable", "网络和有线电视"],
    [/maintenance/i, "all maintenance", "todo el mantenimiento", "全部维修服务"],
    [/transport/i, "transportation", "transporte", "交通接送"],
    [/events & adventures/i, "Events & Adventures", "actividades", "活动与探险"],
    [/restaurant/i, n > 1 ? `${RESTAURANTS_EN[n] ?? "all " + n} restaurants` : "the restaurant", n > 1 ? `acceso a los ${n} restaurantes` : "el restaurante", n > 1 ? `全部${RESTAURANTS_ZH[n] ?? n}家餐厅` : "餐厅"],
  ];
  const out: string[] = [];
  for (const [re, en, es, zh] of rules) if (C.pricing.included.some((x) => re.test(x))) out.push(say(l, en, es, zh));
  return out;
}

function pricesAnswer(l: Lang): Answer {
  const { pricing } = C;
  const [lo, hi] = pricing.independentRange;
  const inc = includedShort(l);
  if (l === "zh") {
    return {
      lang: l,
      text: `独立生活公寓的月租为 ${money(lo)} 至 ${money(hi)}，视面积和位置而定：`,
      groups: [
        { title: "独立生活", lines: pricing.independent.map((p) => ({ text: `${ZH_PLAN[p.name] ?? tr(p.name)}：每月 ${money(p.from)} 起` })) },
        { title: "协助生活服务", lines: [{ text: `基本支持费每月 ${money(pricing.assistedBase)}，另按护理计划收取个人护理费用` }] },
        { title: "Lantern 记忆护理", lines: pricing.lantern.map((p) => ({ text: `${ZH_PLAN[p.name] ?? tr(p.name)}：每月 ${money(p.from)} 起` })) },
      ],
      after: `我们不收取第二人费用，夫妻每年可节省约 ${money(pricing.secondPersonSaving)}。${inc.length ? `租金包含${inc.join("、")}。` : ""}`,
      source: src("plans", l),
      cta: src("tour", l),
      chips: ["现在有哪些空房？", "租金包含什么？", "第二人需要付费吗？"],
    };
  }
  if (l === "es") {
    return {
      lang: l,
      text: `Los apartamentos de vida independiente van de ${money(lo)} a ${money(hi)} al mes, según el tamaño y la ubicación:`,
      groups: [
        { title: "Vida independiente", lines: pricing.independent.map((p) => ({ text: `${ES_PLAN[p.name] ?? p.name}: desde ${money(p.from)} al mes` })) },
        { title: "Servicios de vida asistida", lines: [{ text: `Cuota base de ${money(pricing.assistedBase)} al mes, más cuidado personal según el plan de cuidado` }] },
        { title: "Lantern (cuidado de la memoria)", lines: pricing.lantern.map((p) => ({ text: `${ES_PLAN[p.name] ?? p.name}: desde ${money(p.from)} al mes` })) },
      ],
      after: `No hay cargo por segunda persona: las parejas ahorran unos ${money(pricing.secondPersonSaving)} al año.${inc.length ? ` La renta incluye ${andList(inc, "y")}.` : ""}`,
      source: src("plans", l),
      cta: src("tour", l),
      chips: ["¿Hay cargo por segunda persona?", "Hábleme de Lantern"],
    };
  }
  return {
    lang: l,
    text: `Independent Living apartments range from ${money(lo)} to ${money(hi)} a month, depending on size and location:`,
    groups: [
      { title: "Independent Living", lines: pricing.independent.map((p) => ({ text: `${p.name} from ${money(p.from)} a month` })) },
      { title: "Assisted Living Services", lines: [{ text: `${money(pricing.assistedBase)} a month base support fee, plus personal care by care plan` }] },
      { title: "Lantern Memory Care", lines: pricing.lantern.map((p) => ({ text: `${p.name} from ${money(p.from)} a month` })) },
    ],
    after: `There’s no second-person fee, which saves couples about ${money(pricing.secondPersonSaving)} a year.${inc.length ? ` Rent includes ${andList(inc)}.` : ""}`,
    source: src("plans", l),
    cta: src("tour", l),
    chips: ["What’s available right now?", "What’s included?", "Is there a second-person fee?"],
  };
}

function availabilityAnswer(l: Lang): Answer {
  const zh = l === "zh";
  const order: PlanKind[] = ["independent", "assisted", "lantern"];
  const label: Record<PlanKind, string> = zh
    ? { independent: "独立生活", assisted: "协助生活", lantern: "Lantern 记忆护理" }
    : { independent: "Independent Living", assisted: "Assisted Living", lantern: "Lantern Memory Care" };
  const groups: Group[] = order.map((k) => ({
    title: label[k],
    lines: C.plans.filter((p) => p.kind === k && p.available > 0).map((p) => ({
      text: zh ? `${tr(p.name)}（${p.code}）` : `${p.name} (${p.code})`,
      note: (zh
        ? [p.sqft ? `${p.sqft.toLocaleString("en-US")} 平方英尺` : "", p.from ? `${money(p.from)} 起` : "", `空房 ${p.available} 套`]
        : [p.sqft ? `${p.sqft.toLocaleString("en-US")} sq ft` : "", p.from ? `from ${money(p.from)}` : "", `${p.available} available`]
      ).filter(Boolean).join(" · "),
    })),
  })).filter((g) => g.lines.length);
  const wait = C.plans.filter((p) => p.available === 0 && p.waitlist > 0);
  if (zh) {
    return {
      lang: l,
      text: "以下是今天的空房情况：",
      groups,
      after: wait.length ? `以下户型需排候补名单：${wait.map((p) => `${tr(p.name)}（${p.code}）`).join("、")}。加入候补名单免费。` : undefined,
      source: src("plans", l),
      cta: src("tour", l),
      chips: ["公寓有多大？", "费用是多少？"],
    };
  }
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

function apartmentsAnswer(l: Lang): Answer {
  const il = C.plans.filter((p) => p.kind === "independent");
  const lede = C.living.independent.lede;
  const outdoor = C.living.independent.points.find((p) => /balcon|patio/i.test(p));
  if (l === "zh") {
    return {
      lang: l,
      text: tr(lede),
      groups: [{ title: "独立生活户型", lines: il.map((p) => ({ text: `${tr(p.name)}（${p.code}）`, note: [p.sqft ? `${p.sqft.toLocaleString("en-US")} 平方英尺` : "", p.balcony ? "带阳台" : "", p.available ? `空房 ${p.available} 套` : "候补名单"].filter(Boolean).join(" · ") })) }],
      after: outdoor ? tr(outdoor) : undefined,
      source: src("plans", l),
      cta: src("tour", l),
      chips: ["现在有哪些空房？", "费用是多少？"],
    };
  }
  return {
    lang: "en",
    text: lede,
    groups: [{ title: "Independent Living floor plans", lines: il.map((p) => ({ text: `${p.name} (${p.code})`, note: [p.sqft ? `${p.sqft.toLocaleString("en-US")} sq ft` : "", p.balcony ? "balcony" : "", p.available ? `${p.available} available` : "waitlist"].filter(Boolean).join(" · ") })) }],
    after: outdoor ? `${outdoor}.` : undefined,
    source: src("plans", "en"),
    cta: src("tour", "en"),
    chips: ["What’s available right now?", "How much does it cost?"],
  };
}

function lanternAnswer(l: Lang): Answer {
  const { pricing, living } = C;
  const avail = C.plans.filter((p) => p.kind === "lantern" && p.available > 0).length;
  const t = today();
  const todayH = dayEvents(t).filter(isLantern).filter((e) => e.start > nowMinutes()).slice(0, 3);
  const life = living.lantern.points.filter((p) => /music|ceramic|museum|golf|bowling|fitness|garden|outing/i.test(p)).slice(0, 4);
  const dir = who(/lantern/i, /lantern/i);
  if (l === "zh") {
    return {
      lang: l,
      text: `Lantern 是我们安全封闭的记忆护理社区，拥有自己的庭院和专属的活动与探险项目。${tr(living.lantern.lede)}`,
      groups: [
        { title: "价格", lines: pricing.lantern.map((p) => ({ text: `${ZH_PLAN[p.name] ?? tr(p.name)}：每月 ${money(p.from)} 起` })) },
        { title: "Lantern 的生活", lines: life.map((p) => ({ text: tr(p) })) },
        ...(todayH.length ? [{ title: "Lantern 今天稍后的活动", lines: todayH.map((e) => evLine(e, l)) }] : []),
      ],
      after: `今天 Lantern 有 ${avail} 间空房。${dir ? `Lantern 由${zhWho(dir)}带领。` : ""}`,
      source: src("lantern", l),
      cta: src("tour", l),
      chips: ["如果以后需要更多照顾，需要搬家吗？", "费用是多少？"],
    };
  }
  if (l === "es") {
    return {
      lang: l,
      text: `Lantern es nuestro vecindario seguro de cuidado de la memoria, con su propio patio y su propio programa de Events & Adventures. ${tr(living.lantern.lede)}`,
      groups: [
        { title: "Precios", lines: pricing.lantern.map((p) => ({ text: `${ES_PLAN[p.name] ?? p.name}: desde ${money(p.from)} al mes` })) },
        { title: "La vida en Lantern", lines: life.map((p) => ({ text: tr(p) })) },
      ],
      after: `Hoy hay ${avail} habitaciones disponibles en Lantern.${dir ? ` Dirige Lantern: ${esWho(dir)}.` : ""}`,
      source: src("lantern", l),
      cta: src("tour", l),
      chips: ["¿Cuánto cuesta?", "¿Puedo agendar una visita?"],
    };
  }
  return {
    lang: l,
    text: `Lantern is our secured memory care neighborhood, with its own courtyard and its own Events & Adventures program — ${lcFirst(living.lantern.lede)}`,
    groups: [
      { title: "Pricing", lines: pricing.lantern.map((p) => ({ text: `${p.name} from ${money(p.from)} a month` })) },
      { title: "Life in Lantern", lines: life.map((p) => ({ text: p })) },
      ...(todayH.length ? [{ title: "Still to come in Lantern today", lines: todayH.map((e) => evLine(e, l)) }] : []),
    ],
    after: `${avail} Lantern ${avail === 1 ? "room is" : "rooms are"} available today.${dir ? ` Lantern is led by ${enWho(dir)}.` : ""}`,
    source: src("lantern", l),
    cta: src("tour", l),
    chips: ["Will I have to move if I need more help?", "How much does it cost?"],
  };
}

const simple = (lang: Lang, text: string, source: Link, extra: Partial<Answer> = {}): Answer => ({ lang, text, source, ...extra });

function teamAnswer(c: Ctx): Answer | null {
  const hit = C.team.find((m) => {
    if (c.n.includes(norm(m.role))) return true;
    if (!m.unnamed) {
      const parts = norm(m.name).split(" ");
      const [first, last] = [parts[0], parts[parts.length - 1]];
      if (new RegExp(`\\b(${first}|${last})\\b`).test(c.n)) return true;
    }
    // A Chinese question can name the role ("执行总监").
    const role = tr(m.role);
    return c.l === "zh" && role !== m.role && c.raw.includes(role);
  });
  if (!hit) return null;
  const first = hit.name.split(" ")[0];
  if (c.l === "zh") {
    return {
      lang: "zh",
      text: hit.unnamed ? `我们的${tr(hit.role)}：${tr(hit.bio)}` : `${hit.name} 是我们的${tr(hit.role)}。${tr(hit.bio)}`,
      after: hit.unnamed ? `请致电 ${C.site.phone} 联系。` : hit.ext ? `您可以拨打 ${C.site.phone} 转分机 ${hit.ext} 联系 ${first}。` : `请致电 ${C.site.phone} 并找 ${first}。`,
      source: src("team", "zh"),
    };
  }
  return {
    lang: "en",
    text: hit.unnamed ? `Our ${hit.role}: ${hit.bio}` : `${hit.name} is our ${hit.role}. ${hit.bio}`,
    after: hit.unnamed ? `Call ${C.site.phone} to arrange it.` : hit.ext ? `Reach ${first} at ${C.site.phone}, ext. ${hit.ext}.` : `Call ${C.site.phone} and ask for ${first}.`,
    source: src("team", "en"),
  };
}

/** Everyday words for kinds of space, matched to whichever space of that kind the community has. */
const SPACE_ALIAS: { is: (s: Space) => boolean; en: RegExp; zh?: RegExp }[] = [
  { is: (s) => /coffee/i.test(s.kind), en: /coffee|espresso|latte|wine bar|cafe bar/, zh: /咖啡|拿铁|浓缩/ },
  { is: (s) => s.key === "theatre", en: /theat(er|re)|movie|cinema|film/, zh: /影院|剧院|电影|影音/ },
  { is: (s) => s.key === "art", en: /art studio|painting|crafts?\b/, zh: /画室|美术|绘画|手工/ },
  { is: (s) => s.key === "salon", en: /salon|hair|beauty|barber|manicure/, zh: /美发|理发|美容|美甲|发廊/ },
  { is: (s) => s.key === "club", en: /club room|private (party|dining)|birthday party/, zh: /私人聚会|私人宴会|包间|生日(派对|聚会)/ },
  { is: (s) => /library/i.test(s.kind), en: /library|book club|living room|books?\b/, zh: /图书馆|读书会|图书|看书/ },
  { is: (s) => s.key === "courtyard", en: /courtyard|garden|outdoor|barbecue|bbq|fire table|fire pit|bocce/, zh: /庭院|花园|户外|烧烤|院子/ },
  { is: (s) => s.key === "lobby", en: /lobby/, zh: /大堂|大厅/ },
];

function spaceAnswer(c: Ctx): Answer | null {
  const byName = C.spaces.find((s) => {
    const name = norm(s.name).replace(/^the /, "");
    return c.n.includes(name) || (s.key in C.venues && s.key.length > 3 && new RegExp(`\\b${s.key}\\b`).test(c.n));
  });
  let s = byName;
  if (!s) {
    for (const a of SPACE_ALIAS) {
      if (!(a.en.test(c.n) || (a.zh && a.zh.test(c.raw)))) continue;
      s = C.spaces.find(a.is);
      if (s) break;
    }
  }
  if (!s) return null;
  const source = s.key in C.venues ? "dining" : "spaces";
  if (c.l === "zh") {
    const kind = tr(s.kind);
    return {
      lang: "zh",
      text: `${tr(s.name)}${kind !== s.name ? `（${kind}）` : ""}：${tr(s.text)}${s.hours ? ` 营业时间：${zhHours(s.hours)}。` : ""}`,
      source: src(source, "zh"),
      chips: ["今天有什么活动？", "预约参观"],
    };
  }
  return {
    lang: "en",
    text: `${s.name}${s.kind && s.kind.toLowerCase() !== s.name.toLowerCase() ? ` (${s.kind.toLowerCase()})` : ""}: ${s.text}${s.hours ? ` Open ${s.hours}.` : ""}`,
    source: src(source, "en"),
    chips: ["What’s on today?", "Book a tour"],
  };
}

function fitnessAnswer(span: DaySpan | null, l: Lang): Answer {
  const s = span ?? single(today(), today());
  const d = s.dates[0];
  let evs = publicEvents(d).filter((e) => e.cat === "fitness");
  if (s.isToday) evs = evs.filter((e) => e.start > nowMinutes());
  // Class instructors only: not faith leaders or a therapy pet.
  const teachers = C.instructors.filter((i) => !/service|mass|therapy pet|chaplain/i.test(i.what + " " + i.name));
  const fd = who(/fitness/i, /fitness director/i);
  const fullTime = /full-time/i.test(C.fitness.intro) && fd && !fd.unnamed;
  const highlights = C.fitness.highlights.slice(0, 5);
  if (l === "zh") {
    return {
      lang: l,
      text: `${tr(C.fitness.intro)}${fullTime ? `我们的健身总监 ${fd.name} 全职在社区工作。` : ""}`,
      groups: [
        evs.length
          ? { title: s.isToday ? "今天稍后的课程" : `${s.zh}的课程`, lines: evs.map((e) => evLine(e, l)) }
          : { lines: [{ text: s.isToday ? "今天的课程已经结束，明天上午重新开始。" : "当天没有安排课程。" }] },
        { title: "授课老师", lines: teachers.map((i) => ({ text: `${tr(i.what)}：${i.unnamed ? tr(i.name) : i.name}` })) },
        { title: "课程还包括", lines: highlights.map((h) => ({ text: tr(h) })) },
      ],
      source: src("fitness", l),
      chips: ["明天有什么活动？", "近期有出游活动吗？"],
    };
  }
  return {
    lang: "en",
    text: `${C.fitness.intro}${fullTime ? ` Our Fitness Director, ${fd.name}, is on site full-time.` : ""}`,
    groups: [
      evs.length ? { title: s.isToday ? "Still to come today" : `Classes ${s.en === "tomorrow" ? "tomorrow" : "on " + s.en}`, lines: evs.map((e) => evLine(e, "en")) } : { lines: [{ text: s.isToday ? "Today’s classes are finished — they start again tomorrow morning." : "No classes are scheduled that day." }] },
      { title: "Instructors", lines: teachers.map((i) => ({ text: i.unnamed ? `${i.name}: ${i.what}` : `${i.what} with ${i.name}` })) },
      { title: "Also on the program", lines: highlights.map((h) => ({ text: h })) },
    ],
    source: src("fitness", "en"),
    chips: ["What’s on tomorrow?", "Any trips coming up?"],
  };
}

function faithAnswer(l: Lang): Answer {
  const t = today();
  const zh = l === "zh";
  const lines: Line[] = [];
  const evs: CalEvent[] = [];
  for (let i = 0; i < 8; i++) {
    const d = addDays(t, i);
    for (const e of publicEvents(d)) if (e.cat === "faith" && (i > 0 || e.start > nowMinutes())) {
      evs.push(e);
      lines.push({ ...evLine(e, zh ? "zh" : "en", true), note: [e.leader && (zh ? tr(e.leader) : e.leader), e.room && (zh ? tr(e.room) : e.room)].filter(Boolean).join(" · ") });
    }
  }
  // Where most services are held.
  const count = new Map<string, number>();
  for (const e of evs) if (e.room) count.set(e.room, (count.get(e.room) ?? 0) + 1);
  const room = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (zh) {
    return {
      lang: l,
      text: `${room ? `宗教礼拜通常在${tr(room)}举行。` : ""}本周安排：`,
      groups: [{ lines: lines.slice(0, 7) }],
      source: src("calendar", l),
      chips: ["今天有什么活动？", "预约参观"],
    };
  }
  return {
    lang: "en",
    text: `${room ? `Services are usually held in the ${room}. ` : ""}Coming up this week:`,
    groups: [{ lines: lines.slice(0, 7) }],
    source: src("calendar", "en"),
    chips: ["What’s on today?", "Book a tour"],
  };
}

interface HolidayCopy { intro: string; extra?: string; chips?: string[] }

function holidayAnswer(l: Lang, d: Date, copy: { en: HolidayCopy; zh: HolidayCopy }, onlySpecial = false): Answer {
  const zh = l === "zh";
  const c = zh ? copy.zh : copy.en;
  return {
    lang: zh ? "zh" : "en",
    text: c.intro,
    groups: [{ title: zh ? zhDate(d) : longDate(d), lines: dayEvents(d).filter((e) => (onlySpecial ? e.special : !isLantern(e) || e.special)).map((e) => evLine(e, zh ? "zh" : "en")) }],
    after: c.extra,
    source: src("calendar", l),
    chips: c.chips,
  };
}

function thanksgivingAnswer(l: Lang): Answer | null {
  const main = mainVenue();
  const d =
    findDay((x) => /thanksgiving/i.test(menu(main, x).holiday ?? ""), 370) ??
    findDay((x) => dayEvents(x).some((e) => e.special && /^thanksgiving|thanksgiving (day|dinner|feast)/i.test(e.title)), 370);
  if (!d) return null;
  const classesOff = !dayEvents(d).some((e) => !e.special && e.cat === "fitness");
  const m = menu(main, d);
  let extraEn: string | undefined, extraZh: string | undefined;
  if (m.holiday) {
    const { sec, hrs, byRes } = holidayInfo(m);
    const dishes = sec.items.filter((i) => !/soup|salad|sides|desserts?/i.test(i.name)).map((i) => i.name);
    extraEn = `Thanksgiving dinner is served ${enIn(main)}${hrs ? `, ${hrs}` : ""}${byRes ? ", by reservation" : ""}: ${andList(dishes)}, with all the trimmings and dessert. Families are welcome.`;
    extraZh = `感恩节大餐在 ${bare(main)} 供应${hrs ? `，时间为${zhHours(hrs)}` : ""}${byRes ? "，需提前预订" : ""}：${dishes.map(tr).join("、")}，以及各式传统配菜和甜点。欢迎家人一同参加。`;
  }
  return holidayAnswer(l, d, {
    en: { intro: `Thanksgiving is ${longDate(d)}.${classesOff ? " The weekly classes take the day off, and here’s the plan:" : " Here’s the plan:"}`, extra: extraEn, chips: ["What’s for dinner tonight?", "Can my family join me for a meal?"] },
    zh: { intro: `今年的感恩节是${zhDate(d)}。${classesOff ? "每周的固定课程当天暂停，" : ""}安排如下：`, extra: extraZh, chips: ["今晚吃什么？", "家人可以来一起用餐吗？"] },
  });
}

function veteransAnswer(l: Lang): Answer | null {
  const d = findDay((x) => dayEvents(x).some((e) => e.special && /veteran/i.test(e.title)), 370);
  if (!d) return null;
  const evs = dayEvents(d);
  const limited = evs.some((e) => e.special && kindOf(e) === "resident");
  const classesOn = evs.some((e) => !e.special && e.cat === "fitness");
  const en = [limited ? SIGNUP_EN : "", classesOn ? "The weekly classes run as usual." : ""].filter(Boolean).join(" ");
  const zh = [limited ? SIGNUP_ZH : "", classesOn ? "每周的固定课程照常进行。" : ""].join("");
  return holidayAnswer(l, d, {
    en: { intro: `On Veterans Day, ${longDate(d)}, we honor the veterans who live and work here:`, extra: en || undefined, chips: ["Any trips coming up?", "What’s on this weekend?"] },
    zh: { intro: `${zhDate(d)}是退伍军人节，我们将向在这里生活和工作的退伍军人致敬：`, extra: zh || undefined, chips: ["近期有出游活动吗？", "这个周末有什么活动？"] },
  }, true);
}

function leadAnswer(l: Lang): Answer {
  const p = contact();
  const st = starters(C)[l];
  if (l === "zh") return { lang: l, text: `${p ? `${zhWho(p)}可以帮您解答。` : ""}请留下您的姓名和电话，我们会给您回电。`, lead: true, chips: st.slice(0, 3) };
  return l === "es"
    ? { lang: l, text: `${p ? `${esWho(p)} puede ayudarle con eso. ` : ""}Déjenos su nombre y teléfono y le llamaremos.`, lead: true, chips: st.slice(0, 3) }
    : { lang: l, text: `${p ? `${enSubj(p)} can help with that. ` : ""}Leave your name and number and we’ll call you back.`, lead: true, chips: st.slice(0, 3) };
}

/** The tour hours as published ("Daily, 9:00 am–5:00 pm"), or "by appointment". */
function tourHours(l: Lang): string {
  const v = C.visiting.find((x) => /^tours?$/i.test(x.label))?.value ?? "";
  const r = rangeIn(v);
  const daily = /daily/i.test(v);
  if (r) return say(l, `Tours run ${daily ? "daily, " : ""}${r}.`, `Hay visitas ${daily ? "todos los días " : ""}${esHours(r)}.`, `${daily ? "每天" : ""}${zhHours(r)}都可以参观。`);
  if (/appointment/i.test(v)) return say(l, "Tours are by appointment.", "Las visitas son con cita previa.", "参观需提前预约。");
  return "";
}

/** The weekdays shopping trips run, from the coming week's calendar. */
function shoppingDays(): number[] {
  const days = new Set<number>();
  for (let i = 0; i < 7; i++) {
    const d = addDays(today(), i);
    if (publicEvents(d).some((e) => e.cat === "trips" && /^shopping/i.test(e.title))) days.add(dow(d));
  }
  return [...days].sort();
}

// ---------------------------------------------------------------- intents

type Ctx = { n: string; raw: string; l: Lang; span: DaySpan | null };
type Intent = { test: (c: Ctx) => boolean; run: (c: Ctx) => Answer | null };

/** Match the normalized question, or (for Chinese, which has no word boundaries) the question as typed. */
const has = (re: RegExp, zh?: RegExp) => (c: Ctx) => re.test(c.n) || (!!zh && zh.test(c.raw));

/** The largest two-bedroom Independent Living plan. */
const biggestTwoBed = () => C.plans.filter((p) => p.kind === "independent" && p.beds === 2 && p.sqft).sort((a, b) => b.sqft! - a.sqft!)[0];

const intents: Intent[] = [
  {
    test: (c) =>
      (/^(hi|hello|hey|hiya|good (morning|afternoon|evening)|hola|buenos dias|buenas tardes|buenas noches)\b/.test(c.n) && c.n.split(" ").length <= 4) ||
      (/^(您好|你好|早上好|上午好|下午好|晚上好|嗨|哈喽|在吗)/.test(c.raw.trim()) && c.raw.trim().length <= 8),
    run: (c) => hello(C, c.l, true),
  },
  {
    test: has(/\b(thank|thanks|thx|gracias)\b/, /谢谢|感谢|多谢/),
    run: (c) => ({
      lang: c.l,
      text: lunchOnUs()
        ? say(c.l, "You’re very welcome. If you’d like to see us in person, lunch in one of our restaurants is on us.", "¡Con gusto! Si quiere conocernos en persona, la comida en uno de nuestros restaurantes corre por nuestra cuenta.", "不客气！如果您想亲自来看看，我们请您在我们的餐厅享用一顿午餐。")
        : say(c.l, "You’re very welcome. If you’d like to see us in person, we’d love to show you around.", "¡Con gusto! Si quiere conocernos en persona, nos encantaría recibirle.", "不客气！如果您想亲自来看看，我们很乐意带您参观。"),
      cta: src("tour", c.l),
    }),
  },
  { test: has(/\b(talk to|speak (to|with)|call me|call back|callback|representative|real person|human|hablar con|llamenme|llameme)\b/, /人工|真人|客服|回电|给我打电话|打电话给我|联系我|顾问/), run: (c) => leadAnswer(c.l) },
  { test: has(/thanksgiving|turkey|accion de gracias/, /感恩节|火鸡/), run: (c) => thanksgivingAnswer(c.l) },
  { test: has(/veteran/, /退伍军人|老兵/), run: (c) => veteransAnswer(c.l) },
  {
    test: has(/second[- ]person|2nd[- ]person|couples?\b|spouse|husband|wife|two of us|both of us|segunda persona|pareja|esposo|esposa|matrimonio/, /第二人|第二个人|夫妻|夫妇|配偶|老伴|丈夫|妻子|老公|老婆|两个人住|两人住/),
    run: (c) => {
      const big = biggestTwoBed();
      const sq = big?.sqft?.toLocaleString("en-US");
      const twoBath = big?.baths === 2;
      const saving = money(C.pricing.secondPersonSaving);
      return c.l === "es"
        ? simple(c.l, `No. En ${C.site.name} no hay cargo por segunda persona, así que las parejas ahorran unos ${saving} al año.${sq ? ` Los apartamentos de dos recámaras${twoBath ? " y dos baños" : ""} tienen hasta ${sq} pies cuadrados.` : ""}`, src("faq", c.l), { cta: src("plans", c.l), chips: ["¿Cuánto cuesta?", "¿Puedo traer a mi perro?"] })
        : c.l === "zh"
        ? simple(c.l, `不需要。${C.site.name} 不收取第二人费用，夫妻每年可节省约 ${saving}。${sq ? `我们的两居室${twoBath ? "两卫" : ""}公寓面积最大可达 ${sq} 平方英尺，两个人住非常宽敞。` : ""}`, src("faq", c.l), { cta: src("plans", c.l), chips: ["费用是多少？", "现在有哪些空房？"] })
        : simple(c.l, `${faq("Is there a second-person fee")}${sq ? ` Our two-bedroom${twoBath ? ", two-bath" : ""} apartments go up to ${sq} square feet — plenty of room for two.` : ""}`, src("faq", c.l), { cta: src("plans", c.l), chips: ["How much does it cost?", "What’s available right now?"] });
    },
  },
  { test: has(/lantern|memory|dementia|alzheimer|memoria|demencia/, /记忆|失智|痴呆|阿尔茨海默|认知症/), run: (c) => lanternAnswer(c.l) },
  {
    test: has(/assist|have to move|need more help|more help|move again|medication|personal care|bathing|dressing|care plan|nursing|care partner|asistida/, /协助|更多(帮助|照顾|照护)|搬家|用药|吃药|个人护理|洗澡|穿衣|护理计划|护理伙伴|护理服务|照护/),
    run: (c) => {
      const rs = who(/care plan/i, /resident services/i);
      return c.l === "zh"
        ? simple(c.l, `不需要。每套公寓都可以提供协助生活服务，由我们的住户服务团队上门提供。基本支持费为每月 ${money(C.pricing.assistedBase)}，另按护理计划收取个人护理费用。服务包括用药管理、个人护理、陪同用餐、陪同参加活动和就诊，以及与您的医疗服务提供者协调。${rs ? `${zhWho(rs)}会在入住前进行评估，并与家属一起制定每位住户的护理计划。` : ""}`, src("al", c.l), { cta: { label: "进行护理评估", href: "/care-assessment" }, chips: ["介绍一下 Lantern", "费用是多少？"] })
        : simple(c.l, `${faq("If I need more help later")} Services include medication management, personal care, escorts to meals, activities and appointments, and coordination with your healthcare providers.${rs ? ` ${enSubj(rs)} completes a pre-move-in assessment and builds each care plan with families.` : ""}`, src("al", c.l), { cta: { label: "Take the Care Assessment", href: "/care-assessment" }, chips: ["Tell me about Lantern", "How much does it cost?"] });
    },
  },
  {
    test: has(/\b(pets?|dogs?|cats?|puppy|kitten|animals?|mascotas?|perros?|perrito|gatos?)\b/, /宠物|狗|猫|动物/),
    run: (c) => {
      // A therapy pet is only mentioned where the community has one.
      const pet = C.instructors.find((i) => /therapy pet/i.test(i.what));
      return c.l === "es"
        ? simple(c.l, `¡Sí! Los perros y gatos son bienvenidos, y el patio tiene su propia área al aire libre para ellos.${pet ? ` También le presentamos a ${pet.name}, nuestra mascota de terapia.` : ""}`, src("faq", c.l), { chips: ["¿Cuánto cuesta?", "¿Qué hay hoy?"] })
        : c.l === "zh"
        ? simple(c.l, `可以！欢迎您带狗狗和猫咪入住，庭院里还有专门供它们活动的户外区域。${pet ? `您还会认识我们的治疗宠物 ${pet.name}。` : ""}`, src("faq", c.l), { chips: ["公寓有多大？", "今天有什么活动？"] })
        : simple(c.l, `${faq("Are pets welcome")}${pet ? ` You’ll also meet ${pet.name}, our therapy pet.` : ""}`, src("faq", c.l), { chips: ["How big are the apartments?", "What’s on today?"] });
    },
  },
  {
    test: has(/lgbt|\bgay\b|lesbian|\btrans(gender)?\b|queer|inclusi|divers|pride/, /同性恋|同志|性少数|跨性别|多元|包容/),
    run: (c) => {
      // Inclusion training or certification is mentioned only where the community publishes it.
      const first = C.welcome.points[0];
      const cert = C.welcome.points.find((p, i) => i > 0 && /certif|training/i.test(p.title));
      return c.l === "zh"
        ? simple(c.l, `${tr(C.welcome.intro)}${first ? tr(first.text) : ""}`, src("welcome", c.l), { after: cert ? tr(cert.text) : undefined })
        : simple(c.l, `${C.welcome.intro}${first ? ` ${first.text}` : ""}`, src("welcome", c.l), { after: cert?.text });
    },
  },
  {
    test: has(/\basl\b|sign language|deaf|hard of hearing|interpreter/, /手语|聋|听障|听力|翻译/),
    run: (c) => {
      const asl = C.welcome.points.find((p) => /sign language|\basl\b/i.test(p.title + " " + p.text));
      if (!asl) return null;
      return c.l === "zh"
        ? simple(c.l, tr(asl.text), src("welcome", c.l), { cta: src("tour", c.l) })
        : simple(c.l, asl.text, src("welcome", c.l), { cta: src("tour", c.l) });
    },
  },
  {
    test: has(/licen[cs]e|licensed|rcfe|department of social services/, /执照|许可证|牌照|资质|资格/),
    run: (c) => c.l === "zh"
      ? simple(c.l, `是的。${C.site.name} 持有加州社会服务部颁发的老年人住宿护理机构许可证，RCFE 许可证编号 ${C.site.licenceNo}。`, src("faq", c.l))
      : simple(c.l, faq("Are you licensed") || `${C.site.name} holds ${C.site.licence}.`, src("faq", c.l)),
  },
  {
    test: (c) =>
      /wrenhaven|sister|other communit|who owns|operator|parent company/.test(c.n) ||
      c.n.includes(norm(C.site.sister.name)) || c.n.includes(norm(C.site.sister.city)) ||
      /母公司|运营方|姐妹社区|谁拥有|哪家公司|其他社区/.test(c.raw),
    run: (c) => c.l === "zh"
      ? simple(c.l, `${C.site.name} 是 ${C.site.operator} 旗下的社区，我们的姐妹社区是位于 ${C.site.sister.city} 的 ${C.site.sister.name}。Wrenhaven 这个名字来自鹪鹩（wren）：一种小巧、爱结伴的鸟，会筑起温暖的小窝，再让它充满歌声。我们希望每一个 Wrenhaven 社区都给人这样的感觉。`, src("about", c.l))
      : simple(c.l, `${C.site.name} is a ${C.site.operator} community. Our sister community is ${C.site.sister.name} in ${C.site.sister.city}. The name comes from the wren, a small, sociable bird that builds a snug home and fills it with song. That’s how we want every Wrenhaven community to feel.`, src("about", c.l)),
  },
  {
    test: has(/\b(jobs?|careers?|hiring|employment|apply for a job|work (here|for you|at)|openings?|positions?|empleo|trabajo)\b/, /招聘|求职|应聘|职位|工作机会|找工作|在这里工作/),
    run: (c) => {
      const { careers } = C;
      const perks = [/medical/i, /401/i, /tuition/i, /free meal/i].map((re) => careers.benefits.find((b) => re.test(b))).filter((b): b is string => !!b);
      return c.l === "zh"
        ? {
            lang: c.l,
            text: `${tr(careers.intro)}我们正在招聘：`,
            groups: [{ lines: careers.openings.map((o) => ({ text: tr(o.title), note: [tr(o.dept), tr(o.type), o.pay ? o.pay.replace("/hr", "/小时").replace("tips pool", "小费分成") : "薪资面议"].join(" · ") })) }],
            after: `${perks.length ? `福利包括${perks.map(tr).join("、")}。` : ""}如有疑问请联系：${C.site.careersEmail}。`,
            source: src("careers", c.l),
          }
        : {
            lang: c.l,
            text: careers.intro + " We’re hiring for:",
            groups: [{ lines: careers.openings.map((o) => ({ text: o.title, note: [o.dept, o.type, o.pay ?? "Pay on application"].join(" · ") })) }],
            after: `${perks.length ? `Benefits include ${andList(perks.map(lcFirst))}. ` : ""}Questions: ${C.site.careersEmail}.`,
            source: src("careers", c.l),
          };
    },
  },
  {
    test: has(/includ|utilit|housekeep|cable|internet|wi ?fi|maintenance|laundry|what do i get|what does the rent|incluye/, /包含|包括|含哪些|水电|清洁|保洁|打扫|网络|宽带|有线电视|维修|洗衣/),
    run: (c) => c.l === "zh"
      ? { lang: c.l, text: "租金包含：", groups: [{ lines: C.pricing.included.map((t) => ({ text: tr(t) })) }], after: "欢迎携带宠物，且不收取第二人费用。", source: src("faq", c.l), cta: src("plans", c.l), chips: ["费用是多少？", "现在有哪些空房？"] }
      : { lang: c.l, text: "Rent includes:", groups: [{ lines: C.pricing.included.map((t) => ({ text: t })) }], after: "Pets are welcome, and there’s no second-person fee.", source: src("faq", c.l), cta: src("plans", c.l), chips: ["How much does it cost?", "What’s available right now?"] },
  },
  { test: has(/availab|vacanc|move in soon|waitlist|wait list|openings? (now|today)|disponib/, /空房|空位|现房|候补|可以入住|能入住|有房/), run: (c) => availabilityAnswer(c.l) },
  { test: has(/\b(cost|costs|price|prices|pricing|how much|rent|rates?|fees?|afford|expensive|cheap|monthly|cuanto|cuesta|cuestan|precios?|costos?|tarifas?)\b/, /多少钱|价格|价钱|价位|费用|收费|租金|月租|房租|贵|便宜|花费/), run: (c) => pricesAnswer(c.l) },
  {
    test: has(/\btour\b|tours\b|come see|see the (community|place|apartments)|book a visit|schedule a visit|recorrido|agendar|cita|visitar la comunidad|conocer/, /参观|看房|来看看|实地/),
    run: (c) => {
      const p = contact();
      const hrs = tourHours(c.l);
      const lunch = lunchOnUs();
      const phone = C.site.phone;
      return c.l === "es"
        ? simple(c.l, `¡Nos encantaría recibirle!${hrs ? ` ${hrs}` : ""} Reserve en línea en un minuto, o llame${p ? ` a ${esWho(p)}` : ""} al ${phone}.${lunch ? " La comida en uno de nuestros restaurantes corre por nuestra cuenta." : ""}`, src("tour", c.l), { cta: { label: "Agendar una visita", href: "/tour" } })
        : c.l === "zh"
        ? simple(c.l, `我们很乐意带您参观！${hrs}您可以在线预约，只需一分钟；也可以致电${p ? zhWho(p) : "我们"}：${phone}。${lunch ? "我们还会请您在餐厅享用一顿午餐。" : ""}`, src("tour", c.l), { cta: { label: "预约参观", href: "/tour" }, chips: ["社区在哪里？", "今天有什么活动？"] })
        : simple(c.l, `We’d love to show you around.${hrs ? ` ${hrs}` : ""} Book online in a minute, or call ${p ? `${enWho(p)}, ` : "us "}at ${phone}.${lunch ? " Lunch in one of our restaurants is on us." : ""}`, src("tour", c.l), { cta: { label: "Schedule a Tour", href: "/tour" }, chips: ["Where are you located?", "What’s on today?"] });
    },
  },
  { test: has(/happy hour|cocktail|\bwine\b|\bdrinks?\b|\bbar\b/, /欢乐时光|鸡尾酒|葡萄酒|喝酒|酒吧|喝一杯/), run: (c) => happyHourAnswer(c.l) },
  { test: has(/\b(trips?|outings?|excursions?|bus trip|adventures?|field trip|seats? left|sign up|salidas?|paseos?)\b/, /出游|郊游|旅行|远足|一日游|外出活动|名额|报名/), run: (c) => tripsAnswer(c.l) },
  { test: has(/breakfast|desayuno|flapjack|pancake/, /早餐|早饭|早点|松饼|煎饼/), run: (c) => breakfastAnswer(c.l) },
  { test: has(/\blunch\b|almuerzo/, /午餐|午饭|中饭/), run: (c) => (/family|guest|visitor|book|reserv|join/.test(c.n) || /家人|家属|客人|访客|预订|预约|一起/.test(c.raw) ? null : lunchAnswer(c.l)) },
  { test: has(/dinner|supper|menu|\beat\b|eating|food|chef|special|restaurant|dining|cena|comida|menu/, /晚餐|晚饭|菜单|吃什么|餐厅|餐饮|主厨|厨师|特色菜|美食|伙食/), run: (c) => dinnerAnswer(c.l, c.span) },
  {
    test: has(/transport|\bbus\b|shuttle|\bride\b|rides|driv|appointment|doctor|\bcar\b|parking|transporte/, /交通|巴士|班车|接送|开车|就医|看病|医生|停车|汽车/),
    run: (c) => {
      const days = shoppingDays();
      return c.l === "zh"
        ? simple(c.l, `${tr(faq("Do you provide transportation"))}${days.length ? `每周${days.map((d) => WD_ZH[d]).join("和")}有购物出行。` : ""}住户也可以保留自己的汽车。`, src("faq", c.l), { chips: ["近期有出游活动吗？", "租金包含什么？"] })
        : simple(c.l, `${faq("Do you provide transportation")}${days.length ? ` Shopping trips run on ${andList(days.map((d) => WEEKDAYS[d] + "s"))},` : ""} and residents can still keep their own car.`.replace(". and", ". Residents"), src("faq", c.l), { chips: ["Any trips coming up?", "What’s included?"] });
    },
  },
  { test: has(/fitness|exercise|class(es)?\b|yoga|\bgym\b|tai chi|zumba|balance|workout|\bwalks?\b|physical therapy|ejercicio/, /健身|锻炼|运动|课程|瑜伽|太极|尊巴|平衡|散步|物理治疗|康复/), run: (c) => fitnessAnswer(c.span, c.l) },
  { test: has(/church|\bmass\b|catholic|chaplain|worship|faith|religio|bible|rosary|spiritual|pray|misa|iglesia/, /教堂|弥撒|天主教|基督教|牧师|礼拜|信仰|宗教|圣经|祷告|祈祷|灵修/), run: (c) => faithAnswer(c.l) },
  {
    test: has(/visit(ing|or|ors)?\b|family|grandkid|grandchild|guests?\b|join (me|my|us)|lunch with|book lunch|visita/, /家人|家属|孙子|孙女|儿女|子女|客人|访客|探望|探访|一起用餐|陪我/),
    run: (c) => {
      const diner = who(/lunch/i, /dining experience/i);
      const club = C.spaces.find((s) => s.key === "club");
      return c.l === "zh"
        ? simple(c.l, `当然可以。我们随时欢迎家人和访客，您可以在线预订午餐${diner ? `，也可以联系${zhWho(diner)}` : ""}。${club ? `${tr(club.name)}还可预订用于私人聚会。` : ""}`, src("dining", c.l), { chips: ["午餐吃什么？", "这个周末有什么活动？"] })
        : simple(c.l, `${named(faq("Can my family join me"), diner)}${club ? ` The ${club.name} can be reserved for private parties.` : ""}`, src("dining", c.l), { chips: ["What’s for lunch?", "What’s on this weekend?"] });
    },
  },
  { test: has(/size|square|sq ?ft|\bfeet\b|how big|floor ?plans?|layout|bedroom|studio|balcon|kitchen|washer|dryer|closet|apartments?\b/, /面积|多大|平方|户型|卧室|一居|两居|单间|阳台|厨房|洗衣机|烘干机|衣柜|公寓/), run: (c) => apartmentsAnswer(c.l) },
  { test: () => true, run: (c) => teamAnswer(c) },
  { test: () => true, run: (c) => spaceAnswer(c) },
  {
    test: (c) =>
      has(/where|address|located|location|directions|map|how far|airport|highway|calder|donde|direccion/, /在哪|哪里|地址|位置|怎么走|路线|地图|多远|机场|高速/)(c) ||
      c.n.includes(norm(C.site.address.city)),
    run: (c) => c.l === "zh"
      ? { lang: c.l, text: `我们的地址是 ${C.site.addressLine}。`, groups: [{ lines: C.site.location.map((t) => ({ text: tr(t) })) }], source: src("contact", c.l), cta: { label: "获取路线", href: "/contact" } }
      : { lang: c.l, text: `We’re at ${C.site.addressLine}.`, groups: [{ lines: C.site.location.map((t) => ({ text: t })) }], source: src("contact", c.l), cta: { label: "Get directions", href: "/contact" } },
  },
  {
    test: has(/phone|call|email|e-mail|contact|number|reach|hours|telefono|correo|llamar/, /电话|号码|邮件|邮箱|联系|联络|营业时间|办公时间/),
    run: (c) => c.l === "zh"
      ? simple(c.l, `请致电 ${C.site.phone}，或发送邮件至 ${C.site.email}。${tourHours("zh")}`, src("contact", c.l), { cta: src("tour", c.l) })
      : simple(c.l, `Call us at ${C.site.phone}, or email ${C.site.email}. ${C.site.hoursOffice}.`, src("contact", c.l), { cta: src("tour", c.l) }),
  },
  {
    test: (c) => !!c.span || /what'?s on|whats on|happening|going on|\bevents?\b|activit|calendar|schedule|to do|que hay|actividades|eventos|agenda/.test(c.n) || /活动|有什么|日程|日历|安排|节目|好玩/.test(c.raw),
    run: (c) => eventsAnswer(c.span ?? single(today(), today()), c.l),
  },
];

const identity = (s: string) => s;

/**
 * Answer a question about community `c` from its own published content.
 * The answer is in the page language, unless the question is plainly written in another one.
 * `t` translates site data into the page language (from useT()); it is used only when the answer is in that language.
 */
export function answer(raw: string, c: Community, siteLang: Lang = "en", t: (s: string) => string = identity): Answer {
  const n = norm(raw);
  const asked = langOf(raw);
  // Spanish and Chinese are recognised anywhere. On a Chinese page, an English sentence (not just a name like "Lantern") is answered in English.
  const english = asked === "en" && siteLang === "zh" && /[a-z]{2,}\W+[a-z]{2,}/i.test(raw);
  const l: Lang = asked === "zh" || asked === "es" ? asked : english ? "en" : siteLang;
  const prev = C;
  C = c;
  tr = l === siteLang ? t : identity;
  try {
    const ctx: Ctx = { n, raw, l, span: resolveDays(n) };
    for (const it of intents) {
      if (!it.test(ctx)) continue;
      const a = it.run(ctx);
      if (a) {
        if (l === "es" && a.lang === "en") a.after = [a.after, "Esta respuesta solo está disponible en inglés por ahora. Con gusto le atendemos en español al " + c.site.phone + "."].filter(Boolean).join(" ");
        return a;
      }
    }
    const p = contact();
    const st = starters(c)[l];
    if (l === "zh") return { lang: l, text: `我们的网站上暂时没有这方面的信息，不过${p ? zhWho(p) : "我们的团队"}一定能为您解答。请留下您的姓名和电话，我们会给您回电；您也可以试试下面这些问题：`, lead: true, chips: st.slice(0, 4) };
    return l === "es"
      ? { lang: l, text: `No encuentro eso en nuestro sitio web, pero ${p ? esWho(p) : "nuestro equipo"} le puede responder. Déjenos su nombre y teléfono.`, lead: true, chips: st.slice(0, 4) }
      : { lang: l, text: `I don’t have that one on our website, but ${p ? enSubj(p) : "our team"} will know. Leave your name and number and we’ll call you — or try one of these:`, lead: true, chips: st.slice(0, 4) };
  } finally {
    tr = identity;
    C = prev;
  }
}

/** Suggested first questions. Lantern is suggested only where the community has Lantern apartments. */
export function starters(c: Community): Record<Lang, string[]> {
  const lantern = c.plans.some((p) => p.kind === "lantern");
  const keep = (xs: string[]) => (lantern ? xs : xs.filter((x) => !/lantern/i.test(x)));
  return {
    en: keep(["What’s on today?", "What’s for dinner tonight?", "How much does it cost?", "Is there a second-person fee?", "Tell me about Lantern", "Can I bring my dog?"]),
    es: keep(["¿Qué hay hoy?", "¿Qué hay de cena esta noche?", "¿Cuánto cuesta?", "¿Hay cargo por segunda persona?", "Hábleme de Lantern", "¿Puedo traer a mi perro?"]),
    zh: keep(["今天有什么活动？", "今晚吃什么？", "费用是多少？", "第二人需要付费吗？", "介绍一下 Lantern", "可以带狗入住吗？"]),
  };
}

export function hello(c: Community, l: Lang, again = false): Answer {
  const h = Math.floor(nowMinutes() / 60);
  const d = today();
  const name = c.site.name;
  const st = starters(c)[l];
  if (l === "zh") {
    const greet = h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好";
    return { lang: l, text: `${greet}！关于 ${name} 的任何问题都欢迎问我们，比如价格、公寓、今晚的晚餐，或者今天（${zhDate(d)}）有什么活动。`, chips: again ? st.slice(0, 3) : undefined };
  }
  const greet = l === "es" ? (h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches") : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return l === "es"
    ? { lang: l, text: `${greet}. Pregúntenos lo que quiera sobre ${name}: precios, apartamentos, la cena de esta noche o lo que hay hoy, ${esDate(d)}.`, chips: again ? st.slice(0, 3) : undefined }
    : { lang: l, text: `${greet}! Ask us anything about ${name} — pricing, apartments, tonight’s dinner, or what’s on today, ${WEEKDAYS[dow(d)]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}.`, chips: again ? st.slice(0, 3) : undefined };
}

/** Is the office likely to be in right now (Mon–Sat, 9:00 am–5:00 pm)? Decides how soon a call-back is promised. */
export function officeOpen(): boolean {
  const m = nowMinutes();
  return dow(today()) !== 0 && m >= 540 && m < 1020;
}
