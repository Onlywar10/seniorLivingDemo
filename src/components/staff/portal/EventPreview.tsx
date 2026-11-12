"use client";

// Post's Preview tab: what everyone will see once the event is added, each in its own view.
// - Website: the week on the community's public calendar, with the event in it (and what a visitor sees on tapping it).
// - Newsletter: the coming Sunday issue's "Coming up" section, with it added if staff choose.
// - Texts: the Sunday text with the resident's week link, the personal invite, the reminder and the booking reply.
// - Resident's week: that resident's week page (the action page) with the event on it, picked out if it's for them.
import Link from "next/link";
import { useMemo, useState } from "react";
import { cats, type Cat, type EventKind } from "@/data/shared";
import type { CalEvent } from "@/data/staff/calEvents";
import type { Interest } from "@/data/staff/engage";
import type { PoolEvent, PreviewSetup } from "@/data/staff/pool";
import type { NewEventSetup } from "@/data/staff/post";
import { addDays, dayName, fmtRange, fmtTime, fromIso, iso, shortDate, sundayOf } from "@/lib/clock";
import { draftDescription, type PlanStep } from "@/lib/eventPlan";
import { placesText, type Place } from "@/lib/places";
import { weekHref, weekToken } from "@/lib/residentLink";
import { Icon } from "../../Icon";
import { WeekPage } from "../../week/WeekPage";
import { poolToCal, weekItems } from "../../week/LiveWeek";
import { applyChanges, useEventChanges } from "../eventStore";
import { useStaffCommunity } from "../StaffCommunity";

/** The event as the form has it right now. */
export interface Draft {
  /** The event being edited, or "draft". */
  id: string;
  title: string; date: string; start: number; end: number; room: string; kind: EventKind; cat: Cat; desc: string;
  cap?: number; interests: Interest[]; lantern: boolean; rule?: string;
  /** Every date it's on (the first one for a one-off). */
  dates: string[];
  approval: boolean;
  plan: PlanStep[];
  stops?: Place[];
}

type View = "web" | "news" | "texts" | "week";
const VIEWS: [View, string, "globe" | "mail" | "sms" | "phone"][] = [["web", "Website calendar", "globe"], ["news", "Newsletter", "mail"], ["texts", "Texts", "sms"], ["week", "Resident’s week", "phone"]];
const first = (n = "") => n.split(" ")[0];
const shortTime = (m: number) => fmtTime(m).replace(":00", "");
const kindTag: Partial<Record<EventKind, string>> = { public: "Open to the public", family: "Family event" };

