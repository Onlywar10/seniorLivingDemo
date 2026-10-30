"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, dayName, fmtRange, fmtTime, fromIso, iso, monthName } from "@/lib/clock";
import { Icon } from "../Icon";
import { useStaffCommunity } from "./StaffCommunity";
import { Badge, XIcon } from "./ui";

export interface EdEvent {
  id: string; date: string; start: number; end?: number; title: string; room: string; cat: string; color: string; catLabel: string;
  cap?: number; taken?: number; waitlist?: number; harbor?: boolean; leader?: string; desc?: string; rule?: string;
  going?: string[]; waiting?: string[]; clash?: string; isNew?: boolean;
}

const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

export function CalendarEditor({ events: initial, weekStarts, todayIso, rooms }: { events: EdEvent[]; weekStarts: string[]; todayIso: string; rooms: string[] }) {
  const [events, setEvents] = useState(initial);
  const [w, setW] = useState(0);
  const [filter, setFilter] = useState<"all" | "harbor" | "trips" | "conflicts">("all");
  const [open, setOpen] = useState<EdEvent | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => iso(addDays(fromIso(weekStarts[w]), i))), [w, weekStarts]);
  const show = (e: EdEvent) => (filter === "harbor" ? e.harbor : filter === "trips" ? !!e.cap : filter === "conflicts" ? !!e.clash : true);
  const clashes = events.filter((e) => e.clash && e.date >= todayIso);
  const weekOf = (date: string) => weekStarts.findIndex((ws) => date >= ws && date <= iso(addDays(fromIso(ws), 6)));
  const first = fromIso(days[0]), last = fromIso(days[6]);
  const range = `${monthName(first).slice(0, 3)} ${first.getUTCDate()} – ${monthName(last).slice(0, 3)} ${last.getUTCDate()}`;

  return (
    <>
      <div className="sx-toolbar">
        <div>
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.max(0, w - 1))} disabled={w === 0} aria-label="Previous week">
            <Icon name="left" />
          </button>
          <b style={{ minWidth: 130, textAlign: "center" }} aria-live="polite">{range}</b>
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => setW(Math.min(weekStarts.length - 1, w + 1))} disabled={w === weekStarts.length - 1} aria-label="Next week">
            <Icon name="right" />
          </button>
          {w > 0 && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setW(0)}>This week</button>}
        </div>
        <div>
          <div className="sx-chips" role="group" aria-label="Show">
            {([["all", "All events"], ["harbor", "Harbor"], ["trips", "Trips & sign-ups"], ["conflicts", "Room conflicts"]] as const).map(([k, l]) => (
              <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <button type="button" className="sx-btn sx-btn-primary" onClick={() => setAdding(days.includes(todayIso) ? todayIso : days[1])}>
            <Icon name="plus" /> Add event
          </button>
        </div>
      </div>

      {clashes.length > 0 && (
        <div className="sx-callout">
          <Icon name="alert" />
          <p>
            <b>Room conflict:</b> {clashes[0].title} and {clashes[0].clash} are both in {clashes[0].room} at {fmtTime(clashes[0].start)} on {dayName(fromIso(clashes[0].date))}, {monthName(fromIso(clashes[0].date))} {fromIso(clashes[0].date).getUTCDate()}.{" "}
            <button type="button" className="sx-link" style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }} onClick={() => { setW(Math.max(0, weekOf(clashes[0].date))); setOpen(clashes[0]); }}>Review</button>
          </p>
        </div>
      )}

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
              <ul className="ced-list">
                {list.map((e) => {
                  const full = e.cap && (e.taken ?? 0) >= e.cap;
                  return (
                    <li key={e.id}>
                      <button type="button" className={`ced-ev ${e.clash ? "conflict" : ""} ${e.isNew ? "new" : ""}`} style={{ borderLeftColor: e.color }} onClick={() => setOpen(e)}>
                        <span className="t">
                          {fmtTime(e.start)}
                          {e.rule ? <span title={e.rule}><XIcon name="repeat" /><span className="vh"> {e.rule}</span></span> : e.clash ? <Icon name="alert" /> : null}
                        </span>
                        {e.title}
                        {e.cap ? <span className={`cap ${full ? "full" : ""}`}>{e.taken}/{e.cap}{full && e.waitlist ? ` · ${e.waitlist} waiting` : ""}</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="ced-add" onClick={() => setAdding(d)}>+ Add</button>
            </section>
          );
        })}
      </div>
      <p className="sx-note">
        <XIcon name="repeat" /> Repeats weekly · Capped events show seats taken. Changes publish to the website and family app as soon as you save.
      </p>

      {open && <EventDrawer e={open} onClose={() => setOpen(null)} />}
      {adding && (
        <AddDrawer
          date={adding}
          rooms={rooms}
          events={events}
          onClose={() => setAdding(null)}
          onSave={(e) => {
            setEvents((x) => [...x, e]);
            setAdding(null);
            const i = weekStarts.findIndex((ws) => { const s = fromIso(ws); return e.date >= ws && e.date <= iso(addDays(s, 6)); });
            if (i >= 0) setW(i);
            setToast(`“${e.title}” added and published to the website`);
          }}
        />
      )}
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </>
  );
}

function Drawer({ title, sub, onClose, children, foot }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode; foot?: React.ReactNode }) {
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="sx-drawer" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="sx-drawer-box" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sx-drawer-h">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="sx-x" onClick={onClose} aria-label="Close" autoFocus>
            <Icon name="x" />
          </button>
        </div>
        <div className="sx-drawer-b">{children}</div>
        {foot && <div className="sx-drawer-f">{foot}</div>}
      </div>
    </div>
  );
}

