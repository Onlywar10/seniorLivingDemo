"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export interface TourDay { iso: string; dow: string; date: string; long: string; highlight?: string }

const SLOTS = ["9:30 am", "11:00 am", "1:30 pm", "3:00 pm", "4:30 pm"];
const slotNote: Record<string, string> = { "11:00 am": "stay for lunch", "3:00 pm": "during an activity" };

// A few slots are already taken, deterministically per date so it does not jump around.
const taken = (iso: string, s: string) => (Number(iso.slice(-2)) + SLOTS.indexOf(s)) % 4 === 0;

export function TourBooking({ days }: { days: TourDay[] }) {
  const [day, setDay] = useState<TourDay | null>(null);
  const [slot, setSlot] = useState("");
  const [done, setDone] = useState<{ name: string; phone: string } | null>(null);

  if (done && day) {
    return (
      <div className="booked" role="status">
        <span className="booked-icon" aria-hidden="true">
          <Icon name="check" />
        </span>
        <h3>You’re booked, {done.name.split(" ")[0]}.</h3>
        <p className="booked-when">
          {day.long} at {slot}
        </p>
        <dl className="booked-facts">
          <div>
            <dt>With</dt>
            <dd>Daniel Whitcombe, Family Liaison, and one of our nurses</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>1400 Fern Street, Millbrook Bend. Park in the visitor bays by the front door.</dd>
          </div>
          <div>
            <dt>How long</dt>
            <dd>About an hour{slot === "11:00 am" ? ", plus lunch with residents if you would like to stay" : ""}.</dd>
          </div>
        </dl>
        <p className="booked-note">
          <Icon name="sms" /> We’ll text you a reminder the day before, at {done.phone || "the number you gave"}. A confirmation is on its way to your email now.
        </p>
        <div className="hero-actions">
          <a className="btn btn-outline" href={`data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:Tour of Larkmoor House%0ADTSTART:${day.iso.replace(/-/g, "")}%0ALOCATION:1400 Fern Street, Millbrook Bend%0AEND:VEVENT%0AEND:VCALENDAR`} download="larkmoor-house-tour.ics">
            <Icon name="calendar" /> Add to my calendar
          </a>
          <button type="button" className="btn btn-outline" onClick={() => { setDone(null); setSlot(""); setDay(null); }}>
            Change the time
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="booking"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setDone({ name: String(f.get("name") || ""), phone: String(f.get("phone") || "") });
      }}
    >
      <fieldset>
        <legend>
          <span className="step-n">1</span> Choose a day
        </legend>
        <div className="bk-days">
          {days.map((d) => (
            <button key={d.iso} type="button" aria-pressed={day?.iso === d.iso} onClick={() => { setDay(d); setSlot(""); }}>
              <span className="bk-dow">{d.dow}</span>
              <span className="bk-date">{d.date}</span>
              {d.highlight && <span className="bk-hl">{d.highlight}</span>}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={!day}>
        <legend>
          <span className="step-n">2</span> Choose a time {day && <span className="muted">on {day.long}</span>}
        </legend>
        <div className="bk-slots">
          {SLOTS.map((s) => {
            const t = day ? taken(day.iso, s) : false;
            return (
              <button key={s} type="button" aria-pressed={slot === s} disabled={!day || t} onClick={() => setSlot(s)}>
                <b>{s}</b>
                <span>{t ? "Booked" : slotNote[s] ?? "Available"}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={!slot}>
        <legend>
          <span className="step-n">3</span> Your details
        </legend>
        <div className="form" style={{ maxWidth: "none" }}>
          <label>
            Your name
            <input name="name" required autoComplete="name" />
          </label>
          <div className="touch-row">
            <label>
              Mobile <span className="hint">for the reminder text</span>
              <input name="phone" type="tel" required autoComplete="tel" />
            </label>
            <label>
              Email
              <input name="email" type="email" required autoComplete="email" />
            </label>
          </div>
          <label>
            Who is the visit for? <span className="hint">optional</span>
            <input name="for" placeholder="e.g. my mother, currently at home in Salem" />
          </label>
          <div>
            <button className="btn btn-gold btn-lg" type="submit" disabled={!slot}>
              <Icon name="calendar" /> {slot && day ? `Book ${day.dow} ${day.date} at ${slot}` : "Book my tour"}
            </button>
          </div>
        </div>
      </fieldset>
    </form>
  );
}
