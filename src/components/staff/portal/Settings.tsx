"use client";

// Settings, for administrators: the team with the preset roles (adjustable per person), invites and removals, the
// approval rules, and the community details everything else reads. Changes stay in this browser.
import { useState } from "react";
import { Icon } from "../../Icon";
import { Avatar, Badge } from "../ui";
import { SECTIONS, STAFF_ROLES, accessFor, accessLabel, presetOf, type Access, type Preset, type Section } from "@/data/staff/shared";

export type { Preset };
export interface TeamMember { key: string; name: string; title: string; preset: Preset; invited: boolean; adjusted?: string }

const PRESETS: Preset[] = ["Poster", "Approver", "Kitchen", "Sales", "Administrator"];
const sectionName: Record<Section, string> = {
  today: "Today", post: "Post", calendar: "Calendar", menus: "Menus", newsletter: "Newsletter", website: "Website",
  people: "People", feedback: "Feedback", prospects: "Prospects", reports: "Reports", settings: "Settings",
};
/** What each preset may open: the Roles table (the same rules the menu uses). */
const presetAccess = Object.fromEntries(
  PRESETS.map((p) => [p, accessFor[STAFF_ROLES.find((r) => presetOf[r] === p) ?? "desk"]]),
) as Record<Preset, Partial<Record<Section, Access>>>;
const presetHelp: Record<Preset, string> = {
  Poster: "Front desk, fitness and other staff: posts, their own events and pages, resident suggestions",
  Approver: "The activities director: approves posts and family requests, People, Newsletter, their reports",
  Kitchen: "Menus and the dining page",
  Sales: "Prospects, apartments and prices, announcements, the prospect numbers",
  Administrator: "The executive director: everything, including Reports and Settings",
};
const an = (p: Preset) => (/^[AEIOU]/.test(p) ? "an" : "a");

