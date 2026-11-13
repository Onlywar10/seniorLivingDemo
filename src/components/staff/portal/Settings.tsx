"use client";

// Settings, for administrators: the team with the preset roles (adjustable per person), invites and removals, the
// approval rules, the community details everything else reads, and exporting all the community’s data. Changes stay
// in this browser.
import { useState, type ReactNode } from "react";
import { ACTIVITY_CATEGORIES } from "@/data/shared";
import { Icon } from "../../Icon";
import { Avatar, Badge } from "../ui";
import { Help } from "./Help";
import { SECTIONS, STAFF_ROLES, accessFor, accessLabel, presetOf, type Access, type Preset, type Section } from "@/data/staff/shared";

export type { Preset };
export interface TeamMember { key: string; name: string; title: string; preset: Preset; invited: boolean; adjusted?: string }

const PRESETS: Preset[] = ["Poster", "Front desk", "Approver", "Kitchen", "Administrator", "Caregiver"];
const sectionName: Record<Section, string> = {
  today: "Today", messages: "Communications", automations: "Automations", post: "Post", calendar: "Calendar", menus: "Menus", newsletter: "Newsletter", website: "Website",
  people: "People", feedback: "Feedback", surveys: "Surveys", prospects: "Prospects", reports: "Reports", settings: "Settings",
};
/** What each preset may open: the Roles table (the same rules the menu uses). */
const presetAccess = Object.fromEntries(
  PRESETS.map((p) => [p, accessFor[STAFF_ROLES.find((r) => presetOf[r] === p) ?? "desk"]]),
) as Record<Preset, Partial<Record<Section, Access>>>;
const presetHelp: Record<Preset, string> = {
  Poster: "Fitness and other staff: posts, their own events and pages, resident suggestions",
  "Front desk": "Posts, visits and dining requests, their own pages, and Apartments: which floor plans are open, the waitlist and tours",
  Approver: "The activities director: approves posts and family requests, People, Newsletter, their reports",
  Kitchen: "Menus and the dining page",
  Sales: "Prospects, apartments and prices, announcements, the prospect numbers",
  Administrator: "The executive director: everything, including Reports and Settings",
  "Lantern lead": "The Lantern team lead: Lantern residents and families, the Lantern calendar, asking in person",
  Caregiver: "Care partners, with “Who looks after whom” on: Today and People, for their own residents only. Nothing clinical",
};
const an = (p: Preset) => (/^[AEIOU]/.test(p) ? "an" : "a");

/** The five preset roles, behind the Team card’s "?". */
export function PresetHelp() {
  return (
    <Help label="The preset roles" align="end">
      <ul>{PRESETS.map((p) => <li key={p}><b>{p}:</b> {presetHelp[p]}</li>)}</ul>
      <p>Adjust one person if they need more or less.</p>
    </Help>
  );
}

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

export function ApprovalRules({ rules, people }: { rules: { what: string; who: string; note?: string }[]; people: { key: string; name: string; role: string; approves?: boolean }[] }) {
  // People whose role can approve come first; everyone else is further down.
  const can = people.filter((p) => p.approves);
  const rest = people.filter((p) => !p.approves);
  const [who, setWho] = useState(rules.map((r) => r.who));
  const [saved, setSaved] = useState(false);
  return (
    <div className="pt-rules">
      <ul>
        {rules.map((r, i) => (
          <li key={r.what}>
            <span><b>{r.what}</b></span>
            <label>
              <span className="vh">Who approves: {r.what}</span>
              <select value={who[i]} onChange={(e) => { setWho((w) => w.map((x, j) => (j === i ? e.target.value : x))); setSaved(false); }}>
                <optgroup label="Can approve">{can.map((p) => <option key={p.key} value={p.name}>{p.name} · {p.role}</option>)}</optgroup>
                <optgroup label="Give approval to someone else">{rest.map((p) => <option key={p.key} value={p.name}>{p.name} · {p.role}</option>)}</optgroup>
                <option value="No approval needed">No approval needed</option>
              </select>
            </label>
          </li>
        ))}
      </ul>
      <div className="pt-act">
        {saved ? <span className="al-done good" role="status"><Icon name="check" /> Saved</span> : <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setSaved(true)}>Save the rules</button>}
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
      <h3 className="st-h">Care levels</h3>
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
          <span className="al-done good" role="status"><Icon name="check" /> Saved everywhere</span>
        ) : (
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(true)}><Icon name="edit" /> Change phone or hours</button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ export all your data */

