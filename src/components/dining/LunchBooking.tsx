"use client";

import { useEffect, useState } from "react";
import { fmtTime } from "@/lib/clock";
import { Icon } from "@/components/Icon";

export interface BookDate { date: string; label: string; holiday?: boolean }

const SLOTS = Array.from({ length: 9 }, (_, i) => 690 + i * 15); // 11:30 am – 1:30 pm
const VENUES = [
  { key: "cypress", name: "The Cypress Room" },
  { key: "natoma", name: "Natoma Café" },
];

interface Booking { name: string; contact: string; date: string; time: number; venue: string; party: number; ref: string }

/** "Join us for lunch": a table for families and visitors. */
export function LunchBooking({ dates }: { dates: BookDate[] }) {
  const [date, setDate] = useState(dates[0]?.date ?? "");
  const [venue, setVenue] = useState("cypress");
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Booking | null>(null);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash !== "#lunch-thanksgiving") return;
      const tg = dates.find((d) => d.holiday);
      if (tg) { setDate(tg.date); setVenue("cypress"); setDone(null); }
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [dates]);

  const holiday = dates.find((d) => d.date === date)?.holiday;

  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const contact = String(f.get("contact") ?? "").trim();
    if (!name) return setErr("Please tell us your name.");
    if (!/@/.test(contact) && contact.replace(/\D/g, "").length < 10) return setErr("Please enter a phone number or email address so we can confirm.");
    setErr("");
    const ref = `L${date.slice(5).replace("-", "")}${String(Math.floor(Math.random() * 90 + 10))}`;
    setDone({ name, contact, date, time: Number(f.get("time")), venue: holiday ? "cypress" : venue, party: Number(f.get("party")), ref });
  };

  if (done) {
    const label = dates.find((d) => d.date === done.date)?.label.replace(/ — .*/, "") ?? done.date;
    const vname = VENUES.find((v) => v.key === done.venue)!.name;
    return (
      <div className="din-book card card-pad" role="status" aria-live="polite">
        <div className="success">
          <Icon name="check" />
          <div>
            <b>Thank you, {done.name.split(" ")[0]} — you’re booked.</b>
            <p>Mickei will have your table ready in {vname} on {label} at {fmtTime(done.time)}, for a party of {done.party}. We’ll confirm at {done.contact}.</p>
            <p className="small">Please check in at the front desk in the Lobby when you arrive. Your reservation number is <b>{done.ref}</b>.</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setDone(null)}>Book another table</button>
      </div>
    );
  }

  return (
    <form className="din-book card card-pad" onSubmit={submit} noValidate>
      <h3>{holiday ? "Reserve Thanksgiving Dinner" : "Book a table"}</h3>
      <div className="form-grid">
        <label className="field full">
          <span>Date</span>
          <select name="date" value={date} onChange={(e) => setDate(e.target.value)}>
            {dates.map((d) => <option key={d.date} value={d.date}>{d.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Time</span>
          <select name="time" defaultValue="720">
            {SLOTS.map((m) => <option key={m} value={m}>{fmtTime(m)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Party size</span>
          <select name="party" defaultValue="2">
            {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "guest" : "guests"}</option>)}
          </select>
        </label>
        <fieldset className="din-venue-pick full">
          <legend>Restaurant</legend>
          {VENUES.map((v) => (
            <label key={v.key} className={`din-venue-opt${(holiday ? "cypress" : venue) === v.key ? " is-on" : ""}${holiday && v.key !== "cypress" ? " is-off" : ""}`}>
              <input type="radio" name="venue" value={v.key} checked={(holiday ? "cypress" : venue) === v.key} disabled={holiday && v.key !== "cypress"} onChange={() => setVenue(v.key)} />
              {v.name}
            </label>
          ))}
          {holiday && <p className="small muted din-venue-hint">Thanksgiving Dinner is served in The Cypress Room, 11:00 am–3:00 pm.</p>}
        </fieldset>
        <label className="field full">
          <span>Your name</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label className="field full">
          <span>Phone or email</span>
          <input name="contact" autoComplete="email" required />
        </label>
        <label className="field full">
          <span>Visiting someone, or anything we should know? <span className="muted">(optional)</span></span>
          <textarea name="note" rows={2} />
        </label>
      </div>
      {err && <p className="din-err" role="alert">{err}</p>}
      <button type="submit" className="btn btn-lg din-book-btn">{holiday ? "Reserve our table" : "Book our table"}</button>
    </form>
  );
}
