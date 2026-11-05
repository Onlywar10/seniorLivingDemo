"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/i18n/Link";
import { cats, kindOf, type CalEvent } from "@/data/shared";
import { useCommunity } from "@/lib/community";
import { fmtRange, fmtTime, fromIso, longDate } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { downloadIcs, icsPlace } from "./ics";
import { useT } from "@/i18n/client";

/** A sign-up for a public event (an open house), kept on this device so the confirmation stays put. */
export interface PublicSignup { name: string; phone: string; email: string; party: number }

/** Where public sign-ups are handed to the sales team's lead list. */
const SIGNUPS_KEY = "wh-public-signups";

function saveSignup(row: Record<string, unknown>) {
  try {
    const prev = JSON.parse(localStorage.getItem(SIGNUPS_KEY) ?? "[]");
    const list = Array.isArray(prev) ? prev : [];
    list.push(row);
    localStorage.setItem(SIGNUPS_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private window): the on-screen confirmation still shows.
  }
}

/**
 * Event detail in a modal dialog. What it offers depends on the event's kind:
 * public events (an open house) take a short sign-up; family events are RSVPed from the weekly family message;
 * resident activities are signed up for in the community, never on the website.
 */
export function EventDialog({ event, signup, todayIso, now, phone, phoneHref, onClose, onSignup }: {
  event: CalEvent | null; signup?: PublicSignup; todayIso: string; now: number; phone: string; phoneHref: string;
  onClose: () => void; onSignup: (id: string, s: PublicSignup) => void;
}) {
  const { t } = useT();
  const c = useCommunity();
  const ref = useRef<HTMLDialogElement>(null);
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
  const kind = e ? kindOf(e) : "resident";
  const past = e ? e.date < todayIso || (e.date === todayIso && (e.end ?? e.start + 60) <= now) : false;

  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!e) return;
    const f = new FormData(ev.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const phoneNo = String(f.get("phone") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const party = Math.min(6, Math.max(1, Number(f.get("party") ?? 1) || 1));
    if (!name) return setErr("Please enter your name.");
    if (!phoneNo && !email) return setErr("Please give a phone number or an email address so we can reach you.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Please check the email address.");
    setErr("");
    saveSignup({ slug: c.slug, eventId: e.id, eventTitle: e.title, date: e.date, start: e.start, name, phone: phoneNo, email, party, at: Date.now() });
    onSignup(e.id, { name, phone: phoneNo, email, party });
  };

  return (
    <dialog ref={ref} className="cal-dialog" aria-labelledby="cal-dialog-title" onClose={onClose} onClick={(ev) => { if (ev.target === ref.current) ref.current?.close(); }}>
      {e && (
        <div className="cal-dialog-inner" style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
          <button type="button" className="cal-dialog-x" aria-label={t("Close")} onClick={() => ref.current?.close()}><Icon name="x" /></button>
          <p className="cal-dialog-cat">
            <span className="cal-dot" aria-hidden="true" /> {t(cats[e.cat].label)}
            {kind === "public" ? t(" · Open to the public") : kind === "family" ? t(" · Family event") : e.special ? t(" · Special event") : null}
          </p>
          <h2 id="cal-dialog-title">{t(e.title)}</h2>
          <dl className="cal-dialog-facts">
            <div><dt><Icon name="calendar" /><span className="vh">{t("Date")}</span></dt><dd>{t(longDate(fromIso(e.date)))}</dd></div>
            <div><dt><Icon name="clock" /><span className="vh">{t("Time")}</span></dt><dd>{t(fmtRange(e.start, e.end))}</dd></div>
            {e.room && <div><dt><Icon name="pin" /><span className="vh">{t("Where")}</span></dt><dd>{t(e.room)}</dd></div>}
            {e.leader && <div><dt><Icon name="users" /><span className="vh">{t("Led by")}</span></dt><dd>{t("With ")}<span data-no-translate>{e.leader}</span></dd></div>}
            {e.cost && <div><dt><Icon name="info" /><span className="vh">{t("Cost")}</span></dt><dd>{t("Additional cost: ")}{e.cost}</dd></div>}
          </dl>
          {e.desc && <p className="cal-dialog-desc">{t(e.desc)}</p>}

          {!past && kind === "family" && (
            <div className="cal-dialog-note">
              <Icon name="heart" />
              <div>
                <b>{t("Families: RSVP from your weekly message")}</b>
                <p>
                  {t("Not getting the weekly message yet? Call the front desk at ")}<a href={phoneHref}>{phone}</a>{t(" or ")}
                  <Link href="/stay-connected">{t("sign up for family updates")}</Link>.
                </p>
              </div>
            </div>
          )}

          {!past && kind === "resident" && (
            <p className="cal-dialog-note">
              <Icon name="users" />
              <span>{t("Residents: sign up with the activities team. Families: ask for a seat from your weekly message.")}</span>
            </p>
          )}

          {!past && kind === "public" && (
            signup ? (
              <div className="success cal-dialog-ok" role="status">
                <Icon name="check" />
                <div>
                  <b>{t("Thank you, you’re signed up for ")}{t(e.title)}{signup.party > 1 ? t(`, party of ${signup.party}`) : ""}.</b>
                  <p>
                    {t(`We’ll see you at ${fmtTime(e.start)}.`)}{" "}
                    {t("A member of our team will be in touch to confirm. Need to change your plans? Call us at ")}<a href={phoneHref}>{phone}</a>.
                  </p>
                </div>
              </div>
            ) : (
              <form className="cal-rsvp" onSubmit={submit} noValidate>
                <h3>{t("Let us know you’re coming")}</h3>
                <div className="form-grid">
                  <label className="field full">
                    <span>{t("Your name")}</span>
                    <input name="name" autoComplete="name" required />
                  </label>
                  <label className="field">
                    <span>{t("Phone")}</span>
                    <input name="phone" type="tel" autoComplete="tel" />
                  </label>
                  <label className="field">
                    <span>{t("Email")}</span>
                    <input name="email" type="email" autoComplete="email" />
                  </label>
                  <p className="cal-rsvp-hint full">{t("A phone number or an email address is enough.")}</p>
                  <label className="field">
                    <span>{t("Party size")}</span>
                    <select name="party" defaultValue="1">
                      {Array.from({ length: 6 }, (_, i) => <option key={i + 1} value={i + 1}>{t(`${i + 1} ${i === 0 ? "person" : "people"}`)}</option>)}
                    </select>
                  </label>
                </div>
                {err && <p className="cal-err" role="alert">{t(err)}</p>}
                <button type="submit" className="btn btn-lg cal-rsvp-btn">{t("Count me in")}</button>
              </form>
            )
          )}

          {past ? (
            <p className="muted small cal-dialog-past">{t("This event has already taken place.")}</p>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm cal-dialog-ics" onClick={() => downloadIcs([e], e.title, `${e.id}.ics`, icsPlace(c.site))}>
              <Icon name="calendar" /> {t("Add to my calendar")}
            </button>
          )}
        </div>
      )}
    </dialog>
  );
}
