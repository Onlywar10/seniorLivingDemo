"use client";

import Image from "next/image";
import { useState } from "react";
import { categories, type Category, type Day, type DayMenu, type Diet, dietLabels } from "@/data/community";
import { Icon } from "../Icon";
import { Badge } from "./ui";

const catColor: Record<Category, string> = { fitness: "#5f8f5e", social: "#c28d3a", arts: "#5a7fa6", outings: "#b25c4e", faith: "#8a6a9f", memory: "#3f7f86" };

export function CalendarEditor({ week }: { week: Day[] }) {
  const [days, setDays] = useState(week.map((d) => ({ ...d, events: d.events.map((e) => ({ ...e, isNew: false })) })));
  const [adding, setAdding] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <div className="ced">
        {days.map((d, i) => (
          <div key={d.iso} className={`ced-day ${d.today ? "today" : ""}`}>
            <div className="ced-h">
              {d.name.slice(0, 3)} <small>{d.date}</small>
            </div>
            <ul className="ced-list">
              {d.events.map((e) => (
                <li key={e.time + e.name} className={`ced-ev ${e.isNew ? "new" : ""}`} style={{ borderLeftColor: catColor[e.cat] }}>
                  <b>
                    {e.time} · {e.room}
                  </b>
                  {e.name}
                </li>
              ))}
            </ul>
            {adding === i ? (
              <form
                className="sx-form"
                style={{ padding: 6, gap: 6 }}
                onSubmit={(ev) => {
                  ev.preventDefault();
                  const f = new FormData(ev.currentTarget);
                  const next = [...days];
                  next[i] = { ...next[i], events: [...next[i].events, { time: String(f.get("t")), name: String(f.get("n")), room: String(f.get("r")), cat: f.get("c") as Category, desc: "", isNew: true }] };
                  setDays(next);
                  setAdding(null);
                  setSaved(true);
                }}
              >
                <input name="t" defaultValue="3:30 pm" aria-label="Time" />
                <input name="n" defaultValue="Pumpkin carving" aria-label="Name" />
                <input name="r" defaultValue="Garden Room" aria-label="Room" />
                <select name="c" defaultValue="social" aria-label="Type">
                  {(Object.keys(categories) as Category[]).map((c) => (
                    <option key={c} value={c}>
                      {categories[c]}
                    </option>
                  ))}
                </select>
                <button className="sx-btn sx-btn-primary" type="submit">
                  Add
                </button>
              </form>
            ) : (
              <button type="button" className="ced-add" onClick={() => setAdding(i)}>
                + Add activity
              </button>
            )}
          </div>
        ))}
      </div>
      {saved && (
        <div className="sx-toast" role="status">
          <Icon name="check" /> Added. Live on the website now; in Monday’s family digest.
        </div>
      )}
    </>
  );
}

