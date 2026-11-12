import type { Metadata } from "next";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { communities, type CommunitySlug } from "@/data/communities";
import { eventsCopy } from "@/data/communities/copy/events";
import { storyDate, type Story } from "@/data/shared";
import { comingCommunities, nameOrigin, purpose, values } from "@/data/wrenhaven";
import { intoCommunity, summaries } from "@/components/wrenhaven/parts";
import "./home-b.css";

// An alternative Wrenhaven homepage, laid out like a magazine: stories, resident voices and a photo essay first,
// the communities as feature spreads after. Reached only by its address; nothing links here.

export const metadata: Metadata = {
  title: { absolute: "Wrenhaven Senior Living · Stories from Home" },
  description: "Stories, resident voices and pictures from Alder Bend in Fairhollow and Kestrel Point in Rivermead, the Wrenhaven Senior Living communities.",
  robots: { index: false, follow: false },
};

/** Stories picked for the front of the issue: [community, story slug]. The first is the lead. */
const picks: [CommunitySlug, string][] = [
  ["kestrel-point", "shared-stories-bring-connection"],
  ["alder-bend", "mine-tour"],
  ["kestrel-point", "finding-camaraderie-and-care"],
  ["alder-bend", "gather-around-the-table"],
  ["kestrel-point", "engage-connect-celebrate-every-day"],
];

/** Resident and family voices: [community, first name]. */
const voices: [CommunitySlug, string][] = [
  ["alder-bend", "Dolores"],
  ["kestrel-point", "Doreen"],
  ["alder-bend", "Nathan"],
  ["kestrel-point", "Vern"],
  ["alder-bend", "Corinne"],
  ["kestrel-point", "Lloyd"],
];

/** The photo essay: [community, photo] from each community's own Events & Adventures gallery. */
const essay: [CommunitySlug, string][] = [
  ["alder-bend", "/img/car-wash.jpg"],
  ["alder-bend", "/img/beekeeping.jpg"],
  ["kestrel-point", "/img/courtyard-bbq.jpg"],
  ["alder-bend", "/img/lunar-new-year.jpg"],
  ["kestrel-point", "/img/bocce-women.jpg"],
  ["alder-bend", "/img/pool-hall.jpg"],
  ["kestrel-point", "/img/marshmallows.jpg"],
];

/** Each community's feature spread: the lead space and two more, by key from its own spaces. */
const spreads: Record<CommunitySlug, { lead: string; more: [string, string] }> = {
  "alder-bend": { lead: "courtyard", more: ["perch", "living"] },
  "kestrel-point": { lead: "bistro", more: ["courtyard", "club"] },
};

