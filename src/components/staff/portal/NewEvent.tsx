"use client";

// One way to create an event: Post's "New event" and Calendar's "+ Add" both open this form. Staff give the title, day
// and time, one-off or repeating, who it's for, seats if limited, the room and matching interests; Kinlight writes the
// description from those facts only, and then shows everything it did: the website calendar, the printed calendar, a
// flyer, personal invites to residents with matching interests, reminders, the newsletter and Google for public events.
// Room clashes are flagged. Saved in this browser only.
import Link from "next/link";
import { useState } from "react";
import { eventKindLabel, type Cat, type EventKind } from "@/data/shared";
import type { Interest } from "@/data/staff/engage";
import type { Busy, IdeaPrefill, NewEventSetup } from "@/data/staff/post";
import { addDays, dayName, fmtRange, fmtTime, fromIso, iso, monthName, shortDate } from "@/lib/clock";
import { Icon } from "../../Icon";
import { Phone, SmsThread } from "../../phone/Phone";
import { useStaffCommunity } from "../StaffCommunity";

export interface EventPrefill { title?: string; date?: string; time?: string; minutes?: number; kind?: EventKind; cap?: number; repeat?: boolean; room?: string; cat?: Cat; interests?: Interest[] }
export interface SavedEvent {
  id: string; title: string; date: string; start: number; end: number; room: string; kind: EventKind; cat: Cat;
  cap?: number; repeat: boolean; lantern: boolean; interests: Interest[]; desc: string; cost?: string;
  /** The resident whose idea it was. */
  idea?: string;
  /** Waiting for the approver (it has a price). */
  approval: boolean;
}

const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const first = (n = "") => n.split(" ")[0];
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const shortTime = (m: number) => fmtTime(m).replace(":00", "");

/** The interests an event matches, from its title (the same rules Kinlight uses on the calendar). */
export function interestsFromTitle(title: string): Interest[] {
  const t = title.toLowerCase();
  const out: Interest[] = [];
  if (/yoga|fit|stretch|balance|walk|tai chi|exercise|dance/.test(t)) out.push("Fitness");
  if (/bridge|bingo|cards|mahjong|poker|canasta|trivia|game/.test(t)) out.push("Cards and games");
  if (/music|concert|choir|sing|piano|jazz|band|hymn/.test(t)) out.push("Music");
  if (/trip|tour|bus|outing|lights|museum|shopping/.test(t)) out.push("Outings");
  if (/paint|craft|knit|art|pumpkin|wreath|clay|card making/.test(t)) out.push("Crafts");
  if (/garden|flower|plant|orchard/.test(t)) out.push("Gardening");
  if (/cook|bak|chef|tasting|wine|tea|fish fry|breakfast/.test(t)) out.push("Cooking");
  if (/lecture|talk|class|book|history|learn|lesson|video call/.test(t)) out.push("Learning");
  if (/movie|film|cine|matinee/.test(t)) out.push("Movies");
  if (/faith|mass|church|worship|bible|rosary|chapel/.test(t)) out.push("Faith");
  return out.filter((x, i, a) => a.indexOf(x) === i).slice(0, 2);
}
const catOf = (ints: Interest[], lantern: boolean): Cat => {
  if (lantern) return "lantern";
  const m: Partial<Record<Interest, Cat>> = { Fitness: "fitness", Faith: "faith", "Cards and games": "clubs", Outings: "trips", Music: "music", Movies: "movies" };
  return ints.map((i) => m[i]).find(Boolean) ?? "community";
};

/** The newsletter goes out on Sundays at 5 pm with the week ahead. */
function newsletterFor(dateIso: string, todayIso: string) {
  const t = fromIso(todayIso);
  const next = addDays(t, (7 - t.getUTCDay()) % 7 || 7);
  const d = fromIso(dateIso);
  if (d <= next) return { ok: false, line: `Too soon for Sunday’s newsletter (${shortDate(next)}): residents and families hear by text instead, and it’s in the newsletter’s look back at the week.` };
  const sun = addDays(d, -(d.getUTCDay() || 7));
  return { ok: true, line: `In the newsletter on Sunday, ${shortDate(sun)}, under the week ahead.` };
}

export interface Effect { icon: "globe" | "printer" | "doc" | "sms" | "bell" | "mail" | "pin" | "heart" | "clock" | "users"; title: string; detail: string; wait?: boolean }

