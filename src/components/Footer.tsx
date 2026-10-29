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
          <p className="footer-lic">{community.licenceLine}</p>
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
            <Link href="/larkmoor-house/stay-connected">Stay connected: calendar and menus by text or email</Link>
          </li>
          <li>
            <Link href="/larkmoor-house/events">Open house and family events</Link>
          </li>
          <li>
            <Link href="/staff">Staff sign in</Link>
          </li>
        </ul>
      </div>
      <div className="wrap footer-note">
        © {new Date().getFullYear()} Larkmoor Senior Living · <Link href="/accessibility">Accessibility</Link> · Equal housing opportunity
      </div>
    </footer>
  );
}
