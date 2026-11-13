// Every kind of thing that can need a person, and the rules for it: who it goes to, which group of Today it lands in,
// how urgent it is, and whether it also sends a text. Settings → Approvals and alerts shows this as a table an
// administrator can change; Today, the sidebar number and text alerts all follow the same rules.
// Safe on the server and in the browser.
import type { StaffRole } from "./shared";

/** How urgent a kind of signal is. Critical (health or safety) is never held by Kinlight: it goes to the care team. */
export type Level = "critical" | "time" | "active" | "passive";
export const LEVELS: { k: Level; label: string; detail: string }[] = [
  { k: "critical", label: "Critical", detail: "Health or safety. Never held by Kinlight: passed straight to the care team." },
  { k: "time", label: "Time-sensitive", detail: "Due within the hour. Texts the person." },
  { k: "active", label: "Active", detail: "Due today or this week. Waits on Today; no text." },
  { k: "passive", label: "Passive", detail: "Good to know. In the Friday summary only." },
];

/** Where a card sits on Today. */
export type Group = "late" | "hour" | "today" | "week";
export const GROUP_LABEL: Record<Group, string> = { late: "Overdue", hour: "Due in the next hour", today: "Today", week: "This week" };

export type SignalKey =
  | "post" | "family-request" | "ask" | "family-member" | "concern" | "review" | "inquiry"
  | "attendance" | "clash" | "few-signups" | "photos" | "idea" | "thanks"
  | "message" | "sales-lead" | "unreachable" | "sent-back" | "import-check"
  | "menu-missing" | "menu-checks" | "dining-request" | "holiday-menu"
  | "page-due" | "price-change" | "tour" | "waitlist" | "promise" | "unseen" | "try-new" | "survey-approve" | "survey-closing" | "survey-results";

export interface SignalRule {
  key: SignalKey;
  /** What staff call it on a card: "To approve", "Take attendance". */
  label: string;
  /** Where it comes from. */
  section: string;
  /** Who gets it. "owner" means the person it's about (whoever led the activity, the page's owner, the concern's owner). */
  to: StaffRole | "owner";
  level: Level;
  /** Also texted, when it's due within the hour. */
  text: boolean;
}

export const SIGNALS: SignalRule[] = [
  { key: "post", label: "To approve", section: "Post", to: "events", level: "time", text: true },
  { key: "review", label: "Ready to review", section: "Newsletter · Menus · Photos", to: "owner", level: "active", text: false },
  { key: "family-request", label: "Family request", section: "Calendar", to: "events", level: "active", text: false },
  { key: "ask", label: "Ask in person", section: "Calendar", to: "events", level: "active", text: false },
  { key: "family-member", label: "New family member", section: "People", to: "events", level: "active", text: false },
  { key: "concern", label: "Concern", section: "Feedback", to: "owner", level: "active", text: false },
  { key: "attendance", label: "Take attendance", section: "Calendar", to: "owner", level: "active", text: false },
  { key: "clash", label: "Room clash", section: "Calendar", to: "events", level: "active", text: false },
  { key: "few-signups", label: "Few sign-ups", section: "Calendar", to: "events", level: "active", text: false },
  { key: "photos", label: "Photos wanted", section: "Calendar", to: "owner", level: "active", text: false },
  { key: "idea", label: "Resident idea", section: "Feedback", to: "events", level: "active", text: false },
  { key: "thanks", label: "A thank-you", section: "Feedback", to: "owner", level: "passive", text: false },
  { key: "message", label: "Message to answer", section: "Communications", to: "owner", level: "active", text: false },
  { key: "unreachable", label: "Can’t reach", section: "Automations", to: "owner", level: "active", text: false },
  { key: "sent-back", label: "Sent back to you", section: "Post", to: "owner", level: "active", text: false },
  { key: "import-check", label: "Import to check", section: "Post", to: "owner", level: "active", text: false },
  { key: "menu-missing", label: "Menu not up", section: "Menus", to: "kitchen", level: "time", text: true },
  { key: "menu-checks", label: "Menu checks", section: "Menus", to: "kitchen", level: "active", text: false },
  { key: "dining-request", label: "Dining request", section: "Menus", to: "kitchen", level: "active", text: false },
  { key: "holiday-menu", label: "Holiday menu", section: "Menus", to: "manager", level: "active", text: false },
  { key: "page-due", label: "Page to update", section: "Website", to: "owner", level: "active", text: false },
  { key: "price-change", label: "Price change", section: "Website", to: "manager", level: "active", text: false },
  { key: "tour", label: "Tours to count", section: "Apartments", to: "desk", level: "active", text: false },
  // Inquiries, moving-in questions and waitlist follow-ups are sales, which is hidden in the alpha.
  // Kinlight's own promise to the community: Kinlight fixes it, so it's in the Friday summary and Reports, not a task.
  { key: "promise", label: "Promise at risk", section: "Reports", to: "manager", level: "passive", text: false },
  { key: "survey-approve", label: "Survey to approve", section: "Surveys", to: "manager", level: "active", text: false },
  { key: "survey-closing", label: "Survey closing, few replies", section: "Surveys", to: "owner", level: "active", text: false },
  { key: "survey-results", label: "Survey results are in", section: "Surveys", to: "owner", level: "passive", text: false },
  { key: "unseen", label: "Haven’t seen lately", section: "People", to: "owner", level: "active", text: false },
  { key: "try-new", label: "Might enjoy", section: "People", to: "owner", level: "active", text: false },
];
export const signalOf = (k: SignalKey) => SIGNALS.find((s) => s.key === k)!;

/** What an administrator changed in Settings, by signal. */
export type RuleChanges = Partial<Record<SignalKey, { to?: StaffRole | "owner"; level?: Level; text?: boolean }>>;
export const ALERTS_COOKIE = "wh-staff-alerts";
export function parseRules(raw?: string | null): RuleChanges {
  if (!raw) return {};
  try { const x = JSON.parse(decodeURIComponent(raw)); return x && typeof x === "object" ? (x as RuleChanges) : {}; } catch { return {}; }
}
/** The rules in force: the defaults with an administrator's changes on top. */
export function rulesWith(changes: RuleChanges): SignalRule[] {
  return SIGNALS.map((s) => ({ ...s, ...changes[s.key] }));
}

/**
 * Which group a card is in. `due` and `now` are minutes from the start of today. Overdue, due within the hour, due
 * before midnight, or due in the next seven days; anything later isn't on Today at all (it isn't due this week).
 */
export function groupOf(due: number, now: number): Group | null {
  if (due < now) return "late";
  if (due - now <= 60) return "hour";
  if (due < 1440) return "today";
  if (due < 7 * 1440) return "week";
  return null;
}
/** The one number: overdue, plus due in the next hour, plus due today. "This week" shows but doesn't count. */
export const counts = (g: Group | null) => g === "late" || g === "hour" || g === "today";

/** "Due in 40 min", "Due by 4:00 pm", "1 day past", "Due Fri". */
export function dueText(due: number, now: number, fmt: (m: number) => string, day: (offset: number) => string): string {
  const d = due - now;
  if (d < 0) {
    const late = -d;
    return late < 60 ? `${late} min past` : late < 1440 ? `${Math.round(late / 60)} h past` : `${Math.floor(late / 1440)} day${late >= 2880 ? "s" : ""} past`;
  }
  if (d <= 60) return `Due in ${Math.max(1, Math.round(d))} min`;
  if (due < 1440) return `Due by ${fmt(due)}`;
  const off = Math.floor(due / 1440);
  return off === 1 ? `Due tomorrow, ${fmt(due % 1440)}` : `Due ${day(off)}`;
}
