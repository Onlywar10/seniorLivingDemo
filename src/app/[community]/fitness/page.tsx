import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import "@/components/brand/brand.css";
import { getCommunity } from "@/lib/community-server";
import { firstName, keyPeople } from "@/data/communities/copy/living";
import { fitnessCopy } from "@/data/communities/copy/fitness";
import { tourCopy } from "@/data/communities/copy/tour";
import { dayName, fmtTime, fromIso, iso, monthName, today } from "@/lib/clock";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Monogram, PersonCard } from "@/components/brand/Monogram";
import { WeekEvents } from "@/components/brand/WeekEvents";
import { TourBand } from "@/components/brand/TourBand";
import { Gallery } from "@/components/brand/Gallery";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Fitness"),
    description: t(fitnessCopy[(await getCommunity()).slug].metaDescription),
  };
}

const icon = (i: number) => (["sun", "pin", "music", "spark", "heart", "wand", "sparkle", "dumbbell"] as const)[i % 8];

export default async function Fitness() {
  const { t } = await getT();
  const c = await getCommunity();
  const { fitness, instructors } = c;
  const copy = fitnessCopy[c.slug];
  const director = keyPeople(c).fitness;
  const directorFirst = firstName(director);
  const d = today();
  const week = c.eventsBetween(d, 7, iso(d)).map((x) => ({ date: iso(x.date), events: x.events.filter((e) => e.cat === "fitness") }));
  const classCount = week.reduce((n, x) => n + x.events.length, 0);
  const monthly = copy.monthly;
  const hhDate = fromIso(monthly?.date ?? iso(d));
  const hh = monthly ? c.eventsOn(hhDate).find((e) => e.title.startsWith(monthly.titleStarts)) : undefined;
  const fitInstructors = instructors.filter((i) => copy.instructorNames.includes(i.name));

  return (
    <>
      <PageHero
        eyebrow="Fitness"
        title={
          <>
            {t("Keep moving. ")}<em>{t("Keep living.")}</em>
          </>
        }
        lede={fitness.intro}
        photo="/img/fitness-barbell.jpg"
        alt="A resident lifting a dumbbell during a strength class"
        crumbs={[
          ["Lifestyle", "/lifestyle"],
          ["Fitness", "/fitness"],
        ]}
      >
        <div className="btn-row">
          <Link className="btn" href="#classes">
            {t("This week’s classes")}
          </Link>
          <Link className="btn btn-ghost" href="/calendar">
            {t("Full calendar")}
          </Link>
        </div>
      </PageHero>

      <section className="sec tone-white" aria-labelledby="br-fitdir-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">{t("Meet your Fitness Director")}</p>
            <h2 id="br-fitdir-h">
              {t("Fitness is better ")}<em>{t("with friends.")}</em>
            </h2>
            {director && !director.unnamed && (
              <div className="br-person-card" style={{ marginTop: 24, boxShadow: "none", background: "var(--cream)" }}>
                <PersonCard name={director.name} role={director.role} tone={0}>
                  <p className="br-person-bio">{t(copy.directorBio ?? director.bio)}</p>
                  {copy.directorStory && (
                    <Link className="link-arrow" href={`/news/${copy.directorStory.slug}`}>
                      {t(copy.directorStory.label)}<Icon name="arrow" />
                    </Link>
                  )}
                </PersonCard>
              </div>
            )}
            <div className="br-stat-row">
              <div className="br-stat">
                <b>{copy.classesPerWeek}</b>
                <span>{t("classes every week")}</span>
              </div>
              <div className="br-stat">
                <b>{classCount}</b>
                <span>{t("classes on the calendar in the next 7 days")}</span>
              </div>
              <div className="br-stat">
                <b>1</b>
                <span>{t("full-time Fitness Director on site")}</span>
              </div>
            </div>
          </div>
          <div className="br-split-ph tall">
            <Image src="/img/fitness-bike.jpg" alt={t("A team member coaching a resident on a recumbent bike")} fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="br-hl-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Highlights")}</p>
            <h2 id="br-hl-h">{t("More than a gym")}</h2>
          </div>
          <ul className="br-hl">
            {fitness.highlights.map((h, i) => (
              <li key={h}>
                <Icon name={icon(i)} />
                <span>{t(h)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {hh && (
        <section className="sec-tight tone-cream" aria-labelledby="br-hh-h">
          <div className="wrap">
            <div className="br-event-card">
              <div className="br-cal-chip" aria-hidden="true">
                <span>{t(monthName(hhDate).slice(0, 3))}</span>
                <b>{hhDate.getUTCDate()}</b>
                <i>{t(dayName(hhDate))}</i>
              </div>
              <div>
                <p className="eyebrow">{t("Monthly favorite")}</p>
                <h2 id="br-hh-h" className="h3" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)" }}>
                  {t(hh.title)}
                </h2>
                <p>{t(`${dayName(hhDate)}, ${monthName(hhDate)} ${hhDate.getUTCDate()} · ${fmtTime(hh.start)} · ${hh.room}`)}</p>
                <p>{t(monthly!.text)}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sec tone-white" id="classes" aria-labelledby="br-classes-h">
        <div className="wrap">
          <div className="sec-head-row">
            <div className="sec-head">
              <p className="eyebrow">{t("This week")}</p>
              <h2 id="br-classes-h">{t("Fitness classes, next 7 days")}</h2>
              <p>{t("Drop in to any class — no sign-up needed unless it shows a seat count.")}</p>
            </div>
            <Link className="btn btn-green" href="/calendar">
              <Icon name="calendar" /> {t("Full calendar")}
            </Link>
          </div>
          <WeekEvents days={week} showSeats />
        </div>
      </section>

      {fitInstructors.length > 0 && (
      <section className="sec-tight tone-sand" aria-labelledby="br-instr-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Instructors")}</p>
            <h2 id="br-instr-h">{t("Familiar faces, every week")}</h2>
          </div>
          <ul className="br-instr">
            {fitInstructors.map((p, i) => (
              <li key={p.name}>
                <Monogram name={p.name} size={56} tone={i + 1} />
                <p>
                  <b data-no-translate>{p.name}</b>
                  <span>{t(p.what)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      <section className="sec-tight tone-cream" aria-labelledby="br-fgal-h">
        <div className="wrap">
          <h2 id="br-fgal-h" className="vh">
            {t("Fitness photos")}
          </h2>
          <Gallery items={copy.gallery} />
        </div>
      </section>

      <TourBand photo="/img/trail-walk.jpg" title={<>{t("Try a class ")}<em>{t(tourCopy[c.slug].lunchOnUs ? "on us." : "when you visit.")}</em></>} text={directorFirst ? `Join ${directorFirst} for a class when you visit, then stay for lunch in one of our three restaurants.` : "Join a class when you visit, then stay for lunch in one of our three restaurants."} />
    </>
  );
}
