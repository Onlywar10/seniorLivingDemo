import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { site } from "@/data/site";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "Prairie City Landing’s accessibility statement: our WCAG 2.1 AA goal, text size, contrast and language tools, ASL interpreters and large-print calendars.",
};

const tools = [
  { icon: "access", title: "Text size", text: "Use the A A A buttons at the top of every page to make text larger. Your choice is remembered on this device." },
  { icon: "eye", title: "High contrast", text: "Turn on High contrast at the top of the page for stronger colors and bolder outlines." },
  { icon: "translate", title: "Language", text: "Switch the site between English and Español at the top of every page." },
  { icon: "printer", title: "Print-friendly pages", text: "Calendars and menus print cleanly, without navigation or decoration." },
] as const;

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        crumbs={[["Accessibility", "/accessibility"]]}
        eyebrow="Accessibility"
        title={
          <>
            Easy to see, hear, reach <em>and read</em>
          </>
        }
        lede="Prairie City Landing is a home for everyone, and our website, printed materials and community spaces should be too."
      />
      <section className="sec tone-cream">
        <div className="wrap-narrow inf-legal">
          <h2>Our commitment</h2>
          <p>
            We aim for our website to meet the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. That means clear headings, text alternatives
            for images, labels on every form field, sufficient color contrast, visible focus outlines, large tap targets, and pages that work with a
            keyboard, a screen reader, or zoomed in on a phone.
          </p>
          <p>
            We review the site regularly and test with assistive technology. Accessibility is ongoing work, and some pages or documents may not yet meet
            every standard. If something gets in your way, please tell us — we will fix it, and we will get you the information you need in the meantime.
          </p>

          <h2>Tools on every page</h2>
          <ul className="inf-tools">
            {tools.map((t) => (
              <li key={t.title}>
                <span className="inf-tool-ico">
                  <Icon name={t.icon} />
                </span>
                <div>
                  <h3>{t.title}</h3>
                  <p className="small">{t.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2>In the community</h2>
          <ul className="inf-bullets">
            <li>
              <b>ASL interpreters</b> are available for tours, care conferences and community events. Let us know when you book and we’ll arrange it.
            </li>
            <li>
              <b>Large-print calendars</b> are available at the front desk every month, and we’re happy to mail one to family members.
            </li>
            <li>
              <b>Accessible buildings</b> with elevators, wide corridors, accessible parking at the main entrance and a covered drop-off at the Lobby.
            </li>
            <li>
              <b>Assistive listening</b> in the Theatre for movies, lectures and services. Ask an Ambassador for a receiver.
            </li>
          </ul>

          <h2>Contact us about accessibility</h2>
          <p>
            Email <a href={`mailto:${site.accessibilityEmail}`}>{site.accessibilityEmail}</a> or call <a href={site.phoneHref}>{site.phone}</a>. Tell us
            the page or document and what you were trying to do, and we’ll respond within two business days.
          </p>
          <p className="small muted">
            Prairie City Landing is operated by {site.operator}. {site.licence}. This statement was last reviewed in October 2026.{" "}
            <Link href="/privacy">Privacy policy</Link>
          </p>
        </div>
      </section>
    </>
  );
}
