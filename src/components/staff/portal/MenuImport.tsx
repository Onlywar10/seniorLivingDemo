"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { menuSamples } from "@/data/staff/menuSamples";
import type { Tag } from "@/data/shared";
import { say } from "../store";
import { Badge } from "../ui";

export type SampleKey = "juniper" | "millpond" | "perch" | "thanksgiving";

/** What an import changes, handed to the restaurant it belongs to. */
export type Applied =
  | { kind: "cycle-week"; venue: string; week: number; days: { lunch?: string; dinner?: { name: string; desc?: string; tags?: Tag[] }; soup?: string | null }[] }
  | { kind: "standing"; venue: string; sections: { title: string; items: { name: string; desc?: string; tags?: Tag[] }[] }[] }
  | { kind: "daily"; venue: string; values: Record<string, { name: string; desc?: string; tags?: Tag[] }> }
  | { kind: "holiday"; venue: string; name: string; date: string; items: string[]; booking: string };

interface Line {
  id: string;
  /** "Mon · Dinner" or "Sandwiches" */
  where: string;
  text: string;
  sub?: string;
  status: "same" | "changed" | "added" | "removed" | "unsure";
  was?: string;
  ask?: { q: string; options: string[] };
}
interface Read {
  key: SampleKey;
  file: string;
  preview: string;
  kindLabel: string;
  /** "Week 3 of the Juniper Room’s Fall/Winter cycle" */
  guess: string;
  venueKey: string;
  existing: boolean;
  lines: Line[];
  next: string[];
}

const SAMPLES: { key: SampleKey; file: string; type: string; what: string; icon: string }[] = [
  { key: "juniper", file: menuSamples.juniper.file, type: "PDF", what: "A designed cycle week", icon: "doc" },
  { key: "millpond", file: menuSamples.millpond.file, type: "Excel", what: "The standing menu", icon: "grid" },
  { key: "perch", file: menuSamples.perch.file, type: "Photo", what: "Today’s chalkboard", icon: "image" },
  { key: "thanksgiving", file: menuSamples.thanksgiving.file, type: "Word", what: "A holiday menu", icon: "doc" },
];
const preview = (file: string) => `/samples/menus/previews/${file.replace(/\.[a-z]+$/, ".png")}`;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const tagsOf = (s: string): Tag[] => s.split(/[,\s]+/).filter((x): x is Tag => x === "VG" || x === "GF" || x === "DF");

