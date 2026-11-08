"use client";

// The calendar, for managing events that already exist. Week, month and day views; filters for Lantern, limited
// seats, family and public events, and room clashes. Each event opens a panel with everything about it: what the
// website shows, seats (staff only), family requests in progress, who's booked and how, booking a resident at the
// desk, the waitlist, personal invites, attendance by QR check-in or staff tap, photos, the flyer and QR check-in sign,
// and changing or cancelling it (everyone who planned around it is told). "+ Add" opens the same form as Post.
// Full events offer the waitlist, never Approve; Lantern requests are asked in person or of the legal representative.
// View-only for sales. Everything is saved in this browser only.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cats, eventKindLabel, type EventKind } from "@/data/shared";
import type { NewEventSetup } from "@/data/staff/post";
import { addDays, dayName, fmtRange, fmtTime, fromIso, hash, iso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";
import { TakeAttendance } from "../alpha/Attendance";
import { useStaffCommunity } from "../StaffCommunity";
import { Badge, XIcon } from "../ui";
import { Drawer } from "./Drawer";
import { NewEvent, type SavedEvent } from "./NewEvent";

export interface Booking { name: string; via: string }
export interface ReqRow {
  id: string; from: string; relation: string; resident: string; party: number; kind: "rsvp" | "seat"; stage: 1 | 2 | 3 | 4; declined?: boolean;
  /** A Lantern (memory care) resident: no text; asked in person, or their legal representative decides. */
  lantern?: boolean; rep?: { name: string; relation: string };
  /** Asked the legal representative instead of the resident. */
  askedRep?: boolean;
  /** The event was full, so the resident went on the waitlist. */
  waitlisted?: boolean;
}

export interface CalEvent {
  id: string; date: string; start: number; end?: number; title: string; room: string; cat: string; color: string; catLabel: string;
  kind: EventKind;
  cap?: number; taken?: number; waitlist?: number; lantern?: boolean; leader?: string; desc?: string; rule?: string;
  booked?: Booking[]; waiting?: string[]; clash?: string; isNew?: boolean;
  requests?: ReqRow[];
  /** Attendance, once taken: QR check-ins and staff taps (or a photo of the paper sheet). */
  came?: { n: number; of: number; qr: number; staff: number; how: "tap" | "sheet"; by: string };
  /** Personal invites to residents whose interests match. */
  invites?: { invited: number; yes: number; interests: string[]; text: string; sentAt: string };
  photos?: string[];
  /** A resident's suggestion that became this event (their name, or "a resident"). */
  idea?: string;
  /** Waiting for the approver (it has a price). */
  approval?: boolean;
  cancelled?: boolean;
}

const webShows: Record<EventKind, string> = {
  public: "Everything: name, day, time, place and description, with a sign-up form. Each sign-up is a lead for sales.",
  family: "Name, day, time, place and description. Families RSVP by replying to their text or email.",
  resident: "Name, day, time and description only. Never the seats, the room or a meeting point.",
};
const first = (n = "") => n.split(" ")[0];
type View = "week" | "month" | "day";
type Filter = "all" | "lantern" | "seats" | "open" | "conflicts";

export function CalendarBoard({ events: initial, weekStarts, todayIso, residents, readOnly = false, setup, brand, approver }: { events: CalEvent[]; weekStarts: string[]; todayIso: string; residents: string[]; readOnly?: boolean; setup?: NewEventSetup; brand: { name: string; domain: string; phone: string }; approver: string }) {
  const [events, setEvents] = useState(initial);
  const [view, setView] = useState<View>("week");
  const [w, setW] = useState(0);
  const [dayIso, setDayIso] = useState(todayIso);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<CalEvent | null>(null);
  const [adding, setAdding] = useState<{ date: string; n: number } | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const lastIso = iso(addDays(fromIso(weekStarts[weekStarts.length - 1]), 6));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => iso(addDays(fromIso(weekStarts[w]), i))), [w, weekStarts]);
  const monthDays = useMemo(() => {
    const t = fromIso(todayIso);
    const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
    const startCell = addDays(m1, -m1.getUTCDay());
    return Array.from({ length: 35 }, (_, i) => iso(addDays(startCell, i)));
  }, [todayIso]);
  const show = (e: CalEvent) => (filter === "lantern" ? e.lantern : filter === "seats" ? !!e.cap : filter === "open" ? e.kind !== "resident" : filter === "conflicts" ? !!e.clash : true);
  const clashes = events.filter((e) => e.clash && e.date >= todayIso && !e.cancelled);
  const firstD = fromIso(days[0]), lastD = fromIso(days[6]), dd = fromIso(dayIso);
  const range = view === "week" ? `${monthName(firstD).slice(0, 3)} ${firstD.getUTCDate()} – ${monthName(lastD).slice(0, 3)} ${lastD.getUTCDate()}` : view === "day" ? `${dayName(dd)}, ${monthName(dd).slice(0, 3)} ${dd.getUTCDate()}` : monthName(fromIso(todayIso));
  const update = (e: CalEvent) => { setEvents((xs) => xs.map((x) => (x.id === e.id && x.date === e.date ? e : x))); setOpen(e); };
  const busy = useMemo(() => events.filter((e) => e.isNew).map((e) => ({ date: e.date, start: e.start, end: e.end ?? e.start + 60, room: e.room, title: e.title })), [events]);
  const add = (date: string) => setAdding((a) => ({ date, n: (a?.n ?? 0) + 1 }));

  const saved = (s: SavedEvent) => {
    const dates = [s.date];
    if (s.repeat) for (let d = addDays(fromIso(s.date), 7); iso(d) <= lastIso; d = addDays(d, 7)) dates.push(iso(d));
    const base: Omit<CalEvent, "date"> = {
      id: s.id, kind: s.kind, start: s.start, end: s.end, title: s.title, room: s.room, cat: s.cat, color: cats[s.cat].color, catLabel: cats[s.cat].label,
      cap: s.cap, taken: s.cap ? 0 : undefined, booked: s.cap ? [] : undefined, lantern: s.lantern, rule: s.repeat ? `Every ${dayName(fromIso(s.date))}` : undefined,
      desc: s.desc, isNew: true, idea: s.idea, approval: s.approval,
    };
    setEvents((xs) => [...xs, ...dates.map((date) => ({ ...base, date }))]);
    const i = weekStarts.findIndex((ws) => s.date >= ws && s.date <= iso(addDays(fromIso(ws), 6)));
    if (i >= 0) setW(i);
    setDayIso(s.date);
  };

  const pill = (e: CalEvent) => {
    const full = e.cap && (e.taken ?? 0) >= e.cap;
    const waiting = e.requests?.filter((r) => r.stage === 3 && !r.declined).length ?? 0;
    return (
      <button type="button" className={`ced-ev ${e.clash ? "conflict" : ""} ${e.isNew ? "new" : ""}`} style={{ borderLeftColor: e.color, opacity: e.cancelled ? 0.55 : undefined }} onClick={() => setOpen(e)}>
        <span className="t">
          {fmtTime(e.start)}
          {e.rule ? <span title={e.rule}><XIcon name="repeat" /><span className="vh"> {e.rule}</span></span> : e.clash ? <Icon name="alert" /> : null}
        </span>
        {e.cancelled ? <s>{e.title}</s> : e.title}
        {e.kind !== "resident" && <span className={`ced-kind ${e.kind}`}>{e.kind === "public" ? "Public" : "Family"}</span>}
        {e.idea && <span className="ced-kind idea">Your idea</span>}
        {e.approval && <span className="pc-new">Waiting for {first(approver)}</span>}
        {e.cancelled && <span className="pc-new">Cancelled</span>}
        {e.cap ? <span className={`cap ${full ? "full" : ""}`}>{e.taken}/{e.cap}{full && e.waitlist ? ` · ${e.waitlist} waiting` : ""}</span> : null}
        {!readOnly && waiting > 0 && <span className="cap pt-ced-wait">{waiting} to approve</span>}
      </button>
    );
  };

  const step = (n: number) => {
    const next = iso(addDays(dd, n));
    if (next < weekStarts[0] || next > lastIso) return;
    setDayIso(next);
  };

  return (
    <div className="pc-cal">
      <div className="sx-toolbar">
        <div>
          <div className="sx-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === "week"} onClick={() => setView("week")}>Week</button>
            <button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>Month</button>
            <button type="button" aria-pressed={view === "day"} onClick={() => setView("day")}>Day</button>
          </div>
          {view === "week" && (
            <>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.max(0, w - 1))} disabled={w === 0} aria-label="Previous week"><Icon name="left" /></button>
              <b className="pt-range" aria-live="polite">{range}</b>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.min(weekStarts.length - 1, w + 1))} disabled={w === weekStarts.length - 1} aria-label="Next week"><Icon name="right" /></button>
            </>
          )}
          {view === "day" && (
            <>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => step(-1)} disabled={dayIso <= weekStarts[0]} aria-label="Previous day"><Icon name="left" /></button>
              <b className="pt-range" aria-live="polite">{range}</b>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => step(1)} disabled={dayIso >= lastIso} aria-label="Next day"><Icon name="right" /></button>
              {dayIso !== todayIso && <button type="button" className="sx-btn sx-btn-sm" onClick={() => setDayIso(todayIso)}>Today</button>}
            </>
          )}
          {view === "month" && <b className="pt-range">{range}</b>}
        </div>
        <div>
          <div className="sx-chips" role="group" aria-label="Show">
            {([["all", "All"], ["lantern", "Lantern"], ["seats", "Limited seats"], ["open", "Family & public"], ["conflicts", "Room clashes"]] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          {!readOnly && setup && (
            <button type="button" className="sx-btn sx-btn-primary" onClick={() => add(view === "day" ? dayIso : days.includes(todayIso) ? todayIso : days[1])}>
              <Icon name="plus" /> Add event
            </button>
          )}
        </div>
      </div>

      {readOnly && <p className="sx-callout info pc-viewonly"><Icon name="eye" /> <span>View only. To add or change an event, ask the activities team.</span></p>}

      {!readOnly && clashes.length > 0 && (
        <div className="sx-callout">
          <Icon name="alert" />
          <p>
            <b>Room clash:</b> {clashes[0].title} and {clashes[0].clash} are both in {clashes[0].room} at {fmtTime(clashes[0].start)} on {dayName(fromIso(clashes[0].date))}.{" "}
            <button type="button" className="sx-link pt-linkbtn" onClick={() => setOpen(clashes[0])}>Review</button>
          </p>
        </div>
      )}

      {view === "week" && (
        <div className="ced">
          {days.map((d) => {
            const date = fromIso(d);
            const list = events.filter((e) => e.date === d && show(e)).sort((a, b) => a.start - b.start);
            return (
              <section key={d} className={`ced-day ${d === todayIso ? "today" : ""}`} aria-label={`${dayName(date)}, ${monthName(date)} ${date.getUTCDate()}`}>
                <div className="ced-h">
                  <span>{dayName(date).slice(0, 3)} {date.getUTCDate()}</span>
                  <small>{d === todayIso ? "Today" : `${list.length} events`}</small>
                </div>
                <ul className="ced-list">{list.map((e) => <li key={e.id + e.date}>{pill(e)}</li>)}</ul>
                {!readOnly && setup ? <button type="button" className="ced-add" onClick={() => add(d)}>+ Add</button> : <span />}
              </section>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className="pt-month" role="grid" aria-label={range}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="pt-month-h" role="columnheader">{d}</div>)}
          {monthDays.map((d) => {
            const date = fromIso(d);
            const list = events.filter((e) => e.date === d && show(e) && (e.kind !== "resident" || e.cap || e.idea || e.isNew || filter !== "all")).sort((a, b) => a.start - b.start);
            const other = events.filter((e) => e.date === d && show(e)).length - list.length;
            const inMonth = date.getUTCMonth() === fromIso(todayIso).getUTCMonth();
            return (
              <div key={d} role="gridcell" className={`pt-month-d${d === todayIso ? " today" : ""}${inMonth ? "" : " out"}`}>
                <span className="pt-month-n">{date.getUTCDate()}</span>
                <ul>{list.slice(0, 3).map((e) => <li key={e.id + e.date}>{pill(e)}</li>)}</ul>
                {(other > 0 || list.length > 3) && (
                  <button type="button" className="sx-link pt-linkbtn pc-sub" onClick={() => { setDayIso(d); setView("day"); }}>+{other + Math.max(0, list.length - 3)} more</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "day" && (
        <section className="sx-card sx-card-body pc-day" aria-label={range}>
          {(() => {
            const list = events.filter((e) => e.date === dayIso && show(e)).sort((a, b) => a.start - b.start);
            return list.length ? <ul className="pc-day-list">{list.map((e) => <li key={e.id + e.date}>{pill(e)}</li>)}</ul> : <p className="sx-empty">Nothing on this day{filter !== "all" ? " for this filter" : ""}.</p>;
          })()}
          {!readOnly && setup && <button type="button" className="ced-add" onClick={() => add(dayIso)}>+ Add an event on {dayName(dd)}</button>}
        </section>
      )}

      <p className="sx-note">
        <XIcon name="repeat" /> Repeats weekly · Seats show for staff only; the website never shows seats, waitlists or meeting points. Changes publish to the website calendar, the newsletter and the printed calendar.
      </p>

      {open && <EventPanel key={open.id + open.date} e={open} residents={residents} todayIso={todayIso} readOnly={readOnly} brand={brand} onClose={() => setOpen(null)} onChange={update} onToast={setToast} />}
      {adding && setup && (
        <Drawer wide title="New event" sub="The same form as Post. Kinlight does the rest." onClose={() => setAdding(null)}>
          <NewEvent key={adding.n} inDrawer setup={setup} prefill={{ date: adding.date >= todayIso ? adding.date : todayIso }} extraBusy={busy} onSaved={saved} onAnother={() => add(adding.date)} />
        </Drawer>
      )}
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ a QR check-in sign, drawn from the event id */

function QrBlock({ seed }: { seed: string }) {
  const n = 21;
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [[0, 0], [n - 7, 0], [0, n - 7]] as const) {
      if (inBox(ox, oy)) { const dx = x - ox, dy = y - oy; return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0; }
      if (x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7) return 0;
    }
    return -1;
  };
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = finder(x, y);
    if (f === 1 || (f === -1 && hash(`${seed}:${x}:${y}`) % 2 === 0)) cells.push([x, y]);
  }
  return (
    <svg className="pc-qr" viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label="QR code">
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />)}
    </svg>
  );
}

/* ------------------------------------------------------------ one event, with everything about it */

function EventPanel({ e, residents, todayIso, readOnly, brand, onClose, onChange, onToast }: { e: CalEvent; residents: string[]; todayIso: string; readOnly: boolean; brand: { name: string; domain: string; phone: string }; onClose: () => void; onChange: (e: CalEvent) => void; onToast: (t: string) => void }) {
  const { site } = useStaffCommunity();
  const d = fromIso(e.date);
  const [who, setWho] = useState(residents.find((r) => !e.booked?.some((b) => b.name === r)) ?? residents[0]);
  const [taking, setTaking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ time: `${String(Math.floor(e.start / 60)).padStart(2, "0")}:${String(e.start % 60).padStart(2, "0")}`, room: e.room, what: "move" as "move" | "cancel", note: "" });
  const [told, setTold] = useState<string | null>(null);
  const past = e.date < todayIso;
  const isToday = e.date === todayIso;
  const full = e.cap !== undefined && (e.taken ?? 0) >= e.cap;
  const left = e.cap ? Math.max(0, e.cap - (e.taken ?? 0)) : undefined;
  const reqs = e.requests ?? [];
  const setReq = (id: string, patch: Partial<ReqRow>) => onChange({ ...e, requests: reqs.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const bookedN = e.booked?.length ?? e.taken ?? 0;
  const families = Math.round(bookedN * 1.3);

  const book = () => {
    if (!who) return;
    if (full) onChange({ ...e, waiting: [...(e.waiting ?? []), who], waitlist: (e.waitlist ?? 0) + 1 });
    else onChange({ ...e, booked: [{ name: who, via: "Signed up at the desk" }, ...(e.booked ?? [])], taken: (e.taken ?? 0) + 1 });
    onToast(full ? `${who} is on the waitlist and gets a text if a seat opens` : `${who} is booked. A confirmation goes by text, and a reminder on the day.`);
  };
  const approve = (r: ReqRow) => {
    if (full) {
      onChange({ ...e, requests: reqs.map((x) => (x.id === r.id ? { ...x, waitlisted: true } : x)), waiting: [...(e.waiting ?? []), r.resident], waitlist: (e.waitlist ?? 0) + 1 });
      onToast(`${first(r.resident)} is on the waitlist. ${first(r.from)} is told by text, and it confirms automatically if a seat opens.`);
      return;
    }
    const next = { ...e, requests: reqs.map((x) => (x.id === r.id ? { ...x, stage: 4 as const } : x)) };
    if (r.kind === "seat" && e.cap !== undefined) Object.assign(next, { taken: (e.taken ?? 0) + 1, booked: [{ name: r.resident, via: "Family asked, resident said yes" }, ...(e.booked ?? [])] });
    onChange(next);
    onToast(`Approved. ${first(r.from)} is told by text.`);
  };
  const saveEdit = () => {
    if (edit.what === "cancel") {
      onChange({ ...e, cancelled: true });
      setTold(`Cancelled. Kinlight told the ${bookedN} people booked and their ${families} families by text, and took it off the website, the newsletter and the printed calendar.`);
    } else {
      const [h, m] = edit.time.split(":").map(Number);
      const start = (h || 0) * 60 + (m || 0);
      const dur = (e.end ?? e.start + 60) - e.start;
      onChange({ ...e, start, end: start + dur, room: edit.room });
      setTold(`Changed to ${fmtTime(start)}${edit.room !== e.room ? ` in ${edit.room}` : ""}. Kinlight told the ${bookedN} people booked and their ${families} families by text, and updated the website and the printed calendar.`);
    }
    setEditing(false);
  };
  const viaCount = (e.booked ?? []).reduce<Record<string, number>>((m, b) => { const k = b.via.startsWith("Invited by interest") ? "Invited by interest" : b.via; m[k] = (m[k] ?? 0) + 1; return m; }, {});

  return (
    <Drawer
      wide
      title={e.title}
      sub={`${dayName(d)}, ${monthName(d)} ${d.getUTCDate()} · ${fmtRange(e.start, e.end)} · ${e.room}`}
      onClose={onClose}
      foot={
        <>
          {!readOnly && !e.cancelled && <a className="sx-btn" href="#pc-edit" onClick={(ev) => { ev.preventDefault(); setEditing(true); setTold(null); window.setTimeout(() => document.getElementById("pc-edit")?.scrollIntoView({ behavior: "smooth", block: "center" }), 30); }}><Icon name="edit" /> Change or cancel</a>}
          <a className="sx-btn sx-btn-primary" href={site("/calendar")} target="_blank" rel="noopener"><Icon name="globe" /> See it on the website</a>
        </>
      }
    >
      <p className="pt-ev-meta">
        <Badge tone={e.kind === "public" ? "accent" : e.kind === "family" ? "info" : "good"}>{eventKindLabel[e.kind]}</Badge>
        <span><span className="sx-dot" style={{ background: e.color }} /> {e.catLabel}{e.lantern ? " · Lantern" : ""}</span>
        <span>{e.rule ?? "One-off"}</span>
        {e.leader && <span>Led by {e.leader}</span>}
        {e.idea && <Badge tone="warn">Your idea · suggested by {e.idea}</Badge>}
        {e.approval && <Badge tone="warn">Waiting for approval</Badge>}
        {e.cancelled && <Badge tone="bad">Cancelled</Badge>}
      </p>
      {told && <div className={`pc-told${e.cancelled ? " cancel" : ""}`} role="status"><b>{e.cancelled ? "Cancelled" : "Changed"}</b><span>{told}</span></div>}

      <section className="pt-ev-sec">
        <h3>Details</h3>
        <p className="sx-note" style={{ margin: 0 }}><b>The website shows:</b> {webShows[e.kind]}</p>
        {e.desc && <p>{e.desc}</p>}
        {e.clash && <div className="sx-callout"><Icon name="alert" /><p>Also in {e.room} at {fmtTime(e.start)}: <b>{e.clash}</b>. Move one, or confirm they share the room.</p></div>}
      </section>

      {e.cap !== undefined && (
        <section className="pt-ev-sec">
          <h3>Seats <span className="sx-hint">staff only</span></h3>
          <p className="pt-seats"><b>{e.taken ?? 0}</b> of {e.cap} booked · {left ? `${left} left` : <Badge tone="warn">Full</Badge>}{e.waitlist ? ` · ${e.waitlist} on the waitlist` : ""}</p>
        </section>
      )}

      {!readOnly && reqs.length > 0 && (
        <section className="pt-ev-sec">
          <h3>Requests in progress</h3>
          <ul className="pt-reqs">
            {reqs.map((r) => {
              const rf = first(r.resident);
              const rep = r.rep ? first(r.rep.name) : "";
              const steps = ["Family asked", r.lantern ? (r.askedRep ? `${rep} said yes` : "Asked in person") : `${rf} said yes`, r.waitlisted ? "Waitlist" : r.declined ? "Declined" : "You approve", "Family told"];
              const stage = r.waitlisted ? 4 : r.stage;
              return (
                <li key={r.id}>
                  <p><b>{r.from}</b> <span className="sx-hint">{r.relation} of {r.resident}</span> · {r.kind === "rsvp" ? `${r.party} ${r.party === 1 ? "person" : "people"}` : `a seat for ${rf}`}{r.lantern && <> · <Badge tone="info">Lantern</Badge></>}</p>
                  <ol className="al-steps" aria-label="Progress">
                    {steps.map((s, i) => <li key={s + i} className={i + 1 < stage || (i + 1 === stage && stage === 4) ? "done" : i + 1 === stage ? "now" : ""}>{s}</li>)}
                  </ol>
                  {r.stage === 2 && !r.lantern && (
                    <p className="sx-hint">Waiting for {rf} to answer the text. <button type="button" className="sx-link pt-linkbtn" onClick={() => setReq(r.id, { stage: 3 })}>{rf} said yes in person</button></p>
                  )}
                  {r.stage === 2 && r.lantern && !r.askedRep && (
                    <>
                      <p className="sx-hint">{rf} lives in Lantern, so no text goes to {rf}. Ask in person{r.rep ? `, or ask ${r.rep.name} (${r.rep.relation.toLowerCase()}), who decides for ${rf}` : ""}.</p>
                      <div className="pt-act">
                        <button type="button" className="sx-btn sx-btn-sm" onClick={() => setReq(r.id, { stage: 3 })}><Icon name="check" /> {rf} said yes in person</button>
                        {r.rep && <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setReq(r.id, { askedRep: true }); onToast(`Text sent to ${r.rep!.name}. Their yes comes back here.`); }}><Icon name="sms" /> Ask {rep}</button>}
                      </div>
                    </>
                  )}
                  {r.stage === 2 && r.lantern && r.askedRep && (
                    <p className="sx-hint">Asked {r.rep?.name} by text. <button type="button" className="sx-link pt-linkbtn" onClick={() => setReq(r.id, { stage: 3 })}>{rep} said yes</button></p>
                  )}
                  {r.stage === 3 && !r.declined && !r.waitlisted && (
                    full && r.kind === "seat" ? (
                      <>
                        <p className="sx-hint"><b>{e.title} is full.</b> Approving would overbook it. Add {rf} to the waitlist: it confirms automatically if a seat opens, and {first(r.from)} is told either way.</p>
                        <div className="pt-act"><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => approve(r)}><Icon name="plus" /> Add to waitlist</button></div>
                      </>
                    ) : (
                      <div className="pt-act">
                        <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => approve(r)}><Icon name="check" /> Approve</button>
                        <button type="button" className="sx-btn sx-btn-sm" onClick={() => setReq(r.id, { stage: 4, declined: true })}>Decline</button>
                      </div>
                    )
                  )}
                  {r.waitlisted && <p className="sx-hint">On the waitlist. Confirms automatically if a seat opens; {first(r.from)} was told.</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!readOnly && (e.booked || e.cap !== undefined) && (
        <section className="pt-ev-sec">
          <h3>Who’s booked ({e.booked?.length ?? 0})</h3>
          {Object.keys(viaCount).length > 0 && <p className="sx-hint">{Object.entries(viaCount).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(" · ")}</p>}
          <ul className="pt-booked">
            {(e.booked ?? []).map((b, i) => <li key={b.name + i}><span>{b.name}</span><small>{b.via}</small></li>)}
          </ul>
          {!past && !e.cancelled && (
            <div className="pt-desk">
              <label>
                <span className="sx-lbl">Book a resident who signed up in person</span>
                <select value={who} onChange={(ev) => setWho(ev.target.value)}>
                  {residents.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <button type="button" className="sx-btn sx-btn-sm" onClick={book}><Icon name="plus" /> {full ? "Add to waitlist" : "Book"}</button>
            </div>
          )}
        </section>
      )}

      {!readOnly && e.waiting && e.waiting.length > 0 && (
        <section className="pt-ev-sec">
          <h3>Waitlist ({e.waiting.length})</h3>
          <p className="sx-hint">If a seat opens, the next person gets a text, in this order.</p>
          <ol className="pt-booked">{e.waiting.map((n, i) => <li key={n + i}><span>{i + 1}. {n}</span><small>{i === 0 ? "Next to be texted" : "Waiting"}</small></li>)}</ol>
        </section>
      )}

      {!readOnly && (
        <section className="pt-ev-sec">
          <h3>Personal invites</h3>
          {e.lantern ? (
            <p>Lantern residents aren’t texted: the care team invites them in person.</p>
          ) : e.invites ? (
            <div className="pc-invite">
              <p><b>Invited {e.invites.invited} who like {e.invites.interests.join(" and ").toLowerCase()} · {e.invites.yes} said yes</b></p>
              <q>{e.invites.text}</q>
              <span className="sx-hint">{e.invites.sentAt}. Each YES books them, after a confirmation.</span>
            </div>
          ) : (
            <p className="sx-hint">No personal invites for this one: it doesn’t match residents’ interests, or it’s open to everyone.</p>
          )}
        </section>
      )}

      {!readOnly && (past || isToday) && (
        <section className="pt-ev-sec">
          <h3>Attendance</h3>
          {e.came ? (
            <>
              <p><b>{e.came.n}</b> of {e.came.of} came</p>
              <div className="pc-split">
                <div><b>{e.came.qr}</b><span>{e.lantern ? "QR: not used in Lantern" : "Checked in by QR code"}</span></div>
                <div><b>{e.came.staff}</b><span>{e.came.how === "tap" ? `Tapped in by ${first(e.came.by)}` : `From a photo of the paper sheet, by ${first(e.came.by)}`}</span></div>
                <div><b>{e.came.of - e.came.n}</b><span>Booked but didn’t come</span></div>
              </div>
            </>
          ) : taking ? (
            <TakeAttendance activities={[{ id: e.id, title: e.title, when: fmtTime(e.start), place: e.room, pool: residents.slice(0, 18), expected: e.taken ?? 12 }]} />
          ) : (
            <button type="button" className="sx-btn sx-btn-sm" onClick={() => setTaking(true)}><Icon name="users" /> Take attendance</button>
          )}
        </section>
      )}

      {!readOnly && (past || isToday) && (
        <section className="pt-ev-sec">
          <h3>Photos from this event</h3>
          {e.photos?.length ? (
            <div className="pc-photos">{e.photos.map((src) => <span key={src}><Image src={src} alt="" fill sizes="100px" /></span>)}</div>
          ) : <p className="sx-hint">No photos yet.</p>}
          <p><Link className="sx-btn sx-btn-sm" href={`/staff/post?type=photos&event=${encodeURIComponent(e.id)}`}><Icon name="image" /> Add photos</Link></p>
        </section>
      )}

      {!readOnly && !e.cancelled && (
        <section className="pt-ev-sec">
          <h3>Print</h3>
          <div className="pc-prints">
            <div className="pc-print">
              <div className="pv-flyer">
                <div className="pv-flyer-top">{brand.name}</div>
                <span />
                <div className="pv-flyer-t">
                  <b>{e.title.replace(/^Bus Trip: /, "")}</b>
                  <span>{e.rule ?? `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`} · {fmtTime(e.start)}</span>
                  <small>{e.kind === "public" ? `Everyone welcome · ${brand.domain}` : e.cap ? "Sign up at the front desk" : e.room}</small>
                </div>
                <div className="pv-flyer-foot">Questions? {brand.phone}</div>
              </div>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => onToast(`Large-print flyer for “${e.title}” sent to the front desk printer`)}><Icon name="printer" /> Print the flyer</button>
            </div>
            <div className="pc-print">
              <div className="pc-qr-sign" aria-label={`QR check-in sign for ${e.title}`}>
                <b>{e.title}</b>
                <strong>Scan to check in</strong>
                <QrBlock seed={e.id} />
                <small>{e.lantern ? "Staff check residents in" : "Use your phone’s camera. No app, no login."}</small>
              </div>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => onToast(`QR check-in sign for “${e.title}” sent to the front desk printer`)}><Icon name="printer" /> Print the QR sign</button>
            </div>
          </div>
        </section>
      )}

      {!readOnly && editing && (
        <section className="pt-ev-sec" id="pc-edit">
          <h3>Change or cancel</h3>
          <div className="pc-edit sx-form">
            <div className="sx-seg" role="group" aria-label="Change or cancel">
              <button type="button" aria-pressed={edit.what === "move"} onClick={() => setEdit({ ...edit, what: "move" })}>Change it</button>
              <button type="button" aria-pressed={edit.what === "cancel"} onClick={() => setEdit({ ...edit, what: "cancel" })}>Cancel it</button>
            </div>
            {edit.what === "move" ? (
              <div className="sx-row">
                <label>Starts<input type="time" value={edit.time} step={300} onChange={(ev) => setEdit({ ...edit, time: ev.target.value })} /></label>
                <label>Room<input value={edit.room} onChange={(ev) => setEdit({ ...edit, room: ev.target.value })} /></label>
              </div>
            ) : (
              <p className="sx-hint">It comes off the website, the newsletter and the printed calendar.</p>
            )}
            <p className="sx-hint">{bookedN ? `Kinlight tells the ${bookedN} people booked and their families by text, automatically.` : "Nobody is booked yet, so there’s nobody to tell."}{e.rule ? " This changes this date only." : ""}</p>
            <div className="pt-act">
              <button type="button" className={`sx-btn sx-btn-sm ${edit.what === "cancel" ? "sx-btn-terra" : "sx-btn-primary"}`} onClick={saveEdit}><Icon name="check" /> {edit.what === "cancel" ? "Cancel the event" : "Save the change"}</button>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEditing(false)}>Keep it as it is</button>
            </div>
          </div>
        </section>
      )}
    </Drawer>
  );
}
