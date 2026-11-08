"use client";

// An announcement: news that isn't an event ("Water off on the 3rd floor Tuesday 9–11"). Staff say what it is, who
// it's for and until when; Kinlight sends it by text and email in each person's language, adds it to the website and
// newsletter if it's public, and takes it down when it expires. Urgent (a closure or emergency) goes out at once and
// skips approval. From the all-communities view it can go to every community at once. Shown in this browser only.
import Link from "next/link";
import { useState } from "react";
import type { AnnounceSetup } from "@/data/staff/post";
import { addDays, dayName, fromIso, iso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";
import { Phone, SmsThread } from "../../phone/Phone";
import { Done, Switch, andList, type Happened } from "./PostBits";

const longDay = (s: string) => { const d = fromIso(s); return `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`; };

export function Announcement({ setups, fromChange = false }: { setups: AnnounceSetup[]; fromChange?: boolean }) {
  const many = setups.length > 1;
  const [where, setWhere] = useState<string>(many ? "all" : setups[0].slug);
  const [text, setText] = useState("");
  const [aud, setAud] = useState("everyone");
  const todayIso = setups[0].todayIso;
  const [ends, setEnds] = useState(iso(addDays(fromIso(todayIso), 3)));
  const [urgent, setUrgent] = useState(false);
  const [pub, setPub] = useState(true);
  const [sent, setSent] = useState(false);

  const chosen = where === "all" ? setups : setups.filter((s) => s.slug === where);
  const base = chosen[0];
  // Floors differ from one community to the next, so "a floor" is only offered for one community.
  const audiences = where === "all" ? base.audiences.filter((a) => a.group !== "floor") : base.audiences;
  const a = audiences.find((x) => x.k === aud) ?? audiences[0];
  const sum = (f: (s: AnnounceSetup) => number) => chosen.reduce((n, s) => n + f(s), 0);
  const resN = sum((s) => s.audiences.find((x) => x.k === a.k)?.residents ?? 0);
  const famN = sum((s) => s.audiences.find((x) => x.k === a.k)?.families ?? 0);
  const langs = [...new Set(chosen.flatMap((s) => s.languages.map((l) => l.k)))];
  const isPublic = pub && (a.group === "all" || a.group === "families");
  const name = where === "all" ? "Wrenhaven" : base.name;
  const sms = text ? `${urgent ? `URGENT from ${name}: ` : `${where === "all" ? "Wrenhaven" : base.short}: `}${text}${urgent ? ` Questions? Call ${base.phone}.` : ""}` : "";
  const who = [resN ? `${resN} residents` : "", famN ? `${famN} families` : ""].filter(Boolean);
  const scope = where === "all" ? `every community (${andList(setups.map((s) => s.name))})` : base.name;

  if (sent) {
    const items: Happened[] = [
      { icon: "sms", title: `Text and email to ${andList(who)}`, detail: `${urgent ? "Sent the moment you pressed send" : "Sent now"}, each in their own language: ${andList(langs)}. Residents who chose print get it at the front desk.` },
      ...(isPublic ? [{ icon: "globe" as const, title: "Website", detail: `On the news page${where === "all" ? " of each community" : ""}${urgent ? ", and at the top of every page" : ""}, until ${longDay(ends)}.` }] : [{ icon: "lock" as const, title: "Not on the website", detail: `It’s for ${a.label.toLowerCase()}, so it stays off the public website.` }]),
      ...(isPublic && !urgent ? [{ icon: "mail" as const, title: "Newsletter", detail: "In Sunday’s newsletter, if it’s still showing then." }] : []),
      { icon: "clock", title: `Removed ${longDay(ends)}`, detail: "Taken off the website and the newsletter automatically at the end of that day." },
      { icon: urgent ? "alert" : "check", title: urgent ? "Skipped approval" : "No approval needed", detail: urgent ? "Urgent announcements go out at once. The front desk has a printed notice." : "Announcements publish straight away." },
    ];
    return (
      <Done
        title={urgent ? "Sent now." : "Announcement sent."}
        line={<>To {a.label.toLowerCase()} at {scope}. Here’s what Kinlight did.</>}
        items={items}
        actions={<button type="button" className="sx-btn sx-btn-primary" onClick={() => { setSent(false); setText(""); setUrgent(false); }}><Icon name="plus" /> Another announcement</button>}
      />
    );
  }

  return (
    <div className="po-two">
      <form className="sx-card sx-card-body sx-form pt-form" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { setSent(true); window.scrollTo({ top: 0, behavior: "smooth" }); } }} aria-label="Announcement">
        {fromChange && (
          <div className="sx-callout info">
            <Icon name="info" />
            <p>Has something about one of today’s events changed (moved, cancelled, running late)? Use <Link className="sx-link" href="/staff/today">Something changed</Link> on Today: it tells only the people booked on it.</p>
          </div>
        )}
        <label>
          What is it?
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Water off on the third floor Tuesday, 9–11 am." required />
        </label>
        {many && (
          <fieldset className="po-field">
            <legend className="sx-lbl">Which communities?</legend>
            <div className="sx-seg po-seg" role="group" aria-label="Which communities">
              <button type="button" aria-pressed={where === "all"} onClick={() => setWhere("all")}>Every community</button>
              {setups.map((s) => <button key={s.slug} type="button" aria-pressed={where === s.slug} onClick={() => { setWhere(s.slug); setAud("everyone"); }}>{s.name}</button>)}
            </div>
          </fieldset>
        )}
        <fieldset className="po-field">
          <legend className="sx-lbl">Who is it for?</legend>
          <div className="sx-chips po-aud" role="group" aria-label="Who it’s for">
            {audiences.filter((x) => x.group !== "floor" && x.group !== "care").map((x) => <button key={x.k} type="button" aria-pressed={a.k === x.k} onClick={() => setAud(x.k)}>{x.label}</button>)}
          </div>
          <div className="sx-row">
            {audiences.some((x) => x.group === "floor") && (
              <label>A floor
                <select value={a.group === "floor" ? a.k : ""} onChange={(e) => e.target.value && setAud(e.target.value)}>
                  <option value="">Choose a floor</option>
                  {audiences.filter((x) => x.group === "floor").map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
                </select>
              </label>
            )}
            <label>A care area
              <select value={a.group === "care" ? a.k : ""} onChange={(e) => e.target.value && setAud(e.target.value)}>
                <option value="">Choose a care area</option>
                {audiences.filter((x) => x.group === "care").map((x) => <option key={x.k} value={x.k}>{x.label}</option>)}
              </select>
            </label>
          </div>
          <p className="sx-hint">{andList(who) || "Nobody yet"}{a.group === "floor" || a.group === "care" ? `, on ${a.label}` : ""}.</p>
        </fieldset>
        <label>
          Show it until
          <input type="date" value={ends} min={todayIso} onChange={(e) => setEnds(e.target.value)} />
        </label>
        {(a.group === "all" || a.group === "families") && (
          <Switch on={pub} onChange={setPub} label="Public: on the website and in the newsletter" hint="Turn off for news only the people it’s for should see." />
        )}
        <label className={`pt-urgent${urgent ? " on" : ""}`}>
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          <span><b>Urgent: a closure or emergency</b><small>Skips approval and goes out straight away by text, even outside the usual sending hours.</small></span>
        </label>
        <div className="pt-submit">
          <p>{urgent ? <b>Goes out straight away.</b> : "Publishes straight away: announcements don’t need approval."}</p>
          <button type="submit" className={`sx-btn sx-btn-lg ${urgent ? "sx-btn-terra" : "sx-btn-primary"}`} disabled={!text.trim()}>
            <Icon name="send" /> {urgent ? "Send now" : "Send"}
          </button>
        </div>
      </form>

      <section className="sx-card sx-card-body po-auto" aria-label="What Kinlight does automatically">
        <h2 className="pt-prev-h">What Kinlight does when you send it</h2>
        <ul className="po-autolist">
          <li><Icon name="sms" /><span><b>Text and email</b> to {andList(who) || "nobody yet"}, each in their own language ({andList(langs)}).</span></li>
          <li><Icon name="globe" /><span><b>Website and newsletter</b> {isPublic ? `while it’s showing, until ${longDay(ends)}.` : "not this time: it’s only for the people it’s for."}</span></li>
          <li><Icon name="clock" /><span><b>Taken down</b> automatically at the end of {longDay(ends)}.</span></li>
        </ul>
        <div className="prev-phone">
          <Phone size="sm" time="9:41" label="The text, as residents and families get it">
            <SmsThread name={name} sub={base.phone} initials={where === "all" ? "W" : base.short} bubbles={[{ time: "Now", text: sms || "Your announcement appears here." }]} />
          </Phone>
        </div>
      </section>
    </div>
  );
}