export function Team({ people, community }: { people: TeamMember[]; community: string }) {
  const [rows, setRows] = useState(people.map((p) => ({ ...p, can: { ...presetAccess[p.preset] }, removed: false })));
  const [open, setOpen] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [invitePreset, setInvitePreset] = useState<Preset>("Poster");
  const [toast, setToast] = useState("");
  type Row = (typeof rows)[number];
  const set = (key: string, fn: (r: Row) => Row) => setRows((xs) => xs.map((r) => (r.key === key ? fn(r) : r)));
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 3000); };
  const differs = (r: Row) => SECTIONS.some((s) => !!r.can[s] !== !!presetAccess[r.preset][s]);
  return (
    <>
      <ul className="pt-presets">
        {PRESETS.map((p) => <li key={p}><b>{p}</b><small>{presetHelp[p]}</small></li>)}
      </ul>
      <ul className="pt-team">
        {rows.filter((r) => !r.removed).map((r) => {
          const custom = differs(r) || !!r.adjusted;
          return (
            <li key={r.key}>
              <div className="pt-team-row">
                <span className="sx-name"><Avatar who={r.key} size={34} /><span><b>{r.name}</b><small>{r.title}{r.adjusted ? ` · ${r.adjusted}` : ""}</small></span></span>
                {r.invited && <Badge tone="info">Invited</Badge>}
                <label className="pt-team-sel">
                  <span className="vh">Role for {r.name}</span>
                  <select value={r.preset} onChange={(e) => { const p = e.target.value as Preset; set(r.key, (x) => ({ ...x, preset: p, adjusted: undefined, can: { ...presetAccess[p] } })); say(`${r.name} is now ${an(p)} ${p}`); }}>
                    {PRESETS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-expanded={open === r.key} onClick={() => setOpen(open === r.key ? null : r.key)}>{custom ? "Adjusted" : "Adjust"}</button>
              </div>
              {open === r.key && (
                <div className="pt-team-adj">
                  {SECTIONS.map((s) => {
                    const a = r.can[s];
                    return (
                      <label key={s} className="sx-check">
                        <input type="checkbox" checked={!!a} onChange={(e) => set(r.key, (x) => { const n = { ...x.can }; if (e.target.checked) n[s] = presetAccess[x.preset][s] ?? "full"; else delete n[s]; return { ...x, can: n }; })} />
                        {sectionName[s]}{a && a !== "full" ? <small className="st-part"> · {accessLabel[a]}</small> : null}
                      </label>
                    );
                  })}
                  <div className="st-adj-foot">
                    <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { set(r.key, (x) => ({ ...x, adjusted: undefined, can: { ...presetAccess[x.preset] } })); say(`${r.name} is back to the ${r.preset} role`); }}>Reset to {r.preset}</button>
                    <button type="button" className="sx-btn sx-btn-sm st-remove" onClick={() => { set(r.key, (x) => ({ ...x, removed: true })); setOpen(null); say(`${r.name} was removed from ${community}. Their posts stay up.`); }}><Icon name="x" /> Remove from {community}</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {inviting ? (
        <form className="sx-form pt-invite" onSubmit={(e) => { e.preventDefault(); setInviting(false); say(`Invite sent. They join ${community} as ${an(invitePreset)} ${invitePreset}.`); }}>
          <div className="sx-row">
            <label>Name<input required /></label>
            <label>Work email or mobile<input required /></label>
            <label>Role
              <select value={invitePreset} onChange={(e) => setInvitePreset(e.target.value as Preset)}>
                {PRESETS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
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

export function ApprovalRules({ rules, people }: { rules: { what: string; who: string; note?: string }[]; people: { key: string; name: string; role: string }[] }) {
  const [who, setWho] = useState(rules.map((r) => r.who));
  const [saved, setSaved] = useState(false);
  return (
    <div className="pt-rules">
      <ul>
        {rules.map((r, i) => (
          <li key={r.what}>
            <span><b>{r.what}</b>{r.note && <small className="st-note">{r.note}</small>}</span>
            <label>
              <span className="vh">Who approves: {r.what}</span>
              <select value={who[i]} onChange={(e) => { setWho((w) => w.map((x, j) => (j === i ? e.target.value : x))); setSaved(false); }}>
                {people.map((p) => <option key={p.key} value={p.name}>{p.name} · {p.role}</option>)}
                <option value="No approval needed">No approval needed</option>
              </select>
            </label>
          </li>
        ))}
      </ul>
      <div className="pt-act">
        {saved ? <span className="al-done good" role="status"><Icon name="check" /> Saved</span> : <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setSaved(true)}>Save the rules</button>}
        <span className="sx-hint">Everything else goes out as soon as it’s posted. Emergencies and closures always skip approval.</span>
      </div>
    </div>
  );
}

export interface CommunityFacts {
  name: string; phone: string; address: string;
  hours: { label: string; value: string }[];
  restaurants: { name: string; kind: string; hours: string }[];
  rooms: string[];
  care: { name: string; note?: string }[];
}

/** The community's details: name, phone, hours, restaurants, rooms and care areas. Everything else reads these. */
export function CommunityDetails({ facts }: { facts: CommunityFacts }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState(facts);
  const [saved, setSaved] = useState(false);
  const field = (label: string, value: string, on: (v: string) => void) =>
    edit ? <input aria-label={label} value={value} onChange={(e) => on(e.target.value)} /> : <span>{value}</span>;
  return (
    <div className="st-facts">
      <dl className="st-dl">
        <div><dt>Name</dt><dd>{f.name}</dd></div>
        <div><dt>Main phone</dt><dd>{field("Main phone", f.phone, (v) => setF({ ...f, phone: v }))}</dd></div>
        <div><dt>Address</dt><dd>{f.address}</dd></div>
        {f.hours.map((h, i) => (
          <div key={h.label}><dt>{h.label}</dt><dd>{field(`${h.label} hours`, h.value, (v) => setF({ ...f, hours: f.hours.map((x, j) => (j === i ? { ...x, value: v } : x)) }))}</dd></div>
        ))}
      </dl>
      <h3 className="st-h">Restaurants</h3>
      <ul className="st-rest">
        {f.restaurants.map((r, i) => (
          <li key={r.name}>
            <span><b>{r.name}</b><small>{r.kind}</small></span>
            <span className="st-rest-h">{field(`${r.name} hours`, r.hours, (v) => setF({ ...f, restaurants: f.restaurants.map((x, j) => (j === i ? { ...x, hours: v } : x)) }))}</span>
          </li>
        ))}
      </ul>
      <h3 className="st-h">Care areas</h3>
      <ul className="st-chips">
        {f.care.map((c) => <li key={c.name}>{c.name}{c.note && <small> · {c.note}</small>}</li>)}
      </ul>
      <h3 className="st-h">Rooms</h3>
      <ul className="st-chips">
        {f.rooms.map((r) => <li key={r}>{r}</li>)}
      </ul>
      <div className="pt-act">
        {edit ? (
          <>
            <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { setEdit(false); setSaved(true); }}><Icon name="check" /> Save</button>
            <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setF(facts); setEdit(false); }}>Cancel</button>
          </>
        ) : saved ? (
          <span className="al-done good" role="status"><Icon name="check" /> Saved. The website, texts, flyers and AI answers use it from now on.</span>
        ) : (
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(true)}><Icon name="edit" /> Change phone or hours</button>
        )}
      </div>
    </div>
  );
}