/** What Kinlight reads in each sample, compared with what the restaurant has today. */
function readSample(key: SampleKey, venues: { key: string; name: string }[]): Read {
  const [juniper, millpond, perch] = venues;
  if (key === "juniper") {
    const j = menuSamples.juniper;
    const lines: Line[] = [];
    j.week.forEach((d, i) => {
      const cur = j.current[i];
      const row = (part: string, now: string, was: string, sub?: string) =>
        lines.push({ id: `${i}-${part}`, where: `${DAYS[i]} · ${part}`, text: now || "—", sub, status: !now && was ? "removed" : now !== was ? "changed" : "same", was: now !== was ? was : undefined });
      row("Lunch", d.lunch, cur.lunch);
      row("Dinner", d.dinner.name, cur.dinner.name, d.dinner.desc);
      row("Alternate", d.alternate, cur.alternate);
      if ("soup_printed" in d) lines.push({ id: `${i}-Soup`, where: `${DAYS[i]} · Soup`, text: `“${d.soup_printed}”`, status: "unsure", ask: { q: `The packet says “${d.soup_printed}” on ${DAYS[i]}. Which soup?`, options: [`${cur.soup}, as in your cycle`, "We’ll decide on the day"] } });
      else row("Soup", d.soup, cur.soup);
      row("Dessert", d.dessert, cur.dessert);
      if ("tags_printed" in d.dinner) lines.push({ id: `${i}-tags`, where: `${DAYS[i]} · Dinner tags`, text: `${d.dinner.name}: “${d.dinner.tags_printed}”`, status: "unsure", ask: { q: `${d.dinner.name} is marked “${d.dinner.tags_printed}” (*ask your server). Your cycle says Dairy free. Which tags?`, options: ["Dairy free, as before", "Gluten free", "Gluten free · Dairy free", "No tags"] } });
    });
    return { key, file: j.file, preview: preview(j.file), kindLabel: "A cycle week", guess: `Week 3 of ${juniper.name}’s Fall/Winter cycle`, venueKey: juniper.key, existing: true, lines,
      next: [`Cycle week 3 next comes round on Sunday: each day goes up at 5 am on the website dining page and the large-print cards.`, "The Sunday newsletter carries the week’s highlights.", "The morning menu text goes to everyone who opted in.", "Next time: nothing to upload. Kinlight fills the week from your cycle."] };
  }
  if (key === "millpond") {
    const m = menuSamples.millpond;
    const cur = new Map<string, readonly string[]>(m.current.map((r) => [r[1], r]));
    const now = new Map<string, readonly string[]>(m.rows.map((r) => [r[1], r]));
    const lines: Line[] = m.rows.map((r) => {
      const c = cur.get(r[1]);
      if (r[1] === "Classic Caesar") return { id: r[1], where: r[0], text: `${r[1]}: “${r[3] === "VG" ? "Vegetarian" : r[3]}”`, status: "unsure" as const, ask: { q: "Classic Caesar says Vegetarian, but Caesar dressing usually has anchovies. Kinlight won’t publish a tag that might be wrong.", options: ["Take the tag off", "Keep it: our dressing has no anchovies"] } };
      return { id: r[1], where: r[0], text: r[1], sub: r[2] || undefined, status: !c ? "added" as const : c[2] !== r[2] || c[3] !== r[3] ? "changed" as const : "same" as const, was: c && c[2] !== r[2] ? c[2] || "(no description)" : undefined };
    });
    m.current.filter((r) => !now.has(r[1])).forEach((r) => lines.push({ id: `rm-${r[1]}`, where: r[0], text: r[1], status: "removed" }));
    return { key, file: m.file, preview: preview(m.file), kindLabel: "A standing menu", guess: `${millpond.name}’s always-available menu`, venueKey: millpond.key, existing: true, lines,
      next: ["The website dining page shows it now.", "Tomorrow’s large-print cards carry it on the back.", "Nothing else to do: the daily chef’s special still comes by text."] };
  }
  if (key === "perch") {
    const p = menuSamples.perch;
    const clean: Record<string, string> = { "Roast Veg – zucchini, peppers, goat cheese": "Roast Vegetable Panini", "Calder River Old Vine Zin": "Calder River Old Vine Zinfandel" };
    const lines: Line[] = p.slots.map(([slot, value]) => slot === p.smudged
      ? { id: slot, where: slot, text: "“Lo…ed B…d Pot…”", status: "unsure" as const, ask: { q: "The chalk is smudged. Is the soup Loaded Baked Potato?", options: ["Loaded Baked Potato Soup", "Leave the soup off today"] } }
      : { id: slot, where: slot, text: clean[value] ?? value, sub: clean[value] && value.includes("–") ? value.split("–")[1].trim() : undefined, status: "added" as const });
    return { key, file: p.file, preview: preview(p.file), kindLabel: "Today’s specials", guess: `${perch.name}, today’s specials`, venueKey: perch.key, existing: false, lines,
      next: ["The website, the dining page and today’s cards show the board now.", "Anyone who asks “what’s at the Perch?” by text gets today’s board."] };
  }
  const h = menuSamples.thanksgiving;
  const lines: Line[] = [
    ...h.courses.map(([course, name, desc, tags]) => ({ id: name, where: course, text: name, sub: [desc, tags].filter(Boolean).join(" · ") || undefined, status: "same" as const })),
    { id: "seatings", where: "Seatings", text: `${h.seatings.join(" and ")}, within 11:00 am–3:00 pm`, status: "same" },
    { id: "booking", where: "Booking", text: h.booking, status: "same" },
    { id: "prices", where: "Guest prices", text: h.prices, status: "added" },
    { id: "togo", where: "Take-home", text: h.togo, status: "added" },
    { id: "gf", where: "Desserts", text: "“Gluten-free pumpkin pie on request”", status: "unsure", ask: { q: "Show the pumpkin pie as Gluten free?", options: ["No: on request only", "Yes, tag it Gluten free"] } },
  ];
  return { key, file: h.file, preview: preview(h.file), kindLabel: "A holiday menu", guess: "A holiday menu: Thanksgiving", venueKey: juniper.key, existing: true, lines,
    next: ["Changes to an approved holiday menu go back to Renata first. The approved version stays up until she says yes.", "Once approved: the website, the Sunday newsletter and a text to everyone who opted in, with booking by reply."] };
}

