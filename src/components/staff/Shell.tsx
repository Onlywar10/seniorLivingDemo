"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { user } from "@/data/staff/people";
import { Icon } from "../Icon";
import { CommunitySwitcher, useStaffCommunity } from "./StaffCommunity";
import { XIcon } from "./ui";

type IconName = Parameters<typeof Icon>[0]["name"];
type Item = { href: string; label: string; icon?: IconName; x?: "dash" | "repeat" | "trend" | "door" | "key" | "clipboard" | "shield"; badge?: number };

const navFor = (approvals: number, unread: number, alertCount: number, signups: number): { group: string; items: Item[] }[] => [
  {
    group: "Overview",
    items: [
      { href: "/staff/dashboard", label: "Dashboard", x: "dash" },
      { href: "/staff/alerts", label: "Alerts", icon: "bell", badge: alertCount },
      { href: "/staff/scorecard", label: "Monthly scorecard", icon: "chart" },
      { href: "/staff/leadership", label: "All communities", icon: "building" },
    ],
  },
  {
    group: "Publish",
    items: [
      { href: "/staff/publish", label: "Post once", icon: "send" },
      { href: "/staff/approvals", label: "Approvals", icon: "check", badge: approvals },
      { href: "/staff/calendar", label: "Calendar", icon: "calendar" },
      { href: "/staff/menus", label: "Menus", icon: "fork" },
      { href: "/staff/photo-post", label: "Photo post", icon: "image" },
      { href: "/staff/library", label: "Library & print", icon: "printer" },
    ],
  },
  {
    group: "Events",
    items: [
      { href: "/staff/sign-ups", label: "Sign-ups & RSVPs", x: "clipboard", badge: signups },
      { href: "/staff/attendance", label: "Attendance", icon: "users" },
      { href: "/staff/suggestions", label: "Resident suggestions", icon: "star" },
    ],
  },
  {
    group: "Families",
    items: [
      { href: "/staff/messages", label: "Messages", icon: "sms", badge: unread },
      { href: "/staff/families", label: "Families & contacts", icon: "heart" },
      { href: "/staff/surveys", label: "Surveys", icon: "list" },
    ],
  },
  {
    group: "Growth",
    items: [
      { href: "/staff/tours", label: "Tours & enquiries", x: "door" },
      { href: "/staff/apartments", label: "Apartments & waitlist", x: "key" },
      { href: "/staff/seo", label: "Search (SEO)", icon: "search" },
      { href: "/staff/geo", label: "AI search (GEO)", icon: "sparkle" },
    ],
  },
  {
    group: "Settings",
    items: [
      { href: "/staff/team", label: "Team & roles", x: "shield" },
    ],
  },
];

export function Shell({ children, badges }: { children: ReactNode; badges: { approvals: number; unread: number; alerts: number; signups: number } }) {
  const path = usePathname();
  const { scope, current, site } = useStaffCommunity();
  const name = current ? current.name : "Wrenhaven Senior Living";
  const unread = badges.unread;
  const nav = navFor(badges.approvals, unread, badges.alerts, badges.signups);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={`sx ${open ? "nav-open" : ""}`} data-no-translate>
      <a className="sx-skip" href="#sx-main">
        Skip to content
      </a>
      <aside className="sx-side" id="sx-nav" aria-label="Staff navigation">
        <div className="sx-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/brand/dots.png" alt="" width={38} height={38} />
          <span>
            <b>{name}</b>
            <span>Team</span>
          </span>
          <button type="button" className="sx-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon name="x" />
          </button>
        </div>
        <CommunitySwitcher />
        <nav className="sx-nav">
          {nav.map((g) => (
            <div key={g.group}>
              <p className="sx-nav-g">{g.group}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} onClick={() => setOpen(false)} aria-current={path === it.href ? "page" : undefined}>
                      {it.icon ? <Icon name={it.icon} /> : <XIcon name={it.x!} />}
                      <span>{it.label}</span>
                      {!!it.badge && (
                        <span className="sx-nav-badge">
                          {it.badge}
                          <span className="vh"> waiting</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <Link className="sx-kinlight" href="/kinlight" title="Kinlight, the platform this workspace runs on">
          <i aria-hidden="true" />
          <span>Powered by <b>Kinlight</b></span>
        </Link>
        <div className="sx-user">
          <span className="sx-avatar" style={{ background: "var(--terra-deep)" }} aria-hidden="true">
            {user.initials}
          </span>
          <span className="sx-user-t">
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
          <button type="button" className="sx-burger" aria-label="Open menu" aria-expanded={open} aria-controls="sx-nav" onClick={() => setOpen(true)}>
            <Icon name="menu" />
          </button>
          <Link href="/staff/dashboard" className="sx-top-brand" aria-label="Dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/brand/dots.png" alt="" width={28} height={28} />
            <span>{name}</span>
          </Link>
          <div className="sx-top-right">
            <Link href="/staff/publish" className="sx-btn sx-btn-primary sx-top-post" aria-label="New post">
              <Icon name="plus" /> <span>Post</span>
            </Link>
            <Link href="/staff/alerts" className="sx-bell" aria-label={`Alerts: ${badges.alerts} new`}>
              <Icon name="bell" />
              {badges.alerts > 0 && <i />}
            </Link>
            <Link href={site("/")} className="sx-site" target="_blank" rel="noopener" aria-label="View website (opens in a new tab)">
              <Icon name="globe" /> <span>View website</span>
            </Link>
          </div>
        </div>
        <main className="sx-page" id="sx-main">
          {/* Remount the screen when the community changes, so editors start from the new community's data. */}
          <Fragment key={scope}>{children}</Fragment>
        </main>
      </div>
      {open && <button type="button" className="sx-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setOpen(false)} />}
    </div>
  );
}
