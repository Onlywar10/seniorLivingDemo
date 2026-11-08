"use client";

// Post: where new information enters Kinlight, and nothing else. Five things can be added (a new event, a month
// imported from paper, an announcement, photos from an event, a resource), each showing afterwards everything that
// happened automatically. Beside them: activity ideas and templates, and the most and least attended this month.
import Link from "next/link";
import { useState } from "react";
import type { AnnounceSetup, IdeaPrefill, ImportSetup, NewEventSetup, PhotoSetup, PlanHelp, ResourceSetup, Template } from "@/data/staff/post";
import { Icon } from "../../Icon";
import { NewEvent, type EventPrefill } from "./NewEvent";
import { Announcement } from "./PostAnnounce";
import { ImportMonth } from "./PostImport";
import { Photos } from "./PostPhotos";
import { Resource } from "./PostResource";

export type PostKind = "event" | "import" | "announcement" | "photos" | "resource";
const POST_KINDS: PostKind[] = ["event", "import", "announcement", "photos", "resource"];

const kinds: Record<PostKind, { label: string; icon: "calendar" | "upload" | "bell" | "image" | "doc"; hint: string }> = {
  event: { label: "New event", icon: "calendar", hint: "One-off or repeating" },
  import: { label: "Import a month", icon: "upload", hint: "From the paper calendar" },
  announcement: { label: "Announcement", icon: "bell", hint: "News that isn’t an event" },
  photos: { label: "Photos", icon: "image", hint: "From an event" },
  resource: { label: "Resource", icon: "doc", hint: "Hours, schedules, policies" },
};

export interface PostDeskProps {
  initial: PostKind;
  /** The kinds this person may add (sales: announcements only). */
  only?: PostKind[];
  /** The old "menu", "change" or "flyer" links still land somewhere sensible. */
  note?: "menu" | "change" | "flyer";
  event?: NewEventSetup;
  idea?: IdeaPrefill;
  imp?: ImportSetup;
  ann: AnnounceSetup[];
  photos?: PhotoSetup;
  res?: ResourceSetup;
  plan?: PlanHelp;
}

export function PostDesk(p: PostDeskProps) {
  const allowed = p.only ?? POST_KINDS;
  const [kind, setKind] = useState<PostKind>(allowed.includes(p.initial) ? p.initial : allowed[0]);
  const [prefill, setPrefill] = useState<{ n: number; ev?: EventPrefill; idea?: IdeaPrefill }>({ n: 0, idea: p.idea });

  const choose = (k: PostKind) => {
    setKind(k);
    try { window.history.replaceState(null, "", `?type=${k}`); } catch { /* the address bar is a convenience only */ }
  };
  const pickTemplate = (t: Template) => { setPrefill((x) => ({ n: x.n + 1, ev: { title: t.title, kind: t.kind, cat: t.cat, minutes: t.minutes, cap: t.cap, interests: t.interests, repeat: t.repeat } })); choose("event"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const pickIdea = (i: IdeaPrefill) => { setPrefill((x) => ({ n: x.n + 1, idea: i })); choose("event"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="po">
      {p.note === "menu" && (
        <div className="sx-callout info">
          <Icon name="fork" />
          <p>Menus have their own section now: upload or photograph the week’s menus in <Link className="sx-link" href="/staff/menus">Menus</Link>, and they publish themselves day by day.</p>
        </div>
      )}
      {allowed.length > 1 && (
        <fieldset className="pt-types">
          <legend className="sx-lbl">What are you adding?</legend>
          {allowed.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => choose(k)}>
              <Icon name={kinds[k].icon} />
              <b>{kinds[k].label}</b>
              <small>{kinds[k].hint}</small>
            </button>
          ))}
        </fieldset>
      )}

      <div className={`po-layout${p.plan ? "" : " solo"}`}>
        <div className="po-main">
          {kind === "event" && p.event && <NewEvent key={prefill.n} setup={p.event} prefill={prefill.ev} idea={prefill.idea} onAnother={() => setPrefill((x) => ({ n: x.n + 1 }))} />}
          {kind === "import" && p.imp && <ImportMonth setup={p.imp} />}
          {kind === "announcement" && <Announcement setups={p.ann} fromChange={p.note === "change"} />}
          {kind === "photos" && p.photos && <Photos setup={p.photos} />}
          {kind === "resource" && p.res && <Resource setup={p.res} fromFlyer={p.note === "flyer"} />}
        </div>
        {p.plan && <PlanAside plan={p.plan} onTemplate={pickTemplate} onIdea={pickIdea} />}
      </div>
    </div>
  );
}

function PlanAside({ plan, onTemplate, onIdea }: { plan: PlanHelp; onTemplate: (t: Template) => void; onIdea: (i: IdeaPrefill) => void }) {
  return (
    <aside className="po-aside" aria-label="Help to plan">
      <section className="sx-card">
        <header className="sx-card-head"><div><h2>Ideas and templates</h2><p>Ready-made events, with what worked here.</p></div></header>
        <ul className="po-tpls">
          {plan.templates.map((t) => (
            <li key={t.k}>
              <button type="button" onClick={() => onTemplate(t)}>
                <b>{t.title}</b>
                <small>{t.worked}</small>
              </button>
            </li>
          ))}
        </ul>
        {plan.ideas.length > 0 && (
          <>
            <h3 className="po-aside-h">From residents</h3>
            <ul className="po-tpls">
              {plan.ideas.map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => onIdea(i)}>
                    <b>“{i.text}”</b>
                    <small>{i.who ?? "No name"} · {i.votes} vote{i.votes === 1 ? "" : "s"} · make it an event</small>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="sx-card">
        <header className="sx-card-head"><div><h2>What worked this month</h2><p>Average attendance per session.</p></div></header>
        <div className="sx-card-body po-worked">
          <h3 className="po-aside-h">Most attended</h3>
          <ol>{plan.most.map((m) => <li key={m.title}><span>{m.title}</span><b>{m.avg}</b><small className={m.trend > 0 ? "up" : m.trend < 0 ? "down" : ""}>{m.trend > 0 ? `▲ ${m.trend}` : m.trend < 0 ? `▼ ${-m.trend}` : "–"}</small></li>)}</ol>
          <h3 className="po-aside-h">Least attended</h3>
          <ol>{plan.least.map((m) => <li key={m.title}><span>{m.title}</span><b>{m.avg}</b><small className={m.trend > 0 ? "up" : m.trend < 0 ? "down" : ""}>{m.trend > 0 ? `▲ ${m.trend}` : m.trend < 0 ? `▼ ${-m.trend}` : "–"}</small></li>)}</ol>
          <p className="sx-hint">▲▼ against last month. From QR check-ins and attendance taken by staff; more in Reports.</p>
        </div>
      </section>
    </aside>
  );
}
