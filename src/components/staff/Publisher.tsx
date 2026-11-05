"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "../Icon";
import { MailMessage, Phone, SmsThread, type Bubble } from "../phone/Phone";
import { Badge } from "./ui";
import { fmtTime, fromIso, dayName, monthName } from "@/lib/clock";
import { eventKindLabel, type EventKind } from "@/data/shared";
import type { StaffData } from "@/data/staff/shared";
import { useStaffCommunity } from "./StaffCommunity";

type Kind = "event" | "menu" | "photo" | "pdf";
type Aud = "everyone" | "lantern";
type Chan = "web" | "sms" | "email" | "flyer" | "gbp";

export interface PublisherProps {
  rooms: string[];
  families: number;
  lanternFamilies: number;
  smsReachable: number;
  emailReachable: number;
  digest: string;
  wine: { date: string; start: number; cap: number; taken: number };
  /** Who the "Event" starting point is for (from the real calendar event). */
  wineKind: EventKind;
  todayIso: string;
  brand: StaffData["brand"];
  /** The Executive Director, who approves posts with resident photos. */
  approver: { name: string; first: string };
  /** The community's starting points and contact lines. */
  copy: StaffData["publish"];
  /** A family member whose phone the text and email previews show. */
  sample: { contact: string; resident: string };
}

const kinds: { k: Kind; label: string; icon: "calendar" | "fork" | "image" | "doc" }[] = [
  { k: "event", label: "Event", icon: "calendar" },
  { k: "menu", label: "Menu change", icon: "fork" },
  { k: "photo", label: "Photo", icon: "image" },
  { k: "pdf", label: "PDF or flyer", icon: "doc" },
];

const chanInfo: Record<Chan, { label: string }> = {
  web: { label: "Website" },
  sms: { label: "Family text message" },
  email: { label: "Weekly email digest" },
  flyer: { label: "Large-print flyer" },
  gbp: { label: "Google Business Profile" },
};

/** What each kind of event does publicly, in one line. */
const kindHelp: Record<EventKind, string> = {
  public: "Anyone can come (an open house). Full details and a public sign-up form on the website; each sign-up becomes a lead.",
  family: "For families on your list (a family barbecue). Families RSVP from the personal link in their weekly message; staff approve.",
  resident: "A resident activity or outing. The website shows name, day, time and description only; residents sign up with staff, families ask for a seat through their personal link.",
};

