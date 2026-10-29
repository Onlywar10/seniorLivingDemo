"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/data/site";
import { Logo } from "./Logo";
import { Icon } from "./Icon";

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Logo />
        <nav className="nav" aria-label="Main">
          {nav.map((n) =>
            n.children ? (
              <div className="nav-item" key={n.label}>
                <Link className="nav-link" href={n.href} aria-current={active(n.href) || n.children.some((c) => active(c.href.split("#")[0])) ? "page" : undefined}>
                  {n.label} <Icon name="chev" />
                </Link>
                <div className="nav-drop">
                  {n.children.map((c) => (
                    <Link key={c.href} href={c.href}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={n.label} className="nav-link" href={n.href} aria-current={active(n.href) ? "page" : undefined}>
                {n.label}
              </Link>
            )
          )}
        </nav>
        <div className="header-cta">
          <a className="header-phone" href={site.phoneHref}>
            <Icon name="phone" /> <span>{site.phone}</span>
          </a>
          <Link className="btn btn-sm" href="/tour">
            Schedule a Tour
          </Link>
        </div>
        <button type="button" className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon name="menu" />
        </button>
      </div>
      {open && (
        <div className="mnav" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mnav-top">
            <Logo />
            <button type="button" className="burger" style={{ display: "inline-flex" }} aria-label="Close menu" onClick={() => setOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          <Link href="/">Home</Link>
          {nav.map((n) =>
            n.children ? (
              <details key={n.label}>
                <summary>
                  {n.label} <Icon name="chev" />
                </summary>
                {n.children.map((c) => (
                  <Link key={c.href} href={c.href}>
                    {c.label}
                  </Link>
                ))}
              </details>
            ) : (
              <Link key={n.label} href={n.href}>
                {n.label}
              </Link>
            )
          )}
          <Link className="btn btn-lg" href="/tour">
            Schedule a Tour
          </Link>
          <a className="btn btn-ghost btn-lg" href={site.phoneHref}>
            <Icon name="phone" /> Call {site.phone}
          </a>
        </div>
      )}
    </header>
  );
}
