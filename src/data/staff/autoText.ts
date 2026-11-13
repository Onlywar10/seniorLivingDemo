// Automations: the small text helpers both the server and the browser use. Filling a message's placeholders
// ("{first name}", "{event}") with real values, finding the placeholders a wording uses, and counting how many texts
// a message takes (a text over 160 plain characters, or 70 with accents or Chinese, splits into more than one).
// No imports, so client components can use it.

/** The three languages a message is previewed in. Kinlight also sends Russian, Tagalog and Vietnamese, translated. */
export type MsgLang = "en" | "es" | "zh";
export const MSG_LANGS: { k: MsgLang; label: string; name: string }[] = [
  { k: "en", label: "English", name: "English" },
  { k: "es", label: "Español", name: "Spanish" },
  { k: "zh", label: "中文", name: "Chinese" },
];
export type L = Record<MsgLang, string>;

/** "{first name}", "{event}"… */
export const PLACEHOLDER = /\{([a-z][a-z ]*)\}/g;

/** Put the values into a wording. Anything without a value stays as its placeholder, so a mistake shows. */
export function fillIn(tpl: string, vars: Record<string, string | number | undefined>): string {
  return tpl
    .replace(PLACEHOLDER, (m, k: string) => {
      const v = vars[k];
      return v === undefined || v === "" ? m : String(v);
    })
    // "9:00 a. m.." where a Spanish time ends a sentence.
    .replace(/([ap]\. m\.)\./g, "$1");
}

/** The placeholders a wording uses, in order, once each. */
export function placeholdersIn(tpl: string): string[] {
  const out: string[] = [];
  for (const m of tpl.matchAll(PLACEHOLDER)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

// The plain text alphabet every phone reads (GSM 03.38), as a set. Curly quotes are sent as plain ones.
const GSM = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€".split(""),
);
const plain = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...");

/** How many characters, and how many texts it takes. `plain` is false when accents or Chinese make it a shorter text. */
export function smsCount(s: string): { chars: number; parts: number; perPart: number; plain: boolean } {
  const t = plain(s);
  const chars = [...t].length;
  const isPlain = [...t].every((ch) => GSM.has(ch));
  const one = isPlain ? 160 : 70;
  const many = isPlain ? 153 : 67;
  return { chars, parts: chars <= one ? 1 : Math.ceil(chars / many), perPart: chars <= one ? one : many, plain: isPlain };
}

/* ------------------------------------------------------------ shared shapes, for the screens */

export type AutoGroup = "joining" | "news" | "events" | "lantern" | "dining" | "sales" | "surveys" | "replies" | "required" | "emergency";
export const GROUPS: { k: AutoGroup; label: string; note: string }[] = [
  { k: "joining", label: "Joining", note: "When a family member signs up, and the resident says yes" },
  { k: "news", label: "News", note: "Only to people who chose it" },
  { k: "events", label: "Events", note: "Invites, reminders and family requests" },
  { k: "lantern", label: "Lantern", note: "Lantern families. Lantern residents are never texted: staff ask in person" },
  { k: "dining", label: "Dining", note: "Bookings, swaps and “What’s for lunch?”" },
  { k: "sales", label: "Tours and waitlist", note: "Tour confirmations and the waitlist, kept by the front desk" },
  { k: "surveys", label: "Surveys", note: "How families think we’re doing" },
  { k: "replies", label: "Replies", note: "Clear answers to Kinlight’s own questions" },
  { k: "required", label: "Required", note: "The law says these always answer" },
  { k: "emergency", label: "Emergency", note: "Urgent notices staff post" },
];

/** What happened to one message. */
export type Status = "sent" | "delivered" | "opened" | "replied" | "failed" | "opted-out";
export const STATUS_LABEL: Record<Status, string> = { sent: "Sent", delivered: "Delivered", opened: "Opened", replied: "Replied", failed: "Failed", "opted-out": "Opted out" };

/** One message Kinlight sent on its own. `at` is minutes from the start of today (earlier days are negative). */
export interface LogRow {
  id: string;
  at: number;
  auto: string;
  to: string;
  /** "Daughter of Rosa Hernández", "Resident", "Prospect · Independent Living". */
  rel: string;
  /** The resident it's about, so it shows on their page in People. */
  resident?: string;
  ch: "Text" | "Email";
  lang: string;
  status: Status;
  text: string;
  /** As sent, in their language (Spanish and Chinese shown; other languages are translated the same way). */
  original?: string;
  subject?: string;
  reply?: { text: string; at: number; handled?: string };
  /** What they asked, when the message answers them ("What’s for lunch?", "STOP"). */
  asked?: string;
  /** Why it didn't arrive. */
  fail?: string;
  /** Extra texts that day, sent as one (no more than the daily limit). */
  combined?: boolean;
}

/** "Today, 9:00 am", "Yesterday, 4:10 pm", "Tue, Nov 10, 9:00 am", from minutes relative to today. */
export function whenOf(at: number, todayIso: string): string {
  const off = Math.floor(at / 1440);
  const m = ((at % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  if (off === 0) return `Today, ${time}`;
  if (off === -1) return `Yesterday, ${time}`;
  if (off === 1) return `Tomorrow, ${time}`;
  const d = new Date(Date.parse(todayIso + "T00:00:00Z") + off * 864e5);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${time}`;
}
/** The day a row falls on, for the date filter: "Today", "Yesterday", "Tue, Nov 10". */
export function dayOf(at: number, todayIso: string): string {
  return whenOf(Math.floor(at / 1440) * 1440, todayIso).replace(/, 12:00 am$/, "");
}
