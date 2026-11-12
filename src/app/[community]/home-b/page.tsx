import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { getCommunity } from "@/lib/community-server";
import { cats, isLantern, money, tagLabels, type CalEvent, type DayMenu, type Tag } from "@/data/shared";
import { keyPeople } from "@/data/communities/copy/living";
import { tourCopy } from "@/data/communities/copy/tour";
import { addDays, dayName, fmtRange, iso, longDate, shortDate, today } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { TourPill } from "../_alt/TourPill";
import "./home-b.css";

// An alternative community homepage built around the week ahead: why you'd want to live here, proved by the
// real calendar and menus for the next seven days, with "Book a tour" as the main call to action throughout.
// Reached only by its address; nothing links here.

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCommunity();
  return {
    title: { absolute: `${c.site.name} · A Week at ${c.site.name}` },
    description: `${c.site.tagline} See a real week at ${c.site.name} in ${c.site.address.city}, CA, then book a tour.`,
    robots: { index: false, follow: false },
  };
}

const POUR = "Pour of the day: ";
const DAYS = 7;
/** Days shown in full before "See the rest of the week". */
const OPEN_DAYS = 3;
/** Activities listed per day before "more on the calendar". */
const PER_DAY = 5;

function Tags({ tags, t }: { tags?: Tag[]; t: (s: string) => string }) {
  if (!tags?.length) return null;
  return (
    <>
      {tags.map((tag) => (
        <abbr key={tag} className={`tag tag-${tag}`} title={t(tagLabels[tag])}>
          {tag}
        </abbr>
      ))}
    </>
  );
}

const catStyle = (e: CalEvent) => ({ "--cat": cats[e.cat].color }) as CSSProperties;