/** What confirming does to the restaurant's menu. */
function applied(r: Read, answers: Record<string, string>): Applied {
  if (r.key === "juniper") {
    const j = menuSamples.juniper;
    return {
      kind: "cycle-week", venue: r.venueKey, week: 2,
      days: j.week.map((d, i) => {
        const cur = j.current[i];
        const tagAns = answers[`${i}-tags`];
        const tags: Tag[] | undefined = tagAns ? tagsOf(tagAns.replace("Dairy free, as before", "DF").replace("Gluten free", "GF").replace("Dairy free", "DF").replace("No tags", "")) : undefined;
        return {
          lunch: d.lunch !== cur.lunch ? d.lunch : undefined,
          dinner: d.dinner.name !== cur.dinner.name || tags ? { name: d.dinner.name, desc: d.dinner.desc, tags: tags ?? (d.dinner.tags as unknown as Tag[]) } : undefined,
          soup: !d.soup && cur.soup && !("soup_printed" in d) ? null : undefined,
        };
      }),
    };
  }
  if (r.key === "millpond") {
    const m = menuSamples.millpond;
    const order: string[] = [];
    const by: Record<string, { name: string; desc?: string; tags?: Tag[] }[]> = {};
    for (const [sec, name, desc, tg] of m.rows) {
      if (!by[sec]) { by[sec] = []; order.push(sec); }
      const t = name === "Classic Caesar" && answers["Classic Caesar"] === "Take the tag off" ? [] : tagsOf(tg);
      by[sec].push({ name, ...(desc ? { desc } : {}), ...(t.length ? { tags: t } : {}) });
    }
    return { kind: "standing", venue: r.venueKey, sections: order.map((title) => ({ title, items: by[title] })) };
  }
  if (r.key === "perch") {
    const soup = answers["Soup"] === "Loaded Baked Potato Soup";
    return {
      kind: "daily", venue: r.venueKey,
      values: {
        pastry: { name: "Cinnamon Roll", tags: ["VG"] }, panini: { name: "Roast Vegetable Panini", desc: "Zucchini, peppers, goat cheese", tags: ["VG"] },
        ...(soup ? { soup: { name: "Loaded Baked Potato Soup" } } : {}), pour: { name: "Calder River Old Vine Zinfandel" }, bite: { name: "Meatballs in marinara" },
      },
    };
  }
  const h = menuSamples.thanksgiving;
  return { kind: "holiday", venue: r.venueKey, name: h.title, date: "2026-11-26", items: h.courses.map((c) => c[1]), booking: `Seatings ${h.seatings.join(" and ")} · up to 4 guests per apartment · reply to book` };
}

/**
 * "Bring in a menu": drop in whatever the kitchen has (a PDF, Word or Excel file, a photo of the board, a cycle
 * packet). Kinlight says what it thinks it is; the chef confirms or corrects it. The original sits beside what was read,
 * with only the unsure lines highlighted and a one-tap answer for each, and for a menu that already exists only what's
 * different. Confirm, and it says where the menu goes next and when. In this demo the four sample files are read for
 * real content; any other file is read as the sample of its type.
 */
