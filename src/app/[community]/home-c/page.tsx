import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { getCommunity } from "@/lib/community-server";
import { cats, isLantern, money, tagLabels, type CalEvent, type Tag } from "@/data/shared";
import { diningCopy } from "@/data/communities/copy/dining";
import { homeCopy } from "@/data/communities/copy/home";
import { tourCopy } from "@/data/communities/copy/tour";
import { addDays, dayName, fmtRange, fmtTime, iso, longDate, nowMinutes, shortDate, today } from "@/lib/clock";
import { Icon } from "@/components/Icon";
import { TourPill } from "../_alt/TourPill";
import "./home-c.css";

// An alternative community homepage built around today: why you'd want to live here, proved live by what's on
// now and next, today's specials, the whole day and the week ahead, with "Book a tour" as the main call to
// action throughout. Reached only by its address; nothing links here.

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCommunity();
  return {
    title: { absolute: `${c.site.name} · Life Here Today` },
    description: `${c.site.independent} See what’s happening today at ${c.site.name} in ${c.site.address.city}, CA, then book a tour.`,
    robots: { index: false, follow: false },
  };
}

const POUR = "Pour of the day: ";

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
const hourLabel = (h: number) => fmtTime(h * 60).replace(":00", "");

export default async function CommunityToday() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, venues, living, pricing } = c;
  const dining = diningCopy[c.slug];
  const tour = tourCopy[c.slug];
  const [lead, ...voices] = c.testimonials;
  const d0 = today();
  const now = nowMinutes();
  const events = c.eventsOn(d0);
  const tomorrow = c.eventsOn(addDays(d0, 1), iso(d0));

  const happening = events.filter((e) => e.start <= now && (e.end ?? e.start + 60) > now);
  const upcoming = events.filter((e) => e.start > now).slice(0, 3);
  const nextUp = upcoming.length ? upcoming : tomorrow.slice(0, 3);
  const nextIsTomorrow = upcoming.length === 0;

  const menus = c.venueOrder.map((v) => c.menuFor(v, d0));
  const soup = menus[0]?.soup;

  // The whole day, by the hour it starts.
  const hours = [...new Set(events.map((e) => Math.floor(e.start / 60)))].sort((a, b) => a - b);
  const usedCats = [...new Set(events.map((e) => e.cat))];

  // The rest of the week: highlights per day (one-off events and trips first) and the restaurant special.
  const week = c.eventsBetween(addDays(d0, 1), 6, iso(d0)).map(({ date, events: ev }) => {
    const main = ev.filter((e) => !isLantern(e));
    const top = (e: CalEvent) => (e.special || e.cat === "trips") && !/^Shopping/.test(e.title);
    const picks = [...main.filter(top), ...main.filter((e) => !top(e))].slice(0, 3).sort((a, b) => a.start - b.start);
    return { date, count: ev.length, picks, dinner: c.menuFor(c.venueOrder[0], date) };
  });

  const tourButton = (id?: string, size = "btn-lg") => (
    <Link id={id} className={`btn ${size} cc-tour`} href="/tour">
      <Icon name="calendar" /> {t("Book a tour")}
    </Link>
  );
  const tourLine = tour.lunchOnUs ? "Tour the apartments, meet the team and stay for lunch in one of our three restaurants — it’s on us." : "Tour the apartments, meet the team and see the three restaurants for yourself.";

  return (
    <div className="cc">
      {/* ---------- Hero: why live here, with today as proof ---------- */}
      <section className="cc-board" aria-labelledby="cc-hero-h">
        <div className="cc-wrap cc-hero-grid">
          <div className="cc-hero-text">
            <p className="cc-kicker">{t(`${site.name} · ${site.address.city}, California`)}</p>
            <h1 id="cc-hero-h">{t(site.independent)}</h1>
            <p className="cc-hero-lede">{t(`Here’s ${longDate(d0)}, straight from our calendar and menus.`)}</p>
            <div className="btn-row">
              {tourButton("cc-hero-cta")}
              <a className="btn btn-outline-light btn-lg" href={site.phoneHref}>
                <Icon name="phone" /> {site.phone}
              </a>
            </div>
            <p className="cc-hero-note">{t(tour.lunchOnUs ? "In person or on video. Lunch is our treat when you visit." : `In person or on video.${tour.hoursFact}.`)}</p>
          </div>

          <div className="cc-live">
            <p className="cc-live-top">
              <span className="cc-label">
                <span className="cc-dot" aria-hidden="true" /> {t("Live from today’s calendar")}
              </span>
              <span className="cc-clock">{t(`As of ${fmtTime(now)}`)}</span>
            </p>
            <div className="cc-now">
              <p className="cc-sub">{t("Happening now")}</p>
              {happening.length > 0 ? (
                <ul>
                  {happening.slice(0, 2).map((e) => (
                    <li key={e.id} style={catStyle(e)}>
                      <span className="cc-now-time">{t(fmtRange(e.start, e.end))}</span>
                      <b>{t(e.title)}</b>
                      <span className="cc-now-meta">{[t(cats[e.cat].label), e.room && t(e.room)].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="cc-quiet">{t(nextIsTomorrow ? homeCopy[c.slug].wrapUp : homeCopy[c.slug].quiet)}</p>
              )}
            </div>
            <div className="cc-next">
              <p className="cc-sub">{t(nextIsTomorrow ? `Tomorrow, ${shortDate(addDays(d0, 1))}` : "Up next")}</p>
              <ol>
                {nextUp.map((e) => (
                  <li key={e.id} style={catStyle(e)}>
                    <span className="cc-next-time">{t(fmtTime(e.start))}</span>
                    <span>
                      <b>{t(e.title)}</b>
                      <span className="cc-next-cat">{t(cats[e.cat].label)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- A resident's word ---------- */}
      {lead && (
        <section className="cc-pull" aria-label={t("In their words")}>
          <figure className="cc-wrap">
            <blockquote>
              <p>{t(lead.quote)}</p>
            </blockquote>
            <figcaption>
              <b data-no-translate>{lead.name}</b> · {t(lead.relation)}
            </figcaption>
          </figure>
        </section>
      )}

      {/* ---------- Today's specials ---------- */}
      <section className="cc-sec cc-specials-sec" aria-labelledby="cc-specials-h">
        <div className="cc-wrap">
          <div className="cc-head">
            <div className="cc-head-text">
              <p className="eyebrow">{t("Dining")}</p>
              <h2 id="cc-specials-h">
                {t("Chef-cooked, ")}
                <em>{t("every day.")}</em>
              </h2>
              <p>{t(dining.lede)}</p>
            </div>
            {soup && (
              <p className="cc-soup">
                <span>{t("Soup of the day")}</span> <b>{t(soup.name)}</b> <Tags tags={soup.tags} t={t} />
              </p>
            )}
          </div>
          <div className="cc-cards">
            {menus.map((m) => {
              const v = venues[m.venue];
              const photo = dining.venuePhotos[m.venue]?.second;
              const pour = m.special.name.startsWith(POUR);
              const open = now >= v.open && now < v.close;
              return (
                <article key={m.venue} className="cc-card">
                  {photo && (
                    <div className="cc-card-ph">
                      <Image src={photo[0]} alt={t(photo[1])} fill sizes="(max-width: 900px) 100vw, 33vw" />
                      <span className={`cc-open ${open ? "is-open" : ""}`}>{t(open ? "Open now" : "Closed now")}</span>
                    </div>
                  )}
                  <div className="cc-card-body">
                    <p className="cc-card-venue">
                      {v.name} <span>{t(v.hours)}</span>
                    </p>
                    <p className="cc-card-k">{t(pour ? "Pour of the day" : m.holiday ? m.holiday : "Chef’s special")}</p>
                    <h3>
                      {t(pour ? m.special.name.slice(POUR.length) : m.special.name)} <Tags tags={m.special.tags} t={t} />
                    </h3>
                    {m.special.desc && <p className="cc-card-desc">{t(m.special.desc)}</p>}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="cc-cta">
            <p>{t(tour.lunchOnUs ? `Taste it for yourself.${tour.lunchNote}` : "Taste it for yourself: see the three restaurants on your tour.")}</p>
            <div className="btn-row">
              {tourButton(undefined, "")}
              <Link className="link-arrow" href="/dining">
                {t("Today’s full menus")} <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- The whole day ---------- */}
      <section className="cc-sec cc-day-sec" aria-labelledby="cc-day-h">
        <div className="cc-wrap">
          <div className="cc-head">
            <div className="cc-head-text">
              <p className="eyebrow">{t("Activities")}</p>
              <h2 id="cc-day-h">
                {t("Something on, ")}
                <em>{t("morning to evening.")}</em>
              </h2>
              <p>{t("Today’s real calendar: classes, clubs, outings and music. Join in, or keep the afternoon quiet. It’s your call.")}</p>
            </div>
            <ul className="cc-legend" aria-label={t("Kinds of activity")}>
              {usedCats.map((k) => (
                <li key={k} style={{ "--cat": cats[k].color } as CSSProperties}>
                  {t(cats[k].label)}
                </li>
              ))}
            </ul>
          </div>
          {hours.length === 0 ? (
            <p className="muted">{t("A quiet day on the calendar.")}</p>
          ) : (
            <ol className="cc-hours">
              {hours.map((h) => (
                <li key={h} className={h * 60 + 59 < now ? "is-past" : ""}>
                  <span className="cc-hour">{t(hourLabel(h))}</span>
                  <ul>
                    {events
                      .filter((e) => Math.floor(e.start / 60) === h)
                      .map((e) => (
                        <li key={e.id} style={catStyle(e)} className="cc-chip">
                          <b>{t(e.title)}</b>
                          <span>
                            {t(fmtRange(e.start, e.end))}
                            {isLantern(e) ? ` · ${t("Lantern")}` : ""}
                          </span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ---------- The rest of the week ---------- */}
      <section className="cc-sec cc-week-sec" aria-labelledby="cc-week-h">
        <div className="cc-wrap">
          <div className="cc-head">
            <div className="cc-head-text">
              <p className="eyebrow">{t("The week ahead")}</p>
              <h2 id="cc-week-h">
                {t("Pick a day ")}
                <em>{t("to visit.")}</em>
              </h2>
              <p>{t("Every day brings something different. Come on the day that suits you and see it for yourself.")}</p>
            </div>
          </div>
          <ol className="cc-week">
            {week.map((w) => (
              <li key={iso(w.date)}>
                <Link href={`/calendar?view=day&date=${iso(w.date)}`} className="cc-week-card">
                  <span className="cc-week-day">
                    <b>{t(dayName(w.date).slice(0, 3))}</b> {w.date.getUTCDate()}
                  </span>
                  <span className="cc-week-n">{t(`${w.count} events`)}</span>
                  <ul>
                    {w.picks.map((e) => (
                      <li key={e.id} style={catStyle(e)}>
                        <span>{t(fmtTime(e.start))}</span> {t(e.title)}
                      </li>
                    ))}
                  </ul>
                  <span className="cc-week-dinner">
                    <Icon name="fork" /> {t(w.dinner.holiday ?? w.dinner.special.name)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="cc-cta">
            <p>{t(tour.lede)}</p>
            <div className="btn-row">
              {tourButton(undefined, "")}
              <Link className="link-arrow" href="/calendar">
                {t("Full calendar")} <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Living options and voices ---------- */}
      <section className="cc-sec cc-why" aria-labelledby="cc-why-h">
        <div className="cc-wrap">
          <div className="cc-head">
            <div className="cc-head-text">
              <p className="eyebrow">{t("Living options")}</p>
              <h2 id="cc-why-h">
                {t("Your apartment, ")}
                <em>{t("your terms.")}</em>
              </h2>
            </div>
          </div>
          <div className="cc-why-grid">
            <ul className="cc-levels">
              {(["independent", "assisted", "lantern"] as const).map((k) => (
                <li key={k}>
                  <Link href={living[k].href}>
                    <span className="cc-level-from">{t(k === "assisted" ? `${money(pricing.assistedBase)} a month base fee, plus care plan` : living[k].from)}</span>
                    <b>{t(living[k].name)}</b>
                    <span className="cc-level-lede">{t(living[k].lede)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="cc-voices">
              {voices.slice(0, 2).map((q) => (
                <figure key={q.name + q.quote.slice(0, 12)}>
                  <blockquote>
                    <p>{t(q.quote)}</p>
                  </blockquote>
                  <figcaption>
                    <b data-no-translate>{q.name}</b> · {t(q.relation)}
                  </figcaption>
                </figure>
              ))}
              <p className="cc-second">
                <Icon name="users" /> <span>{t(`No second-person fee: couples save about ${money(pricing.secondPersonSaving)} a year.`)}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Closing ---------- */}
      <section className="cc-sec cc-lunch" aria-labelledby="cc-lunch-h">
        <div className="cc-wrap cc-lunch-grid">
          <div className="cc-lunch-ph">
            <Image src={dining.lunchPhoto[0]} alt={t(dining.lunchPhoto[1])} fill sizes="(max-width: 900px) 100vw, 50vw" />
          </div>
          <div>
            <p className="eyebrow">{t(`Visit ${site.name}`)}</p>
            <h2 id="cc-lunch-h">
              {t("Come and see it ")}
              <em>{t("on a real day.")}</em>
            </h2>
            <p className="cc-lunch-lede">{t(tourLine)}</p>
            <div className="btn-row">
              {tourButton()}
              <Link className="btn btn-ghost btn-lg" href="/dining#lunch">
                {t("Reserve lunch")}
              </Link>
            </div>
            <p className="cc-call">
              <a href={site.phoneHref}>
                <Icon name="phone" /> {site.phone}
              </a>{" "}
              · {t(site.hoursOffice)}
            </p>
            <p className="cc-call">
              <Link href="/floor-plans">{t("Floor plans & pricing")}</Link>
            </p>
          </div>
        </div>
      </section>

      <TourPill watch="cc-hero-cta" />
    </div>
  );
}
