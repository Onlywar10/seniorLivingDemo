"use client";

// What staff change in this browser, shared between screens: a concern resolved on Today is resolved in Feedback too,
// and an activity someone said they're leading shows as theirs in Calendar. Kept for this browser tab only
// (sessionStorage), per community. Also the one-word confirmations ("Sent to 14 residents") at the bottom of the
// screen, with Undo where it applies.
import { useEffect, useSyncExternalStore } from "react";
import type { ConcernStatus } from "@/data/staff/engage";
import type { StaffRole } from "@/data/staff/shared";
import type { QLite } from "@/data/staff/lite";
import { counts, groupOf } from "@/data/staff/signals";
import { nowMinutes } from "@/lib/clock";
import { Icon } from "../Icon";
import { useStaffCommunity } from "./StaffCommunity";

export interface ConcernPatch { status?: ConcernStatus; owner?: string; ownerName?: string; log?: string[] }
interface Saved { concerns: Record<string, ConcernPatch>; leaders: Record<string, string> }
interface Toast { id: number; text: string; undo?: () => void }

const KEY = "wh-staff-session";
const empty: Saved = { concerns: {}, leaders: {} };
let saved: Saved = empty;
let loaded = false;
let toastNow: Toast | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) saved = { ...empty, ...JSON.parse(raw) };
  } catch { /* storage is a convenience only */ }
}
function persist(next: Saved) {
  saved = next;
  try { window.sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage is a convenience only */ }
  emit();
}
const getSaved = () => { load(); return saved; };
const getEmpty = () => empty;

/** Changes to family concerns made anywhere in the staff area, for the community on screen. */
export function useConcernPatches() {
  const { scope } = useStaffCommunity();
  const s = useSyncExternalStore(subscribe, getSaved, getEmpty);
  const pre = `${scope}:`;
  return Object.fromEntries(Object.entries(s.concerns).filter(([k]) => k.startsWith(pre)).map(([k, v]) => [k.slice(pre.length), v])) as Record<string, ConcernPatch>;
}
export function usePatchConcern() {
  const { scope } = useStaffCommunity();
  return (id: string, p: ConcernPatch) => {
    const k = `${scope}:${id}`;
    const cur = getSaved().concerns[k] ?? {};
    persist({ ...saved, concerns: { ...saved.concerns, [k]: { ...cur, ...p } } });
  };
}
/** Undo a change to a concern (back to how it was before). */
export function useResetConcern() {
  const { scope } = useStaffCommunity();
  return (id: string, before?: ConcernPatch) => {
    const k = `${scope}:${id}`;
    const next = { ...getSaved().concerns };
    if (before) next[k] = before;
    else delete next[k];
    persist({ ...saved, concerns: next });
  };
}

/** Who is leading each activity ("I'm leading this"), by event id. */
export function useLeaders() {
  const { scope } = useStaffCommunity();
  const s = useSyncExternalStore(subscribe, getSaved, getEmpty);
  const pre = `${scope}:`;
  return Object.fromEntries(Object.entries(s.leaders).filter(([k]) => k.startsWith(pre)).map(([k, v]) => [k.slice(pre.length), v])) as Record<string, string>;
}
export function useSetLeader() {
  const { scope } = useStaffCommunity();
  return (eventId: string, name: string | null) => {
    const next = { ...getSaved().leaders };
    if (name) next[`${scope}:${eventId}`] = name;
    else delete next[`${scope}:${eventId}`];
    persist({ ...saved, leaders: next });
  };
}

/* ------------------------------------------------------------ confirmations */

let seq = 0;
/** A short confirmation at the bottom of the screen ("Approved"), with Undo when there's something to undo. */
export function say(text: string, undo?: () => void) {
  toastNow = { id: ++seq, text, undo };
  emit();
}
const getToast = () => toastNow;
const noToast = () => null;