export function MenuImport({ venues, start, onApply, onClose }: { venues: { key: string; name: string }[]; start?: SampleKey; onApply: (a: Applied, summary: string) => void; onClose: () => void }) {
  const [read, setRead] = useState<Read | null>(start ? readSample(start, venues) : null);
  const [reading, setReading] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmedGuess, setConfirmedGuess] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(true);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = (key: SampleKey, file: string, demoNote?: string) => {
    setReading(file);
    setAnswers({});
    setConfirmedGuess(false);
    setDone(false);
    setNote(demoNote ?? null);
    window.setTimeout(() => { setRead(readSample(key, venues)); setReading(null); }, 1100);
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const n = f.name.toLowerCase();
    const sample = SAMPLES.find((x) => x.file === n);
    const key: SampleKey = sample?.key ?? (/\.(xlsx?|csv)$/.test(n) ? "millpond" : /\.(docx?)$/.test(n) ? "thanksgiving" : /\.(jpe?g|png|heic|webp)$/.test(n) || f.type.startsWith("image/") ? "perch" : "juniper");
    load(key, f.name, sample ? undefined : `This demo reads the four sample files. ${f.name} is read as the ${SAMPLES.find((x) => x.key === key)!.type} sample.`);
    e.target.value = "";
  };

  const unsure = read?.lines.filter((l) => l.status === "unsure") ?? [];
  const left = unsure.filter((l) => !answers[l.id]).length;
  const changed = read?.lines.filter((l) => l.status === "changed").length ?? 0;
  const added = read?.lines.filter((l) => l.status === "added").length ?? 0;
  const removed = read?.lines.filter((l) => l.status === "removed").length ?? 0;
  const summary = read ? [changed && `${changed} ${changed === 1 ? "change" : "changes"}`, added && `${added} new`, removed && `${removed} removed`].filter(Boolean).join(", ") || "Nothing different" : "";
  const shown = read ? read.lines.filter((l) => !read.existing || !onlyChanges || l.status !== "same") : [];

  const confirm = () => {
    if (!read || left) return;
    onApply(applied(read, answers), `${read.guess}: ${summary.toLowerCase()}`);
    setDone(true);
    say(read.key === "thanksgiving" ? "Sent to Renata for approval" : `${read.guess} is in`);
  };

  return (
    <section className="sx-card mi" aria-labelledby="mi-h">
      <header className="sx-card-head">
        <div>
          <h2 id="mi-h"><Icon name="upload" /> Bring in a menu</h2>
          <p>A PDF, Word or Excel file, a photo of the board, or a whole cycle packet. Kinlight reads it and asks only what it isn’t sure of.</p>
        </div>
        <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onClose}><Icon name="x" /> Close</button>
      </header>
      <div className="sx-card-body">
        {!read && !reading && (
          <div className="mi-start">
            <label className="mi-drop">
              <Icon name="upload" />
              <b>Drop a file here, or choose one</b>
              <small>PDF, Word, Excel or a photo</small>
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*" className="vh" onChange={onFile} />
            </label>
            <div className="mi-samples">
              <p className="mn-h3" style={{ marginTop: 0 }}>Or try a sample</p>
              <ul>
                {SAMPLES.map((x) => (
                  <li key={x.key}>
                    <button type="button" onClick={() => load(x.key, x.file)}>
                      <span className="mi-thumb"><Image src={preview(x.file)} alt="" fill sizes="96px" /></span>
                      <span><b>{x.what}</b><small>{x.type} · {x.file}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {reading && <p className="mi-reading"><Icon name="clock" /> Reading {reading}…</p>}

        {read && !reading && (
          <>
            {note && <p className="sx-note" style={{ marginTop: 0 }}><Icon name="info" /> {note}</p>}
            <div className={`mi-guess${confirmedGuess ? " ok" : ""}`}>
              <span><small>Kinlight thinks this is</small><b>{read.guess}</b></span>
              {confirmedGuess ? (
                <span className="mn-ok"><Icon name="check" /> Confirmed</span>
              ) : (
                <span className="pt-act" style={{ margin: 0 }}>
                  <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => setConfirmedGuess(true)}><Icon name="check" /> That’s right</button>
                  <label className="mi-other"><span className="vh">It’s something else</span>
                    <select value="" onChange={(e) => { if (e.target.value) load(e.target.value as SampleKey, read.file); }}>
                      <option value="">It’s something else…</option>
                      {SAMPLES.filter((x) => x.key !== read.key).map((x) => <option key={x.key} value={x.key}>{readSample(x.key, venues).guess}</option>)}
                    </select>
                  </label>
                </span>
              )}
            </div>

            <div className="mi-side">
              <figure className="mi-orig">
                <figcaption><Icon name="doc" /> {read.file} <a className="sx-link" href={`/samples/menus/${read.file}`} target="_blank" rel="noreferrer">Open the original</a></figcaption>
                <div className="mi-orig-img"><Image src={read.preview} alt={`The original: ${read.file}`} fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
              </figure>
              <div className="mi-read">
                <div className="mi-read-h">
                  <b>What Kinlight read</b>
                  {read.existing && <Badge tone={changed + added + removed ? "warn" : "good"}>{summary}</Badge>}
                  {read.existing && (
                    <label className="mi-toggle"><input type="checkbox" checked={onlyChanges} onChange={(e) => setOnlyChanges(e.target.checked)} /> Only what’s different</label>
                  )}
                </div>
                {unsure.length > 0 && <p className="mi-left">{left ? <><Icon name="alert" /> {left} to answer before it goes in</> : <><Icon name="check" /> All answered</>}</p>}
                <ul className="mi-lines">
                  {shown.map((l) => (
                    <li key={l.id} className={`is-${l.status}${l.status === "unsure" && answers[l.id] ? " answered" : ""}`}>
                      <span className="mi-where">{l.where}</span>
                      <span className="mi-what">
                        <b>{l.status === "unsure" && answers[l.id] ? answers[l.id] : l.text}</b>
                        {l.sub && <small>{l.sub}</small>}
                        {l.was && <small className="mi-was">Was: {l.was}</small>}
                        {l.status === "unsure" && l.ask && (
                          answers[l.id] ? (
                            <small className="mn-ok"><Icon name="check" /> Answered <button type="button" className="mn-linkbtn" onClick={() => setAnswers((a) => { const n = { ...a }; delete n[l.id]; return n; })}>Change</button></small>
                          ) : (
                            <span className="mi-ask">
                              <small>{l.ask.q}</small>
                              <span className="mn-choose">{l.ask.options.map((o) => <button key={o} type="button" className="sx-btn sx-btn-sm" onClick={() => setAnswers((a) => ({ ...a, [l.id]: o }))}>{o}</button>)}</span>
                            </span>
                          )
                        )}
                      </span>
                      {l.status !== "same" && l.status !== "unsure" && <span className={`mi-chip ${l.status}`}>{l.status === "changed" ? "Changed" : l.status === "added" ? "New" : "Removed"}</span>}
                    </li>
                  ))}
                  {shown.length === 0 && <li className="is-same"><span className="mi-what"><b>Nothing different from what’s there now.</b></span></li>}
                </ul>
              </div>
            </div>

            {done ? (
              <div className="sx-callout good mi-done" role="status">
                <Icon name="check" />
                <div>
                  <p><b>{read.key === "thanksgiving" ? "Sent to Renata for approval." : "In, and on its way."}</b> Where it goes next:</p>
                  <ul>{read.next.map((n) => <li key={n}>{n}</li>)}</ul>
                  <p className="pt-act" style={{ margin: "8px 0 0" }}>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setRead(null); setDone(false); }}><Icon name="upload" /> Bring in another</button>
                    <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onClose}>Done</button>
                  </p>
                </div>
              </div>
            ) : (
              <div className="mn-go mi-go">
                <button type="button" className="sx-btn sx-btn-terra sx-btn-lg" disabled={!confirmedGuess || left > 0} onClick={confirm}><Icon name="check" /> {read.key === "thanksgiving" ? "Confirm and send to Renata" : "Confirm"}</button>
                <p>{!confirmedGuess ? "First, is Kinlight right about what this is?" : left ? `Answer the ${left === 1 ? "one line" : `${left} lines`} above first.` : read.next[0]}</p>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setRead(null)}>Choose a different file</button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
