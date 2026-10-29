"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Monogram, SmsConsent } from "./bits";

export interface TourSlot { min: number; label: string; taken: boolean }
export interface TourDay {
  iso: string;
  wd: string; // "Thu"
  day: number;
  mon: string; // "Oct"
  long: string; // "Thursday, October 29"
  sunday: boolean;
  slots: TourSlot[];
  happening: { time: string; title: string }[];
}
export type Interest = "independent" | "assisted" | "harbor" | "unsure";

const interests: { key: Interest; label: string; note: string }[] = [
  { key: "independent", label: "Independent Living", note: "Apartment homes and a full calendar" },
  { key: "assisted", label: "Assisted Living Services", note: "Support in any apartment" },
  { key: "harbor", label: "Harbor Memory Care", note: "Our secured memory care neighborhood" },
  { key: "unsure", label: "Not sure yet", note: "We’ll help you work it out" },
];

const whoOptions = ["Myself", "My spouse or partner and me", "My mother", "My father", "My parents", "Another family member", "A friend or client"];

const pad = (n: number) => String(n).padStart(2, "0");
const icsStamp = (iso: string, min: number) => `${iso.replace(/-/g, "")}T${pad(Math.floor(min / 60))}${pad(min % 60)}00`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");

export function TourBooker({ days, initialInterest, address, mapsUrl, phone, phoneHref }: {
  days: TourDay[];
  initialInterest: Interest;
  address: string;
  mapsUrl: string;
  phone: string;
  phoneHref: string;
}) {
  const [mode, setMode] = useState<"in-person" | "video">("in-person");
  const firstOpen = days.find((d) => d.slots.some((s) => !s.taken)) ?? days[0];
  const [dayIso, setDayIso] = useState(firstOpen.iso);
  const [slot, setSlot] = useState<number | null>(null);
  const [interest, setInterest] = useState<Interest>(initialInterest);
  const [lunch, setLunch] = useState(true);
  const [sms, setSms] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { name: string; email: string; phone: string; who: string; ref: string }>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const doneHead = useRef<HTMLHeadingElement>(null);

  const day = days.find((d) => d.iso === dayIso)!;
  const slotObj = day.slots.find((s) => s.min === slot);
  const length = mode === "in-person" && lunch ? 90 : mode === "video" ? 30 : 60;

  useEffect(() => {
    if (done) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      doneHead.current?.focus();
    }
  }, [done]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (slot == null) {
      setError("Please choose a time for your visit.");
      document.getElementById("tr-times")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const ref = "T-" + (Math.abs([...(name + dayIso + slot)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)) % 90000 + 10000);
    setError("");
    setDone({ name, email: String(f.get("email") ?? ""), phone: String(f.get("phone") ?? ""), who: String(f.get("who") ?? ""), ref });
  }

  if (done && slotObj) {
    const first = done.name.split(" ")[0] || "there";
    const endMin = slotObj.min + length;
    const title = mode === "video" ? "Video tour of Prairie City Landing" : "Tour of Prairie City Landing";
    const where = mode === "video" ? "Video call (link sent by email)" : address;
    const desc = `Hosted by Cynthia Bazin, Community Relations Director. ${mode === "in-person" && lunch ? "Lunch is on us. " : ""}Questions or changes: ${phone}.`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Prairie City Landing//Tours//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${done.ref}@prairiecitylanding.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART;TZID=America/Los_Angeles:${icsStamp(dayIso, slotObj.min)}`,
      `DTEND;TZID=America/Los_Angeles:${icsStamp(dayIso, endMin)}`,
      `SUMMARY:${esc(title)}`,
      `LOCATION:${esc(where)}`,
      `DESCRIPTION:${esc(desc)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    const gcal =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(title)}&dates=${icsStamp(dayIso, slotObj.min)}/${icsStamp(dayIso, endMin)}&ctz=America/Los_Angeles` +
      `&location=${encodeURIComponent(where)}&details=${encodeURIComponent(desc)}`;

    return (
      <div ref={topRef} className="tr-done">
        <div className="tr-done-main card">
          <div className="tr-done-head">
            <span className="tr-done-check">
              <Icon name="check" />
            </span>
            <div>
              <p className="eyebrow">Confirmation {done.ref}</p>
              <h2 ref={doneHead} tabIndex={-1}>
                You’re booked, <em data-no-translate>{first}</em>.
              </h2>
            </div>
          </div>
          <div className="tr-ticket">
            <div className="tr-ticket-date">
              <span>{day.mon}</span>
              <b>{day.day}</b>
              <span>{day.wd}</span>
            </div>
            <dl>
              <div>
                <dt>When</dt>
                <dd>
                  {day.long} at {slotObj.label}
                </dd>
              </div>
              <div>
                <dt>Visit</dt>
                <dd>{mode === "video" ? "Video tour, about 30 minutes" : lunch ? "In-person tour and lunch, about 90 minutes" : "In-person tour, about an hour"}</dd>
              </div>
              <div>
                <dt>Interested in</dt>
                <dd>{interests.find((i) => i.key === interest)!.label}</dd>
              </div>
              <div>
                <dt>Where</dt>
                <dd>{mode === "video" ? `We’ll email a video link to ${done.email}` : address}</dd>
              </div>
            </dl>
          </div>
          <div className="btn-row">
            <a className="btn" href={icsHref} download="prairie-city-landing-tour.ics">
              <Icon name="calendar" /> Add to calendar (.ics)
            </a>
            <a className="btn btn-ghost" href={gcal} target="_blank" rel="noreferrer">
              Google Calendar
            </a>
            {mode === "in-person" && (
              <a className="btn btn-ghost" href={mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" /> Directions
              </a>
            )}
          </div>
          <p className="small muted tr-done-note">
            A confirmation is on its way to {done.email}
            {sms && done.phone ? ` and by text to ${done.phone}` : ""}. Need to change anything? Call <a href={phoneHref}>{phone}</a>, extension 110.
          </p>

          <h3 className="tr-sub">What to expect</h3>
          <ol className="tr-expect">
            {(mode === "video"
              ? [
                  ["Cynthia calls you", "She’ll start the video call from her phone and walk you through the Lobby, the Rendezvous and the courtyard live."],
                  ["See an apartment", "We’ll visit an available apartment that suits what you’re looking for, and talk through floor plans and pricing."],
                  ["Your questions", "Bring the whole family onto the call. Nothing is too small to ask."],
                  ["Visit in person when you’re ready", "Many families follow a video tour with an in-person visit and lunch."],
                ]
              : [
                  ["Arrive at the Lobby", "Park in the visitor spaces right outside the main entrance. The front desk will let Cynthia know you’re here."],
                  ["See the community", "An available apartment, the Rendezvous, the Fitness Center, the Art Studio and the courtyard — and whatever is happening that day."],
                  ...(lunch ? [["Lunch is on us", "Join Cynthia for lunch in Natoma Café or the Cypress Room. Residents often stop by to say hello."]] : []),
                  ["Talk it through", "Pricing, availability, care options and timing. No pressure, and no decisions on the day."],
                ]
            ).map(([t, d], i) => (
              <li key={t}>
                <span className="tr-expect-n">{i + 1}</span>
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="tr-done-side">
          <div className="card card-pad tr-host">
            <Monogram name="Cynthia Bazin" size={72} tone="var(--terra-deep)" />
            <div>
              <p className="tr-host-label">Your host</p>
              <h3 data-no-translate>Cynthia Bazin</h3>
              <p className="small muted">Community Relations Director</p>
              <p className="small">
                <a href={phoneHref}>{phone}</a>, ext. 110
              </p>
            </div>
          </div>
          {mode === "in-person" && (
            <div className="card card-pad tr-where">
              <h3>Finding us</h3>
              <p className="small">
                <Icon name="pin" /> {address}
              </p>
              <ul className="small">
                <li>Just off US-50, next to Folsom High School</li>
                <li>Free visitor parking at the main entrance</li>
                <li>Covered drop-off at the Lobby</li>
              </ul>
              <Link className="link-arrow" href="/contact">
                Full directions <Icon name="arrow" />
              </Link>
            </div>
          )}
          {day.happening.length > 0 && (
            <div className="card card-pad tr-happening">
              <h3>Happening that day</h3>
              <ul>
                {day.happening.map((h) => (
                  <li key={h.time + h.title}>
                    <time>{h.time}</time> {h.title}
                  </li>
                ))}
              </ul>
              <Link className="link-arrow" href="/calendar">
                See the calendar <Icon name="arrow" />
              </Link>
            </div>
          )}
        </aside>
      </div>
    );
  }

  return (
    <form className="tr-form" onSubmit={submit} noValidate={false}>
      <div className="tr-steps">
        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">1</span> How would you like to visit?
          </legend>
          <div className="tr-modes">
            {(
              [
                ["in-person", "In person", "See the apartments and spaces, meet residents, and stay for lunch.", "building"],
                ["video", "By video", "A live walk-through with Cynthia from wherever you are.", "phoneapp"],
              ] as const
            ).map(([k, label, note, icon]) => (
              <label key={k} className={`tr-mode ${mode === k ? "on" : ""}`}>
                <input type="radio" name="mode" value={k} checked={mode === k} onChange={() => setMode(k)} />
                <Icon name={icon} />
                <span>
                  <b>{label}</b>
                  <small>{note}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">2</span> Choose a day
          </legend>
          <div className="tr-days" role="radiogroup" aria-label="Day">
            {days.map((d) => {
              const open = d.slots.filter((s) => !s.taken).length;
              return (
                <label key={d.iso} className={`tr-day ${d.iso === dayIso ? "on" : ""} ${open === 0 ? "full" : ""}`}>
                  <input
                    type="radio"
                    name="day"
                    value={d.iso}
                    checked={d.iso === dayIso}
                    disabled={open === 0}
                    onChange={() => {
                      setDayIso(d.iso);
                      setSlot(null);
                    }}
                  />
                  <span className="tr-day-wd">{d.wd}</span>
                  <span className="tr-day-n">{d.day}</span>
                  <span className="tr-day-m">{d.mon}</span>
                  <span className="tr-day-open">{open === 0 ? "Full" : d.sunday ? "Limited" : `${open} open`}</span>
                </label>
              );
            })}
          </div>
          {day.sunday && <p className="small muted tr-hint">Sunday tours are limited to the middle of the day. For another time, call {phone}.</p>}
        </fieldset>

        <fieldset className="tr-step" id="tr-times">
          <legend>
            <span className="tr-n">3</span> Pick a time on {day.long}
          </legend>
          <div className="tr-times">
            {day.slots.map((s) => (
              <label key={s.min} className={`tr-time ${slot === s.min ? "on" : ""} ${s.taken ? "taken" : ""}`}>
                <input
                  type="radio"
                  name="time"
                  value={s.min}
                  disabled={s.taken}
                  checked={slot === s.min}
                  onChange={() => {
                    setSlot(s.min);
                    setError("");
                  }}
                />
                <time>{s.label}</time>
                {s.taken && <span className="vh"> (booked)</span>}
              </label>
            ))}
          </div>
          {error && (
            <p className="tr-error" role="alert">
              <Icon name="alert" /> {error}
            </p>
          )}
          {mode === "in-person" && (
            <label className="tr-lunch">
              <input type="checkbox" checked={lunch} onChange={(e) => setLunch(e.target.checked)} />
              <Icon name="fork" />
              <span>
                <b>Lunch is on us.</b> Stay for lunch in Natoma Café or the Cypress Room after your tour.
              </span>
            </label>
          )}
        </fieldset>

        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">4</span> What are you interested in?
          </legend>
          <div className="tr-interest">
            {interests.map((i) => (
              <label key={i.key} className={`tr-int ${interest === i.key ? "on" : ""}`}>
                <input type="radio" name="interest" value={i.key} checked={interest === i.key} onChange={() => setInterest(i.key)} />
                <b>{i.label}</b>
                <small>{i.note}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">5</span> About you
          </legend>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="tr-who">Who is the tour for?</label>
              <select id="tr-who" name="who" defaultValue="My mother">
                {whoOptions.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tr-name">Your name</label>
              <input id="tr-name" name="name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="tr-phone">Phone</label>
              <input id="tr-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
            </div>
            <div className="field full">
              <label htmlFor="tr-email">Email</label>
              <input id="tr-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field full">
              <label htmlFor="tr-notes">Anything we should know? (optional)</label>
              <textarea id="tr-notes" name="notes" placeholder="Mobility needs, an apartment you’d like to see, a pet coming along…" />
            </div>
            <div className="full">
              <SmsConsent id="tr-sms" purpose="my tour, reminders and follow-up" checked={sms} onChange={setSms} />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="tr-summary">
        <div className="card card-pad tr-summary-card">
          <div className="tr-host-row">
            <Monogram name="Cynthia Bazin" size={52} tone="var(--terra-deep)" />
            <div>
              <b data-no-translate>Cynthia Bazin</b>
              <span className="small muted">Community Relations Director</span>
            </div>
          </div>
          <dl className="tr-sum">
            <div>
              <dt>Visit</dt>
              <dd>{mode === "video" ? "Video tour" : lunch ? "In-person tour + lunch" : "In-person tour"}</dd>
            </div>
            <div>
              <dt>Day</dt>
              <dd>{day.long}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{slotObj ? slotObj.label : <span className="muted">Choose a time</span>}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>About {length === 90 ? "90 minutes" : length === 60 ? "an hour" : "30 minutes"}</dd>
            </div>
          </dl>
          <button className="btn btn-lg tr-submit" type="submit">
            Book my tour <Icon name="arrow" />
          </button>
          <p className="small muted tr-or">
            Prefer to talk? Call <a href={phoneHref}>{phone}</a>
          </p>
        </div>
      </aside>
    </form>
  );
}
