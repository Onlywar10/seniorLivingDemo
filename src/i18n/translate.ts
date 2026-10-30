import type { Lang } from "./config";

// Translation of English site text. Dictionaries (es.ts, zh.ts) are keyed by the exact English text, trimmed.
//
// Lookup order for a string:
//   1. exact match in the dictionary;
//   2. template match: dates, times, prices, numbers and plan codes are lifted out as {1}, {2}…,
//      the remaining text is looked up (e.g. "{1} seats left"), and the tokens are put back
//      in the language's own form ("Oct 29" → "29 oct" / "10月29日", "9:00 am" → "9:00 a. m." / "上午9:00");
//   3. pattern rules for composite text (plan names…), then " · " / " — " separated parts one by one.
// Anything not found stays in English. An empty string in a dictionary means "say nothing here".

export type Dict = Record<string, string>;
export type T = (s: string) => string;

const D = "(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)";
const M = "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
const MONTH_INDEX: Record<string, number> = {};
["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].forEach((m, i) => {
  MONTH_INDEX[m] = i;
  MONTH_INDEX[m.slice(0, 3)] = i;
});
MONTH_INDEX.Sept = 8;
const isLong = (m: string) => m.length > 3 && m !== "Sept";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Token = [RegExp, (...g: string[]) => string];
type Rule = [RegExp, (tr: (s: string) => string | undefined, ...m: string[]) => string | undefined];

interface Grammar {
  /** Weekday or month name on its own. */
  word: (s: string) => string | undefined;
  tokens: Token[];
  /** Put token values back into a translated template. */
  fill: (tpl: string, vals: string[]) => string;
  perMonth: string;
  rules: Rule[];
}

