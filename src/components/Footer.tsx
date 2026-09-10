import Link from "next/link";
import { community } from "@/data/community";
import { pillars } from "./SiteHeader";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <p className="footer-name">{community.name}</p>
          <p>
            {community.address}
            <br />
            <a href={community.phoneHref}>{community.phone}</a> · front desk 6 am – 10 pm, nurse 24 hours
          </p>
          <p className="footer-lic">Oregon assisted living facility licence {community.licence} · memory care endorsed</p>
          <p className="footer-lic">
            One of six <Link href="/">Larkmoor Senior Living</Link> communities in Oregon and Washington.
          </p>
        </div>
        <ul className="footer-links" aria-label="Sections">
          {pillars.map((p) => (
            <li key={p.href}>
              <Link href={p.href}>{p.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/larkmoor-house/inspection-record">State inspection record</Link>
          </li>
          <li>
            <Link href="/larkmoor-house/tour">Book a tour</Link>
          </li>
        </ul>
        <ul className="footer-links" aria-label="About this site">
          <li>
            <Link href="/accessibility">Accessibility statement</Link>
          </li>
          <li>
            <Link href="/about-this-demo">About this demonstration site</Link>
          </li>
        </ul>
      </div>
      <div className="wrap footer-note">
        Larkmoor House is a fictional community built as a product demonstration in September 2026. Every name, price and date is invented; phone numbers are 555 numbers.
      </div>
    </footer>
  );
}
