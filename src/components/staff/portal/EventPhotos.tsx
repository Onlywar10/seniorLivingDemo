"use client";

// The Photos area of an event, shown when editing it. Attach or take photos; Kinlight writes the caption and sends
// them to the gallery and the newsletter. Photos showing residents go to the
// approver first unless you are the approver. Shown in this browser only.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PhotoKit } from "@/data/staff/post";
import { Icon } from "../../Icon";
import { Auto, Help } from "./Help";

export interface PhotoEvent { id: string; title: string; date: string; room: string; lantern?: boolean; photos?: string[]; wanted?: number; came?: string[] }



export function EventPhotos({ e, kit, todayIso, focus = false, onPosted }: { e: PhotoEvent; kit: PhotoKit; todayIso: string; focus?: boolean; onPosted: (srcs: string[], waiting: boolean) => void }) {
  const [shots, setShots] = useState<Set<string>>(() => new Set(kit.presets.slice(0, 2).map((p) => p.k)));
  const [uploads, setUploads] = useState<{ url: string; name: string }[]>([]);
  const [done, setDone] = useState<{ n: number; waiting: boolean; families: number } | null>(null);
  const made = useRef<string[]>([]);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => () => made.current.forEach((u) => URL.revokeObjectURL(u)), []);
  useEffect(() => {
    if (!focus) return;
    const id = window.setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return () => window.clearTimeout(id);
  }, [focus]);

  const have = e.photos?.length ?? 0;
  const wanted = e.wanted ?? 0;
  const future = e.date > todayIso;

  const chosen = shots.size + uploads.length;
  const nPhotos = chosen;
  // Photos may show residents, so they go to the approver first unless you are the approver.
  const approval = !kit.isApprover;

  const post = () => {
    if (!nPhotos) return;
    const srcs = [...kit.presets.filter((p) => shots.has(p.k)).map((p) => p.src), ...uploads.map((u) => u.url)].slice(0, nPhotos);
    setDone({ n: nPhotos, waiting: approval, families: 0 });
    onPosted(srcs, approval);
    setShots(new Set());
    setUploads([]);
  };

  return (
    <section className="pt-ev-sec pc-photos-sec" id="pc-photos" ref={ref}>
      <h3>
        Photos
        {wanted > 0 && <span className="po-tag">Photos wanted: {wanted}</span>}
        <Help label="How photos work" align="end">
          <p>Kinlight writes the caption from the event. Photo consent is checked before anything is published.</p>
          {!kit.isApprover && <p>Photos showing residents go to {kit.approver.first} first.</p>}
        </Help>
      </h3>
      {have > 0 && (
        <>
          <div className="pc-photos">{e.photos!.map((src, i) => <Thumb key={src + i} src={src} />)}</div>
          {wanted > 0 && <p className="sx-hint">{have} of {wanted} wanted</p>}
        </>
      )}
      {done && (
        <p className={`pc-posted${done.waiting ? " wait" : ""}`} role="status">
          <Icon name={done.waiting ? "clock" : "check"} />
          {done.waiting ? `${done.n} sent to ${kit.approver.first} · Approval needed` : `${done.n} posted · gallery, newsletter${done.families ? `, ${done.families} famil${done.families === 1 ? "y" : "ies"}` : ""}`}
        </p>
      )}
      {future ? (
        <p className="sx-hint">Add them once it starts.</p>
      ) : (
        <form className="pc-photo-form sx-form" onSubmit={(ev) => { ev.preventDefault(); post(); }} aria-label={`Photos from ${e.title}`}>
          <div className="pt-shots" role="group" aria-label="Choose photos">
            {kit.presets.map((x) => (
              <button key={x.k} type="button" aria-pressed={shots.has(x.k)} onClick={() => setShots((s) => { const n = new Set(s); if (n.has(x.k)) n.delete(x.k); else n.add(x.k); return n; })} aria-label={x.label}>
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
              <input type="file" accept="image/*" multiple onChange={(ev) => { const fs = [...(ev.target.files ?? [])]; const add = fs.map((f) => ({ url: URL.createObjectURL(f), name: f.name })); made.current.push(...add.map((x) => x.url)); setUploads((xs) => [...xs, ...add]); }} />
              <Icon name="upload" /> Take or choose
            </label>
          </div>

          {chosen > 0 && (
            <>
              <div className="pt-submit pc-photo-post">
                <Auto summary="Gallery and newsletter">
                  <ul>
                    <li>The {e.title} gallery on the website{e.lantern ? ", first names only" : ""}.</li>
                    <li>The newsletter on {kit.newsletter}.</li>
                  </ul>
                </Auto>
                <button type="submit" className="sx-btn sx-btn-primary" disabled={nPhotos === 0}>
                  <Icon name="send" /> {approval ? `Send to ${kit.approver.first}` : `Post ${nPhotos} photo${nPhotos === 1 ? "" : "s"}`}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </section>
  );
}

/** A posted photo: a file from the camera roll (shown as it is) or one of the community's own. */
function Thumb({ src }: { src: string }) {
  if (!src.startsWith("blob:")) return <span><Image src={src} alt="" fill sizes="100px" /></span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <span><img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /></span>;
}