const esDays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const esMonths = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function Publisher(p: PublisherProps) {
  const { site } = useStaffCommunity();
  const { brand, copy, sample } = p;
  const presets: Record<Kind, { title: string; date: string; time: string; room: string; cap: string; desc: string; photo: string; chans: Chan[] }> = useMemo(() => {
    const { event, menu, photo, pdf } = copy;
    return {
      event: { title: event.title, date: p.wine.date, time: toHHMM(p.wine.start), room: event.room, cap: String(p.wine.cap), desc: event.desc, photo: event.photo, chans: ["web", "sms", "email", "flyer"] },
      menu: { title: menu.title, date: menu.date, time: menu.time, room: menu.room, cap: menu.cap, desc: menu.desc, photo: menu.photo, chans: ["web", "sms", "email", "flyer", "gbp"] },
      photo: { title: photo.title, date: p.todayIso, time: photo.time, room: photo.room, cap: photo.cap, desc: photo.desc, photo: photo.photo, chans: ["web", "sms", "email"] },
      pdf: { title: pdf.title, date: pdf.date, time: pdf.time, room: pdf.room, cap: pdf.cap, desc: pdf.desc, photo: pdf.photo, chans: ["web", "sms", "email", "flyer"] },
    };
  }, [p.wine, p.todayIso, copy]);
  const esTitles: Record<string, string> = Object.fromEntries([copy.event, copy.menu, copy.photo, copy.pdf].map((x) => [x.title, x.titleEs]));

  const [kind, setKind] = useState<Kind>("event");
  const [evKind, setEvKind] = useState<EventKind>(p.wineKind);
  const [f, setF] = useState(presets.event);
  const [aud, setAud] = useState<Aud>("everyone");
  const [chans, setChans] = useState<Set<Chan>>(new Set(presets.event.chans));
  const [file, setFile] = useState<{ url: string; name: string; pdf: boolean } | null>(null);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [stage, setStage] = useState<"edit" | "sending" | "done">("edit");
  const [step, setStep] = useState(0);

  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);

  /** Events and flyers are for someone: public, family or resident. Menus and photos aren't events. */
  const isEvent = kind === "event" || kind === "pdf";
  const ek: EventKind = isEvent ? evKind : "resident";
  /** Google posts are public, so they're for public events, menus and photos only. */
  const gbpOk = !isEvent || ek === "public";

  const pick = (k: Kind) => {
    setKind(k);
    setF(presets[k]);
    setChans(new Set(presets[k].chans));
    setFile(k === "pdf" ? { url: "", name: copy.pdf.file, pdf: true } : null);
    setAud("everyone");
    setEvKind(k === "event" ? p.wineKind : "resident");
  };
  const chooseKind = (k: EventKind) => {
    setEvKind(k);
    setChans((s) => {
      const n = new Set(s);
      if (k === "public") n.add("gbp");
      else n.delete("gbp");
      return n;
    });
    if (k !== "resident") setAud("everyone");
  };
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const toggle = (c: Chan) => setChans((s) => { const n = new Set(s); if (n.has(c)) n.delete(c); else n.add(c); return n; });

  const d = fromIso(f.date || p.todayIso);
  const start = toMin(f.time);
  const whenEn = `${dayName(d).slice(0, 3)}, ${monthName(d).slice(0, 3)} ${d.getUTCDate()} at ${fmtTime(start)}`;
  const whenEs = `${esDays[d.getUTCDay()]} ${d.getUTCDate()} de ${esMonths[d.getUTCMonth()]} a las ${fmtTime(start)}`;
  const cap = Number(f.cap) || 0;
  const taken = kind === "event" ? Math.min(cap, p.wine.taken) : 0;
  const left = Math.max(0, cap - taken);
  const img = file && !file.pdf ? file.url : f.photo;
  const lantern = aud === "lantern";
  const families = lantern ? p.lanternFamilies : p.families;
  const emails = lantern ? copy.lanternEmails : p.emailReachable;
  const titleEs = esTitles[f.title] ?? f.title;
  const sent = [...chans].filter((c) => c !== "gbp" || gbpOk);

  /** Each family's own short link; the preview shows the sample family's. */
  const link = `${brand.short.toLowerCase()}.link/r/7Kq2`;
  const resFirst = sample.resident.split(" ")[0];
  const shortT = f.title.replace(/^Bus Trip: /, "");
  const shortEs = titleEs.replace(/^Excursión: /, "");

  const smsEn =
    kind === "photo"
      ? `${brand.short}: New photos! ${f.title}. ${f.desc.split(". ")[0]}. See them: ${brand.domain}/news`
      : kind === "menu"
        ? `${brand.short}: ${f.title}, ${whenEn}. Families welcome. ${copy.reserveEn}`
        : ek === "public"
          ? `${brand.short}: ${shortT}, ${whenEn}, ${f.room}. Open to everyone: please share this with friends who are looking. Details and sign-up: ${brand.domain}/calendar`
          : ek === "family"
            ? `${brand.short}: You’re invited! ${shortT}, ${whenEn}, ${f.room}. RSVP or ask for a seat: ${link}`
            : `${brand.short}: ${shortT}, ${whenEn}.${cap ? ` ${left} of ${cap} seats left.` : ""} Ask for a seat for ${resFirst}: ${link}`;
  const smsEs =
    kind === "photo"
      ? `${brand.short}: ¡Fotos nuevas! ${titleEs}. Véalas en ${brand.domain}/news`
      : kind === "menu"
        ? `${brand.short}: ${titleEs}, ${whenEs}. Familias bienvenidas. ${copy.reserveEs}`
        : ek === "public"
          ? `${brand.short}: ${shortEs}, ${whenEs}, ${f.room}. Abierto a todos: compártalo con amigos que estén buscando. Detalles e inscripción: ${brand.domain}/calendar`
          : ek === "family"
            ? `${brand.short}: ¡Está invitado! ${shortEs}, ${whenEs}, ${f.room}. Confirme o pida un lugar: ${link}`
            : `${brand.short}: ${shortEs}, ${whenEs}.${cap ? ` Quedan ${left} de ${cap} lugares.` : ""} Pida un lugar para ${resFirst}: ${link}`;
  const smsText = lang === "en" ? smsEn : smsEs;
  const segs = Math.ceil(smsText.length / 160);

  /** Family and resident events: a reply can start a request, but it finishes on the personal link. */
  const replyBubbles: Bubble[] =
    isEvent && ek !== "public"
      ? lang === "en"
        ? [
            { me: true, text: ek === "family" ? "Yes! 3 of us" : `Yes please, for ${resFirst}` },
            { text: `Thanks! Finish your ${ek === "family" ? "RSVP" : "request"} here, it takes a few seconds: ${link}. We’ll confirm within 1 business day.` },
          ]
        : [
            { me: true, text: ek === "family" ? "¡Sí! Somos 3" : `Sí, por favor, para ${resFirst}` },
            { text: `¡Gracias! Termine su ${ek === "family" ? "confirmación" : "solicitud"} aquí, toma unos segundos: ${link}. Le confirmamos en 1 día hábil.` },
          ]
      : [];

  const publish = () => {
    setStage("sending");
    setStep(0);
    const n = sent.length;
    for (let i = 1; i <= n; i++) window.setTimeout(() => setStep(i), i * 260);
    window.setTimeout(() => { setStage("done"); window.scrollTo({ top: 0, behavior: "smooth" }); }, n * 260 + 500);
  };

  if (stage === "done") {
    const delivered = families - (lantern ? 0 : 3);
    const failed = families - delivered;
    const where = kind === "menu" ? "dining page" : kind === "photo" ? "news page and home page" : "activity calendar and home page";
    const summary = [
      chans.has("web") && "On the website",
      chans.has("sms") && `sent to ${families} families`,
      chans.has("email") && "in this week’s digest",
      chans.has("flyer") && "ready to print",
    ].filter(Boolean).join(", ");
    return (
      <div className="sx-card sx-card-body went">
        <div className="went-head">
          <Icon name="check" />
          <div>
            <h2>Published. Here’s where it went.</h2>
            <p>
              {summary ? `${summary.charAt(0).toUpperCase()}${summary.slice(1)}.` : ""} “{f.title}” · {isEvent ? `${eventKindLabel[ek]} · ` : ""}{lantern ? "Lantern families" : "everyone"} · just now
            </p>
          </div>
        </div>
        <ul className="went-list">
          {chans.has("web") && (
            <li>
              <Icon name="globe" />
              <b>Website <Badge tone="good">Live</Badge></b>
              <span>
                On the {where}.{" "}
                {isEvent
                  ? ek === "public"
                    ? "Full details with a public sign-up form; each sign-up becomes a lead in Tours & enquiries."
                    : ek === "family"
                      ? "Shown with “Families: RSVP from your weekly message”."
                      : "Name, day, time and description only. Seats and the departure point stay in the staff calendar."
                  : ""}{" "}
                Sitemap updated and Google notified.
              </span>
            </li>
          )}
          {chans.has("sms") && (
            <li>
              <Icon name="sms" />
              <b>Sent to {families} families</b>
              <span>
                {delivered} delivered · {failed} failed{failed ? " (landline numbers, sent by email instead)" : ""} · {lantern ? copy.lanternTranslated : copy.translated} in {copy.otherLangs}
                {isEvent && ek !== "public" ? ". Each family’s text has its own personal link." : ""}
              </span>
            </li>
          )}
          {chans.has("email") && (
            <li>
              <Icon name="mail" />
              <b>In this week’s digest <Badge tone="info">Queued</Badge></b>
              <span>To {emails} families, sending {p.digest}.</span>
            </li>
          )}
          {chans.has("flyer") && (
            <li>
              <Icon name="printer" />
              <b>Ready to print</b>
              <span>Large-print flyer (letter, 24 pt) sent to the front desk printer. {copy.flyerPost}</span>
            </li>
          )}
          {chans.has("gbp") && gbpOk && (
            <li>
              <Icon name="pin" />
              <b>Google Business Profile <Badge tone="good">Posted</Badge></b>
              <span>Shows on Google Search and Maps until {dayName(d).slice(0, 3)}, {monthName(d).slice(0, 3)} {d.getUTCDate()}.</span>
            </li>
          )}
          {isEvent && ek !== "public" && (
            <li className="wait">
              <Icon name="clock" />
              <b>{ek === "family" ? "RSVPs" : "Seat requests"} come to you</b>
              <span>
                {ek === "family"
                  ? "Family RSVPs will appear in Sign-ups & RSVPs for approval. Approve each within 1 business day; the family gets a confirmation text."
                  : `Families’ seat requests will appear in Sign-ups & RSVPs for approval. Check with the resident first, then confirm. Residents who sign up with you go straight onto the list.`}{" "}
                <Link className="sx-link" href="/staff/sign-ups">Open Sign-ups & RSVPs</Link>
              </span>
            </li>
          )}
          {isEvent && ek === "public" && (
            <li>
              <Icon name="users" />
              <b>Sign-ups become leads</b>
              <span>
                Each public sign-up lands in Tours & enquiries with the source “Website: Open House sign-up”, and gets an instant thank-you text and email. <Link className="sx-link" href="/staff/tours">Open Tours & enquiries</Link>
              </span>
            </li>
          )}
          <li>
            <Icon name="sparkle" />
            <b>Search and AI</b>
            <span>Published with structured data, so Google and AI assistants can answer “what’s on at {brand.name}?”</span>
          </li>
        </ul>
        <div className="btn-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="sx-btn sx-btn-primary" href={site(kind === "menu" ? "/dining" : kind === "photo" ? "/news" : "/calendar")} target="_blank">
            <Icon name="globe" /> See it on the website
          </Link>
          <Link className="sx-btn" href="/staff/messages">
            Track delivery
          </Link>
          <button className="sx-btn" type="button" onClick={() => { setStage("edit"); pick("event"); }}>
            <Icon name="plus" /> Post something else
          </button>
        </div>
      </div>
    );
  }

  const resident = isEvent && ek === "resident";
  const tag = isEvent && ek !== "resident" ? (ek === "public" ? "Open to the public" : "Family event") : undefined;

  return (
    <div className="pub">
      <section className="sx-card" aria-label="What you’re posting">
        <form className="sx-card-body sx-form" onSubmit={(e) => { e.preventDefault(); publish(); }}>
          <div className="pub-type" role="group" aria-label="What are you posting?">
            {kinds.map((k) => (
              <button key={k.k} type="button" aria-pressed={kind === k.k} onClick={() => pick(k.k)}>
                <Icon name={k.icon} />
                {k.label}
              </button>
            ))}
          </div>
          {isEvent && (
            <fieldset className="pub-kind">
              <legend className="sx-lbl">Who is this event for?</legend>
              <div className="sx-seg" role="group" aria-label="Event kind">
                {(["public", "family", "resident"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={ek === k} onClick={() => chooseKind(k)}>
                    {k === "public" ? "Public" : k === "family" ? "Family" : "Resident"}
                  </button>
                ))}
              </div>
              <p className="sx-hint">{kindHelp[ek]}</p>
            </fieldset>
          )}
          <label>
            Title
            <input value={f.title} onChange={set("title")} required />
          </label>
          <div className="sx-row3">
            <label>
              Date
              <input type="date" value={f.date} onChange={set("date")} />
            </label>
            <label>
              Time
              <input type="time" value={f.time} onChange={set("time")} step={300} />
            </label>
            <label>
              Seat limit
              <input type="number" min={0} inputMode="numeric" value={f.cap} onChange={set("cap")} placeholder="No limit" />
            </label>
          </div>
          <label>
            Room or departure point
            <select value={f.room} onChange={set("room")}>
              {p.rooms.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {isEvent && <span className="sx-hint">{resident ? "Seat limit and place are for staff only: not shown publicly for resident activities." : "Seat limit is for staff only; the place is shown on the website."}</span>}
          </label>
          <label>
            Description
            <textarea value={f.desc} onChange={set("desc")} rows={3} />
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="sx-form">
            <legend className="sx-lbl" style={{ marginBottom: 6 }}>Which families?</legend>
            <div className="sx-seg" role="group" aria-label="Audience">
              <button type="button" aria-pressed={aud === "everyone"} onClick={() => setAud("everyone")}>
                Everyone · {p.families} families
              </button>
              <button type="button" aria-pressed={aud === "lantern"} onClick={() => setAud("lantern")}>
                Lantern families · {p.lanternFamilies}
              </button>
            </div>
          </fieldset>
          <label className="pub-file">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const fl = e.target.files?.[0];
                if (!fl) return;
                setFile({ url: URL.createObjectURL(fl), name: fl.name, pdf: fl.type === "application/pdf" });
              }}
            />
            <span className="sx-thumb">
              {file?.pdf ? (
                <span style={{ display: "grid", placeItems: "center", height: "100%" }}><Icon name="doc" /></span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </span>
            <span>
              <b>{file ? file.name : "Attach a photo or PDF"}</b>
              <span>{file ? "Tap to change. Photos are resized and faces checked against photo consent." : "Using the photo from our library. Tap to choose your own."}</span>
            </span>
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sx-lbl" style={{ marginBottom: 4 }}>Publish to</legend>
            <div className="pub-chan">
              {(Object.keys(chanInfo) as Chan[]).map((c) => (
                <label key={c} className="sx-switch">
                  <input type="checkbox" checked={chans.has(c) && (c !== "gbp" || gbpOk)} disabled={c === "gbp" && !gbpOk} onChange={() => toggle(c)} />
                  {chanInfo[c].label}
                  {c === "gbp" && !gbpOk && <span className="sx-hint"> · public events only</span>}
                </label>
              ))}
            </div>
          </fieldset>
          {kind === "photo" && (
            <div className="sx-callout info">
              <Icon name="info" />
              <p>Faces are checked against photo consent on file before anything goes out. Anyone without consent is cropped out or the post goes to {p.approver.name} first.</p>
            </div>
          )}
          <div className="pub-foot">
            <p>
              {sent.length} places · {chans.has("sms") ? `${families} families` : "no texts"}
            </p>
            <button type="submit" className="sx-btn sx-btn-terra sx-btn-lg" disabled={stage === "sending" || sent.length === 0}>
              <Icon name="send" /> {stage === "sending" ? `Publishing… ${step}/${sent.length}` : "Publish everywhere"}
            </button>
          </div>
        </form>
      </section>

      <section aria-label="Previews" className="prev-grid">
        <div className={`prev prev-wide ${chans.has("web") ? "" : "off"}`}>
          <div className="prev-h">
            <Icon name="globe" /> Website {kind === "menu" ? "dining page" : kind === "photo" ? "news" : "calendar"}{" "}
            <span>{chans.has("web") ? <Badge tone="good">On</Badge> : <Badge>Off</Badge>}</span>
          </div>
          <div className="prev-b">
            <div className="pv-web">
              <div className="pv-web-bar">
                <span>{brand.domain}/{kind === "menu" ? "dining" : kind === "photo" ? "news" : "calendar"}</span>
                <span>{lantern ? "Lantern" : "All events"}</span>
              </div>
              <div className="pv-web-day">{dayName(d)}, {monthName(d)} {d.getUTCDate()}</div>
              <div className="pv-web-card" style={lantern ? { borderLeftColor: "var(--c-lantern)" } : kind === "menu" ? { borderLeftColor: "var(--olive)" } : undefined}>
                <div className="pv-web-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                </div>
                <div className="pv-web-t">
                  <time>{fmtTime(start)}</time>
                  <b>{f.title}</b>
                  {!resident && <span>{f.room}</span>}
                  {tag && <span className={`pv-web-tag ${ek}`}>{tag}</span>}
                  {(resident || ek === "public") && f.desc && <span className="pv-web-desc">{f.desc}</span>}
                  {isEvent && ek === "public" && <span className="pv-web-btn">Sign up</span>}
                  {isEvent && ek === "family" && <span className="pv-web-note">Families: RSVP from your weekly message</span>}
                </div>
              </div>
            </div>
            {resident && <p className="sx-hint pv-web-why">Resident activities show name, day, time and description only: no place, seats or sign-up form.</p>}
          </div>
        </div>

        <div className={`prev ${chans.has("sms") ? "" : "off"}`}>
          <div className="prev-h">
            <Icon name="sms" /> Family text
            <span className="sx-seg" role="group" aria-label="Text language">
              <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
              <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>ES</button>
            </span>
          </div>
          <div className="prev-b prev-phone">
            <Phone size="sm" time="10:02" label={`Text message on ${sample.contact}’s phone`}>
              <SmsThread
                name={brand.name}
                sub={brand.phone}
                initials={brand.short}
                bubbles={[{ time: "Today 10:02 am", text: smsText, img: kind === "photo" ? img : undefined }, ...replyBubbles]}
              />
            </Phone>
            <p className="pv-meta">
              {smsText.length} characters · {segs} text{segs > 1 ? "s" : ""} · to {families} families
            </p>
          </div>
        </div>

        <div className={`prev ${chans.has("email") ? "" : "off"}`}>
          <div className="prev-h">
            <Icon name="mail" /> Weekly digest <span className="sx-hint">{p.digest}</span>
          </div>
          <div className="prev-b prev-phone">
            <Phone size="sm" time="5:01" label={`The weekly digest in ${sample.contact}’s inbox`}>
              <MailMessage from={brand.name} address={`news@${brand.domain}`} to={sample.contact} subject={`Your week at ${brand.name}`} time={p.digest.split(", ").pop() ?? "5:00 pm"}>
                <div className="ph-em">
                  <div className="ph-em-banner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/img/brand/dots.png" alt="" />
                    This week at {brand.short}
                  </div>
                  <p className="ph-em-p">{brand.hello} Here’s what’s coming up for {resFirst}.</p>
                  <p className="ph-em-h">Coming up</p>
                  <div className="ph-em-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" />
                    <span>
                      <b>{f.title}</b>
                      <small>{whenEn}{resident ? "" : ` · ${f.room}`}</small>
                    </span>
                  </div>
                  {isEvent && <span className="ph-em-btn">{ek === "public" ? "Share with a friend" : ek === "family" ? "RSVP" : `Ask for a seat for ${resFirst}`}</span>}
                  <div className="ph-em-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={copy.digestExtra.photo} alt="" />
                    <span>
                      <b>{copy.digestExtra.title}</b>
                      <small>{copy.digestExtra.when}</small>
                    </span>
                  </div>
                  <p className="ph-em-foot">Sent by {brand.name} · {brand.phone} · Update your preferences or unsubscribe</p>
                </div>
              </MailMessage>
            </Phone>
          </div>
        </div>

        <div className={`prev ${chans.has("flyer") ? "" : "off"}`}>
          <div className="prev-h">
            <Icon name="printer" /> Large-print flyer <span className="sx-hint">Letter · 24 pt</span>
          </div>
          <div className="prev-b">
            <div className="pv-flyer">
              <div className="pv-flyer-top">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/brand/dots.png" alt="" width={14} height={14} /> {brand.name}
              </div>
              <div className="pv-flyer-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
              </div>
              <div className="pv-flyer-t">
                <b>{shortT}</b>
                <span>{dayName(d)}, {monthName(d)} {d.getUTCDate()} · {fmtTime(start)}</span>
                <small>
                  {f.room}
                  {isEvent && ek === "public" ? ` · Everyone welcome · Sign up at ${brand.domain}` : isEvent && ek === "family" ? " · Families: RSVP from your weekly message" : cap ? ` · Limited to ${cap} · Sign up at the front desk` : ""}
                </small>
              </div>
              <div className="pv-flyer-foot">Questions? Ask {copy.flyerAsk} · {brand.phone}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
