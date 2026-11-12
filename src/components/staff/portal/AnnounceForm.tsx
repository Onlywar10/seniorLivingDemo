"use client";

// One announcement form, used twice: Post's "Announcement" (news that isn't an event) and Today's "Something changed"
// (tied to one of today's events: moved, a new room, running late or cancelled). Who it's for is a multi-select:
// everyone, any floors and care areas, or only the people booked on the event; residents, families or both. Kinlight
// sends it by text and email in each person's language and updates the website. All data comes in by props; nothing
// is sent from this browser.
import { useMemo, useState } from "react";
import type { AnnounceSetup, Audience } from "@/data/staff/post";
import { addDays, dayName, fromIso, iso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";
import { Auto, Help } from "./Help";

/** One of today's (or tomorrow's) events that changed. */
export interface AnnounceEvent { id: string; title: string; day: "Today" | "Tomorrow"; time: string; place: string; booked: number; families: number }
export interface AnnounceResult { text: string; residents: number; families: number; minutes: number; website: boolean }
export interface AnnounceFormProps {
  /** One community, or several (the all-communities view: it can go to every community at once). */
  setups: AnnounceSetup[];
  /** Tie it to an event: offers the quick choices and defaults to the people booked on it. */
  event?: AnnounceEvent;
  /** Wrap the form in a card. */
  card?: boolean;
  onSent?: (r: AnnounceResult) => void;
  /** Shown as a quiet "Cancel" button beside Send, and as "Done" after sending. */
  onClose?: () => void;
}

type Change = "moved" | "room" | "late" | "cancelled";
const changeLabel: Record<Change, string> = { moved: "Moved", room: "New room", late: "Running late", cancelled: "Cancelled" };
type Who = "both" | "residents" | "families";
const BOOKED = "booked";

const longDay = (s: string) => { const d = fromIso(s); return `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`; };
const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const to12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
/** About how long texts and emails take to reach everyone. */
const minutesFor = (n: number) => Math.min(6, Math.max(1, Math.ceil(Math.sqrt(n) / 2)));

export function AnnounceForm({ setups, event, card = false, onSent, onClose }: AnnounceFormProps) {
  const many = setups.length > 1;
  const [where, setWhere] = useState<string>(many ? "all" : setups[0].slug);
  const chosen = where === "all" ? setups : setups.filter((s) => s.slug === where);
  const base = chosen[0];
  const todayIso = base.todayIso;

  const [change, setChange] = useState<Change>("late");
  const [mins, setMins] = useState("15");
  const [time, setTime] = useState("15:00");
  const [room, setRoom] = useState(() => base.rooms.find((r) => r !== event?.place) ?? base.rooms[0] ?? "");
  const [own, setOwn] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>(event ? [BOOKED] : ["everyone"]);
  const [who, setWho] = useState<Who>("both");
  const [ends, setEnds] = useState(iso(addDays(fromIso(todayIso), 3)));
  const [urgent, setUrgent] = useState(false);
  const [web, setWeb] = useState(true);
  const [sent, setSent] = useState<AnnounceResult | null>(null);

  // Floors differ from one community to the next, so floors are only offered for one community.
  const audiences = where === "all" ? base.audiences.filter((a) => a.group !== "floor") : base.audiences;
  const floors = audiences.filter((a) => a.group === "floor");
  const care = audiences.filter((a) => a.group === "care");

  const toggle = (k: string) => setGroups((g) => {
    if (k === "everyone") return g.includes(k) ? (event ? [BOOKED] : g) : ["everyone"];
    const next = g.includes(k) ? g.filter((x) => x !== k) : [...g.filter((x) => x !== "everyone"), k];
    return next.length ? next : event ? [BOOKED] : ["everyone"];
  });

  // How many it reaches: the union of the chosen groups, never more than everyone.
  const reach = useMemo(() => {
    const sum = (k: string, f: (a: Audience) => number) => chosen.reduce((n, s) => n + f(s.audiences.find((x) => x.k === k) ?? ({ residents: 0, families: 0 } as Audience)), 0);
    const all = { r: sum("everyone", (a) => a.residents), f: sum("everyone", (a) => a.families) };
    if (groups.includes("everyone")) return all;
    const pick = (ks: string[]) => ({ r: ks.reduce((n, k) => n + sum(k, (a) => a.residents), 0), f: ks.reduce((n, k) => n + sum(k, (a) => a.families), 0) });
    const fl = pick(groups.filter((k) => k.startsWith("floor-")));
    const ca = pick(groups.filter((k) => k.startsWith("care-")));
    // Floors and care areas overlap: count someone on a chosen floor and in a chosen care area once.
    const both = (a: number, b: number, t: number) => Math.min(t, Math.round(a + b - (a && b ? (a * b) / Math.max(1, t) : 0)));
    const r = both(fl.r, ca.r, all.r), f = both(fl.f, ca.f, all.f);
    const ev = groups.includes(BOOKED) && event ? { r: event.booked, f: event.families } : { r: 0, f: 0 };
    return { r: Math.min(all.r, r + ev.r), f: Math.min(all.f, f + ev.f) };
  }, [chosen, groups, event]);
  const resN = who === "families" ? 0 : reach.r;
  const famN = who === "residents" ? 0 : reach.f;
  const reached = [resN ? `${resN} resident${resN === 1 ? "" : "s"}` : "", famN ? `${famN} famil${famN === 1 ? "y" : "ies"}` : ""].filter(Boolean);

  const written = !event ? "" :
    change === "late" ? `${event.title} is running about ${mins} minutes late ${event.day.toLowerCase()}. Same place: ${event.place}.` :
    change === "moved" ? `${event.title} now starts at ${to12(time)} ${event.day.toLowerCase()}, in ${event.place}.` :
    change === "room" ? `${event.title} at ${event.time} has moved to ${room} ${event.day.toLowerCase()}.` :
    `${event.title} at ${event.time} is cancelled ${event.day.toLowerCase()}. We’re sorry. Questions? Call ${base.phone}.`;
  const text = own ?? written;
  const isPublic = event ? true : web && groups.includes("everyone") && who !== "residents";
  const langs = [...new Set(chosen.flatMap((s) => s.languages.map((l) => l.k)))];
  const scope = where === "all" ? "every community" : base.name;

  const send = () => {
    if (!text.trim() || !reached.length) return;
    const r: AnnounceResult = { text: text.trim(), residents: resN, families: famN, minutes: minutesFor(resN + famN), website: isPublic };
    setSent(r);
    onSent?.(r);
  };

  if (sent) {
    return (
      <div className={`af-done${card ? " sx-card sx-card-body" : ""}`} role="status">
        <div className="af-done-h">
          <Icon name="check" />
          <div>
            <h3>{event ? (change === "cancelled" ? "Cancellation sent" : "Change sent") : urgent ? "Sent now" : "Announcement sent"}</h3>
            <p className="pt-reach">Sent to {andList(reached)} in {sent.minutes} minute{sent.minutes === 1 ? "" : "s"}{sent.website ? " · website updated" : ""}</p>
          </div>
        </div>
        <blockquote className="af-quote">{sent.text}</blockquote>
        <Auto summary="What Kinlight did">
          <ul>
            <li>Text or email to each person, in their own language ({andList(langs)}).</li>
            <li>Residents who chose print get a note from the front desk.</li>
            {event ? <li>The website calendar and {base.name}’s home page show the change.</li> : isPublic ? <li>On the news page{where === "all" ? " of each community" : ""}{urgent ? " and at the top of every page" : ""} until {longDay(ends)}, then taken down.</li> : <li>Kept off the public website.</li>}
            {!event && isPublic && !urgent && <li>In Sunday’s newsletter, if it’s still showing.</li>}
            {event && change === "cancelled" && <li>Taken off the newsletter and the printed calendar.</li>}
          </ul>
        </Auto>
        <div className="pt-act">
          {!event && <button type="button" className="sx-btn sx-btn-primary" onClick={() => { setSent(null); setOwn(""); setUrgent(false); }}><Icon name="plus" /> Another announcement</button>}
          {onClose && <button type="button" className="sx-btn" onClick={onClose}>Done</button>}
        </div>
      </div>
    );
  }

  return (
    <form
      className={`sx-form pt-form af${event ? " pt-chg-form" : ""}${card ? " sx-card sx-card-body" : ""}`}
      onSubmit={(e) => { e.preventDefault(); send(); }}
      aria-label={event ? `Something changed: ${event.title}` : "Announcement"}
    >
      {event && (
        <>
          <p className="af-ev"><b>{event.title}</b> <span>{event.day} · {event.time} · {event.place}</span></p>
          <div className="sx-seg af-seg" role="group" aria-label="What changed">
            {(Object.keys(changeLabel) as Change[]).map((k) => <button key={k} type="button" aria-pressed={change === k} onClick={() => { setChange(k); setOwn(null); }}>{changeLabel[k]}</button>)}
          </div>
          {change === "late" && <label>About how late?<select value={mins} onChange={(x) => { setMins(x.target.value); setOwn(null); }}>{["10", "15", "20", "30", "45"].map((m) => <option key={m} value={m}>{m} minutes</option>)}</select></label>}
          {change === "moved" && <label>New time<input type="time" value={time} onChange={(x) => { setTime(x.target.value); setOwn(null); }} step={300} /></label>}
          {change === "room" && <label>New room<select value={room} onChange={(x) => { setRoom(x.target.value); setOwn(null); }}>{base.rooms.map((r) => <option key={r}>{r}</option>)}</select></label>}
        </>
      )}

      <label className={`af-text${event ? " pt-chg-line" : ""}`}>
        <span className="af-lbl">
          {event ? "The message" : "What is it?"}
          {event && <span className="po-ai"><Icon name="sparkle" /> {own === null ? "AI wrote this" : "Changed by you"}</span>}
        </span>
        <textarea rows={3} value={text} onChange={(e) => setOwn(e.target.value)} placeholder="Water off on the third floor Tuesday, 9–11 am." required />
      </label>

      {many && (
        <fieldset className="po-field">
          <legend className="sx-lbl">Communities</legend>
          <div className="sx-seg po-seg" role="group" aria-label="Which communities">
            <button type="button" aria-pressed={where === "all"} onClick={() => { setWhere("all"); setGroups(["everyone"]); }}>All</button>
            {setups.map((s) => <button key={s.slug} type="button" aria-pressed={where === s.slug} onClick={() => { setWhere(s.slug); setGroups(["everyone"]); }}>{s.name}</button>)}
          </div>
        </fieldset>
      )}

      <fieldset className="po-field">
        <legend className="sx-lbl">Who it’s for</legend>
        <div className="sx-chips af-aud" role="group" aria-label="Who it’s for">
          {event && <button type="button" aria-pressed={groups.includes(BOOKED)} onClick={() => toggle(BOOKED)}>{groups.includes(BOOKED) && <Icon name="check" />}Booked on this event</button>}
          <button type="button" aria-pressed={groups.includes("everyone")} onClick={() => toggle("everyone")}>{groups.includes("everyone") && <Icon name="check" />}Everyone</button>
          {floors.map((a) => <button key={a.k} type="button" aria-pressed={groups.includes(a.k)} onClick={() => toggle(a.k)}>{groups.includes(a.k) && <Icon name="check" />}{a.label}</button>)}
          {care.map((a) => <button key={a.k} type="button" aria-pressed={groups.includes(a.k)} onClick={() => toggle(a.k)}>{groups.includes(a.k) && <Icon name="check" />}{a.label}</button>)}
        </div>
        <div className="sx-seg af-who" role="group" aria-label="Residents, families or both">
          {([["both", "Residents and families"], ["residents", "Residents only"], ["families", "Families only"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={who === k} onClick={() => setWho(k)}>{l}</button>)}
        </div>
        <div className="af-count">
          {reached.length ? andList(reached) : "Nobody yet"}{where === "all" && !event ? " across every community" : ""}
          <Help label="How this is counted">
            <p>Each person once, even if they’re on a chosen floor and in a chosen care area.</p>
            {event && <p>“Booked on this event” is everyone who said yes or has a seat, and the families of residents who share with family.</p>}
            <p>Lantern residents get a note from the care team, not a text.</p>
          </Help>
        </div>
      </fieldset>

      {!event && (
        <div className="sx-row af-row">
          <label>Show until<input type="date" value={ends} min={todayIso} onChange={(e) => setEnds(e.target.value)} /></label>
          {groups.includes("everyone") && who !== "residents" && (
            <label className="sx-check af-web"><input type="checkbox" checked={web} onChange={(e) => setWeb(e.target.checked)} /> On the website too</label>
          )}
        </div>
      )}

      {!event && (
        <label className={`pt-urgent${urgent ? " on" : ""}`}>
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          <span><b>Urgent</b><small>A closure or emergency: goes out now, even at night.</small></span>
        </label>
      )}

      <div className="pt-submit">
        <Auto summary={event ? "Website updated · in each person’s language" : isPublic ? `Text, email and website · until ${longDay(ends).split(",")[0]}` : "Text and email only"}>
          <ul>
            <li>Text or email to {reached.length ? andList(reached) : "nobody yet"}, each in their own language ({andList(langs)}).</li>
            {event ? <li>The website calendar shows the change straight away.</li> : isPublic ? <li>On {scope}’s news page{urgent ? " and the top of every page" : ""}, taken down after {longDay(ends)}.</li> : <li>Not on the public website.</li>}
            <li>No approval needed{urgent ? ": urgent goes out at once" : ""}.</li>
          </ul>
        </Auto>
        <span className="af-btns">
          {onClose && <button type="button" className="sx-btn" onClick={onClose}>Cancel</button>}
          <button type="submit" className={`sx-btn sx-btn-lg ${urgent || event ? "sx-btn-terra" : "sx-btn-primary"}`} disabled={!text.trim() || !reached.length}>
            <Icon name="send" /> {event ? "Send the change" : urgent ? "Send now" : "Send"}
          </button>
        </span>
      </div>
    </form>
  );
}
