import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { getCommunity } from "@/lib/community-server";
import { teamCopy } from "@/data/communities/copy/team";
import type { TeamMember } from "@/data/shared";
import { Monogram } from "@/components/info/bits";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Our Team"),
    description: t(teamCopy[c.slug].metaDescription),
  };
}

export default async function TeamPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site, steward, team, whoToCall } = c;
  const copy = teamCopy[c.slug];
  const isCouncil = (m: TeamMember) => m.dept === "Resident Council";
  const leaders = team.filter((m) => m.key);
  const directors = team.filter((m) => !m.key && !isCouncil(m));
  const council = team.find(isCouncil);
  const topicsFor = (name: string) => whoToCall.filter((w) => w.name === name).map((w) => w.topic);
  const hasExt = whoToCall.some((w) => w.ext);
  const harborPhone = c.phones.find((p) => p.label === "Harbor Memory Care")?.number;
  const callHref = (ext?: string | null) => (ext ? `${site.phoneHref},${ext}` : site.phoneHref);
  /** Unnamed roles show the role once, as the name. */
  const nameOf = (m: TeamMember) => (m.unnamed ? <h3>{t(m.role)}</h3> : <h3 data-no-translate>{m.name}</h3>);

  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["Our Team", "/team"]]}
        eyebrow="Our team"
        title={
          <>
            {t("The people who make it ")}
            <em>{t("home")}</em>
          </>
        }
        lede={copy.lede}
        photo="/img/care-laugh.jpg"
        alt="A Care Partner sharing a laugh with a resident"
      />

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Leadership")}</p>
            <h2>
              {t("Your ")}
              <em>{t("first")}</em>
              {t(" calls")}
            </h2>
          </div>
          <div className="tm-leaders">
            {leaders.map((m, i) => (
              <article key={m.name} className={`card tm-leader ${i === 0 ? "tm-lead-first" : ""}`}>
                <div className="tm-leader-top">
                  <Monogram name={m.name} size={84} />
                  <div>
                    {nameOf(m)}
                    {!m.unnamed && <p className="tm-role">{t(m.role)}</p>}
                  </div>
                </div>
                <p>{t(m.bio)}</p>
                {topicsFor(m.name).length > 0 && (
                  <p className="small tm-about">
                    <b>{t("Call about:")}</b> {topicsFor(m.name).map(t).join("; ")}
                  </p>
                )}
                <a className="tm-call" href={callHref(m.ext)}>
                  <Icon name="phone" /> {site.phone}
                  {m.ext && (
                    <>
                      {t(", ext. ")}
                      {m.ext}
                    </>
                  )}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Department directors")}</p>
            <h2>
              {t("Experts in ")}
              <em>{t("everyday")}</em>
              {t(" life")}
            </h2>
          </div>
          <div className="tm-dirs">
            {directors.map((m) => (
              <article key={m.name} className="tm-dir">
                <Monogram name={m.name} size={60} />
                <div>
                  {nameOf(m)}
                  {!m.unnamed && <p className="tm-role">{t(m.role)}</p>}
                  <p className="small">{t(m.bio)}</p>
                  {m.ext && (
                    <a className="small tm-ext" href={callHref(m.ext)}>
                      <Icon name="phone" /> {t("ext. ")}
                      {m.ext}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {steward && (
        <section className="sec tone-green tm-steward" aria-labelledby="steward-h">
          <Dots size={360} style={{ right: -90, bottom: -120, opacity: 0.25 }} />
          <div className="wrap tm-steward-grid">
            <div className="tm-steward-id">
              <div className="tm-steward-mono">
                <Monogram name={steward.name} size={148} tone="var(--terra-deep)" />
                <span className="tm-steward-star">
                  <Icon name="star" />
                </span>
              </div>
              <p className="eyebrow light">
                {t(steward.title)} · {t(steward.month)}
              </p>
              <h2 id="steward-h" data-no-translate>
                {steward.name}
              </h2>
              <p className="tm-steward-role">{t(steward.role)}</p>
              <ul className="tm-praise">
                {steward.praise.map((p) => (
                  <li key={p}>{t(p[0].toUpperCase() + p.slice(1))}</li>
                ))}
              </ul>
            </div>
            <div className="tm-quotes">
              {copy.stewardLede && <p className="tm-steward-lede">{t(copy.stewardLede)}</p>}
              {steward.quotes.map((q) => (
                <blockquote key={q}>
                  <p>“{t(q)}”</p>
                </blockquote>
              ))}
              <p className="small muted">
                {t("Every month residents and team members nominate a Team Steward of the Month.")}{" "}
                {copy.teamStory && <Link href={`/news/${copy.teamStory}`}>{t("Why our team matters")}</Link>}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="sec tone-sand">
        <div className="wrap tm-call-grid">
          <div className="sec-head">
            <p className="eyebrow">{t("Who to call")}</p>
            <h2>
              {t("The ")}
              <em>{t("right")}</em>
              {t(" person, first time")}
            </h2>
            {hasExt ? (
              <p>
                {t("Call ")}
                {site.phone}
                {harborPhone ? (
                  <>
                    {t(" and dial the extension, or ask the front desk. For Harbor, you can also call ")}
                    {harborPhone}.
                  </>
                ) : (
                  t(" and dial the extension, or ask the front desk.")
                )}
              </p>
            ) : (
              <p>
                {t("Call ")}
                {site.phone}
                {t(" and ask the front desk for the person you need.")}
              </p>
            )}
          </div>
          <table className="tm-table">
            <caption className="vh">{t("Who to call about what")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("About")}</th>
                <th scope="col">{t(hasExt ? "Call" : "Ask for")}</th>
                {hasExt && <th scope="col">{t("Ext.")}</th>}
              </tr>
            </thead>
            <tbody>
              {whoToCall.map((w) => (
                <tr key={w.topic}>
                  <td>{t(w.topic)}</td>
                  <td data-no-translate>{w.name}</td>
                  {hasExt && <td>{w.ext ? <a href={callHref(w.ext)}>{w.ext}</a> : <a href={site.phoneHref}>{t("Main line")}</a>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t("Instructors & regulars")}</p>
            <h2>
              {t("Familiar faces on ")}
              <em>{t("the calendar")}</em>
            </h2>
            <p>{t(copy.regularsIntro)}</p>
          </div>
          <ul className="tm-regulars">
            {copy.regulars.map((r) => (
              <li key={r.name}>
                {r.unnamed ? (
                  <span className="tm-paw" aria-hidden="true">
                    <Icon name={r.icon} />
                  </span>
                ) : (
                  <Monogram name={r.name} size={52} />
                )}
                <div>
                  {r.unnamed ? <b>{t(r.name)}</b> : <b data-no-translate>{r.name}</b>}
                  <span>{t(r.what)}</span>
                  <small>{t(r.when)}</small>
                </div>
              </li>
            ))}
            {copy.pet && (
              <li className="tm-thor">
                <span className="tm-paw" aria-hidden="true">
                  <Icon name="paw" />
                </span>
                <div>
                  <b data-no-translate>{copy.pet.name}</b>
                  <span>{t(copy.pet.what)}</span>
                  <small>{t(copy.pet.when)}</small>
                </div>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap tm-council">
          <div className="tm-council-photo">
            <Image src="/img/friends-laugh.jpg" alt={t(copy.councilPhotoAlt)} fill sizes="(max-width: 860px) 100vw, 45vw" />
          </div>
          <div>
            <p className="eyebrow">{t("Resident Council")}</p>
            <h2>
              {t("Residents have a ")}
              <em>{t("voice")}</em>
            </h2>
            {council && (
              <>
                <div className="tm-bill">
                  <Monogram name={council.name} size={64} tone="var(--slate)" />
                  <div>
                    {nameOf(council)}
                    {!council.unnamed && <p className="tm-role">{t(council.role)}</p>}
                  </div>
                </div>
                <p>{t(council.bio)}</p>
              </>
            )}
            <p className="muted">{t(copy.councilNote)}</p>
            <div className="btn-row">
              <Link className="btn" href="/tour">
                {t("Schedule a tour")}
              </Link>
              <Link className="btn btn-ghost" href="/careers">
                {t("Join our team")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
