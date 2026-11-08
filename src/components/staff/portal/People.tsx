"use client";

// People: each resident's record (their own messages, photo consent, what they share with family) and their family
// list, with each person's status and access. Invite, re-send, verify and remove are one tap. Changes stay in this browser.
import { useMemo, useState } from "react";
import type { Access, FamilyMember, FamilyStatus, ResidentRecord } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { Badge, Initials } from "../ui";

type Filter = "all" | "lantern" | "lang" | "nophoto" | "notjoined";
const statusTone: Record<FamilyStatus, "good" | "info" | "warn" | "neutral"> = { Joined: "good", Invited: "info", "Waiting for a check": "warn", Stopped: "neutral" };
const first = (n = "") => n.split(" ")[0];

export function People({ records, total }: { records: ResidentRecord[]; total: number }) {
  const [list, setList] = useState(records);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(records[0]?.name ?? null);
  const [toast, setToast] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter((r) => {
      if (s && !`${r.name} ${r.apt} ${r.family.map((m) => m.name).join(" ")}`.toLowerCase().includes(s)) return false;
      if (f === "lantern") return r.lantern;
      if (f === "lang") return r.lang !== "English" || r.family.some((m) => m.lang !== "English");
      if (f === "nophoto") return !r.photoConsent;
      if (f === "notjoined") return r.family.some((m) => m.status === "Invited" || m.status === "Waiting for a check");
      return true;
    });
  }, [q, f, list]);

  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 3200); };
  const patch = (name: string, fn: (r: ResidentRecord) => ResidentRecord) => setList((xs) => xs.map((r) => (r.name === name ? fn(r) : r)));
  const patchMember = (res: string, who: string, m: Partial<FamilyMember> | null) =>
    patch(res, (r) => ({ ...r, family: m === null ? r.family.filter((x) => x.name !== who) : r.family.map((x) => (x.name === who ? { ...x, ...m } : x)) }));

  return (
    <div className="pt-people">
      <div className="sx-card sx-card-body pt-people-bar">
        <label className="sx-form pt-search">
          <span className="vh">Search residents and family</span>
          <input className="sx-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or apartment" />
        </label>
        <div className="sx-chips" role="group" aria-label="Show">
          {([["all", "Everyone"], ["lantern", "Lantern"], ["lang", "Other languages"], ["nophoto", "No photo consent"], ["notjoined", "Not yet joined"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
        <p className="sx-hint" aria-live="polite">Showing {rows.length} of {list.length} recently updated residents · {total} in all</p>
      </div>

      <ul className="pt-res-list">
        {rows.map((r) => {
          const isOpen = open === r.name;
          const waiting = r.family.filter((m) => m.status === "Waiting for a check").length;
          return (
            <li key={r.name} className={`pt-res${isOpen ? " open" : ""}`}>
              <button type="button" className="pt-res-h" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.name)}>
                <Initials name={r.name} size={40} color={r.lantern ? "var(--c-lantern, #8a5aa6)" : "var(--slate, #4c5b66)"} />
                <span className="pt-res-t">
                  <b>{r.name}</b>
                  <small>Apt {r.apt}{r.lantern ? " · Lantern" : ""} · {r.family.length} family {r.family.length === 1 ? "member" : "members"}</small>
                </span>
                <span className="pt-res-b">
                  {!r.photoConsent && <Badge tone="bad">No photo consent</Badge>}
                  {waiting > 0 && <Badge tone="warn">{waiting} to check</Badge>}
                </span>
                <Icon name="chev" />
              </button>
              {isOpen && (
                <div className="pt-res-body">
                  <dl className="pt-res-dl">
                    <div><dt>Their own messages</dt><dd>{r.channel}{r.channel !== "Print only" ? ` · ${r.lang}` : ""}<small>{r.channel === "Print only" ? "Large print at the door and the front desk" : "What’s on, their bookings, and family who want to join them"}</small></dd></div>
                    <div><dt>Photo consent</dt><dd><span>{r.photoConsent ? <><Icon name="check" /> On file</> : <><Icon name="alert" /> None on file</>}</span><small>{r.photoConsent ? "Photos with them can be posted" : "Posts with them are blocked until they’re cropped out"}</small></dd></div>
                    <div>
                      <dt>Shares with family</dt>
                      <dd>
                        <label className="sx-switch">
                          <input type="checkbox" checked={r.shares} onChange={(e) => { patch(r.name, (x) => ({ ...x, shares: e.target.checked, family: x.family.map((m) => ({ ...m, access: (e.target.checked && m.status === "Joined" ? "Their resident" : "Community news") as Access })) })); say(e.target.checked ? `${first(r.name)}’s week is shared with their family again` : `${first(r.name)}’s week is no longer shared. Family keep the community news.`); }} />
                          {r.shares ? "Their week and photos" : "Community news only"}
                        </label>
                        <small>{first(r.name)} decides; they can turn it off by text or by telling staff.</small>
                      </dd>
                    </div>
                  </dl>

                  <h3>Family</h3>
                  <ul className="pt-fam">
                    {r.family.map((m) => (
                      <li key={m.name}>
                        <span className="pt-fam-t">
                          <b>{m.name}</b>
                          <small>{m.relation} · {m.channel} · {m.lang}</small>
                          {m.note && <small>{m.note}</small>}
                        </span>
                        <span className="pt-fam-s">
                          <Badge tone={statusTone[m.status]}>{m.status}</Badge>
                          <small>{m.access}</small>
                        </span>
                        <span className="pt-fam-a">
                          {m.status === "Waiting for a check" && <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { patchMember(r.name, m.name, { status: "Joined", access: r.shares ? "Their resident" : "Community news", note: undefined }); say(`${m.name} verified. They now hear about ${first(r.name)}.`); }}><Icon name="check" /> Verify</button>}
                          {m.status === "Invited" && <button type="button" className="sx-btn sx-btn-sm" onClick={() => say(`Invite sent again to ${m.name}. That’s the last reminder.`)}>Re-send invite</button>}
                          <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { patchMember(r.name, m.name, null); say(`${m.name} removed. They get nothing more from us.`); }}>Remove</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Invite onInvite={(m) => { patch(r.name, (x) => ({ ...x, family: [...x.family, m] })); say(`Invite sent to ${m.name} by ${m.channel.toLowerCase()}. One reminder in a few days, then it stops.`); }} resident={r} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </div>
  );
}

function Invite({ resident, onInvite }: { resident: ResidentRecord; onInvite: (m: FamilyMember) => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", relation: "Daughter", phone: "", email: "", lang: "English" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  if (!open)
    return (
      <button type="button" className="sx-btn" onClick={() => setOpen(true)}>
        <Icon name="plus" /> Invite a family member
      </button>
    );
  return (
    <form
      className="sx-form pt-invite"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name || (!f.phone && !f.email)) return;
        onInvite({ name: f.name, relation: f.relation, channel: f.phone && f.email ? "Text and email" : f.phone ? "Text" : "Email", lang: f.lang, status: "Invited", access: resident.shares ? "Their resident" : "Community news", phone: f.phone, email: f.email, note: "Invited just now" });
        setOpen(false);
        setF({ name: "", relation: "Daughter", phone: "", email: "", lang: "English" });
      }}
    >
      <p className="sx-hint">They get one invite (“{resident.name.split(" ")[0]}’s community would like to send you news. Reply YES to join.”), one reminder, then it stops.</p>
      <div className="sx-row">
        <label>Name<input value={f.name} onChange={set("name")} required /></label>
        <label>Relationship<select value={f.relation} onChange={set("relation")}>{["Daughter", "Son", "Wife", "Husband", "Granddaughter", "Grandson", "Niece", "Nephew", "Friend"].map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="sx-row3">
        <label>Mobile<input type="tel" value={f.phone} onChange={set("phone")} /></label>
        <label>Email<input type="email" value={f.email} onChange={set("email")} /></label>
        <label>Language<select value={f.lang} onChange={set("lang")}>{["English", "Spanish", "Chinese", "Russian", "Tagalog", "Vietnamese"].map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="pt-act">
        <button type="submit" className="sx-btn sx-btn-primary"><Icon name="send" /> Send invite</button>
        <button type="button" className="sx-btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