export function EventPreview({ draft, setup, preview, newsletter, setNewsletter, invited }: {
  draft: Draft; setup: NewEventSetup; preview?: PreviewSetup;
  newsletter: boolean; setNewsletter: (x: boolean) => void;
  /** The residents who get a personal invite (their interests match). */
  invited: string[];
}) {
  const [view, setView] = useState<View>("web");
  const ch = useEventChanges();
  const { scope } = useStaffCommunity();
  const slug = scope === "all" ? undefined : scope;
  // Who the texts and the week page are shown for: the first resident invited, or anyone who gets texts.
  const people = useMemo(() => {
    // Some sample residents have a gap in their interests list; leave it out.
    const all = setup.invitees.map((r) => ({ ...r, interests: r.interests.filter(Boolean) }));
    const yes = all.filter((r) => invited.includes(r.name));
    return [...yes, ...all.filter((r) => !invited.includes(r.name))].slice(0, 30);
  }, [setup.invitees, invited]);
  const [who, setWho] = useState<string | null>(null);
  const person = people.find((p) => p.name === who) ?? people[0];

  const d = fromIso(draft.date);
  const weekFrom = iso(sundayOf(d));
  const weekTo = iso(addDays(fromIso(weekFrom), 6));
  const title = draft.title || "Your event";

  // The week's events (the server's, with this browser's changes), without the event being edited, plus the draft's
  // own dates that week.
  const draftEvents: CalEvent[] = draft.dates.filter((x) => x >= weekFrom && x <= weekTo).map((date) => ({
    id: `draft-${draft.id}`, date, start: draft.start, end: draft.end, title, room: draft.room, kind: draft.kind, cat: draft.cat,
    color: cats[draft.cat].color, catLabel: cats[draft.cat].label, cap: draft.cap, taken: 0, lantern: draft.lantern, desc: draft.desc,
    interests: draft.interests, rule: draft.rule, booked: [], plan: draft.plan, stops: draft.stops,
  }));
  const week = useMemo(() => {
    const base = (preview?.pool ?? []).filter((e) => e.date >= weekFrom && e.date <= weekTo).map(poolToCal);
    return applyChanges(base, ch).filter((e) => e.date >= weekFrom && e.date <= weekTo && !e.cancelled && e.id !== draft.id);
  }, [preview, ch, weekFrom, weekTo, draft.id]);
  const withDraft = [...week, ...draftEvents];
  const draftKeys = draftEvents.map((e) => `${e.id}@${e.date}`);

  return (
    <div className="ep">
      <div className="ep-views" role="tablist" aria-label="Preview">
        {VIEWS.map(([k, label, icon]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)}><Icon name={icon} /> {label}</button>
        ))}
      </div>
      {draft.approval && <p className="sx-hint ep-note"><Icon name="clock" /> It has a price, so none of this happens until {setup.approver.first} approves it.</p>}

      {view === "web" && <WebWeek events={withDraft} draftKeys={draftKeys} weekFrom={weekFrom} todayIso={setup.todayIso} draft={draft} domain={setup.brand.domain} brand={setup.brand.name} />}

      {view === "news" && <News draft={draft} title={title} pool={preview?.pool ?? []} week={withDraft} masthead={preview?.masthead ?? `The ${setup.brand.name} Weekly`} brand={setup.brand} todayIso={setup.todayIso} on={newsletter} setOn={setNewsletter} />}

      {(view === "texts" || view === "week") && person && (
        <label className="ep-who">
          <span className="sx-lbl">Shown for</span>
          <select value={person.name} onChange={(ev) => setWho(ev.target.value)}>
            {people.map((p) => <option key={p.name} value={p.name}>{p.name} · likes {p.interests.map((i) => i.toLowerCase()).join(", ")}{invited.includes(p.name) ? " · invited" : ""}</option>)}
          </select>
        </label>
      )}

      {view === "texts" && person && <Texts draft={draft} title={title} who={person.name} invited={invited} lantern={draft.lantern} setup={setup} slug={slug} />}

      {view === "week" && person && (
        <div className="ep-weekwrap">
          <p className="sx-hint">What {first(person.name)} sees when they open the link in Sunday’s text: the week of {shortDate(fromIso(weekFrom))}, this event{draft.interests.some((i) => person.interests.includes(i)) ? " picked out for them" : " in the list (it doesn’t match their interests)"}.</p>
          <PhoneFrame host={`${setup.brand.domain}/w/${weekToken(person.name)}`}>
            <WeekPreview events={withDraft} draftKeys={draftKeys} person={person} weekFrom={weekFrom} todayIso={setup.todayIso} brand={setup.brand.name} phone={setup.brand.phone} />
          </PhoneFrame>
          {slug && <p className="ep-open"><Link className="sx-link" href={weekHref(slug, person.name)} target="_blank">Open {first(person.name)}’s real week page <Icon name="arrow" /></Link> <span className="sx-hint">(this week; the event shows there once it’s added, if it’s this week)</span></p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ the website calendar */

function WebWeek({ events, draftKeys, weekFrom, todayIso, draft, domain, brand }: { events: CalEvent[]; draftKeys: string[]; weekFrom: string; todayIso: string; draft: Draft; domain: string; brand: string }) {
  const days = Array.from({ length: 7 }, (_, i) => iso(addDays(fromIso(weekFrom), i)));
  const f = fromIso(weekFrom);
  const k = (e: CalEvent) => `${e.id}@${e.date}`;
  // Any event opens to what the website tells visitors about it; the new one is open to begin with.
  const [openK, setOpenK] = useState<string | null>(null);
  const open = events.find((e) => k(e) === openK) ?? events.find((e) => draftKeys.includes(k(e)));
  return (
    <div className="ep-web">
      <div className="ep-browser"><span className="ep-dots" aria-hidden="true"><i /><i /><i /></span><span className="ep-url">{domain}/calendar</span></div>
      <div className="ep-web-body">
        <p className="ep-web-h"><b>Activity Calendar</b> <span>{shortDate(f)} – {shortDate(addDays(f, 6))}</span> <small className="sx-hint">Tap any event to see what visitors see.</small></p>
        <ol className="ep-cal">
          {days.map((day) => {
            const list = events.filter((e) => e.date === day).sort((a, b) => a.start - b.start);
            const dt = fromIso(day);
            return (
              <li key={day} className={`ep-col${day === todayIso ? " is-today" : ""}`}>
                <h4>{dayName(dt).slice(0, 3)} <small>{shortDate(dt)}</small></h4>
                {list.length === 0 ? <p className="ep-none">Nothing on</p> : (
                  <ul>
                    {list.map((e) => {
                      const isNew = draftKeys.includes(k(e));
                      return (
                        <li key={k(e)}>
                          <button type="button" aria-pressed={open ? k(open) === k(e) : false} onClick={() => setOpenK(k(e))} className={`ep-ev${isNew ? " is-new" : ""}`} style={{ "--cat": cats[(e.cat in cats ? e.cat : "community") as Cat].color } as React.CSSProperties}>
                            <span className="ep-ev-t">{fmtRange(e.start, e.end)}</span>
                            <b>{e.title}</b>
                            {e.kind !== "resident" && <span className="ep-ev-m">{e.room}</span>}
                            {kindTag[e.kind] && <span className={`ep-flag ep-flag-${e.kind}`}>{kindTag[e.kind]}</span>}
                            {isNew && <span className="ep-new">New</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
        {open ? <PublicDetails e={open} isNew={draftKeys.includes(k(open))} draft={draft} brand={brand} /> : <p className="sx-hint">Its first date isn’t this week.</p>}
      </div>
    </div>
  );
}

/** What the website tells a visitor about one event, by who it's for: never seats, waitlists or a resident's name. */
function PublicDetails({ e, isNew, draft, brand }: { e: CalEvent; isNew: boolean; draft: Draft; brand: string }) {
  const d = fromIso(e.date);
  const desc = isNew ? draft.desc : e.desc || draftDescription(e);
  const rule = isNew ? draft.rule : e.rule;
  return (
    <div className="ep-detail" aria-live="polite">
      <p className="sx-lbl">{isNew ? "Your event, as visitors see it" : "As visitors see it"}</p>
      <div className="ep-public">
        <p className="ep-public-k">{e.kind === "public" ? "Open to the public" : e.kind === "family" ? "Family event" : cats[(e.cat in cats ? e.cat : "community") as Cat].label}</p>
        <h4>{e.title}</h4>
        <dl>
          <div><dt>When</dt><dd>{dayName(d)}, {shortDate(d)} · {fmtRange(e.start, e.end)}{rule ? <><br /><small>{rule}</small></> : null}</dd></div>
          {e.kind !== "resident" && <div><dt>Where</dt><dd>{e.stops?.length ? <>{placesText(e.stops)}<br /><small>The bus leaves from {brand}</small></> : <>{e.room}, {brand}</>}</dd></div>}
          {e.cost && <div><dt>Cost</dt><dd>{e.cost}</dd></div>}
        </dl>
        <p>{desc || "The description goes here once there’s a title."}</p>
        {e.kind === "public" && <span className="po-web-btn">Sign up</span>}
        {e.kind === "family" && <p className="ep-public-note">Families: RSVP from your weekly message.</p>}
        {e.kind === "resident" && <p className="ep-public-note">For residents. Residents: sign up from your week page or at the front desk.</p>}
      </div>
      <p className="sx-hint">{e.kind === "resident" ? "The website shows a resident activity’s name, day, time and description only: never the room, the seats or who’s going." : e.kind === "family" ? "Families RSVP from their weekly message; the website only shows that it’s on, and where." : "Anyone can sign up on the website, and each sign-up reaches sales."}</p>
    </div>
  );
}

/* ------------------------------------------------------------ the newsletter */

function News({ draft, title, week, masthead, brand, todayIso, on, setOn }: { draft: Draft; title: string; pool: PoolEvent[]; week: CalEvent[]; masthead: string; brand: NewEventSetup["brand"]; todayIso: string; on: boolean; setOn: (x: boolean) => void }) {
  // The newsletter goes out on Sunday at 5 pm with that week's events: the issue for this event is the Sunday its week starts.
  const sun = sundayOf(fromIso(draft.date));
  const tooSoon = iso(sun) < todayIso;
  const highlights = week.filter((e) => !e.id.startsWith("draft-") && !e.lantern && (e.kind !== "resident" || e.cap)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start).slice(0, 5);
  const when = (e: { date: string; start: number }) => `${dayName(fromIso(e.date)).slice(0, 3)}, ${shortDate(fromIso(e.date))} · ${fmtTime(e.start)}`;
  const mine = { id: "draft", date: draft.date, start: draft.start, title, room: draft.room, kind: draft.kind };
  const items = on && !tooSoon ? [...highlights, mine].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start) : highlights;
  return (
    <div className="ep-news">
      <label className={`sx-check ep-toggle${tooSoon ? " is-off" : ""}`}>
        <input type="checkbox" checked={on && !tooSoon} disabled={tooSoon} onChange={(ev) => setOn(ev.target.checked)} />
        <span>
          <b>Add it to the newsletter on Sunday, {shortDate(sun)}</b>
          <small>{tooSoon ? "That issue has already gone out. Residents hear about it by text instead." : "Goes to residents and families at 5 pm. The public version leaves out resident-only and family events."}</small>
        </span>
      </label>
      <div className="ep-mail">
        <div className="ep-mail-h">
          <span>From <b>{brand.name}</b> &lt;hello@{brand.domain}&gt;</span>
          <span>Subject: <b>This week at {brand.name}</b></span>
          <span>Sunday, {shortDate(sun)} · 5:00 pm</span>
        </div>
        <div className="ep-mail-b">
          <p className="ep-mast">{masthead}</p>
          <h4>Coming up this week</h4>
          <p>Mark your calendar. Here are some highlights; the full calendar is on our website.</p>
          <ul className="ep-items">
            {items.map((e) => (
              <li key={`${e.id}@${e.date}`} className={e.id === "draft" ? "is-new" : ""}>
                <span>{when(e)}</span>
                <b>{e.title}</b>
                {e.kind !== "resident" && <small>{e.room}</small>}
                {e.id === "draft" && <em>New</em>}
              </li>
            ))}
            {items.length === 0 && <li className="ep-none">Nothing highlighted this week yet.</li>}
          </ul>
        </div>
      </div>
      {!on && !tooSoon && <p className="sx-hint">Not in the newsletter. It’s still on the website, the printed calendar and each resident’s week page.</p>}
    </div>
  );
}

/* ------------------------------------------------------------ the texts */

function Texts({ draft, title, who, invited, lantern, setup, slug }: { draft: Draft; title: string; who: string; invited: string[]; lantern: boolean; setup: NewEventSetup; slug?: string }) {
  const d = fromIso(draft.date);
  const sun = sundayOf(d);
  const isInvited = invited.includes(who);
  const days = Math.round((d.getTime() - fromIso(setup.todayIso).getTime()) / 864e5);
  const inviteWhen = days <= 1 ? "Now" : `${dayName(addDays(d, -2))} 8:30 am`;
  const name = title.replace(/^Bus Trip: /, "").split(":")[0];
  const at = `${dayName(d)} at ${shortTime(draft.start)}`;
  const place = draft.kind === "resident" ? "" : ` in the ${draft.room.replace(/^The /, "")}`;
  const link = `${setup.brand.domain}/w/${weekToken(who)}`;
  const msgs: { when: string; label: string; me?: boolean; text: string }[] = [
    { when: `Sunday ${shortDate(sun)}, 5:00 pm`, label: "Every week", text: `Hi ${first(who)}, here’s your week at ${setup.brand.name}. Tap to see what’s on and pick what you’d like to do: ${link}` },
  ];
  if (isInvited && !lantern) {
    msgs.push({ when: inviteWhen, label: "Personal invite", text: `${first(who)}, ${name} is ${draft.rule ? `every ${dayName(d)}` : dayName(d)} at ${shortTime(draft.start)}${place}. ${draft.cap ? "Want a seat?" : "Want to come?"} Reply YES.` });
    msgs.push({ when: `${dayName(addDays(d, -1))} 10:00 am`, label: "Reminder, if they haven’t answered", text: `Just a reminder: ${name} is tomorrow at ${shortTime(draft.start)}${place}. Still want to come? Reply YES, or tap your week page.` });
    msgs.push({ when: "", label: "", me: true, text: "YES" });
    msgs.push({ when: "", label: "Booked straight away", text: draft.cap ? `You’re booked for ${name}, ${at}. Your seat is saved. See you there!` : `Lovely! You’re on the list for ${name}, ${at}. See you there!` });
  }
  return (
    <div className="ep-texts">
      <p className="sx-hint">
        {lantern ? "Lantern residents aren’t texted: the care team asks them in person."
          : isInvited ? `${first(who)} likes ${draft.interests.map((i) => i.toLowerCase()).join(" and ")}, so they get the invite and, if they haven’t answered, a reminder the day before. ${invited.length} residents get these.`
          : `${first(who)} isn’t invited to this one (their interests don’t match), but it’s on their week page from Sunday’s text.`}
      </p>
      <div className="ep-phone">
        <p className="ep-from">{setup.brand.name} <small>{setup.brand.phone}</small></p>
        {msgs.map((m, i) => (
          <div key={i} className={`ep-msg${m.me ? " me" : ""}`}>
            {m.label && <small>{m.when ? `${m.when} · ` : ""}{m.label}</small>}
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      {slug && <p className="sx-hint">Their week page link is theirs alone: no password, nothing private on it.</p>}
    </div>
  );
}

/* ------------------------------------------------------------ the resident's week page */

function WeekPreview({ events, draftKeys, person, weekFrom, todayIso, brand, phone }: { events: CalEvent[]; draftKeys: string[]; person: { name: string; interests: string[] }; weekFrom: string; todayIso: string; brand: string; phone: string }) {
  const [going, setGoing] = useState<string[]>([]);
  const items = weekItems(events, person, weekFrom, draftKeys).map((x) => (going.includes(x.key) ? { ...x, going: true, taken: (x.taken ?? 0) + 1 } : x));
  return (
    <WeekPage
      preview
      brand={brand}
      first={first(person.name)}
      weekFrom={weekFrom}
      todayIso={todayIso}
      phone={phone}
      items={items}
      openKey={draftKeys[0]}
      onGo={(x) => setGoing((g) => [...g, x.key])}
      onCancel={(x) => setGoing((g) => g.filter((k) => k !== x.key))}
    />
  );
}

function PhoneFrame({ host, children }: { host: string; children: React.ReactNode }) {
  return (
    <div className="ep-phoneframe">
      <div className="ep-browser"><span className="ep-url"><Icon name="lock" /> {host}</span></div>
      <div className="ep-phoneframe-b">{children}</div>
    </div>
  );
}
