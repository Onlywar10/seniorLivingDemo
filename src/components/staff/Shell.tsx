"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { communities } from "@/data/group";
import { user } from "@/data/staff";
import { Icon } from "../Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

const nav: { group: string; items: { href: string; label: string; icon: IconName; badge?: string }[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/staff/dashboard", label: "Home", icon: "home" },
      { href: "/staff/communities", label: "Communities", icon: "building" },
      { href: "/staff/scorecard", label: "Monthly scorecard", icon: "star" },
    ],
  },
  {
    group: "Publish",
    items: [
      { href: "/staff/publish", label: "Post once", icon: "send" },
      { href: "/staff/approvals", label: "Approvals", icon: "check", badge: "5" },
      { href: "/staff/calendar", label: "Calendar", icon: "calendar" },
      { href: "/staff/menus", label: "Menus", icon: "list" },
      { href: "/staff/photo-post", label: "Photo post", icon: "image" },
      { href: "/staff/library", label: "Content library", icon: "layers" },
      { href: "/staff/studio", label: "Design studio", icon: "wand" },
    ],
  },
  {
    group: "Families",
    items: [
      { href: "/staff/messages", label: "Messages", icon: "sms", badge: "2" },
      { href: "/staff/families", label: "Families & contacts", icon: "users" },
    ],
  },
  {
    group: "Growth",
    items: [
      { href: "/staff/tours", label: "Tours & enquiries", icon: "calendar" },
      { href: "/staff/apartments", label: "Apartments & waitlist", icon: "building" },
      { href: "/staff/seo", label: "Search (SEO)", icon: "search" },
      { href: "/staff/geo", label: "AI search (GEO)", icon: "spark" },
    ],
  },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const c = params.get("c") ?? "";
  const [open, setOpen] = useState(false);
  const q = c ? `?c=${c}` : "";

  return (
    <div className={`sx ${open ? "nav-open" : ""}`} data-no-translate>
      <aside className="sx-side" aria-label="Staff navigation">
        <div className="sx-brand">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" fill="#4F6353" />
            <path d="M46 16c-16 0-27 8-29 24 0 2 0 4 1 6 8-14 17-19 25-22-8 5-16 12-22 26 3 1 6 1 9 1 14-1 21-14 20-30-1-2-2-4-4-5z" fill="#D6C28C" />
          </svg>
          <span>
            <b>Larkmoor</b>
            <span>Staff</span>
          </span>
        </div>
        <label className="sx-switch">
          <span className="vh">Community</span>
          <Icon name="building" />
          <select value={c} onChange={(e) => router.push(`${path}${e.target.value ? `?c=${e.target.value}` : ""}`)}>
            <option value="">All communities (6)</option>
            {communities.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}, {m.city}
              </option>
            ))}
          </select>
        </label>
        <nav className="sx-nav">
          {nav.map((g) => (
            <div key={g.group}>
              <p className="sx-nav-g">{g.group}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href + q} onClick={() => setOpen(false)} aria-current={path === it.href ? "page" : undefined}>
                      <Icon name={it.icon} />
                      <span>{it.label}</span>
                      {it.badge && <span className="sx-nav-badge">{it.badge}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="sx-user">
          <span className="sx-avatar">{user.initials}</span>
          <span>
            <b>{user.name}</b>
            <span>{user.role}</span>
          </span>
          <Link href="/staff" aria-label="Sign out" className="sx-out">
            <Icon name="logout" />
          </Link>
        </div>
      </aside>
      <div className="sx-main">
        <div className="sx-top">
          <button type="button" className="sx-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <Icon name="menu" />
          </button>
          <span className="sx-top-title">Larkmoor Staff</span>
          <div className="sx-top-right">
            <Link href={`/staff/messages${q}`} className="sx-bell" aria-label="2 unread replies">
              <Icon name="bell" />
              <i />
            </Link>
            <Link href="/" className="sx-site" target="_blank">
              <Icon name="globe" /> View website
            </Link>
          </div>
        </div>
        <div className="sx-page">{children}</div>
      </div>
      {open && <button type="button" className="sx-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
    </div>
  );
}
