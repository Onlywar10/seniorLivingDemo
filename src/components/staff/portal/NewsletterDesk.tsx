"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { MailMessage, Phone, SmsThread } from "@/components/phone/Phone";
import type { Issue, Reader, Story } from "@/data/staff/newsletter";
import { Badge, Kpi } from "../ui";

const first = (n = "") => n.split(" ")[0];

interface Live extends Story {
  cur: string;
  photoCur?: string;
  removed: boolean;
  /** Who changed it, and what they did. */
  by?: string;
  changes: string[];
  showOrig: boolean;
}

/**
 * The weekly newsletter: what Kinlight wrote and built, what people changed, the three versions, when it sends, the
 * midweek highlight and how last week's issue did. `canApprove`: the approver and the administrator; the front desk
 * reaches it from the Today card and can change it, not approve it.
 */
export function NewsletterDesk({ issue, me, canApprove, viaCard }: { issue: Issue; me: string; canApprove: boolean; viaCard: boolean }) {
  const [tab, setTab] = useState<"draft" | "highlight" | "last">("draft");
  const [stories, setStories] = useState<Live[]>(() =>
    issue.stories.map((s) => ({ ...s, cur: s.changed?.text ?? s.text, photoCur: s.photo, removed: false, by: s.changed ? first(s.changed.by) : undefined, changes: s.changed ? [`rewrote it, ${s.changed.when}`] : [], showOrig: false })),
  );
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null);
  const [swap, setSwap] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [readerId, setReaderId] = useState(issue.readers[0].id);
  const [hl, setHl] = useState(0);
  const [hlBy, setHlBy] = useState<string | null>(null);
  const [fix, setFix] = useState<{ open: boolean; text: string; sent: boolean }>({ open: false, text: "", sent: false });

  const reader = issue.readers.find((r) => r.id === readerId) ?? issue.readers[0];
  const visible = stories.filter((s) => !s.removed);

  const patch = (id: string, fn: (s: Live) => Live) => setStories((xs) => xs.map((s) => (s.id === id ? fn(s) : s)));
  const mark = (s: Live, what: string): Live => ({ ...s, by: me, changes: [...s.changes.filter((c) => !c.startsWith(what)), `${what}, just now`] });
  const move = (id: string, d: -1 | 1) =>
    setStories((xs) => {
      const i = xs.findIndex((s) => s.id === id);
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const out = [...xs];
      [out[i], out[j]] = [out[j], out[i]];
      out[j] = mark(out[j], "moved it");
      return out;
    });
  const yours = stories.reduce((n, s) => n + s.changes.filter((c) => c.endsWith("just now")).length, 0);

  return (
    <div className="nl">
      {/* ------------------------------------------------------------ how the week runs */}
      <ol className="nl-time" aria-label="How this week’s newsletter runs">
        <li className="done"><span className="nl-step"><Icon name="check" /></span><b>Thursday</b><small>{issue.timeline.built}: Kinlight built the draft</small></li>
        <li className={approved ? "done" : "now"}><span className="nl-step">{approved ? <Icon name="check" /> : "2"}</span><b>Friday</b><small>{issue.timeline.card}: ready to review, on {issue.approverFirst}’s Today</small></li>
        <li className={approved ? "now" : ""}><span className="nl-step">3</span><b>Sunday, 5 pm</b><small>{issue.timeline.sends}: it sends, and can’t be edited after</small></li>
        <li><span className="nl-step">4</span><b>After sending</b><small>Families reached, opens, top stories and replies</small></li>
      </ol>

      {viaCard && (
        <div className="sx-callout info" role="note"><Icon name="info" /><p>You opened this from the Today card. You can change any part until it sends; {issue.approverFirst} says when it looks good.</p></div>
      )}

      <div className="sx-tabs" role="tablist" aria-label="Newsletter">
        <button role="tab" aria-selected={tab === "draft"} onClick={() => setTab("draft")}><Icon name="mail" /> This week’s newsletter</button>
        <button role="tab" aria-selected={tab === "highlight"} onClick={() => setTab("highlight")}><Icon name="sms" /> Midweek highlight</button>
        <button role="tab" aria-selected={tab === "last"} onClick={() => setTab("last")}><Icon name="chart" /> Last week’s results</button>
      </div>

      {tab === "draft" && (
        <div className="nl-grid">
          <div className="nl-main">
            {/* approve */}
            <section className={`sx-card nl-approve${approved ? " ok" : ""}`} aria-live="polite">
              <div className="sx-card-body">
                {approved ? (
                  <p className="nl-approved"><Icon name="check" /> <span><b>Approved by {me}.</b> It sends {issue.timeline.sendsShort} to every family, resident and subscriber. Changes can still be made until then.</span></p>
                ) : (
                  <>
                    <div>
                      <h2>{issue.subject}</h2>
                      <p>The week of {issue.weekLabel}. Sends {issue.timeline.sendsShort}.{yours > 0 && <> You’ve made {yours} {yours === 1 ? "change" : "changes"}.</>}</p>
                    </div>
                    {canApprove ? (
                      <button type="button" className="sx-btn sx-btn-primary sx-btn-lg" onClick={() => setApproved(true)}><Icon name="check" /> Looks good</button>
                    ) : (
                      <p className="sx-note" style={{ margin: 0 }}>Waiting for {issue.approverFirst} to say it looks good.</p>
                    )}
                  </>
                )}
              </div>
            </section>

            <p className="nl-used"><Icon name="sparkle" /> <span>Kinlight wrote it from this week’s {issue.used.events} events and {issue.used.photos} photos, next week’s {issue.used.next} events, {issue.used.family} family {issue.used.family === 1 ? "event" : "events"} to RSVP to, and next week’s menus. Nothing else.{issue.leftOut > 0 && <> {issue.leftOut} {issue.leftOut === 1 ? "photo was" : "photos were"} left out: someone in {issue.leftOut === 1 ? "it has" : "them has"} no photo consent on file.</>}</span></p>

            <ol className="nl-stories">
              {stories.map((s, i) => (
                <li key={s.id} className={`nl-story${s.removed ? " gone" : ""}`}>
                  {s.removed ? (
                    <p className="nl-gone"><span>Removed: <b>{s.title}</b></span><button type="button" className="sx-btn sx-btn-sm" onClick={() => patch(s.id, (x) => ({ ...x, removed: false, changes: x.changes.filter((c) => !c.startsWith("removed")) }))}>Put it back</button></p>
                  ) : (
                    <>
                      <div className="nl-story-h">
                        {s.photoCur && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.photoCur} alt="" className="nl-thumb" />
                        )}
                        <div>
                          <h3>{s.title}</h3>
                          <p className="nl-src"><Icon name={s.kind === "photos" ? "image" : s.kind === "menu" ? "fork" : "calendar"} /> {s.source}</p>
                        </div>
                        {s.by ? <Badge tone="accent"><Icon name="edit" /> Changed by {s.by}</Badge> : <Badge tone="info"><Icon name="sparkle" /> Kinlight wrote this</Badge>}
                      </div>

                      {edit?.id === s.id ? (
                        <form className="sx-form nl-edit" onSubmit={(e) => { e.preventDefault(); const text = edit.text.trim(); if (text) patch(s.id, (x) => mark({ ...x, cur: text }, "rewrote it")); setEdit(null); }}>
                          <label><span className="vh">Rewrite {s.title}</span><textarea value={edit.text} onChange={(e) => setEdit({ id: s.id, text: e.target.value })} rows={4} /></label>
                          <p className="pt-act"><button type="submit" className="sx-btn sx-btn-primary sx-btn-sm"><Icon name="check" /> Save</button><button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(null)}>Cancel</button></p>
                        </form>
                      ) : (
                        <p className="nl-text">{s.cur}</p>
                      )}
                      {s.items && s.items.length > 0 && (
                        <ul className="nl-items">
                          {s.items.map((it) => <li key={it.title + it.when}><b>{it.title}</b><span>{it.when}{it.place ? ` · ${it.place}` : ""}</span>{it.kind !== "resident" && <Badge tone={it.kind === "public" ? "accent" : "info"}>{it.kind === "public" ? "Public" : "Family"}</Badge>}</li>)}
                        </ul>
                      )}

                      {s.by && (
                        <div className="nl-changed">
                          <span>{s.by} {s.changes.join("; ")}.</span>
                          {s.cur !== s.text && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-expanded={s.showOrig} onClick={() => patch(s.id, (x) => ({ ...x, showOrig: !x.showOrig }))}>{s.showOrig ? "Hide" : "See"} what Kinlight wrote</button>}
                          {s.showOrig && s.cur !== s.text && (
                            <div className="nl-orig">
                              <small>Kinlight wrote</small>
                              <p>{s.text}</p>
                              <button type="button" className="sx-btn sx-btn-sm" onClick={() => patch(s.id, (x) => ({ ...x, cur: x.text, showOrig: false, by: x.photoCur !== x.photo ? me : undefined, changes: x.photoCur !== x.photo ? x.changes.filter((c) => !c.startsWith("rewrote")) : [] }))}>Use Kinlight’s version</button>
                            </div>
                          )}
                        </div>
                      )}

                      {swap === s.id && (
                        <div className="nl-swap" role="group" aria-label="Choose a photo">
                          {s.photos.map((p) => (
                            <button key={p} type="button" aria-pressed={s.photoCur === p} onClick={() => { patch(s.id, (x) => mark({ ...x, photoCur: p }, "swapped the photo")); setSwap(null); }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p} alt="" />
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="nl-where">{s.public ? "In every version: family, resident and public." : "Family and resident versions only."}{s.publicNote && <> {s.publicNote}</>}</p>

                      <div className="nl-acts">
                        <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit({ id: s.id, text: s.cur })}><Icon name="edit" /> Rewrite</button>
                        {s.photos.length > 1 && <button type="button" className="sx-btn sx-btn-sm" aria-expanded={swap === s.id} onClick={() => setSwap(swap === s.id ? null : s.id)}><Icon name="image" /> Swap photo</button>}
                        <button type="button" className="sx-btn sx-btn-sm" disabled={i === 0} onClick={() => move(s.id, -1)} aria-label={`Move ${s.title} up`}>↑</button>
                        <button type="button" className="sx-btn sx-btn-sm" disabled={i === stories.length - 1} onClick={() => move(s.id, 1)} aria-label={`Move ${s.title} down`}>↓</button>
                        <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => patch(s.id, (x) => ({ ...mark(x, "removed it"), removed: true }))}><Icon name="x" /> Remove</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* ------------------------------------------------------------ preview as */}
          <aside className="nl-side" aria-label="Preview">
            <section className="sx-card">
              <header className="sx-card-head">
                <div>
                  <h2>Preview as</h2>
                  <p>One newsletter, three versions, all automatic.</p>
                </div>
              </header>
              <div className="sx-card-body nl-prev">
                <div className="nl-who" role="radiogroup" aria-label="Preview as">
                  {issue.readers.map((r) => (
                    <button key={r.id} type="button" role="radio" aria-checked={r.id === readerId} onClick={() => setReaderId(r.id)}>
                      <b>{r.kind === "public" ? "A prospect" : r.name}</b>
                      <small>{r.kind === "public" ? `${r.name}, public version` : `${r.label} · ${r.kind === "resident" ? "resident" : "family"} version`}</small>
                    </button>
                  ))}
                </div>
                <Phone size="sm" label={`The newsletter as ${reader.name} sees it`}>
                  <MailMessage from={issue.from} address={`news@${issue.domain}`} to={reader.kind === "public" ? "Community news" : reader.to} subject={issue.subject} time="Sun 5:00 PM">
                    <EmailBody issue={issue} reader={reader} stories={visible} />
                  </MailMessage>
                </Phone>
                {reader.kind === "family" && reader.shares && <p className="nl-why good"><Icon name="heart" /> <span><b>Personal section:</b> only in this family’s email. {first(reader.resident)}’s photos and outings, because {first(reader.resident)} shares their week with family.</span></p>}
                {reader.note && <p className="nl-why"><Icon name="info" /> <span>{reader.note}</span></p>}
              </div>
            </section>
          </aside>
        </div>
      )}

      {tab === "highlight" && (
        <div className="nl-grid">
          <section className="sx-card">
            <header className="sx-card-head">
              <div>
                <h2>The midweek highlight</h2>
                <p>One photo and a line by text, {issue.highlight.sends}, to {issue.highlight.reach} family members.</p>
              </div>
              {hlBy ? <Badge tone="accent"><Icon name="edit" /> Swapped by {hlBy}</Badge> : <Badge tone="info"><Icon name="sparkle" /> Picked by Kinlight</Badge>}
            </header>
            <div className="sx-card-body">
              {issue.highlight.picks.length === 0 ? (
                <p className="sx-note" style={{ marginTop: 0 }}>No photos added this week yet. Kinlight picks the best one as they come in.</p>
              ) : (
                <>
                  <p style={{ marginTop: 0 }}>Kinlight picks the week’s best photo, from an event where everyone in the photos has consent on file. Swap it for another if you like; the text is rewritten to match.</p>
                  <ul className="nl-picks">
                    {issue.highlight.picks.map((p, i) => (
                      <li key={p.id}>
                        <button type="button" aria-pressed={hl === i} onClick={() => { setHl(i); setHlBy(i === 0 ? null : me); }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.src} alt="" />
                          <span><b>{p.title}</b><small>{p.source}</small></span>
                          {i === 0 && <Badge tone="info">Best this week</Badge>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
          {issue.highlight.picks[hl] && (
            <aside className="nl-side">
              <Phone size="sm" label="The midweek highlight on a family member’s phone">
                <SmsThread name={issue.community} sub="Text message" initials={issue.community.split(" ").map((w) => w[0]).join("")} bubbles={[{ img: issue.highlight.picks[hl].src, text: issue.highlight.picks[hl].text, time: issue.highlight.sends.replace(/, (\d)/, " · $1") }]} />
              </Phone>
            </aside>
          )}
        </div>
      )}

      {tab === "last" && (
        <div className="nl-last">
          <section className="sx-card nl-locked">
            <div className="sx-card-body">
              <p className="nl-lock"><Icon name="lock" /> <span><b>{issue.last.subject}</b> · sent {issue.last.sent}. A sent newsletter can’t be changed; a correction can be sent.</span></p>
              {fix.sent ? (
                <div className="sx-callout good" role="status"><Icon name="check" /><p>Correction sent to the {issue.last.reached} families who got it, and the web version updated.</p></div>
              ) : fix.open ? (
                <form className="sx-form" onSubmit={(e) => { e.preventDefault(); if (fix.text.trim()) setFix({ ...fix, sent: true }); }}>
                  <label>What needs correcting<textarea value={fix.text} onChange={(e) => setFix({ ...fix, text: e.target.value })} placeholder="The orchard trip leaves at 9:30, not 9:00." /></label>
                  <p className="pt-act"><button type="submit" className="sx-btn sx-btn-primary" disabled={!fix.text.trim()}><Icon name="send" /> Send the correction</button><button type="button" className="sx-btn" onClick={() => setFix({ open: false, text: "", sent: false })}>Cancel</button></p>
                </form>
              ) : (
                <button type="button" className="sx-btn" onClick={() => setFix({ ...fix, open: true })}><Icon name="edit" /> Send a correction</button>
              )}
            </div>
          </section>
          <div className="sx-kpis">
            <Kpi label="Families reached" value={`${issue.last.reached} of ${issue.last.families}`} />
            <Kpi label="Opened" value={`${issue.last.openRate}%`} note={`${issue.last.opened} families`} />
            <Kpi label="Replies" value={issue.last.repliesTotal} note="each to the right person" />
            {issue.last.versions.map((v) => <Kpi key={v.k} label={`${v.k} version`} value={v.n} note="sent" />)}
          </div>
          <div className="sx-grid g-2">
            <section className="sx-card">
              <header className="sx-card-head"><div><h2>Top stories</h2><p>Families who opened each one</p></div></header>
              <div className="sx-card-body">
                <ol className="nl-top">
                  {issue.last.top.map((t) => (
                    <li key={t.title}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.src} alt="" />
                      <b>{t.title}</b>
                      <span>{t.opens}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
            <section className="sx-card">
              <header className="sx-card-head"><div><h2>Replies</h2><p>Thank-yous go to the person named; questions go to the right person.</p></div></header>
              <div className="sx-card-body">
                <ul className="sx-list nl-replies">
                  {issue.last.replies.map((r) => (
                    <li key={r.from}><p className="pt-quote">“{r.text}”</p><small>{r.from}, {r.relation.toLowerCase()} · {r.did}</small></li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/** The email itself, as one reader gets it. Public: no names, no family events, nothing personal. */
function EmailBody({ issue, reader, stories }: { issue: Issue; reader: Reader; stories: Live[] }) {
  const pub = reader.kind === "public";
  const shown = stories.filter((s) => !pub || s.public);
  const p = reader.personal;
  const res = first(reader.resident);
  return (
    <div className="ph-em nl-em">
      <div className="ph-em-banner">{issue.community}</div>
      <p className="ph-em-p">{pub ? `${issue.hello} Here’s the week at ${issue.community}.` : `Hi ${first(reader.name)}, ${issue.hello.replace(/^Hello/, "hello")} Here’s the week at ${issue.community}.`}</p>

      {reader.kind === "family" && reader.shares && p && (
        <div className="nl-em-me">
          <p className="ph-em-h">{res}’s week</p>
          {p.photos.map((x) => (
            <div key={x.title} className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.src} alt="" />
              <span><b>{res} is in the photos from {x.title}</b><small>{x.when}</small></span>
            </div>
          ))}
          {p.outings.map((x) => <p key={x.title} className="ph-em-p">Booked for <b>{x.title}</b>, {x.when}.</p>)}
          {p.waitlist.map((x) => <p key={x.title} className="ph-em-p">On the waitlist for <b>{x.title}</b>, {x.when}. We’ll text if a seat opens.</p>)}
          {p.photos.length + p.outings.length + p.waitlist.length === 0 && <p className="ph-em-p">No photos or bookings for {res} this week.</p>}
        </div>
      )}
      {reader.kind === "resident" && p && (
        <div className="nl-em-me">
          <p className="ph-em-h">Your bookings next week</p>
          {p.outings.map((x) => <p key={x.title} className="ph-em-p"><b>{x.title}</b>, {x.when}</p>)}
          {p.waitlist.map((x) => <p key={x.title} className="ph-em-p">Waitlist: <b>{x.title}</b>, {x.when}</p>)}
          {p.outings.length + p.waitlist.length === 0 && <p className="ph-em-p">Nothing booked yet. Ask at the front desk, or reply YES to an invite.</p>}
        </div>
      )}

      {shown.map((s) => (
        <div key={s.id}>
          <p className="ph-em-h">{s.title}</p>
          {s.photoCur && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoCur} alt="" className="ph-em-photo" />
          )}
          <p className="ph-em-p">{s.cur}</p>
          {s.items && s.kind !== "brief" && (
            <ul className="nl-em-list">
              {s.items.filter((it) => !pub || it.kind !== "family").map((it) => <li key={it.title + it.when}><b>{it.title}</b> · {it.when}</li>)}
            </ul>
          )}
        </div>
      ))}
      <div className="ph-em-foot">
        {pub ? `You subscribed to community news at ${issue.domain}. Unsubscribe any time.` : reader.kind === "family" ? `You get this as ${res}’s family. Reply to reach the team.` : "Reply to reach the team, or stop by the front desk."}
      </div>
    </div>
  );
}
