"use client";

// Post: where anything new is created, and where events are changed. Three things: an event, an announcement, or an
// import (a calendar, a whiteboard, a note or a menu, read by Kinlight). Blog and social posts come later. Edit on an
// event in Calendar or Today opens here too (?edit=<id>&date=<date>), with the event filled in. Photos live on each
// event in Calendar; resources on the Website; planning help in Calendar → Plan.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { Cat } from "@/data/shared";
import type { CalEvent } from "@/data/staff/calEvents";
import type { Interest } from "@/data/staff/engage";
import type { PreviewSetup } from "@/data/staff/pool";
import type { AnnounceSetup, IdeaPrefill, ImportSetup, NewEventSetup } from "@/data/staff/post";
import { Icon } from "../../Icon";
import { applyChanges, keyOf, useEventChanges } from "../eventStore";
import { useLeaders } from "../store";
import { AnnounceForm } from "./AnnounceForm";
import { leaderOf } from "./EventSheet";
import { NewEvent, type EventPrefill } from "./NewEvent";
import { Import } from "./PostImport";

export type PostKind = "event" | "announcement" | "import";
const POST_KINDS: PostKind[] = ["event", "announcement", "import"];

const kinds: Record<PostKind, { label: string; icon: "calendar" | "upload" | "bell"; hint: string }> = {
  event: { label: "Event", icon: "calendar", hint: "One-off or repeating" },
  announcement: { label: "Announcement", icon: "bell", hint: "News that isn’t an event" },
  import: { label: "Import", icon: "upload", hint: "A calendar, note or menu" },
};
const later = [
  { label: "Blog post", icon: "doc" as const, when: "Coming in Beta" },
  { label: "Social post", icon: "share" as const, when: "Coming in Full House" },
];

/** An event to change, opened from Calendar or Today. `date` is the date it had on the calendar to begin with. */
export interface EditTarget { id: string; date: string; base?: CalEvent; back: { href: string; label: string } }

export interface PostDeskProps {
  initial: PostKind;
  /** The kinds this person may add (sales: announcements only). */
  only?: PostKind[];
  event?: NewEventSetup;
  idea?: IdeaPrefill;
  /** Start a new event on this day, or from this template (Calendar's "+ Add"). */
  prefill?: EventPrefill;
  imp?: ImportSetup;
  ann: AnnounceSetup[];
  preview?: PreviewSetup;
  edit?: EditTarget;
}

export function PostDesk(p: PostDeskProps) {
  const allowed = p.only ?? POST_KINDS;
  const [kind, setKind] = useState<PostKind>(allowed.includes(p.initial) ? p.initial : allowed[0]);
  const [n, setN] = useState(0);

  const choose = (k: PostKind) => {
    setKind(k);
    try { window.history.replaceState(null, "", `?type=${k}`); } catch { /* the address bar is a convenience only */ }
  };

  if (p.edit && p.event) return <div className="po"><div className="po-main"><EditEvent edit={p.edit} setup={p.event} preview={p.preview} /></div></div>;

  return (
    <div className="po">
      {allowed.length > 1 && (
        <div className="pt-types po-types" role="group" aria-label="What are you adding?">
          {allowed.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => choose(k)}>
              <Icon name={kinds[k].icon} />
              <b>{kinds[k].label}</b>
              <small>{kinds[k].hint}</small>
            </button>
          ))}
          {later.map((x) => (
            <button key={x.label} type="button" className="po-later" disabled aria-disabled="true">
              <Icon name={x.icon} />
              <b>{x.label}</b>
              <small>{x.when}</small>
            </button>
          ))}
        </div>
      )}

      <div className="po-main">
        {kind === "event" && p.event && <NewEvent key={n} setup={p.event} preview={p.preview} idea={n === 0 ? p.idea : undefined} prefill={n > 0 ? {} : p.prefill} onAnother={() => setN((x) => x + 1)} />}
        {kind === "announcement" && <AnnounceForm card setups={p.ann} />}
        {kind === "import" && p.imp && <Import setup={p.imp} eventSetup={p.event} />}
      </div>
    </div>
  );
}

const noop = () => () => {};
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Change an event that's on the calendar: the event as this browser has it (with earlier changes), in the same form. */
function EditEvent({ edit, setup, preview }: { edit: EditTarget; setup: NewEventSetup; preview?: PreviewSetup }) {
  const router = useRouter();
  const ch = useEventChanges();
  const leaders = useLeaders();
  // This browser's changes are only known once the page is running, so the form waits for them.
  const ready = useSyncExternalStore(noop, () => true, () => false);
  if (!ready) return <div className="sx-card sx-card-body po-wait" aria-busy="true">Opening the event…</div>;
  const k = `${edit.id}@${edit.date}`;
  const e = applyChanges(edit.base ? [edit.base] : [], ch).find((x) => keyOf(x) === k);
  if (!e) {
    return (
      <div className="sx-card sx-card-body po-done">
        <p>That event isn’t on the calendar any more.</p>
        <div className="pt-act"><Link className="sx-btn sx-btn-primary" href={edit.back.href}><Icon name="left" /> {edit.back.label}</Link></div>
      </div>
    );
  }
  const lead = leaderOf(e, leaders);
  return (
    <NewEvent
      key={k}
      setup={setup}
      preview={preview}
      back={edit.back}
      editing={{ id: e.id, title: e.title, date: e.date, orig: e.orig, start: e.start, room: e.room, desc: e.desc, cost: e.cost, lantern: e.lantern, rule: e.rule, newsletter: e.newsletter }}
      prefill={{ leader: lead ?? "", lantern: e.lantern, title: e.title, date: e.date, time: hhmm(e.start), minutes: (e.end ?? e.start + 60) - e.start, kind: e.kind, cap: e.cap, repeat: !!e.rule, room: e.room, cat: e.cat as Cat, interests: (e.interests ?? e.invites?.interests ?? []) as Interest[], photos: !!e.wanted, plan: e.plan, stops: e.stops }}
      onCancel={() => router.push(edit.back.href)}
    />
  );
}
