"use client";

// Settings → Approvals and alerts: one table that decides, for every kind of thing that can need a person, who it
// goes to, how urgent it is (which decides where it lands on Today) and whether it also sends a text. Today, the menu
// number and text alerts all read these rules. Saved for this browser in a cookie, so the staff area follows them at
// once.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ALERTS_COOKIE, LEVELS, SIGNALS, type Level, type RuleChanges, type SignalRule } from "@/data/staff/signals";
import type { StaffRole } from "@/data/staff/shared";
import { Icon } from "../../Icon";
import { say } from "../store";

const landsIn: Record<Level, string> = {
  critical: "The care team, never Today",
  time: "Next hour, then Overdue",
  active: "Today or This week, by its deadline",
  passive: "Friday summary only",
};

export function SignalRules({ rules, names }: { rules: SignalRule[]; names: Record<StaffRole, string> }) {
  const router = useRouter();
  const [cur, setCur] = useState<SignalRule[]>(rules);
  const [dirty, setDirty] = useState(false);
  const set = (k: SignalRule["key"], patch: Partial<SignalRule>) => { setCur((xs) => xs.map((x) => (x.key === k ? { ...x, ...patch } : x))); setDirty(true); };
  const save = (next: SignalRule[]) => {
    const changes: RuleChanges = {};
    for (const r of next) {
      const d = SIGNALS.find((x) => x.key === r.key)!;
      const c: RuleChanges[keyof RuleChanges] = {};
      if (r.to !== d.to) c!.to = r.to;
      if (r.level !== d.level) c!.level = r.level;
      if (r.text !== d.text) c!.text = r.text;
      if (Object.keys(c!).length) changes[r.key] = c;
    }
    document.cookie = `${ALERTS_COOKIE}=${encodeURIComponent(JSON.stringify(changes))}; path=/; max-age=31536000; samesite=lax`;
    setDirty(false);
    say(Object.keys(changes).length ? "Saved. Today and text alerts follow the new rules." : "Saved: the usual rules.");
    router.refresh();
  };
  const roles = Object.keys(names) as StaffRole[];
  const changed = cur.filter((r) => { const d = SIGNALS.find((x) => x.key === r.key)!; return r.to !== d.to || r.level !== d.level || r.text !== d.text; }).length;

  return (
    <div className="sr">
      <ul className="sr-levels" aria-label="Urgency levels">
        {LEVELS.map((l) => <li key={l.k} className={`sr-l-${l.k}`}><b>{l.label}</b><span>{l.detail}</span></li>)}
      </ul>
      <div className="sx-table-wrap">
        <table className="sx-table sr-table">
          <thead>
            <tr><th>What</th><th>Goes to</th><th>Urgency</th><th>Lands on Today</th><th className="al-c">Text them</th></tr>
          </thead>
          <tbody>
            {cur.map((r) => (
              <tr key={r.key}>
                <td><b>{r.label}</b><small>{r.section}</small></td>
                <td>
                  <label className="vh" htmlFor={`sr-to-${r.key}`}>{r.label}: goes to</label>
                  <select id={`sr-to-${r.key}`} value={r.to} onChange={(e) => set(r.key, { to: e.target.value as SignalRule["to"] })}>
                    <option value="owner">Whoever it’s about</option>
                    {roles.map((x) => <option key={x} value={x}>{names[x]}</option>)}
                  </select>
                </td>
                <td>
                  <label className="vh" htmlFor={`sr-lv-${r.key}`}>{r.label}: urgency</label>
                  <select id={`sr-lv-${r.key}`} value={r.level} onChange={(e) => { const level = e.target.value as Level; set(r.key, { level, text: level === "time" }); }}>
                    {LEVELS.filter((l) => l.k !== "critical").map((l) => <option key={l.k} value={l.k}>{l.label}</option>)}
                  </select>
                </td>
                <td className="sr-lands">{landsIn[r.level]}</td>
                <td className="al-c">
                  <label className="sx-switch">
                    <input type="checkbox" checked={r.text} disabled={r.level !== "time"} onChange={(e) => set(r.key, { text: e.target.checked })} aria-label={`${r.label}: text when it’s due within the hour`} />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sx-hint sr-note"><Icon name="alert" /> Health and safety are never held here: they go straight to the care team, by its own system.</p>
      <div className="at-foot">
        {changed > 0 && <button type="button" className="sx-link" onClick={() => { setCur(SIGNALS); save(SIGNALS); }}>Back to the usual rules</button>}
        <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!dirty} onClick={() => save(cur)}><Icon name="check" /> Save</button>
      </div>
    </div>
  );
}
