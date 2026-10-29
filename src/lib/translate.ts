import { es } from "@/data/es";

// In-place page translation. Each text node keeps its English original so switching back is exact,
// and React re-renders (which write English back) are picked up and re-translated.
//
// Lookup order for a trimmed string:
//   1. exact match in `es`;
//   2. template match: dates, times, prices, numbers and plan codes are lifted out as {1}, {2}…,
//      the remaining text is looked up in `es` (e.g. "{1} seats left"), and the tokens are put back
//      in Spanish form ("Oct 29" → "29 oct", "9:00 am" → "9:00 a. m.");
//   3. pattern rules for composite text (plan names…), then " · " / " — " separated parts one by one.

const original = new WeakMap<Node, string>();
const applied = new WeakMap<Node, string>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE"]);
const ATTRS = ["placeholder", "aria-label"];

const DAYS: Record<string, string> = { Monday: "lunes", Tuesday: "martes", Wednesday: "miércoles", Thursday: "jueves", Friday: "viernes", Saturday: "sábado", Sunday: "domingo", Mon: "lun", Tue: "mar", Wed: "mié", Thu: "jue", Fri: "vie", Sat: "sáb", Sun: "dom" };
const MONTHS: Record<string, string> = { January: "enero", February: "febrero", March: "marzo", April: "abril", May: "mayo", June: "junio", July: "julio", August: "agosto", September: "septiembre", October: "octubre", November: "noviembre", December: "diciembre", Jan: "ene", Feb: "feb", Mar: "mar", Apr: "abr", Jun: "jun", Jul: "jul", Aug: "ago", Sep: "sept", Oct: "oct", Nov: "nov", Dec: "dic" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const D = "(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)";
const M = "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
const isLong = (m: string) => m.length > 3 && m !== "Sept";

/** "October 29" → "29 de octubre"; "Oct 29" → "29 oct"; with year → "29 de octubre de 2026" / "29 oct 2026" */
function esDay(m: string, d: string, y?: string) {
  const mo = MONTHS[m];
  if (isLong(m)) return `${d} de ${mo}${y ? ` de ${y}` : ""}`;
  return `${d} ${mo}${y ? ` ${y}` : ""}`;
}

const ampm = (ap: string) => (ap === "am" ? "a. m." : "p. m.");

// Token kinds lifted out of a string before the template lookup. Order matters (longest first).
const TOKENS: [RegExp, (...g: string[]) => string][] = [
  // Week label: "Oct 25 – 31, 2026" / "Nov 29 – Dec 5, 2026"
  [new RegExp(`${M} (\\d{1,2}) – (?:${M} )?(\\d{1,2}), (\\d{4})`), (m1, d1, m2, d2, y) => (m2 ? `${d1} ${MONTHS[m1]} – ${d2} ${MONTHS[m2]} ${y}` : `${d1} – ${d2} ${MONTHS[m1]} ${y}`)],
  // "Thursday, October 29, 2026" · "Thu, Oct 29" · "October 29" · "Oct 29"
  [new RegExp(`(?:${D}, )?${M} (\\d{1,2})(?:, (\\d{4}))?(?![\\d:])`), (d, m, n, y) => (d ? `${DAYS[d]}, ` : "") + esDay(m, n, y)],
  // "October 2026"
  [new RegExp(`${M} (\\d{4})`), (m, y) => `${MONTHS[m]} de ${y}`],
  // "9:00–9:45 am" · "11:30 am–12:30 pm" · "9:00 am"
  [/(\d{1,2}:\d{2})(?: (am|pm))?–(\d{1,2}:\d{2}) (am|pm)/, (a, apa, b, apb) => (apa ? `${a} ${ampm(apa)}–${b} ${ampm(apb)}` : `${a}–${b} ${ampm(apb)}`)],
  [/(\d{1,2}:\d{2}) (am|pm)/, (a, ap) => `${a} ${ampm(ap)}`],
  // Phone numbers stay as they are.
  [/(\(\d{3}\) \d{3}-\d{4})/, (p) => p],
  // Plan codes: NB2B, NC6, AZ1…
  [/\b((?:N[ABC]|A[BZ])\d[A-Z]?)\b/, (c) => c],
  // Prices and plain numbers stay as they are.
  [/(\$\d[\d,]*(?:\.\d+)?)/, (p) => p],
  [/(?<![\w#$.,:\u0000-])(\d[\d,]*(?:\.\d+)?)(?![\w:\u0000])/, (n) => n],
];

/** Lift tokens out of `s`: returns the template ("{1} seats left") and the Spanish form of each token. */
function templatize(s: string): { tpl: string; vals: string[] } {
  const vals: string[] = [];
  let tpl = s;
  for (const [re, fn] of TOKENS) {
    const g = new RegExp(re.source, "g");
    tpl = tpl.replace(g, (...m) => {
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

function fill(tpl: string, vals: string[]) {
  // "a las 1:00" → "a la 1:00"
  const out = tpl.replace(/\{(\d+)\}/g, (_, i) => vals[+i - 1] ?? "").replace(/\b(a|de) las 1:/g, "$1 la 1:");
  // Weekday or month at the very start of a sentence is capitalised in Spanish.
  return /^\{\d+\}/.test(tpl) ? cap(out) : out;
}

/** Pattern rules for composite text. */
const rules: [RegExp, (...m: string[]) => string | undefined][] = [
  [/^(.+): floor plan and virtual tour$/, (_, name) => `${tr(name) ?? name}: plano y recorrido virtual`],
  [/^((?:N[ABC]|A[BZ])\d[A-Z]?) (.+)$/, (_, code, rest) => { const r = tr(rest); return r ? `${code} ${r}` : undefined; }],
  [/^(.+), from the calendar$/, (_, a) => `${tr(a) ?? a}, según el calendario`],
  // Confirmations that include what the visitor typed.
  [/^Thank you, (.+)\. We’ve got your message\.$/, (_, n) => `Gracias, ${n}. Recibimos su mensaje.`],
  [/^Thanks, (.+) — your application is in\.$/, (_, n) => `Gracias, ${n}: recibimos su solicitud.`],
  [/^We’ll email a video link to (.+)$/, (_, e) => `Le enviaremos un enlace de video a ${e}`],
  [/^and by text to (.+)$/, (_, n) => `y por mensaje de texto al ${n}`],
  [/^See you in the (.+) at (\d{1,2}:\d{2} [ap]m)\.$/, (_, room, t) => fill(`Le esperamos en ${tr(room) ?? room} a las {1}.`, [tr(t) ?? t])],
];

const SEPARATORS = [" · ", " — "];

function tr(s: string, depth = 0): string | undefined {
  const hit = es[s];
  if (hit !== undefined) return hit;
  if (depth > 4) return undefined;

  const { tpl, vals } = templatize(s);
  if (vals.length) {
    const t = es[tpl];
    if (t !== undefined) return fill(t, vals);
    // Nothing but tokens and punctuation: "9:00–9:45 am", "Thu, Oct 29", "$8,600/mo".
    if (!/[A-Za-z]/.test(tpl.replace(/\{\d+\}/g, ""))) return fill(tpl, vals);
    const slash = tpl.match(/^(.*?)\/(mo|month)$/);
    if (slash && !/[A-Za-z]/.test(slash[1].replace(/\{\d+\}/g, ""))) return fill(`${slash[1]}/mes`, vals);
  }

  if (/^[A-Z][a-z]+$/.test(s) && (DAYS[s] || MONTHS[s])) return cap(DAYS[s] ?? MONTHS[s]);

  for (const [re, fn] of rules) {
    const m = s.match(re);
    if (m) {
      const out = fn(...m);
      if (out) return out;
    }
  }

  for (const sep of SEPARATORS) {
    if (!s.includes(sep)) continue;
    const parts = s.split(sep);
    let changed = false;
    const outParts = parts.map((p) => {
      const t = tr(p.trim(), depth + 1);
      if (t !== undefined && t !== p.trim()) changed = true;
      return t ?? p;
    });
    if (changed) return outParts.join(sep);
  }
  return undefined;
}

function translateText(raw: string): string | undefined {
  const t = raw.trim();
  if (!t || t.length < 2) return undefined;
  const out = tr(t);
  if (!out) return undefined;
  const lead = raw.slice(0, raw.indexOf(t.charAt(0)));
  const trail = raw.slice(raw.lastIndexOf(t.charAt(t.length - 1)) + 1);
  return lead + out + trail;
}

/**
 * Words whose Spanish depends on their neighbour: a lone "at" before a time reads "a las" (before a phone
 * number it stays "al"); "person"/"people" after a number (party-size options) read "persona"/"personas".
 */
function contextual(n: Node, raw: string): string | undefined {
  const t = raw.trim();
  if (t === "at") {
    const next = (n.nextSibling?.textContent ?? "").trim();
    if (/^\d{1,2}:\d{2}/.test(next)) return raw.replace("at", next.startsWith("1:") ? "a la" : "a las");
  }
  if (t === "person" || t === "people") {
    let prev = n.previousSibling;
    while (prev && !(prev.textContent ?? "").trim()) prev = prev.previousSibling;
    if (/^\d+$/.test((prev?.textContent ?? "").trim())) return raw.replace(t, t === "person" ? "persona" : "personas");
  }
  return undefined;
}

export function translateTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(n) {
      if (n.nodeType === 1) {
        const el = n as Element;
        if (SKIP.has(el.tagName) || el.hasAttribute("data-no-translate")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n.nodeType === 3) {
      const cur = n.nodeValue ?? "";
      if (applied.get(n) === cur) continue;
      const out = contextual(n, cur) ?? translateText(cur);
      original.set(n, cur);
      if (out && out !== cur) {
        applied.set(n, out);
        n.nodeValue = out;
      } else {
        applied.set(n, cur);
      }
    } else {
      const el = n as Element;
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (!v) continue;
        const store = attrOriginal.get(el) ?? {};
        if (store["@" + a] === v) continue;
        const out = translateText(v);
        if (out) {
          store[a] = v;
          store["@" + a] = out;
          attrOriginal.set(el, store);
          el.setAttribute(a, out);
        }
      }
    }
  }
}

export function restoreTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n.nodeType === 3) {
      const o = original.get(n);
      if (o !== undefined && applied.get(n) === n.nodeValue) n.nodeValue = o;
      original.delete(n);
      applied.delete(n);
    } else {
      const el = n as Element;
      const store = attrOriginal.get(el);
      if (!store) continue;
      for (const a of ATTRS) if (store[a] && el.getAttribute(a) === store["@" + a]) el.setAttribute(a, store[a]);
      attrOriginal.delete(el);
    }
  }
}
