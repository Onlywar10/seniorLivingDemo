"use client";

// Photos always belong to an event. Kinlight suggests the event from when the photos were taken, suggests who's in
// them from that event's attendance (never by face matching), checks each person's photo consent on file, writes the
// caption, and places them in the event gallery, the newsletter, the midweek highlight if chosen, and the family update
// of each tagged resident who shares with family. Resident photos go to the approver first. Shown in this browser only.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PhotoEvent, PhotoSetup } from "@/data/staff/post";
import { Icon } from "../../Icon";
import { useStaffCommunity } from "../StaffCommunity";
import { Badge } from "../ui";
import { Done, Switch, andList, firstName, type Happened } from "./PostBits";

/** Suggested tags: a few who came, including anyone whose consent needs a decision, so it's never missed. */
function suggestTags(e: PhotoEvent | undefined, consent: Record<string, boolean>) {
  if (!e) return [];
  const out = e.came.slice(0, 3);
  const no = e.came.find((n) => consent[n] === false);
  if (no && !out.includes(no)) out[out.length - 1] = no;
  return out;
}

export function Photos({ setup }: { setup: PhotoSetup }) {
  const { site } = useStaffCommunity();
  const [eventId, setEventId] = useState(setup.events[0]?.id ?? "");
  const ev = setup.events.find((e) => e.id === eventId);
  const [shots, setShots] = useState<Set<string>>(new Set(setup.presets.slice(0, 2).map((p) => p.k)));
  const [uploads, setUploads] = useState<{ url: string; name: string }[]>([]);
  const [tags, setTags] = useState<string[]>(() => suggestTags(setup.events[0], setup.consent));
  const [cropped, setCropped] = useState<Set<string>>(new Set());
  const [leftOut, setLeftOut] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState("");
  const [caption, setCaption] = useState<string | null>(null);
  const [news, setNews] = useState(true);
  const [highlight, setHighlight] = useState(false);
  const [stage, setStage] = useState<"edit" | "sent" | "waiting">("edit");

  const made = useRef<string[]>([]);
  useEffect(() => () => made.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const pickEvent = (id: string) => {
    const e = setup.events.find((x) => x.id === id);
    setEventId(id);
    setTags(suggestTags(e, setup.consent));
    setCropped(new Set());
    setLeftOut(new Set());
    setCaption(null);
  };
  const toggleShot = (k: string) => setShots((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const ok = (n: string) => setup.consent[n] !== false;
  const shown = tags.filter((n) => !cropped.has(n) && !leftOut.has(n));
  const blocked = shown.filter((n) => !ok(n));
  const nPhotos = Math.max(0, shots.size + uploads.length - leftOut.size);
  const sharers = shown.filter((n) => setup.shares[n] !== false);
  const private_ = shown.filter((n) => setup.shares[n] === false);
  const others = (ev?.came ?? []).filter((n) => !tags.includes(n));

  // Kinlight's caption: the event and the first names of who's in them, nothing more.
  const day = ev?.today ? "today" : ev ? `on ${ev.when.split(",")[0]}` : "";
  const written = ev ? `${ev.title} ${day}${ev.lantern ? "" : ` in the ${ev.place.replace(/^The /, "")}`}${shown.length ? `, with ${andList(shown.map(firstName))}` : ""}.` : "";
  const text = caption ?? written;
  const approval = shown.length > 0 && !setup.isApprover;

  const destinations: Happened[] = [
    { icon: "image", title: `${ev?.title ?? "Event"} gallery`, detail: `On the website’s photo gallery for this event${ev?.lantern ? ", first names only" : ""}.` },
    ...(news ? [{ icon: "mail" as const, title: "Newsletter", detail: `In the newsletter on ${setup.newsletter}, with this week’s photos.` }] : []),
    ...(highlight ? [{ icon: "star" as const, title: "Midweek highlight", detail: "Suggested as this week’s midweek highlight text to families." }] : []),
    ...(sharers.length ? [{ icon: "heart" as const, title: `${sharers.length} family update${sharers.length === 1 ? "" : "s"}`, detail: `The families of ${andList(sharers.map(firstName))} see it in their personal update.` }] : []),
    ...(private_.length ? [{ icon: "lock" as const, title: "Not in their family update", detail: `${andList(private_.map(firstName))} ${private_.length === 1 ? "doesn’t" : "don’t"} share with family, so it isn’t sent to their family.` }] : []),
  ];

  if (stage !== "edit") {
    const wait = stage === "waiting";
    return (
      <Done
        wait={wait}
        title={wait ? `Sent to ${setup.approver.first} for approval` : `${nPhotos} photo${nPhotos === 1 ? "" : "s"} posted`}
        line={wait ? <>Photos of residents need {setup.approver.first}’s OK. {setup.approver.first} gets a text with the card; the moment it’s approved, this happens:</> : <>From {ev?.title}. Here’s where they went.</>}
        items={[...(wait ? [{ icon: "clock" as const, title: `Waiting for ${setup.approver.first}`, detail: "Usually the same day.", wait: true }] : []), ...destinations, { icon: "check", title: "Consent checked", detail: shown.length ? `Everyone shown has photo consent on file${cropped.size ? `; ${andList([...cropped].map(firstName))} cropped out` : ""}${leftOut.size ? `; photos with ${andList([...leftOut].map(firstName))} left out` : ""}.` : "Nobody is tagged in them." }]}
        actions={<>
          {!wait && <Link className="sx-btn sx-btn-primary" href={site("/news")} target="_blank"><Icon name="globe" /> See them on the website</Link>}
          <button type="button" className="sx-btn" onClick={() => setStage("edit")}><Icon name="plus" /> More photos</button>
        </>}
      />
    );
  }

  return (
    <div className="po-two">
      <form className="sx-card sx-card-body sx-form pt-form" onSubmit={(e) => { e.preventDefault(); if (blocked.length) return; setStage(approval ? "waiting" : "sent"); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Photos">
        <div>
          <p className="sx-lbl">Choose or take photos</p>
          <div className="pt-shots" role="group" aria-label="Choose photos">
            {setup.presets.map((x) => (
              <button key={x.k} type="button" aria-pressed={shots.has(x.k)} onClick={() => toggleShot(x.k)} aria-label={x.label}>
                <Image src={x.src} alt="" fill sizes="120px" />
                {shots.has(x.k) && <span className="po-tick"><Icon name="check" /></span>}
              </button>
            ))}
            {uploads.map((u) => (
              <button key={u.url} type="button" aria-pressed="true" aria-label={`Remove ${u.name}`} onClick={() => setUploads((xs) => xs.filter((x) => x !== u))}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
            <label>
              <input type="file" accept="image/*" multiple onChange={(e) => { const fs = [...(e.target.files ?? [])]; const add = fs.map((f) => ({ url: URL.createObjectURL(f), name: f.name })); made.current.push(...add.map((x) => x.url)); setUploads((xs) => [...xs, ...add]); }} />
              <Icon name="upload" /> Take or choose
            </label>
          </div>
          <p className="sx-hint">{nPhotos} photo{nPhotos === 1 ? "" : "s"} chosen.</p>
        </div>

        <label>
          Which event?
          <select value={eventId} onChange={(e) => pickEvent(e.target.value)}>
            {setup.events.map((e) => <option key={e.id + e.when} value={e.id}>{e.title} · {e.when}{e.suggested ? " (suggested)" : ""}</option>)}
          </select>
          {ev?.suggested && setup.because && <span className="sx-hint po-why"><Icon name="clock" /> {setup.because}</span>}
        </label>

        <label>
          <span className="po-written-h"><span className="po-ai"><Icon name="sparkle" /> {caption === null ? "Kinlight wrote this caption" : "Changed by you"}</span>{caption !== null && <button type="button" className="sx-link pt-linkbtn" onClick={() => setCaption(null)}>Write it again</button>}</span>
          <textarea rows={2} value={text} onChange={(e) => setCaption(e.target.value)} aria-label="Caption" />
        </label>

        <div className="pt-consent">
          <p className="sx-lbl">Who’s in them?</p>
          <p className="sx-hint">Suggested from who came to {ev?.title ?? "the event"} ({ev?.came.length ?? 0} checked in), never by face matching. Each person is checked against the photo consent on file.</p>
          <ul className="pt-tags">
            {tags.map((n) => {
              const state = leftOut.has(n) ? "out" : cropped.has(n) ? "cut" : ok(n) ? "ok" : "no";
              return (
                <li key={n} className={state === "out" ? "cut" : state}>
                  <Icon name={state === "ok" ? "check" : state === "no" ? "alert" : "minus"} />
                  <span>
                    <b>{n}</b>
                    <small>{state === "out" ? "Their photos are left out" : state === "cut" ? "Cropped out" : state === "ok" ? `Photo consent on file${setup.shares[n] === false ? " · doesn’t share with family" : ""}` : "No photo consent on file"}</small>
                  </span>
                  {state === "no" ? (
                    <span className="po-tag-act">
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setCropped((s) => new Set(s).add(n))}>Crop out</button>
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setLeftOut((s) => new Set(s).add(n))}>Leave out</button>
                    </span>
                  ) : <span />}
                  <button type="button" className="sx-x" aria-label={`Remove tag: ${n}`} onClick={() => { setTags((t) => t.filter((x) => x !== n)); setCropped((s) => { const x = new Set(s); x.delete(n); return x; }); setLeftOut((s) => { const x = new Set(s); x.delete(n); return x; }); }}><Icon name="x" /></button>
                </li>
              );
            })}
          </ul>
          {others.length > 0 && (
            <div className="po-came">
              <span className="sx-hint">Also came:</span>
              <div className="sx-chips">
                {others.slice(0, 10).map((n) => <button key={n} type="button" onClick={() => setTags((t) => [...t, n])}><Icon name="plus" />{n}</button>)}
              </div>
            </div>
          )}
          <div className="pt-tag-add">
            <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Tag someone else">
              <option value="">Someone else…</option>
              {setup.residentNames.filter((n) => !tags.includes(n)).map((n) => <option key={n}>{n}</option>)}
            </select>
            <button type="button" className="sx-btn sx-btn-sm" disabled={!adding} onClick={() => { setTags((t) => [...t, adding]); setAdding(""); }}><Icon name="plus" /> Tag</button>
          </div>
          {blocked.length > 0 && (
            <div className="sx-callout" role="alert">
              <Icon name="alert" />
              <p><b>Not yet.</b> No photo consent on file for {andList(blocked)}. Crop them out, or leave their photos out.</p>
            </div>
          )}
        </div>

        <fieldset className="po-field po-dest">
          <legend className="sx-lbl">Where they go</legend>
          <p className="po-fixed"><Icon name="check" /> The {ev?.title ?? "event"} gallery on the website</p>
          <Switch on={news} onChange={setNews} label="This week’s newsletter" />
          <Switch on={highlight} onChange={setHighlight} label="Suggest for the midweek highlight" hint="Kinlight picks the week’s best photo; this puts yours forward." />
          <p className="po-fixed"><Icon name={sharers.length ? "heart" : "lock"} /> {sharers.length ? `Family updates for ${andList(sharers.map(firstName))}` : "No family updates: nobody tagged shares with family"}{private_.length ? ` (not ${andList(private_.map(firstName))}, who ${private_.length === 1 ? "doesn’t" : "don’t"} share)` : ""}</p>
        </fieldset>

        <div className="pt-submit">
          <p>{blocked.length ? "Decide about consent first." : approval ? <>Goes to <b>{setup.approver.first}</b> first, because it shows residents.</> : "Publishes straight away."}</p>
          <button type="submit" className="sx-btn sx-btn-lg sx-btn-primary" disabled={blocked.length > 0 || nPhotos === 0 || !ev}>
            <Icon name="send" /> {approval ? `Send to ${setup.approver.first}` : "Post the photos"}
          </button>
        </div>
      </form>

      <section className="sx-card sx-card-body po-auto" aria-label="What Kinlight does automatically">
        <h2 className="pt-prev-h">What Kinlight does when you post them</h2>
        <ul className="po-autolist">
          {destinations.map((x) => <li key={x.title}><Icon name={x.icon} /><span><b>{x.title}</b> {x.detail}</span></li>)}
        </ul>
        <div className="pt-news po-newsprev">
          <div className="ph">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploads[0]?.url ?? setup.presets.find((p) => shots.has(p.k))?.src ?? setup.presets[0].src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="tx"><small>Gallery · {ev?.title}</small><p>{text}</p></div>
        </div>
        {shown.length > 0 && <p className="sx-hint"><Badge tone={blocked.length ? "warn" : "good"}>{shown.length} tagged</Badge> {blocked.length ? `${blocked.length} still need a decision.` : "Everyone shown has photo consent on file."}</p>}
      </section>
    </div>
  );
}
