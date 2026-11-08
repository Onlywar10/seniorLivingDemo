"use client";

// Settings, for administrators: the team with simple preset roles (adjustable per person), and the approval rules.
// Changes stay in this browser.
import { useState } from "react";
import { Icon } from "../../Icon";
import { Avatar, Badge } from "../ui";

export type Preset = "Poster" | "Approver" | "Sales" | "Administrator";
export interface TeamMember { key: string; name: string; title: string; preset: Preset; invited: boolean }

const abilities = ["Post", "Calendar and menus", "Take attendance", "Approve family requests", "Family contacts", "Prospects", "Approve posts", "Reports", "Settings"] as const;
type Ability = (typeof abilities)[number];
const presetAbilities: Record<Preset, Ability[]> = {
  Poster: ["Post", "Calendar and menus", "Take attendance"],
  Approver: ["Post", "Calendar and menus", "Take attendance", "Approve family requests", "Family contacts"],
  Sales: ["Post", "Prospects"],
  Administrator: [...abilities],
};
const presetHelp: Record<Preset, string> = {
  Poster: "Posts, keeps the calendar and menus, takes attendance",
  Approver: "Also approves family requests and looks after family contacts",
  Sales: "Posts, and handles inquiries, tours and the waitlist",
  Administrator: "Everything, including approving posts, reports and settings",
};

export function Team({ people, community }: { people: TeamMember[]; community: string }) {
  const [rows, setRows] = useState(people.map((p) => ({ ...p, can: new Set<Ability>(presetAbilities[p.preset]) })));
  const [open, setOpen] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState("");
  const set = (key: string, fn: (r: (typeof rows)[number]) => (typeof rows)[number]) => setRows((xs) => xs.map((r) => (r.key === key ? fn(r) : r)));
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 3000); };
  return (
    <>
      <ul className="pt-presets">
        {(Object.keys(presetHelp) as Preset[]).map((p) => <li key={p}><b>{p}</b><small>{presetHelp[p]}</small></li>)}
      </ul>
      <ul className="pt-team">
        {rows.map((r) => {
          const custom = r.can.size !== presetAbilities[r.preset].length || presetAbilities[r.preset].some((a) => !r.can.has(a));
          return (
            <li key={r.key}>
              <div className="pt-team-row">
                <span className="sx-name"><Avatar who={r.key} size={34} /><span><b>{r.name}</b><small>{r.title}</small></span></span>
                {r.invited && <Badge tone="info">Invited</Badge>}
                <label className="pt-team-sel">
                  <span className="vh">Role for {r.name}</span>
                  <select value={r.preset} onChange={(e) => { const p = e.target.value as Preset; set(r.key, (x) => ({ ...x, preset: p, can: new Set(presetAbilities[p]) })); say(`${r.name} is now ${p === "Administrator" ? "an" : "a"} ${p}`); }}>
                    {(Object.keys(presetHelp) as Preset[]).map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>{custom ? "Adjusted" : "Adjust"}</button>
              </div>
              {open === r.key && (
                <div className="pt-team-adj">
                  {abilities.map((a) => (
                    <label key={a} className="sx-check">
                      <input type="checkbox" checked={r.can.has(a)} onChange={(e) => set(r.key, (x) => { const n = new Set(x.can); if (e.target.checked) n.add(a); else n.delete(a); return { ...x, can: n }; })} /> {a}
                    </label>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {inviting ? (
        <form className="sx-form pt-invite" onSubmit={(e) => { e.preventDefault(); setInviting(false); say(`Invite sent. They join ${community} as a Poster.`); }}>
          <div className="sx-row">
            <label>Name<input required /></label>
            <label>Work email<input type="email" required /></label>
          </div>
          <div className="pt-act">
            <button type="submit" className="sx-btn sx-btn-primary"><Icon name="send" /> Send invite</button>
            <button type="button" className="sx-btn" onClick={() => setInviting(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="sx-btn" onClick={() => setInviting(true)}><Icon name="plus" /> Invite someone</button>
      )}
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </>
  );
}

export function ApprovalRules({ rules, people }: { rules: { what: string; who: string }[]; people: { key: string; name: string }[] }) {
  const [who, setWho] = useState(rules.map((r) => r.who));
  const [saved, setSaved] = useState(false);
  return (
    <div className="pt-rules">
      <ul>
        {rules.map((r, i) => (
          <li key={r.what}>
            <b>{r.what}</b>
            <label>
              <span className="vh">Who approves: {r.what}</span>
              <select value={who[i]} onChange={(e) => { setWho((w) => w.map((x, j) => (j === i ? e.target.value : x))); setSaved(false); }}>
                <option value={r.who}>{r.who}</option>
                {people.filter((p) => p.name !== r.who).map((p) => <option key={p.key} value={p.name}>{p.name}</option>)}
                <option value="No approval needed">No approval needed</option>
              </select>
            </label>
          </li>
        ))}
      </ul>
      <div className="pt-act">
        {saved ? <span className="al-done good" role="status"><Icon name="check" /> Saved</span> : <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setSaved(true)}>Save the rules</button>}
        <span className="sx-hint">Emergencies and closures always skip approval.</span>
      </div>
    </div>
  );
}
