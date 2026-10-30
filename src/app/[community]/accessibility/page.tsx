import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { getCommunity } from "@/lib/community-server";
import { aboutCopy } from "@/data/communities/copy/about";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Accessibility"),
    description: t(aboutCopy[c.slug].accessMetaDescription),
  };
}

const tools = [
  { icon: "access", title: "Text size", text: "Use the A A A buttons at the top of every page to make text larger. Your choice is remembered on this device." },
  { icon: "eye", title: "High contrast", text: "Turn on High contrast at the top of the page for stronger colors and bolder outlines." },
  { icon: "translate", title: "Language", text: "Read the site in English, Español or 中文 (Simplified Chinese): choose from the language links at the top of every page." },
  { icon: "printer", title: "Print-friendly pages", text: "Calendars and menus print cleanly, without navigation or decoration." },
] as const;

export default async function AccessibilityPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site } = c;
  return (
    <>
      <PageHero
        crumbs={[["Accessibility", "/accessibility"]]}
        eyebrow="Accessibility"
        title={
          <>
            {t("Easy to see, hear, reach ")}
            <em>{t("and read")}</em>
          </>
        }
        lede={`${site.name} is a home for everyone, and our website, printed materials and community spaces should be too.`}
      />
      <section className="sec tone-cream">
        <div className="wrap-narrow inf-legal">
          <h2>{t("Our commitment")}</h2>
          <p>
            {t(
              "We aim for our website to meet the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. That means clear headings, text alternatives for images, labels on every form field, sufficient color contrast, visible focus outlines, large tap targets, and pages that work with a keyboard, a screen reader, or zoomed in on a phone.",
            )}
          </p>
          <p>
            {t(
              "We review the site regularly and test with assistive technology. Accessibility is ongoing work, and some pages or documents may not yet meet every standard. If something gets in your way, please tell us — we will fix it, and we will get you the information you need in the meantime.",
            )}
          </p>

          <h2>{t("Tools on every page")}</h2>
          <ul className="inf-tools">
            {tools.map((x) => (
              <li key={x.title}>
                <span className="inf-tool-ico">
                  <Icon name={x.icon} />
                </span>
                <div>
                  <h3>{t(x.title)}</h3>
                  <p className="small">{t(x.text)}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2>{t("In the community")}</h2>
          <ul className="inf-bullets">
            {aboutCopy[c.slug].accessInCommunity.map(([b, rest]) => (
              <li key={b}>
                <b>{t(b)}</b>
                {t(rest)}
              </li>
            ))}
          </ul>

          <h2>{t("Contact us about accessibility")}</h2>
          <p>
            {t("Email ")}
            <a href={`mailto:${site.accessibilityEmail}`}>{site.accessibilityEmail}</a>
            {t(" or call ")}
            <a href={site.phoneHref}>{site.phone}</a>
            {t(". Tell us the page or document and what you were trying to do, and we’ll respond within two business days.")}
          </p>
          <p className="small muted">
            {t(`${site.name} is operated by `)}
            {site.operator}. {t(site.licence)}
            {t(". This statement was last reviewed in October 2026.")}{" "}
            <Link href="/privacy">{t("Privacy policy")}</Link>
          </p>
        </div>
      </section>
    </>
  );
}
