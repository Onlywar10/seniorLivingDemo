"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import "@/components/phone/phone.css";
import { Icon } from "@/components/Icon";
import type { Addable, Issue, Reader, Story } from "@/data/staff/newsletter";
import { say } from "../store";
import { Badge, Kpi } from "../ui";
import { Help } from "./Help";

const first = (n = "") => n.split(" ")[0];

interface Live extends Story {
  cur: string;
  photoCur?: string;
  removed: boolean;
  /** Who changed it, and what they did. */
  by?: string;
  changes: string[];
  showOrig: boolean;
  /** Added by a person from an event; Kinlight wrote it. */
  addedBy?: string;
}

/**
 * The weekly newsletter: how last week's did (one line at the top), what Kinlight wrote and built, what people changed,
 * the versions and when it sends. `canApprove`: the approver and the administrator; the
 * front desk reaches it from the Today card and can change it, not approve it.
 */
export function NewsletterDesk({ issue, me, canApprove, viaCard }: { issue: Issue; me: string; canApprove: boolean; viaCard: boolean }) {
  const [stories, setStories] = useState<Live[]>(() =>
    issue.stories.map((s) => ({ ...s, cur: s.changed?.text ?? s.text, photoCur: s.photo, removed: false, by: s.changed ? first(s.changed.by) : undefined, changes: s.changed ? [`rewrote it, ${s.changed.when}`] : [], showOrig: false })),
  );
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null);
  const [swap, setSwap] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [version, setVersion] = useState<"family" | "public">("family");
  const [showLast, setShowLast] = useState(false);
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);

  // Two versions to preview, with no names: families and residents (with the personal section each family gets), and
  // the public one for prospects and community-news subscribers.
  const famReader = issue.readers.find((r) => r.kind === "family" && r.shares && r.personal) ?? issue.readers.find((r) => r.kind === "family") ?? issue.readers[0];
  const pubReader = issue.readers.find((r) => r.kind === "public") ?? issue.readers[issue.readers.length - 1];
  const reader = version === "family" ? famReader : pubReader;
  const visible = stories.filter((s) => !s.removed);
  const building = issue.timeline.stage === "building";

  const patch = (id: string, fn: (s: Live) => Live) => setStories((xs) => xs.map((s) => (s.id === id ? fn(s) : s)));
  const mark = (s: Live, what: string): Live => ({ ...s, by: me, changes: [...s.changes.filter((c) => !c.startsWith(what)), `${what}, just now`] });
  /** Change a story, confirm it, and offer Undo (back to exactly how it was). */
  const change = (id: string, fn: (s: Live) => Live, text: string) => {
    const before = stories.find((s) => s.id === id);
    patch(id, fn);
    if (before) say(text, () => patch(id, () => before));
  };
  const move = (id: string, d: -1 | 1) => {
    const before = stories;
    setStories((xs) => {
      const i = xs.findIndex((s) => s.id === id);
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const out = [...xs];
      [out[i], out[j]] = [out[j], out[i]];
      out[j] = mark(out[j], "moved it");
      return out;
    });
    say(d < 0 ? "Moved up" : "Moved down", () => setStories(before));
  };
  // Drag a section by its handle (mouse, touch or pen). The card follows the pointer and the others slide out of its
  // way; on release it glides into its new place. Near the top or bottom of the screen the page scrolls by itself,
  // faster the closer you get to the edge. Positions are kept in page terms, so scrolling doesn't throw them off.
  type Box = { id: string; top: number; h: number };
  type Drag = { id: string; y0: number; dy: number; from: number; to: number; boxes: Box[]; settling?: boolean };
  const GAP = 12;
  const [drag, setDragState] = useState<Drag | null>(null);
  const [noAnim, setNoAnim] = useState(false);
  // The latest drag, read on drop (a move and the drop can land before React re-renders).
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (d: Drag | null) => { dragRef.current = d; setDragState(d); };
  const listRef = useRef<HTMLOListElement>(null);
  const pointerY = useRef(0);
  const scrollLoop = useRef(0);
  const lastTick = useRef(0);
  /** What scrolls: the nearest scrolling ancestor of the list, or the page. */
  const scroller = (): { el: Element; top: () => number; by: (n: number) => void; view: () => { top: number; bottom: number } } => {
    for (let el = listRef.current?.parentElement; el; el = el.parentElement) {
      const o = getComputedStyle(el).overflowY;
      if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight) {
        const box = el;
        return { el: box, top: () => box.scrollTop, by: (n) => box.scrollBy({ top: n, behavior: "instant" }), view: () => { const r = box.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; } };
      }
    }
    const doc = document.scrollingElement ?? document.documentElement;
    return { el: doc, top: () => window.scrollY, by: (n) => window.scrollBy({ top: n, behavior: "instant" }), view: () => ({ top: 0, bottom: window.innerHeight }) };
  };
  /** Work out where the dragged section is, from the pointer and how far the page has scrolled. */
  const place = () => {
    const d = dragRef.current;
    if (!d || d.settling) return;
    const dy = pointerY.current + scroller().top() - d.y0;
    const me = d.boxes[d.from];
    const center = me.top + me.h / 2 + dy;
    // Its new place: after every other section whose middle it has passed.
    const to = d.boxes.filter((b, i) => i !== d.from && b.top + b.h / 2 < center).length;
    if (dy !== d.dy || to !== d.to) setDrag({ ...d, dy, to });
  };
  /** Each frame while dragging: scroll if the pointer is near an edge, then re-place the section. */
  const tick = (now: number) => {
    if (!dragRef.current || dragRef.current.settling) { scrollLoop.current = 0; return; }
    const sc = scroller();
    const v = sc.view();
    const EDGE = 90;
    const y = pointerY.current;
    // Up to about 1,100 pixels a second at the very edge, by time rather than frames.
    const dt = Math.min(100, now - (lastTick.current || now));
    lastTick.current = now;
    const depth = y < v.top + EDGE ? -(v.top + EDGE - y) / EDGE : y > v.bottom - EDGE ? (y - (v.bottom - EDGE)) / EDGE : 0;
    const speed = Math.round(Math.max(-1, Math.min(1, depth)) * 1.1 * dt);
    if (speed) sc.by(speed);
    place();
    scrollLoop.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(scrollLoop.current), []);
  const startDrag = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    if (dragRef.current) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* a pointer that can't be captured still drags */ }
    const st = scroller().top();
    const boxes = ([...(listRef.current?.children ?? [])] as HTMLElement[]).map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.id ?? "", top: r.top + st, h: r.height };
    });
    const from = boxes.findIndex((b) => b.id === id);
    pointerY.current = e.clientY;
    setDrag({ id, y0: e.clientY + st, dy: 0, from, to: from, boxes });
    cancelAnimationFrame(scrollLoop.current);
    lastTick.current = 0;
    scrollLoop.current = requestAnimationFrame(tick);
  };
  const dragMove = (e: React.PointerEvent) => {
    pointerY.current = e.clientY;
    place();
  };
  /** How far another section slides to make room. */
  const shiftOf = (i: number) => {
    if (!drag || i === drag.from) return 0;
    const room = drag.boxes[drag.from].h + GAP;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -room;
    if (drag.to < drag.from && i >= drag.to && i < drag.from) return room;
    return 0;
  };
  const drop = (e?: React.PointerEvent) => {
    if (e) dragMove(e);
    cancelAnimationFrame(scrollLoop.current);
    const d = dragRef.current;
    if (!d || d.settling) return;
    if (d.to === d.from) {
      setDrag({ ...d, dy: 0, settling: true });
      window.setTimeout(() => setDrag(null), 200);
      return;
    }
    // Glide into the slot, then commit the new order without animating the reset.
    const span = d.from < d.to ? d.boxes.slice(d.from + 1, d.to + 1) : d.boxes.slice(d.to, d.from);
    const dist = span.reduce((n, b) => n + b.h + GAP, 0) * (d.from < d.to ? 1 : -1);
    setDrag({ ...d, dy: dist, settling: true });
    window.setTimeout(() => {
      const before = stories;
      const moving = stories[d.from];
      const rest = stories.filter((_, k) => k !== d.from);
      const out = [...rest.slice(0, d.to), mark(moving, "moved it"), ...rest.slice(d.to)];
      setNoAnim(true);
      setStories(out);
      setDrag(null);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoAnim(false)));
      say(`Moved “${moving.title}”`, () => setStories(before));
    }, 220);
  };
  const approve = () => {
    setApproved(true);
    say(`Approved · sends ${issue.timeline.sendsShort}`, () => setApproved(false));
  };
  /** Add a section Kinlight drafted from an event: before "Just for fun" if it's last, otherwise at the end. */
  const addSection = (a: Addable, thenEdit: boolean) => {
    const before = stories;
    const live: Live = { ...a.story, cur: a.story.text, photoCur: a.story.photo, removed: false, changes: [], showOrig: false, addedBy: me };
    setStories((xs) => {
      const i = xs[xs.length - 1]?.kind === "teaser" ? xs.length - 1 : xs.length;
      return [...xs.slice(0, i), live, ...xs.slice(i)];
    });
    setAdding(false);
    setFresh(live.id);
    if (thenEdit) setEdit({ id: live.id, text: live.cur });
    say(`Added “${live.title}”`, () => setStories(before));
    window.setTimeout(() => document.getElementById(`nl-s-${live.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };
  const taken = new Set(stories.map((s) => s.id));
  const yours = stories.reduce((n, s) => n + s.changes.filter((c) => c.endsWith("just now")).length, 0);

  return (
    <div className="nl">
      {/* ------------------------------------------------------------ how the week runs */}
      <div className="nl-timebar">
        <ol className="nl-time" aria-label="This week’s newsletter">
          {building ? (
            <>
              <li className="now">Draft so far · builds {issue.timeline.built}</li>
              <li>Ready to review {issue.timeline.card}</li>
              <li>Sends {issue.timeline.sends}</li>
            </>
          ) : (
            <>
              <li className="done"><Icon name="check" /> Built {issue.timeline.built}</li>
              <li className={approved ? "done" : "now"}>{approved ? <Icon name="check" /> : null} {approved ? "Approved" : "Ready to review"}</li>
              <li>Sends {issue.timeline.sends}</li>
            </>
          )}
        </ol>
        <Help label="How a week runs" align="end">
          <ul>
            <li>A week is Sunday to Saturday. Until Thursday, this is the draft so far: it fills in as photos and attendance come in.</li>
            <li>Thursday: Kinlight builds and writes it from the week’s events, photos and menus, using only those facts.</li>
            <li>Friday: it’s ready to review on {issue.approverFirst}’s Today. Anyone allowed can change any part.</li>
            <li>Sunday, 5 pm: it sends. After that it can’t be edited; only a correction can be sent.</li>
          </ul>
          {viaCard && <p>You opened this from your Today card: you can change any part until it sends; {issue.approverFirst} approves it.</p>}
        </Help>
      </div>

      {/* ------------------------------------------------------------ last week, in one line */}
      <div className="nl-lastline">
        <Icon name="chart" />
        <span>Last week’s issue: opened by <b>{issue.last.openRate}%</b> of families ({issue.last.opened} of {issue.last.reached}) · sent {issue.last.sent}</span>
        <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-expanded={showLast} onClick={() => setShowLast((x) => !x)}>{showLast ? "Hide" : "Details"}</button>
      </div>
      {showLast && <LastWeek issue={issue} />}

      <div className="nl-grid">
        <div className="nl-main">
          {/* approve */}
          <section className={`sx-card nl-approve${approved ? " ok" : ""}`} aria-live="polite">
            <div className="sx-card-body">
              {approved ? (
                <p className="nl-approved"><Icon name="check" /> <span><b>Approved by {me}.</b> Sends {issue.timeline.sendsShort}. Still editable until then.</span></p>
              ) : (
                <>
                  <div>
                    <h2>{issue.subject}</h2>
                    <p>{building ? `The draft so far · builds ${issue.timeline.built}, ready to review ${issue.timeline.card}` : `The week of ${issue.weekLabel}`} · sends {issue.timeline.sendsShort}{yours > 0 && <> · {yours} {yours === 1 ? "change" : "changes"} by you</>}</p>
                  </div>
                  {building ? (
                    <Badge tone="neutral">Still being written</Badge>
                  ) : canApprove ? (
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-lg" onClick={approve}><Icon name="check" /> Looks good</button>
                  ) : (
                    <Badge tone="warn">Approval: {issue.approverFirst}</Badge>
                  )}
                </>
              )}
            </div>
          </section>

          <div className="nl-used">
            <Icon name="sparkle" />
            <span>{visible.length} {visible.length === 1 ? "story" : "stories"} · {issue.used.activities} activities so far · {issue.used.photos} photos from {issue.used.photoEvents} {issue.used.photoEvents === 1 ? "event" : "events"}</span>
            <Help label="What Kinlight wrote it from" align="end">
              <p>Kinlight wrote it only from this week’s {issue.used.activities} activities so far, {issue.used.photos} photos from {issue.used.photoEvents} {issue.used.photoEvents === 1 ? "event" : "events"}, next week’s {issue.used.next} events, {issue.used.family} family {issue.used.family === 1 ? "event" : "events"} to RSVP to, and next week’s menus. Nothing else.</p>
              {issue.leftOut > 0 && <p>{issue.leftOut} {issue.leftOut === 1 ? "photo was" : "photos were"} left out: someone in {issue.leftOut === 1 ? "it has" : "them has"} no photo consent on file.</p>}
            </Help>
          </div>


          <p className="nl-legend" aria-label="Who sees each section">
            <span className="nl-tag pub"><Icon name="globe" /> Public</span> in every version, including prospects and subscribers
            <span className="nl-tag fam"><Icon name="lock" /> Family</span> families and residents only
          </p>

          <ol className={`nl-stories${drag ? " is-dragging" : ""}${noAnim ? " no-anim" : ""}`} ref={listRef} aria-label="Stories (drag the handle to rearrange)">
            {stories.map((s, i) => (
              <li
                key={s.id}
                id={`nl-s-${s.id}`}
                className={`nl-story ${s.public ? "pub" : "fam"}${s.removed ? " gone" : ""}${fresh === s.id ? " fresh" : ""}${drag?.id === s.id ? ` dragging${drag.settling ? " settling" : ""}` : ""}`}
                data-id={s.id}
                style={drag ? { transform: `translateY(${drag.id === s.id ? drag.dy : shiftOf(i)}px)` } : undefined}
              >
                {!s.removed && (
                  <span
                    className="nl-grip"
                    title="Drag to move"
                    aria-hidden="true"
                    onPointerDown={(e) => startDrag(e, s.id)}
                    onPointerMove={dragMove}
                    onPointerUp={(e) => drop(e)}
                    onPointerCancel={() => { if (dragRef.current) { setDrag({ ...dragRef.current, to: dragRef.current.from }); drop(); } }}
                  >
                    <svg viewBox="0 0 10 16" width="10" height="16"><circle cx="2.5" cy="3" r="1.4" /><circle cx="7.5" cy="3" r="1.4" /><circle cx="2.5" cy="8" r="1.4" /><circle cx="7.5" cy="8" r="1.4" /><circle cx="2.5" cy="13" r="1.4" /><circle cx="7.5" cy="13" r="1.4" /></svg>
                  </span>
                )}
                {s.removed ? (
                  <p className="nl-gone"><span>Removed: <b>{s.title}</b></span><button type="button" className="sx-btn sx-btn-sm" onClick={() => change(s.id, (x) => ({ ...x, removed: false, changes: x.changes.filter((c) => !c.startsWith("removed")) }), "Put back")}>Put it back</button></p>
                ) : (
                  <>
                    <div className="nl-story-h">
                      {s.photoCur && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photoCur} alt="" className="nl-thumb" />
                      )}
                      <div>
                        <h3>{s.title}</h3>
                        <p className="nl-src"><Icon name={s.kind === "photos" ? "image" : s.kind === "menu" ? "fork" : s.kind === "coming" || s.kind === "family" || s.kind === "brief" || s.kind === "celebrate" ? "calendar" : "sparkle"} /> {s.source}</p>
                      </div>
                      <span className="nl-badges">
                        {s.by ? <Badge tone="accent"><Icon name="edit" /> Changed by {s.by}</Badge> : <Badge tone="info"><Icon name="sparkle" /> AI wrote this</Badge>}
                        {s.addedBy && <Badge tone="neutral"><Icon name="plus" /> Added by {first(s.addedBy)}</Badge>}
                      </span>
                    </div>

                    {edit?.id === s.id ? (
                      <form className="sx-form nl-edit" onSubmit={(e) => { e.preventDefault(); const text = edit.text.trim(); if (text && text !== s.cur) change(s.id, (x) => mark({ ...x, cur: text }, "rewrote it"), "Saved"); setEdit(null); }}>
                        <label><span className="vh">Rewrite {s.title}</span><textarea value={edit.text} onChange={(e) => setEdit({ id: s.id, text: e.target.value })} rows={4} /></label>
                        <p className="pt-act"><button type="submit" className="sx-btn sx-btn-primary sx-btn-sm"><Icon name="check" /> Save</button><button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(null)}>Cancel</button></p>
                      </form>
                    ) : (
                      <p className="nl-text">{s.cur}{s.sign && <><br /><i>{s.sign}</i></>}</p>
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
                            <button type="button" className="sx-btn sx-btn-sm" onClick={() => change(s.id, (x) => ({ ...x, cur: x.text, showOrig: false, by: x.photoCur !== x.photo ? me : undefined, changes: x.photoCur !== x.photo ? x.changes.filter((c) => !c.startsWith("rewrote")) : [] }), "Back to Kinlight’s version")}>Use Kinlight’s version</button>
                          </div>
                        )}
                      </div>
                    )}

                    {swap === s.id && (
                      <div className="nl-swap" role="group" aria-label="Choose a photo">
                        {s.photos.map((p) => (
                          <button key={p} type="button" aria-pressed={s.photoCur === p} onClick={() => { if (p !== s.photoCur) change(s.id, (x) => mark({ ...x, photoCur: p }, "swapped the photo"), "Photo swapped"); setSwap(null); }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p} alt="" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="nl-where">
                      <span className={`nl-tag ${s.public ? "pub" : "fam"}`}><Icon name={s.public ? "globe" : "lock"} /> {s.public ? "Public" : "Family"}</span>
                      <span>{s.public ? "In every version" : "Families and residents only"}</span>
                      {s.publicNote && <Help label="About the public version"><p>{s.publicNote}</p></Help>}
                    </div>

                    <div className="nl-acts">
                      <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit({ id: s.id, text: s.cur })}><Icon name="edit" /> Rewrite</button>
                      {s.photos.length > 1 && <button type="button" className="sx-btn sx-btn-sm" aria-expanded={swap === s.id} onClick={() => setSwap(swap === s.id ? null : s.id)}><Icon name="image" /> Swap photo</button>}
                      <button type="button" className="sx-btn sx-btn-sm" disabled={i === 0} onClick={() => move(s.id, -1)} aria-label={`Move ${s.title} up`}>↑</button>
                      <button type="button" className="sx-btn sx-btn-sm" disabled={i === stories.length - 1} onClick={() => move(s.id, 1)} aria-label={`Move ${s.title} down`}>↓</button>
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => change(s.id, (x) => ({ ...mark(x, "removed it"), removed: true }), `Removed “${s.title}”`)}><Icon name="x" /> Remove</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>

          <button type="button" className="nl-add" onClick={() => setAdding(true)}>
            <Icon name="plus" />
            <span><b>Add a section</b><small>Pick an event from this week or next. Kinlight writes the section; you fine-tune it.</small></span>
          </button>
        </div>

      </div>

      {adding && <AddSection events={issue.addable.filter((a) => !taken.has(a.story.id))} onAdd={addSection} onClose={() => setAdding(false)} />}

      {/* ------------------------------------------------------------ the email, full size */}
      <section className="sx-card nl-full" aria-labelledby="nl-prev-h">
        <header className="sx-card-head">
          <div>
            <h2 id="nl-prev-h">Preview the email <Help label="About the versions" align="end"><p>One newsletter, two versions, both automatic. It reads like a traditional community weekly: a note from the director, the week’s photos, celebrations, what’s coming up, the menu, a wellness corner, a team spotlight and a brain teaser.</p><p>No resident is ever named or counted in the shared stories. Families also get a short private section about their own resident (only if that resident shares their week). The public version leaves out family and resident-only events.</p></Help></h2>
            <p>Which version do you want to see?</p>
          </div>
          <div className="sx-seg" role="group" aria-label="Version">
            <button type="button" aria-pressed={version === "family"} onClick={() => setVersion("family")}>Family and resident</button>
            <button type="button" aria-pressed={version === "public"} onClick={() => setVersion("public")}>Public</button>
          </div>
        </header>
        <div className="nl-mail">
          <dl className="nl-mail-h">
            <div><dt>From</dt><dd>{issue.from} &lt;news@{issue.domain}&gt;</dd></div>
            <div><dt>To</dt><dd>{version === "family" ? "Each family member and resident, by name, in their own language" : "Community-news subscribers and prospects"}</dd></div>
            <div><dt>Subject</dt><dd><b>{issue.subject}</b></dd></div>
            <div><dt>Sends</dt><dd>Sunday at 5:00 pm</dd></div>
          </dl>
          <EmailBody issue={issue} reader={reader} stories={visible} generic />
        </div>
      </section>
    </div>
  );
}

/**
 * Add a section from an event: pick one, Kinlight drafts the section from the event's facts (a moment, so you can see
 * it working), then add it as is or add it and edit it straight away.
 */
function AddSection({ events, onAdd, onClose }: { events: Addable[]; onAdd: (a: Addable, thenEdit: boolean) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Addable | null>(null);
  const [writing, setWriting] = useState(false);
  const [shown, setShown] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const choose = (a: Addable) => {
    setPick(a);
    setWriting(true);
    setShown("");
    window.clearInterval(timer.current);
    // Write it out a few words at a time, so you can see it being drafted.
    const words = a.story.text.split(" ");
    let n = 0;
    timer.current = window.setTimeout(() => {
      timer.current = window.setInterval(() => {
        n += 1;
        setShown(words.slice(0, n).join(" "));
        if (n >= words.length) { window.clearInterval(timer.current); setWriting(false); }
      }, 70);
    }, 700);
  };
  const s = q.trim().toLowerCase();
  const hits = events.filter((e) => !s || `${e.title} ${e.place}`.toLowerCase().includes(s));
  const group = (wk: "this" | "next", label: string) => {
    const xs = hits.filter((e) => e.week === wk);
    if (!xs.length) return null;
    return (
      <>
        <h3 className="nl-add-g">{label}</h3>
        <ul className="nl-add-list">
          {xs.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => choose(e)}>
                <b>{e.title}</b>
                <small>{e.when}{e.place ? ` · ${e.place}` : ""}</small>
                <span className={`nl-tag ${e.family ? "fam" : "pub"}`}><Icon name={e.family ? "lock" : "globe"} /> {e.family ? "Family" : "Public"}</span>
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  };
  return (
    <div className="sx-drawer" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sx-drawer-box pt-wide" role="dialog" aria-modal="true" aria-label="Add a section">
        <div className="sx-drawer-h">
          <div><h2>Add a section</h2><p>Pick an event. Kinlight writes it from the calendar only: no names, no head counts.</p></div>
          <span className="sx-drawer-a"><button type="button" className="sx-x" onClick={onClose} aria-label="Close"><Icon name="x" /></button></span>
        </div>
        <div className="sx-drawer-b">
          {pick ? (
            <div className="nl-draft">
              <button type="button" className="sx-link" onClick={() => { window.clearInterval(timer.current); window.clearTimeout(timer.current); setPick(null); }}><Icon name="left" /> Pick another event</button>
              <div className={`nl-story ${pick.story.public ? "pub" : "fam"}`}>
                <div className="nl-story-h">
                  {pick.story.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pick.story.photo} alt="" className="nl-thumb" />
                  )}
                  <div>
                    <h3>{pick.story.title}</h3>
                    <p className="nl-src"><Icon name="calendar" /> {pick.story.source}</p>
                  </div>
                  <Badge tone="info"><Icon name="sparkle" /> {writing ? "Writing…" : "AI wrote this"}</Badge>
                </div>
                <p className="nl-text" aria-live="polite">{shown || <span className="nl-writing">Reading the calendar entry…</span>}{writing && shown && <span className="nl-caret" aria-hidden="true" />}</p>
                <div className="nl-where">
                  <span className={`nl-tag ${pick.family ? "fam" : "pub"}`}><Icon name={pick.family ? "lock" : "globe"} /> {pick.family ? "Family" : "Public"}</span>
                  <span>{pick.family ? "Families and residents only" : "In every version"}</span>
                </div>
              </div>
              <p className="pt-act">
                <button type="button" className="sx-btn sx-btn-primary" disabled={writing} onClick={() => onAdd(pick, false)}><Icon name="plus" /> Add to the newsletter</button>
                <button type="button" className="sx-btn" disabled={writing} onClick={() => onAdd(pick, true)}><Icon name="edit" /> Add and edit</button>
              </p>
              <p className="sx-hint">Once it’s in, you can rewrite it, swap the photo, move it or remove it like any other section.</p>
            </div>
          ) : (
            <>
              <label className="sx-form"><span className="vh">Search events</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search an event or a room" autoFocus /></label>
              {group("this", "This week: already happened")}
              {group("next", "Next week: coming up")}
              {!hits.length && <p className="pt-empty">No events match.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** How last week's issue did: opened under the one-line summary at the top. A sent issue is locked; send a correction. */
function LastWeek({ issue }: { issue: Issue }) {
  const [fix, setFix] = useState<{ open: boolean; text: string; sent: boolean }>({ open: false, text: "", sent: false });
  return (
    <div className="nl-last">
      <section className="sx-card nl-locked">
        <div className="sx-card-body">
          <div className="nl-lock"><Icon name="lock" /> <span><b>{issue.last.subject}</b> · sent {issue.last.sent}</span>
            <Help label="Why it’s locked" align="end"><p>A sent newsletter can’t be changed. A correction goes to every family who got it, and the web version is updated.</p></Help>
          </div>
          {fix.sent ? (
            <div className="sx-callout good" role="status"><Icon name="check" /><p>Correction sent to the {issue.last.reached} families who got it, and the web version updated.</p></div>
          ) : fix.open ? (
            <form className="sx-form" onSubmit={(e) => { e.preventDefault(); if (fix.text.trim()) { setFix({ ...fix, sent: true }); say(`Correction sent to ${issue.last.reached} families`); } }}>
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
          <header className="sx-card-head"><div><h2>Top stories</h2><p>Families who opened each</p></div></header>
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
          <header className="sx-card-head"><div><h2>Replies <Help label="Where replies go"><p>Thank-yous go to the person named; questions go to the right person. Concerns go to Feedback.</p></Help></h2></div></header>
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
  );
}

/** The email itself, as one reader gets it. Public: no names, no family events, nothing personal. */
function EmailBody({ issue, reader, stories, generic = false }: { issue: Issue; reader: Reader; stories: Live[]; generic?: boolean }) {
  const pub = reader.kind === "public";
  const shown = stories.filter((s) => !pub || s.public);
  const p = reader.personal;
  // Previewing a version, not a person: names become placeholders, filled in for each family when it sends.
  const res: ReactNode = generic ? <span className="nl-ph">Resident’s name</span> : first(reader.resident);
  const hiName: ReactNode = generic ? <span className="nl-ph">First name</span> : first(reader.name);
  const cameLine = (xs: { title: string; when: string }[]) => {
    const parts = xs.map((x) => `${x.title} (${x.when.slice(0, 3)})`);
    return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  };
  return (
    <div className="ph-em nl-em">
      <div className="ph-em-banner nl-mast"><b>{issue.masthead}</b><small>The week of {issue.weekLabel}</small></div>
      <p className="ph-em-p">{pub ? `${issue.hello} Here’s the week at ${issue.community}.` : <>Hi {hiName}, {issue.hello.replace(/^Hello/, "hello")} Here’s the week at {issue.community}.</>}</p>

      {reader.kind === "family" && reader.shares && p && (
        <div className="nl-em-me">
          <p className="ph-em-h">{generic ? "Their resident’s week" : <>{res}’s week</>}</p>
          {generic && <p className="nl-ph-note">Only in each family’s own copy, and only if their resident shares their week. This example uses one resident’s week.</p>}
          {p.photos.map((x) => (
            <div key={x.title} className="ph-em-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.src} alt="" />
              <span><b>{res} is in the photos from {x.title}</b><small>{x.when}</small></span>
            </div>
          ))}
          {p.came.length > 0 && <p className="ph-em-p">{res} came to {cameLine(p.came)}.</p>}
          {p.outings.map((x) => <p key={x.title} className="ph-em-p">Booked for <b>{x.title}</b>, {x.when}.</p>)}
          {p.waitlist.map((x) => <p key={x.title} className="ph-em-p">On the waitlist for <b>{x.title}</b>, {x.when}. We’ll text if a seat opens.</p>)}
          {p.saidYes.map((x) => <p key={x.title} className="ph-em-p">Said yes to <b>{x.title}</b>, {x.when}.</p>)}
          {p.photos.length + p.came.length + p.outings.length + p.waitlist.length + p.saidYes.length === 0 && <p className="ph-em-p">No photos, activities or bookings for {res} this week.</p>}
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
        <div key={s.id} className={`nl-sec nl-sec-${s.kind}`}>
          <p className="ph-em-h">{s.title}</p>
          {s.photoCur && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.photoCur} alt="" className="ph-em-photo" />
          )}
          <p className="ph-em-p">{s.cur}</p>
          {s.sign && <p className="ph-em-p nl-sign">{s.sign}</p>}
          {s.items && s.kind !== "brief" && (
            <ul className="nl-em-list">
              {s.items.filter((it) => !pub || (it.kind !== "family" && !/council|meeting/i.test(it.title))).map((it) => <li key={it.title + it.when}><b>{it.title}</b> · {it.when}</li>)}
            </ul>
          )}
        </div>
      ))}
      <div className="nl-dir">
        <b>Who to call</b>
        <ul>{issue.directory.map((d) => <li key={d.role}><span>{d.role}</span> {d.name}{d.ext ? `, ext. ${d.ext}` : ""}</li>)}</ul>
      </div>
      <div className="ph-em-foot">
        <p className="nl-addr"><b>{issue.community}</b> · {issue.contact.address} · {issue.contact.phone} · {issue.contact.web}{issue.contact.facebook ? ` · ${issue.contact.facebook}` : ""}</p>
        {pub ? `You subscribed to community news at ${issue.domain}. Unsubscribe any time.` : reader.kind === "family" ? <>You get this as a family member of {res}. Reply to reach the team.</> : "Reply to reach the team, or stop by the front desk."}
      </div>
    </div>
  );
}