export default async function CommunityWeek() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, venues, pricing, living } = c;
  const tour = tourCopy[c.slug];
  const people = keyPeople(c);
  const d0 = today();
  const week = c.eventsBetween(d0, DAYS, iso(d0)).map(({ date, events }) => ({
    date,
    events: events.filter((e) => !isLantern(e)),
    lantern: events.filter(isLantern).length,
    menus: c.venueOrder.map((v) => c.menuFor(v, date)),
  }));
  const total = week.reduce((n, w) => n + w.events.length + w.lantern, 0);
  const perDay = Math.round(total / DAYS);
  const end = addDays(d0, DAYS - 1);

  // One standout a day: a trip or a one-off event, not the regular shopping run.
  const standout = (e: CalEvent) => (e.special || e.cat === "trips") && !/^Shopping/.test(e.title);
  const circled = week
    .flatMap((w) => {
      const e = w.events.find((x) => standout(x) && x.cat === "trips") ?? w.events.find(standout);
      return e ? [{ e, date: w.date }] : [];
    })
    .slice(0, 4);

  const dish = (m: DayMenu) => {
    const pour = m.special.name.startsWith(POUR);
    return {
      venue: venues[m.venue].name,
      label: pour ? "Pour of the day" : m.holiday ? m.holiday : "Chef’s special",
      name: pour ? m.special.name.slice(POUR.length) : m.special.name,
      desc: m.special.desc,
      tags: m.special.tags,
    };
  };

  const tourButton = (id?: string, light = false) => (
    <Link id={id} className={`btn btn-lg cb-tour ${light ? "btn-light" : ""}`} href="/tour">
      <Icon name="calendar" /> {t("Book a tour")}
    </Link>
  );

  const day = (w: (typeof week)[number], i: number, compact = false) => {
    const shown = w.events.slice(0, compact ? 4 : PER_DAY);
    const more = w.events.length - shown.length + w.lantern;
    const soup = w.menus[0]?.soup;
    return (
      <article key={iso(w.date)} className={`cb-day ${i === 0 ? "is-today" : ""} ${compact ? "is-compact" : ""}`} aria-labelledby={`cb-${iso(w.date)}-h`}>
        <header className="cb-day-date">
          {i === 0 && <span className="cb-today-pill">{t("Today")}</span>}
          <h3 id={`cb-${iso(w.date)}-h`}>
            <span className="cb-dow">{t(dayName(w.date))}</span>
            <span className="cb-dnum">{w.date.getUTCDate()}</span>
            <span className="cb-mon">{t(shortDate(w.date).slice(0, 3))}</span>
          </h3>
        </header>
        <div className="cb-day-events">
          <ul>
            {shown.map((e) => (
              <li key={e.id} style={catStyle(e)}>
                <span className="cb-time">{t(fmtRange(e.start, e.end))}</span>
                <b>{t(e.title)}</b>
              </li>
            ))}
          </ul>
          {more > 0 && (
            <Link className="cb-more" href={`/calendar?view=day&date=${iso(w.date)}`}>
              {t(`+ ${more} more on the calendar`)}
            </Link>
          )}
        </div>
        <aside className="cb-table" aria-label={t(`Menus for ${dayName(w.date)}`)}>
          <p className="cb-table-h">
            <Icon name="fork" /> {t("On the menu")}
          </p>
          <ul>
            {(compact ? w.menus.slice(0, 1) : w.menus).map((m) => {
              const x = dish(m);
              return (
                <li key={m.venue}>
                  <span className="cb-venue">
                    {x.venue} · {t(x.label)}
                  </span>
                  <b>
                    {t(x.name)} <Tags tags={x.tags} t={t} />
                  </b>
                  {!compact && x.desc && <span className="cb-desc">{t(x.desc)}</span>}
                </li>
              );
            })}
          </ul>
          {!compact && soup && (
            <p className="cb-soup">
              {t("Soup of the day: ")}
              {t(soup.name)}
            </p>
          )}
        </aside>
      </article>
    );
  };

  return (
    <div className="cb">
      {/* ---------- Hero: why live here ---------- */}
      <section className="cb-hero" aria-labelledby="cb-hero-h">
        <div className="cb-wrap cb-hero-grid">
          <div>
            <p className="eyebrow">{t(`${site.name} · ${site.address.city}, California`)}</p>
            <h1 id="cb-hero-h">{t(site.lifestyle)}</h1>
            <p className="cb-lede">
              {t(site.tagline)}
            </p>
            <div className="btn-row">
              {tourButton("cb-hero-cta")}
              <a className="btn btn-ghost btn-lg" href={site.phoneHref}>
                <Icon name="phone" /> {site.phone}
              </a>
            </div>
            <p className="cb-hero-note">{t(tour.lunchOnUs ? "In person or on video. Lunch is our treat when you visit." : `In person or on video.${tour.hoursFact}.`)}</p>
          </div>
          <div className="cb-hero-ph">
            <Image src="/img/wine-toast.jpg" alt={t("Friends raising glasses of wine at happy hour")} fill priority sizes="(max-width: 900px) 100vw, 45vw" />
            <p className="cb-hero-badge">
              <b>{total}</b> {t(`things to do in the next seven days, ${longDate(d0)} to ${longDate(end)}`)}
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Proof points ---------- */}
      <section className="cb-proof" aria-label={t(`Why ${site.name}`)}>
        <ul className="cb-wrap">
          <li>
            <b>{t(`${perDay} a day`)}</b>
            <span>{t("Classes, clubs, outings and music on the calendar, on average, this week")}</span>
          </li>
          <li>
            <b>{t(`${c.venueOrder.length} restaurants`)}</b>
            <span>{t("A chef’s special in each one, every day")}</span>
          </li>
          <li>
            <b>{t("No move")}</b>
            <span>{t("Assisted Living Services come to any apartment if needs change")}</span>
          </li>
          <li>
            <b>{money(pricing.secondPersonSaving)}</b>
            <span>{t("A year saved by couples: there’s no second-person fee")}</span>
          </li>
        </ul>
      </section>

      {/* ---------- Standouts ---------- */}
      {circled.length > 0 && (
        <section className="cb-sec cb-circled" aria-labelledby="cb-circled-h">
          <div className="cb-wrap">
            <div className="cb-head">
              <p className="eyebrow">{t("Say yes to something new")}</p>
              <h2 id="cb-circled-h">
                {t("This week’s ")}
                <em>{t("adventures")}</em>
              </h2>
              <p>{t("Trips, outings and special events, planned with residents at the Friday Activity Meeting. Come along on your tour and see what’s happening that day.")}</p>
            </div>
            <ul className="cb-tickets">
              {circled.map(({ e, date }) => (
                <li key={e.id} style={catStyle(e)}>
                  <p className="cb-ticket-when">
                    <b>{t(dayName(date))}</b> {t(shortDate(date))} · {t(fmtRange(e.start, e.end))}
                  </p>
                  <h3>{t(e.title)}</h3>
                  {e.desc && <p className="cb-ticket-desc">{t(e.desc)}</p>}
                  <p className="cb-ticket-cat">{t(cats[e.cat].label)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- The week ---------- */}
      <section className="cb-sec cb-days-sec" aria-labelledby="cb-days-h">
        <div className="cb-wrap">
          <div className="cb-head">
            <p className="eyebrow">{t("Something to look forward to")}</p>
            <h2 id="cb-days-h">
              {t("Every day, ")}
              <em>{t("something on.")}</em>
            </h2>
            <p>{t("This is our real calendar for the days ahead, with what the chefs are cooking alongside. Join in, or keep the afternoon quiet: it’s your call.")}</p>
          </div>
          <div className="cb-days">
            {week.slice(0, OPEN_DAYS).map((w, i) => (
              day(w, i)
            ))}
          </div>
          <details className="cb-rest">
            <summary>
              <span>{t(`See the rest of the week: ${dayName(week[OPEN_DAYS].date)} to ${dayName(end)}`)}</span> <Icon name="chev" />
            </summary>
            <div className="cb-days cb-days-compact">
              {week.slice(OPEN_DAYS).map((w, i) => (
                day(w, i + OPEN_DAYS, true)
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* ---------- Tour band ---------- */}
      <section className="cb-band" aria-labelledby="cb-band-h">
        <div className="cb-wrap cb-band-grid">
          <div>
            <h2 id="cb-band-h">{t("See a day like this for yourself.")}</h2>
            <p>{t(tour.lede)}</p>
          </div>
          <div className="cb-band-actions">
            {tourButton(undefined, true)}
            <Link className="cb-band-link" href="/calendar">
              {t("Browse the full calendar")}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Voices ---------- */}
      <section className="cb-sec cb-voices" aria-labelledby="cb-voices-h">
        <div className="cb-wrap">
          <div className="cb-head">
            <p className="eyebrow">{t("In their words")}</p>
            <h2 id="cb-voices-h">
              {t("Why people ")}
              <em>{t("love it here")}</em>
            </h2>
          </div>
          <div className="cb-quotes">
            {c.testimonials.slice(0, 3).map((q) => (
              <figure key={q.name + q.quote.slice(0, 12)}>
                <blockquote>
                  <p>{t(q.quote)}</p>
                </blockquote>
                <figcaption>
                  <b data-no-translate>{q.name}</b> · {t(q.relation)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Rent and care ---------- */}
      <section className="cb-sec cb-living" aria-labelledby="cb-living-h">
        <div className="cb-wrap cb-living-grid">
          <div>
            <p className="eyebrow">{t("Living options")}</p>
            <h2 id="cb-living-h">
              {t("One monthly rent, ")}
              <em>{t("and help when you want it.")}</em>
            </h2>
            <ul className="cb-incl">
              {pricing.included.map((x) => (
                <li key={x}>
                  <Icon name="check" /> {t(x)}
                </li>
              ))}
            </ul>
          </div>
          <ul className="cb-levels">
            {(["independent", "assisted", "lantern"] as const).map((k) => (
              <li key={k}>
                <Link href={living[k].href}>
                  <span className="cb-level-from">{t(k === "assisted" ? `${money(pricing.assistedBase)} a month base fee, plus care plan` : living[k].from)}</span>
                  <b>{t(living[k].name)}</b>
                  <span className="cb-level-lede">{t(living[k].lede)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Closing ---------- */}
      <section className="cb-close" aria-labelledby="cb-close-h">
        <div className="cb-wrap cb-close-grid">
          <div className="cb-close-ph">
            <Image src="/img/friends-laugh.jpg" alt={t("Two residents laughing together")} fill sizes="(max-width: 900px) 100vw, 40vw" />
          </div>
          <div>
            <p className="eyebrow">{t(`Visit ${site.name}`)}</p>
            <h2 id="cb-close-h">
              {t("Your week could ")}
              <em>{t("look like this.")}</em>
            </h2>
            <p className="cb-lede">{t(tour.lunchOnUs ? "Tour the apartments, meet the team and stay for lunch in one of our three restaurants — it’s on us." : "Tour the apartments, meet the team and see the three restaurants for yourself.")}</p>
            <div className="btn-row">
              {tourButton()}
              <a className="btn btn-ghost btn-lg" href={site.phoneHref}>
                <Icon name="phone" /> {site.phone}
              </a>
            </div>
            {people.relations && !people.relations.unnamed && <p className="small muted cb-ask">{t(`Ask for ${people.relations.name}, our ${people.relations.role}.`)}</p>}
            <p className="cb-secondary">
              <Link href="/floor-plans">{t("Floor plans & pricing")}</Link> · <Link href="/dining">{t("Today’s menus")}</Link> · <Link href="/calendar">{t("Activity calendar")}</Link>
            </p>
          </div>
        </div>
      </section>

      <TourPill watch="cb-hero-cta" />
    </div>
  );
}
