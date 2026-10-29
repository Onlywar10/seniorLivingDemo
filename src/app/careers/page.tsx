import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { careers, purpose, site, steward } from "@/data/site";
import { CareersApply } from "@/components/info/Forms";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the team at Prairie City Landing in Folsom. Open positions for Care Partners, Med Techs, cooks, servers and more, with medical, 401(k) match, tuition assistance and a free meal every shift.",
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["Careers", "/careers"]]}
        eyebrow="Careers"
        title={
          <>
            Work where you’re <em>appreciated</em>
          </>
        }
        lede={careers.intro}
        photo="/img/care-outdoors.jpg"
        alt="A Care Partner walking with a resident outdoors"
      >
        <div className="btn-row">
          <a className="btn" href="#openings">
            See open positions
          </a>
          <a className="btn btn-ghost" href={`mailto:${site.careersEmail}`}>
            <Icon name="mail" /> {site.careersEmail}
          </a>
        </div>
      </PageHero>

      <section className="sec-tight tone-white">
        <div className="wrap cr-purpose">
          <p className="cr-quote">{purpose}</p>
          <p className="small muted">Our purpose, shared by every Tenfold Senior Living community</p>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap cr-benefits">
          <div>
            <p className="eyebrow">Benefits</p>
            <h2>
              Taking care of the people <em>who take care</em>
            </h2>
            <p className="muted">Full-time team members are eligible for the full benefits package. Ask our recruiter about part-time eligibility.</p>
            <div className="cr-ben-photo">
              <Image src="/img/chef-kitchen.jpg" alt="A chef plating food in the kitchen" fill sizes="(max-width: 860px) 100vw, 40vw" />
            </div>
          </div>
          <ul className="cr-ben-list">
            {careers.benefits.map((b) => (
              <li key={b}>
                <Icon name="check" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sec tone-sand">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">How hiring works</p>
            <h2>
              Four steps, <em>no runaround</em>
            </h2>
          </div>
          <ol className="cr-steps">
            {careers.steps.map((s, i) => (
              <li key={s.title}>
                <span className="cr-step-n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p className="small">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec tone-cream" id="openings">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Open positions</p>
            <h2>
              Join us in <em>Folsom</em>
            </h2>
            <p>All positions are at Prairie City Landing, {site.addressLine}.</p>
          </div>
          <CareersApply openings={careers.openings} />
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap cr-story">
          <Link href="/news/a-great-place-to-work" className="card cr-story-card">
            <div className="cr-story-photo">
              <Image src="/img/care-laugh.jpg" alt="A Care Partner laughing with a resident" fill sizes="(max-width: 860px) 100vw, 45vw" />
            </div>
            <div className="card-pad">
              <p className="eyebrow">From our news</p>
              <h2 className="cr-story-h">Not Just a Great Place to Live, Also a Great Place to Work</h2>
              <p className="muted">Team members who are seen and appreciated make residents feel the same way.</p>
              <span className="link-arrow">
                Read the story <Icon name="arrow" />
              </span>
            </div>
          </Link>
          <div className="cr-steward card card-pad">
            <Icon name="star" />
            <p className="small">
              <b>{steward.title}:</b> <span data-no-translate>{steward.name}</span>, {steward.role}, {steward.month}.
            </p>
            <Link className="link-arrow" href="/team">
              Meet our team <Icon name="arrow" />
            </Link>
          </div>
          <div className="cr-contact card card-pad">
            <h3>Questions about working here?</h3>
            <p className="small">
              Email <a href={`mailto:${site.careersEmail}`}>{site.careersEmail}</a> and our recruiter will get back to you.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
