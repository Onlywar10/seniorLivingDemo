import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "@/components/brand/brand.css";
import { site, welcome } from "@/data/site";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { TourBand } from "@/components/brand/TourBand";

export const metadata: Metadata = {
  title: "All Are Welcome",
  description: "Prairie City Landing is SageCare certified and committed to diversity, equity and inclusion. ASL interpreters are available for tours, care conferences and events.",
};

const icons = ["heart", "users", "sms", "access"] as const;

export default function AllAreWelcome() {
  return (
    <>
      <PageHero
        eyebrow="All are welcome"
        title={
          <>
            A home for <em>everyone.</em>
          </>
        }
        lede={welcome.intro}
        photo="/img/couple-flowers.jpg"
        alt="A couple tending flowers together in the garden"
        crumbs={[
          ["About", "/about"],
          ["All Are Welcome", "/all-are-welcome"],
        ]}
      />

      <section className="sec tone-cream" aria-labelledby="br-commit-h">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Our commitment</p>
            <h2 id="br-commit-h">
              Included, respected and <em>safe.</em>
            </h2>
          </div>
          <div className="grid-2">
            {welcome.points.map((p, i) => (
              <div key={p.title} className="br-feature">
                <Icon name={icons[i]} />
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tone-green on-dark" aria-labelledby="br-sage-h">
        <div className="wrap br-split">
          <div>
            <p className="eyebrow">SageCare</p>
            <h2 id="br-sage-h">Every team member, trained every year.</h2>
            <p style={{ color: "#d8e2d6", marginTop: 16 }}>
              SageCare is the LGBTQ+ cultural competency training from SAGE, the country’s largest organization dedicated to LGBTQ+ older adults. Many LGBTQ+ elders have spent decades hiding who they are from doctors, landlords and neighbours. We don’t want anyone to feel that way at home.
            </p>
            <ul className="br-checks" style={{ marginTop: 20 }}>
              <li>
                <Icon name="check" /> <span>Annual training for every team member, from Care Partners to the kitchen</span>
              </li>
              <li>
                <Icon name="check" /> <span>Inclusive intake forms, with space for chosen names and pronouns</span>
              </li>
              <li>
                <Icon name="check" /> <span>Partners and spouses welcomed as family in every care conversation</span>
              </li>
            </ul>
          </div>
          <div className="br-split-ph">
            <Image src="/img/couple-hands.jpg" alt="Two people holding hands across a café table" fill sizes="(max-width: 860px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="sec tone-white" aria-labelledby="br-asl-h">
        <div className="wrap grid-2" style={{ alignItems: "start" }}>
          <div>
            <p className="eyebrow">ASL interpreters</p>
            <h2 id="br-asl-h">
              Every conversation, <em>in your language.</em>
            </h2>
            <p className="muted" style={{ marginTop: 14 }}>
              American Sign Language interpreters are available for tours, care conferences and community events. Let us know when you book, or call {site.phone} and we’ll arrange it.
            </p>
            <div className="btn-row">
              <Link className="btn btn-green" href="/tour">
                Book a tour with an interpreter
              </Link>
            </div>
          </div>
          <div>
            <p className="eyebrow">Accessibility</p>
            <h2>Easy to see, hear, reach and read.</h2>
            <p className="muted" style={{ marginTop: 14 }}>
              Our buildings, website and printed calendars are designed for everyone. Use the text size and contrast controls at the top of every page, or the language switch to read this site in Spanish.
            </p>
            <p className="muted">
              If anything on this website is hard to use, email{" "}
              <a href={`mailto:${site.accessibilityEmail}`} data-no-translate>
                {site.accessibilityEmail}
              </a>
              .
            </p>
            <Link className="link-arrow" href="/accessibility">
              Read our accessibility statement <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>

      <TourBand photo="/img/friends-walking.jpg" />
    </>
  );
}