/** Everything Kinlight does with a new event, in plain words. */
function effectsOf(o: { title: string; date: string; start: number; kind: EventKind; repeat: boolean; lantern: boolean; cap?: number; interests: Interest[]; invited: string[]; sample: string; idea?: IdeaPrefill; approval: boolean; setup: NewEventSetup }): Effect[] {
  const { setup } = o;
  const d = fromIso(o.date);
  const out: Effect[] = [];
  if (o.approval) out.push({ icon: "clock", title: `Waits for ${setup.approver.first}`, detail: `It has a price, so ${setup.approver.first} approves it first (one tap from a text). Everything below happens the moment it’s approved.`, wait: true });
  out.push({
    icon: "globe", title: "Website calendar",
    detail: o.kind === "resident" ? "Name, day, time and description only. Seats and the room stay with staff." : o.kind === "family" ? "Name, day, time, place and description. Families RSVP by replying to their text." : "Full details and a sign-up form. Each sign-up reaches sales as an inquiry.",
  });
  out.push({ icon: "printer", title: "Printed calendar", detail: `Added to the large-print ${monthName(d)} calendar${o.repeat ? `, every ${dayName(d)}` : ""}.` });
  out.push({ icon: "doc", title: "Flyer", detail: "A large-print flyer, ready to print at the front desk." });
  if (o.lantern) out.push({ icon: "users", title: "Lantern residents", detail: "Not texted. The care team invites them in person." });
  else if (o.invited.length) out.push({ icon: "sms", title: `Personal invites to ${o.invited.length} residents`, detail: `Residents who like ${andList(o.interests.map((i) => i.toLowerCase()))}, ${sendWhen(o.date, setup.todayIso)}. “${o.sample}”` });
  else out.push({ icon: "sms", title: "Personal invites", detail: o.interests.length ? "No resident has chosen these interests yet, so nobody gets a personal invite." : "Pick an interest above to invite the residents who chose it." });
  if (o.kind === "family") out.push({ icon: "sms", title: `Invite to ${setup.families} families`, detail: "They reply with how many are coming; each resident says yes first, then the approver confirms." });
  out.push({ icon: "bell", title: "Reminders", detail: `Everyone who books gets a reminder at ${fmtTime(Math.max(8 * 60 + 30, o.start - 60))} on the day${o.cap ? `; if the ${o.cap} seats fill, a waitlist starts and the next person is texted when a seat opens` : ""}.` });
  const nl = newsletterFor(o.date, setup.todayIso);
  out.push({ icon: "mail", title: "Newsletter", detail: nl.line });
  if (o.kind === "public") out.push({ icon: "pin", title: "Google", detail: "Posted to the Google Business Profile, on Search and Maps until the day." });
  if (o.idea) out.push({ icon: "heart", title: o.idea.who ? `${first(o.idea.who)} is told` : "From a resident’s idea", detail: o.idea.who ? `We’ll tell ${o.idea.who}: “Your idea made the calendar!”` : "There’s no name on the slip, so there’s nobody to tell. It’s marked as a resident idea." });
  return out;
}
function sendWhen(dateIso: string, todayIso: string) {
  const days = Math.round((fromIso(dateIso).getTime() - fromIso(todayIso).getTime()) / 86400000);
  if (days <= 1) return "sent now";
  const d = addDays(fromIso(dateIso), -2);
  return `sent ${dayName(d)} at 8:30 am`;
}

