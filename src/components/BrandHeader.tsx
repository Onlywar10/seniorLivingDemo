import Link from "next/link";
import { group } from "@/data/group";
import { Icon } from "./Icon";

export const brandNav = [
  { href: "/#find", label: "Find a location" },
  { href: "/#shared", label: "Our homes" },
  { href: "/#care", label: "Care" },
  { href: "/#faq", label: "Questions" },
];

export function BrandHeader() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link className="brand" href="/" aria-label={`${group.name}, home`}>
          <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" fill="#4F6353" />
            <path d="M46 16c-16 0-27 8-29 24 0 2 0 4 1 6 8-14 17-19 25-22-8 5-16 12-22 26 3 1 6 1 9 1 14-1 21-14 20-30-1-2-2-4-4-5z" fill="#D6C28C" />
          </svg>
          <span className="brand-text">
            <span className="brand-name">{group.name}</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Sections">
          {brandNav.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={group.phoneHref}>
            <Icon name="phone" />
            {group.phone}
          </a>
          <a className="btn btn-gold" href="/#find">
            Find a location
          </a>
        </div>
      </div>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <p className="footer-name">{group.name}</p>
          <p>
            {group.office}
            <br />
            <a href={group.phoneHref}>{group.phone}</a> · central office, Monday to Friday 8 am – 6 pm
          </p>
          <p className="footer-lic">Family owned since {group.founded}. Each home is separately licensed by its state.</p>
        </div>
        <ul className="footer-links" aria-label="Communities">
          <li><Link href="/larkmoor-house">Larkmoor House, Millbrook Bend</Link></li>
          <li><Link href="/communities/ashby-grove">Ashby Grove, Salem</Link></li>
          <li><Link href="/communities/willow-bend">Willow Bend, Eugene</Link></li>
          <li><Link href="/communities/harbor-view">Harbor View, Astoria</Link></li>
          <li><Link href="/communities/maple-court">Maple Court, Vancouver</Link></li>
          <li><Link href="/communities/fernhill">Fernhill, Bend</Link></li>
        </ul>
        <ul className="footer-links" aria-label="About this site">
          <li><Link href="/accessibility">Accessibility statement</Link></li>
          <li><Link href="/staff">Staff sign in</Link></li>
        </ul>
      </div>
      <div className="wrap footer-note">
        © {new Date().getFullYear()} Larkmoor Senior Living · Equal housing opportunity
      </div>
    </footer>
  );
}
