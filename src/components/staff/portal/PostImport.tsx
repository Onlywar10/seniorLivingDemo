"use client";

// Import: upload or photograph anything (a designed PDF calendar, a whiteboard, a scribbled note, the kitchen's menu).
// Kinlight says what it thinks it is and for when; the person confirms or corrects. Then it proposes every change
// against what's already in the calendar or menus (new, changed, cancelled, and who will be told), with anything unsure
// flagged. Confirm, and it publishes and tells people. Menus land in Menus. Shown in this browser only.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ImportKind, ImportRow, ImportSetup, NewEventSetup } from "@/data/staff/post";
import { say } from "../store";
import { Drawer } from "./Drawer";
import { NewEvent } from "./NewEvent";
import { Icon } from "../../Icon";
import { Auto, Help } from "./Help";
import { ImportArt } from "./ImportArt";

type Stage = "pick" | "reading" | "guess" | "propose" | "done";
const kindLabel: Record<ImportKind, string> = { today: "Today", week: "A week", month: "A month", menu: "A menu" };
const sampleLabel: Record<ImportKind, string> = { month: "Monthly calendar", week: "Whiteboard", today: "Note", menu: "Menu" };
const order: ImportKind[] = ["today", "week", "month", "menu"];
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const toldLine = (t: { residents: number; families: number }) => [t.residents ? plural(t.residents, "resident") : "", t.families ? plural(t.families, "family", "families") : ""].filter(Boolean).join(" and ");

