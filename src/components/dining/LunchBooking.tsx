"use client";

import { useEffect, useState } from "react";
import { fmtTime } from "@/lib/clock";
import { useT } from "@/i18n/client";
import { Icon } from "@/components/Icon";

export interface BookDate { date: string; label: string; holiday?: boolean }

const SLOTS = Array.from({ length: 9 }, (_, i) => 690 + i * 15); // 11:30 am – 1:30 pm

interface Booking { name: string; contact: string; date: string; time: number; venue: string; party: number; ref: string }

/**
 * "Join us for lunch": a table for families and visitors.
 * `venues`: the restaurants taking lunch reservations; `holidayVenue`: where the holiday dinner is served;
 * `host`: the Dining Experience Director's first name, if published.
 */
export function LunchBooking({ dates, venues: VENUES, holidayVenue, holidayVenueName, host }: {
  dates: BookDate[];
  venues: { key: string; name: string }[];
  holidayVenue?: string;
  holidayVenueName?: string;
  host?: string | null;
}) {
  const { t } = useT();
  const first = VENUES[0]?.key ?? "";
  const hv = holidayVenue ?? first;
  const [date, setDate] = useState(dates[0]?.date ?? "");
  const [venue, setVenue] = useState(first);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<Booking | null>(null);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash !== "#lunch-thanksgiving") return;
      const tg = dates.find((d) => d.holiday);
      if (tg) { setDate(tg.date); setVenue(hv); setDone(null); }
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [dates, hv]);

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
    setDone({ name, contact, date, time: Number(f.get("time")), venue: holiday ? hv : venue, party: Number(f.get("party")), ref });
  };

  if (done) {
    const label = dates.find((d) => d.date === done.date)?.label.replace(/ — .*/, "") ?? done.date;
    const vname = VENUES.find((v) => v.key === done.venue)?.name ?? (done.venue === hv ? holidayVenueName : undefined) ?? done.venue;
    return (
      <div className="din-book card card-pad" role="status" aria-live="polite">
        <div className="success">
          <Icon name="check" />
          <div>
            <b>{t("Thank you, ")}{done.name.split(" ")[0]}{t(" — you’re booked.")}</b>
            <p>{host ? t(`${host} will have your table ready in `) : t("We’ll have your table ready in ")}{t(vname)}{t(" on ")}{t(label)}{t(` at ${fmtTime(done.time)}`)}{t(", for a party of ")}{done.party}{t(". We’ll confirm at ")}{done.contact}.</p>
            <p className="small">{t("Please check in at the front desk in the Lobby when you arrive. Your reservation number is ")}<b>{done.ref}</b>.</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setDone(null)}>{t("Book another table")}</button>
      </div>
    );
  }

  return (
    <form className="din-book card card-pad" onSubmit={submit} noValidate>
      <h3>{holiday ? t("Reserve Thanksgiving Dinner") : t("Book a table")}</h3>
      <div className="form-grid">
        <label className="field full">
          <span>{t("Date")}</span>
          <select name="date" value={date} onChange={(e) => setDate(e.target.value)}>
            {dates.map((d) => <option key={d.date} value={d.date}>{t(d.label)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t("Time")}</span>
          <select name="time" defaultValue="720">
            {SLOTS.map((m) => <option key={m} value={m}>{t(fmtTime(m))}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t("Party size")}</span>
          <select name="party" defaultValue="2">
            {Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? t("guest") : t("guests")}</option>)}
          </select>
        </label>
        <fieldset className="din-venue-pick full">
          <legend>{t("Restaurant")}</legend>
          {VENUES.map((v) => (
            <label key={v.key} className={`din-venue-opt${(holiday ? hv : venue) === v.key ? " is-on" : ""}${holiday && v.key !== hv ? " is-off" : ""}`}>
              <input type="radio" name="venue" value={v.key} checked={(holiday ? hv : venue) === v.key} disabled={holiday && v.key !== hv} onChange={() => setVenue(v.key)} />
              {t(v.name)}
            </label>
          ))}
          {holiday && <p className="small muted din-venue-hint">{t(`Thanksgiving Dinner is served in ${holidayVenueName ?? VENUES.find((v) => v.key === hv)?.name ?? ""}, 11:00 am–3:00 pm.`)}</p>}
        </fieldset>
        <label className="field full">
          <span>{t("Your name")}</span>
          <input name="name" autoComplete="name" required />
        </label>
        <label className="field full">
          <span>{t("Phone or email")}</span>
          <input name="contact" autoComplete="email" required />
        </label>
        <label className="field full">
          <span>{t("Visiting someone, or anything we should know? ")}<span className="muted">{t("(optional)")}</span></span>
          <textarea name="note" rows={2} />
        </label>
      </div>
      {err && <p className="din-err" role="alert">{t(err)}</p>}
      <button type="submit" className="btn btn-lg din-book-btn">{holiday ? t("Reserve our table") : t("Book our table")}</button>
    </form>
  );
}
