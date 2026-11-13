"use client";

// Taking attendance for one activity, in the event sheet. Three ways: a tap list (who's booked first, a search for
// anyone else, and "Everyone booked came"), scanning residents' check-in cards with this phone's camera as they come
// in, or a photo of the paper sign-in sheet. Residents never scan anything themselves: many would struggle to open the
// camera and hold it steady, so staff scan the card. Voice attendance comes in Beta. Saved in this browser only.
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../Icon";
import { Badge } from "../ui";
import { CheckInCard } from "./Qr";

export interface AttendanceEvent { id: string; title: string; when: string; place: string; lantern?: boolean }

type Mode = "tap" | "qr" | "photo";

export function Attendance({ ev, booked, bookedLabel = "Booked", everyone, qrIn = [], onSaved }: {
  ev: AttendanceEvent;
  /** Who's booked, or who usually comes: listed first. */
  booked: string[]; bookedLabel?: string;
  /** Everyone else who can be checked in, for the search. */
  everyone: string[];
  /** Already checked in by a scan of their card. */
  qrIn?: string[];
  onSaved: (n: number, names: string[]) => void;
}) {
  const [mode, setMode] = useState<Mode>("tap");
  const [here, setHere] = useState<Set<string>>(() => new Set(qrIn));
  const [byQr, setByQr] = useState<Set<string>>(() => new Set(qrIn));
  const [extra, setExtra] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [full, setFull] = useState(false);
  const [photo, setPhoto] = useState<{ url: string; name: string } | null>(null);
  const [reading, setReading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const toggle = (n: string) => setHere((s) => { const x = new Set(s); if (x.has(n)) x.delete(n); else x.add(n); return x; });
  const others = everyone.filter((n) => !booked.includes(n) && !extra.includes(n));
  const found = q.trim().length > 1 ? others.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const add = (n: string) => { setExtra((x) => [...x, n]); setHere((s) => new Set(s).add(n)); setQ(""); };
  const allCame = booked.every((n) => here.has(n));

  // The camera open: each card scanned at the door checks one resident in and the count goes up.
  useEffect(() => {
    if (!full || ev.lantern) return;
    const id = window.setInterval(() => {
      setByQr((cur) => {
        const next = booked.find((n) => !cur.has(n));
        if (!next || cur.size >= Math.ceil(booked.length * 0.75)) return cur;
        setHere((h) => new Set(h).add(next));
        return new Set(cur).add(next);
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, [full, booked, ev.lantern]);

  const upload = (f: File | undefined) => {
    if (!f) return;
    setPhoto({ url: URL.createObjectURL(f), name: f.name });
    setReading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setReading(false);
      setHere(new Set([...booked.slice(0, Math.max(1, booked.length - 2)), ...extra]));
      setMode("tap");
    }, 1200);
  };

  const save = () => onSaved(here.size, [...here]);
  const latest = [...byQr].slice(-3).reverse();

  return (
    <div className="at2">
      <div className="sx-seg at2-modes" role="group" aria-label="How to take attendance">
        <button type="button" aria-pressed={mode === "tap"} onClick={() => setMode("tap")}><Icon name="check" /> Tap list</button>
        {!ev.lantern && <button type="button" aria-pressed={mode === "qr"} onClick={() => setMode("qr")}><Icon name="phone" /> Scan cards</button>}
        <button type="button" aria-pressed={mode === "photo"} onClick={() => setMode("photo")}><Icon name="image" /> Photo of the sheet</button>
        <button type="button" disabled aria-disabled="true" title="Coming in Beta"><Icon name="sms" /> Voice <small>Beta</small></button>
      </div>

      {mode === "tap" && (
        <>
          <div className="at2-top">
            <p><b>{here.size}</b> here <span className="sx-hint">· {booked.length} {bookedLabel.toLowerCase()}{byQr.size ? ` · ${byQr.size} by card` : ""}</span></p>
            <button type="button" className="sx-btn sx-btn-sm" disabled={allCame} onClick={() => setHere((s) => new Set([...s, ...booked]))}><Icon name="check" /> Everyone {bookedLabel === "Booked" ? "booked" : "on the list"} came</button>
          </div>
          <h4 className="at2-h">{bookedLabel} ({booked.length})</h4>
          <ul className="at-tap" aria-label={`${bookedLabel} for ${ev.title}`}>
            {booked.map((n) => (
              <li key={n}>
                <button type="button" aria-pressed={here.has(n)} onClick={() => toggle(n)}>
                  <span className="at-box" aria-hidden="true">{here.has(n) && <Icon name="check" />}</span>
                  {n}
                  {byQr.has(n) && <span className="at-qr">Card</span>}
                </button>
              </li>
            ))}
          </ul>
          <h4 className="at2-h">Anyone else who came</h4>
          {extra.length > 0 && (
            <ul className="at-tap">
              {extra.map((n) => (
                <li key={n}><button type="button" aria-pressed={here.has(n)} onClick={() => toggle(n)}><span className="at-box" aria-hidden="true">{here.has(n) && <Icon name="check" />}</span>{n}</button></li>
              ))}
            </ul>
          )}
          <label className="at2-search">
            <Icon name="search" />
            <span className="vh">Find a resident</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a resident by name" />
          </label>
          {found.length > 0 && (
            <ul className="at2-found">
              {found.map((n) => <li key={n}><button type="button" onClick={() => add(n)}><Icon name="plus" /> {n}</button></li>)}
            </ul>
          )}
          {q.trim().length > 1 && !found.length && <p className="sx-hint">Nobody called “{q}”.</p>}
          <div className="at-foot">
            <span><b>{here.size}</b> came</span>
            <button type="button" className="sx-btn sx-btn-primary" disabled={!here.size} onClick={save}><Icon name="check" /> Save attendance</button>
          </div>
        </>
      )}

      {mode === "qr" && (
        <div className="at2-qr">
          <CheckInCard name={booked[0] ?? "Resident name"} />
          <div>
            <p><b>{byQr.size} checked in</b> by card so far.</p>
            <p className="sx-hint">Every resident has a check-in card with their own code, on a lanyard or key ring. Stand at the door and point this phone at each card as they come in: they don’t need a phone. Anyone without their card, tap in.</p>
            <div className="pt-act">
              <button type="button" className="sx-btn sx-btn-primary" onClick={() => setFull(true)}><Icon name="phone" /> Start scanning</button>
              <button type="button" className="sx-btn" onClick={() => setMode("tap")}>Tap in the rest</button>
            </div>
          </div>
        </div>
      )}

      {mode === "photo" && (
        <div className="at-photo">
          <label className="pub-file">
            <input type="file" accept="image/*" capture="environment" onChange={(e) => upload(e.target.files?.[0])} />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="sx-thumb"><img src={photo.url} alt="The sign-in sheet you uploaded" style={{ width: "100%", height: "100%" }} /></span>
            ) : <Icon name="upload" />}
            <span>
              <b>{photo ? photo.name : "Take a photo of the paper sign-in sheet"}</b>
              <span>{reading ? "Reading the names…" : "The names are read for you; check them on the tap list"}</span>
            </span>
          </label>
          {reading && <p className="sx-note" role="status">Reading the names on the sheet…</p>}
        </div>
      )}

      {full && (
        <div className="at2-full at2-scan" role="dialog" aria-modal="true" aria-label={`Scanning cards for ${ev.title}`}>
          <p className="at2-full-t">{ev.title}</p>
          <p className="at2-full-s">Point the camera at a resident’s card</p>
          <div className="at2-viewfinder" aria-hidden="true">
            <CheckInCard key={latest[0] ?? "none"} name={latest[0] ?? booked[0] ?? "Resident name"} className="at2-vf-card" />
          </div>
          <p className="at2-full-n" aria-live="polite"><b>{byQr.size}</b> checked in</p>
          <ul className="at2-full-names">{latest.map((n) => <li key={n}><Icon name="check" /> {n.split(" ")[0]}</li>)}</ul>
          <button type="button" className="sx-btn sx-btn-lg" onClick={() => { setFull(false); setMode("tap"); }} autoFocus>Done</button>
          <Badge tone="neutral">{ev.when} · {ev.place}</Badge>
        </div>
      )}
    </div>
  );
}