const EXPORT_PARTS = ["Residents", "Families", "Events", "Attendance", "Photos", "Messages", "Menus", "Pages"] as const;

/** One download with everything: a CSV for each kind of record, with the photos, in one ZIP. */
export function ExportData({ community }: { community: string }) {
  const [format, setFormat] = useState<"zip" | "csv">("zip");
  const [state, setState] = useState<"idle" | "busy" | "ready">("idle");
  const file = `${community.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${format === "zip" ? "export" : "export-csv"}.zip`;
  return (
    <div className="st-export">
      <ul className="st-chips" aria-label="Included">
        {EXPORT_PARTS.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <div className="sx-seg" role="group" aria-label="Format">
        <button type="button" aria-pressed={format === "zip"} onClick={() => { setFormat("zip"); setState("idle"); }}>ZIP with photos</button>
        <button type="button" aria-pressed={format === "csv"} onClick={() => { setFormat("csv"); setState("idle"); }}>CSV files only</button>
      </div>
      <div className="pt-act">
        {state === "ready" ? (
          <>
            <span className="al-done good" role="status"><Icon name="check" /> Your export is ready</span>
            <button type="button" className="sx-btn sx-btn-sm"><Icon name="download" /> {file}</button>
          </>
        ) : (
          <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" disabled={state === "busy"} onClick={() => { setState("busy"); window.setTimeout(() => setState("ready"), 1200); }}>
            <Icon name="download" /> {state === "busy" ? "Preparing…" : "Export everything"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ tabs, so the page isn't one long scroll */

export function SettingsTabs({ tabs }: { tabs: { k: string; label: string; node: ReactNode }[] }) {
  const [k, setK] = useState(tabs[0].k);
  return (
    <>
      <nav className="rs-tabs st-tabs" aria-label="Settings">
        {tabs.map((t) => <button key={t.k} type="button" aria-current={k === t.k ? "page" : undefined} onClick={() => setK(t.k)}>{t.label}</button>)}
      </nav>
      {tabs.map((t) => <div key={t.k} hidden={k !== t.k} className="st-panel">{t.node}</div>)}
    </>
  );
}

/* ------------------------------------------------------------ floors and areas, and activity categories: set once */

/** The community's floors, wings and neighbourhoods. Events, announcements and "Who looks after whom" all use them. */
export function AreaList({ areas }: { areas: { name: string; note: string }[] }) {
  const [list, setList] = useState(areas);
  const [name, setName] = useState("");
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 2600); };
  return (
    <div className="st-list">
      <ul>
        {list.map((a) => (
          <li key={a.name}>
            <span><b>{a.name}</b><small>{a.note}</small></span>
            <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setList((x) => x.filter((y) => y !== a)); say(`${a.name} removed. Events for it now say “All residents”.`); }}>Remove</button>
          </li>
        ))}
      </ul>
      <form className="st-add" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; setList((x) => [...x, { name: name.trim(), note: "Added just now" }]); setName(""); say("Added. It’s now in the event form, announcements and Who looks after whom."); }}>
        <label><span className="vh">New floor or area</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fourth floor, East wing…" /></label>
        <button type="submit" className="sx-btn sx-btn-sm" disabled={!name.trim()}><Icon name="plus" /> Add</button>
      </form>
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </div>
  );
}

/** The kinds of activity, used in the event form, the activity sheet and Reports. */
export function ActivityCategories() {
  const [list, setList] = useState<string[]>([...ACTIVITY_CATEGORIES]);
  const [name, setName] = useState("");
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 2600); };
  return (
    <div className="st-list">
      <ul className="st-cats">
        {list.map((c) => (
          <li key={c}>
            <span>{c}</span>
            <button type="button" className="sx-x" aria-label={`Remove ${c}`} onClick={() => { setList((x) => x.filter((y) => y !== c)); say(`${c} removed. Its activities keep their history in Reports.`); }}><Icon name="x" /></button>
          </li>
        ))}
      </ul>
      <form className="st-add" onSubmit={(e) => { e.preventDefault(); const n = name.trim(); if (!n || list.includes(n)) return; setList((x) => [...x, n]); setName(""); say(`${n} added to the event form and Reports.`); }}>
        <label><span className="vh">New category</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Intergenerational, Spiritual care…" /></label>
        <button type="submit" className="sx-btn sx-btn-sm" disabled={!name.trim()}><Icon name="plus" /> Add</button>
      </form>
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </div>
  );
}
