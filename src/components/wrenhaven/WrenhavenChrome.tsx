"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "@/i18n/Link";
import { useT, usePath } from "@/i18n/client";
import { communities, communitySlugs } from "@/data/communities";
import { communityFacts, corporate } from "@/data/wrenhaven";
import { UtilityBar } from "@/components/UtilityBar";
import { LangSuggest } from "@/components/LangSuggest";
import { CookieConsent } from "@/components/CookieConsent";
import { Icon } from "@/components/Icon";
import "./wrenhaven.css";

interface Child { label: string; href: string; note?: string; translateLabel?: boolean }
interface NavItem { label: string; href: string; children?: Child[] }

const nav: NavItem[] = [
  {
    label: "Communities",
    href: "/communities",
    children: [
      ...communitySlugs.map((s) => ({ label: communities[s].site.name, note: communities[s].site.address.city, href: `/${s}`, translateLabel: false })),
      { label: "Coming 2027", href: "/communities#coming", note: "Calder · Sorrel Valley" },
    ],
  },
  {
    label: "Living Options",
    href: "/living/independent-living",
    children: [
      { label: "Independent Living", href: "/living/independent-living" },
      { label: "Assisted Living Services", href: "/living/assisted-living" },
      { label: "Lantern Memory Care", href: "/living/lantern-memory-care" },
    ],
  },
  { label: "Lifestyle", href: "/lifestyle" },
  { label: "About Wrenhaven", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

/** The Wrenhaven wordmark: confetti crescent and name. */
export function WrenhavenLogo({ light = false }: { light?: boolean }) {
  const { t } = useT();
  return (
    <Link href="/" className={`logo tf-logo ${light ? "light" : ""}`} aria-label={t("Wrenhaven Senior Living home")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/brand/dots.png" alt="" width={46} height={46} />
      <span className="logo-text">
        <b>Wrenhaven</b>
        <span>{t("Senior Living")}</span>
      </span>
    </Link>
  );
}

export function WrenhavenHeader() {
  const { t } = useT();
  const path = usePath();
  // The menu is open for the page it was opened on, so it closes itself when the visitor navigates.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const setOpen = (v: boolean) => setOpenOn(v ? path : null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const label = (c: Child) => (c.translateLabel === false ? c.label : t(c.label));
  return (
    <header className="header tf-header">
      <div className="wrap header-inner">
        <WrenhavenLogo />
        <nav className="nav" aria-label={t("Main")}>
          {nav.map((n) =>
            n.children ? (
              <div className="nav-item" key={n.label}>
                <Link className="nav-link" href={n.href} aria-current={active(n.href) || n.children.some((c) => active(c.href.split("#")[0])) ? "page" : undefined}>
                  {t(n.label)} <Icon name="chev" />
                </Link>
                <div className="nav-drop tf-drop">
                  {n.children.map((c) => (
                    <Link key={c.href} href={c.href}>
                      <b>{label(c)}</b>
                      {c.note && <span>{t(c.note)}</span>}
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
          <Link className="btn btn-sm" href="/communities#find">
            {t("Find a community")}
          </Link>
        </div>
        <button type="button" className="burger" aria-label={t("Menu")} aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon name="menu" />
        </button>
      </div>
      {open && (
        <div className="mnav" role="dialog" aria-modal="true" aria-label={t("Menu")}>
          <div className="mnav-top">
            <WrenhavenLogo />
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
                {n.label === "Communities" && <Link href="/communities">{t("All communities")}</Link>}
                {n.children.map((c) => (
                  <Link key={c.href} href={c.href}>
                    {label(c)}
                    {c.note && <span className="tf-mnav-note"> · {t(c.note)}</span>}
                  </Link>
                ))}
              </details>
            ) : (
              <Link key={n.label} href={n.href}>
                {t(n.label)}
              </Link>
            )
          )}
          <Link className="btn btn-lg" href="/communities#find">
            {t("Find a community")}
          </Link>
          <a className="btn btn-ghost btn-lg" href={corporate.phoneHref}>
            <Icon name="phone" /> {t(`Call ${corporate.phone}`)}
          </a>
        </div>
      )}
    </header>
  );
}

const footerLinks: [string, string][] = [
  ["Our communities", "/communities"],
  ["Independent Living", "/living/independent-living"],
  ["Assisted Living Services", "/living/assisted-living"],
  ["Lantern Memory Care", "/living/lantern-memory-care"],
  ["Lifestyle", "/lifestyle"],
  ["About Wrenhaven", "/about"],
  ["All Are Welcome", "/all-are-welcome"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
];

export function WrenhavenFooter() {
  const { t } = useT();
  return (
    <footer className="footer tf-footer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/brand/dots.png" alt="" aria-hidden="true" width={420} height={420} className="dots-deco" style={{ right: -120, top: -80, opacity: 0.16 }} />
      <div className="wrap">
        <div className="tf-footer-top">
          <div>
            <Link href="/" aria-label={t("Wrenhaven Senior Living home")} className="tf-footer-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/brand/wrenhaven-white.png" alt={t("Wrenhaven Senior Living")} width={140} height={63} />
            </Link>
            <h2>{t("Corporate office")}</h2>
            <div className="footer-contact">
              <a href={corporate.mapsUrl} target="_blank" rel="noreferrer">
                <Icon name="pin" /> {corporate.addressLine}
              </a>
              <a href={corporate.phoneHref}>
                <Icon name="phone" /> {corporate.phone}
              </a>
              <a href={`mailto:${corporate.email}`}>
                <Icon name="mail" /> {corporate.email}
              </a>
            </div>
          </div>
          {communitySlugs.map((s) => {
            const { site } = communities[s];
            return (
              <div key={s} className="tf-footer-comm">
                <h2>{site.name}</h2>
                <p className="tf-footer-opened">
                  {site.address.city}
                  {t(`, opened ${communityFacts[s].opened}`)}
                </p>
                <div className="footer-contact">
                  <a href={site.mapsUrl} target="_blank" rel="noreferrer">
                    <Icon name="pin" /> {site.addressLine}
                  </a>
                  <a href={site.phoneHref}>
                    <Icon name="phone" /> {site.phone}
                  </a>
                  <span className="licence">{t(site.licence)}</span>
                  <Link href={`/${s}`} className="tf-footer-visit">
                    {t(`Visit ${site.name}`)} <Icon name="arrow" />
                  </Link>
                </div>
              </div>
            );
          })}
          <div>
            <h2>{t("Explore")}</h2>
            <ul>
              {footerLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href}>{t(label)}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © 2026 {corporate.name} · {t("Equal Housing Opportunity")}
          </span>
          <nav aria-label={t("Footer")}>
            <Link href="/accessibility">{t("Accessibility")}</Link>
            <Link href="/privacy">{t("Privacy")}</Link>
            <Link href="/careers">{t("Careers")}</Link>
            <Link href="/staff">
              <Icon name="lock" /> {t("Staff sign in")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/** Chrome for the Wrenhaven parent site (/, /communities, /about…). Each community has CommunityChrome. */
export function WrenhavenChrome({ children }: { children: ReactNode }) {
  const { t } = useT();
  return (
    <>
      <a className="skip" href="#main">
        {t("Skip to content")}
      </a>
      <LangSuggest />
      <UtilityBar />
      <WrenhavenHeader />
      <main id="main">{children}</main>
      <WrenhavenFooter />
      <CookieConsent />
    </>
  );
}
