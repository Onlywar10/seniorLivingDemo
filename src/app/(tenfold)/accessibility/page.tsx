import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { corporate } from "@/data/tenfold";
import { summaries, TfHero } from "@/components/tenfold/parts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Accessibility"),
    description: t("Tenfold Senior Living’s accessibility statement: our WCAG 2.1 AA goal, text size, contrast and language tools, and ASL interpreters in our communities."),
  };
}

const tools = [
  { icon: "access", title: "Text size", text: "Use the A A A buttons at the top of every page to make text larger. Your choice is remembered on this device." },
  { icon: "eye", title: "High contrast", text: "Turn on High contrast at the top of the page for stronger colors and bolder outlines." },
  { icon: "translate", title: "Language", text: "Read the site in English, Español or 中文 (Simplified Chinese): choose from the language links at the top of every page." },
  { icon: "printer", title: "Print-friendly pages", text: "Calendars and menus print cleanly, without navigation or decoration." },
] as const;

export default async function AccessibilityPage() {
  const { t, href } = await getT();
  const all = summaries();
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[["Accessibility", "/accessibility"]]}
        eyebrow="Accessibility"
        title={
          <>
            {t("Easy to see, hear, reach ")}
            <em>{t("and read")}</em>
          </>
        }
        lede={t("Tenfold communities are homes for everyone, and our websites, printed materials and community spaces should be too.")}
      />
      <section className="sec tone-cream">
        <div className="wrap-narrow tf-legal">
          <h2>{t("Our commitment")}</h2>
          <p>
            {t("We aim for our website to meet the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. That means clear headings, text alternatives for images, labels on every form field, sufficient color contrast, visible focus outlines, large tap targets, and pages that work with a keyboard, a screen reader, or zoomed in on a phone.")}
          </p>
          <p>
            {t("We review the site regularly and test with assistive technology. Accessibility is ongoing work, and some pages or documents may not yet meet every standard. If something gets in your way, please tell us — we will fix it, and we will get you the information you need in the meantime.")}
          </p>

          <h2>{t("Tools on every page")}</h2>
          <ul className="tf-tools">
            {tools.map((x) => (
              <li key={x.title}>
                <span className="tf-feature-ico">
                  <Icon name={x.icon} />
                </span>
                <div>
                  <h3>{t(x.title)}</h3>
                  <p className="small">{t(x.text)}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2>{t("In our communities")}</h2>
          <ul>
            <li>
              <b>{t("ASL interpreters")}</b>
              {t(" are available for tours and community events. Let the community know when you book and they’ll arrange it.")}
            </li>
            <li>
              <b>{t("Reasonable accommodations")}</b>
              {t(" for people with disabilities, including hearing impairment. Just ask the front desk team.")}
            </li>
            <li>
              <b>{t("Accessible buildings")}</b>
              {t(" with elevators and accessible parking.")}
            </li>
          </ul>

          <h2>{t("Contact us about accessibility")}</h2>
          <p>
            {t("Email ")}
            <a href={`mailto:${corporate.email}`}>{corporate.email}</a>
            {t(" or call ")}
            <a href={corporate.phoneHref}>{corporate.phone}</a>
            {t(". Tell us the page or document and what you were trying to do, and we’ll respond within two business days.")}
          </p>
          <p className="small muted">
            {all.map((s) => (
              <span key={s.slug}>
                {s.c.site.name} · <a href={s.c.site.phoneHref}>{s.c.site.phone}</a> · {t(s.c.site.licence)}
                <br />
              </span>
            ))}
            {t("This statement was last reviewed in October 2026.")} <a href={href("/privacy")}>{t("Privacy policy")}</a>
          </p>
        </div>
      </section>
    </>
  );
}