export function Import({ setup, eventSetup }: { setup: ImportSetup; eventSetup?: NewEventSetup }) {
  // "Details" on a proposed event: the same form as adding an event, filled in from what was read.
  const [details, setDetails] = useState<ImportRow | null>(null);
  const router = useRouter();
  const byK = (k: ImportKind) => setup.samples.find((s) => s.k === k)!;
  const [stage, setStage] = useState<Stage>("pick");
  const [kind, setKind] = useState<ImportKind>("week");
  const [guessed, setGuessed] = useState<ImportKind>("week");
  const [file, setFile] = useState<{ name: string; url?: string } | null>(null);
  const [fixed, setFixed] = useState<Record<string, string>>({});
  const made = useRef<string[]>([]);
  useEffect(() => () => made.current.forEach((u) => URL.revokeObjectURL(u)), []);
  useEffect(() => {
    if (stage !== "reading") return;
    const id = window.setTimeout(() => setStage("guess"), 1700);
    return () => window.clearTimeout(id);
  }, [stage]);

  const s = byK(kind);
  const start = (k: ImportKind, f: { name: string; url?: string } | null) => {
    // Menus have their own import (it knows each restaurant's cycle and standing menu), so a menu goes straight there.
    if (k === "menu") {
      const n = f?.name.toLowerCase() ?? "";
      const sample = /\.(xlsx?|csv)$/.test(n) ? "millpond" : /\.docx?$/.test(n) ? "thanksgiving" : /\.(jpe?g|png|heic|webp)$/.test(n) ? "perch" : "juniper";
      router.push(`/staff/menus?start=${sample}`);
      return;
    }
    setKind(k); setGuessed(k); setFile(f); setFixed({}); setStage("reading"); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const own = (f: File) => {
    const k: ImportKind = /menu|\.(docx?|xlsx?|csv)$/i.test(f.name) ? "menu" : /pdf/i.test(f.type) ? "month" : "week";
    const url = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
    if (url) made.current.push(url);
    start(k, { name: f.name, url });
  };
  const reset = () => { setStage("pick"); setFile(null); setFixed({}); };
  const left = s.flags.filter((f) => !fixed[f.id]).length;
  const name = file?.name ?? s.file;

  const preview = file?.url
    // eslint-disable-next-line @next/next/no-img-element
    ? <img className="im-own" src={file.url} alt={`Your upload: ${file.name}`} />
    : <ImportArt art={s.art} label={`${s.file}: ${s.what}`} />;

  if (stage === "pick") {
    return (
      <div className="sx-card sx-card-body im">
        <label className="im-drop">
          <input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) own(f); }} />
          <Icon name="upload" />
          <b>Take a photo or choose a file</b>
          <span>A calendar, a whiteboard, a note or a menu</span>
        </label>
        <p className="sx-lbl im-or">Or try one</p>
        <ul className="im-samples">
          {(["month", "week", "today", "menu"] as ImportKind[]).map((k) => {
            const x = byK(k);
            return (
              <li key={k}>
                <button type="button" onClick={() => start(k, null)}>
                  <ImportArt art={x.art} label={`${x.file}: ${x.what}`} />
                  <b>{sampleLabel[k]}</b>
                  <small>{x.from}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (stage === "reading") {
    return (
      <div className="sx-card sx-card-body im im-split" role="status" aria-live="polite">
        <div className="im-art im-scan">{preview}</div>
        <div className="im-side">
          <h2 className="im-h">Reading {name}…</h2>
          <p className="sx-hint">Matching it against the calendar{kind === "menu" ? " and menus" : ""}.</p>
        </div>
      </div>
    );
  }

  if (stage === "guess") {
    return (
      <div className="sx-card sx-card-body im im-split">
        <div className="im-art">{preview}</div>
        <div className="im-side">
          <p className="sx-lbl">Step 1 of 2</p>
          <h2 className="im-h">This looks like {s.what}, <span className="im-period">{s.period}</span></h2>
          {kind !== guessed && <p className="im-corrected">Changed by you</p>}
          <fieldset className="po-field">
            <legend className="sx-lbl">It’s for</legend>
            <div className="sx-seg po-seg" role="group" aria-label="What it is">
              {order.map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setFixed({}); }}>{kindLabel[k]}</button>)}
            </div>
          </fieldset>
          <div className="pt-act">
            <button type="button" className="sx-btn sx-btn-lg sx-btn-primary" onClick={() => setStage("propose")}><Icon name="check" /> Yes, that’s it</button>
            <button type="button" className="sx-btn" onClick={reset}>Start again</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    const told = toldLine(s.told);
    return (
      <div className="sx-card sx-card-body po-done" role="status">
        <div className="po-done-h">
          <Icon name="check" />
          <div>
            <h2>{kind === "menu" ? `${s.menu?.venue} menu is in Menus` : kind === "month" ? `${s.period.split(" ")[0]} is on the calendar` : kind === "today" ? "Today is up to date" : "Next week is on the calendar"}</h2>
            <p className="pt-reach">{told ? `Told ${told} · ` : ""}{kind === "menu" ? "publishes day by day" : "website updated"}</p>
          </div>
        </div>
        <Auto summary="Everything Kinlight did">
          <ul>
            {kind === "menu" ? (
              <>
                <li>{s.totals[1].n} dishes across 7 days, in Menus for the kitchen to see.</li>
                <li>Each day goes on the website’s dining page that morning, and in the large-print menu cards.</li>
              </>
            ) : (
              <>
                {s.added.length > 0 && <li>{kind === "month" ? `${s.totals[0].n} events, ${s.totals[1].n} set to repeat` : plural(s.added.length, "new event")} on the website and printed calendar, each with a description.</li>}
                {s.changed.length + s.cancelled.length > 0 && <li>{plural(s.changed.length, "change")} and {plural(s.cancelled.length, "cancellation")}: {told ? `${told} who were booked heard by text, in their own language` : "nobody was booked yet"}.</li>}
                {s.added.length > 0 && <li>Personal invites scheduled for residents with matching interests.</li>}
                {kind !== "today" && <li>In the newsletter’s week ahead.</li>}
              </>
            )}
          </ul>
        </Auto>
        <div className="pt-act">
          {kind === "menu" ? <Link className="sx-btn sx-btn-primary" href="/staff/menus"><Icon name="fork" /> Open Menus</Link> : <Link className="sx-btn sx-btn-primary" href="/staff/calendar"><Icon name="calendar" /> Open the calendar</Link>}
          <button type="button" className="sx-btn" onClick={reset}>Import something else</button>
        </div>
      </div>
    );
  }

  // Step 2: every proposed change.
  const told = toldLine(s.told);
  return (
    <div className="sx-card sx-card-body im">
      <div className="im-top">
        <div className="im-mini">{preview}</div>
        <div>
          <p className="sx-lbl">Step 2 of 2 · {s.what}, {s.period}</p>
          <h2 className="im-h">Kinlight proposes</h2>
          <div className="po-read">
            {s.totals.map((t) => {
              const n = t.tone === "warn" ? left : t.n;
              return <div key={t.label} className={t.tone === "warn" ? (n ? "warn" : "good") : ""}><b>{n}</b><span>{t.tone === "warn" && !n ? "all checked" : t.label}</span></div>;
            })}
          </div>
        </div>
      </div>

      {s.flags.length > 0 && (
        <section className="im-sec">
          <h3>To check <Help label="Why these are flagged"><p>Kinlight flags anything it couldn’t read for certain. Its best guess is first.</p></Help></h3>
          <ul className="po-flags">
            {s.flags.map((f) => (
              <li key={f.id} className={fixed[f.id] ? "ok" : ""}>
                <div className="po-flag-h"><b>{f.title}</b><span className="sx-hint">{f.read}</span></div>
                <p>{f.why}</p>
                <div className="sx-chips" role="group" aria-label={`Fix ${f.title}`}>
                  {f.options.map((o) => <button key={o} type="button" aria-pressed={fixed[f.id] === o} onClick={() => setFixed({ ...fixed, [f.id]: o })}>{fixed[f.id] === o && <Icon name="check" />}{o}</button>)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.menu && (
        <section className="im-sec">
          <h3>{s.menu.venue}</h3>
          <ul className="im-rows">
            {s.menu.days.map((d) => (
              <li key={d.day}>
                <span className="im-when">{d.day}</span>
                <span><b>{d.special.name}</b>{d.special.tags.length > 0 && <small className="im-tags">{d.special.tags.join(" · ")}</small>}<small>{d.soup}{d.mains.length ? ` · ${d.mains.join(" · ")}` : ""}</small></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.changed.length > 0 && <Rows title="Changed" rows={s.changed} tone="changed" />}
      {s.cancelled.length > 0 && <Rows title="Cancelled" rows={s.cancelled} tone="cancelled" />}
      {s.added.length > 0 && <Rows title={kind === "month" ? `Events · ${s.totals[0].n}, first day shown` : "New"} rows={s.added} tone="new" onDetails={eventSetup ? setDetails : undefined} />}
      {details && eventSetup && (
        <Drawer wide title={details.title} sub={`Read from the ${kind === "week" ? "photo" : "calendar"} · set the rest before you confirm`} onClose={() => setDetails(null)}>
          <NewEvent inDrawer keepLocal setup={eventSetup} prefill={{ title: details.title, date: details.date, time: details.start !== undefined ? `${String(Math.floor(details.start / 60)).padStart(2, "0")}:${String(details.start % 60).padStart(2, "0")}` : undefined, room: details.room, repeat: !!details.match }} onSaved={() => { setDetails(null); say(`${details.title}: details saved. It goes on the calendar when you confirm.`); }} onCancel={() => setDetails(null)} />
        </Drawer>
      )}

      <div className="pt-submit">
        <div className="im-told">
          {kind === "menu" ? "Goes to Menus, then the dining page day by day" : told ? <>Tells <b>{told}</b></> : "Nobody to tell: nothing booked yet"}
          {told && <Help label="Who is told"><p>Only people booked on a changed or cancelled event, and the families of residents who share with family. Each in their own language; Lantern residents through the care team.</p></Help>}
        </div>
        <button type="button" className="sx-btn sx-btn-lg sx-btn-primary" disabled={left > 0} onClick={() => { setStage("done"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <Icon name="check" /> {left ? `${left} to check` : kind === "menu" ? "Send to Menus" : "Publish"}
        </button>
      </div>
    </div>
  );
}

function Rows({ title, rows, tone, onDetails }: { title: string; rows: ImportRow[]; tone: "new" | "changed" | "cancelled"; onDetails?: (r: ImportRow) => void }) {
  return (
    <section className="im-sec">
      <h3>{title} <span className="sx-hint">{rows.length}</span></h3>
      <ul className={`im-rows ${tone}`}>
        {rows.map((r) => (
          <li key={r.id}>
            <span className="im-when">{r.when}</span>
            <span>
              <b>{tone === "cancelled" ? <s>{r.title}</s> : r.title}</b>
              {r.was && r.now ? <small>{r.was} → <b>{r.now}</b>{r.room ? ` · ${r.room}` : ""}</small> : r.room ? <small>{r.room}</small> : null}
            </span>
            {tone === "new" ? (
              <span className="im-new-a">
                {r.match ? <span className="po-tag">Matches the weekly activity · {r.match}</span> : <span className="po-tag im-tag-new">New</span>}
                {onDetails && r.date && <button type="button" className="sx-btn sx-btn-sm" onClick={() => onDetails(r)}><Icon name="edit" /> Details</button>}
              </span>
            ) : r.told && (r.told.residents || r.told.families) ? <span className="im-told-n">{toldLine(r.told)}</span> : <span />}
          </li>
        ))}
      </ul>
    </section>
  );
}

