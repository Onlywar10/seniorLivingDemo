"use client";

// People: every resident, A to Z by last name, with filters and a search that also finds family members. Each row
// opens the resident's own page (/staff/people/[name]). Also exports the family invite form and the welcome
// checklist, which the resident page uses.
import Link from "next/link";
import { useMemo, useState } from "react";
import { residentHref } from "../residentHref";
import type { Engagement, Interest, Welcome, WelcomeStep } from "@/data/staff/engage";
import type { FamilyMember, ResidentRecord } from "@/data/staff/portal";
import { Icon } from "../../Icon";
import { Badge, Initials } from "../ui";
import { Help } from "./Help";
import { useRemoved } from "../removedStore";

type Filter = "all" | "new" | "notseen" | "lantern" | "lang" | "nophoto" | "notjoined";
const first = (n = "") => n.split(" ")[0];
const lastOf = (n = "") => n.split(" ").slice(-1)[0];

export function People({ records, total, eng, welcomes, interests, initial }: {
  records: ResidentRecord[]; total: number; eng: Record<string, Engagement>; welcomes: Welcome[]; interests: readonly Interest[]; me: string; community: string; initial?: string;
}) {
  const [list] = useState(() => [...records].sort((a, b) => lastOf(a.name).localeCompare(lastOf(b.name)) || a.name.localeCompare(b.name)));
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filter>(initial && welcomes.some((w) => w.name === initial) ? "new" : "all");
  const [interest, setInterest] = useState<string>("");
  // Residents removed in this browser (passed away, moved out) leave the list; a move to another care area doesn't.
  const removed = useRemoved();
  const engOf = (n: string): Engagement | undefined => eng[n];
  const welcomeOf = (n: string) => welcomes.find((w) => w.name === n);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list.filter((r) => {
      if (removed[r.name] && removed[r.name].why !== "moved-area") return false;
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
  }, [q, f, list, interest, eng, welcomes, removed]);

  return (
    <div className="pt-people">
      <div className="sx-card sx-card-body pt-people-bar">
        <label className="sx-form pt-search">
          <span className="vh">Search residents and family</span>
          <input className="sx-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a resident, family member or apartment" />
        </label>
        <div className="sx-chips" role="group" aria-label="Show">
          {([["all", "Everyone"], ["new", "New this week"], ["notseen", "Haven’t been out in 2 weeks"], ["lantern", "Lantern"], ["lang", "Other languages"], ["nophoto", "No photo consent"], ["notjoined", "Not yet joined"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>
          ))}
        </div>
        <div className="pe-bar-foot">
          <label className="sx-form pt-int-filter">
            <span>Interest</span>
            <select value={interest} onChange={(e) => setInterest(e.target.value)}>
              <option value="">Any</option>
              {interests.map((i) => <option key={i}>{i}</option>)}
            </select>
          </label>
          <p className="sx-hint" aria-live="polite">{rows.length} of {list.length} · A–Z by last name · {total} residents in all</p>
        </div>
      </div>

      <ul className="pt-res-list">
        {rows.map((r) => {
          const waiting = r.family.filter((m) => m.status === "Waiting for a check").length;
          const e = engOf(r.name);
          const w = welcomeOf(r.name);
          const s = q.trim().toLowerCase();
          // A search that matched a family member says who, so staff see which resident they belong to.
          const famHit = s && !r.name.toLowerCase().includes(s) ? r.family.find((m) => m.name.toLowerCase().includes(s)) : undefined;
          // At most two flags on a row, most important first.
          const flags = [
            w && <Badge key="new" tone="accent">New</Badge>,
            !r.photoConsent && <Badge key="photo" tone="bad">No photo consent</Badge>,
            waiting > 0 && <Badge key="check" tone="warn">{waiting} to check</Badge>,
            e && e.lastDays >= 14 && <Badge key="out" tone="warn">Not out in {e.lastDays} days</Badge>,
          ].filter(Boolean).slice(0, 2);
          return (
            <li key={r.name} className="pt-res">
              <Link className="pt-res-h" href={residentHref(r.name)}>
                <Initials name={r.name} size={40} color={r.lantern ? "var(--c-lantern, #8a5aa6)" : "var(--slate, #4c5b66)"} />
                <span className="pt-res-t">
                  <b>{r.name}</b>
                  <small>{famHit ? <>Family: <mark>{famHit.name}</mark> ({famHit.relation.toLowerCase()})</> : <>{r.lantern ? r.apt : `Apt ${r.apt}`} · {r.family.length} family{e ? ` · ${e.last30} activities in 30 days` : ""}</>}</small>
                </span>
                <span className="pt-res-b">{flags}</span>
                <Icon name="right" />
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && <li className="pt-empty">Nobody matches. Try a first name, a family member or an apartment.</li>}
      </ul>
    </div>
  );
}

export function Invite({ resident, onInvite }: { resident: ResidentRecord; onInvite: (m: FamilyMember) => void }) {
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
      <div className="pe-form-h">
        <b>Invite a family member</b>
        <Help label="What they receive"><p>One text or email: “{first(resident.name)}’s community would like to send you news. Reply YES to join.”</p><p>One reminder, then it stops.</p></Help>
      </div>
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
export function WelcomeChecklist({ w, r, interests, community, celebrate, onCelebrate, onDone }: {
  w: Welcome; r: ResidentRecord; interests: readonly Interest[]; community: string; celebrate: boolean; onCelebrate: (yes: boolean) => void; onDone: (msg: string) => void;
}) {
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
  // The consent step also asks whether they're happy to be celebrated: it decides the welcome post.
  const label = (x: WelcomeStep) => (x.k === "consent" ? "Photo consent, sharing and celebrations" : x.label);
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
              <span><b>{label(x)}</b><small>{x.done ? "Done" : x.detail}</small></span>
            </button>
            {open === x.k && !x.done && (
              <div className="pt-wbody">
                {x.k === "messages" && <><p>By <b>{r.channel.toLowerCase()}</b>, in {r.lang}.</p><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k)}>Confirm</button></>}
                {x.k === "interests" && (
                  <>
                    <p>What does {first(w.name)} enjoy?</p>
                    <div className="sx-chips" role="group" aria-label="Interests">
                      {interests.map((i) => <button key={i} type="button" aria-pressed={chosen.includes(i)} onClick={() => setChosen((c) => (c.includes(i) ? c.filter((y) => y !== i) : [...c, i]))}>{i}</button>)}
                    </div>
                    <div className="pt-act">
                      <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!chosen.length} onClick={() => finish(x.k, `Interests saved. ${first(w.name)} will get personal invites for ${chosen.join(", ").toLowerCase()}.`)}>Save interests</button>
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(null)}>Later</button>
                    </div>
                  </>
                )}
                {x.k === "consent" && (
                  <>
                    <p>From the move-in paperwork: photo consent <b>on file</b>; shares their week and photos with verified family.</p>
                    <div className="pe-ask">
                      <span>Happy to be celebrated?</span>
                      <span className="sx-seg" role="group" aria-label={`Is ${first(w.name)} happy to be celebrated?`}>
                        <button type="button" aria-pressed={celebrate} onClick={() => onCelebrate(true)}>Yes</button>
                        <button type="button" aria-pressed={!celebrate} onClick={() => onCelebrate(false)}>No</button>
                      </span>
                      <Help label="About celebrations"><p>Birthday and welcome posts only go out for residents who say yes. No age is ever shared.</p></Help>
                    </div>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k)}>Confirm</button>
                  </>
                )}
                {x.k === "family" && (
                  <>
                    <div className="pe-form-h">From the move-in contacts <Help label="What they receive"><p>“{first(w.name)}’s community would like to send you news. Reply YES to join.” One reminder, then it stops.</p></Help></div>
                    <ul className="pt-wfam">{moveIn.map((n) => <li key={n}><Icon name={sent ? "check" : "users"} /> {n} {sent && <small>Invited</small>}</li>)}</ul>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { setSent(true); finish(x.k, `Invites sent to ${moveIn.join(" and ")}.`); }}><Icon name="send" /> Send {moveIn.length} invites</button>
                  </>
                )}
                {x.k === "post" && (celebrate ? (
                  <>
                    <p className="pt-chg-line"><Icon name="spark" /> “Please welcome {first(w.name)} to the {w.floor}! Say hello at lunch.”</p>
                    <div className="pe-form-h sx-hint"><Icon name="check" /> Consent checked <Help label="Where it goes"><p>First name and floor only. Goes to the website, the newsletter and the lobby notice at {community}.</p></Help></div>
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => finish(x.k, "Welcome post published.")}><Icon name="send" /> Post the welcome</button>
                  </>
                ) : (
                  <>
                    <p>No welcome post: {first(w.name)} would rather not be celebrated.</p>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => finish(x.k)}>Skip the post</button>
                  </>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
