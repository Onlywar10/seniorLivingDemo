"use client";

// Surveys, as changed in this browser: surveys made here (drafts, ones sent to the approver, scheduled or sent),
// what happened to the sample surveys (approved, a reminder sent, the closing date moved, closed early), paper and
// read-aloud answers added, and templates saved. This browser tab only (sessionStorage), per community.
import { useSyncExternalStore } from "react";
import type { Area, Audience, Question } from "@/data/staff/surveyKit";
import type { L } from "@/data/staff/autoText";
import { useStaffCommunity } from "./StaffCommunity";

export interface MadeSurvey {
  id: string; title: string; questions: Question[]; topic: L; area: Area; audience: Audience[]; audienceLabel: string; count: string;
  anonymous: boolean; closes: string; thankYou: string; timing: string; reminder: boolean;
  status: "draft" | "waiting" | "scheduled" | "open" | "repeating" | "automatic";
  by: string; at: string; from: string;
}
export interface Patch { status?: string; closesLabel?: string; reminders?: number; approvedBy?: string; added?: { paper: number; aloud: number }; log?: string[] }
interface State { made: MadeSurvey[]; patches: Record<string, Patch>; templates: { id: string; name: string; by: string; questions: Question[]; area: Area; audience: Audience[]; topic: L }[] }
const EMPTY: State = { made: [], patches: {}, templates: [] };
const KEY = "wh-staff-surveys";
let all: Record<string, State> = {};
let loaded = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => subs.delete(f); };
function read(scope: string): State {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    try { const raw = window.sessionStorage.getItem(KEY); if (raw) all = JSON.parse(raw); } catch { /* storage is a convenience only */ }
  }
  return all[scope] ?? EMPTY;
}
function write(scope: string, next: State) {
  all = { ...all, [scope]: next };
  try { window.sessionStorage.setItem(KEY, JSON.stringify(all)); } catch { /* storage is a convenience only */ }
  subs.forEach((f) => f());
}

export function useSurveys(): State {
  const { scope } = useStaffCommunity();
  return useSyncExternalStore(subscribe, () => read(scope), () => EMPTY);
}
export function useSurveyActions() {
  const { scope } = useStaffCommunity();
  const cur = () => read(scope);
  const patch = (id: string, p: Patch) => { const s = cur(); const was = s.patches[id] ?? {}; write(scope, { ...s, patches: { ...s.patches, [id]: { ...was, ...p, log: [...(was.log ?? []), ...(p.log ?? [])] } } }); };
  return {
    patch,
    add(m: MadeSurvey) { const s = cur(); write(scope, { ...s, made: [m, ...s.made.filter((x) => x.id !== m.id)] }); },
    update(id: string, p: Partial<MadeSurvey>) { const s = cur(); write(scope, { ...s, made: s.made.map((x) => (x.id === id ? { ...x, ...p } : x)) }); },
    remove(id: string) { const s = cur(); write(scope, { ...s, made: s.made.filter((x) => x.id !== id) }); },
    saveTemplate(t: State["templates"][number]) { const s = cur(); write(scope, { ...s, templates: [t, ...s.templates.filter((x) => x.id !== t.id)] }); },
    snapshot: cur,
    restore(s: State) { write(scope, s); },
  };
}
