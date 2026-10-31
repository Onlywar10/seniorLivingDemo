"use client";

import Link from "@/i18n/Link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useT } from "@/i18n/client";
import { useCommunity } from "@/lib/community";
import { tourCopy } from "@/data/communities/copy/tour";
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
export type Interest = "independent" | "assisted" | "lantern" | "unsure";

const interests: { key: Interest; label: string; note: string }[] = [
  { key: "independent", label: "Independent Living", note: "Apartment homes and a full calendar" },
  { key: "assisted", label: "Assisted Living Services", note: "Support in any apartment" },
  { key: "lantern", label: "Lantern Memory Care", note: "Our secured memory care neighborhood" },
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
  const { t } = useT();
  const c = useCommunity();
  const copy = tourCopy[c.slug];
  // The host is the community's Community Relations Director; an unnamed role is shown by its title only.
  const hostMember = c.team.find((m) => m.role === "Community Relations Director");
  const host = hostMember && !hostMember.unnamed ? hostMember.name : null;
  const hostRole = hostMember?.role ?? "Community Relations Director";
  const ext = hostMember?.ext;
  const domain = c.site.email.split("@")[1];
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
    const title = t(mode === "video" ? `Video tour of ${c.site.name}` : `Tour of ${c.site.name}`);
    const where = mode === "video" ? t("Video call (link sent by email)") : address;
    const desc = t(`${host ? `Hosted by ${host}, ${hostRole}. ` : `Hosted by our ${hostRole}. `}${mode === "in-person" && lunch && copy.lunchOnUs ? "Lunch is on us. " : ""}Questions or changes: ${phone}.`);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${c.site.name}//Tours//EN`,
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${done.ref}@${domain}`,
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
              <p className="eyebrow">{t("Confirmation ")}{done.ref}</p>
              <h2 ref={doneHead} tabIndex={-1}>
                {t("You’re booked, ")}<em data-no-translate>{first}</em>.
              </h2>
            </div>
          </div>
          <div className="tr-ticket">
            <div className="tr-ticket-date">
              <span>{t(day.mon)}</span>
              <b>{day.day}</b>
              <span>{t(day.wd)}</span>
            </div>
            <dl>
              <div>
                <dt>{t("When")}</dt>
                <dd>
                  {t(`${day.long} at ${slotObj.label}`)}
                </dd>
              </div>
              <div>
                <dt>{t("Visit")}</dt>
                <dd>{t(mode === "video" ? "Video tour, about 30 minutes" : lunch ? "In-person tour and lunch, about 90 minutes" : "In-person tour, about an hour")}</dd>
              </div>
              <div>
                <dt>{t("Interested in")}</dt>
                <dd>{t(interests.find((i) => i.key === interest)!.label)}</dd>
              </div>
              <div>
                <dt>{t("Where")}</dt>
                <dd>{mode === "video" ? `${t("We’ll email a video link to")} ${done.email}` : address}</dd>
              </div>
            </dl>
          </div>
          <div className="btn-row">
            <a className="btn" href={icsHref} download={`${c.slug}-tour.ics`}>
              <Icon name="calendar" />{t(" Add to calendar (.ics)")}
            </a>
            <a className="btn btn-ghost" href={gcal} target="_blank" rel="noreferrer">
              Google Calendar
            </a>
            {mode === "in-person" && (
              <a className="btn btn-ghost" href={mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" />{t(" Directions")}
              </a>
            )}
          </div>
          <p className="small muted tr-done-note">
            {t("A confirmation is on its way to ")}{done.email}
            {sms && done.phone ? t(` and by text to ${done.phone}`) : ""}{t(". Need to change anything? Call ")}<a href={phoneHref}>{phone}</a>{ext ? t(`, extension ${ext}.`) : "."}
          </p>

          <h3 className="tr-sub">{t("What to expect")}</h3>
          <ol className="tr-expect">
            {(mode === "video"
              ? copy.expectVideo
              : [...copy.expectInPerson.slice(0, 2), ...(lunch ? [copy.expectLunch] : []), ...copy.expectInPerson.slice(2)]
            ).map(([head, d], i) => (
              <li key={head}>
                <span className="tr-expect-n">{i + 1}</span>
                <div>
                  <b>{t(head)}</b>
                  <p>{t(d)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="tr-done-side">
          <div className="card card-pad tr-host">
            <Monogram name={host ?? hostRole} size={72} tone="var(--terra-deep)" />
            <div>
              <p className="tr-host-label">{t("Your host")}</p>
              {host ? <h3 data-no-translate>{host}</h3> : <h3>{t(hostRole)}</h3>}
              {host && <p className="small muted">{t(hostRole)}</p>}
              <p className="small">
                <a href={phoneHref}>{phone}</a>{ext ? t(`, ext. ${ext}`) : null}
              </p>
            </div>
          </div>
          {mode === "in-person" && (
            <div className="card card-pad tr-where">
              <h3>{t("Finding us")}</h3>
              <p className="small">
                <Icon name="pin" /> {address}
              </p>
              <ul className="small">
                {copy.finding.map((f) => <li key={f}>{t(f)}</li>)}
              </ul>
              <Link className="link-arrow" href="/contact">
                {t("Full directions ")}<Icon name="arrow" />
              </Link>
            </div>
          )}
          {day.happening.length > 0 && (
            <div className="card card-pad tr-happening">
              <h3>{t("Happening that day")}</h3>
              <ul>
                {day.happening.map((h) => (
                  <li key={h.time + h.title}>
                    <time>{t(h.time)}</time> {t(h.title)}
                  </li>
                ))}
              </ul>
              <Link className="link-arrow" href="/calendar">
                {t("See the calendar ")}<Icon name="arrow" />
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
            <span className="tr-n">1</span>{t(" How would you like to visit?")}
          </legend>
          <div className="tr-modes">
            {(
              [
                ["in-person", "In person", "See the apartments and spaces, meet residents, and stay for lunch.", "building"],
                ["video", "By video", copy.videoNote, "phoneapp"],
              ] as const
            ).map(([k, label, note, icon]) => (
              <label key={k} className={`tr-mode ${mode === k ? "on" : ""}`}>
                <input type="radio" name="mode" value={k} checked={mode === k} onChange={() => setMode(k)} />
                <Icon name={icon} />
                <span>
                  <b>{t(label)}</b>
                  <small>{t(note)}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">2</span>{t(" Choose a day")}
          </legend>
          <div className="tr-days" role="radiogroup" aria-label={t("Day")}>
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
                  <span className="tr-day-wd">{t(d.wd)}</span>
                  <span className="tr-day-n">{d.day}</span>
                  <span className="tr-day-m">{t(d.mon)}</span>
                  <span className="tr-day-open">{t(open === 0 ? "Full" : d.sunday ? "Limited" : `${open} open`)}</span>
                </label>
              );
            })}
          </div>
          {day.sunday && <p className="small muted tr-hint">{t("Sunday tours are limited to the middle of the day. For another time, call ")}{phone}.</p>}
        </fieldset>

        <fieldset className="tr-step" id="tr-times">
          <legend>
            <span className="tr-n">3</span>{t(" Pick a time on ")}{t(day.long)}
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
                <time>{t(s.label)}</time>
                {s.taken && <span className="vh">{t(" (booked)")}</span>}
              </label>
            ))}
          </div>
          {error && (
            <p className="tr-error" role="alert">
              <Icon name="alert" /> {t(error)}
            </p>
          )}
          {mode === "in-person" && (
            <label className="tr-lunch">
              <input type="checkbox" checked={lunch} onChange={(e) => setLunch(e.target.checked)} />
              <Icon name="fork" />
              <span>
                <b>{t(copy.lunchOnUs ? "Lunch is on us." : "Stay for lunch.")}</b>{t(copy.lunchNote)}
              </span>
            </label>
          )}
        </fieldset>

        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">4</span>{t(" What are you interested in?")}
          </legend>
          <div className="tr-interest">
            {interests.map((i) => (
              <label key={i.key} className={`tr-int ${interest === i.key ? "on" : ""}`}>
                <input type="radio" name="interest" value={i.key} checked={interest === i.key} onChange={() => setInterest(i.key)} />
                <b>{t(i.label)}</b>
                <small>{t(i.note)}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="tr-step">
          <legend>
            <span className="tr-n">5</span>{t(" About you")}
          </legend>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="tr-who">{t("Who is the tour for?")}</label>
              <select id="tr-who" name="who" defaultValue="My mother">
                {whoOptions.map((w) => (
                  <option key={w} value={w}>{t(w)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tr-name">{t("Your name")}</label>
              <input id="tr-name" name="name" autoComplete="name" required />
            </div>
            <div className="field">
              <label htmlFor="tr-phone">{t("Phone")}</label>
              <input id="tr-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
            </div>
            <div className="field full">
              <label htmlFor="tr-email">{t("Email")}</label>
              <input id="tr-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="field full">
              <label htmlFor="tr-notes">{t("Anything we should know? (optional)")}</label>
              <textarea id="tr-notes" name="notes" placeholder={t("Mobility needs, an apartment you’d like to see, a pet coming along…")} />
            </div>
            <div className="full">
              <SmsConsent id="tr-sms" purpose={t("my tour, reminders and follow-up")} checked={sms} onChange={setSms} />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="tr-summary">
        <div className="card card-pad tr-summary-card">
          <div className="tr-host-row">
            <Monogram name={host ?? hostRole} size={52} tone="var(--terra-deep)" />
            <div>
              {host ? <b data-no-translate>{host}</b> : <b>{t(hostRole)}</b>}
              {host && <span className="small muted">{t(hostRole)}</span>}
            </div>
          </div>
          <dl className="tr-sum">
            <div>
              <dt>{t("Visit")}</dt>
              <dd>{t(mode === "video" ? "Video tour" : lunch ? "In-person tour + lunch" : "In-person tour")}</dd>
            </div>
            <div>
              <dt>{t("Day")}</dt>
              <dd>{t(day.long)}</dd>
            </div>
            <div>
              <dt>{t("Time")}</dt>
              <dd>{slotObj ? t(slotObj.label) : <span className="muted">{t("Choose a time")}</span>}</dd>
            </div>
            <div>
              <dt>{t("Length")}</dt>
              <dd>{t(`About ${length === 90 ? "90 minutes" : length === 60 ? "an hour" : "30 minutes"}`)}</dd>
            </div>
          </dl>
          <button className="btn btn-lg tr-submit" type="submit">
            {t("Book my tour ")}<Icon name="arrow" />
          </button>
          <p className="small muted tr-or">
            {t("Prefer to talk? Call ")}<a href={phoneHref}>{phone}</a>
          </p>
        </div>
      </aside>
    </form>
  );
}
