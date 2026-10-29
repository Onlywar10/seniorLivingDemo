"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { communities } from "@/data/group";
import { stats, languages } from "@/data/staff";
import { Icon } from "../Icon";
import { Badge } from "./ui";

type Kind = "event" | "menu" | "photo" | "paper";

const photos = ["/photos/dancing.jpg", "/photos/gardening.jpg", "/photos/dining-group.jpg", "/photos/painting.jpg", "/photos/tea.jpg", "/photos/knitting.jpg"];

const kinds: { k: Kind; label: string; icon: "calendar" | "list" | "image" | "upload" }[] = [
  { k: "event", label: "Event", icon: "calendar" },
  { k: "menu", label: "Menu", icon: "list" },
  { k: "photo", label: "Photo or news", icon: "image" },
  { k: "paper", label: "Paper calendar", icon: "upload" },
];

const ocrRows = [
  ["Mon", "9:30", "Chair yoga with Bev", "Wellness Room"],
  ["Mon", "2:30", "Word games & trivia", "Library"],
  ["Tue", "10:30", "Larkmoor Singers", "Garden Room"],
  ["Tue", "4:00", "Happy hour with Del Mercer", "Bistro"],
  ["Wed", "10:00", "Shopping bus", "Front Lobby"],
  ["Thu", "5:30", "Family night supper & concert", "Main Dining Room"],
];

