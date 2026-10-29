"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Badge } from "./ui";

type Person = { name: string; consent: boolean };
type Preset = { k: string; src: string; label: string; title: string; caption: string; people: Person[] };

export function PhotoPost({ presets, families }: { presets: Preset[]; families: number }) {
  const [sel, setSel] = useState(presets[0].k);
  const [upload, setUpload] = useState<string | null>(null);
  const p = presets.find((x) => x.k === sel) ?? presets[0];
  const [title, setTitle] = useState(p.title);
  const [caption, setCaption] = useState(p.caption);
  const [dest, setDest] = useState({ news: true, family: true, facebook: true });
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<"edit" | "busy" | "done">("edit");

  useEffect(() => () => { if (upload) URL.revokeObjectURL(upload); }, [upload]);

  const choose = (k: string) => {
    const n = presets.find((x) => x.k === k)!;
    setSel(k); setUpload(null); setTitle(n.title); setCaption(n.caption); setExcluded(new Set()); setStage("edit");
  };
  const people = upload ? [] : p.people;
  const blocked = people.filter((x) => !x.consent && !excluded.has(x.name));
  const src = upload ?? p.src;
  const short = caption.split(/(?<=[.!])\s/)[0];

  return (
    <div className="pp">
      <section className="sx-card">
        <div className="sx-card-body sx-form">
          <p className="sx-lbl" style={{ margin: 0 }}>Choose a photo</p>
          <div className="pp-picks">
            {presets.map((x) => (
              <button key={x.k} type="button" aria-pressed={!upload && sel === x.k} onClick={() => choose(x.k)} aria-label={x.label}>
                <Image src={x.src} alt="" fill sizes="120px" />
              </button>
            ))}
            <label data-on={upload ? "true" : undefined}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUpload(URL.createObjectURL(f));
                  setTitle("A great afternoon at Prairie City Landing");
                  setCaption("Smiles all around this afternoon! Thank you to everyone who joined us.");
                  setStage("edit");
                }}
              />
              <Icon name="upload" />
              From phone
            </label>
          </div>
          <div className="pp-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            {people.length > 0 && (
              <div className="pp-tags" aria-hidden="true">
                {people.filter((x) => !excluded.has(x.name)).map((x) => <span key={x.name} className={x.consent ? "" : "no"}>{x.name}</span>)}
              </div>
            )}
          </div>
          <div className="pp-suggest">
            <b><Icon name="wand" /> Suggested caption</b>
            <span>{p.caption}</span>
            <span><button type="button" className="sx-btn sx-btn-sm" onClick={() => setCaption(p.caption)}>Use this</button></span>
          </div>
          <label>Headline<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>Caption<textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} /></label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="sx-lbl" style={{ marginBottom: 4 }}>Post to</legend>
            <div className="pub-chan">
              <label className="sx-switch"><input type="checkbox" checked={dest.news} onChange={(e) => setDest({ ...dest, news: e.target.checked })} /> Website news</label>
              <label className="sx-switch"><input type="checkbox" checked={dest.family} onChange={(e) => setDest({ ...dest, family: e.target.checked })} /> Family update ({families})</label>
              <label className="sx-switch"><input type="checkbox" checked={dest.facebook} onChange={(e) => setDest({ ...dest, facebook: e.target.checked })} /> Facebook</label>
            </div>
          </fieldset>
        </div>
      </section>

      <div className="sx-grid">
        <section className="sx-card">
          <header className="sx-card-head"><div><h2>Privacy check</h2><p>Faces matched against photo consent on file</p></div>{people.length === 0 ? <Badge tone="neutral">No residents recognized</Badge> : blocked.length ? <Badge tone="bad">{blocked.length} without consent</Badge> : <Badge tone="good"><Icon name="check" /> All clear</Badge>}</header>
          <div className="sx-card-body">
            {people.length === 0 ? (
              <p className="sx-hint" style={{ margin: 0 }}>Tag any residents in this photo so we can check consent before it goes out.</p>
            ) : (
              <ul className="priv">
                {people.map((x) =>
                  excluded.has(x.name) ? (
                    <li key={x.name} className="sx-hint"><Icon name="check" /> {x.name} cropped out of the photo</li>
                  ) : x.consent ? (
                    <li key={x.name} className="y"><Icon name="check" /> {x.name} <span className="sx-hint">photo consent on file</span></li>
                  ) : (
                    <li key={x.name} className="n">
                      <Icon name="alert" /> {x.name}: no photo consent
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setExcluded((s) => new Set(s).add(x.name))}>Crop out</button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </section>

        <div className="prev-grid">
          <div className={`prev ${dest.news ? "" : "off"}`}>
            <div className="prev-h"><Icon name="globe" /> Website news</div>
            <div className="prev-b">
              <div className="news-card">
                <div className="ph">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div className="tx">
                  <small>Events & Adventures · Today</small>
                  <b>{title}</b>
                  <p>{caption}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={`prev ${dest.family ? "" : "off"}`}>
            <div className="prev-h"><Icon name="sms" /> Family text</div>
            <div className="prev-b">
              <div className="pv-phone">
                <div className="pv-phone-scr">
                  <div className="pv-phone-top"><b>Prairie City Landing</b>(916) 458-0303</div>
                  <div className="pv-bubble">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                    PCL: {short} More photos: prairiecitylanding.com/news
                  </div>
                  <div className="pv-meta">To {families} families</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {stage === "done" ? (
          <div className="sx-callout good" role="status">
            <Icon name="check" />
            <p>
              Posted.{dest.news && " Live on the news page."}{dest.family && ` Texted to ${families} families.`}
              {dest.facebook && " Facebook post sent to Cheryl Martin for approval."}
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="sx-btn sx-btn-terra sx-btn-lg"
            disabled={blocked.length > 0 || stage === "busy" || !(dest.news || dest.family || dest.facebook)}
            onClick={() => { setStage("busy"); window.setTimeout(() => setStage("done"), 900); }}
          >
            <Icon name="send" /> {blocked.length ? "Fix the privacy check to post" : stage === "busy" ? "Posting…" : "Post photo"}
          </button>
        )}
      </div>
    </div>
  );
}