function EventDrawer({ e, onClose }: { e: EdEvent; onClose: () => void }) {
  const { site } = useStaffCommunity();
  const d = fromIso(e.date);
  const [sent, setSent] = useState(false);
  return (
    <Drawer
      title={e.title}
      sub={`${dayName(d)}, ${monthName(d)} ${d.getUTCDate()} · ${fmtRange(e.start, e.end)}`}
      onClose={onClose}
      foot={
        <>
          <button type="button" className="sx-btn" onClick={onClose}><Icon name="edit" /> Edit</button>
          {e.cap ? (
            <button type="button" className="sx-btn sx-btn-primary" onClick={() => setSent(true)} disabled={sent}>
              <Icon name="sms" /> {sent ? "Reminder sent" : "Text a reminder to families"}
            </button>
          ) : (
            <a className="sx-btn sx-btn-primary" href={site("/calendar")} target="_blank">See on website</a>
          )}
        </>
      }
    >
      <dl className="sx-dl">
        <dt>Room</dt><dd>{e.room}</dd>
        <dt>Category</dt><dd><span className="sx-dot" style={{ background: e.color }} />{e.catLabel}{e.harbor ? " · Harbor" : ""}</dd>
        {e.leader && (<><dt>Led by</dt><dd>{e.leader}</dd></>)}
        <dt>Repeats</dt><dd>{e.rule ?? "One-time event"}</dd>
        {e.cap ? (<><dt>Seats</dt><dd>{e.taken} of {e.cap} taken{e.waitlist ? ` · ${e.waitlist} on the waitlist` : ` · ${e.cap - (e.taken ?? 0)} left`}</dd></>) : null}
      </dl>
      {e.desc && <p style={{ margin: 0 }}>{e.desc}</p>}
      {e.clash && (
        <div className="sx-callout">
          <Icon name="alert" />
          <p>Also booked in {e.room} at {fmtTime(e.start)}: <b>{e.clash}</b>. Move one of them, or confirm they share the room.</p>
        </div>
      )}
      {e.going && (
        <div>
          <h3 className="tour-day">Going ({e.going.length})</h3>
          <ol className="rsvp">
            {e.going.map((n) => <li key={n}>{n}</li>)}
          </ol>
        </div>
      )}
      {e.waiting && e.waiting.length > 0 && (
        <div>
          <h3 className="tour-day">Waitlist ({e.waiting.length})</h3>
          <ol className="rsvp">
            {e.waiting.map((n) => <li key={n}>{n} <Badge tone="warn">Waiting</Badge></li>)}
          </ol>
          <p className="sx-note">If a seat opens, the first person on the waitlist and their family get a text automatically.</p>
        </div>
      )}
      {sent && <div className="sx-callout good" role="status"><Icon name="check" /><p>Reminder texted to the families of the {e.going?.length} residents going.</p></div>}
    </Drawer>
  );
}

function AddDrawer({ date, rooms, events, onClose, onSave }: { date: string; rooms: string[]; events: EdEvent[]; onClose: () => void; onSave: (e: EdEvent) => void }) {
  const [f, setF] = useState({ title: "Holiday Card Making", date, time: "14:00", end: "15:00", room: "Art Studio", cap: "", repeat: "once", harbor: false });
  const start = toMin(f.time), end = toMin(f.end);
  const clash = events.find((e) => e.date === f.date && e.room === f.room && f.room !== "Lobby" && f.room !== "All floors" && start < (e.end ?? e.start + 60) && end > e.start);
  const d = fromIso(f.date || date);
  const set = (k: keyof typeof f) => (ev: { target: { value: string } }) => setF({ ...f, [k]: ev.target.value });
  return (
    <Drawer
      title="Add event"
      sub="Publishes to the website calendar, TV channel and printed calendar"
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
                id: `new-${Date.now()}`, date: f.date, start, end, title: f.title, room: f.room, cat: f.harbor ? "harbor" : "clubs",
                color: f.harbor ? "var(--c-harbor)" : "var(--c-clubs)", catLabel: f.harbor ? "Harbor" : "Clubs & games", cap: Number(f.cap) || undefined,
                taken: Number(f.cap) ? 0 : undefined, harbor: f.harbor, rule: f.repeat === "weekly" ? `Every ${dayName(d)}` : undefined, going: Number(f.cap) ? [] : undefined, isNew: true,
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
        <div className="sx-row3">
          <label>Date<input type="date" value={f.date} onChange={set("date")} /></label>
          <label>Starts<input type="time" value={f.time} onChange={set("time")} step={300} /></label>
          <label>Ends<input type="time" value={f.end} onChange={set("end")} step={300} /></label>
        </div>
        <div className="sx-row">
          <label>Room<select value={f.room} onChange={set("room")}>{rooms.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label>Max people<input type="number" min={0} value={f.cap} onChange={set("cap")} placeholder="No limit" /></label>
        </div>
        <label>Repeats<select value={f.repeat} onChange={set("repeat")}><option value="once">Does not repeat</option><option value="weekly">Every {dayName(d)}</option></select></label>
        <label className="sx-check"><input type="checkbox" checked={f.harbor} onChange={(ev) => setF({ ...f, harbor: ev.target.checked })} /> Show in the Harbor calendar</label>
        {clash ? (
          <div className="sx-callout" role="alert">
            <Icon name="alert" />
            <p><b>{f.room} is booked</b> for {clash.title}, {fmtRange(clash.start, clash.end)}. Choose another room or time.</p>
          </div>
        ) : (
          <div className="sx-callout good"><Icon name="check" /><p>{f.room} is free {fmtRange(start, end)}.</p></div>
        )}
      </div>
    </Drawer>
  );
}