export function Publisher({ initial }: { initial?: string }) {
  const [kind, setKind] = useState<Kind>("event");
  const [title, setTitle] = useState("Family night: supper and the Larkmoor Singers");
  const [date, setDate] = useState("Thursday");
  const [time, setTime] = useState("5:30 pm");
  const [place, setPlace] = useState("Main Dining Room");
  const [text, setText] = useState("Supper with your family member, then a short concert from the house choir. Children very welcome. RSVP at the front desk or online.");
  const [photo, setPhoto] = useState(photos[2]);
  const [aud, setAud] = useState<string[]>([initial || "larkmoor-house"]);
  const [wing, setWing] = useState("Everyone");
  const [translate, setTranslate] = useState(true);
  const [ocr, setOcr] = useState<"idle" | "reading" | "done">("idle");
  const [stage, setStage] = useState<"edit" | "sending" | "done">("edit");
  const [tab, setTab] = useState(0);

  const families = useMemo(() => {
    const base = stats.filter((s) => aud.includes(s.slug)).reduce((n, s) => n + s.familiesReached, 0);
    return wing === "Everyone" ? base : Math.round(base * 0.18);
  }, [aud, wing]);
  const where = aud.length === 1 ? communities.find((c) => c.slug === aud[0])!.name : `${aud.length} communities`;

  const pick = (k: Kind) => {
    setKind(k);
    if (k === "menu") {
      setTitle("Thursday dinner: herb-roasted pork loin");
      setText("Herb-roasted pork loin with apple chutney and mashed potatoes (soft diet available). Pan-seared salmon with lemon rice (low sodium). Vegetable lasagne (vegetarian). Lemon pudding.");
      setTime("4:45 – 6:15 pm");
      setPlace("Main Dining Room");
      setPhoto(photos[2]);
    } else if (k === "photo") {
      setTitle("Garden club planted 200 tulip bulbs");
      setText("Nine residents and two grandchildren planted the new raised beds this afternoon. Come and see them flower in April.");
      setTime("Today");
      setPlace("The courtyard");
      setPhoto(photos[1]);
    } else if (k === "event") {
      setTitle("Family night: supper and the Larkmoor Singers");
      setText("Supper with your family member, then a short concert from the house choir. Children very welcome. RSVP at the front desk or online.");
      setTime("5:30 pm");
      setPlace("Main Dining Room");
      setPhoto(photos[2]);
    } else {
      setOcr("idle");
    }
  };

  if (stage === "done") {
    const langs = languages.filter((l) => l.k !== "English");
    return (
      <div className="sx-card sx-card-body went">
        <div className="went-head">
          <Icon name="check" />
          <div>
            <h2>Posted once. Published everywhere.</h2>
            <p>
              “{title}” · {where} · just now
            </p>
          </div>
        </div>
        <p className="went-line">
          Published to the website · Sent to {families} families by text and email · Ready to print.
        </p>
        <ul className="went-list">
          <li>
            <Icon name="globe" />
            <b>Website</b>
            <span>
              Live on the {kind === "menu" ? "dining" : kind === "photo" ? "news" : "activities"} page and the home page of {where}. Google Business Profile post scheduled for 6 pm.
            </span>
          </li>
          <li>
            <Icon name="sms" />
            <b>Family text</b>
            <span>
              {Math.round(families * 0.81)} texts delivered, {Math.round(families * 0.81 * 0.62)} opened so far
            </span>
          </li>
          <li>
            <Icon name="mail" />
            <b>Family email digest</b>
            <span>Added to Monday’s digest for {Math.round(families * 0.74)} families; sent now to those who chose “as it happens”.</span>
          </li>
          <li>
            <Icon name="printer" />
            <b>Large-print flyer</b>
            <span>Ready to print at the front desk: letter size, 22 pt. Added to this month’s printed calendar.</span>
          </li>
          {translate && (
            <li>
              <Icon name="translate" />
              <b>Translated automatically</b>
              <span>{langs.map((l) => `${l.k} (${Math.round((l.n / 221) * families)})`).join(" · ")}</span>
            </li>
          )}
          <li>
            <Icon name="spark" />
            <b>Search and AI</b>
            <span>Event details published as structured data, so Google and AI assistants can answer “what’s on at {where}?”.</span>
          </li>
        </ul>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="sx-btn sx-btn-primary" href="/larkmoor-house/activities" target="_blank">
            <Icon name="globe" /> See it on the website
          </Link>
          <Link className="sx-btn" href="/staff/messages">
            Track delivery
          </Link>
          <button className="sx-btn" type="button" onClick={() => setStage("edit")}>
            <Icon name="plus" /> Post something else
          </button>
        </div>
      </div>
    );
  }

  const tabs = ["Website", "Family text", "Email digest", "Print flyer"];

  return (
    <div className="pub">
      <section className="sx-card">
        <div className="sx-card-body sx-form">
          <div className="pub-type" role="group" aria-label="What are you posting?">
            {kinds.map((k) => (
              <button key={k.k} type="button" aria-pressed={kind === k.k} onClick={() => pick(k.k)}>
                <Icon name={k.icon} />
                {k.label}
              </button>
            ))}
          </div>

          {kind === "paper" ? (
            <>
              <button type="button" className="pub-drop" onClick={() => { setOcr("reading"); window.setTimeout(() => { setOcr("done"); setTitle("Family night supper & concert"); setTime("5:30 pm"); setPlace("Main Dining Room"); }, 1600); }}>
                <Icon name="upload" />
                <b>{ocr === "idle" ? "Drop a photo or PDF of the paper calendar" : ocr === "reading" ? "Reading the calendar…" : "November-calendar.jpg"}</b>
                <span>{ocr === "idle" ? "Or take a picture with your phone. We read the times, names and rooms for you." : ocr === "reading" ? "Finding dates, times and rooms" : "23 activities found across 7 days"}</span>
              </button>
              {ocr === "done" && (
                <div className="pub-ocr">
                  <b>
                    <Icon name="check" /> 23 activities read from the photo. Check them, then publish.
                  </b>
                  <table className="sx-table">
                    <tbody>
                      {ocrRows.map((r) => (
                        <tr key={r.join()}>
                          {r.map((c) => (
                            <td key={c}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <span className="sx-note" style={{ margin: 0 }}>
                    + 17 more. 2 need a room: Friday 2:00, Sunday 3:00.
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <label>
                {kind === "menu" ? "Menu headline" : "Title"}
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <div className="sx-row3">
                <label>
                  Day
                  <select value={date} onChange={(e) => setDate(e.target.value)}>
                    {["Today", "Tomorrow", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Time
                  <input value={time} onChange={(e) => setTime(e.target.value)} />
                </label>
                <label>
                  Place
                  <input value={place} onChange={(e) => setPlace(e.target.value)} />
                </label>
              </div>
              <label>
                {kind === "menu" ? "Dishes and dietary tags" : "Description"}
                <textarea value={text} onChange={(e) => setText(e.target.value)} />
              </label>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Photo</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginTop: 4 }}>
                  {photos.map((p) => (
                    <button key={p} type="button" onClick={() => setPhoto(p)} aria-pressed={photo === p} style={{ position: "relative", aspectRatio: "1", border: photo === p ? "3px solid var(--sx-gold)" : "1px solid var(--sx-line)", padding: 0, cursor: "pointer", overflow: "hidden" }}>
                      <Image src={p} alt="" fill sizes="80px" style={{ objectFit: "cover" }} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Publish to</span>
            <div className="pub-aud" style={{ marginTop: 4 }}>
              {communities.map((m) => (
                <label key={m.slug}>
                  <input type="checkbox" checked={aud.includes(m.slug)} onChange={(e) => setAud(e.target.checked ? [...aud, m.slug] : aud.filter((x) => x !== m.slug).length ? aud.filter((x) => x !== m.slug) : aud)} />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
          <div className="sx-row">
            <label>
              Families
              <select value={wing} onChange={(e) => setWing(e.target.value)}>
                <option>Everyone</option>
                <option>Memory care families only</option>
                <option>First floor families only</option>
              </select>
            </label>
            <label className="sx-check" style={{ alignSelf: "end", minHeight: 38 }}>
              <input type="checkbox" checked={translate} onChange={(e) => setTranslate(e.target.checked)} /> Translate for each family’s language
            </label>
          </div>
          <div className="pub-foot">
            <p>
              Goes to the website, {families} families by text and email, and the print queue.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="sx-btn" type="button">
                Send for approval
              </button>
              <button
                className="sx-btn sx-btn-gold sx-btn-lg"
                type="button"
                disabled={stage === "sending" || (kind === "paper" && ocr !== "done")}
                onClick={() => {
                  setStage("sending");
                  window.setTimeout(() => setStage("done"), 1100);
                }}
              >
                <Icon name="send" /> {stage === "sending" ? "Publishing…" : "Publish everywhere"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sx-card">
        <header className="sx-card-head">
          <div>
            <h2>Preview</h2>
            <p>The same post, everywhere it goes</p>
          </div>
          <Badge tone="good">Live preview</Badge>
        </header>
        <div className="sx-card-body">
          <div className="sx-tabs" role="tablist" style={{ marginBottom: 12 }}>
            {["All four", ...tabs].map((t, i) => (
              <button key={t} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>
                {t}
              </button>
            ))}
          </div>
          <div className="prev-grid" style={tab ? { gridTemplateColumns: "1fr" } : undefined}>
            {(tab === 0 || tab === 1) && (
              <div className="prev">
                <div className="prev-h">
                  <Icon name="globe" /> Website <Badge tone="neutral">{where}</Badge>
                </div>
                <div className="prev-b pv-web">
                  <div className="pv-web-bar">
                    <span>larkmoorhouse.com/{kind === "menu" ? "dining" : kind === "photo" ? "news" : "activities"}</span>
                    <span>Updated just now</span>
                  </div>
                  <div className="pv-web-card">
                    <div className="pv-web-img">
                      <Image src={photo} alt="" fill sizes="120px" />
                    </div>
                    <div className="pv-web-t">
                      <time>
                        {date} · {time}
                      </time>
                      <b>{title}</b>
                      <span>{place}</span>
                      <div style={{ color: "#4e5851", marginTop: 3 }}>{text.slice(0, 90)}…</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(tab === 0 || tab === 2) && (
              <div className="prev">
                <div className="prev-h">
                  <Icon name="sms" /> Family text <Badge tone="neutral">{families} families</Badge>
                </div>
                <div className="prev-b">
                  <div className="pv-phone">
                    <div className="pv-phone-top">Larkmoor House</div>
                    <div className="pv-bubble">
                      <b>{title}</b>, {/^To(day|morrow)$/.test(date) ? date.toLowerCase() : date} {time}, {place}. {text.split(".")[0]}. More: lrkmr.co/fn
                    </div>
                    {translate && (
                      <div className="pv-bubble" lang="es">
                        <b>{kind === "menu" ? "Cena del jueves" : kind === "photo" ? "El club de jardinería plantó 200 tulipanes" : "Noche familiar: cena y el coro de Larkmoor"}</b>, {date === "Thursday" ? "jueves" : date.toLowerCase()} {time}. Más: lrkmr.co/fn
                      </div>
                    )}
                    <p className="pv-meta">{translate ? "Sent in English and in each family’s language" : "Sent in English"}</p>
                  </div>
                </div>
              </div>
            )}
            {(tab === 0 || tab === 3) && (
              <div className="prev">
                <div className="prev-h">
                  <Icon name="mail" /> Email digest <Badge tone="neutral">Monday 7 am</Badge>
                </div>
                <div className="prev-b">
                  <div className="pv-mail">
                    <div className="pv-mail-h">
                      <span>
                        From: <b>Larkmoor House</b>
                      </span>
                      <span>Subject: This week at Larkmoor: family night, menus and photos</span>
                    </div>
                    <div className="pv-mail-banner">This week at {where}</div>
                    <div className="pv-mail-body">
                      <div className="pv-mail-item hl">
                        <div className="pv-mail-img">
                          <Image src={photo} alt="" fill sizes="60px" />
                        </div>
                        <div>
                          <b>{title}</b>
                          <br />
                          {date} {time} · {place}
                        </div>
                      </div>
                      <div className="pv-mail-item">
                        <div className="pv-mail-img">
                          <Image src="/photos/dining-three.jpg" alt="" fill sizes="60px" />
                        </div>
                        <div>
                          <b>This week’s menus</b>
                          <br />
                          Sunday roast, Friday fish tacos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {(tab === 0 || tab === 4) && (
              <div className="prev">
                <div className="prev-h">
                  <Icon name="printer" /> Large-print flyer <Badge tone="neutral">Letter, 22 pt</Badge>
                </div>
                <div className="prev-b">
                  <div className="pv-flyer">
                    <div className="pv-flyer-top">{where}</div>
                    <div className="pv-flyer-img">
                      <Image src={photo} alt="" fill sizes="240px" />
                    </div>
                    <div className="pv-flyer-t">
                      <b>{title}</b>
                      <span>
                        {date} · {time}
                      </span>
                      <small>{place}</small>
                    </div>
                    <div className="pv-flyer-foot">Ask at the front desk · (503) 555-0142</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
