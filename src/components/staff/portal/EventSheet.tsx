"use client";

// One event, with everything about it: who's leading, the details as they were set (who it's for, room, time, seats,
// price), family requests, who's coming (signed up, and residents who've shown interest), the leader's own notes
// (materials, set-up, people), the waitlist, personal invites, attendance (tap list, QR full-screen, or a photo of the
// sign-in sheet), photos, print, and "Something changed". Edit (top right) opens the event in Post, where it's changed
// for that date or every date. The same sheet opens from Today, from Calendar and from a Needs you card. Saved in this
// browser.
import Link from "next/link";
import { useState } from "react";
import { categoryOf, eventKindLabel, type EventKind } from "@/data/shared";
import type { CalEvent, Material, Note, ReqRow } from "@/data/staff/calEvents";
import type { NewEventSetup, PhotoKit } from "@/data/staff/post";
import { dayName, fmtRange, fmtTime, fromIso, monthName, nowMinutes } from "@/lib/clock";
import { Icon } from "../../Icon";
import { FamilyLink, ResidentLink } from "../ResidentLink";
import { useStaffCommunity } from "../StaffCommunity";
import { say, useLeaders, useSetLeader } from "../store";
import { Badge } from "../ui";
import { Attendance } from "./Attendance";
import { Drawer } from "./Drawer";
import { EventPhotos } from "./EventPhotos";
import { Help } from "./Help";

const webShows: Record<EventKind, string> = {
  public: "Everything: name, day, time, place and description, with a sign-up form. Each sign-up is a lead for sales.",
  family: "Name, day, time, place and description. Families RSVP by replying to their text.",
  resident: "Name, day, time and description only. Never the seats, the room or a meeting point.",
};
const first = (n = "") => n.split(" ")[0];
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export interface SheetProps {
  e: CalEvent; residents: string[]; staff: string[]; me: string; todayIso: string; readOnly?: boolean;
  brand: { name: string; domain: string; phone: string }; kit?: PhotoKit; photoFocus?: boolean; changeFocus?: boolean;
  onClose: () => void;
  /** The event as changed; `prev` is its id and date before, when Edit moved it to another day. */
  onChange: (e: CalEvent, prev?: { id: string; date: string }) => void;
  /** The add-event form's setup, for Edit. */
  setup?: NewEventSetup;
  /** Where it was opened, for Edit's way back: Calendar or Today. */
  from?: "calendar" | "today";
  /** "Who looks after whom" is on: who looks after each resident (first names). */
  careOf?: Record<string, string>;
  /** A change to every week of a repeating event, from this date on. */
  onSeries?: (e: CalEvent, patch: Partial<CalEvent>) => void;
  /** Open with attendance started (Take attendance on Today). */
  attendFocus?: boolean;
  /** Already checked in by QR (an activity on now). */
  qrIn?: string[];
  /** Lantern residents, so "Invite someone else" offers only the residents an activity is for. */
  lantern?: string[];
  /** Each resident's interests, so matching residents come first in "Invite someone else". */
  interestsOf?: Record<string, string[]>;
}

/** Who's leading an activity: the one set in the sheet, or the one on the calendar. */
export const leaderOf = (e: CalEvent, leaders: Record<string, string>) => leaders[e.id] ?? e.leader;

