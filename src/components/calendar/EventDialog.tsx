"use client";

import { useEffect, useRef, useState } from "react";
import { cats, type CalEvent } from "@/data/calendar";
import { fmtRange, fmtTime, fromIso, longDate } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { downloadIcs } from "./ics";

export interface Rsvp { name: string; party: number; who: "resident" | "family"; apt?: string; waitlist?: number }

/** Event detail, seats and the online RSVP form, in a modal dialog. */
export function EventDialog({ event, rsvp, todayIso, now, phone, phoneHref, onClose, onRsvp }: {
  event: CalEvent | null; rsvp?: Rsvp; todayIso: string; now: number; phone: string; phoneHref: string;
  onClose: () => void; onRsvp: (id: string, r: Rsvp) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [who, setWho] = useState<"resident" | "family">("resident");
  const [err, setErr] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (event && !d.open) {
      setErr("");
      d.showModal();
    }
    if (!event && d.open) d.close();
  }, [event]);

  const e = event;
  const left = e?.cap ? Math.max(0, e.cap - (e.taken ?? 0)) : undefined;
  const full = left === 0;
  const past = e ? e.date < todayIso || (e.date === todayIso && (e.end ?? e.start + 60) <= now) : false;
  const bus = e ? e.room === "Lobby" : false;
  const maxParty = full ? 4 : Math.min(left ?? 4, 4);

  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!e) return;
    const f = new FormData(ev.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const apt = String(f.get("apt") ?? "").trim();
    const party = Number(f.get("party") ?? 1);
    if (!name) return setErr("Please enter your name.");
    if (who === "resident" && !apt) return setErr("Please enter your apartment number.");
    onRsvp(e.id, { name, party, who, apt: who === "resident" ? apt : undefined, waitlist: full ? (e.waitlist ?? 0) + 1 : undefined });
  };

  return (
    <dialog ref={ref} className="cal-dialog" aria-labelledby="cal-dialog-title" onClose={onClose} onClick={(ev) => { if (ev.target === ref.current) ref.current?.close(); }}>
      {e && (
        <div className="cal-dialog-inner" style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
          <button type="button" className="cal-dialog-x" aria-label="Close" onClick={() => ref.current?.close()}><Icon name="x" /></button>
          <p className="cal-dialog-cat"><span className="cal-dot" aria-hidden="true" /> {cats[e.cat].label}{e.special && " · Special event"}</p>
          <h2 id="cal-dialog-title">{e.title}</h2>
          <dl className="cal-dialog-facts">
            <div><dt><Icon name="calendar" /><span className="vh">Date</span></dt><dd>{longDate(fromIso(e.date))}</dd></div>
            <div><dt><Icon name="clock" /><span className="vh">Time</span></dt><dd>{fmtRange(e.start, e.end)}</dd></div>
            <div><dt><Icon name="pin" /><span className="vh">Where</span></dt><dd>{bus ? "Departs from the Lobby" : e.room}</dd></div>
            {e.leader && <div><dt><Icon name="users" /><span className="vh">Led by</span></dt><dd>With <span data-no-translate>{e.leader}</span></dd></div>}
            {e.cost && <div><dt><Icon name="info" /><span className="vh">Cost</span></dt><dd>Additional cost: {e.cost}</dd></div>}
          </dl>
          {e.desc && <p className="cal-dialog-desc">{e.desc}</p>}
          {bus && <p className="cal-dialog-bus"><Icon name="bus" /> The bus leaves from the Lobby at {fmtTime(e.start)}. Please be there ten minutes early.</p>}

          {e.cap ? (
            <div className="cal-seats">
              <div className="cal-seats-row">
                <b>{full ? "Full — join the waitlist" : `${left} of ${e.cap} seats left`}</b>
                {full && (e.waitlist ?? 0) > 0 && <span className="muted small">{e.waitlist} on the waitlist</span>}
              </div>
              <div className="cal-meter" aria-hidden="true"><span style={{ width: `${Math.min(100, ((e.taken ?? 0) / e.cap) * 100)}%` }} /></div>
            </div>
          ) : (
            !past && <p className="cal-dialog-open"><Icon name="check" /> No sign-up needed — just come along.</p>
          )}

          {e.cap && !past && (
            rsvp ? (
              <div className="success cal-dialog-ok" role="status">
                <Icon name="check" />
                <div>
                  {rsvp.waitlist ? (
                    <>
                      <b>You’re number {rsvp.waitlist} on the waitlist for {e.title}.</b>
                      <p>We’ll call you as soon as a seat opens up.</p>
                    </>
                  ) : (
                    <>
                      <b>You’re on the list for {e.title}{rsvp.party > 1 ? `, party of ${rsvp.party}` : ""}.</b>
                      <p>{bus ? `Bus leaves from the Lobby at ${fmtTime(e.start)}.` : `See you in the ${e.room} at ${fmtTime(e.start)}.`} Need to cancel? Call the front desk at <a href={phoneHref}>{phone}</a>.</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <form className="cal-rsvp" onSubmit={submit} noValidate>
                <h3>{full ? "Join the waitlist" : "Reserve your seat"}</h3>
                <div className="form-grid">
                  <label className="field full">
                    <span>Your name</span>
                    <input name="name" autoComplete="name" required />
                  </label>
                  <fieldset className="cal-who full">
                    <legend>I am</legend>
                    <label className="check"><input type="radio" name="who" value="resident" checked={who === "resident"} onChange={() => setWho("resident")} /> A resident</label>
                    <label className="check"><input type="radio" name="who" value="family" checked={who === "family"} onChange={() => setWho("family")} /> A family member</label>
                  </fieldset>
                  {who === "resident" && (
                    <label className="field">
                      <span>Apartment number</span>
                      <input name="apt" inputMode="numeric" required />
                    </label>
                  )}
                  <label className="field">
                    <span>Party size</span>
                    <select name="party" defaultValue="1">
                      {Array.from({ length: maxParty }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "person" : "people"}</option>)}
                    </select>
                  </label>
                </div>
                {err && <p className="cal-err" role="alert">{err}</p>}
                <button type="submit" className="btn btn-lg cal-rsvp-btn">{full ? "Join the waitlist" : "RSVP"}</button>
              </form>
            )
          )}

          {past ? (
            <p className="muted small cal-dialog-past">This event has already taken place.</p>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm cal-dialog-ics" onClick={() => downloadIcs([e], e.title, `${e.id}.ics`)}>
              <Icon name="calendar" /> Add to my calendar
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}
