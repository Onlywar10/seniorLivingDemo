"use client";

// Residents removed (or moved to another care area) in this browser: why, when, who did it, and what was chosen for
// each family contact. People hides removed residents; their page shows the record. This browser tab only
// (sessionStorage), per community.
import { useSyncExternalStore } from "react";
import { useStaffCommunity } from "./StaffCommunity";

export type Why = "passed" | "moved-out" | "moved-area";
export type FamilyChoice = "news" | "stop" | "gentle";
export interface Removal {
  name: string; why: Why; when: string; by: string; at: string; area?: string;
  family: { name: string; choice: FamilyChoice; message?: string; status?: "waiting" | "sent" }[];
}
const KEY = "wh-staff-removed";
const EMPTY: Record<string, Removal> = {};
let all: Record<string, Record<string, Removal>> = {};
let loaded = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
function read(scope: string) {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try { const raw = window.sessionStorage.getItem(KEY); if (raw) all = JSON.parse(raw); } catch { /* storage is a convenience only */ }
  }
  return all[scope] ?? EMPTY;
}
function write(scope: string, next: Record<string, Removal>) {
  all = { ...all, [scope]: next };
  try { window.sessionStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage is a convenience only */ }
  subs.forEach((f) => f());
}

export function useRemoved(): Record<string, Removal> {
  const { scope } = useStaffCommunity();
  return useSyncExternalStore(subscribe, () => read(scope), () => EMPTY);
}
export function useRemove() {
  const { scope } = useStaffCommunity();
  return {
    set(r: Removal) { write(scope, { ...read(scope), [r.name]: r }); },
    undo(name: string) { const n = { ...read(scope) }; delete n[name]; write(scope, n); },
  };
}
