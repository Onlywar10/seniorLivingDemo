import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Dots } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { CalendarApp, type CalDay, type CalView } from "@/components/calendar/CalendarApp";
import { cats, eventsOn, isHarbor, type CalEvent } from "@/data/calendar";
import { site } from "@/data/site";
import { addDays, fmtTime, fromIso, iso, longDate, monthGrid, monthLabel, nowMinutes, shortDate, sundayOf, today } from "@/lib/clock";
import "@/components/calendar/calendar.css";

export const metadata: Metadata = {
  title: "Activity Calendar",
  description:
    "Today’s classes, clubs, bus trips and happy hours at Prairie City Landing in Folsom, CA. Browse by day, week or month, filter by interest, sign up for trips online and print a large-print calendar.",
};

/** The published month. */
const PUBLISHED = "2026-11-01";

type SP = Promise<{ view?: string; date?: string; harbor?: string }>;

export default async function CalendarPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const t = today();
  const todayIso = iso(t);
  const harbor = sp.view === "harbor" || sp.harbor === "1";
  const view: CalView = sp.view === "today" || sp.view === "day" ? "today" : sp.view === "month" ? "month" : "week";

  // Anchor date, kept within a year either side of today.
  let anchor = t;
  if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)) {
    const d = fromIso(sp.date);
    if (!Number.isNaN(d.getTime()) && Math.abs(d.getTime() - t.getTime()) < 366 * 86_400_000) anchor = d;
  }

  const href = (v: CalView, d?: Date) => {
    const q = new URLSearchParams();
    q.set("view", v);
    if (d) q.set("date", iso(d));
    if (harbor) q.set("harbor", "1");
    return `/calendar?${q.toString()}`;
  };

  let dates: Date[];
  let label: string;
  let prev: string, next: string, prevLabel: string, nextLabel: string;
  if (view === "today") {
    dates = [anchor];
    label = longDate(anchor);
    prev = href("today", addDays(anchor, -1));
    next = href("today", addDays(anchor, 1));
    prevLabel = "Previous day";
    nextLabel = "Next day";
  } else if (view === "week") {
    const s = sundayOf(anchor);
    dates = Array.from({ length: 7 }, (_, i) => addDays(s, i));
    const e = dates[6];
    label = `${shortDate(s)} – ${s.getUTCMonth() === e.getUTCMonth() ? e.getUTCDate() : shortDate(e)}, ${e.getUTCFullYear()}`;
    prev = href("week", addDays(s, -7));
    next = href("week", addDays(s, 7));
    prevLabel = "Previous week";
    nextLabel = "Next week";
  } else {
    const y = anchor.getUTCFullYear(), m = anchor.getUTCMonth();
    dates = monthGrid(y, m).flat();
    label = monthLabel(anchor);
    prev = href("month", new Date(Date.UTC(y, m - 1, 1)));
    next = href("month", new Date(Date.UTC(y, m + 1, 1)));
    prevLabel = "Previous month";
    nextLabel = "Next month";
  }

  const days: CalDay[] = dates.map((d) => ({ date: iso(d), events: eventsOn(d, todayIso) }));
  const inRange = days.some((d) => d.date === todayIso);
  const month = view === "month" ? anchor.getUTCMonth() : -1;

  const pub = fromIso(PUBLISHED);
  const showingPublished = view === "month" && anchor.getUTCMonth() === pub.getUTCMonth() && anchor.getUTCFullYear() === pub.getUTCFullYear();
  const publishedHref = !showingPublished && t.getTime() < addDays(pub, 30).getTime() ? href("month", pub) : undefined;

  const nowMin = nowMinutes();
  const keep = (e: CalEvent) => !harbor || isHarbor(e);
  const upNext = eventsOn(t, todayIso).filter((e) => keep(e) && (e.end ?? e.start + 60) > nowMin).slice(0, 3);
  const tomorrow = eventsOn(addDays(t, 1), todayIso).filter(keep).slice(0, 3);

  return (
    <>
      <section className="cal-hero tone-cream">
        <Dots size={240} style={{ right: -70, top: -60, opacity: 0.22 }} />
        <div className="wrap cal-hero-grid">
          <div>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span><span aria-hidden="true">/ </span><Link href="/calendar">Activity Calendar</Link></span>
              {harbor && <span><span aria-hidden="true">/ </span><Link href="/calendar?view=harbor">Harbor</Link></span>}
            </nav>
            <p className="eyebrow rise">{harbor ? "Harbor Memory Care" : "Events & Adventures"}</p>
            <h1 className="rise rise-2">{harbor ? <>The Harbor <em>calendar</em></> : <>What’s on at <em>the Landing</em></>}</h1>
            <p className="lede rise rise-3">
              {harbor
                ? "Harbor keeps its own gentle daily rhythm — gardening, ceramics, storytelling, pet therapy with Thor and a weekly outing — and Harbor residents are invited to every community event too."
                : "More than 25 fitness classes a week, clubs and games, live music, faith services and a bus out the door almost every day. Sign up for trips right here, or at the front desk."}
            </p>
          </div>
          <aside className="cal-next rise rise-3" aria-labelledby="cal-next-h">
            <div className="cal-next-ph">
              <Image src={harbor ? "/img/harbor-garden.jpg" : "/img/drum-circle.jpg"} alt={harbor ? "Harbor’s private courtyard garden, with lawn and patio chairs" : "Residents playing hand drums together at Friday’s Drum Circle"} fill sizes="(max-width: 860px) 100vw, 420px" priority />
            </div>
            <div className="cal-next-body">
              <h2 id="cal-next-h">{upNext.length ? "Up next today" : "Tomorrow"}</h2>
              <ol>
                {(upNext.length ? upNext : tomorrow).map((e) => (
                  <li key={e.id} style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
                    <time>{fmtTime(e.start)}</time>
                    <span><b>{e.title}</b><br />{e.room}</span>
                  </li>
                ))}
              </ol>
              {upNext.length > 0 && upNext.length < 3 && (
                <>
                  <h3 className="cal-next-sub">Tomorrow</h3>
                  <ol>
                    {tomorrow.slice(0, 3 - upNext.length).map((e) => (
                      <li key={e.id} style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
                        <time>{fmtTime(e.start)}</time>
                        <span><b>{e.title}</b><br />{e.room}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="sec-tight tone-white cal-sec" aria-labelledby="cal-heading">
        <div className="wrap">
          <CalendarApp
            view={view}
            harbor={harbor}
            todayIso={todayIso}
            nowMin={nowMin}
            label={label}
            days={days}
            month={month}
            todayInRange={inRange}
            hrefs={{
              today: href("today"),
              week: href("week", view === "week" ? undefined : anchor),
              month: href("month", view === "month" ? undefined : anchor),
              prev,
              next,
              prevLabel,
              nextLabel,
              backToToday: href(view),
              published: publishedHref,
              day: `/calendar?view=today${harbor ? "&harbor=1" : ""}&date=`,
              harbor: "/calendar?view=harbor",
              all: `/calendar?view=${view}`,
            }}
            phone={site.phone}
            phoneHref={site.phoneHref}
          />
        </div>
      </section>

      <section className="sec-tight tone-sand cal-notes" aria-labelledby="cal-notes-h">
        <div className="wrap">
          <h2 id="cal-notes-h" className="vh">Good to know</h2>
          <div className="cal-notes-grid">
            <div>
              <Icon name="bus" />
              <h3>Every bus leaves from the Lobby</h3>
              <p>Please be in the Lobby ten minutes before departure. Seats are limited, so sign up online or at the front desk — if a trip is full, join the waitlist and we’ll call you if a seat opens.</p>
            </div>
            <div>
              <Icon name="users" />
              <h3>Help plan next week</h3>
              <p>Toni Glenn’s Activity Meeting is every Friday at 2:45 pm in The Rendezvous: next week’s events and changes, then drinks and appetizers before happy hour.</p>
            </div>
            <div>
              <Icon name="heart" />
              <h3>Families are always welcome</h3>
              <p>
                Join a happy hour, a holiday party or a Sunday matinee with your loved one. Questions about an event? Call us at{" "}
                <a href={site.phoneHref}>{site.phone}</a>.
              </p>
            </div>
          </div>
          {!harbor && (
            <p className="cal-harbor-link">
              <Link className="link-arrow" href="/calendar?view=harbor">
                See the Harbor Memory Care calendar <Icon name="arrow" />
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
