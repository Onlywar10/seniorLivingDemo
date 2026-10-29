import { es } from "@/data/es";

// In-place page translation. Each text node keeps its English original so switching back is exact,
// and React re-renders (which write English back) are picked up and re-translated.

const original = new WeakMap<Node, string>();
const applied = new WeakMap<Node, string>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE"]);
const ATTRS = ["placeholder", "aria-label"];

const DAYS: Record<string, string> = { Monday: "lunes", Tuesday: "martes", Wednesday: "miércoles", Thursday: "jueves", Friday: "viernes", Saturday: "sábado", Sunday: "domingo", Mon: "lun", Tue: "mar", Wed: "mié", Thu: "jue", Fri: "vie", Sat: "sáb", Sun: "dom" };
const MONTHS: Record<string, string> = { January: "enero", February: "febrero", March: "marzo", April: "abril", May: "mayo", June: "junio", July: "julio", August: "agosto", September: "septiembre", October: "octubre", November: "noviembre", December: "diciembre", Jan: "ene", Feb: "feb", Mar: "mar", Apr: "abr", Jun: "jun", Jul: "jul", Aug: "ago", Sep: "sept", Oct: "oct", Nov: "nov", Dec: "dic" };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const dayRe = "(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)";
const monRe = "(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";

/** Pattern rules for text built from dates, times and counts. */
const rules: [RegExp, (...m: string[]) => string][] = [
  [new RegExp(`^${dayRe} (\\d{1,2}) ${monRe}( \\d{4})?$`), (_, d, n, m, y) => `${cap(DAYS[d])} ${n} de ${MONTHS[m]}${y ? " de" + y : ""}`],
  [new RegExp(`^${dayRe} (\\d{1,2}) ${monRe}, (.+)$`), (_, d, n, m, rest) => `${cap(DAYS[d])} ${n} de ${MONTHS[m]}, ${tr(rest) ?? rest}`],
  [new RegExp(`^(\\d{1,2}) ${monRe}$`), (_, n, m) => `${n} ${MONTHS[m]}`],
  [new RegExp(`^${dayRe}$`), (_, d) => cap(DAYS[d])],
  [new RegExp(`^Today, ${dayRe} (\\d{1,2}) ${monRe}$`), (_, d, n, m) => `Hoy, ${DAYS[d]} ${n} de ${MONTHS[m]}`],
  [new RegExp(`^Monday (\\d{1,2})( ${monRe})? – Sunday (\\d{1,2}) ${monRe} (\\d{4})$`), (_, a, _m1, m1, b, m2, y) => `Lunes ${a}${m1 ? " de " + MONTHS[m1] : ""} – domingo ${b} de ${MONTHS[m2]} de ${y}`],
  [/^(\d+) available$/, (_, n) => `${n} disponible${n === "1" ? "" : "s"}`],
  [/^Waitlist \((\d+)\)$/, (_, n) => `Lista de espera (${n})`],
  [/^(\d+) going$/, (_, n) => `${n} confirmados`],
  [/^(\d+) spaces left$/, (_, n) => `Quedan ${n} plazas`],
  [/^Starting at (\$[\d,]+) a month$/, (_, p) => `Desde ${p} al mes`],
  [/^(\d+) residents?(.*)$/, (_, n, rest) => `${n} residentes${rest.replace(", ", ", ").replace("guests", "invitados").replace("volunteers", "voluntarios")}`],
  [/^Updated (.+)$/, (_, r) => `Actualizado ${r.replace("today", "hoy")}`],
  [/^Last updated (.+)$/, (_, r) => `Última actualización: ${r.replace("today", "hoy")}`],
  [/^(\d{1,2}):(\d{2}) (am|pm)$/, (_, h, m, ap) => `${h}:${m} ${ap === "am" ? "a. m." : "p. m."}`],
  [/^Starting in (\d+) min:$/, (_, n) => `Empieza en ${n} min:`],
  [/^Up next, (\d{1,2}):(\d{2}) (am|pm):$/, (_, h, m, ap) => `A continuación, ${h}:${m} ${ap === "am" ? "a. m." : "p. m."}:`],
  [/^Photo (\d+) of (\d+)$/, (_, a, b) => `Foto ${a} de ${b}`],
  [/^(\d+) years? here$/, (_, n) => `${n} años aquí`],
];

function tr(s: string): string | undefined {
  const hit = es[s];
  if (hit) return hit;
  for (const [re, fn] of rules) {
    const m = s.match(re);
    if (m) return fn(...m);
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
      const out = translateText(cur);
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
