"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "../Icon";
import { Badge } from "./ui";
import { fmtTime, fromIso, dayName, monthName } from "@/lib/clock";
import type { StaffData } from "@/data/staff/shared";
import { useStaffCommunity } from "./StaffCommunity";

type Kind = "event" | "menu" | "photo" | "pdf";
type Aud = "everyone" | "harbor";
type Chan = "web" | "sms" | "email" | "flyer" | "facebook" | "gbp";

export interface PublisherProps {
  rooms: string[];
  families: number;
  harborFamilies: number;
  smsReachable: number;
  emailReachable: number;
  digest: string;
  wine: { date: string; start: number; cap: number; taken: number };
  todayIso: string;
  brand: StaffData["brand"];
  /** The Executive Director, who approves posts with resident photos. */
  approver: { name: string; first: string };
  /** The community's starting points and contact lines. */
  copy: StaffData["publish"];
}

const kinds: { k: Kind; label: string; icon: "calendar" | "fork" | "image" | "doc" }[] = [
  { k: "event", label: "Event", icon: "calendar" },
  { k: "menu", label: "Menu change", icon: "fork" },
  { k: "photo", label: "Photo", icon: "image" },
  { k: "pdf", label: "PDF or flyer", icon: "doc" },
];

const chanInfo: Record<Chan, { label: string; icon: "globe" | "sms" | "mail" | "printer" | "facebook" | "pin" }> = {
  web: { label: "Website", icon: "globe" },
  sms: { label: "Family text message", icon: "sms" },
  email: { label: "Weekly email digest", icon: "mail" },
  flyer: { label: "Large-print flyer", icon: "printer" },
  facebook: { label: "Facebook", icon: "facebook" },
  gbp: { label: "Google Business Profile", icon: "pin" },
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
  const { brand, approver, copy } = p;
  const presets: Record<Kind, { title: string; date: string; time: string; room: string; cap: string; desc: string; photo: string; chans: Chan[] }> = useMemo(() => {
    const { event, menu, photo, pdf } = copy;
    return {
      event: { title: event.title, date: p.wine.date, time: toHHMM(p.wine.start), room: event.room, cap: String(p.wine.cap), desc: event.desc, photo: event.photo, chans: ["web", "sms", "email", "flyer", "facebook", "gbp"] },
      menu: { title: menu.title, date: menu.date, time: menu.time, room: menu.room, cap: menu.cap, desc: menu.desc, photo: menu.photo, chans: ["web", "sms", "email", "flyer"] },
      photo: { title: photo.title, date: p.todayIso, time: photo.time, room: photo.room, cap: photo.cap, desc: photo.desc, photo: photo.photo, chans: ["web", "sms", "email", "facebook"] },
      pdf: { title: pdf.title, date: pdf.date, time: pdf.time, room: pdf.room, cap: pdf.cap, desc: pdf.desc, photo: pdf.photo, chans: ["web", "sms", "email", "flyer"] },
    };
  }, [p.wine, p.todayIso, copy]);
  const esTitles: Record<string, string> = Object.fromEntries([copy.event, copy.menu, copy.photo, copy.pdf].map((x) => [x.title, x.titleEs]));

  const [kind, setKind] = useState<Kind>("event");
  const [f, setF] = useState(presets.event);
  const [aud, setAud] = useState<Aud>("everyone");
  const [chans, setChans] = useState<Set<Chan>>(new Set(presets.event.chans));
  const [file, setFile] = useState<{ url: string; name: string; pdf: boolean } | null>(null);
  const [lang, setLang] = useState<"en" | "es">("en");
  const [stage, setStage] = useState<"edit" | "sending" | "done">("edit");
  const [step, setStep] = useState(0);

  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);

  const pick = (k: Kind) => {
    setKind(k);
    setF(presets[k]);
    setChans(new Set(presets[k].chans));
    setFile(k === "pdf" ? { url: "", name: copy.pdf.file, pdf: true } : null);
    setAud("everyone");
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
  const harbor = aud === "harbor";
  const families = harbor ? p.harborFamilies : p.families;
  const sms = families;
  const emails = harbor ? copy.harborEmails : p.emailReachable;
  const titleEs = esTitles[f.title] ?? f.title;
  const needsApproval = chans.has("facebook") && (kind === "photo" || (!!file && !file.pdf));

  const shortT = f.title.replace(/^Bus Trip: /, "");
  const smsEn =
    kind === "photo"
      ? `${brand.short}: New photos! ${f.title}. ${f.desc.split(". ")[0]}. See them: ${brand.domain}/news`
      : kind === "menu"
        ? `${brand.short}: ${f.title}, ${whenEn}. Families welcome. ${copy.reserveEn}`
        : `${brand.short}: ${shortT}, ${whenEn}, ${f.room}.${cap ? ` ${left} of ${cap} seats left.` : ""} Reply YES to save a seat.`;
  const smsEs =
    kind === "photo"
      ? `${brand.short}: ¡Fotos nuevas! ${titleEs}. Véalas en ${brand.domain}/news`
      : kind === "menu"
        ? `${brand.short}: ${titleEs}, ${whenEs}. Familias bienvenidas. ${copy.reserveEs}`
        : `${brand.short}: ${titleEs.replace(/^Excursión: /, "")}, ${whenEs}, ${f.room}.${cap ? ` Quedan ${left} de ${cap} lugares.` : ""} Responda SÍ para reservar.`;
  const smsText = lang === "en" ? smsEn : smsEs;
  const segs = Math.ceil(smsText.length / 160);

  const publish = () => {
    setStage("sending");
    setStep(0);
    const n = [...chans].length;
    for (let i = 1; i <= n; i++) window.setTimeout(() => setStep(i), i * 260);
    window.setTimeout(() => { setStage("done"); window.scrollTo({ top: 0, behavior: "smooth" }); }, n * 260 + 500);
  };

  if (stage === "done") {
    const delivered = sms - (harbor ? 0 : 3);
    const failed = sms - delivered;
    const where = kind === "menu" ? "dining page and today’s menu boards" : kind === "photo" ? "news page and home page" : "activity calendar and home page";
    return (
      <div className="sx-card sx-card-body went">
        <div className="went-head">
          <Icon name="check" />
          <div>
            <h2>Published. Here’s where it went.</h2>
            <p>
              “{f.title}” · {harbor ? "Harbor families" : "everyone"} · just now
            </p>
          </div>
        </div>
        <ul className="went-list">
          {chans.has("web") && (
            <li>
              <Icon name="globe" />
              <b>Website <Badge tone="good">Live</Badge></b>
              <span>On the {where}{cap ? `, with online sign-up (${left} seats left)` : ""}. Sitemap updated and Google notified.</span>
            </li>
          )}
          {chans.has("sms") && (
            <li>
              <Icon name="sms" />
              <b>{sms} families texted</b>
              <span>
                {delivered} delivered · {failed} failed{failed ? " (landline numbers, sent by email instead)" : ""} · {harbor ? copy.harborTranslated : copy.translated} in {copy.otherLangs}
              </span>
            </li>
          )}
          {chans.has("email") && (
            <li>
              <Icon name="mail" />
              <b>Email digest <Badge tone="info">Queued</Badge></b>
              <span>In this week’s digest to {emails} families, sending {p.digest}.</span>
            </li>
          )}
          {chans.has("flyer") && (
            <li>
              <Icon name="printer" />
              <b>Large-print flyer</b>
              <span>Sent to the front desk printer (letter, 24 pt). {copy.flyerPost}</span>
            </li>
          )}
          {chans.has("facebook") && (
            <li className={needsApproval ? "wait" : ""}>
              <Icon name={needsApproval ? "clock" : "facebook"} />
              <b>Facebook {needsApproval ? <Badge tone="warn">Waiting for {approver.first}</Badge> : <Badge tone="good">Posted</Badge>}</b>
              <span>{needsApproval ? `Posts with resident photos go to ${approver.name} for approval before they go public. She’s been notified.` : `Posted to ${brand.facebook}.`}</span>
            </li>
          )}
          {chans.has("gbp") && (
            <li>
              <Icon name="pin" />
              <b>Google Business Profile <Badge tone="good">Posted</Badge></b>
              <span>Event post shows on Google Search and Maps until {dayName(d).slice(0, 3)}, {monthName(d).slice(0, 3)} {d.getUTCDate()}.</span>
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
              Max people
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
          </label>
          <label>
            Description
            <textarea value={f.desc} onChange={set("desc")} rows={3} />
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="sx-form">
            <legend className="sx-lbl" style={{ marginBottom: 6 }}>Who is it for?</legend>
            <div className="sx-seg" role="group" aria-label="Audience">
              <button type="button" aria-pressed={aud === "everyone"} onClick={() => setAud("everyone")}>
                Everyone · {p.families} families
              </button>
              <button type="button" aria-pressed={aud === "harbor"} onClick={() => setAud("harbor")}>
                Harbor families · {p.harborFamilies}
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
              <span>{file ? "Tap to change. Photos are resized and checked for consent." : "Using the photo from our library. Tap to choose your own."}</span>
            </span>
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sx-lbl" style={{ marginBottom: 4 }}>Publish to</legend>
            <div className="pub-chan">
              {(Object.keys(chanInfo) as Chan[]).map((c) => (
                <label key={c} className="sx-switch">
                  <input type="checkbox" checked={chans.has(c)} onChange={() => toggle(c)} />
                  {chanInfo[c].label}
                </label>
              ))}
            </div>
          </fieldset>
          {needsApproval && (
            <div className="sx-callout info">
              <Icon name="info" />
              <p>The Facebook post includes resident photos, so it will go to {approver.name} for approval. Everything else publishes now.</p>
            </div>
          )}
          <div className="pub-foot">
            <p>
              {chans.size} places · {chans.has("sms") ? `${families} families` : "no texts"}
            </p>
            <button type="submit" className="sx-btn sx-btn-terra sx-btn-lg" disabled={stage === "sending" || chans.size === 0}>
              <Icon name="send" /> {stage === "sending" ? `Publishing… ${step}/${chans.size}` : "Publish everywhere"}
            </button>
          </div>
        </form>
      </section>

      <section aria-label="Previews" className="prev-grid">
        <div className={`prev ${chans.has("web") ? "" : "off"}`}>
          <div className="prev-h">
            <Icon name="globe" /> Website calendar <span>{chans.has("web") ? <Badge tone="good">On</Badge> : <Badge>Off</Badge>}</span>
          </div>
          <div className="prev-b">
            <div className="pv-web">
              <div className="pv-web-bar">
                <span>{brand.domain}/{kind === "menu" ? "dining" : kind === "photo" ? "news" : "calendar"}</span>
                <span>{harbor ? "Harbor" : "All events"}</span>
              </div>
              <div className="pv-web-day">{dayName(d)}, {monthName(d)} {d.getUTCDate()}</div>
              <div className="pv-web-card" style={harbor ? { borderLeftColor: "var(--c-harbor)" } : kind === "menu" ? { borderLeftColor: "var(--olive)" } : undefined}>
                <div className="pv-web-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                </div>
                <div className="pv-web-t">
                  <time>{fmtTime(start)}</time>
                  <b>{f.title}</b>
                  <span>{f.room}</span>
                  {cap > 0 && <span className="seats">{left} of {cap} seats left · Sign up</span>}
                </div>
              </div>
            </div>
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
          <div className="prev-b">
            <div className="pv-phone">
              <div className="pv-phone-scr">
                <div className="pv-phone-top">
                  <b>{brand.name}</b>
                  {brand.phone}
                </div>
                <div className="pv-bubble">
                  {kind === "photo" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" />
                  )}
                  {smsText}
                </div>
                <div className="pv-meta">
                  {smsText.length} characters · {segs} text{segs > 1 ? "s" : ""} · to {families} families
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`prev ${chans.has("email") ? "" : "off"}`}>
          <div className="prev-h">
            <Icon name="mail" /> Weekly email digest <span className="sx-hint">{p.digest}</span>
          </div>
          <div className="prev-b">
            <div className="pv-mail">
              <div className="pv-mail-h">
                <span><b>From:</b> {brand.name}</span>
                <span><b>Subject:</b> Your week at {brand.name}</span>
              </div>
              <div className="pv-mail-banner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/brand/dots.png" alt="" width={22} height={22} />
                This week at {brand.short}
              </div>
              <div className="pv-mail-body">
                <p>{brand.hello} Here’s what’s coming up for your loved one.</p>
                <div className="pv-mail-item hl">
                  <div className="pv-mail-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                  </div>
                  <div>
                    <b>{f.title}</b>
                    <br />
                    <small>{whenEn} · {f.room}</small>
                  </div>
                </div>
                <div className="pv-mail-item">
                  <div className="pv-mail-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={copy.digestExtra.photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
                  </div>
                  <div>
                    <b>{copy.digestExtra.title}</b>
                    <br />
                    <small>{copy.digestExtra.when}</small>
                  </div>
                </div>
              </div>
            </div>
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
                <b>{f.title.replace(/^Bus Trip: /, "")}</b>
                <span>{dayName(d)}, {monthName(d)} {d.getUTCDate()} · {fmtTime(start)}</span>
                <small>{f.room}{cap ? ` · Limited to ${cap} · Sign up at the front desk` : ""}</small>
              </div>
              <div className="pv-flyer-foot">Questions? Ask {copy.flyerAsk} · {brand.phone}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
