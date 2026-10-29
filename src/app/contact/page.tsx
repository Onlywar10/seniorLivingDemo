import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { site, team } from "@/data/site";
import { directions, emails, nearby, phones, telHref, visiting } from "@/data/info";
import { EnquiryForm } from "@/components/info/Forms";
import { Monogram } from "@/components/info/bits";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Info & Directions",
  description: "Address, directions, phone numbers, visiting hours and a department directory for Prairie City Landing, 645 Willard Drive, Folsom, CA 95630.",
};

export default function ContactPage() {
  const directory = team.filter((m) => m.ext);
  return (
    <>
      <PageHero
        crumbs={[["Info & Directions", "/contact"]]}
        eyebrow="Info & Directions"
        title={
          <>
            Find us in <em>Folsom</em>
          </>
        }
        lede="Just off US-50 next to Folsom High School, minutes from historic downtown Folsom. Visitors are always welcome."
        photo="/img/exterior.jpg"
        alt="The front entrance of Prairie City Landing"
      >
        <div className="btn-row">
          <a className="btn" href={site.mapsUrl} target="_blank" rel="noreferrer">
            <Icon name="pin" /> Get directions
          </a>
          <a className="btn btn-ghost" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
        </div>
      </PageHero>

      <section className="sec tone-cream">
        <div className="wrap ct-top">
          <div className="ct-map card">
            <iframe
              src={site.mapsEmbed}
              title="Map showing Prairie City Landing at 645 Willard Drive, Folsom"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="ct-map-foot">
              <div>
                <b>{site.name}</b>
                <address>{site.addressLine}</address>
              </div>
              <a className="link-arrow" href={site.mapsUrl} target="_blank" rel="noreferrer">
                Open in Google Maps <Icon name="arrow" />
              </a>
            </div>
          </div>
          <div className="ct-dir">
            <h2>Getting here</h2>
            <ul className="ct-nearby">
              {nearby.map((n) => (
                <li key={n}>
                  <Icon name="pin" /> {n}
                </li>
              ))}
            </ul>
            <div className="ct-routes">
              {directions.map((d) => (
                <div key={d.title}>
                  <h3>{d.title}</h3>
                  <p className="small">{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sec tone-white">
        <div className="wrap ct-reach">
          <div>
            <p className="eyebrow">Call or write</p>
            <h2>
              We’re <em>easy</em> to reach
            </h2>
            <ul className="ct-phones">
              {phones.map((p) => (
                <li key={p.label}>
                  <span className="ct-ico">
                    <Icon name="phone" />
                  </span>
                  <div>
                    <span className="ct-label">{p.label}</span>
                    <a className="ct-big" href={telHref(p.number)}>
                      {p.number}
                    </a>
                    <span className="small muted">{p.note}</span>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="ct-emails">
              {emails.map((e) => (
                <li key={e.label}>
                  <span className="ct-ico">
                    <Icon name="mail" />
                  </span>
                  <div>
                    <span className="ct-label">{e.label}</span>
                    <a href={`mailto:${e.address}`}>{e.address}</a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="ct-hours card card-pad">
            <h3>
              <Icon name="clock" /> Hours
            </h3>
            <dl>
              {visiting.map((v) => (
                <div key={v.label}>
                  <dt>{v.label}</dt>
                  <dd>{v.value}</dd>
                </div>
              ))}
            </dl>
            <p className="small muted ct-lic">{site.licence}</p>
          </div>
        </div>
      </section>

      <section className="sec tone-sand" id="enquire">
        <div className="wrap ct-enq">
          <div className="ct-enq-intro">
            <p className="eyebrow">Ask us anything</p>
            <h2>
              Send us a <em>note</em>
            </h2>
            <p className="muted">
              Pricing, availability, care, pets, a question you’d rather not ask on the phone — it all comes straight to our Community Relations team.
            </p>
            <div className="ct-alt">
              <Link className="link-arrow" href="/tour">
                Schedule a tour instead <Icon name="arrow" />
              </Link>
              <Link className="link-arrow" href="/faq">
                Read the FAQs <Icon name="arrow" />
              </Link>
            </div>
          </div>
          <div className="card card-pad">
            <EnquiryForm phone={site.phone} />
          </div>
        </div>
      </section>

      <section className="sec tone-cream">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">Department directory</p>
            <h2>
              Reach the <em>right</em> person
            </h2>
            <p>
              Call {site.phone} and dial the extension, or ask the front desk to put you through.
            </p>
          </div>
          <ul className="ct-directory">
            {directory.map((m) => (
              <li key={m.name}>
                <Monogram name={m.name} size={48} />
                <div>
                  <b data-no-translate>{m.name}</b>
                  <span className="small muted">{m.role}</span>
                </div>
                <span className="ct-dept small">{m.dept}</span>
                <a className="ct-ext" href={`${site.phoneHref},${m.ext}`} aria-label={`Call ${m.name}, extension ${m.ext}`}>
                  ext. {m.ext}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
