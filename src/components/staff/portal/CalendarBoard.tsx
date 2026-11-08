"use client";

// The calendar, where each event holds everything about it: who's booked, family requests in progress (family asked,
// resident said yes, staff approve, family told), the waitlist, attendance and a flyer. Week and month views, room
// clashes, and residents' ideas beside it with "make it an event". Seats, waitlists and meeting points stay with staff.
import { useEffect, useMemo, useState } from "react";
import { eventKindLabel, type EventKind } from "@/data/shared";
import { addDays, dayName, fmtRange, fmtTime, fromIso, iso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";
import { TakeAttendance } from "../alpha/Attendance";
import { useStaffCommunity } from "../StaffCommunity";
import { Badge, XIcon } from "../ui";
import { Drawer } from "./Drawer";

export interface Booking { name: string; via: "Replied YES by text" | "Signed up at the desk" | "Family request" }
export interface ReqRow { id: string; from: string; relation: string; resident: string; party: number; kind: "rsvp" | "seat"; stage: 1 | 2 | 3 | 4; declined?: boolean }

export interface CalEvent {
  id: string; date: string; start: number; end?: number; title: string; room: string; cat: string; color: string; catLabel: string;
  kind: EventKind;
  cap?: number; taken?: number; waitlist?: number; lantern?: boolean; leader?: string; desc?: string; rule?: string;
  booked?: Booking[]; waiting?: string[]; clash?: string; isNew?: boolean;
  requests?: ReqRow[];
  /** Attendance, once taken. */
  came?: { n: number; of: number; how: string };
  /** A resident's suggestion that became this event. */
  idea?: string;
}
export interface Idea { id: string; text: string; who?: string; from: string; status: string; votes: number; ago: string; event?: { title: string; when: string } }

const kindHelp: Record<EventKind, string> = {
  public: "Anyone can come. The website shows full details and a sign-up form; each sign-up is a lead for sales.",
  family: "For families. The website says it’s happening; families RSVP by replying to their text or email, the resident says yes, then you approve.",
  resident: "A resident activity or outing. The website shows name, day, time and description only. Residents reply YES or sign up with you; families can ask for a seat.",
};
const stages = ["Family asked", "Resident said yes", "You approve", "Family told"];

const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const first = (n = "") => n.split(" ")[0];

export function CalendarBoard({ events: initial, weekStarts, todayIso, rooms, residents, ideas: initialIdeas }: { events: CalEvent[]; weekStarts: string[]; todayIso: string; rooms: string[]; residents: string[]; ideas: Idea[] }) {
  const [events, setEvents] = useState(initial);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [view, setView] = useState<"week" | "month">("week");
  const [w, setW] = useState(0);
  const [filter, setFilter] = useState<"all" | "lantern" | "seats" | "open" | "conflicts">("all");
  const [open, setOpen] = useState<CalEvent | null>(null);
  const [adding, setAdding] = useState<{ date: string; title?: string; idea?: string } | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => iso(addDays(fromIso(weekStarts[w]), i))), [w, weekStarts]);
  const monthDays = useMemo(() => {
    const t = fromIso(todayIso);
    const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
    const startCell = addDays(m1, -m1.getUTCDay());
    return Array.from({ length: 35 }, (_, i) => iso(addDays(startCell, i)));
  }, [todayIso]);
  const show = (e: CalEvent) => (filter === "lantern" ? e.lantern : filter === "seats" ? !!e.cap : filter === "open" ? e.kind !== "resident" : filter === "conflicts" ? !!e.clash : true);
  const clashes = events.filter((e) => e.clash && e.date >= todayIso);
  const firstD = fromIso(days[0]), lastD = fromIso(days[6]);
  const range = view === "week" ? `${monthName(firstD).slice(0, 3)} ${firstD.getUTCDate()} – ${monthName(lastD).slice(0, 3)} ${lastD.getUTCDate()}` : `${monthName(fromIso(todayIso))}`;
  const update = (e: CalEvent) => { setEvents((xs) => xs.map((x) => (x.id === e.id && x.date === e.date ? e : x))); setOpen(e); };

  const pill = (e: CalEvent) => {
    const full = e.cap && (e.taken ?? 0) >= e.cap;
    const waiting = e.requests?.filter((r) => r.stage === 3 && !r.declined).length ?? 0;
    return (
      <button type="button" className={`ced-ev ${e.clash ? "conflict" : ""} ${e.isNew ? "new" : ""}`} style={{ borderLeftColor: e.color }} onClick={() => setOpen(e)}>
        <span className="t">
          {fmtTime(e.start)}
          {e.rule ? <span title={e.rule}><XIcon name="repeat" /><span className="vh"> {e.rule}</span></span> : e.clash ? <Icon name="alert" /> : null}
        </span>
        {e.title}
        {e.kind !== "resident" && <span className={`ced-kind ${e.kind}`}>{e.kind === "public" ? "Public" : "Family"}</span>}
        {e.idea && <span className="ced-kind idea">Your idea</span>}
        {e.cap ? <span className={`cap ${full ? "full" : ""}`}>{e.taken}/{e.cap}{full && e.waitlist ? ` · ${e.waitlist} waiting` : ""}</span> : null}
        {waiting > 0 && <span className="cap pt-ced-wait">{waiting} to approve</span>}
      </button>
    );
  };

  return (
    <div className="pt-cal">
      <div className="pt-cal-main">
        <div className="sx-toolbar">
          <div>
            <div className="sx-seg" role="group" aria-label="View">
              <button type="button" aria-pressed={view === "week"} onClick={() => setView("week")}>Week</button>
              <button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>Month</button>
            </div>
            {view === "week" && (
              <>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.max(0, w - 1))} disabled={w === 0} aria-label="Previous week"><Icon name="left" /></button>
                <b className="pt-range" aria-live="polite">{range}</b>
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.min(weekStarts.length - 1, w + 1))} disabled={w === weekStarts.length - 1} aria-label="Next week"><Icon name="right" /></button>
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
            <button type="button" className="sx-btn sx-btn-primary" onClick={() => setAdding({ date: days.includes(todayIso) ? todayIso : days[1] })}>
              <Icon name="plus" /> Add event
            </button>
          </div>
        </div>

        {clashes.length > 0 && (
          <div className="sx-callout">
            <Icon name="alert" />
            <p>
              <b>Room clash:</b> {clashes[0].title} and {clashes[0].clash} are both in {clashes[0].room} at {fmtTime(clashes[0].start)} on {dayName(fromIso(clashes[0].date))}.{" "}
              <button type="button" className="sx-link pt-linkbtn" onClick={() => setOpen(clashes[0])}>Review</button>
            </p>
          </div>
        )}

        {view === "week" ? (
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
                  <button type="button" className="ced-add" onClick={() => setAdding({ date: d })}>+ Add</button>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="pt-month" role="grid" aria-label={range}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="pt-month-h" role="columnheader">{d}</div>)}
            {monthDays.map((d) => {
              const date = fromIso(d);
              const list = events.filter((e) => e.date === d && show(e) && (e.kind !== "resident" || e.cap || e.idea)).sort((a, b) => a.start - b.start);
              const other = events.filter((e) => e.date === d && show(e)).length - list.length;
              const inMonth = date.getUTCMonth() === fromIso(todayIso).getUTCMonth();
              return (
                <div key={d} role="gridcell" className={`pt-month-d${d === todayIso ? " today" : ""}${inMonth ? "" : " out"}`}>
                  <span className="pt-month-n">{date.getUTCDate()}</span>
                  <ul>{list.slice(0, 3).map((e) => <li key={e.id + e.date}>{pill(e)}</li>)}</ul>
                  {(other > 0 || list.length > 3) && <small>+{other + Math.max(0, list.length - 3)} activities</small>}
                </div>
              );
            })}
          </div>
        )}
        <p className="sx-note">
          <XIcon name="repeat" /> Repeats weekly · Seats taken show for staff only; the website never shows seats. Saving publishes to the website calendar, the Sunday email and the printed large-print calendar. Residents who reply YES to a text are booked automatically.
        </p>
      </div>

      <aside className="sx-card pt-ideas" aria-labelledby="pt-ideas-h">
        <header className="sx-card-head">
          <div>
            <h2 id="pt-ideas-h">Resident ideas</h2>
            <p>From the suggestion slips and the QR code.</p>
          </div>
        </header>
        <ul className="pt-ideas-list">
          {ideas.map((x) => (
            <li key={x.id}>
              <p>“{x.text}”</p>
              <small>{x.who ? `${x.who} · ` : "No name · "}{x.from} · {x.ago}</small>
              {x.status === "On the calendar" ? (
                <span className="pt-idea-done"><Icon name="check" /> On the calendar{x.event ? `: ${x.event.title}, ${x.event.when}` : ""}. {x.who ? `${first(x.who)} was told by text.` : ""}</span>
              ) : x.status === "Not this time" ? (
                <span className="sx-hint">Not this time</span>
              ) : (
                <button type="button" className="sx-btn sx-btn-sm" onClick={() => setAdding({ date: days[Math.min(6, 3)], title: x.text.replace(/^(A |An |More |Bring back the )/i, "").replace(/^\w/, (c) => c.toUpperCase()), idea: x.id })}>
                  <Icon name="plus" /> Make it an event
                </button>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {open && <EventPanel e={open} residents={residents} todayIso={todayIso} onClose={() => setOpen(null)} onChange={update} onToast={setToast} />}
      {adding && (
        <AddEvent
          date={adding.date}
          title={adding.title}
          rooms={rooms}
          events={events}
          onClose={() => setAdding(null)}
          onSave={(e) => {
            const idea = ideas.find((x) => x.id === adding.idea);
            setEvents((x) => [...x, { ...e, idea: idea?.who }]);
            if (idea) setIdeas((xs) => xs.map((x) => (x.id === idea.id ? { ...x, status: "On the calendar", event: { title: e.title, when: `${dayName(fromIso(e.date)).slice(0, 3)} ${fmtTime(e.start)}` } } : x)));
            setAdding(null);
            const i = weekStarts.findIndex((ws) => e.date >= ws && e.date <= iso(addDays(fromIso(ws), 6)));
            if (i >= 0) setW(i);
            setToast(idea?.who ? `“${e.title}” is on the calendar. ${first(idea.who)} gets a text: “Your idea made the calendar!”` : `“${e.title}” added and published`);
          }}
        />
      )}
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ one event, with everything about it */

function EventPanel({ e, residents, todayIso, onClose, onChange, onToast }: { e: CalEvent; residents: string[]; todayIso: string; onClose: () => void; onChange: (e: CalEvent) => void; onToast: (t: string) => void }) {
  const { site } = useStaffCommunity();
  const d = fromIso(e.date);
  const [who, setWho] = useState(residents.find((r) => !e.booked?.some((b) => b.name === r)) ?? residents[0]);
  const [taking, setTaking] = useState(false);
  const past = e.date < todayIso;
  const isToday = e.date === todayIso;
  const left = e.cap ? Math.max(0, e.cap - (e.taken ?? 0)) : undefined;
  const reqs = e.requests ?? [];
  const setReq = (id: string, patch: Partial<ReqRow>) => onChange({ ...e, requests: reqs.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const book = () => {
    if (!who) return;
    const full = e.cap !== undefined && (e.taken ?? 0) >= e.cap;
    if (full) onChange({ ...e, waiting: [...(e.waiting ?? []), who], waitlist: (e.waitlist ?? 0) + 1 });
    else onChange({ ...e, booked: [{ name: who, via: "Signed up at the desk" }, ...(e.booked ?? [])], taken: (e.taken ?? 0) + 1 });
    onToast(full ? `${who} is on the waitlist and will get a text if a seat opens` : `${who} is booked. A confirmation with the details goes by text.`);
  };

  return (
    <Drawer
      wide
      title={e.title}
      sub={`${dayName(d)}, ${monthName(d)} ${d.getUTCDate()} · ${fmtRange(e.start, e.end)} · ${e.room}`}
      onClose={onClose}
      foot={
        <>
          <button type="button" className="sx-btn" onClick={() => onToast(`Large-print flyer for “${e.title}” sent to the front desk printer`)}><Icon name="printer" /> Print a flyer</button>
          <a className="sx-btn" href={`/staff/post?type=change`}><Icon name="edit" /> Change or cancel</a>
          <a className="sx-btn sx-btn-primary" href={site("/calendar")} target="_blank" rel="noopener"><Icon name="globe" /> See it on the website</a>
        </>
      }
    >
      <p className="pt-ev-meta">
        <Badge tone={e.kind === "public" ? "accent" : e.kind === "family" ? "info" : "good"}>{eventKindLabel[e.kind]}</Badge>
        <span><span className="sx-dot" style={{ background: e.color }} /> {e.catLabel}{e.lantern ? " · Lantern" : ""}</span>
        {e.rule && <span>{e.rule}</span>}
        {e.leader && <span>Led by {e.leader}</span>}
        {e.idea && <Badge tone="warn">Your idea · {e.idea}</Badge>}
      </p>
      <p className="sx-note" style={{ margin: 0 }}><b>On the website:</b> {kindHelp[e.kind]}</p>
      {e.desc && <p style={{ margin: 0 }}>{e.desc}</p>}
      {e.clash && <div className="sx-callout"><Icon name="alert" /><p>Also in {e.room} at {fmtTime(e.start)}: <b>{e.clash}</b>. Move one, or confirm they share the room.</p></div>}

      {e.cap !== undefined && (
        <section className="pt-ev-sec">
          <h3>Seats <span className="sx-hint">staff only</span></h3>
          <p className="pt-seats"><b>{e.taken ?? 0}</b> of {e.cap} booked · {left ? `${left} left` : <Badge tone="warn">Full</Badge>}{e.waitlist ? ` · ${e.waitlist} on the waitlist` : ""}</p>
        </section>
      )}

      {reqs.length > 0 && (
        <section className="pt-ev-sec">
          <h3>Family requests</h3>
          <ul className="pt-reqs">
            {reqs.map((r) => (
              <li key={r.id}>
                <p><b>{r.from}</b> <span className="sx-hint">{r.relation} of {r.resident}</span> · {r.kind === "rsvp" ? `${r.party} ${r.party === 1 ? "person" : "people"}` : `a seat for ${first(r.resident)}`}</p>
                <ol className="al-steps" aria-label="Progress">
                  {stages.map((s, i) => (
                    <li key={s} className={r.declined && i >= 2 ? "done" : i + 1 < r.stage ? "done" : i + 1 === r.stage ? "now" : ""}>{i === 1 ? `${first(r.resident)} said yes` : r.declined && i === 2 ? "Declined" : s}</li>
                  ))}
                </ol>
                {r.stage === 2 && <p className="sx-hint">Waiting for {first(r.resident)} to answer the text. <button type="button" className="sx-link pt-linkbtn" onClick={() => setReq(r.id, { stage: 3 })}>{first(r.resident)} said yes in person</button></p>}
                {r.stage === 3 && !r.declined && (
                  <div className="pt-act">
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setReq(r.id, { stage: 4 })}><Icon name="check" /> Approve</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => setReq(r.id, { stage: 4, declined: true })}>Decline</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(e.booked || e.cap !== undefined) && (
        <section className="pt-ev-sec">
          <h3>Who’s booked ({e.booked?.length ?? 0})</h3>
          <ul className="pt-booked">
            {(e.booked ?? []).map((b, i) => (
              <li key={b.name + i}><span>{b.name}</span><small>{b.via}</small></li>
            ))}
          </ul>
          {!past && (
            <div className="pt-desk">
              <label>
                <span className="sx-lbl">Signed up at the desk</span>
                <select value={who} onChange={(ev) => setWho(ev.target.value)}>
                  {residents.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              <button type="button" className="sx-btn sx-btn-sm" onClick={book}><Icon name="plus" /> Book</button>
            </div>
          )}
        </section>
      )}

      {e.waiting && e.waiting.length > 0 && (
        <section className="pt-ev-sec">
          <h3>Waitlist ({e.waiting.length})</h3>
          <ol className="pt-booked">{e.waiting.map((n) => <li key={n}><span>{n}</span><small>Gets a text if a seat opens</small></li>)}</ol>
        </section>
      )}

      {(past || isToday) && (
        <section className="pt-ev-sec">
          <h3>Attendance</h3>
          {e.came ? (
            <p><b>{e.came.n}</b> of {e.came.of} came · {e.came.how}</p>
          ) : taking ? (
            <TakeAttendance activities={[{ id: e.id, title: e.title, when: fmtTime(e.start), place: e.room, pool: residents.slice(0, 18), expected: e.taken ?? 12 }]} />
          ) : (
            <button type="button" className="sx-btn sx-btn-sm" onClick={() => setTaking(true)}><Icon name="users" /> Take attendance</button>
          )}
        </section>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------ add an event */

function AddEvent({ date, title, rooms, events, onClose, onSave }: { date: string; title?: string; rooms: string[]; events: CalEvent[]; onClose: () => void; onSave: (e: CalEvent) => void }) {
  const [f, setF] = useState({ title: title ?? "Holiday Card Making", date, time: "14:00", end: "15:00", room: rooms.find((r) => /art/i.test(r)) ?? rooms[0], cap: "", repeat: "once", lantern: false, kind: "resident" as EventKind });
  const start = toMin(f.time), end = toMin(f.end);
  const clash = events.find((e) => e.date === f.date && e.room === f.room && f.room !== "Lobby" && f.room !== "All floors" && start < (e.end ?? e.start + 60) && end > e.start);
  const d = fromIso(f.date || date);
  const set = (k: keyof typeof f) => (ev: { target: { value: string } }) => setF({ ...f, [k]: ev.target.value });
  return (
    <Drawer
      title="Add event"
      sub="Publishes to the website calendar, the Sunday email and the printed large-print calendar"
      onClose={onClose}
      foot={
        <>
          <button type="button" className="sx-btn" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="sx-btn sx-btn-primary"
            disabled={!f.title}
            onClick={() =>
              onSave({
                id: `new-${Date.now()}`, kind: f.kind, date: f.date, start, end, title: f.title, room: f.room, cat: f.lantern ? "lantern" : "clubs",
                color: f.lantern ? "var(--c-lantern)" : "var(--c-clubs)", catLabel: f.lantern ? "Lantern" : "Clubs & games", cap: Number(f.cap) || undefined,
                taken: Number(f.cap) ? 0 : undefined, lantern: f.lantern, rule: f.repeat === "weekly" ? `Every ${dayName(d)}` : undefined, booked: Number(f.cap) ? [] : undefined, isNew: true,
              })
            }
          >
            <Icon name="check" /> Save and publish
          </button>
        </>
      }
    >
      <div className="sx-form">
        <label>Title<input value={f.title} onChange={set("title")} /></label>
        <fieldset className="ced-kinds">
          <legend className="sx-lbl">Who is it for?</legend>
          {(["resident", "family", "public"] as const).map((k) => (
            <label key={k} className={f.kind === k ? "on" : ""}>
              <input type="radio" name="ev-kind" checked={f.kind === k} onChange={() => setF({ ...f, kind: k })} />
              <span><b>{eventKindLabel[k]}</b><small>{kindHelp[k]}</small></span>
            </label>
          ))}
        </fieldset>
        <div className="sx-row3">
          <label>Date<input type="date" value={f.date} onChange={set("date")} /></label>
          <label>Starts<input type="time" value={f.time} onChange={set("time")} step={300} /></label>
          <label>Ends<input type="time" value={f.end} onChange={set("end")} step={300} /></label>
        </div>
        <div className="sx-row">
          <label>Room or meeting point<select value={f.room} onChange={set("room")}>{rooms.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Seats<input type="number" min={0} value={f.cap} onChange={set("cap")} placeholder="No limit" /></label>
        </div>
        <p className="sx-hint" style={{ margin: 0 }}>{f.kind === "resident" ? "The room, meeting point and seats stay with staff: not shown publicly for resident activities." : "Seats stay with staff; the place is shown on the website so people know where to come."}</p>
        <label>Repeats<select value={f.repeat} onChange={set("repeat")}><option value="once">Does not repeat</option><option value="weekly">Every {dayName(d)}</option></select></label>
        <label className="sx-check"><input type="checkbox" checked={f.lantern} onChange={(ev) => setF({ ...f, lantern: ev.target.checked })} /> Show in the Lantern calendar</label>
        {clash ? (
          <div className="sx-callout" role="alert"><Icon name="alert" /><p><b>{f.room} is booked</b> for {clash.title}, {fmtRange(clash.start, clash.end)}. Choose another room or time.</p></div>
        ) : (
          <div className="sx-callout good"><Icon name="check" /><p>{f.room} is free {fmtRange(start, end)}.</p></div>
        )}
      </div>
    </Drawer>
  );
}