// Tokens that keep their form in every language. Order matters (longest first), so these go last.
const COMMON_TOKENS: Token[] = [
  // Phone numbers stay as they are.
  [/(\(\d{3}\) \d{3}-\d{4})/, (p) => p],
  // Plan codes: NB2B, NC6, AZ1…
  [/\b((?:N[ABC]|A[BZ])\d[A-Z]?)\b/, (c) => c],
  // Prices and plain numbers stay as they are.
  [/(\$\d[\d,]*(?:\.\d+)?)/, (p) => p],
  [/(?<![\w#$.,:\u0000-])(\d[\d,]*(?:\.\d+)?)(?![\w:\u0000])/, (n) => n],
];

// ---------------------------------------------------------------- Spanish

const ES_DAYS: Record<string, string> = { Monday: "lunes", Tuesday: "martes", Wednesday: "miércoles", Thursday: "jueves", Friday: "viernes", Saturday: "sábado", Sunday: "domingo", Mon: "lun", Tue: "mar", Wed: "mié", Thu: "jue", Fri: "vie", Sat: "sáb", Sun: "dom" };
const ES_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const ES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
const esMonth = (m: string) => (isLong(m) ? ES_MONTHS : ES_SHORT)[MONTH_INDEX[m]];
const esAp = (ap: string) => (ap === "am" ? "a. m." : "p. m.");

/** "October 29" → "29 de octubre"; "Oct 29" → "29 oct"; with year → "29 de octubre de 2026" / "29 oct 2026" */
function esDay(m: string, d: string, y?: string) {
  if (isLong(m)) return `${d} de ${esMonth(m)}${y ? ` de ${y}` : ""}`;
  return `${d} ${esMonth(m)}${y ? ` ${y}` : ""}`;
}

const es: Grammar = {
  word: (s) => (ES_DAYS[s] ? cap(ES_DAYS[s]) : MONTH_INDEX[s] !== undefined ? cap(esMonth(s)) : undefined),
  tokens: [
    // Week label: "Oct 25 – 31, 2026" / "Nov 29 – Dec 5, 2026"
    [new RegExp(`${M} (\\d{1,2}) – (?:${M} )?(\\d{1,2}), (\\d{4})`), (m1, d1, m2, d2, y) => (m2 ? `${d1} ${esMonth(m1)} – ${d2} ${esMonth(m2)} ${y}` : `${d1} – ${d2} ${esMonth(m1)} ${y}`)],
    // "Thursday, October 29, 2026" · "Thu, Oct 29" · "October 29" · "Oct 29"
    [new RegExp(`(?:${D}, )?${M} (\\d{1,2})(?:, (\\d{4}))?(?![\\d:])`), (d, m, n, y) => (d ? `${ES_DAYS[d]}, ` : "") + esDay(m, n, y)],
    // "October 2026"
    [new RegExp(`${M} (\\d{4})`), (m, y) => `${esMonth(m)} de ${y}`],
    // "9:00–9:45 am" · "11:30 am–12:30 pm" · "9:00 am"
    [/(\d{1,2}:\d{2})(?: (am|pm))?–(\d{1,2}:\d{2}) (am|pm)/, (a, apa, b, apb) => (apa ? `${a} ${esAp(apa)}–${b} ${esAp(apb)}` : `${a}–${b} ${esAp(apb)}`)],
    [/(\d{1,2}:\d{2}) (am|pm)/, (a, ap) => `${a} ${esAp(ap)}`],
    ...COMMON_TOKENS,
  ],
  fill(tpl, vals) {
    // "a las 1:00" → "a la 1:00"; "3:00 p. m.." → "3:00 p. m."
    const out = tpl
      .replace(/\{(\d+)\}/g, (_, i) => vals[+i - 1] ?? "")
      .replace(/\b(a|de) las 1:/g, "$1 la 1:")
      .replace(/([ap]\. m\.)\./g, "$1");
    // Weekday or month at the very start of a sentence is capitalised in Spanish.
    return /^\{\d+\}/.test(tpl) ? cap(out) : out;
  },
  perMonth: "/mes",
  rules: [
    [/^(.+): floor plan and virtual tour$/, (tr, _, name) => `${tr(name) ?? name}: plano y recorrido virtual`],
    [/^((?:N[ABC]|A[BZ])\d[A-Z]?) (.+)$/, (tr, _, code, rest) => { const r = tr(rest); return r ? `${code} ${r}` : undefined; }],
    [/^(.+), from the calendar$/, (tr, _, a) => `${tr(a) ?? a}, según el calendario`],
    // Confirmations that include what the visitor typed.
    [/^Thank you, (.+)\. We’ve got your message\.$/, (_tr, _, n) => `Gracias, ${n}. Recibimos su mensaje.`],
    [/^Thanks, (.+) — your application is in\.$/, (_tr, _, n) => `Gracias, ${n}: recibimos su solicitud.`],
    [/^We’ll email a video link to (.+)$/, (_tr, _, e) => `Le enviaremos un enlace de video a ${e}`],
    [/^and by text to (.+)$/, (_tr, _, n) => `y por mensaje de texto al ${n}`],
    [/^See you in the (.+) at (\d{1,2}:\d{2} [ap]m)\.$/, (tr, _, room, t) => es.fill(`Le esperamos en ${tr(room) ?? room} a las {1}.`, [tr(t) ?? t])],
  ],
};

// ---------------------------------------------------------------- Simplified Chinese

const ZH_DAYS: Record<string, string> = { Monday: "星期一", Tuesday: "星期二", Wednesday: "星期三", Thursday: "星期四", Friday: "星期五", Saturday: "星期六", Sunday: "星期日", Mon: "周一", Tue: "周二", Wed: "周三", Thu: "周四", Fri: "周五", Sat: "周六", Sun: "周日" };
const zhMonth = (m: string) => `${MONTH_INDEX[m] + 1}月`;
/** Period of day before the clock time: 上午 / 中午 / 下午 / 晚上. */
function zhAp(t: string, ap: string) {
  const h = Number(t.split(":")[0]);
  if (ap === "am") return h === 12 || h < 5 ? "凌晨" : "上午";
  return h === 12 ? "中午" : h < 6 ? "下午" : "晚上";
}
const zhTime = (t: string, ap: string) => `${zhAp(t, ap)}${t}`;

const zh: Grammar = {
  word: (s) => ZH_DAYS[s] ?? (MONTH_INDEX[s] !== undefined ? zhMonth(s) : undefined),
  tokens: [
    // "Oct 25 – 31, 2026" → "2026年10月25日–31日"; "Nov 29 – Dec 5, 2026" → "2026年11月29日–12月5日"
    [new RegExp(`${M} (\\d{1,2}) – (?:${M} )?(\\d{1,2}), (\\d{4})`), (m1, d1, m2, d2, y) => `${y}年${zhMonth(m1)}${d1}日–${m2 ? zhMonth(m2) : ""}${d2}日`],
    // "Thursday, October 29, 2026" → "2026年10月29日 星期四"; "Thu, Oct 29" → "10月29日 周四"
    [new RegExp(`(?:${D}, )?${M} (\\d{1,2})(?:, (\\d{4}))?(?![\\d:])`), (d, m, n, y) => `${y ? `${y}年` : ""}${zhMonth(m)}${n}日${d ? ` ${ZH_DAYS[d]}` : ""}`],
    // "October 2026" → "2026年10月"
    [new RegExp(`${M} (\\d{4})`), (m, y) => `${y}年${zhMonth(m)}`],
    // "9:00–9:45 am" → "上午9:00–9:45"; "11:30 am–12:30 pm" → "上午11:30–中午12:30"
    [
      /(\d{1,2}:\d{2})(?: (am|pm))?–(\d{1,2}:\d{2}) (am|pm)/,
      (a, apa, b, apb) => {
        const pa = zhAp(a, apa ?? apb), pb = zhAp(b, apb);
        return pa === pb ? `${pa}${a}–${b}` : `${pa}${a}–${pb}${b}`;
      },
    ],
    [/(\d{1,2}:\d{2}) (am|pm)/, (a, ap) => zhTime(a, ap)],
    ...COMMON_TOKENS,
  ],
  fill: (tpl, vals) => tpl.replace(/\{(\d+)\}/g, (_, i) => vals[+i - 1] ?? ""),
  perMonth: "/月",
  rules: [
    [/^(.+): floor plan and virtual tour$/, (tr, _, name) => `${tr(name) ?? name}：户型图与虚拟参观`],
    [/^((?:N[ABC]|A[BZ])\d[A-Z]?) (.+)$/, (tr, _, code, rest) => { const r = tr(rest); return r ? `${code} ${r}` : undefined; }],
    [/^(.+), from the calendar$/, (tr, _, a) => `${tr(a) ?? a}（来自活动日历）`],
    [/^Thank you, (.+)\. We’ve got your message\.$/, (_tr, _, n) => `谢谢您，${n}。我们已收到您的留言。`],
    [/^Thanks, (.+) — your application is in\.$/, (_tr, _, n) => `谢谢您，${n}，我们已收到您的申请。`],
    [/^We’ll email a video link to (.+)$/, (_tr, _, e) => `我们会将视频链接发送至 ${e}`],
    [/^and by text to (.+)$/, (_tr, _, n) => `并以短信发送至 ${n}`],
    [/^See you in the (.+) at (\d{1,2}:\d{2}) ([ap]m)\.$/, (tr, _, room, t, ap) => `${zhTime(t, ap)}，我们在 ${tr(room) ?? room} 等您。`],
  ],
};

const grammars: Record<Exclude<Lang, "en">, Grammar> = { es, zh };

// ---------------------------------------------------------------- engine

/** Lift tokens out of `s`: returns the template ("{1} seats left") and each token in the target language. */
function templatize(g: Grammar, s: string): { tpl: string; vals: string[] } {
  const vals: string[] = [];
  let tpl = s;
  for (const [re, fn] of g.tokens) {
    tpl = tpl.replace(new RegExp(re.source, "g"), (...m) => {
      const groups = m.slice(1, -2) as string[];
      vals.push(fn(...groups));
      return `\u0000${vals.length - 1}\u0000`;
    });
  }
  // Number placeholders in reading order.
  const order: string[] = [];
  tpl = tpl.replace(/\u0000(\d+)\u0000/g, (_, i) => {
    order.push(vals[+i]);
    return `{${order.length}}`;
  });
  return { tpl, vals: order };
}

const SEPARATORS = [" · ", " — "];

function lookup(g: Grammar, dict: Dict, s: string, depth = 0): string | undefined {
  const hit = dict[s];
  if (hit !== undefined) return hit;
  if (depth > 4) return undefined;
  const tr = (x: string) => lookup(g, dict, x, depth + 1);

  const { tpl, vals } = templatize(g, s);
  if (vals.length) {
    const t = dict[tpl];
    if (t !== undefined) return g.fill(t, vals);
    // Nothing but tokens and punctuation: "9:00–9:45 am", "Thu, Oct 29", "$8,600/mo".
    if (!/[A-Za-z]/.test(tpl.replace(/\{\d+\}/g, ""))) return g.fill(tpl, vals);
    const slash = tpl.match(/^(.*?)\/(mo|month)$/);
    if (slash && !/[A-Za-z]/.test(slash[1].replace(/\{\d+\}/g, ""))) return g.fill(`${slash[1]}${g.perMonth}`, vals);
  }

  if (/^[A-Z][a-z]+$/.test(s)) {
    const w = g.word(s);
    if (w) return w;
  }

  for (const [re, fn] of g.rules) {
    const m = s.match(re);
    if (m) {
      const out = fn(tr, ...m);
      if (out !== undefined) return out;
    }
  }

  for (const sep of SEPARATORS) {
    if (!s.includes(sep)) continue;
    let changed = false;
    const parts = s.split(sep).map((p) => {
      const t = tr(p.trim());
      if (t !== undefined && t !== p.trim()) changed = true;
      return t ?? p;
    });
    if (changed) return parts.join(sep);
  }
  return undefined;
}

// In development, text with no translation is logged once (server terminal and browser console) so dictionaries can be completed.
const missed = new Set<string>();
function onMiss(lang: Lang, s: string) {
  if (process.env.NODE_ENV !== "development" || missed.has(lang + s)) return;
  missed.add(lang + s);
  console.warn(`[i18n-miss] ${lang} ${JSON.stringify(s)}`);
}

/** A translator for one language. Leading and trailing whitespace is kept as written. */
export function translator(lang: Lang, dict: Dict): T {
  if (lang === "en") return (s) => s;
  const g = grammars[lang];
  const cache = new Map<string, string>();
  return (raw) => {
    if (typeof raw !== "string") return raw;
    const cached = cache.get(raw);
    if (cached !== undefined) return cached;
    const s = raw.trim();
    let out = raw;
    if (s && /[A-Za-z]/.test(s)) {
      const hit = lookup(g, dict, s);
      if (hit === undefined) {
        onMiss(lang, s);
      } else {
        const lead = raw.slice(0, raw.indexOf(s.charAt(0)));
        const trail = raw.slice(raw.lastIndexOf(s.charAt(s.length - 1)) + 1);
        // Chinese doesn't put spaces between words, so drop the padding that joined English fragments.
        out = lang === "zh" && /^[\s]*$/.test(lead + trail) && /[\u3000-\u9fff\uff00-\uffef]/.test(hit) ? hit : lead + hit + trail;
      }
    } else if (s) {
      // Numbers, prices, times and dates with no words: "9:00 am", "Oct 29".
      const { tpl, vals } = templatize(g, s);
      if (vals.length) out = raw.replace(s, g.fill(tpl, vals));
    }
    cache.set(raw, out);
    return out;
  };
}