export function EventSheet({ e, residents, staff, me, todayIso, readOnly = false, brand, kit, photoFocus = false, changeFocus = false, attendFocus = false, onClose, onChange, onSeries, qrIn = [], setup, careOf, lantern = [], interestsOf, from = "calendar" }: SheetProps) {
  // "Add photos" from Today opens the sheet with the photo picker open.
  const [addingPhotos, setAddingPhotos] = useState(photoFocus && !readOnly);
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [noteKind, setNoteKind] = useState<Note["kind"]>("materials");
  const [files, setFiles] = useState<Material[]>([]);
  const { site } = useStaffCommunity();
  const leaders = useLeaders();
  const setLeader = useSetLeader();
  const d = fromIso(e.date);
  const [taking, setTaking] = useState(attendFocus);
  const [editing, setEditing] = useState(changeFocus);
  const [edit, setEdit] = useState({ time: hhmm(e.start), room: e.room, what: "move" as "move" | "late" | "cancel", late: 15, scope: "one" as "one" | "all", tell: true });
  const [told, setTold] = useState<string | null>(null);
  const past = e.date < todayIso;
  const isToday = e.date === todayIso;
  const full = e.cap !== undefined && (e.taken ?? 0) >= e.cap;
  const left = e.cap ? Math.max(0, e.cap - (e.taken ?? 0)) : undefined;
  const reqs = e.requests ?? [];
  const setReq = (id: string, patch: Partial<ReqRow>) => onChange({ ...e, requests: reqs.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const bookedN = e.booked?.length ?? e.taken ?? (e.invites?.yes || 0);
  const families = Math.round(bookedN * 1.3);
  const lead = leaderOf(e, leaders);
  const mine = lead === me;
  const attendList = [...new Set([...(e.people ?? []).filter((x) => x.status === "signed").map((x) => x.name), ...(e.booked ?? []).map((b) => b.name), ...(e.regulars ?? [])])];

  const approve = (r: ReqRow) => {
    if (full) {
      onChange({ ...e, requests: reqs.map((x) => (x.id === r.id ? { ...x, waitlisted: true } : x)), waiting: [...(e.waiting ?? []), r.resident], waitlist: (e.waitlist ?? 0) + 1 });
      say(`Added to the waitlist. ${first(r.from)} told.`);
      return;
    }
    const next = { ...e, requests: reqs.map((x) => (x.id === r.id ? { ...x, stage: 4 as const } : x)) };
    if (r.kind === "seat" && e.cap !== undefined) Object.assign(next, { taken: (e.taken ?? 0) + 1, booked: [{ name: r.resident, via: "Family asked, resident said yes" }, ...(e.booked ?? [])] });
    onChange(next);
    say(`Confirmed. ${first(r.from)} told by text.`);
  };
  const saveEdit = () => {
    const reach = !edit.tell ? "Nobody told" : bookedN ? `Told ${bookedN} booked and ${families} family members` : "Nobody booked to tell";
    const all = edit.scope === "all" && !!e.rule && !!onSeries;
    if (edit.what === "cancel") {
      if (all) onSeries!(e, { cancelled: true }); else onChange({ ...e, cancelled: true });
      setTold(`${all ? "Every week from now · " : ""}${reach} · off the website, newsletter and printed calendar`);
      say(edit.tell && bookedN ? `Cancelled. Told ${bookedN} booked.` : "Cancelled.");
    } else if (edit.what === "late") {
      onChange({ ...e, late: edit.late });
      setTold(`Running ${edit.late} minutes late · ${reach} by text · the lobby screens update`);
      say(edit.tell && bookedN ? `Told ${bookedN} booked: ${edit.late} minutes late.` : `Marked ${edit.late} minutes late.`);
    } else {
      const [h, m] = edit.time.split(":").map(Number);
      const start = (h || 0) * 60 + (m || 0);
      const dur = (e.end ?? e.start + 60) - e.start;
      const patch = { start, end: start + dur, room: edit.room };
      if (all) onSeries!(e, patch); else onChange({ ...e, ...patch });
      setTold(`Now ${fmtTime(start)}${edit.room !== e.room ? `, ${edit.room}` : ""}${all ? ", every week" : ""} · ${reach} · website updated`);
      say(edit.tell && bookedN ? `Moved. Told ${bookedN} booked.` : "Moved. Website updated.");
    }
    setEditing(false);
  };
  const changeBtn = () => { setEditing(true); setTold(null); window.setTimeout(() => document.getElementById("pc-edit")?.scrollIntoView({ behavior: "smooth", block: "center" }), 30); };

  const kindFor: Record<EventKind, string> = { resident: "Residents only", family: "Residents and families", public: "Open to the public" };
  const signed = (e.people ?? []).filter((x) => x.status === "signed");
  const interested = (e.people ?? []).filter((x) => x.status !== "signed");
  /** "+ Invite": a personal text asking if they'd like to come. Lantern residents are asked in person instead. */
  const inviteText = (name: string) => `Hi ${first(name)}! ${e.title.replace(/^Bus Trip: /, "")} is ${e.date === todayIso ? "today" : dayName(d)} at ${fmtTime(e.start)}${e.kind === "resident" && e.lantern ? "" : ` in ${e.room}`}. Would you like to come? Reply YES and we’ll save you a seat.`;
  const invite = (name: string) => {
    const before = e.people ?? [];
    const has = before.some((x) => x.name === name);
    const why = e.lantern ? "Invited in person" : "Invited by text just now";
    onChange({ ...e, people: has ? before.map((x) => (x.name === name ? { ...x, status: "invited" as const, why } : x)) : [...before, { name, status: "invited" as const, why }] });
    const care = careOf?.[name];
    const meFirst = first(me);
    say(e.lantern ? (care && care !== meFirst ? `Asked ${care} (Lantern team) to invite ${first(name)} in person.` : `${first(name)} marked as invited in person.`)
      : `Invite sent to ${first(name)}${care && care !== meFirst ? `. ${care}, who looks after ${first(name)}, can see it` : ""}: “${inviteText(name)}”`);
  };
  const addNote = () => {
    const withFiles = noteKind === "materials" ? files : [];
    if (!note.trim() && !withFiles.length) return;
    onChange({ ...e, notes: [...(e.notes ?? []), { id: `${e.id}-mine-${(e.notes ?? []).length}`, by: me, when: "Just now", kind: noteKind, text: note.trim() || (withFiles.length === 1 ? withFiles[0].name : `${withFiles.length} files to print`), files: withFiles.length ? withFiles : undefined }] });
    setNote("");
    setFiles([]);
    say(withFiles.length ? `Note saved with ${withFiles.length} file${withFiles.length === 1 ? "" : "s"}. Only staff see it.` : "Note saved. Only staff see it.");
  };
  const noteLabel: Record<Note["kind"], string> = { materials: "Materials", setup: "Set-up", people: "People" };

  // What a staff member needs depends on when they open it. Before: who's coming, invites, notes, print. On now or
  // finished: attendance and photos first. Details and Print stay folded at the bottom.
  const nowM = nowMinutes();
  const phase: "before" | "during" | "after" = past || (isToday && nowM >= (e.end ?? e.start + 60)) ? "after" : isToday && nowM >= e.start - 15 ? "during" : "before";
  const opensAt = fmtTime(Math.max(0, e.start - 15));
  const area = e.lantern ? "Lantern" : e.kind === "public" ? "Everyone" : e.kind === "family" ? "Residents and families" : "All residents";
  const category = categoryOf(e);
  const saidYes = signed.length;
  const invitedN = (e.invites?.invited ?? 0) + interested.filter((x) => x.status === "invited").length;
  const cameN = e.came?.n;
  const photos = e.photos ?? [];
  const wantedLeft = !!e.wanted && !photos.length;
  // "Invite someone else": only residents the activity is for, matching interests first.
  const forThis = residents.filter((r) => (lantern.includes(r) ? !!e.lantern : !e.lantern) && !(e.people ?? []).some((x) => x.name === r));
  const ints = new Set(e.interests ?? e.invites?.interests ?? []);
  const likes = (r: string) => (interestsOf?.[r] ?? []).some((i) => ints.has(i));
  const candidates = [...forThis.filter(likes), ...forThis.filter((r) => !likes(r))];
  const shortlist = candidates.filter((r) => !search.trim() || r.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8);

  const attendanceSec = !readOnly && !e.cancelled && (
    <section className="pt-ev-sec pc-attend-first" id="pc-attendance" key="attend">
      <h3>Attendance</h3>
      {phase === "before" ? (
        <p className="sx-hint pc-oneline"><Icon name="clock" /> {isToday ? `Take attendance from ${opensAt}, 15 minutes before it starts.` : "Take attendance from 15 minutes before it starts."}{e.lantern ? "" : " Or scan residents’ check-in cards at the door."}</p>
      ) : e.came ? (
        <>
          <p><b>{e.came.n}</b> came · {e.came.of} said yes</p>
          <div className="pc-split">
            <div><b>{e.came.qr}</b><span>{e.lantern ? "Cards not used" : "Card scans"}</span></div>
            <div><b>{e.came.staff}</b><span>{e.came.how === "tap" ? `Tapped in by ${first(e.came.by)}` : `Paper sheet, by ${first(e.came.by)}`}</span></div>
            <div><b>{Math.max(0, e.came.of - e.came.n)}</b><span>Said yes, didn’t come</span></div>
          </div>
        </>
      ) : taking ? (
        <Attendance
          ev={{ id: e.id, title: e.title, when: fmtTime(e.start), place: e.room, lantern: e.lantern }}
          booked={attendList}
          bookedLabel={e.cap ? "Booked" : "Said yes"}
          everyone={residents.filter((r) => (lantern.includes(r) ? !!e.lantern : !e.lantern))}
          qrIn={qrIn}
          onSaved={(n, names) => {
            onChange({ ...e, came: { n, of: Math.max(n, attendList.length), qr: 0, staff: n, how: "tap", by: me }, cameNames: names });
            setTaking(false);
            say(`Attendance saved: ${n} came.`);
          }}
        />
      ) : (
        <div className="pt-act">
          {qrIn.length > 0 && <span className="sx-hint">{qrIn.length} checked in by card so far.</span>}
          <button type="button" className="sx-btn sx-btn-primary sx-btn-lg" onClick={() => setTaking(true)}><Icon name="users" /> Take attendance</button>
        </div>
      )}
    </section>
  );

  const photosSec = !readOnly && !e.cancelled && (
    <section className="pt-ev-sec" id="pc-photos" key="photos">
      <h3>Photos {e.wanted ? <small className="sx-hint">{photos.length ? `${photos.length} added` : "Wanted, none yet"}</small> : null}</h3>
      {phase === "before" ? (
        <p className="sx-hint pc-oneline"><Icon name="image" /> Add photos once it starts{e.wanted ? ": photos wanted" : ""}. Tags are suggested from who checks in.</p>
      ) : (
        <>
          {photos.length > 0 && (
            <ul className="pc-photo-grid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photos.map((src, i) => <li key={src + i}><img src={src} alt={`Photo ${i + 1} from ${e.title}`} /></li>)}
            </ul>
          )}
          {photos.length === 0 && !addingPhotos && <p className="sx-hint">No photos yet.</p>}
          {kit && (addingPhotos ? (
            <EventPhotos
              e={{ id: e.id, title: e.title, date: e.date, room: e.room, lantern: e.lantern, photos: e.photos, wanted: e.wanted, came: e.cameNames ?? e.booked?.map((b) => b.name) }}
              kit={kit}
              todayIso={todayIso}
              focus
              onPosted={(srcs, waiting) => { onChange({ ...e, photos: [...photos, ...srcs] }); setAddingPhotos(false); say(waiting ? `Sent to ${kit.approver.first} for approval` : `${srcs.length} photo${srcs.length === 1 ? "" : "s"} posted`); }}
            />
          ) : (
            <div className="pt-act"><button type="button" className={`sx-btn${wantedLeft ? " sx-btn-primary" : ""}`} onClick={() => setAddingPhotos(true)}><Icon name="image" /> Add photos</button></div>
          ))}
          {phase === "after" && <p className="sx-hint">{photos.length ? (e.kind === "resident" ? "In the gallery, and in the weekly update for families of residents who are tagged and share their week." : "In the gallery and the weekly family newsletter.") : "Families haven’t seen anything from this yet."}</p>}
        </>
      )}
    </section>
  );

  const requestsSec = !readOnly && reqs.length > 0 && (
    <section className="pt-ev-sec" key="reqs">
      <h3>Family requests <Help label="How requests work"><p>Family asks → the resident says yes → staff approve → the family is told. A full event puts them on the waitlist instead, and confirms if a seat opens.</p><p>Lantern residents aren’t texted: ask in person.</p></Help></h3>
      <ul className="pt-reqs">
        {reqs.map((r) => {
          const rf = first(r.resident);
          const steps = ["Family asked", r.lantern ? "Asked in person" : `${rf} said yes`, r.waitlisted ? "Waiting" : r.declined ? "Declined" : "Staff approved", "Family told"];
          const stage = r.waitlisted ? 4 : r.stage;
          return (
            <li key={r.id}>
              <p><FamilyLink name={r.from} resident={r.resident} /> <span className="sx-hint">{r.relation} of <ResidentLink name={r.resident} bold={false} /></span> · {r.kind === "rsvp" ? `${r.party} ${r.party === 1 ? "person" : "people"}` : `a seat for ${rf}`}{r.lantern && <> · <span className="po-tag">Lantern: ask in person</span></>}</p>
              <ol className="al-steps" aria-label="Progress">
                {steps.map((s, i) => <li key={s + i} className={i + 1 < stage || (i + 1 === stage && stage === 4) ? "done" : i + 1 === stage ? "now" : ""}>{s}</li>)}
              </ol>
              {r.stage === 2 && !r.lantern && (
                <p className="sx-hint">Waiting for {rf}. <button type="button" className="sx-link pt-linkbtn" onClick={() => approve(r)}>{rf} said yes in person</button></p>
              )}
              {r.stage === 2 && r.lantern && (
                <div className="pt-act">
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => approve(r)}><Icon name="check" /> {rf} said yes</button>
                </div>
              )}
              {r.stage === 3 && !r.declined && !r.waitlisted && (
                full && r.kind === "seat" ? (
                  <div className="pt-act"><span className="po-tag">Full</span><button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => approve(r)}><Icon name="plus" /> Add to the waiting list</button></div>
                ) : (
                  <div className="pt-act">
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => approve(r)}><Icon name="check" /> Approve</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setReq(r.id, { stage: 4, declined: true }); say(`Declined. ${first(r.from)} told kindly.`); }}>Decline</button>
                  </div>
                )
              )}
              {r.waitlisted && <p className="sx-hint">Waiting for a seat · {first(r.from)} told</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );

  const comingSec = !readOnly && (
    <section className="pt-ev-sec" key="coming">
      <h3>Who’s coming <Help label="Who’s on this list"><p><b>{e.cap ? "Booked" : "Said yes"}:</b> {e.cap ? "has a seat" : "said YES to their invite, signed up at the desk, or comes every week"}. <b>Invited:</b> asked, no answer yet. Below them, residents whose interests match who haven’t been invited: “Invite” texts them, and a YES {e.cap ? "books a seat" : "adds them"}.</p>{e.lantern && <p>Lantern residents aren’t texted: invite them in person and mark it here.</p>}</Help></h3>
      <p className="pc-counts">
        <span><b>{invitedN}</b> invited</span>
        <span><b>{saidYes}</b> {e.cap ? "booked" : "said yes"}</span>
        {e.waiting && e.waiting.length > 0 && <span><b>{e.waiting.length}</b> waiting</span>}
        {cameN !== undefined && <span><b>{cameN}</b> came</span>}
        {e.cap !== undefined && <span className="sx-hint">{e.cap} seats · {left ? `${left} left` : "full"}</span>}
      </p>
      <ul className="pc-people">
        {signed.map((x) => (
          <li key={x.name} className="signed"><span><ResidentLink name={x.name} /><small>{x.why}</small></span><span className="pc-ppl-s"><Icon name="check" /> {e.cap ? "Booked" : "Said yes"}</span></li>
        ))}
        {interested.filter((x) => x.status === "invited").map((x) => (
          <li key={x.name}><span><ResidentLink name={x.name} /><small>{x.why}</small></span><span className="pc-ppl-s invited"><Icon name="sms" /> Invited</span></li>
        ))}
        {!past && !e.cancelled && interested.filter((x) => x.status !== "invited").map((x) => (
          <li key={x.name} className="maybe">
            <span><ResidentLink name={x.name} /><small>{x.why}{careOf?.[x.name] ? ` · ${careOf[x.name] === first(me) ? "your resident" : `${careOf[x.name]}’s resident`}` : ""}</small></span>
            <button type="button" className="sx-btn sx-btn-sm" onClick={() => invite(x.name)} title={e.lantern ? "Invite in person" : inviteText(x.name)}><Icon name="plus" /> Invite</button>
          </li>
        ))}
      </ul>
      {e.invites && !e.lantern && <p className="sx-hint pc-inv-note">Personal invites went to {e.invites.invited} residents who like {e.invites.interests.join(", ").toLowerCase()} · {e.invites.sentAt}. <q>{e.invites.text}</q></p>}
      {!past && !e.cancelled && (
        <div className="pt-desk pc-invite-other">
          <label>
            <span className="sx-lbl">Invite someone else{e.lantern ? " (Lantern residents)" : ""}</span>
            <input type="search" value={search} onChange={(ev) => setSearch(ev.target.value)} placeholder="Search a name" />
          </label>
          <ul className="pc-cands">
            {shortlist.map((r) => <li key={r}><span>{r}{likes(r) && <small> · likes {[...ints].filter((i) => interestsOf?.[r]?.includes(i)).join(", ").toLowerCase()}</small>}</span><button type="button" className="sx-btn sx-btn-sm" onClick={() => invite(r)}><Icon name="plus" /> Invite</button></li>)}
            {!shortlist.length && <li className="sx-hint">Nobody else to invite.</li>}
          </ul>
        </div>
      )}
      {e.waiting && e.waiting.length > 0 && (
        <>
          <h4>Waiting for a seat <Help label="How waiting works"><p>If a seat opens, the next person gets a text, in this order.</p></Help></h4>
          <ol className="pt-booked">{e.waiting.map((n, i) => <li key={n + i}><span>{i + 1}. <ResidentLink name={n} bold={false} /></span><small>{i === 0 ? "Next" : "Waiting"}</small></li>)}</ol>
        </>
      )}
    </section>
  );

  const notesSec = !readOnly && (
    <section className="pt-ev-sec" key="notes">
      <h3>Notes <span className="po-tag">Only staff</span> <Help label="About notes"><p>For you and whoever leads it: what to bring, how to set up, and anything about the people coming. Never published, sent or shown to families.</p></Help></h3>
      {(e.notes ?? []).length ? (
        <ul className="pc-notes">
          {(e.notes ?? []).map((n) => (
            <li key={n.id} className={`k-${n.kind}`}>
              <span className="pc-note-k">{noteLabel[n.kind]}</span>
              <p>{n.text}</p>
              {n.files && n.files.length > 0 && (
                <ul className="pc-files">
                  {n.files.map((f) => <li key={f.url}><FileCard f={f} /></li>)}
                </ul>
              )}
              <small>{n.by === me ? "You" : first(n.by)} · {n.when}{n.by === me && <> · <button type="button" className="sx-link pt-linkbtn" onClick={() => { onChange({ ...e, notes: (e.notes ?? []).filter((x) => x.id !== n.id) }); say("Note removed."); }}>Remove</button></>}</small>
            </li>
          ))}
        </ul>
      ) : <p className="sx-hint">No notes yet.</p>}
      <form className="pc-note-add sx-form" onSubmit={(ev) => { ev.preventDefault(); addNote(); }}>
        <div className="sx-chips" role="group" aria-label="Kind of note">
          {(["materials", "setup", "people"] as const).map((k) => <button key={k} type="button" aria-pressed={noteKind === k} onClick={() => setNoteKind(k)}>{noteLabel[k]}</button>)}
        </div>
        {noteKind === "materials" && (
          <div className="pc-attach">
            <label className="sx-btn sx-btn-sm">
              <input type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,application/pdf,image/*" onChange={(ev) => {
                const add = [...(ev.target.files ?? [])].map((f) => ({ name: f.name, url: URL.createObjectURL(f), size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` }));
                setFiles((x) => [...x, ...add]);
                ev.target.value = "";
              }} />
              <Icon name="upload" /> Attach a PDF or printable
            </label>
            {files.map((f) => (
              <span key={f.url} className="pc-attach-f"><Icon name="doc" /> {f.name} <small>{f.size}</small><button type="button" className="sx-x" aria-label={`Remove ${f.name}`} onClick={() => setFiles((x) => x.filter((y) => y !== f))}><Icon name="x" /></button></span>
            ))}
          </div>
        )}
        <label><span className="vh">New note</span><textarea rows={2} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder={noteKind === "materials" ? "Bring the large-print song sheets" : noteKind === "setup" ? "Chairs in a half circle by the window" : "Walter wants to sit near the front"} /></label>
        <div className="pt-act"><button type="submit" className="sx-btn sx-btn-sm sx-btn-primary" disabled={!note.trim() && !(noteKind === "materials" && files.length)}><Icon name="plus" /> Add note</button></div>
      </form>
    </section>
  );

  const detailsSec = (
    <details className="pt-ev-sec pc-fold" key="details">
      <summary><h3>Details</h3> <Help label="What the website shows"><p>{webShows[e.kind]}</p><p>Set when the event was added. Change any of it with Edit.</p></Help></summary>
      <dl className="pc-details">
        <div><dt>Who it’s for</dt><dd>{kindFor[e.kind]}{e.lantern ? " · Lantern" : ""}</dd></div>
        <div><dt>Room</dt><dd>{e.room}</dd></div>
        <div><dt>When</dt><dd>{dayName(d)}, {monthName(d).slice(0, 3)} {d.getUTCDate()} · {fmtRange(e.start, e.end)}</dd></div>
        <div><dt>Repeats</dt><dd>{e.rule ?? "One-off"}</dd></div>
        <div><dt>Category</dt><dd>{category}</dd></div>
        <div><dt>Seats</dt><dd>{e.cap ? `${e.cap} (${left ? `${left} left` : "full"})` : "No limit"}</dd></div>
        <div><dt>Price</dt><dd>{e.cost ?? "Free"}</dd></div>
        <div><dt>Led by</dt><dd>{lead ?? "Not set"}</dd></div>
        <div><dt>Interests</dt><dd>{(e.interests ?? e.invites?.interests ?? []).join(", ") || "None"}</dd></div>
        <div><dt>Photos wanted</dt><dd>{e.wanted ? "Yes" : "No"}</dd></div>
      </dl>
      {e.desc && <p className="pc-desc">{e.desc}</p>}
    </details>
  );

  const printSec = !readOnly && !e.cancelled && (
    <details className="pt-ev-sec pc-fold" key="print">
      <summary><h3>Print</h3> <small className="sx-hint">Flyer</small></summary>
      <div className="pc-prints">
        <div className="pc-print">
          <div className="pv-flyer">
            <div className="pv-flyer-top">{brand.name}</div>
            <span />
            <div className="pv-flyer-t">
              <b>{e.title.replace(/^Bus Trip: /, "")}</b>
              <span>{e.rule ?? `${dayName(d)}, ${monthName(d)} ${d.getUTCDate()}`} · {fmtTime(e.start)}</span>
              <small>{e.kind === "public" ? `Everyone welcome · ${brand.domain}` : e.cap ? "Sign up at the front desk" : e.room}</small>
            </div>
            <div className="pv-flyer-foot">Questions? {brand.phone}</div>
          </div>
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => say("Flyer sent to the front desk printer")}><Icon name="printer" /> Print the flyer</button>
        </div>
      </div>
    </details>
  );

  const order = phase === "before"
    ? [comingSec, requestsSec, notesSec, attendanceSec, photosSec]
    : [attendanceSec, photosSec, comingSec, requestsSec, notesSec];

  return (
    <Drawer
      wide
      action={!readOnly && !e.cancelled && !past ? (
        <>
          <button type="button" className="sx-btn sx-btn-sm sx-btn-terra" onClick={changeBtn}><Icon name="alert" /> Something changed</button>
          {setup && <Link className="sx-btn sx-btn-sm" href={`/staff/post?type=event&edit=${encodeURIComponent(e.id)}&date=${e.orig ?? e.date}&back=${from}`}><Icon name="edit" /> Edit</Link>}
        </>
      ) : undefined}
      title={e.title}
      sub={<>{dayName(d)}, {monthName(d)} {d.getUTCDate()} · {fmtRange(e.start, e.end)}{e.late ? ` (${e.late} min late)` : ""} · {e.room}{lead ? <> · Led by <b>{lead === me ? "you" : lead}</b></> : null}</>}
      onClose={onClose}
      foot={<a className="sx-btn" href={site("/calendar")} target="_blank" rel="noopener"><Icon name="globe" /> On the website</a>}
    >
      <div className="pc-top">
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pc-cover" src={photos[0]} alt={`Photo from ${e.title}`} />
        ) : (
          <span className="pc-cover pc-cover-none" style={{ background: e.color }} title={e.wanted ? "No photos yet · photos wanted" : "No photo"}><Icon name="image" /></span>
        )}
        <p className="pt-ev-meta">
          <Badge tone={e.kind === "public" ? "accent" : e.kind === "family" ? "info" : "good"}>{eventKindLabel[e.kind]}</Badge>
          {e.cancelled ? <Badge tone="bad">Cancelled</Badge> : e.late ? <Badge tone="warn">{e.late} min late</Badge> : e.approval ? <Badge tone="warn">Approval needed</Badge> : e.idea ? <Badge tone="warn">Your idea</Badge> : phase === "during" ? <Badge tone="good">{nowM < e.start ? `Starts at ${fmtTime(e.start)}` : "On now"}</Badge> : null}
          <span>{area} · {category}</span>
          <span>{e.rule ?? "One-off"}</span>
          {e.idea && <span>From {e.idea}</span>}
        </p>
      </div>

      {e.clash && <div className="sx-callout"><Icon name="alert" /><p>Also in {e.room} at {fmtTime(e.start)}: <b>{e.clash}</b>. <a className="sx-link" href={`/staff/calendar?clash=${encodeURIComponent(e.id)}&date=${e.date}`}>Review</a></p></div>}
      {told && <div className={`pc-told${e.cancelled ? " cancel" : ""}`} role="status"><b>{e.cancelled ? "Cancelled" : "Changed"}</b><span>{told}</span></div>}

      {!readOnly && editing && !past && (
        <section className="pt-ev-sec pc-change" id="pc-edit">
          <h3>Something changed</h3>
          <div className="pc-edit sx-form">
            <div className="sx-seg" role="group" aria-label="What changed">
              <button type="button" aria-pressed={edit.what === "move"} onClick={() => setEdit({ ...edit, what: "move" })}>Moved</button>
              {isToday && <button type="button" aria-pressed={edit.what === "late"} onClick={() => setEdit({ ...edit, what: "late" })}>Running late</button>}
              <button type="button" aria-pressed={edit.what === "cancel"} onClick={() => setEdit({ ...edit, what: "cancel" })}>Cancelled</button>
            </div>
            {edit.what === "move" && (
              <div className="sx-row">
                <label>Starts<input type="time" value={edit.time} step={300} onChange={(ev) => setEdit({ ...edit, time: ev.target.value })} /></label>
                <label>Room<input value={edit.room} onChange={(ev) => setEdit({ ...edit, room: ev.target.value })} /></label>
              </div>
            )}
            {edit.what === "late" && (
              <div className="sx-chips" role="group" aria-label="How late">
                {[10, 15, 30, 45].map((m) => <button key={m} type="button" aria-pressed={edit.late === m} onClick={() => setEdit({ ...edit, late: m })}>{m} min</button>)}
              </div>
            )}
            {e.rule && edit.what !== "late" && (
              <fieldset className="pc-scope">
                <legend>This is a repeating activity. Change…</legend>
                <div className="sx-seg" role="group" aria-label="Which dates">
                  <button type="button" aria-pressed={edit.scope === "one"} onClick={() => setEdit({ ...edit, scope: "one" })}>Only {dayName(d)}, {monthName(d).slice(0, 3)} {d.getUTCDate()}</button>
                  <button type="button" aria-pressed={edit.scope === "all"} disabled={!onSeries} onClick={() => setEdit({ ...edit, scope: "all" })}>{e.rule}, from now on</button>
                </div>
              </fieldset>
            )}
            <label className="pc-tell">
              <input type="checkbox" checked={edit.tell} onChange={(x) => setEdit({ ...edit, tell: x.target.checked })} />
              <span>{bookedN ? <>Tell the <b>{bookedN}</b> {e.booked ? "booked" : "who said yes"} and their families</> : "Tell anyone who says yes"} by text</span>
            </label>
            {edit.tell && bookedN > 0 && (
              <q className="pc-msg">
                {edit.what === "cancel" ? `Sorry: ${e.title} on ${dayName(d)} is cancelled. We’ll let you know when it’s back.`
                  : edit.what === "late" ? `${e.title} is starting about ${edit.late} minutes late today. See you soon!`
                  : `${e.title} has moved: now ${dayName(d)} at ${fmtTime(Number(edit.time.split(":")[0]) * 60 + Number(edit.time.split(":")[1] || 0))}${edit.room !== e.room ? `, ${edit.room}` : ""}.`}
              </q>
            )}
            <div className="pt-act">
              <button type="button" className={`sx-btn ${edit.what === "cancel" ? "sx-btn-terra" : "sx-btn-primary"}`} onClick={saveEdit}><Icon name={edit.tell && bookedN ? "send" : "check"} /> {edit.tell && bookedN ? "Save and tell them" : "Save"}</button>
              <button type="button" className="sx-btn" onClick={() => setEditing(false)}>Keep it as it is</button>
            </div>
          </div>
        </section>
      )}

      {!readOnly && (
        <div className={`pt-lead${mine ? " mine" : ""}`}>
          <span><Icon name="users" /> {lead ? <>Led by <b>{mine ? "you" : lead}</b></> : "Nobody’s leading this yet"}</span>
          {!mine && !e.cancelled && <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => { setLeader(e.id, me); say("You’re leading it. It’s at the top of your Today."); }}><Icon name="check" /> I’m leading this</button>}
          <label className="pt-lead-pick">
            <span className="vh">Who’s leading</span>
            <select value={lead ?? ""} onChange={(x) => { setLeader(e.id, x.target.value || null); say(x.target.value ? `${first(x.target.value)} is leading it. They got an alert.` : "Nobody’s leading it."); }}>
              <option value="">Assign someone</option>
              {staff.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
      )}

      {order}
      {detailsSec}
      {printSec}
    </Drawer>
  );
}

/** A printable on a materials note: open it, download it, or send it straight to a printer. */
function FileCard({ f }: { f: Material }) {
  const print = () => {
    // Load it in a hidden frame and open the browser's print dialog, which lists every printer this device can use.
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    frame.src = f.url;
    frame.onload = () => {
      try { frame.contentWindow?.focus(); frame.contentWindow?.print(); } catch { window.open(f.url, "_blank", "noopener"); }
      window.setTimeout(() => frame.remove(), 60_000);
    };
    document.body.appendChild(frame);
    say(`Opening the print dialog for ${f.name}`);
  };
  return (
    <span className="pc-file">
      <a className="pc-file-open" href={f.url} target="_blank" rel="noopener" title="Open it">
        <span className="pc-file-i" aria-hidden="true">{/\.pdf$/i.test(f.name) ? "PDF" : <Icon name="doc" />}</span>
        <span><b>{f.name}</b><small>{f.size}</small></span>
      </a>
      <a className="sx-btn sx-btn-sm" href={f.url} download={f.name}><Icon name="download" /> Download</a>
      <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={print}><Icon name="printer" /> Print</button>
    </span>
  );
}