export function MenuEditor({ menu }: { menu: DayMenu[] }) {
  const [tags, setTags] = useState<Record<string, Diet[]>>(() => {
    const t: Record<string, Diet[]> = {};
    menu.forEach((d) => d.meals.forEach((m) => m.items.forEach((it) => (t[`${d.day}|${m.name}|${it.name}`] = it.diet ?? []))));
    return t;
  });
  const meals = ["Breakfast", "Lunch", "Dinner"] as const;
  const all = Object.keys(dietLabels) as Diet[];
  return (
    <div className="med">
      <div />
      {menu.map((d) => (
        <div key={d.day} className={`med-h ${d.today ? "today" : ""}`}>
          {d.day} <small style={{ fontWeight: 400 }}>{d.date}</small>
        </div>
      ))}
      {meals.map((meal) => (
        <div key={meal} style={{ display: "contents" }}>
          <div className="med-meal">
            {meal}
            <br />
            <small style={{ fontWeight: 400 }}>{menu[0].meals.find((m) => m.name === meal)!.hours}</small>
          </div>
          {menu.map((d) => (
            <div key={d.day + meal} className="med-cell">
              {d.meals
                .find((m) => m.name === meal)!
                .items.filter((it) => !it.name.startsWith("Always"))
                .map((it) => {
                  const k = `${d.day}|${meal}|${it.name}`;
                  return (
                    <div key={k} className="med-item">
                      <span contentEditable suppressContentEditableWarning>
                        {it.name}
                      </span>
                      <span className="med-tags">
                        {all.map((t) => (
                          <button
                            key={t}
                            type="button"
                            title={dietLabels[t]}
                            aria-pressed={tags[k]?.includes(t)}
                            onClick={() => setTags({ ...tags, [k]: tags[k]?.includes(t) ? tags[k].filter((x) => x !== t) : [...(tags[k] ?? []), t] })}
                          >
                            {t}
                          </button>
                        ))}
                      </span>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PhotoPost() {
  const [step, setStep] = useState<"camera" | "flash" | "caption" | "posted">("camera");
  const [caption, setCaption] = useState("Garden club planted the last of the tulip bulbs this afternoon. Nine residents and two visiting grandchildren. See them flower in April!");
  return (
    <div className="ph-wrap">
      <div className="ph">
        <div className="ph-screen">
          <div className="ph-status">
            <span>2:41</span>
            <span>5G ▮▮▮</span>
          </div>
          <div className="ph-app">
            {step === "camera" || step === "flash" ? (
              <>
                <div className="ph-notif">
                  <b>Larkmoor Staff · now</b>
                  <span>It’s Thursday: snap a photo from this week for families. Takes 30 seconds.</span>
                </div>
                <div className="ph-cam">
                  <Image src="/photos/gardening.jpg" alt="Camera viewfinder showing residents planting bulbs" fill sizes="280px" />
                  <button type="button" className="ph-shutter" aria-label="Take photo" onClick={() => { setStep("flash"); window.setTimeout(() => setStep("caption"), 380); }} />
                  {step === "flash" && <span className="ph-flash" />}
                </div>
                <p style={{ fontSize: 12.5, color: "var(--sx-ink-3)", margin: 0 }}>Residents in the frame: Dorothy L., Ines R. Photo consent on file for both.</p>
              </>
            ) : step === "caption" ? (
              <>
                <h3>New photo post</h3>
                <div style={{ position: "relative", aspectRatio: "4 / 3" }}>
                  <Image src="/photos/gardening.jpg" alt="" fill sizes="280px" style={{ objectFit: "cover" }} />
                </div>
                <div className="sx-form">
                  <label>
                    Caption <span style={{ fontWeight: 400, color: "var(--sx-ink-3)" }}>· suggested for you</span>
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} />
                  </label>
                  <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <Badge tone="good">Website news</Badge>
                    <Badge tone="good">Family digest</Badge>
                    <Badge tone="good">Google Business</Badge>
                  </span>
                </div>
              </>
            ) : (
              <>
                <h3>Posted</h3>
                <div className="pub-ocr">
                  <b>
                    <Icon name="check" /> On the website now
                  </b>
                  <span>Sent to Marianne for approval first? No: photo posts publish straight away.</span>
                  <span>In Friday’s family digest for 214 families.</span>
                </div>
                <div className="ph-reminder">This week: 4 of 6 communities have posted a photo. Harbor View and Willow Bend reminded at 3 pm.</div>
              </>
            )}
          </div>
          <div className="ph-bar">
            {step === "caption" ? (
              <button className="sx-btn sx-btn-gold sx-btn-lg" type="button" onClick={() => setStep("posted")}>
                Post to news
              </button>
            ) : step === "posted" ? (
              <button className="sx-btn sx-btn-lg" type="button" onClick={() => setStep("camera")}>
                Take another
              </button>
            ) : (
              <button className="sx-btn sx-btn-lg" type="button" onClick={() => setStep("caption")}>
                Choose from camera roll
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        <section className="sx-card">
          <header className="sx-card-head">
            <div>
              <h2>Weekly posting reminder</h2>
              <p>Every Thursday at 2 pm to whoever is on duty in life enrichment</p>
            </div>
            <Badge tone="good">On</Badge>
          </header>
          <div className="sx-card-body">
            <table className="sx-table">
              <thead>
                <tr>
                  <th>Community</th>
                  <th>This week</th>
                  <th>Posted by</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Larkmoor House", "Posted 2:41 pm", "Grace Mbeki", "good"],
                  ["Ashby Grove", "Posted Tue", "Dana Whitley", "good"],
                  ["Maple Court", "Posted Wed", "Marcus Lee", "good"],
                  ["Fernhill", "Posted Mon", "Jo Albers", "good"],
                  ["Willow Bend", "Reminded 2:00 pm", "—", "warn"],
                  ["Harbor View", "Reminded 2:00 pm", "—", "bad"],
                ].map(([c, s, w, t]) => (
                  <tr key={c}>
                    <td>
                      <b>{c}</b>
                    </td>
                    <td>
                      <Badge tone={t as "good" | "warn" | "bad"}>{s}</Badge>
                    </td>
                    <td>{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="sx-card">
          <header className="sx-card-head">
            <div>
              <h2>How it works for staff</h2>
            </div>
          </header>
          <div className="sx-card-body">
            <ul className="sx-list">
              <li>The reminder arrives as a phone notification. Tap it and the camera opens.</li>
              <li>Faces are matched to residents’ photo-consent records before anything is posted.</li>
              <li>A caption is suggested from the calendar entry for that time and room.</li>
              <li>It publishes to the community’s news page, the Friday family digest and Google Business Profile.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

const themes = [
  { k: "t-green", bg: "#34453a" },
  { k: "t-gold", bg: "#b4975a" },
  { k: "t-blue", bg: "#2f4f6e" },
];

export function Studio() {
  const [t, setT] = useState({ title: "Family Night", when: "Thursday, 5:30 pm", where: "Main Dining Room", text: "Supper with your family member, then a short concert from the Larkmoor Singers. Children very welcome.", theme: "t-green", photo: "/photos/dining-group.jpg" });
  const [size, setSize] = useState("Letter");
  return (
    <div className="studio">
      <section className="sx-card">
        <div className="sx-card-body sx-form">
          <label>
            Template
            <select defaultValue="Event flyer">
              <option>Event flyer</option>
              <option>Monthly calendar, large print</option>
              <option>Menu card</option>
              <option>Door hanger</option>
            </select>
          </label>
          <label>
            Headline
            <input value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} />
          </label>
          <label>
            When
            <input value={t.when} onChange={(e) => setT({ ...t, when: e.target.value })} />
          </label>
          <label>
            Where
            <input value={t.where} onChange={(e) => setT({ ...t, where: e.target.value })} />
          </label>
          <label>
            Text
            <textarea value={t.text} onChange={(e) => setT({ ...t, text: e.target.value })} />
          </label>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Colours (brand approved)</span>
            <div className="swatches" style={{ marginTop: 6 }}>
              {themes.map((th) => (
                <button key={th.k} type="button" aria-label={th.k} aria-pressed={t.theme === th.k} style={{ background: th.bg }} onClick={() => setT({ ...t, theme: th.k })} />
              ))}
            </div>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Photo</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 4 }}>
              {["/photos/dining-group.jpg", "/photos/dancing.jpg", "/photos/tea.jpg", "/photos/knitting.jpg"].map((p) => (
                <button key={p} type="button" onClick={() => setT({ ...t, photo: p })} style={{ position: "relative", aspectRatio: "1", padding: 0, border: t.photo === p ? "3px solid var(--sx-gold)" : "1px solid var(--sx-line)", cursor: "pointer", overflow: "hidden" }}>
                  <Image src={p} alt="" fill sizes="70px" style={{ objectFit: "cover" }} />
                </button>
              ))}
            </div>
          </div>
          <div className="sx-chips" role="group" aria-label="Size">
            {["Letter", "5×7 card", "Social post"].map((s) => (
              <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="sx-btn sx-btn-primary" type="button" onClick={() => window.print()}>
              <Icon name="printer" /> Print
            </button>
            <button className="sx-btn" type="button">
              <Icon name="download" /> PDF
            </button>
            <button className="sx-btn" type="button">
              <Icon name="send" /> Post once
            </button>
          </div>
        </div>
      </section>
      <div className="studio-canvas">
        <div className={`flyer ${t.theme}`} style={size === "Social post" ? { aspectRatio: "1" } : size === "5×7 card" ? { aspectRatio: "5 / 7" } : undefined}>
          <div className="flyer-top">Larkmoor House</div>
          <div className="flyer-img">
            <Image src={t.photo} alt="" fill sizes="480px" />
          </div>
          <div className="flyer-body">
            <b>{t.title}</b>
            <span>{t.when}</span>
            <p>
              {t.where}. {t.text}
            </p>
          </div>
          <div className="flyer-foot">RSVP at the front desk or larkmoorhouse.com/events · (503) 555-0142</div>
        </div>
      </div>
    </div>
  );
}
