"use client";

// Photo post, as staff use it: on their phone. Take or pick a photo, the faces are checked against photo consent,
// and one tap posts it to the website news page and the family update. Anyone without consent is cropped out,
// or the post goes to the approver, who decides on her own phone.
import Image from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { LockScreen, Phone, SmsThread } from "../phone/Phone";
import { Badge } from "./ui";

import type { PhotoPreset as Preset, StaffData } from "@/data/staff/shared";

type Brand = Pick<StaffData["brand"], "name" | "short" | "phone" | "domain">;
type Stage = "edit" | "busy" | "done" | "routed" | "approved" | "declined";



export function PhotoPost({ presets, families, brand, approver, poster, weekday }: { presets: Preset[]; families: number; brand: Brand; approver: string; poster: string; weekday: string }) {
  const [sel, setSel] = useState(presets[0].k);
  const [upload, setUpload] = useState<string | null>(null);
  const p = presets.find((x) => x.k === sel) ?? presets[0];
  const [title, setTitle] = useState(p.title);
  const [caption, setCaption] = useState(p.caption);
  const [dest, setDest] = useState({ news: true, family: true });
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<Stage>("edit");

  useEffect(() => () => { if (upload) URL.revokeObjectURL(upload); }, [upload]);

  const choose = (k: string) => {
    const n = presets.find((x) => x.k === k)!;
    setSel(k); setUpload(null); setTitle(n.title); setCaption(n.caption); setExcluded(new Set()); setStage("edit");
  };
  const people = upload ? [] : p.people;
  const blocked = people.filter((x) => !x.consent && !excluded.has(x.name));
  const src = upload ?? p.src;
  const short = caption.split(/(?<=[.!])\s/)[0];
  const apFirst = approver.split(" ")[0];
  const posFirst = poster.split(" ")[0];
  const cropAll = () => setExcluded((s) => { const n = new Set(s); blocked.forEach((b) => n.add(b.name)); return n; });
  const post = () => { setStage("busy"); window.setTimeout(() => setStage("done"), 900); };
  const live = stage === "done" || stage === "approved";
  const anyDest = dest.news || dest.family;

  return (
    <div className="pp pp-phone">
      <section className="sx-card">
        <header className="sx-card-head">
          <div>
            <h2>On {posFirst}’s phone</h2>
            <p>Take a photo, check the faces, post. Pick a photo to try it.</p>
          </div>
        </header>
        <div className="sx-card-body sx-form">
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
                  setTitle(`A great afternoon at ${brand.name}`);
                  setCaption("Smiles all around this afternoon! Thank you to everyone who joined us.");
                  setExcluded(new Set());
                  setStage("edit");
                }}
              />
              <Icon name="upload" />
              From phone
            </label>
          </div>

          <div className="pp-stage">
            <Phone time="3:42" label={`Kinlight on ${posFirst}’s phone`}>
              <div className="ph-staff">
                <div className="ph-staff-head">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/brand/dots.png" alt="" />
                  <span>
                    <b>Photo post</b>
                    <small>{brand.name}</small>
                  </span>
                </div>
                <div className="ph-staff-body">
                  <div className="ph-staff-card">
                    <div className="pp-ph-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={title} className="ph-staff-photo" />
                      {excluded.size > 0 && <span className="pp-ph-crop">Cropped</span>}
                    </div>
                    {people.length > 0 ? (
                      <div className="ph-faces" aria-label="Faces in the photo">
                        {people.map((x) =>
                          excluded.has(x.name) ? null : (
                            <span key={x.name} className={`ph-face${x.consent ? "" : " no"}`}>
                              <i aria-hidden="true">{x.consent ? "✓" : "!"}</i>
                              {x.name.split(" ")[0]}
                              <span className="vh">{x.consent ? ": photo consent on file" : ": no photo consent"}</span>
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p>No residents recognized. Tag anyone in the photo so consent can be checked.</p>
                    )}
                  </div>

                  {live ? (
                    <div className="ph-staff-card">
                      <h5>Posted ✓</h5>
                      <p>
                        {dest.news ? "Live on the news page. " : ""}
                        {dest.family ? `Sent to ${families} families. ` : ""}
                        {stage === "approved" ? `${apFirst} approved it with ${excluded.size === 1 ? "one person" : "everyone without consent"} cropped out.` : ""}
                      </p>
                      <button type="button" className="ph-staff-btn ghost" onClick={() => choose(p.k)}>Post another photo</button>
                    </div>
                  ) : stage === "routed" ? (
                    <div className="ph-staff-card">
                      <span className="ph-chip warn">Waiting for {apFirst}</span>
                      <p>Sent to {approver}. You’ll get a notification when she decides.</p>
                    </div>
                  ) : stage === "declined" ? (
                    <div className="ph-staff-card">
                      <span className="ph-chip">Not posted</span>
                      <p>{apFirst} decided not to post this one. Try another photo.</p>
                    </div>
                  ) : blocked.length > 0 ? (
                    <div className="ph-staff-card">
                      <span className="ph-chip warn">{blocked.map((b) => b.name.split(" ")[0]).join(", ")}: no photo consent</span>
                      <p>This photo can’t go out as it is. Crop them out, or let {apFirst} decide.</p>
                      <div className="ph-staff-row">
                        <button type="button" className="ph-staff-btn green" onClick={cropAll}>Crop out</button>
                        <button type="button" className="ph-staff-btn ghost" onClick={() => setStage("routed")}>Ask {apFirst}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ph-staff-card">
                      <h5>{title}</h5>
                      <p>{caption}</p>
                      <div className="ph-staff-row pp-ph-dest">
                        <span className={`ph-chip${dest.news ? " good" : ""}`}>Website news</span>
                        <span className={`ph-chip${dest.family ? " good" : ""}`}>{families} families</span>
                      </div>
                      <button type="button" className="ph-staff-btn" disabled={stage === "busy" || !anyDest} onClick={post}>
                        {stage === "busy" ? "Posting…" : "Post photo"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Phone>
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
            </div>
          </fieldset>
        </div>
      </section>

      <div className="sx-grid">
        <section className="sx-card">
          <header className="sx-card-head">
            <div><h2>Photo consent check</h2><p>Faces matched against photo consent on file</p></div>
            {people.length === 0 ? <Badge tone="neutral">No residents recognized</Badge> : blocked.length ? <Badge tone="bad">{blocked.length} without consent</Badge> : <Badge tone="good"><Icon name="check" /> All clear</Badge>}
          </header>
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
            <p className="sx-note" style={{ marginBottom: 0 }}>Posting is blocked while anyone pictured lacks consent: crop them out, or send it to {approver}, who decides.</p>
          </div>
        </section>

        <section className="sx-card">
          <header className="sx-card-head">
            <div><h2>Approval on the go</h2><p>{approver} gets each request on her phone</p></div>
            {stage === "routed" ? <Badge tone="warn">1 waiting</Badge> : null}
          </header>
          <div className="sx-card-body pp-approve">
            <Phone size="sm" time="3:44" label={`${apFirst}’s phone`}>
              {stage === "routed" ? (
                <div className="ph-staff">
                  <div className="ph-staff-head">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/img/brand/dots.png" alt="" />
                    <span><b>Approvals</b><small>1 waiting</small></span>
                  </div>
                  <div className="ph-staff-body">
                    <div className="ph-staff-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="ph-staff-photo" />
                      <h5>{title}</h5>
                      <p>From {poster} · Photo post</p>
                      <div className="ph-faces">
                        {blocked.map((b) => <span key={b.name} className="ph-face no"><i aria-hidden="true">!</i>{b.name}</span>)}
                      </div>
                      <p>No photo consent on file for {blocked.map((b) => b.name).join(", ")}.</p>
                      <button type="button" className="ph-staff-btn green" onClick={() => { cropAll(); setStage("approved"); }}>Crop out and post</button>
                      <button type="button" className="ph-staff-btn ghost" onClick={() => setStage("declined")}>Don’t post</button>
                    </div>
                  </div>
                </div>
              ) : (
                <LockScreen
                  date={weekday}
                  time="3:44"
                  notices={
                    stage === "approved"
                      ? [{ app: "Kinlight", icon: "#f2a93b", title: "Posted", text: `${title}, with the photo cropped. ${posFirst} has been told.`, time: "now" }]
                      : [{ app: "Kinlight", icon: "#f2a93b", title: "Approvals", text: `Photos needing a decision, pricing and holiday menus arrive here. Approve, crop or send back in one tap.`, time: "" }]
                  }
                />
              )}
            </Phone>
            <p className="sx-hint">
              {stage === "routed"
                ? `${apFirst} sees the photo, who lacks consent, and two choices.`
                : "Approvers get every request on their phone as well as in Approvals, so nothing waits for them to be at a desk."}
            </p>
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
            <div className="prev-h"><Icon name="sms" /> Family update</div>
            <div className="prev-b prev-phone">
              <Phone size="sm" time="3:45" label="The family update on a family member’s phone">
                <SmsThread name={brand.name} sub={brand.phone} initials={brand.short} bubbles={[{ time: "Today 3:45 pm", img: src, text: `${brand.short}: ${short} More photos: ${brand.domain}/news` }]} />
              </Phone>
              <p className="pv-meta">To {families} families</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
