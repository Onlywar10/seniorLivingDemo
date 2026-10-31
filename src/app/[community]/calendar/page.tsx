import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import Image from "next/image";
import { Dots } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { CalendarApp, type CalDay, type CalView } from "@/components/calendar/CalendarApp";
import { cats, isLantern, type CalEvent } from "@/data/shared";
import { calendarCopy } from "@/data/communities/copy/events";
import { getCommunity } from "@/lib/community-server";
import { addDays, dayName, fmtTime, fromIso, iso, longDate, monthGrid, monthLabel, nowMinutes, shortDate, sundayOf, today } from "@/lib/clock";
import "@/components/calendar/calendar.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Activity Calendar"),
    description: t(calendarCopy[(await getCommunity()).slug].metaDescription),
  };
}

/** The published month. */
const PUBLISHED = "2026-11-01";

type SP = Promise<{ view?: string; date?: string; lantern?: string }>;

export default async function CalendarPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t: tr } = await getT();
  const c = await getCommunity();
  const { site } = c;
  const copy = calendarCopy[c.slug];
  const eventsOn = c.eventsOn;
  const t = today();
  const todayIso = iso(t);
  const lantern = sp.view === "lantern" || sp.lantern === "1";
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
    if (lantern) q.set("lantern", "1");
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
  const keep = (e: CalEvent) => !lantern || isLantern(e);
  const upNext = eventsOn(t, todayIso).filter((e) => keep(e) && (e.end ?? e.start + 60) > nowMin).slice(0, 3);
  const tomorrow = eventsOn(addDays(t, 1), todayIso).filter(keep).slice(0, 3);

  // The weekly Activity Meeting, read from this community's calendar.
  const meeting = c.eventsBetween(t, 7, todayIso).flatMap((x) => x.events).find((e) => e.title === "Activity Meeting");
  const director = c.team.find((m) => m.dept === "Events & Adventures" && /Director/.test(m.role) && !m.unnamed);

  return (
    <>
      <section className="cal-hero tone-cream">
        <Dots size={240} style={{ right: -70, top: -60, opacity: 0.22 }} />
        <div className="wrap cal-hero-grid">
          <div>
            <nav className="crumbs" aria-label={tr("Breadcrumb")}>
              <Link href="/">{tr("Home")}</Link>
              <span><span aria-hidden="true">/ </span><Link href="/calendar">{tr("Activity Calendar")}</Link></span>
              {lantern && <span><span aria-hidden="true">/ </span><Link href="/calendar?view=lantern">Lantern</Link></span>}
            </nav>
            <p className="eyebrow rise">{tr(lantern ? "Lantern Memory Care" : "Events & Adventures")}</p>
            <h1 className="rise rise-2">{lantern ? <>{tr("The Lantern ")}<em>{tr("calendar")}</em></> : <>{tr("What’s on at ")}<em>{tr(copy.titleEm)}</em></>}</h1>
            <p className="lede rise rise-3">
              {tr(lantern
                ? copy.lanternLede
                : "More than 25 fitness classes a week, clubs and games, live music, faith services and a bus out the door almost every day. Sign up for trips right here, or at the front desk.")}
            </p>
          </div>
          <aside className="cal-next rise rise-3" aria-labelledby="cal-next-h">
            <div className="cal-next-ph">
              <Image src={lantern ? "/img/lantern-garden.jpg" : copy.photo.src} alt={tr(lantern ? "Lantern’s private courtyard garden, with lawn and patio chairs" : copy.photo.alt)} fill sizes="(max-width: 860px) 100vw, 420px" priority />
            </div>
            <div className="cal-next-body">
              <h2 id="cal-next-h">{tr(upNext.length ? "Up next today" : "Tomorrow")}</h2>
              <ol>
                {(upNext.length ? upNext : tomorrow).map((e) => (
                  <li key={e.id} style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
                    <time>{tr(fmtTime(e.start))}</time>
                    <span><b>{tr(e.title)}</b><br />{tr(e.room)}</span>
                  </li>
                ))}
              </ol>
              {upNext.length > 0 && upNext.length < 3 && (
                <>
                  <h3 className="cal-next-sub">{tr("Tomorrow")}</h3>
                  <ol>
                    {tomorrow.slice(0, 3 - upNext.length).map((e) => (
                      <li key={e.id} style={{ "--cat": cats[e.cat].color } as React.CSSProperties}>
                        <time>{tr(fmtTime(e.start))}</time>
                        <span><b>{tr(e.title)}</b><br />{tr(e.room)}</span>
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
            lantern={lantern}
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
              day: `/calendar?view=today${lantern ? "&lantern=1" : ""}&date=`,
              lantern: "/calendar?view=lantern",
              all: `/calendar?view=${view}`,
            }}
            phone={site.phone}
            phoneHref={site.phoneHref}
          />
        </div>
      </section>

      <section className="sec-tight tone-sand cal-notes" aria-labelledby="cal-notes-h">
        <div className="wrap">
          <h2 id="cal-notes-h" className="vh">{tr("Good to know")}</h2>
          <div className="cal-notes-grid">
            <div>
              <Icon name="bus" />
              <h3>{tr("Every bus leaves from the Lobby")}</h3>
              <p>{tr("Please be in the Lobby ten minutes before departure. Seats are limited, so sign up online or at the front desk — if a trip is full, join the waitlist and we’ll call you if a seat opens.")}</p>
            </div>
            {meeting && (
              <div>
                <Icon name="users" />
                <h3>{tr("Help plan next week")}</h3>
                <p>{tr(`${director ? `${director.name}’s` : "The"} Activity Meeting is every ${dayName(fromIso(meeting.date))} at ${fmtTime(meeting.start)} in ${meeting.room}: next week’s events and changes, then drinks and appetizers before happy hour.`)}</p>
              </div>
            )}
            <div>
              <Icon name="heart" />
              <h3>{tr("Families are always welcome")}</h3>
              <p>
                {tr("Join a happy hour, a holiday party or a Sunday matinee with your loved one. Questions about an event? Call us at")}{" "}
                <a href={site.phoneHref}>{site.phone}</a>.
              </p>
            </div>
          </div>
          {!lantern && (
            <p className="cal-lantern-link">
              <Link className="link-arrow" href="/calendar?view=lantern">
                {tr("See the Lantern Memory Care calendar ")}<Icon name="arrow" />
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
