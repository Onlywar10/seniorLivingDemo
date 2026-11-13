"use client";

// Automations, as changed in this browser: which automations are off (who, when and why), the record of every change,
// problems marked done, sends held back from the next 24 hours, a pause for a bad day, the administrator's sending
// rules, and wording waiting for approval. Kept for this browser tab only (sessionStorage), per community, like the
// rest of the staff area. The sidebar's problem count reads it too.
import { useSyncExternalStore } from "react";
import type { ChangeRecord } from "@/data/staff/automations";
import { useStaffCommunity } from "./StaffCommunity";

export interface OffMark { by: string; at: string; reason: string }
export interface Wording { text: string; by: string; at: string; status: "waiting" | "approved"; approvedBy?: string; approvedAt?: string }
export interface Pause { by: string; at: string; reason: string; until: string }
export interface Rules { quietFrom: number; quietTo: number; perDay: number }
export interface AutoState {
  off: Record<string, OffMark>;
  /** Turned back on after being off in the sample data, or by someone here. */
  on: Record<string, OffMark>;
  changes: ChangeRecord[];
  done: Record<string, string>;
  held: Record<string, string>;
  pause: Pause | null;
  rules: Rules;
  wording: Record<string, Wording>;
}
export const DEFAULT_RULES: Rules = { quietFrom: 20 * 60, quietTo: 8 * 60, perDay: 3 };
const EMPTY: AutoState = { off: {}, on: {}, changes: [], done: {}, held: {}, pause: null, rules: DEFAULT_RULES, wording: {} };

const KEY = "wh-staff-automations";
let all: Record<string, AutoState> = {};
let loaded = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
const emit = () => subs.forEach((f) => f());

function read(scope: string): AutoState {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try { const raw = window.sessionStorage.getItem(KEY); if (raw) all = JSON.parse(raw); } catch { /* storage is a convenience only */ }
  }
  return all[scope] ?? EMPTY;
}
function write(scope: string, next: AutoState) {
  all = { ...all, [scope]: next };
  try { window.sessionStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage is a convenience only */ }
  emit();
}

/** Everything changed in Automations for the community on screen. */
export function useAuto(): AutoState {
  const { scope } = useStaffCommunity();
  return useSyncExternalStore(subscribe, () => read(scope), () => EMPTY);
}

/** "Nov 12, 3:40 pm" for the record. */
export function stampNow() {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
  return parts.replace(" AM", " am").replace(" PM", " pm");
}

/** Changes to Automations, each one recorded: who did it, when, and why. */
export function useAutoActions(me: string) {
  const { scope } = useStaffCommunity();
  const cur = () => read(scope);
  const rec = (r: Omit<ChangeRecord, "id" | "by" | "at">): ChangeRecord => ({ id: `c-${Date.now()}-${Math.round(Math.random() * 1e4)}`, by: me, at: stampNow(), ...r });
  return {
    turnOff(auto: string, reason: string) {
      const s = cur();
      const on = { ...s.on };
      delete on[auto];
      write(scope, { ...s, on, off: { ...s.off, [auto]: { by: me, at: stampNow(), reason } }, changes: [rec({ auto, did: "off", reason }), ...s.changes] });
    },
    turnOn(auto: string) {
      const s = cur();
      const off = { ...s.off };
      delete off[auto];
      write(scope, { ...s, off, on: { ...s.on, [auto]: { by: me, at: stampNow(), reason: "" } }, changes: [rec({ auto, did: "on" }), ...s.changes] });
    },
    /** Put things back exactly as they were (Undo). */
    restore(before: AutoState) { write(scope, before); },
    snapshot: () => cur(),
    done(id: string, what: string) { const s = cur(); write(scope, { ...s, done: { ...s.done, [id]: what } }); },
    undone(id: string) { const s = cur(); const done = { ...s.done }; delete done[id]; write(scope, { ...s, done }); },
    hold(id: string, auto: string, what: string) { const s = cur(); write(scope, { ...s, held: { ...s.held, [id]: me }, changes: [rec({ auto, did: "off", reason: `Held one send: ${what}` }), ...s.changes] }); },
    release(id: string) { const s = cur(); const held = { ...s.held }; delete held[id]; write(scope, { ...s, held }); },
    pause(reason: string, until: string) { const s = cur(); write(scope, { ...s, pause: { by: me, at: stampNow(), reason, until }, changes: [rec({ auto: "", did: "pause", reason, note: `Until ${until}` }), ...s.changes] }); },
    resume() { const s = cur(); write(scope, { ...s, pause: null, changes: [rec({ auto: "", did: "resume", note: "Everything sending again" }), ...s.changes] }); },
    setRules(rules: Rules, note: string) { const s = cur(); write(scope, { ...s, rules, changes: [rec({ auto: "", did: "rules", note }), ...s.changes] }); },
    /** New wording: an approver's own change applies at once; anyone else's goes to the approver first. */
    saveWording(auto: string, text: string, approver: boolean, approverFirst: string) {
      const s = cur();
      const w: Wording = approver ? { text, by: me, at: stampNow(), status: "approved", approvedBy: me, approvedAt: stampNow() } : { text, by: me, at: stampNow(), status: "waiting" };
      write(scope, { ...s, wording: { ...s.wording, [auto]: w }, changes: [rec({ auto, did: "wording", note: approver ? "Approved at once (you approve wording)" : `Sent to ${approverFirst} to approve` }), ...s.changes] });
    },
    approveWording(auto: string) {
      const s = cur();
      const w = s.wording[auto];
      if (!w) return;
      write(scope, { ...s, wording: { ...s.wording, [auto]: { ...w, status: "approved", approvedBy: me, approvedAt: stampNow() } }, changes: [rec({ auto, did: "wording", note: `Approved ${w.by.split(" ")[0]}’s wording` }), ...s.changes] });
    },
    /** Something done elsewhere that stops messages (a resident removed in People), kept in the same record. */
    record(r: Omit<ChangeRecord, "id" | "by" | "at">) { const s = cur(); write(scope, { ...s, changes: [rec(r), ...s.changes] }); },
    dropWording(auto: string) { const s = cur(); const wording = { ...s.wording }; delete wording[auto]; write(scope, { ...s, wording }); },
  };
}

/** The sidebar number: problems for this person not yet marked done here. */
export function useProblemCount(ids: string[]): number {
  const s = useAuto();
  return ids.filter((id) => !s.done[id]).length;
}
