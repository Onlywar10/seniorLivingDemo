import Link from "next/link";
import { site } from "@/data/site";
import { Logo, Dots } from "./Logo";
import { Icon } from "./Icon";

const cols = [
  { title: "Living Options", links: [["Independent Living", "/living/independent-living"], ["Assisted Living Services", "/living/assisted-living"], ["Harbor Memory Care", "/living/harbor-memory-care"], ["Floor Plans & Pricing", "/floor-plans"], ["Care Assessment", "/care-assessment"], ["Cost Comparison", "/cost-comparison"]] },
  { title: "Life Here", links: [["Activity Calendar", "/calendar"], ["Dining & Menus", "/dining"], ["Events & Adventures", "/events-adventures"], ["Fitness", "/fitness"], ["Amazing Spaces", "/spaces"], ["Stay Connected", "/stay-connected"]] },
  { title: "About", links: [["Our Team", "/team"], ["Purpose & Values", "/about"], ["All Are Welcome", "/all-are-welcome"], ["News", "/news"], ["Senior Living Guides", "/guides"], ["FAQs", "/faq"], ["Careers", "/careers"], ["Info & Directions", "/contact"]] },
];

export function Footer() {
  return (
    <footer className="footer">
      <Dots size={420} style={{ right: -120, top: -80, opacity: 0.16 }} />
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Logo light />
            <div className="footer-contact">
              <a href={site.mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" /> {site.addressLine}
              </a>
              <a href={site.phoneHref}>
                <Icon name="phone" /> {site.phone}
              </a>
              <a href={`mailto:${site.email}`}>
                <Icon name="mail" /> {site.email}
              </a>
              <a href={site.facebook} target="_blank" rel="noreferrer">
                <Icon name="facebook" /> Prairie City Landing on Facebook
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h2>{c.title}</h2>
              <ul>
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-family">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/tenfold-white.png" alt="Tenfold Senior Living" width={116} height={52} />
          <p>
            Prairie City Landing is owned, designed, built and operated by {site.operator}.<br />
            Our sister community:{" "}
            <a href={site.sister.url} target="_blank" rel="noreferrer">
              {site.sister.name}
            </a>
            , {site.sister.city}.
          </p>
        </div>
        <div className="footer-bottom">
          <span>
            <span className="licence">{site.licence}</span> · © 2026 {site.operator} · Equal Housing Opportunity
          </span>
          <nav aria-label="Footer">
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/staff">
              <Icon name="lock" /> Staff sign in
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
