import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Accessibility statement" };

const items = [
  ["Text is 17 px or larger", "everywhere, 18 px for body copy, and every page reflows at 200% zoom without side-scrolling."],
  ["Contrast above WCAG AA", "on every colour pairing: nothing below 4.5:1, body text above 10:1."],
  ["Buttons and links are at least 44 px tall", "so they can be hit with a thumb or a shaky hand."],
  ["A visible focus outline", "on every control for people who use a keyboard."],
  ["Real headings and real tables", "with header cells, so a screen reader can read the rate table row by row."],
  ["Nothing is conveyed by colour alone.", "Calendar categories, the citation row and the availability dots all carry text."],
  ["Documents are checked before they publish.", "A PDF without tags or a scanned image is blocked until it is fixed."],
  ["Urgent notices are translated", "into Spanish, Russian and Vietnamese before they are sent."],
];

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader
        title="Built to be read at 78, or on a phone in a hospital car park"
        intro="The person reading this site is often the resident herself, or a daughter making a decision under stress on a small screen. So it is built to a standard, not a style."
      />
      <div className="wrap page-body">
        <section aria-labelledby="std-h">
          <SectionBar id="std-h" title="What we hold ourselves to" sub="WCAG 2.1 AA, checked on every publish" />
          <div className="panel">
            <div className="split">
              <ul className="checklist">
                {items.map(([b, t]) => (
                  <li key={b}>
                    <Icon name="check" />
                    <span>
                      <b>{b}</b> {t}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="prose">
                <p>We check every page and every document against WCAG 2.1 AA before it goes up, and we test the site with a screen reader and at 200% zoom.</p>
                <p style={{ margin: 0 }}>
                  If anything on this site is hard for you to use, tell the front desk on (503) 555-0142 or email the office, and we will fix it or read it to you over the phone.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
