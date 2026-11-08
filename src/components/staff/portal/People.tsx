"use client";

// People: each resident's record (their own messages, interests, life story, participation, photo consent, what they
// share with family, legal representative) and their family list, with each person's status and access. Invite,
// re-send, verify and remove are one tap. New residents get a guided welcome checklist. Changes stay in this browser.
import { useMemo, useState } from "react";
import type { Engagement, Interest, Welcome, WelcomeStep } from "@/data/staff/engage";
import type { Access, FamilyMember, FamilyStatus, ResidentRecord } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { Badge, Initials } from "../ui";

type Filter = "all" | "new" | "notseen" | "lantern" | "lang" | "nophoto" | "notjoined";
const statusTone: Record<FamilyStatus, "good" | "info" | "warn" | "neutral"> = { Joined: "good", Invited: "info", "Waiting for a check": "warn", Stopped: "neutral" };
const first = (n = "") => n.split(" ")[0];

export function People({ records, total, eng, welcomes, interests, me, community, initial }: {
  records: ResidentRecord[]; total: number; eng: Record<string, Engagement>; welcomes: Welcome[]; interests: readonly Interest[]; me: string; community: string; initial?: string;
}) {
  const [list, setList] = useState(records);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>(initial && welcomes.some((w) => w.name === initial) ? "new" : "all");
  const [interest, setInterest] = useState<string>("");
  const [open, setOpen] = useState<string | null>(initial ?? records[0]?.name ?? null);
  const [extra, setExtra] = useState<Record<string, Partial<Engagement>>>({});
  const engOf = (n: string): Engagement | undefined => (eng[n] ? { ...eng[n], ...extra[n] } : undefined);
  const welcomeOf = (n: string) => welcomes.find((w) => w.name === n);
  const [toast, setToast] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter((r) => {
      if (s && !`${r.name} ${r.apt} ${r.family.map((m) => m.name).join(" ")}`.toLowerCase().includes(s)) return false;
      if (interest && !(eng[r.name]?.interests ?? []).includes(interest as Interest)) return false;
      if (f === "new") return welcomes.some((w) => w.name === r.name);
      if (f === "notseen") return (eng[r.name]?.lastDays ?? 0) >= 14;
      if (f === "lantern") return r.lantern;
      if (f === "lang") return r.lang !== "English" || r.family.some((m) => m.lang !== "English");
      if (f === "nophoto") return !r.photoConsent;
      if (f === "notjoined") return r.family.some((m) => m.status === "Invited" || m.status === "Waiting for a check");
      return true;
    });
  }, [q, f, list, interest, eng, welcomes]);

  // A search that hides the open record opens the first match instead.
  const shownOpen = open !== null && q.trim() && !rows.some((r) => r.name === open) ? rows[0]?.name ?? null : open;
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
          {([["all", "Everyone"], ["new", "New this week"], ["notseen", "Haven’t been out in 2 weeks"], ["lantern", "Lantern"], ["lang", "Other languages"], ["nophoto", "No photo consent"], ["notjoined", "Not yet joined"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
        <label className="sx-form pt-int-filter">
          <span>Interest</span>
          <select value={interest} onChange={(e) => setInterest(e.target.value)}>
            <option value="">Any</option>
            {interests.map((i) => <option key={i}>{i}</option>)}
          </select>
        </label>
        <p className="sx-hint" aria-live="polite">Showing {rows.length} of {list.length} recently updated residents · {total} in all</p>
      </div>

      <ul className="pt-res-list">
        {rows.map((r) => {
          const isOpen = shownOpen === r.name;
          const waiting = r.family.filter((m) => m.status === "Waiting for a check").length;
          const e = engOf(r.name);
          const w = welcomeOf(r.name);
          return (
            <li key={r.name} className={`pt-res${isOpen ? " open" : ""}`}>
              <button type="button" className="pt-res-h" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.name)}>
                <Initials name={r.name} size={40} color={r.lantern ? "var(--c-lantern, #8a5aa6)" : "var(--slate, #4c5b66)"} />
                <span className="pt-res-t">
                  <b>{r.name}</b>
                  <small>Apt {r.apt}{r.lantern ? " · Lantern" : ""} · {r.family.length} family {r.family.length === 1 ? "member" : "members"}</small>
                </span>
                <span className="pt-res-b">
                  {w && <Badge tone="accent">New: welcome to finish</Badge>}
                  {e && e.lastDays >= 14 && <Badge tone="warn">Not out in {e.lastDays} days</Badge>}
                  {!r.photoConsent && <Badge tone="bad">No photo consent</Badge>}
                  {waiting > 0 && <Badge tone="warn">{waiting} to check</Badge>}
                </span>
                <Icon name="chev" />
              </button>
              {isOpen && (
                <div className="pt-res-body">
                  {w && <WelcomeChecklist w={w} r={r} interests={interests} community={community} onDone={(msg) => say(msg)} />}
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
                    {e && (
                      <>
                        <div>
                          <dt>Interests</dt>
                          <dd>
                            <span className="pt-ints">{e.interests.length ? e.interests.map((i) => <span key={i}>{i}</span>) : "Not asked yet"}</span>
                            <small>Personal invites go out for matching events: {e.invites.sent} in the last 30 days, {e.invites.yes} said yes.</small>
                          </dd>
                        </div>
                        <div>
                          <dt>Participation</dt>
                          <dd>
                            {e.last30} {e.last30 === 1 ? "activity" : "activities"} in the last 30 days
                            <small>Last came: {e.lastLabel}{e.lastDays < 60 && e.last30 ? `, to ${e.lastActivity}` : ""}. {e.visits.length ? `${e.visits.length} 1:1 visit${e.visits.length === 1 ? "" : "s"}: ${e.visits.map((v) => `${v.date} with ${first(v.by)} (${v.note.toLowerCase()})`).join("; ")}.` : "No 1:1 visits logged."}</small>
                            <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setExtra((x) => ({ ...x, [r.name]: { visits: [...e.visits, { date: "Today", by: me, note: "Visit logged" }] } })); say(`1:1 visit with ${first(r.name)} logged. Counted in Reports.`); }}>Log a 1:1 visit</button>
                          </dd>
                        </div>
                        <div>
                          <dt>Legal representative</dt>
                          <dd>{e.legalRep ? `${e.legalRep.name}, ${e.legalRep.relation.toLowerCase()}` : "None"}<small>{e.legalRep ? `Asked about family requests and consent for ${first(r.name)}.` : `${first(r.name)} decides for themselves.`}</small></dd>
                        </div>
                        <div className="pt-story">
                          <dt>Life story <Badge tone="neutral">Private</Badge></dt>
                          <dd><span>{e.story}</span><small>Written with {first(r.name)}. For conversation, activity ideas and 1:1 visits. Never published or sent.</small></dd>
                        </div>
                      </>
                    )}
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

/** Welcoming a new resident: one guided checklist, so nothing depends on memory. Stays on Today until it's finished. */
function WelcomeChecklist({ w, r, interests, community, onDone }: { w: Welcome; r: ResidentRecord; interests: readonly Interest[]; community: string; onDone: (msg: string) => void }) {
  const [steps, setSteps] = useState<WelcomeStep[]>(w.steps);
  const [open, setOpen] = useState<WelcomeStep["k"] | null>(w.steps.find((x) => !x.done)?.k ?? null);
  const [chosen, setChosen] = useState<Interest[]>([]);
  const [sent, setSent] = useState(false);
  const left = steps.filter((x) => !x.done).length;
  const finish = (k: WelcomeStep["k"], msg?: string) => {
    const next = steps.map((x) => (x.k === k ? { ...x, done: true } : x));
    setSteps(next);
    const n = next.find((x) => !x.done);
    setOpen(n?.k ?? null);
    if (!n) onDone(`${first(w.name)}’s welcome is finished. Removed from Today.`);
    else if (msg) onDone(msg);
  };
  const lastN = w.name.split(" ").slice(-1)[0];
  const moveIn = [`${["Carol", "Daniel", "Lisa"][w.name.length % 3]} ${lastN}`, `${["Mark", "Anne", "Ruth"][w.apt.length % 3]} ${lastN}`];
  return (
    <section className="pt-welcome" aria-label={`Welcome checklist for ${w.name}`}>
      <header>
        <b>Welcome {first(w.name)}</b>
        <small>Moved in {w.movedIn} · {left ? `${left} of ${steps.length} left` : "All done"}</small>
      </header>
      <ol>
        {steps.map((x, i) => (
          <li key={x.k} className={x.done ? "done" : open === x.k ? "open" : ""}>
            <button type="button" className="pt-wstep" aria-expanded={open === x.k} onClick={() => setOpen(open === x.k ? null : x.k)}>
              <span className="pt-wnum" aria-hidden="true">{x.done ? <Icon name="check" /> : i + 1}</span>
              <span><b>{x.label}</b><small>{x.done ? "Done" : x.detail}</small></span>
            </button>
            {open === x.k && !x.done && (
              <div className="pt-wbody">
                {x.k === "messages" && <><p>{first(w.name)} gets what’s on, reminders and invites by <b>{r.channel.toLowerCase()}</b>, in {r.lang}.</p><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k)}>Confirm</button></>}
                {x.k === "interests" && (
                  <>
                    <p>Ask {first(w.name)} what they enjoy. Personal invites to matching events start straight away.</p>
                    <div className="sx-chips" role="group" aria-label="Interests">
                      {interests.map((i) => <button key={i} type="button" aria-pressed={chosen.includes(i)} onClick={() => setChosen((c) => (c.includes(i) ? c.filter((y) => y !== i) : [...c, i]))}>{i}</button>)}
                    </div>
                    <div className="pt-act">
                      <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!chosen.length} onClick={() => finish(x.k, `Interests saved. ${first(w.name)} will get personal invites for ${chosen.join(", ").toLowerCase()}.`)}>Save interests</button>
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(null)}>Later</button>
                    </div>
                  </>
                )}
                {x.k === "consent" && <><p>From the move-in paperwork: photo consent <b>on file</b>, and {first(w.name)} <b>shares their week and photos</b> with verified family.</p><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k)}>Confirm</button></>}
                {x.k === "rep" && <><p>Does someone decide for {first(w.name)}? Most residents decide for themselves.</p><div className="pt-act"><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k)}>No one: they decide</button></div></>}
                {x.k === "family" && (
                  <>
                    <p>From the move-in contacts. Each person gets the invite text: “{first(w.name)}’s community would like to send you news. Reply YES to join.” One reminder, then it stops.</p>
                    <ul className="pt-wfam">{moveIn.map((n) => <li key={n}><Icon name={sent ? "check" : "users"} /> {n} {sent && <small>Invited</small>}</li>)}</ul>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { setSent(true); finish(x.k, `Invites sent to ${moveIn.join(" and ")}.`); }}><Icon name="send" /> Send {moveIn.length} invites</button>
                  </>
                )}
                {x.k === "post" && (
                  <>
                    <p className="pt-chg-line"><Icon name="spark" /> “Please welcome {first(w.name)} to the {w.floor}! Say hello at lunch.”</p>
                    <p className="sx-hint"><Icon name="check" /> Consent checked: first name and floor only. Goes to the website, the newsletter and the lobby notice at {community}.</p>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k, "Welcome post published.")}><Icon name="send" /> Post the welcome</button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
