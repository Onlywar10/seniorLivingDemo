"use client";

import { createPortal } from "react-dom";
import Link from "@/i18n/Link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { useCommunity, useCommunityPath } from "@/lib/community";
import { Logo } from "./Logo";
import { Icon } from "./Icon";

export function Header() {
  const path = useCommunityPath();
  const { t } = useT();
  const { nav, site } = useCommunity();
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
        <nav className="nav" aria-label={t("Main")}>
          {nav.map((n) =>
            n.children ? (
              <div className="nav-item" key={n.label}>
                <Link className="nav-link" href={n.href} aria-current={active(n.href) || n.children.some((c) => active(c.href.split("#")[0])) ? "page" : undefined}>
                  {t(n.label)} <Icon name="chev" />
                </Link>
                <div className="nav-drop">
                  {n.children.map((c) => (
                    <Link key={c.href} href={c.href}>
                      {t(c.label)}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link key={n.label} className="nav-link" href={n.href} aria-current={active(n.href) ? "page" : undefined}>
                {t(n.label)}
              </Link>
            )
          )}
        </nav>
        <div className="header-cta">
          <a className="header-phone" href={site.phoneHref}>
            <Icon name="phone" /> <span>{site.phone}</span>
          </a>
          <Link className="btn btn-sm" href="/tour">
            {t("Schedule a Tour")}
          </Link>
        </div>
        <button type="button" className="burger" aria-label={t("Menu")} aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon name="menu" />
        </button>
      </div>
      {/* On the page itself, not inside the header: the header's backdrop-filter would trap a fixed panel in its own
          88px box, so the phone menu opened as a thin strip. */}
      {open && createPortal(
        <div className="mnav" role="dialog" aria-modal="true" aria-label={t("Menu")}>
          <div className="mnav-top">
            <Logo />
            <button type="button" className="burger" style={{ display: "inline-flex" }} aria-label={t("Close menu")} onClick={() => setOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          <Link href="/">{t("Home")}</Link>
          {nav.map((n) =>
            n.children ? (
              <details key={n.label}>
                <summary>
                  {t(n.label)} <Icon name="chev" />
                </summary>
                {n.children.map((c) => (
                  <Link key={c.href} href={c.href}>
                    {t(c.label)}
                  </Link>
                ))}
              </details>
            ) : (
              <Link key={n.label} href={n.href}>
                {t(n.label)}
              </Link>
            )
          )}
          <Link className="btn btn-lg" href="/tour">
            {t("Schedule a Tour")}
          </Link>
          <a className="btn btn-ghost btn-lg" href={site.phoneHref}>
            <Icon name="phone" /> {t(`Call ${site.phone}`)}
          </a>
        </div>,
        document.body,
      )}
    </header>
  );
}
