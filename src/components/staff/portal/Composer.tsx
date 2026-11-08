"use client";

// Post: say something once and send it everywhere. Pick what it is (a photo, an event, a change or alert, a menu,
// or a flyer or PDF) and the form changes to match. One set of previews shows every place it will go. Photos are
// checked against the photo consent on file for each person staff tag (no face matching). Urgent alerts skip
// approval; everything else follows the approval rules. Nothing is sent: the result is shown in this browser only.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { eventKindLabel, type EventKind } from "@/data/shared";
import type { PhotoPreset, StaffData } from "@/data/staff/shared";
import { dayName, fmtTime, fromIso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";
import { MailMessage, Phone, SmsThread } from "../../phone/Phone";
import { useStaffCommunity } from "../StaffCommunity";
import { Badge } from "../ui";

export type PostType = "photo" | "event" | "change" | "menu" | "flyer";
type Aud = "everyone" | "lantern" | "booked";
type Chan = "web" | "family" | "resident" | "email" | "print" | "gbp";

export interface UpcomingEvent { id: string; title: string; date: string; start: number; room: string; kind: EventKind; cap?: number; taken?: number; families: number }

export interface ComposerProps {
  initial: PostType;
  brand: StaffData["brand"];
  copy: StaffData["publish"];
  presets: PhotoPreset[];
  /** Residents with no photo consent on file. */
  noConsent: string[];
  residentNames: string[];
  families: number;
  lanternFamilies: number;
  /** Residents who get texts or emails. */
  residents: number;
  lanternResidents: number;
  digest: string;
  rooms: string[];
  restaurants: string[];
  events: UpcomingEvent[];
  todayIso: string;
  approver: { name: string; first: string };
  /** The signed-in person approves posts themselves. */
  isApprover: boolean;
  me: string;
  sample: { contact: string; resident: string };
}

const types: { k: PostType; label: string; icon: "image" | "calendar" | "alert" | "fork" | "doc"; hint: string }[] = [
  { k: "photo", label: "A photo", icon: "image", hint: "From today, with a line about it" },
  { k: "event", label: "An event", icon: "calendar", hint: "Something coming up" },
  { k: "change", label: "A change or alert", icon: "alert", hint: "Moved, cancelled or urgent" },
  { k: "menu", label: "A menu", icon: "fork", hint: "Upload or photograph it" },
  { k: "flyer", label: "A flyer or PDF", icon: "doc", hint: "Calendars and flyers too" },
];

const chanLabel: Record<Chan, string> = { web: "Website", family: "Family text", resident: "Resident text", email: "Sunday email", print: "Printed copy", gbp: "Google Business Profile" };
const defaults: Record<PostType, Chan[]> = {
  photo: ["web", "family", "email"],
  event: ["web", "family", "resident", "email", "print"],
  change: ["web", "family", "resident"],
  menu: ["web", "family", "resident", "email", "print"],
  flyer: ["web", "family", "resident", "email", "print"],
};

const toMin = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const first = (n = "") => n.split(" ")[0];

export function Composer(p: ComposerProps) {
  const { site } = useStaffCommunity();
  const { brand, copy } = p;
  const resFirst = first(p.sample.resident);

  /** Templates live in the composer, one set per kind of post. Text-first: families and residents reply to act. */
  const templates: Record<PostType, { label: string; title: string; text: string }[]> = useMemo(() => ({
    photo: [
      { label: "Photos are up", title: "Photos from today", text: `Photos from today are up. Thank you to everyone who joined us!` },
      { label: "A thank-you", title: "Thank you, volunteers", text: `A big thank-you to the volunteers who made this afternoon so special.` },
    ],
    event: [
      { label: "Family event invitation", title: "Family Night", text: "An evening with music, dessert and games for all ages. Families, reply with how many are coming." },
      { label: "Outing with limited seats", title: "Bus Trip: Holiday Lights", text: "An evening drive to see the lights downtown, with hot cocoa on the bus." },
    ],
    change: [
      { label: "Moved to a new time", title: "", text: "now starts at 2:00 pm, in the same room." },
      { label: "Cancelled", title: "", text: "is cancelled today. We’re sorry; it will be back next week." },
      { label: "Closure or emergency", title: "", text: "Fire alarm test at 10:30 this morning. There’s no need to leave your apartment." },
    ],
    menu: [
      { label: "This week’s menus", title: "This week’s menus", text: "This week’s menus for all three restaurants are on the website." },
      { label: "Holiday menu", title: copy.menu.title, text: copy.menu.desc },
    ],
    flyer: [
      { label: "Monthly calendar", title: `The ${monthName(fromIso(p.todayIso))} activity calendar`, text: "The full calendar for the month, in large print." },
      { label: "Event flyer", title: copy.pdf.title, text: copy.pdf.desc },
    ],
  }), [copy, p.todayIso]);

  const presetFor = (t: PostType) => {
    if (t === "photo") return { title: p.presets[0].title, text: p.presets[0].caption, photo: p.presets[0].src, date: p.todayIso, time: copy.photo.time, room: copy.photo.room };
    if (t === "event") return { title: copy.event.title, text: copy.event.desc, photo: copy.event.photo, date: copy.eventDate, time: "10:45", room: copy.event.room };
    if (t === "menu") return { title: copy.menu.title, text: copy.menu.desc, photo: copy.menu.photo, date: copy.menu.date, time: copy.menu.time, room: p.restaurants[0] ?? copy.menu.room };
    if (t === "flyer") return { title: copy.pdf.title, text: copy.pdf.desc, photo: copy.pdf.photo, date: copy.pdf.date, time: copy.pdf.time, room: copy.pdf.room };
    return { title: "", text: "now starts at 2:00 pm, in the same room.", photo: "", date: p.todayIso, time: "14:00", room: "" };
  };

  const [type, setType] = useState<PostType>(p.initial);
  const [f, setF] = useState(() => presetFor(p.initial));
  const [evKind, setEvKind] = useState<EventKind>("resident");
  const [cap, setCap] = useState("12");
  const [aud, setAud] = useState<Aud>(p.initial === "change" ? "booked" : "everyone");
  const [chans, setChans] = useState<Set<Chan>>(new Set(defaults[p.initial]));
  const [urgent, setUrgent] = useState(false);
  const [special, setSpecial] = useState(true);
  const [changeOf, setChangeOf] = useState(p.events[0]?.id ?? "");
  const [shot, setShot] = useState(p.presets[0].k);
  const [upload, setUpload] = useState<{ url: string; name: string; pdf: boolean } | null>(null);
  const [tags, setTags] = useState<string[]>(p.presets[0].people.map((x) => x.name));
  const [cropped, setCropped] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState("");
  const [lang, setLang] = useState<"en" | "es">("en");
  const [stage, setStage] = useState<"edit" | "busy" | "sent" | "waiting">("edit");

  useEffect(() => () => { if (upload?.url) URL.revokeObjectURL(upload.url); }, [upload]);

  const pickType = (t: PostType) => {
    setType(t);
    setF(presetFor(t));
    setChans(new Set(defaults[t]));
    setAud(t === "change" ? "booked" : "everyone");
    setUrgent(false);
    setUpload(t === "flyer" ? { url: "", name: copy.pdf.file, pdf: true } : null);
    if (t === "photo") { setTags(p.presets[0].people.map((x) => x.name)); setShot(p.presets[0].k); }
    setCropped(new Set());
    setStage("edit");
  };
  const pickShot = (k: string) => {
    const pr = p.presets.find((x) => x.k === k)!;
    setShot(k);
    setUpload(null);
    setF({ ...f, title: pr.title, text: pr.caption, photo: pr.src });
    setTags(pr.people.map((x) => x.name));
    setCropped(new Set());
  };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const toggle = (c: Chan) => setChans((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  // What this post is about, for a change: the event it changes.
  const ev = p.events.find((e) => e.id === changeOf);
  const isEvent = type === "event" || type === "flyer";
  const ek: EventKind = isEvent ? evKind : "resident";
  const gbpOk = isEvent && ek === "public";
  const d = fromIso((type === "change" ? ev?.date : f.date) || p.todayIso);
  const start = type === "change" ? ev?.start ?? 600 : toMin(f.time);
  const when = `${dayName(d).slice(0, 3)}, ${monthName(d).slice(0, 3)} ${d.getUTCDate()}, ${fmtTime(start)}`;
  const title = type === "change" ? ev?.title ?? "" : f.title;
  const img = upload && !upload.pdf ? upload.url : f.photo;
  const seats = Number(cap) || 0;

  // Consent: every tagged person is checked against photo consent on file. No face matching.
  const noConsent = new Set(p.noConsent);
  const blocked = type === "photo" ? tags.filter((n) => noConsent.has(n) && !cropped.has(n)) : [];
  const shown = tags.filter((n) => !cropped.has(n));

  // Who it goes to.
  const lantern = aud === "lantern";
  const booked = aud === "booked" && ev;
  const famN = booked ? ev.families : lantern ? p.lanternFamilies : p.families;
  const resN = booked ? ev.taken ?? 0 : lantern ? p.lanternResidents : p.residents;
  const sent = [...chans].filter((c) => (c === "gbp" ? gbpOk : true));

  // The approval rules: resident photos, changes and special menus wait for the approver; urgent alerts skip it.
  const why =
    type === "photo" && shown.length ? "it shows residents" :
    type === "change" && !urgent ? "it changes something families and residents planned around" :
    type === "menu" && special ? "it’s a holiday or special menu" : "";
  const needsApproval = !!why && !p.isApprover;

  // The texts, in English and Spanish.
  const short = title.replace(/^Bus Trip: /, "");
  const famText = (es: boolean) => {
    if (type === "photo") return es ? `${brand.short}: ¡Fotos nuevas! ${f.title}. Véalas en ${brand.domain}/news` : `${brand.short}: New photos! ${f.title}. ${f.text.split(/(?<=[.!])\s/)[0]} See them: ${brand.domain}/news`;
    if (type === "change") return urgent
      ? es ? `URGENTE de ${brand.name}: ${f.text} ¿Preguntas? Llame al ${brand.phone}.` : `URGENT from ${brand.name}: ${f.text} Questions? Call ${brand.phone}.`
      : es ? `${brand.short}: Cambio: ${short}, ${when}, ${f.text}` : `${brand.short}: A change to ${short}, ${when}: it ${f.text}`;
    if (type === "menu") return es ? `${brand.short}: ${f.title}. ${copy.reserveEs}` : `${brand.short}: ${f.title}, ${when}. Families welcome. ${copy.reserveEn}`;
    if (ek === "public") return es ? `${brand.short}: ${short}, ${when}, ${f.room}. Abierto a todos: compártalo. Detalles: ${brand.domain}/calendar` : `${brand.short}: ${short}, ${when}, ${f.room}. Open to everyone: please share it with friends. Details: ${brand.domain}/calendar`;
    if (ek === "family") return es ? `${brand.short}: ¡Está invitado! ${short}, ${when}, ${f.room}. Responda con cuántos vienen y le confirmamos.` : `${brand.short}: You’re invited! ${short}, ${when}, ${f.room}. Reply with how many are coming and we’ll confirm.`;
    return es ? `${brand.short}: ${short}, ${when}.${seats ? " Lugares limitados." : ""} ¿Un lugar para ${resFirst}? Responda LUGAR y le preguntamos a ${resFirst}.` : `${brand.short}: ${short}, ${when}.${seats ? " Seats are limited." : ""} Want a seat for ${resFirst}? Reply SEAT and we’ll ask ${resFirst}.`;
  };
  const resText = () => {
    if (type === "photo") return `${brand.name}: new photos from ${f.title} are on the website. Ask the front desk for prints.`;
    if (type === "change") return urgent ? `URGENT: ${f.text} Questions? Call the front desk at ${brand.phone}.` : `${brand.name}: ${short} ${f.text}`;
    if (type === "menu") return `${brand.name}: ${f.title}, ${when}.`;
    if (ek === "family") return `${brand.name}: ${short}, ${when}. Your family is invited too; we’ll check with you before anyone is confirmed.`;
    if (ek === "public") return `${brand.name}: ${short}, ${when}, ${f.room}. Open to everyone: bring a friend!`;
    return `${brand.name}: ${short}, ${when}.${seats ? " Seats are limited." : ""} Want to go? Reply YES and we’ll save you a seat.`;
  };
  const sms = famText(lang === "es");

  const submit = () => {
    setStage("busy");
    window.setTimeout(() => { setStage(needsApproval ? "waiting" : "sent"); window.scrollTo({ top: 0, behavior: "smooth" }); }, 700);
  };

  const where = [
    chans.has("web") && "on the website",
    chans.has("family") && `sent to ${famN} families`,
    chans.has("resident") && `${resN} residents`,
    chans.has("print") && "ready to print",
  ].filter(Boolean) as string[];
  const whereLine = where.length ? where.join(", ").replace(/, ([^,]+)$/, " and $1") : "nowhere yet";

  if (stage === "sent" || stage === "waiting") {
    return (
      <div className="sx-card sx-card-body went pt-went">
        <div className="went-head">
          <Icon name={stage === "sent" ? "check" : "clock"} />
          <div>
            {stage === "sent" ? (
              <>
                <h2>{urgent ? "Sent now." : "Posted."} Here’s where it went.</h2>
                <p className="pt-went-line">{whereLine.charAt(0).toUpperCase() + whereLine.slice(1)}.</p>
              </>
            ) : (
              <>
                <h2>Sent to {p.approver.first} for approval</h2>
                <p className="pt-went-line">It needs {p.approver.first} because {why}. {p.approver.first} gets a text with the card; it goes out the moment it’s approved: {whereLine}.</p>
              </>
            )}
          </div>
        </div>
        <ul className="went-list">
          {chans.has("web") && <li><Icon name="globe" /><b>Website</b><span>{type === "menu" ? "Dining page" : type === "photo" ? "News page and home page" : "Calendar and home page"}.{ek === "resident" && isEvent ? " Name, day, time and description only." : ""}</span></li>}
          {chans.has("family") && <li><Icon name="sms" /><b>{famN} families</b><span>By text or email, in each family’s own language. Replies are read for them and confirmed before anything happens.</span></li>}
          {chans.has("resident") && <li><Icon name="sms" /><b>{resN} residents</b><span>Residents who chose texts or email. Large print for everyone else.</span></li>}
          {chans.has("email") && <li><Icon name="mail" /><b>Sunday email</b><span>In this week’s email, sending {p.digest}.</span></li>}
          {chans.has("print") && <li><Icon name="printer" /><b>Ready to print</b><span>Large print, sent to the front desk printer.</span></li>}
          {chans.has("gbp") && gbpOk && <li><Icon name="pin" /><b>Google Business Profile</b><span>Shows on Google Search and Maps until the day.</span></li>}
        </ul>
        <div className="pt-act">
          {stage === "sent" && <Link className="sx-btn sx-btn-primary" href={site(type === "menu" ? "/dining" : type === "photo" ? "/news" : "/calendar")} target="_blank"><Icon name="globe" /> See it on the website</Link>}
          <button className="sx-btn" type="button" onClick={() => pickType(type)}><Icon name="plus" /> Post something else</button>
          <Link className="sx-btn" href="/staff/today">Back to Today</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-compose">
      <form className="sx-card sx-card-body sx-form pt-form" onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label="Post">
        <fieldset className="pt-types">
          <legend className="sx-lbl">What is it?</legend>
          {types.map((t) => (
            <button key={t.k} type="button" aria-pressed={type === t.k} onClick={() => pickType(t.k)}>
              <Icon name={t.icon} />
              <b>{t.label}</b>
              <small>{t.hint}</small>
            </button>
          ))}
        </fieldset>

        <label className="pt-tpl">
          Start from a template
          <select value="" onChange={(e) => { const t = templates[type][Number(e.target.value)]; if (t) setF({ ...f, title: t.title || f.title, text: t.text }); }}>
            <option value="">Choose one (optional)</option>
            {templates[type].map((t, i) => <option key={t.label} value={i}>{t.label}</option>)}
          </select>
        </label>

        {type === "photo" && (
          <div className="pt-shots" role="group" aria-label="Choose a photo">
            {p.presets.map((x) => (
              <button key={x.k} type="button" aria-pressed={!upload && shot === x.k} onClick={() => pickShot(x.k)} aria-label={x.label}>
                <Image src={x.src} alt="" fill sizes="120px" />
              </button>
            ))}
            <label data-on={upload ? "true" : undefined}>
              <input type="file" accept="image/*" onChange={(e) => { const fl = e.target.files?.[0]; if (!fl) return; setUpload({ url: URL.createObjectURL(fl), name: fl.name, pdf: false }); setTags([]); setCropped(new Set()); }} />
              <Icon name="upload" /> Take or choose
            </label>
          </div>
        )}

        {type === "change" ? (
          <>
            <label>
              Which event?
              <select value={changeOf} onChange={(e) => setChangeOf(e.target.value)}>
                {p.events.map((e) => <option key={e.id} value={e.id}>{e.title} · {dayName(fromIso(e.date)).slice(0, 3)} {fmtTime(e.start)}</option>)}
              </select>
            </label>
            <label>
              What changed?
              <textarea rows={2} value={f.text} onChange={set("text")} />
            </label>
            <label className={`pt-urgent${urgent ? " on" : ""}`}>
              <input type="checkbox" checked={urgent} onChange={(e) => { setUrgent(e.target.checked); if (e.target.checked) { setAud("everyone"); setChans(new Set(["web", "family", "resident"])); } }} />
              <span><b>Urgent: an emergency or closure</b><small>Skips approval and goes out straight away, by text to everyone, with the same notice at the front desk.</small></span>
            </label>
          </>
        ) : (
          <>
            {isEvent && (
              <fieldset className="pub-kind">
                <legend className="sx-lbl">Who is the event for?</legend>
                <div className="sx-seg" role="group" aria-label="Event kind">
                  {(["resident", "family", "public"] as const).map((k) => (
                    <button key={k} type="button" aria-pressed={ek === k} onClick={() => { setEvKind(k); setChans((s) => { const n = new Set(s); if (k === "public") n.add("gbp"); else n.delete("gbp"); return n; }); }}>{eventKindLabel[k]}</button>
                  ))}
                </div>
                <p className="sx-hint">{ek === "public" ? "Anyone can sign up on the website; each sign-up is a lead." : ek === "family" ? "Families reply with how many are coming; the resident says yes first, then you approve." : "Residents reply YES or sign up with you; families can ask for a seat. Seats and the meeting point stay with staff."}</p>
              </fieldset>
            )}
            {type === "menu" && (
              <label>
                Restaurant
                <select value={f.room} onChange={set("room")}>{p.restaurants.map((r) => <option key={r}>{r}</option>)}</select>
              </label>
            )}
            <label>
              {type === "photo" ? "Headline" : "Title"}
              <input value={f.title} onChange={set("title")} required />
            </label>
            {type !== "photo" && (
              <div className="sx-row3">
                <label>Date<input type="date" value={f.date} onChange={set("date")} /></label>
                <label>Time<input type="time" value={f.time} onChange={set("time")} step={300} /></label>
                {isEvent ? <label>Seats<input type="number" min={0} inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="No limit" /></label> : <span />}
              </div>
            )}
            {isEvent && (
              <label>
                Where
                <select value={f.room} onChange={set("room")}>{p.rooms.map((r) => <option key={r}>{r}</option>)}</select>
              </label>
            )}
            <label>
              {type === "photo" ? "One sentence about it" : "Description"}
              <textarea value={f.text} onChange={set("text")} rows={3} />
            </label>
            {type === "menu" && (
              <label className="sx-check"><input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} /> A holiday or special menu ({p.approver.first} approves these)</label>
            )}
            {(type === "menu" || type === "flyer" || type === "event") && (
              <label className="pub-file">
                <input type="file" accept="image/*,application/pdf" onChange={(e) => { const fl = e.target.files?.[0]; if (!fl) return; setUpload({ url: URL.createObjectURL(fl), name: fl.name, pdf: fl.type === "application/pdf" }); }} />
                <span className="sx-thumb">
                  {upload?.pdf ? <span className="pt-pdf"><Icon name="doc" /></span> : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" />
                  )}
                </span>
                <span>
                  <b>{upload ? upload.name : type === "menu" ? "Upload the menu, or photograph the paper one" : "Add a photo or PDF"}</b>
                  <span>{type === "menu" || type === "flyer" ? "We read it in for you: check the text, then post." : "Tap to choose your own."}</span>
                </span>
              </label>
            )}
          </>
        )}

        {type === "photo" && (
          <div className="pt-consent">
            <p className="sx-lbl">Who’s in the photo?</p>
            <p className="sx-hint">Tag each resident. We check each person’s photo consent on file before anything goes out.</p>
            <ul className="pt-tags">
              {tags.map((n) => (
                <li key={n} className={cropped.has(n) ? "cut" : noConsent.has(n) ? "no" : "ok"}>
                  <Icon name={cropped.has(n) ? "minus" : noConsent.has(n) ? "alert" : "check"} />
                  <span>
                    <b>{n}</b>
                    <small>{cropped.has(n) ? "Cropped out" : noConsent.has(n) ? "No photo consent on file" : "Photo consent on file"}</small>
                  </span>
                  {noConsent.has(n) && !cropped.has(n) && <button type="button" className="sx-btn sx-btn-sm" onClick={() => setCropped((s) => new Set(s).add(n))}>Crop out</button>}
                  <button type="button" className="sx-x" aria-label={`Remove tag: ${n}`} onClick={() => setTags((t) => t.filter((x) => x !== n))}><Icon name="x" /></button>
                </li>
              ))}
            </ul>
            <div className="pt-tag-add">
              <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Tag a resident">
                <option value="">Tag a resident…</option>
                {p.residentNames.filter((n) => !tags.includes(n)).map((n) => <option key={n}>{n}</option>)}
              </select>
              <button type="button" className="sx-btn sx-btn-sm" disabled={!adding} onClick={() => { setTags((t) => [...t, adding]); setAdding(""); }}><Icon name="plus" /> Tag</button>
            </div>
            {blocked.length > 0 && (
              <div className="sx-callout" role="alert">
                <Icon name="alert" />
                <p><b>Posting is blocked.</b> No photo consent on file for {blocked.join(", ")}. Crop them out, or let {p.approver.first} decide.</p>
              </div>
            )}
          </div>
        )}

        {type !== "photo" && (
          <fieldset className="pt-aud">
            <legend className="sx-lbl">Who is it for?</legend>
            <div className="sx-seg" role="group" aria-label="Who it’s for">
              <button type="button" aria-pressed={aud === "everyone"} onClick={() => setAud("everyone")}>Everyone</button>
              <button type="button" aria-pressed={aud === "lantern"} onClick={() => setAud("lantern")}>Lantern families</button>
              {type === "change" && <button type="button" aria-pressed={aud === "booked"} onClick={() => setAud("booked")}>Booked on this event</button>}
            </div>
            <p className="sx-hint">{famN} families and {resN} residents.{aud === "booked" ? " Only the residents booked on it and their families." : ""}</p>
          </fieldset>
        )}

        <fieldset className="pt-chans">
          <legend className="sx-lbl">Where it goes</legend>
          {(Object.keys(chanLabel) as Chan[]).filter((c) => c !== "gbp" || gbpOk).map((c) => (
            <label key={c} className="sx-switch">
              <input type="checkbox" checked={chans.has(c)} onChange={() => toggle(c)} /> {chanLabel[c]}
            </label>
          ))}
        </fieldset>

        <div className="pt-submit">
          <p>{needsApproval ? <>Goes to <b>{p.approver.first}</b> first, because {why}.</> : urgent ? <b>Goes out straight away.</b> : <>Goes out now: {whereLine}.</>}</p>
          {blocked.length > 0 ? (
            <button type="button" className="sx-btn sx-btn-lg" onClick={() => setStage("waiting")}>Let {p.approver.first} decide</button>
          ) : (
            <button type="submit" className={`sx-btn sx-btn-lg ${urgent ? "sx-btn-terra" : "sx-btn-primary"}`} disabled={stage === "busy" || sent.length === 0 || !title}>
              <Icon name="send" /> {stage === "busy" ? "Sending…" : needsApproval ? `Send to ${p.approver.first}` : urgent ? "Send now" : "Post"}
            </button>
          )}
        </div>
      </form>

      <section className="pt-prev" aria-label="Preview: where it will go">
        <h2 className="pt-prev-h">Preview</h2>
        <div className="prev-grid">
          {chans.has("web") && (
            <div className="prev prev-wide">
              <div className="prev-h"><Icon name="globe" /> Website <span className="sx-hint">{brand.domain}/{type === "menu" ? "dining" : type === "photo" ? "news" : "calendar"}</span></div>
              <div className="prev-b">
                {type === "photo" ? (
                  <div className="news-card pt-news">
                    <div className="ph">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="tx"><small>News · Today</small><b>{f.title}</b><p>{f.text}</p></div>
                  </div>
                ) : (
                  <div className="pv-web">
                    <div className="pv-web-day">{dayName(d)}, {monthName(d)} {d.getUTCDate()}</div>
                    <div className={`pv-web-card${img && type !== "change" ? "" : " pt-noimg"}`} style={type === "change" ? { borderLeftColor: urgent ? "var(--terra)" : "var(--butter)" } : undefined}>
                      {img && type !== "change" && (
                        <div className="pv-web-img">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                        </div>
                      )}
                      <div className="pv-web-t">
                        <time>{fmtTime(start)}</time>
                        <b>{type === "change" ? `${urgent ? "Urgent: " : "Change: "}${title}` : f.title}</b>
                        {type === "change" ? <span className="pv-web-desc">{f.text}</span> : isEvent && ek === "resident" ? <span className="pv-web-desc">{f.text}</span> : <span>{f.room}</span>}
                        {isEvent && ek === "public" && <span className="pv-web-btn">Sign up</span>}
                        {isEvent && ek === "family" && <span className="pv-web-note">Families: RSVP by replying to your weekly message</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {chans.has("family") && (
            <div className="prev">
              <div className="prev-h">
                <Icon name="sms" /> Family text
                <span className="sx-seg" role="group" aria-label="Text language">
                  <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
                  <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
                </span>
              </div>
              <div className="prev-b prev-phone">
                <Phone size="sm" time="10:02" label={`Text message on ${p.sample.contact}’s phone`}>
                  <SmsThread name={brand.name} sub={brand.phone} initials={brand.short} bubbles={[{ time: "Today 10:02 am", text: sms, img: type === "photo" ? img : undefined }]} />
                </Phone>
                <p className="pv-meta">To {famN} families, each in their own language</p>
              </div>
            </div>
          )}
          {chans.has("resident") && (
            <div className="prev">
              <div className="prev-h"><Icon name="sms" /> Resident text</div>
              <div className="prev-b prev-phone">
                <Phone size="sm" time="9:30" label={`Text message on ${p.sample.resident}’s phone`}>
                  <SmsThread name={brand.name} sub={brand.phone} initials={brand.short} bubbles={[{ time: "Today 9:30 am", text: resText() }]} />
                </Phone>
                <p className="pv-meta">To {resN} residents who chose texts</p>
              </div>
            </div>
          )}
          {chans.has("email") && (
            <div className="prev">
              <div className="prev-h"><Icon name="mail" /> Sunday email <span className="sx-hint">{p.digest}</span></div>
              <div className="prev-b prev-phone">
                <Phone size="sm" time="5:01" label={`The Sunday email in ${p.sample.contact}’s inbox`}>
                  <MailMessage from={brand.name} address={`news@${brand.domain}`} to={p.sample.contact} subject={`This week at ${brand.name}`} time="5:00 pm">
                    <div className="ph-em">
                      <div className="ph-em-banner">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img/brand/dots.png" alt="" /> This week at {brand.short}
                      </div>
                      <p className="ph-em-p">{brand.hello}</p>
                      <div className="ph-em-item">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" />
                        ) : <span />}
                        <span><b>{type === "change" ? `Change: ${title}` : f.title}</b><small>{when}</small></span>
                      </div>
                      <p className="ph-em-foot">Sent by {brand.name} · {brand.phone} · Settings or unsubscribe</p>
                    </div>
                  </MailMessage>
                </Phone>
              </div>
            </div>
          )}
          {chans.has("print") && (
            <div className="prev">
              <div className="prev-h"><Icon name="printer" /> Printed copy <span className="sx-hint">Large print</span></div>
              <div className="prev-b">
                <div className="pv-flyer">
                  <div className="pv-flyer-top">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/img/brand/dots.png" alt="" width={14} height={14} /> {brand.name}
                  </div>
                  {img && type !== "change" && (
                    <div className="pv-flyer-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                    </div>
                  )}
                  <div className="pv-flyer-t">
                    <b>{type === "change" ? `${urgent ? "Notice" : "Change"}: ${short}` : short}</b>
                    <span>{dayName(d)}, {monthName(d)} {d.getUTCDate()} · {fmtTime(start)}</span>
                    <small>{type === "change" ? f.text : isEvent && ek === "public" ? `Everyone welcome · ${brand.domain}` : isEvent && seats ? "Limited seats · sign up at the front desk" : f.room}</small>
                  </div>
                  <div className="pv-flyer-foot">Questions? {brand.phone}</div>
                </div>
              </div>
            </div>
          )}
          {chans.has("gbp") && gbpOk && (
            <div className="prev">
              <div className="prev-h"><Icon name="pin" /> Google Business Profile</div>
              <div className="prev-b">
                <div className="pt-gbp">
                  <b>{brand.name}</b>
                  <small>Event · {when}</small>
                  <p>{short}. {f.text}</p>
                  <span>Learn more</span>
                </div>
              </div>
            </div>
          )}
          {sent.length === 0 && <p className="sx-empty">Pick at least one place for it to go.</p>}
        </div>
        {type === "photo" && shown.length > 0 && <p className="sx-hint pt-prev-note"><Badge tone="good">{shown.length} tagged</Badge> {blocked.length ? `${blocked.length} still need a decision.` : "Everyone tagged has photo consent on file."}</p>}
      </section>
    </div>
  );
}