export function Toaster() {
  const t = useSyncExternalStore(subscribe, getToast, noToast);
  useEffect(() => {
    if (!t) return;
    const id = window.setTimeout(() => { if (toastNow?.id === t.id) { toastNow = null; emit(); } }, t.undo ? 6500 : 3800);
    return () => window.clearTimeout(id);
  }, [t]);
  if (!t) return null;
  return (
    <div className="sx-toast pt-toast" role="status" aria-live="polite" key={t.id}>
      <Icon name="check" />
      <span>{t.text}</span>
      {t.undo && (
        <button type="button" onClick={() => { const u = t.undo; toastNow = null; emit(); u?.(); }}>Undo</button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ approvals decided anywhere */

/** What happened to something waiting for approval. */
export type Decision = "approved" | "declined";

// An approval decided on one screen is decided on every screen: a price change approved in Website leaves Today's
// "Needs you", and one approved on Today leaves Website. Keyed by the Today card's id ("post-a3"), per community.
const DECIDED_KEY = "wh-staff-decided";
const noDecisions: Record<string, Decision> = {};
let decided: Record<string, Decision> = noDecisions;
let decidedLoaded = false;
const getDecided = () => {
  if (!decidedLoaded && typeof window !== "undefined") {
    decidedLoaded = true;
    try {
      const raw = window.sessionStorage.getItem(DECIDED_KEY);
      if (raw) decided = JSON.parse(raw);
    } catch { /* storage is a convenience only */ }
  }
  return decided;
};
const getNoDecisions = () => noDecisions;

/** Approvals decided anywhere in the staff area, for the community on screen, by Today card id. */
export function useDecisions(): Record<string, Decision> {
  const { scope } = useStaffCommunity();
  const all = useSyncExternalStore(subscribe, getDecided, getNoDecisions);
  const pre = `${scope}:`;
  return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(pre)).map(([k, v]) => [k.slice(pre.length), v]));
}
/** Record a decision (or clear it, for Undo) by Today card id. */
export function useDecide() {
  const { scope } = useStaffCommunity();
  return (id: string, d: Decision | null) => {
    const next = { ...getDecided() };
    if (d) next[`${scope}:${id}`] = d;
    else delete next[`${scope}:${id}`];
    decided = next;
    try { window.sessionStorage.setItem(DECIDED_KEY, JSON.stringify(next)); } catch { /* storage is a convenience only */ }
    emit();
  };
}

/* ------------------------------------------------------------ Today: done, snoozed, reassigned */

// What people did with the cards on Today, per community, in this browser: done (with Undo), snoozed until a time,
// or handed to someone else (who then sees it on their Today). Every action is also logged, so Reports can show how
// the queue is used: how many items each person had, how many went overdue, and how many were dismissed unused.
export type MoveKind = "done" | "snoozed" | "reassigned" | "dismissed";
export interface CardMove { done?: boolean; until?: number; to?: StaffRole }
export interface MoveLog { id: string; signal: string; who: StaffRole; kind: MoveKind; at: number; overdue?: boolean }
interface TodayState { moves: Record<string, CardMove>; log: MoveLog[] }
const TODAY_KEY = "wh-staff-today";
const noToday: TodayState = { moves: {}, log: [] };
let todayAll: Record<string, TodayState> = {};
let todayLoaded = false;
const readToday = (scope: string): TodayState => {
  if (!todayLoaded && typeof window !== "undefined") {
    todayLoaded = true;
    try { const raw = window.sessionStorage.getItem(TODAY_KEY); if (raw) todayAll = JSON.parse(raw); } catch { /* storage is a convenience only */ }
  }
  return todayAll[scope] ?? noToday;
};
const writeToday = (scope: string, next: TodayState) => {
  todayAll = { ...todayAll, [scope]: next };
  try { window.sessionStorage.setItem(TODAY_KEY, JSON.stringify(todayAll)); } catch { /* storage is a convenience only */ }
  emit();
};

/** Done, snoozed and reassigned cards for the community on screen. */
export function useTodayState(): TodayState {
  const { scope } = useStaffCommunity();
  return useSyncExternalStore(subscribe, () => readToday(scope), () => noToday);
}
/** Record what someone did with a card. `null` clears it again (Undo). */
export function useMoveCard() {
  const { scope } = useStaffCommunity();
  return (id: string, move: CardMove | null, log?: Omit<MoveLog, "id" | "at">) => {
    const cur = readToday(scope);
    const moves = { ...cur.moves };
    if (move) moves[id] = { ...moves[id], ...move };
    else delete moves[id];
    const entry = log ? [{ ...log, id, at: Date.now() }] : [];
    writeToday(scope, { moves, log: move ? [...cur.log, ...entry] : cur.log.filter((l) => l.id !== id || l.at < Date.now() - 10_000) });
  };
}

/** Is a card on this person's Today right now: theirs (or handed to them), not done, not snoozed. */
export function onToday(q: { id: string; for: StaffRole[] }, as: StaffRole, moves: Record<string, CardMove>, now = Date.now()): boolean {
  const m = moves[q.id];
  if (m?.done) return false;
  if (m?.until && m.until > now) return false;
  return m?.to ? m.to === as : q.for.includes(as);
}

/** The one number: this person's cards that are overdue or due today, after anything done, snoozed or handed on. */
export function useNeedsCount(items: QLite[], as: StaffRole): number {
  const { moves } = useTodayState();
  const now = nowMinutes();
  return items.filter((q) => onToday(q, as, moves) && counts(groupOf(q.due, now))).length;
}