export default async function HomeStories() {
  const { t, href, lang } = await getT();
  const all = summaries();

  const stories = picks
    .map(([slug, s]) => ({ slug, story: communities[slug].findStory(s) }))
    .filter((x): x is { slug: CommunitySlug; story: Story } => !!x.story);
  const [lead, ...more] = stories;

  const quotes = voices.flatMap(([slug, name]) => {
    const q = communities[slug].testimonials.find((x) => x.name === name);
    return q ? [{ slug, ...q }] : [];
  });

  const photos = essay.flatMap(([slug, src]) => {
    const g = eventsCopy[slug].gallery.find((x) => x.src === src);
    return g ? [{ slug, ...g }] : [];
  });

  const contents = [
    ["hb-lead-h", "The lead story"],
    ["hb-voices-h", "In their own words"],
    ["hb-essay-h", "A season in pictures"],
    ["hb-places-h", "Two places to call home"],
    ["hb-name-h", "Where the name comes from"],
  ];

  return (
    <div className="hb">
      {/* ---------- Cover ---------- */}
      <section className="hb-cover" aria-labelledby="hb-cover-h">
        <Image src="/img/couple-flowers.jpg" alt={t("Two residents walking arm in arm through a garden")} fill priority sizes="100vw" className="hb-cover-img" />
        <div className="hb-wrap hb-cover-inner">
          <p className="hb-kicker">{t("Wrenhaven Senior Living · Fairhollow & Rivermead, California")}</p>
          <h1 id="hb-cover-h">
            {t("The good parts of the day, ")}
            <em>{t("told by the people living them.")}</em>
          </h1>
          <p className="hb-cover-lede">
            {t("Stories, voices and pictures from Alder Bend and Kestrel Point: two Wrenhaven communities where residents set the terms of their own days.")}
          </p>
        </div>
      </section>

      {/* ---------- Contents ---------- */}
      <nav className="hb-contents" aria-label={t("On this page")}>
        <div className="hb-wrap">
          <p className="hb-contents-label">{t("In this issue")}</p>
          <ol>
            {contents.map(([id, label], i) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span className="hb-num">{String(i + 1).padStart(2, "0")}</span> {t(label)}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* ---------- 01 Lead story ---------- */}
      {lead && (
        <section className="hb-sec" aria-labelledby="hb-lead-h">
          <div className="hb-wrap">
            <p className="hb-section-no">
              <span className="hb-num">01</span> {t("The lead story")}
            </p>
            <article className="hb-lead">
              <a className="hb-lead-ph" href={intoCommunity(lang, lead.slug, `/news/${lead.story.slug}`)} tabIndex={-1} aria-hidden="true">
                <Image src={lead.story.photo} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" />
              </a>
              <div className="hb-lead-text">
                <p className="hb-meta">
                  {t(lead.story.kind)} · {communities[lead.slug].site.name} · <time dateTime={lead.story.date}>{t(storyDate(lead.story.date))}</time>
                </p>
                <h2 id="hb-lead-h">
                  <a href={intoCommunity(lang, lead.slug, `/news/${lead.story.slug}`)}>{t(lead.story.title)}</a>
                </h2>
                <p className="hb-dek">{t(lead.story.dek)}</p>
                {lead.story.body[0] && <p className="hb-dropcap">{t(lead.story.body[0])}</p>}
                <a className="link-arrow" href={intoCommunity(lang, lead.slug, `/news/${lead.story.slug}`)}>
                  {t("Read the story")} <Icon name="arrow" />
                </a>
              </div>
            </article>

            <h3 className="hb-rule-h">{t("Also in the news")}</h3>
            <ul className="hb-more">
              {more.map(({ slug, story }) => (
                <li key={story.slug}>
                  <a href={intoCommunity(lang, slug, `/news/${story.slug}`)}>
                    <span className="hb-more-ph">
                      <Image src={story.photo} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw" />
                    </span>
                    <span className="hb-meta">
                      {communities[slug].site.name} · {t(story.kind)}
                    </span>
                    <span className="hb-more-title">{t(story.title)}</span>
                    <span className="hb-more-dek">{t(story.dek)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---------- 02 Voices ---------- */}
      <section className="hb-sec hb-voices" aria-labelledby="hb-voices-h">
        <div className="hb-wrap">
          <p className="hb-section-no">
            <span className="hb-num">02</span> {t("In their own words")}
          </p>
          <h2 id="hb-voices-h" className="hb-h2">
            {t("Ask the people ")}
            <em>{t("who live here.")}</em>
          </h2>
          <div className="hb-quotes">
            {quotes.map((q, i) => (
              <figure key={`${q.slug}-${q.name}`} className={`hb-quote ${i % 3 === 0 ? "is-big" : ""}`}>
                <blockquote>
                  <p>{t(q.quote)}</p>
                </blockquote>
                <figcaption>
                  <b>{q.name}</b>
                  <span>
                    {t(q.relation)} · {communities[q.slug].site.name}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 03 Photo essay ---------- */}
      <section className="hb-sec" aria-labelledby="hb-essay-h">
        <div className="hb-wrap">
          <p className="hb-section-no">
            <span className="hb-num">03</span> {t("A season in pictures")}
          </p>
          <div className="hb-essay-head">
            <h2 id="hb-essay-h" className="hb-h2">
              {t("Small pleasures, ")}
              <em>{t("big adventures.")}</em>
            </h2>
            <p>{t("Every Friday, residents and the Events & Adventures team look over the week ahead and choose what comes next. This is some of what they chose.")}</p>
          </div>
          <div className="hb-essay">
            {photos.map((p, i) => (
              <figure key={p.src} className={`hb-shot hb-shot-${i + 1}`}>
                <div className="hb-shot-ph">
                  <Image src={p.src} alt={t(p.alt)} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 40vw" />
                </div>
                <figcaption>
                  <b>{t(p.title)}</b> {p.caption && t(p.caption)} <span className="hb-shot-where">{communities[p.slug].site.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 04 Feature spreads ---------- */}
      <section className="hb-sec hb-places" aria-labelledby="hb-places-h">
        <div className="hb-wrap">
          <p className="hb-section-no">
            <span className="hb-num">04</span> {t("Two places to call home")}
          </p>
          <h2 id="hb-places-h" className="hb-h2">
            {t("Two communities, ")}
            <em>{t("one way of living.")}</em>
          </h2>
        </div>
        {all.map((s, i) => {
          const c = s.c;
          const pick = spreads[s.slug];
          const space = (k: string) => c.spaces.find((x) => x.key === k);
          const leadSpace = space(pick.lead);
          const ed = c.team.find((m) => m.role === "Executive Director");
          return (
            <article key={s.slug} className={`hb-spread ${i % 2 ? "is-rev" : ""}`} aria-labelledby={`hb-spread-${s.slug}`}>
              <div className="hb-wrap hb-spread-grid">
                {leadSpace && (
                  <div className="hb-spread-ph">
                    <Image src={leadSpace.photo} alt={t(leadSpace.alt)} fill sizes="(max-width: 900px) 100vw, 55vw" />
                  </div>
                )}
                <div className="hb-spread-text">
                  <p className="hb-meta">
                    <Icon name="pin" /> {s.city}, CA · {t(`Opened ${s.opened}`)}
                  </p>
                  <h3 id={`hb-spread-${s.slug}`}>{s.name}</h3>
                  <p className="hb-dek">{t(c.site.tagline)}</p>
                  <p>{t(c.site.location[1])}.</p>
                  {ed && (
                    <p className="muted">
                      {t(`Led by Executive Director ${ed.name}.`)} {t(`${s.apartments.independentAssisted} Independent & Assisted Living apartments and ${s.apartments.lantern} in Lantern Memory Care.`)}
                    </p>
                  )}
                  <ul className="hb-vignettes">
                    {pick.more.map((k) => {
                      const sp = space(k);
                      if (!sp) return null;
                      return (
                        <li key={k}>
                          <span className="hb-vig-ph">
                            <Image src={sp.photo} alt="" fill sizes="96px" />
                          </span>
                          <span>
                            <b>{sp.name}</b>
                            <span className="muted">{t(sp.text)}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <a className="btn" href={intoCommunity(lang, s.slug)}>
                    {t(`Visit ${s.name}`)}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ---------- 05 Name & purpose ---------- */}
      <section className="hb-sec hb-name" aria-labelledby="hb-name-h">
        <div className="hb-wrap hb-name-grid">
          <div>
            <p className="hb-section-no">
              <span className="hb-num">05</span> {t("Where the name comes from")}
            </p>
            <h2 id="hb-name-h" className="vh">
              {t("Where the name comes from")}
            </h2>
            <figure className="hb-founder">
              <blockquote>
                <p>{t(nameOrigin.quote)}</p>
              </blockquote>
              <figcaption>{t(nameOrigin.author)}</figcaption>
            </figure>
          </div>
          <div className="hb-name-side">
            <p className="hb-purpose">{t(purpose)}</p>
            <ul className="hb-values" aria-label={t("Our values")}>
              {values.map((v) => (
                <li key={v.key}>{t(v.name)}</li>
              ))}
            </ul>
            <a className="link-arrow" href={href("/about")}>
              {t("About Wrenhaven")} <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      {/* ---------- Next chapter ---------- */}
      <section className="hb-sec hb-next" aria-labelledby="hb-next-h">
        <div className="hb-wrap hb-next-grid">
          <div>
            <p className="hb-kicker">{t("The next chapter")}</p>
            <h2 id="hb-next-h" className="hb-h2">
              {t("Come and add ")}
              <em>{t("your own story.")}</em>
            </h2>
            <p>{t("Visit Alder Bend in Fairhollow or Kestrel Point in Rivermead. Every tour is personal, at a time that suits you.")}</p>
            <div className="btn-row">
              <a className="btn btn-lg" href={href("/communities")}>
                {t("Find a community")}
              </a>
              <a className="btn btn-ghost btn-lg" href={href("/contact")}>
                {t("Contact us")}
              </a>
            </div>
          </div>
          <ul className="hb-coming">
            {comingCommunities.map((c) => (
              <li key={c.key}>
                <span className="hb-meta">{t(`Planned opening ${c.planned}`)}</span>
                <b>{c.name}</b>
                <span className="muted">
                  {c.city}, {c.state} · {t(`${c.apartments} apartments`)}
                </span>
                <a href={href(`/communities#${c.key}`)}>{t("Join the interest list")}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
