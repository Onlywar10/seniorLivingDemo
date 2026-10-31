"use client";

import Link from "@/i18n/Link";
import { useT } from "@/i18n/client";
import { useCommunity } from "@/lib/community";
import { communities, communitySlugs } from "@/data/communities";
import { Logo, Dots } from "./Logo";
import { Icon } from "./Icon";

const cols = [
  { title: "Living Options", links: [["Independent Living", "/living/independent-living"], ["Assisted Living Services", "/living/assisted-living"], ["Lantern Memory Care", "/living/lantern-memory-care"], ["Floor Plans & Pricing", "/floor-plans"], ["Care Assessment", "/care-assessment"], ["Cost Comparison", "/cost-comparison"]] },
  { title: "Life Here", links: [["Activity Calendar", "/calendar"], ["Dining & Menus", "/dining"], ["Events & Adventures", "/events-adventures"], ["Fitness", "/fitness"], ["Amazing Spaces", "/spaces"], ["Stay Connected", "/stay-connected"]] },
  { title: "About", links: [["Our Team", "/team"], ["Purpose & Values", "/about"], ["All Are Welcome", "/all-are-welcome"], ["News", "/news"], ["Senior Living Guides", "/guides"], ["FAQs", "/faq"], ["Careers", "/careers"], ["Info & Directions", "/contact"]] },
];

export function Footer() {
  const { t } = useT();
  const { site, slug } = useCommunity();
  const sisters = communitySlugs.filter((c) => c !== slug);
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
                <Icon name="facebook" /> {t(`${site.name} on Facebook`)}
              </a>
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h2>{t(c.title)}</h2>
              <ul>
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>{t(label)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-family">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Link href="~/" aria-label={t("Wrenhaven Senior Living home")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/brand/wrenhaven-white.png" alt={t("Wrenhaven Senior Living")} width={116} height={52} />
          </Link>
          <p>
            {t(`${site.name} is owned, designed, built and operated by `)}
            <Link href="~/">{site.operator}</Link>.<br />
            {t(sisters.length > 1 ? "Our sister communities:" : "Our sister community:")}{" "}
            {sisters.map((c, i) => (
              <span key={c}>
                {i > 0 && ", "}
                <Link href={`~/${c}`}>{communities[c].site.name}</Link>, {communities[c].site.address.city}
              </span>
            ))}
            .
          </p>
        </div>
        <div className="footer-bottom">
          <span>
            <span className="licence">{t(site.licence)}</span> · © 2026 {site.operator} · {t("Equal Housing Opportunity")}
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
