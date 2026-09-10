import Link from "next/link";
import { community } from "@/data/community";
import { Icon } from "./Icon";

export const pillars = [
  { href: "/larkmoor-house/activities", label: "Activities" },
  { href: "/larkmoor-house/dining", label: "Dining" },
  { href: "/larkmoor-house/apartments", label: "Apartments" },
  { href: "/larkmoor-house/team", label: "Care team" },
  { href: "/larkmoor-house/handbook", label: "Family handbook" },
  { href: "/larkmoor-house/news", label: "News" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link className="brand" href="/larkmoor-house" aria-label="Larkmoor House, home">
          <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" fill="#4F6353" />
            <path d="M46 16c-16 0-27 8-29 24 0 2 0 4 1 6 8-14 17-19 25-22-8 5-16 12-22 26 3 1 6 1 9 1 14-1 21-14 20-30-1-2-2-4-4-5z" fill="#D6C28C" />
          </svg>
          <span className="brand-text">
            <span className="brand-name">{community.name}</span>
            <span className="brand-sub">Assisted living &amp; memory care · Millbrook Bend, Oregon</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Sections">
          {pillars.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <a className="header-phone" href={community.phoneHref}>
            <Icon name="phone" />
            {community.phone}
          </a>
          <Link className="btn btn-gold" href="/larkmoor-house/tour">
            Book a tour
          </Link>
        </div>
      </div>
    </header>
  );
}
