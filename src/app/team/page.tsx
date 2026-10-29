import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { site, steward, team } from "@/data/site";
import { whoToCall } from "@/data/info";
import { Monogram } from "@/components/info/bits";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet the leadership and department directors at Prairie City Landing, our Team Steward of the Month, instructors and Resident Council president.",
};

const regulars: { name: string; what: string; when: string; icon: "dumbbell" | "heart" | "sparkle" | "paw" | "music" }[] = [
  { name: "Sonya", what: "Chair Yoga", when: "Sundays, 11:00 am · Fitness Center", icon: "dumbbell" },
  { name: "Shaun", what: "Sit To Be Fit", when: "Mon, Wed, Fri & Sat, 12:15 pm · Fitness Center", icon: "dumbbell" },
  { name: "Showen", what: "Tai Chi", when: "Fridays, 11:00 am · Fitness Center", icon: "dumbbell" },
  { name: "Rhea", what: "Zumba", when: "Saturdays, 11:30 am · Harbor", icon: "music" },
  { name: "Ava", what: "Brain Busters", when: "Saturdays, 3:00 pm · Natoma Café", icon: "sparkle" },
  { name: "Chaplain Dave", what: "Non-Denominational Service", when: "Sundays, 10:30 am · Theatre", icon: "heart" },
  { name: "Fr. Giovanni Gamas", what: "Catholic Mass, St. John the Baptist Catholic Church", when: "Monthly Mass in the Theatre", icon: "heart" },
];

export default function TeamPage() {
  const leaders = team.filter((m) => m.key);
  const directors = team.filter((m) => !m.key && m.ext);
  const bill = team.find((m) => m.name === "Bill Hagemeyer")!;
  const topicsFor = (name: string) => whoToCall.filter((w) => w.name === name).map((w) => w.topic);

  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["Our Team", "/team"]]}
        eyebrow="Our team"
        title={
          <>
            The people who make it <em>home</em>
          </>
        }
        lede="Every director at Prairie City Landing works on site, knows residents by name and picks up the phone. Here’s who they are, and who to call about what."
        photo="/img/care-laugh.jpg"
        alt="A Care Partner sharing a laugh with a resident"
      />

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Leadership</p>
            <h2>
              Your <em>first</em> calls
            </h2>
          </div>
          <div className="tm-leaders">
            {leaders.map((m, i) => (
              <article key={m.name} className={`card tm-leader ${i === 0 ? "tm-lead-first" : ""}`}>
                <div className="tm-leader-top">
                  <Monogram name={m.name} size={84} />
                  <div>
                    <h3 data-no-translate>{m.name}</h3>
                    <p className="tm-role">{m.role}</p>
                  </div>
                </div>
                <p>{m.bio}</p>
                {topicsFor(m.name).length > 0 && (
                  <p className="small tm-about">
                    <b>Call about:</b> {topicsFor(m.name).join("; ")}
                  </p>
                )}
                <a className="tm-call" href={`${site.phoneHref},${m.ext}`}>
                  <Icon name="phone" /> {site.phone}, ext. {m.ext}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Department directors</p>
            <h2>
              Experts in <em>everyday</em> life
            </h2>
          </div>
          <div className="tm-dirs">
            {directors.map((m) => (
              <article key={m.name} className="tm-dir">
                <Monogram name={m.name} size={60} />
                <div>
                  <h3 data-no-translate>{m.name}</h3>
                  <p className="tm-role">{m.role}</p>
                  <p className="small">{m.bio}</p>
                  <a className="small tm-ext" href={`${site.phoneHref},${m.ext}`}>
                    <Icon name="phone" /> ext. {m.ext}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              {steward.title} · {steward.month}
            </p>
            <h2 id="steward-h" data-no-translate>
              {steward.name}
            </h2>
            <p className="tm-steward-role">{steward.role}</p>
            <ul className="tm-praise">
              {steward.praise.map((p) => (
                <li key={p}>{p[0].toUpperCase() + p.slice(1)}</li>
              ))}
            </ul>
          </div>
          <div className="tm-quotes">
            <p className="tm-steward-lede">
              Residents and colleagues nominated Esther for her communication, cheerfulness and attentiveness. In their words:
            </p>
            {steward.quotes.map((q) => (
              <blockquote key={q}>
                <p>“{q}”</p>
              </blockquote>
            ))}
            <p className="small muted">
              Every month residents and team members nominate a Team Steward of the Month.{" "}
              <Link href="/news/a-great-place-to-work">Why our team matters</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="sec tone-sand">
        <div className="wrap tm-call-grid">
          <div className="sec-head">
            <p className="eyebrow">Who to call</p>
            <h2>
              The <em>right</em> person, first time
            </h2>
            <p>
              Call {site.phone} and dial the extension, or ask the front desk. For Harbor, you can also call {site.phonesAlso[0]}.
            </p>
          </div>
          <table className="tm-table">
            <caption className="vh">Who to call about what</caption>
            <thead>
              <tr>
                <th scope="col">About</th>
                <th scope="col">Call</th>
                <th scope="col">Ext.</th>
              </tr>
            </thead>
            <tbody>
              {whoToCall.map((w) => (
                <tr key={w.topic}>
                  <td>{w.topic}</td>
                  <td data-no-translate>{w.name}</td>
                  <td>
                    <a href={`${site.phoneHref},${w.ext}`}>{w.ext}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Instructors & regulars</p>
            <h2>
              Familiar faces on <em>the calendar</em>
            </h2>
            <p>Alongside our full-time team, these instructors and clergy are part of the week — plus one very good dog.</p>
          </div>
          <ul className="tm-regulars">
            {regulars.map((r) => (
              <li key={r.name}>
                <Monogram name={r.name} size={52} />
                <div>
                  <b data-no-translate>{r.name}</b>
                  <span>{r.what}</span>
                  <small>{r.when}</small>
                </div>
              </li>
            ))}
            <li className="tm-thor">
              <span className="tm-paw" aria-hidden="true">
                <Icon name="paw" />
              </span>
              <div>
                <b data-no-translate>Thor</b>
                <span>Therapy pet</span>
                <small>Pet Therapy in Harbor, Wednesdays at 2:00 pm, and regular visits to the 2nd Floor Lounge</small>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap tm-council">
          <div className="tm-council-photo">
            <Image src="/img/friends-laugh.jpg" alt="Residents laughing together in the Rendezvous" fill sizes="(max-width: 860px) 100vw, 45vw" />
          </div>
          <div>
            <p className="eyebrow">Resident Council</p>
            <h2>
              Residents have a <em>voice</em>
            </h2>
            <div className="tm-bill">
              <Monogram name={bill.name} size={64} tone="var(--slate)" />
              <div>
                <h3 data-no-translate>{bill.name}</h3>
                <p className="tm-role">{bill.role}</p>
              </div>
            </div>
            <p>{bill.bio}</p>
            <p className="muted">
              The All-Resident Council Meeting is held monthly in the Theatre, and Executive Director Cheryl Martin hosts a Town Hall each month too. Ask
              Cynthia to introduce you to Bill on your tour.
            </p>
            <div className="btn-row">
              <Link className="btn" href="/tour">
                Schedule a tour
              </Link>
              <Link className="btn btn-ghost" href="/careers">
                Join our team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