export function NewEvent({ setup, prefill = {}, idea, inDrawer = false, extraBusy = [], onSaved, onAnother }: { setup: NewEventSetup; prefill?: EventPrefill; idea?: IdeaPrefill; inDrawer?: boolean; extraBusy?: Busy[]; onSaved?: (e: SavedEvent) => void; onAnother?: () => void }) {
  const { site } = useStaffCommunity();
  const tomorrow = iso(addDays(fromIso(setup.todayIso), 1));
  const initTitle = prefill.title ?? idea?.title ?? "";
  const [f, setF] = useState({
    title: initTitle, date: prefill.date ?? tomorrow, time: prefill.time ?? "14:00", end: hhmm(toMin(prefill.time ?? "14:00") + (prefill.minutes ?? 60)),
    room: prefill.room ?? setup.rooms.find((r) => /club|activity|living/i.test(r)) ?? setup.rooms[0], cap: prefill.cap ? String(prefill.cap) : "", cost: "",
  });
  const [kind, setKind] = useState<EventKind>(prefill.kind ?? "resident");
  const [repeat, setRepeat] = useState(!!prefill.repeat);
  const [lantern, setLantern] = useState(false);
  const [ints, setInts] = useState<Interest[] | null>(prefill.interests ?? null);
  const [desc, setDesc] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [saved, setSaved] = useState<SavedEvent | null>(null);

  const start = toMin(f.time), end = Math.max(toMin(f.end), start + 15);
  const d = fromIso(f.date || tomorrow);
  const interests = ints ?? interestsFromTitle(f.title);
  const cap = Number(f.cap) || undefined;
  const set = (k: keyof typeof f) => (ev: { target: { value: string } }) => setF({ ...f, [k]: ev.target.value });
  const toggleInt = (i: Interest) => setInts(interests.includes(i) ? interests.filter((x) => x !== i) : [...interests, i]);

  // Room clashes: the same room at an overlapping time, on that day (or on any later week, if it repeats).
  const clash = setup.shared.includes(f.room) ? undefined
    : [...setup.busy, ...extraBusy].find((b) => b.room === f.room && start < b.end && end > b.start && (b.date === f.date || (repeat && b.date > f.date && fromIso(b.date).getUTCDay() === d.getUTCDay())));

  // What Kinlight writes, from the facts entered and nothing else.
  const when = repeat ? `every ${dayName(d)} at ${fmtTime(start)}` : `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}, at ${fmtTime(start)}`;
  const place = f.room === "All floors" ? "on every floor" : `in the ${f.room.replace(/^The /, "")}`;
  const likes = andList(interests.map((i) => i.toLowerCase()));
  const written = !f.title ? "" :
    kind === "resident" ? `${f.title}, ${when}.${likes ? ` For residents who enjoy ${likes}.` : ""}${cap ? " Sign up at the front desk, or reply YES to your invite." : ""}${f.cost ? ` Cost: ${f.cost}.` : ""}` :
    kind === "family" ? `${f.title}, ${when}, ${place}. Families are welcome: reply to your text or email with how many are coming.${f.cost ? ` Cost: ${f.cost}.` : ""}` :
    `${f.title} at ${setup.brand.name}, ${when}, ${place}. Open to everyone: sign up on this page.${f.cost ? ` Cost: ${f.cost}.` : ""}`;
  const text = desc ?? written;

  const invited = lantern ? [] : setup.invitees.filter((r) => r.interests.some((x) => interests.includes(x))).map((r) => r.name);
  const isToday = f.date === setup.todayIso;
  const short = f.title.replace(/^Bus Trip: /, "") || "Your event";
  const sampleWhen = repeat ? `every ${dayName(d)}` : isToday ? (start >= 17 * 60 ? "tonight" : "today") : dayName(d);
  const sample = `${short} ${sampleWhen} at ${shortTime(start)}, ${first(invited[0] ?? "Dorothy")}. ${cap ? "Want a seat?" : "Want to come?"} Reply YES.`;
  const approval = !!f.cost.trim() && !setup.isApprover;
  const effects = effectsOf({ title: f.title, date: f.date, start, kind, repeat, lantern, cap, interests, invited, sample, idea, approval, setup });
  const blocked = !!clash && !share;

  const save = () => {
    if (!f.title || blocked) return;
    const e: SavedEvent = { id: `new-${f.date}-${start}-${f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, title: f.title, date: f.date, start, end, room: f.room, kind, cat: catOf(interests, lantern), cap, repeat, lantern, interests, desc: text, cost: f.cost || undefined, idea: idea?.who ?? (idea ? "a resident" : undefined), approval };
    setSaved(e);
    onSaved?.(e);
    if (!inDrawer) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (saved) {
    const sd = fromIso(saved.date);
    return (
      <div className={inDrawer ? "went po-done" : "sx-card sx-card-body went pt-went po-done"}>
        <div className="went-head">
          <Icon name={saved.approval ? "clock" : "check"} />
          <div>
            <h2>{saved.approval ? `Sent to ${setup.approver.first}` : `${saved.title} is on the calendar`}</h2>
            <p className="pt-went-line">{dayName(sd)}, {monthName(sd)} {sd.getUTCDate()} · {fmtRange(saved.start, saved.end)} · {saved.room}{saved.repeat ? ` · every ${dayName(sd)}` : ""}. Here’s what Kinlight did.</p>
          </div>
        </div>
        <ul className="went-list">
          {effects.map((x) => (
            <li key={x.title} className={x.wait ? "wait" : undefined}><Icon name={x.icon} /><b>{x.title}</b><span>{x.detail}</span></li>
          ))}
        </ul>
        <div className="pt-act">
          {!saved.approval && <Link className="sx-btn sx-btn-primary" href={site("/calendar")} target="_blank"><Icon name="globe" /> See it on the website</Link>}
          {!inDrawer && <Link className="sx-btn" href="/staff/calendar"><Icon name="calendar" /> Open the calendar</Link>}
          {onAnother && <button type="button" className="sx-btn" onClick={onAnother}><Icon name="plus" /> Add another</button>}
        </div>
      </div>
    );
  }

  const form = (
    <form className={`sx-form pt-form po-evform${inDrawer ? "" : " sx-card sx-card-body"}`} onSubmit={(ev) => { ev.preventDefault(); save(); }} aria-label="New event">
      {idea && (
        <div className="sx-callout info po-idea">
          <Icon name="heart" />
          <p><b>A resident’s idea:</b> “{idea.text}”{idea.who ? ` from ${idea.who}` : ""}. {idea.who ? <>We’ll tell {first(idea.who)}: <i>your idea made the calendar</i>.</> : "No name on the slip."}</p>
        </div>
      )}
      <label>
        Title
        <input value={f.title} onChange={set("title")} required placeholder="Bridge Club" autoComplete="off" />
      </label>
      <div className="sx-row3 po-when">
        <label>Day<input type="date" value={f.date} min={setup.todayIso} onChange={set("date")} required /></label>
        <label>Starts<input type="time" value={f.time} onChange={(ev) => { const s0 = toMin(ev.target.value); setF({ ...f, time: ev.target.value, end: hhmm(s0 + Math.max(15, end - start)) }); }} step={300} required /></label>
        <label>Ends<input type="time" value={f.end} onChange={set("end")} step={300} /></label>
      </div>
      <fieldset className="po-field">
        <legend className="sx-lbl">Repeats</legend>
        <div className="sx-seg" role="group" aria-label="Repeats">
          <button type="button" aria-pressed={!repeat} onClick={() => setRepeat(false)}>One-off</button>
          <button type="button" aria-pressed={repeat} onClick={() => setRepeat(true)}>Every {dayName(d)}</button>
        </div>
      </fieldset>
      <fieldset className="po-field">
        <legend className="sx-lbl">Who is it for?</legend>
        <div className="sx-seg po-seg" role="group" aria-label="Who it’s for">
          {(["resident", "family", "public"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === "resident" ? "Residents" : k === "family" ? "Families" : "Public"}</button>
          ))}
        </div>
        <p className="sx-hint">
          {eventKindLabel[kind]}. {kind === "resident" ? "Residents reply YES or sign up with you; families can ask for a seat." : kind === "family" ? "Families reply with how many are coming; the resident says yes first, then it’s approved." : "Anyone can sign up on the website, and each sign-up is a lead for sales."}
        </p>
      </fieldset>
      <div className="sx-row">
        <label>Room<select value={f.room} onChange={set("room")}>{setup.rooms.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label>Seats, if limited<input type="number" min={0} inputMode="numeric" value={f.cap} onChange={set("cap")} placeholder="No limit" /></label>
      </div>
      {clash ? (
        <div className="sx-callout" role="alert">
          <Icon name="alert" />
          <p>
            <b>Room clash:</b> {clash.title} is in {f.room} {clash.date === f.date ? "" : `on ${dayName(fromIso(clash.date))}s `}{fmtRange(clash.start, clash.end)}. Choose another room or time
            {share ? ", or keep it: you said they share the room." : <>, or <button type="button" className="sx-link pt-linkbtn" onClick={() => setShare(true)}>they can share the room</button>.</>}
          </p>
        </div>
      ) : (
        <p className="sx-hint po-free"><Icon name="check" /> {f.room} is free {fmtRange(start, end)}{repeat ? ` every ${dayName(d)}` : ""}.</p>
      )}
      <label className="sx-check"><input type="checkbox" checked={lantern} onChange={(ev) => setLantern(ev.target.checked)} /> A Lantern (memory care) activity</label>
      <fieldset className="po-field">
        <legend className="sx-lbl">Matching interests <span className="sx-hint">{ints ? "chosen by you" : f.title ? "suggested from the title" : "suggested once there’s a title"}</span></legend>
        <div className="sx-chips po-ints" role="group" aria-label="Matching interests">
          {setup.interests.map((i) => <button key={i} type="button" aria-pressed={interests.includes(i)} onClick={() => toggleInt(i)}>{interests.includes(i) && <Icon name="check" />}{i}</button>)}
        </div>
        <p className="sx-hint">{lantern ? "Lantern residents are invited in person, not by text." : `${invited.length} residents chose ${interests.length ? andList(interests.map((i) => i.toLowerCase())) : "these"}: each gets a personal invite by text.`}</p>
      </fieldset>
      <label>
        <span>Price, if any <span className="sx-hint">{setup.isApprover ? "you approve your own" : `${setup.approver.first} approves anything with a price`}</span></span>
        <input value={f.cost} onChange={set("cost")} placeholder="Free" inputMode="decimal" />
      </label>
      <div className="po-written">
        <div className="po-written-h">
          <span className="po-ai"><Icon name="sparkle" /> {desc === null ? "Kinlight wrote this description" : "Changed by you"}</span>
          {desc !== null && <button type="button" className="sx-link pt-linkbtn" onClick={() => setDesc(null)}>Write it again</button>}
        </div>
        <textarea aria-label="Description" rows={3} value={text} onChange={(ev) => setDesc(ev.target.value)} placeholder="Kinlight writes this once there’s a title." />
        <p className="sx-hint">Only from what you entered: nothing added. {kind === "resident" ? "The room and seats are left out: the website never shows them for resident activities." : ""}</p>
      </div>
      {inDrawer && <AutoList effects={effects} />}
      <div className="pt-submit">
        <p>{approval ? <>Goes to <b>{setup.approver.first}</b> first, because it has a price.</> : blocked ? "Fix the room clash first." : "Publishes straight away. Everything below happens automatically."}</p>
        <button type="submit" className="sx-btn sx-btn-lg sx-btn-primary" disabled={!f.title || blocked}>
          <Icon name={approval ? "send" : "check"} /> {approval ? `Send to ${setup.approver.first}` : "Add the event"}
        </button>
      </div>
    </form>
  );

  if (inDrawer) return form;
  return (
    <div className="po-ev">
      {form}
      <section className="sx-card sx-card-body po-auto" aria-label="What Kinlight does automatically">
        <h2 className="pt-prev-h">What Kinlight does when you add it</h2>
        <AutoList effects={effects} />
        <div className="prev-grid po-prevs">
          <div className="prev prev-wide">
            <div className="prev-h"><Icon name="globe" /> Website <span className="sx-hint">{setup.brand.domain}/calendar</span></div>
            <div className="prev-b">
              <div className="pv-web">
                <div className="pv-web-day">{dayName(d)}, {monthName(d)} {d.getUTCDate()}</div>
                <div className="pv-web-card pt-noimg">
                  <div className="pv-web-t">
                    <time>{fmtTime(start)}</time>
                    <b>{f.title || "Your event"}</b>
                    {kind !== "resident" && <span>{f.room}</span>}
                    <span className="pv-web-desc">{text}</span>
                    {kind === "public" && <span className="pv-web-btn">Sign up</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!lantern && invited.length > 0 && (
            <div className="prev">
              <div className="prev-h"><Icon name="sms" /> Personal invite</div>
              <div className="prev-b prev-phone">
                <Phone size="sm" time="8:30" label={`The invite on ${invited[0]}’s phone`}>
                  <SmsThread name={setup.brand.name} sub={setup.brand.phone} initials={setup.brand.short} bubbles={[{ time: "8:30 am", text: sample }, { me: true, text: "YES" }, { time: "8:31 am", text: `You’re booked, ${first(invited[0])}. See you there!` }]} />
                </Phone>
                <p className="pv-meta">To {invited.length} residents who chose {andList(interests.map((i) => i.toLowerCase()))}</p>
              </div>
            </div>
          )}
          <div className="prev">
            <div className="prev-h"><Icon name="printer" /> Flyer <span className="sx-hint">Large print</span></div>
            <div className="prev-b">
              <div className="pv-flyer">
                <div className="pv-flyer-top">{setup.brand.name}</div>
                <div className="pv-flyer-t">
                  <b>{short}</b>
                  <span>{repeat ? `Every ${dayName(d)}` : `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`} · {fmtTime(start)}</span>
                  <small>{kind === "public" ? `Everyone welcome · ${setup.brand.domain}` : cap ? "Sign up at the front desk" : f.room}</small>
                </div>
                <div className="pv-flyer-foot">Questions? {setup.brand.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AutoList({ effects }: { effects: Effect[] }) {
  return (
    <ul className="po-autolist" aria-label="What happens automatically">
      {effects.map((x) => (
        <li key={x.title} className={x.wait ? "wait" : undefined}>
          <Icon name={x.icon} />
          <span><b>{x.title}</b> {x.detail}</span>
        </li>
      ))}
    </ul>
  );
}
