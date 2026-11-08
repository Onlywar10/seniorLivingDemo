"use client";

import { useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { tagLabels, type DayMenu, type Dish, type Tag } from "@/data/shared";
import type { HolidayMenu, MenuWeek } from "@/data/staff/menus";
import { dayName, fromIso, monthName, shortDate } from "@/lib/clock";
import { Badge } from "../ui";

const TAGS: Tag[] = ["GF", "VG", "DF"];
const spell = (tags?: Tag[]) => (tags ?? []).map((t) => tagLabels[t]).join(" · ");
const dayOf = (isoDate: string) => dayName(fromIso(isoDate));
const short = (isoDate: string) => shortDate(fromIso(isoDate));

type Days = Record<string, DayMenu[]>;

/**
 * The kitchen's week: upload the menus, check the one screen Kinlight prepared, confirm, and they publish themselves
 * day by day. `canEdit` is false for people who may only look (the activities director).
 */
export function MenusDesk({ week, canEdit, isApprover, me, diningHref, homeHref }: { week: MenuWeek; canEdit: boolean; isApprover: boolean; me: string; diningHref: string; homeHref: string }) {
  const tagFlag = week.flags.find((f) => f.kind === "tag");
  const soupFlag = week.flags.find((f) => f.kind === "unread");

  // What Kinlight read: the smudged tag left off, the blurred soup left blank, until the chef answers.
  const [days, setDays] = useState<Days>(() => {
    const out: Days = {};
    for (const v of week.venues)
      out[v.venue.key] = v.days.map((d) => {
        let m = d;
        if (tagFlag && v.venue.key === tagFlag.venue && d.date === tagFlag.date) m = { ...m, special: { ...m.special, tags: (m.special.tags ?? []).filter((t) => t !== "GF" && t !== "DF") } };
        if (soupFlag && v.venue.key === soupFlag.venue && d.date === soupFlag.date) m = { ...m, soup: { name: "" } };
        return m;
      });
    return out;
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [soupDraft, setSoupDraft] = useState("");
  const [vi, setVi] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [uploads, setUploads] = useState(week.venues.map((v) => ({ ...v.upload, reading: false, again: false })));
  const [pub, setPub] = useState<"idle" | "busy" | "done" | "blocked">("idle");
  const [hol, setHol] = useState<(HolidayMenu & { status: "waiting" | "approved" | "back" })[]>(week.holidays.map((h) => ({ ...h, status: "waiting" })));
  const [adding, setAdding] = useState(false);
  const [newSpecial, setNewSpecial] = useState({ name: "", date: "", venue: week.venues[0].venue.key });
  const [hours, setHours] = useState(week.venues.map((v) => v.venue.hours));
  const [hourEdit, setHourEdit] = useState<number | null>(null);
  const [hourSaved, setHourSaved] = useState<number | null>(null);
  const [printDay, setPrintDay] = useState(0);

  const left = week.flags.filter((f) => !answers[f.id]).length;
  const v = week.venues[vi];
  const vDays = days[v.venue.key];

  const setDish = (vk: string, date: string, k: "special" | "soup", patch: Partial<Dish>) => {
    setDays((x) => ({ ...x, [vk]: x[vk].map((d) => (d.date === date ? { ...d, [k]: { ...d[k], ...patch } } : d)) }));
    if (pub === "done") setPub("idle");
  };
  const toggleTag = (vk: string, d: DayMenu, k: "special" | "soup", t: Tag) => {
    const cur = d[k].tags ?? [];
    setDish(vk, d.date, k, { tags: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };

  const answerTag = (choice: "GF" | "DF" | "both" | "neither") => {
    if (!tagFlag) return;
    const d = days[tagFlag.venue].find((x) => x.date === tagFlag.date)!;
    const rest = (d.special.tags ?? []).filter((t) => t !== "GF" && t !== "DF");
    const add: Tag[] = choice === "both" ? ["GF", "DF"] : choice === "neither" ? [] : [choice];
    setDish(tagFlag.venue, tagFlag.date, "special", { tags: [...rest, ...add] });
    setAnswers((a) => ({ ...a, [tagFlag.id]: choice === "both" ? "Gluten free and dairy free" : choice === "neither" ? "Neither" : tagLabels[choice] }));
  };
  const answerSoup = (name: string) => {
    if (!soupFlag || !name.trim()) return;
    setDish(soupFlag.venue, soupFlag.date, "soup", { name: name.trim() });
    setAnswers((a) => ({ ...a, [soupFlag.id]: name.trim() }));
  };

  const onFile = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const kind = f.type.startsWith("image/") ? "Photo" : /pdf/i.test(f.type) || /\.pdf$/i.test(f.name) ? "PDF" : "Document";
    setUploads((u) => u.map((x, j) => (j === i ? { ...x, reading: true } : x)));
    window.setTimeout(() => setUploads((u) => u.map((x, j) => (j === i ? { file: f.name, kind, detail: kind === "Photo" ? "Taken on a phone" : "Uploaded just now", at: "Just now", reading: false, again: true } : x))), 1300);
    e.target.value = "";
  };

  const publish = () => {
    if (left > 0) {
      setPub("blocked");
      document.getElementById("mn-check")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setPub("busy");
    window.setTimeout(() => setPub("done"), 900);
  };

  const pd = vDays[printDay];

  return (
    <div className="mn">
      {/* ------------------------------------------------------------ live now */}
      <section className="sx-card mn-live" aria-labelledby="mn-live-h">
        <header className="sx-card-head">
          <div>
            <h2 id="mn-live-h"><span className="mn-dot" aria-hidden="true" /> Live on the website today</h2>
            <p>{week.live.label} · published {week.live.published}</p>
          </div>
          <a className="sx-btn sx-btn-sm" href={diningHref} target="_blank" rel="noreferrer"><Icon name="globe" /> See the dining page</a>
        </header>
        <div className="sx-card-body">
          <ul className="mn-today">
            {week.live.menus.map(({ venue, bar, menu }) => (
              <li key={venue.key}>
                <h3><Icon name={bar ? "coffee" : "fork"} /> {venue.name}</h3>
                <small>{venue.hours}</small>
                <p><span className="mn-k">{menu.holiday ?? (bar ? "Pour and bite" : "Chef’s special")}</span> <b>{menu.special.name}</b>{menu.special.desc && <span className="mn-desc">{menu.special.desc}</span>}{menu.special.tags?.length ? <em>{spell(menu.special.tags)}</em> : null}</p>
                <p><span className="mn-k">Soup</span> <b>{menu.soup.name}</b>{menu.soup.tags?.length ? <em>{spell(menu.soup.tags)}</em> : null}</p>
              </li>
            ))}
          </ul>
          <p className="sx-note mn-auto"><Icon name="sparkle" /> <span>Shown automatically on <a href={diningHref} target="_blank" rel="noreferrer">the dining page</a> and in the “Today’s menu” block on <a href={homeHref} target="_blank" rel="noreferrer">every community page</a>. Tomorrow’s menu replaces it at 5:00 am.</span></p>
        </div>
      </section>

      {!canEdit && (
        <div className="sx-callout info" role="note">
          <Icon name="eye" />
          <p>View only. {week.chef} uploads and checks the menus each week; you can see what’s live and what’s coming.</p>
        </div>
      )}

      {/* ------------------------------------------------------------ 1. upload */}
      <section className="sx-card" aria-labelledby="mn-s1">
        <header className="sx-card-head">
          <div>
            <h2 id="mn-s1"><span className="mn-n">1</span> Next week’s menus, {week.range}</h2>
            <p>{canEdit ? "A PDF, a document or a photo of the printed menu, for each restaurant." : `Uploaded by ${week.chef}.`}</p>
          </div>
        </header>
        <div className="sx-card-body">
          <ul className="mn-files">
            {week.venues.map((x, i) => {
              const u = uploads[i];
              return (
                <li key={x.venue.key}>
                  <span className="mn-file-i" aria-hidden="true"><Icon name={u.kind === "Photo" ? "image" : "doc"} /></span>
                  <span className="mn-file-t">
                    <small>{x.venue.name}</small>
                    <b>{u.reading ? "Reading…" : u.file}</b>
                    <span>{u.kind} · {u.detail} · {u.reading ? "Kinlight is reading it" : `read ${u.at === "Just now" ? "just now" : u.at}`}</span>
                    {u.again && !u.reading && <span className="mn-ok"><Icon name="check" /> Read again: 7 days, nothing new to check.</span>}
                  </span>
                  {canEdit && (
                    <span className="mn-file-a">
                      <label className="sx-btn sx-btn-sm">
                        <Icon name="upload" /> Replace
                        <input type="file" accept=".pdf,.doc,.docx,image/*" className="vh" onChange={onFile(i)} />
                      </label>
                      <label className="sx-btn sx-btn-sm">
                        <Icon name="image" /> Take a photo
                        <input type="file" accept="image/*" capture="environment" className="vh" onChange={onFile(i)} />
                      </label>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="sx-note mn-auto"><Icon name="sparkle" /> <span>Kinlight read them into days, meal periods, specials, soups and dietary tags: {week.counts.days} days, {week.counts.periods} meal periods, {week.counts.specials} specials, {week.counts.soups} soups, {week.counts.tags} dietary tags, {week.counts.dishes} dishes in all.</span></p>
        </div>
      </section>

      {/* ------------------------------------------------------------ 2. check */}
      <section className="sx-card" id="mn-check" aria-labelledby="mn-s2">
        <header className="sx-card-head">
          <div>
            <h2 id="mn-s2"><span className="mn-n">2</span> Check what Kinlight read</h2>
            <p>{left ? `${left} ${left === 1 ? "thing" : "things"} Kinlight wasn’t sure about. Everything else is below.` : "Nothing left to check."}</p>
          </div>
          {left === 0 ? <Badge tone="good"><Icon name="check" /> All checked</Badge> : <Badge tone="warn">{left} to check</Badge>}
        </header>
        <div className="sx-card-body mn-check">
          {pub === "blocked" && left > 0 && (
            <div className="sx-callout" role="alert"><Icon name="alert" /><p>Answer {left === 1 ? "this one" : `these ${left}`} first, then publish.</p></div>
          )}
          <ul className="mn-flags">
            {tagFlag && (
              <li className={answers[tagFlag.id] ? "done" : ""}>
                <div>
                  <b>{tagFlag.question}</b>
                  <span><b>{tagFlag.dish}</b> · {week.venues.find((x) => x.venue.key === tagFlag.venue)?.venue.name}, {dayOf(tagFlag.date)} {short(tagFlag.date)}</span>
                  <small>{tagFlag.detail}</small>
                </div>
                {answers[tagFlag.id] ? (
                  <p className="mn-ok"><Icon name="check" /> {answers[tagFlag.id]}{canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAnswers((a) => { const n = { ...a }; delete n[tagFlag.id]; return n; })}>Change</button>}</p>
                ) : canEdit ? (
                  <div className="mn-choose" role="group" aria-label="Which tag">
                    <button type="button" className="sx-btn" onClick={() => answerTag("GF")}>Gluten free</button>
                    <button type="button" className="sx-btn" onClick={() => answerTag("DF")}>Dairy free</button>
                    <button type="button" className="sx-btn" onClick={() => answerTag("both")}>Both</button>
                    <button type="button" className="sx-btn" onClick={() => answerTag("neither")}>Neither</button>
                  </div>
                ) : (
                  <p className="sx-note">Waiting for {week.chefFirst}.</p>
                )}
              </li>
            )}
            {soupFlag && (
              <li className={answers[soupFlag.id] ? "done" : ""}>
                <div>
                  <b>{soupFlag.question}</b>
                  <span>{week.venues.find((x) => x.venue.key === soupFlag.venue)?.venue.name}, {dayOf(soupFlag.date)} {short(soupFlag.date)}</span>
                  <small>{soupFlag.detail}</small>
                </div>
                {answers[soupFlag.id] ? (
                  <p className="mn-ok"><Icon name="check" /> {answers[soupFlag.id]}{canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAnswers((a) => { const n = { ...a }; delete n[soupFlag.id]; return n; })}>Change</button>}</p>
                ) : canEdit ? (
                  <form className="mn-soup" onSubmit={(e) => { e.preventDefault(); answerSoup(soupDraft); }}>
                    <label>
                      <span className="vh">Thursday’s soup</span>
                      <input className="sx-input" value={soupDraft} onChange={(e) => setSoupDraft(e.target.value)} placeholder="Type the soup" />
                    </label>
                    <button type="submit" className="sx-btn sx-btn-primary" disabled={!soupDraft.trim()}>Save</button>
                    {soupFlag.lastWeek && <button type="button" className="sx-btn" onClick={() => { setSoupDraft(soupFlag.lastWeek!); answerSoup(soupFlag.lastWeek!); }}>Same as last Thursday: {soupFlag.lastWeek}</button>}
                  </form>
                ) : (
                  <p className="sx-note">Waiting for {week.chefFirst}.</p>
                )}
              </li>
            )}
          </ul>

          <div className="sx-tabs" role="tablist" aria-label="Restaurant">
            {week.venues.map((x, i) => (
              <button key={x.venue.key} role="tab" aria-selected={vi === i} onClick={() => { setVi(i); setEditing(null); setPrintDay(0); }}>
                <Icon name={x.bar ? "coffee" : "fork"} /> {x.venue.name}
              </button>
            ))}
          </div>
          <p className="mn-periods"><span>Meal periods read:</span> {v.days[0].sections.map((sct) => <span key={sct.title} className="mn-chip">{sct.title}{sct.note && sct.note.length < 24 ? ` · ${sct.note}` : ""}</span>)}</p>

          <ul className="mn-week">
            {vDays.map((d) => {
              const key = `${v.venue.key}-${d.date}`;
              const open = editing === key;
              const flagT = tagFlag && tagFlag.venue === v.venue.key && tagFlag.date === d.date && !answers[tagFlag.id];
              const flagS = soupFlag && soupFlag.venue === v.venue.key && soupFlag.date === d.date && !answers[soupFlag.id];
              return (
                <li key={d.date} className={`mn-day${d.holiday ? " hol" : ""}`}>
                  <div className="mn-date"><b>{dayOf(d.date).slice(0, 3)}</b><small>{short(d.date)}</small></div>
                  {open ? (
                    <div className="mn-edit sx-form">
                      {(["special", "soup"] as const).map((k) => (
                        <fieldset key={k}>
                          <legend className="sx-lbl">{k === "special" ? (v.bar ? "Pour and bite" : "Special") : "Soup"}</legend>
                          <label><span className="vh">Name</span><input value={d[k].name} onChange={(e) => setDish(v.venue.key, d.date, k, { name: e.target.value })} /></label>
                          {k === "special" && <label><span className="vh">Description</span><input value={d.special.desc ?? ""} placeholder="Description" onChange={(e) => setDish(v.venue.key, d.date, "special", { desc: e.target.value })} /></label>}
                          <div className="med-tags" role="group" aria-label="Dietary tags">
                            {TAGS.map((t) => (
                              <button key={t} type="button" aria-pressed={(d[k].tags ?? []).includes(t)} onClick={() => toggleTag(v.venue.key, d, k, t)}>{tagLabels[t]}</button>
                            ))}
                          </div>
                        </fieldset>
                      ))}
                      <p><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setEditing(null)}><Icon name="check" /> Done</button></p>
                    </div>
                  ) : (
                    <>
                      <div className={`mn-dish${flagT ? " flag" : ""}`}>
                        <small>{d.holiday ?? (v.bar ? "Pour and bite" : "Special")}</small>
                        <b>{d.special.name}</b>
                        {d.special.desc && <span>{d.special.desc}</span>}
                        {flagT ? <em className="q">Tag: GF or DF?</em> : d.special.tags?.length ? <em>{spell(d.special.tags)}</em> : null}
                      </div>
                      <div className={`mn-dish${flagS ? " flag" : ""}`}>
                        <small>Soup</small>
                        <b>{d.soup.name || "Couldn’t read this"}</b>
                        {d.soup.tags?.length ? <em>{spell(d.soup.tags)}</em> : null}
                      </div>
                      {canEdit && <button type="button" className="sx-btn sx-btn-sm mn-change" onClick={() => setEditing(key)}><Icon name="edit" /> Change</button>}
                    </>
                  )}
                  <details className="mn-more">
                    <summary>Everything else on {dayOf(d.date)}’s menu</summary>
                    {d.sections.map((sct) => (
                      <div key={sct.title}>
                        <h4>{sct.title}{sct.note ? ` · ${sct.note}` : ""}</h4>
                        <ul>
                          {sct.items.map((it) => <li key={it.name}><b>{it.name}</b>{it.desc && <> · {it.desc}</>}{it.tags?.length ? <em> {spell(it.tags)}</em> : null}</li>)}
                        </ul>
                      </div>
                    ))}
                  </details>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ 3. confirm */}
      <section className="sx-card" aria-labelledby="mn-s3">
        <header className="sx-card-head">
          <div>
            <h2 id="mn-s3"><span className="mn-n">3</span> Confirm, and it publishes itself</h2>
            <p>One tap. From then on, each day’s menu goes up on its own.</p>
          </div>
        </header>
        <div className="sx-card-body mn-pub">
          {canEdit ? (
            pub === "done" ? (
              <div className="sx-callout good" role="status">
                <Icon name="check" />
                <p>Confirmed by {me}. Next week’s menus for all {week.venues.length} restaurants are scheduled.</p>
              </div>
            ) : (
              <button type="button" className="sx-btn sx-btn-terra sx-btn-lg" disabled={pub === "busy"} onClick={publish}>
                <Icon name="send" /> {pub === "busy" ? "Publishing…" : "Publish menus"}
              </button>
            )
          ) : (
            <p className="sx-note" style={{ marginTop: 0 }}>{week.chef} confirms the menus before {week.sendsBy}.</p>
          )}
          <h3 className="mn-h3">What happens automatically{pub === "done" ? "" : " once they’re confirmed"}</h3>
          <ul className="sx-list">
            <li className="sx-fresh"><span className="ok"><Icon name="globe" /></span><b>Website dining page and every community page</b><Badge tone={pub === "done" ? "good" : "neutral"}>{pub === "done" ? "Scheduled" : "Each day, 5:00 am"}</Badge><small>Each morning shows that day’s menus, with dietary tags spelled out.</small></li>
            <li className="sx-fresh"><span className="ok"><Icon name="mail" /></span><b>The weekly newsletter</b><Badge tone={pub === "done" ? "good" : "neutral"}>{pub === "done" ? "Highlights added" : "Sunday, 5:00 pm"}</Badge><small>Carries the week’s highlights from these menus.</small></li>
            <li className="sx-fresh"><span className="ok"><Icon name="printer" /></span><b>Large-print menu cards</b><Badge tone={pub === "done" ? "good" : "neutral"}>{pub === "done" ? "Ready to print" : "One per restaurant, per day"}</Badge><small>For the tables and the front desk.</small></li>
          </ul>
          {pub === "done" && (
            <ol className="mn-sched" aria-label="Day by day">
              {week.dates.map((d) => <li key={d}><b>{dayOf(d).slice(0, 3)} {short(d)}</b><span>Live at 5:00 am</span></li>)}
            </ol>
          )}
        </div>
      </section>

      <div className="sx-grid g-2">
        {/* ------------------------------------------------------------ holiday and special menus */}
        <section className="sx-card" aria-labelledby="mn-hol">
          <header className="sx-card-head">
            <div>
              <h2 id="mn-hol">Holiday and special menus</h2>
              <p>These go to {week.approver} before they publish.</p>
            </div>
            {canEdit && !adding && <button type="button" className="sx-btn sx-btn-sm" onClick={() => setAdding(true)}><Icon name="plus" /> Add one</button>}
          </header>
          <div className="sx-card-body">
            {adding && (
              <form className="sx-form mn-add" onSubmit={(e) => {
                e.preventDefault();
                if (!newSpecial.name.trim() || !newSpecial.date) return;
                const vv = week.venues.find((x) => x.venue.key === newSpecial.venue)!.venue;
                setHol((h) => [...h, { id: `new-${h.length}`, venue: vv.key, venueName: vv.name, date: newSpecial.date, label: `${dayOf(newSpecial.date).slice(0, 3)}, ${short(newSpecial.date)}`, name: newSpecial.name.trim(), items: [], by: me, sent: "Just now", status: "waiting" }]);
                setNewSpecial({ name: "", date: "", venue: week.venues[0].venue.key });
                setAdding(false);
              }}>
                <label>What it is<input value={newSpecial.name} onChange={(e) => setNewSpecial((n) => ({ ...n, name: e.target.value }))} placeholder="Christmas Eve dinner" /></label>
                <div className="sx-row">
                  <label>Day<input type="date" value={newSpecial.date} onChange={(e) => setNewSpecial((n) => ({ ...n, date: e.target.value }))} /></label>
                  <label>Restaurant<select value={newSpecial.venue} onChange={(e) => setNewSpecial((n) => ({ ...n, venue: e.target.value }))}>{week.venues.map((x) => <option key={x.venue.key} value={x.venue.key}>{x.venue.name}</option>)}</select></label>
                </div>
                <label>The menu<input type="file" accept=".pdf,.doc,.docx,image/*" /></label>
                <p className="pt-act"><button type="submit" className="sx-btn sx-btn-primary"><Icon name="send" /> Send to {week.approverFirst}</button><button type="button" className="sx-btn" onClick={() => setAdding(false)}>Cancel</button></p>
              </form>
            )}
            {hol.length === 0 && !adding && <p className="sx-note" style={{ marginTop: 0 }}>No holiday menus in the next five weeks.</p>}
            <ul className="mn-hols">
              {hol.map((h) => (
                <li key={h.id}>
                  <div>
                    <b>{h.name}</b>
                    <span>{h.venueName} · {h.label}</span>
                    {h.items.length > 0 && <small>{h.items.join(" · ")}</small>}
                    <small>Sent by {h.by}, {h.sent === "Just now" ? "just now" : h.sent}</small>
                  </div>
                  {h.status === "approved" ? (
                    <Badge tone="good"><Icon name="check" /> Approved · publishes on the day</Badge>
                  ) : h.status === "back" ? (
                    <Badge tone="warn">Sent back to {week.chefFirst}</Badge>
                  ) : isApprover ? (
                    <span className="pt-act">
                      <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setHol((x) => x.map((y) => (y.id === h.id ? { ...y, status: "approved" } : y)))}><Icon name="check" /> Approve</button>
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setHol((x) => x.map((y) => (y.id === h.id ? { ...y, status: "back" } : y)))}>Send back</button>
                    </span>
                  ) : (
                    <Badge tone="warn">Waiting for {week.approverFirst}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ hours */}
        <section className="sx-card" aria-labelledby="mn-hours">
          <header className="sx-card-head">
            <div>
              <h2 id="mn-hours">Restaurant hours</h2>
              <p>Used on the website, the menu cards and in every answer about dining.</p>
            </div>
          </header>
          <div className="sx-card-body">
            <ul className="sx-list">
              {week.venues.map((x, i) => (
                <li key={x.venue.key} className="mn-hour">
                  <span><b>{x.venue.name}</b><small>{x.venue.kind}</small></span>
                  {hourEdit === i ? (
                    <form className="mn-hour-f" onSubmit={(e) => { e.preventDefault(); setHourEdit(null); setHourSaved(i); }}>
                      <label><span className="vh">Hours for {x.venue.name}</span><input className="sx-input" value={hours[i]} onChange={(e) => setHours((h) => h.map((y, j) => (j === i ? e.target.value : y)))} /></label>
                      <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm">Save</button>
                    </form>
                  ) : (
                    <span className="mn-hour-v">
                      {hours[i]}
                      {canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setHourEdit(i); setHourSaved(null); }}>Change</button>}
                    </span>
                  )}
                  {hourSaved === i && <small className="mn-ok"><Icon name="check" /> Saved. The website and menu cards show the new hours.</small>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------------------ large-print card */}
        <section className="sx-card" aria-labelledby="mn-print">
          <header className="sx-card-head">
            <div>
              <h2 id="mn-print">Large-print menu card</h2>
              <p>{v.venue.name} · letter size, 18 pt, made automatically</p>
            </div>
            <button type="button" className="sx-btn sx-btn-sm" onClick={() => window.print()}><Icon name="printer" /> Print</button>
          </header>
          <div className="sx-card-body">
            <div className="sx-chips mn-pdays" role="group" aria-label="Day">
              {vDays.map((d, j) => <button key={d.date} type="button" aria-pressed={printDay === j} onClick={() => setPrintDay(j)}>{dayOf(d.date).slice(0, 3)}</button>)}
            </div>
            <article className="mcard" aria-label="Printed menu card preview">
              <header>
                <small>{week.community}</small>
                <h3>{v.venue.name}</h3>
                <p>{dayOf(pd.date)}, {monthName(fromIso(pd.date))} {fromIso(pd.date).getUTCDate()}{pd.holiday ? ` · ${pd.holiday}` : ""}</p>
              </header>
              <dl>
                <div><dt>{pd.holiday ?? (v.bar ? "Today’s pour and bite" : "Chef’s special")}</dt><dd>{pd.special.name}{pd.special.desc && <small>{pd.special.desc}</small>}{pd.special.tags?.length ? <em>{spell(pd.special.tags)}</em> : null}</dd></div>
                <div><dt>Soup of the day</dt><dd>{pd.soup.name || "To be confirmed"}{pd.soup.tags?.length ? <em>{spell(pd.soup.tags)}</em> : null}</dd></div>
              </dl>
              <footer>{hours[vi]}</footer>
            </article>
            <p className="sx-note">Dietary tags are spelled out in full on print and the website, never abbreviated.</p>
          </div>
        </section>

        {/* ------------------------------------------------------------ beta */}
        <section className="sx-card mn-beta" aria-labelledby="mn-beta">
          <header className="sx-card-head">
            <div>
              <h2 id="mn-beta">Live menus from your dining system</h2>
              <p>MealSuite, DiningRD and similar</p>
            </div>
            <Badge tone="info">Coming in Beta</Badge>
          </header>
          <div className="sx-card-body">
            <p style={{ margin: 0 }}>The menus come straight from the system the kitchen already plans in, so nothing needs uploading. Until then, one upload a week covers every restaurant.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
