import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { getCommunity } from "@/lib/community-server";
import { getT } from "@/i18n/server";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { site } = await getCommunity();
  return {
    title: t("Privacy & Cookie Policy"),
    description: t(`How ${site.name} and Tenfold Senior Living collect, use and protect your information, our cookie policy and SMS terms.`),
  };
}

const sections = [
  { id: "collect", title: "What we collect" },
  { id: "use", title: "How we use it" },
  { id: "share", title: "Who we share it with" },
  { id: "cookies", title: "Cookies" },
  { id: "sms", title: "SMS terms" },
  { id: "choices", title: "Your choices and rights" },
  { id: "contact", title: "Contact us" },
];

export default async function PrivacyPage() {
  const { t } = await getT();
  const { site } = await getCommunity();
  return (
    <>
      <PageHero
        crumbs={[["Privacy", "/privacy"]]}
        eyebrow="Privacy"
        title={
          <>
            {t("Privacy, cookies ")}
            <em>{t("& texts")}</em>
          </>
        }
        lede={`${site.name} is operated by ${site.operator}. This policy explains what we collect when you use our website, how we use it and the choices you have.`}
      />
      <section className="sec tone-cream">
        <div className="wrap inf-legal-wrap">
          <nav className="inf-toc" aria-label={t("On this page")}>
            <p className="small muted">{t("On this page")}</p>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{t(s.title)}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="inf-legal">
            <p className="small muted">{t("Last updated October 1, 2026")}</p>

            <h2 id="collect">{t("What we collect")}</h2>
            <p>
              <b>{t("Information you give us.")}</b>
              {t(" When you schedule a tour, send an enquiry, request a guide, sign up for updates or apply for a job, we collect what you enter — such as your name, phone number, email address, the person you are enquiring for, and your message.")}
            </p>
            <p>
              <b>{t("Information collected automatically.")}</b>
              {t(" Like most websites, we collect basic technical information such as your browser type, pages visited and the site that referred you. Your text size, contrast and language preferences are stored on your own device.")}
            </p>
            <p>{t("We do not knowingly collect information from children under 13.")}</p>

            <h2 id="use">{t("How we use it")}</h2>
            <ul className="inf-bullets">
              <li>{t("To respond to your enquiry, schedule and confirm your tour, and follow up afterwards")}</li>
              <li>{t("To send the guides, calendars, menus and updates you have asked for")}</li>
              <li>{t("To consider your job application")}</li>
              <li>{t("To understand how the site is used and improve it")}</li>
              <li>{t("To meet our legal and licensing obligations")}</li>
            </ul>
            <p>{t("We do not sell your personal information, and we do not share it with third parties for their own marketing.")}</p>

            <h2 id="share">{t("Who we share it with")}</h2>
            <p>
              {t("We share information with ")}
              {site.operator}
              {t(", which operates the community, and with service providers who help us run the website, send emails and texts, and manage enquiries and applications. They may use it only to provide those services to us. We may also disclose information when the law requires it.")}
            </p>
            <p>
              {t("Health information about residents is handled separately, under our resident agreements and applicable law, and is never collected through this website’s marketing forms.")}
            </p>

            <h2 id="cookies">{t("Cookies")}</h2>
            <p>
              <b>{t("Essential cookies and storage")}</b>
              {t(" make the site work and remember your choices, such as text size, contrast, language and your cookie preference. ")}
              <b>{t("Analytics cookies")}</b>
              {t(" help us understand which pages are useful. We only use analytics cookies if you accept them in the cookie banner, and you can change your mind at any time by clearing your browser’s site data for this website.")}
            </p>
            <p>{t("Embedded maps are provided by Google and are subject to Google’s privacy policy.")}</p>

            <h2 id="sms">{t("SMS terms")}</h2>
            <p>
              {t(`If you opt in to text messages, ${site.name} will send you recurring automated texts about the topics you chose — such as your tour, the weekly activity calendar, daily menus, photos and news, Harbor updates or urgent notices.`)}
            </p>
            <ul className="inf-bullets">
              <li>{t("Message frequency varies.")}</li>
              <li>{t("Message and data rates may apply.")}</li>
              <li>{t("Reply STOP to opt out at any time. You will receive one final message confirming you have been unsubscribed.")}</li>
              <li>
                {t("Reply HELP for help, or call ")}
                {site.phone}.
              </li>
              <li>{t("Consent to receive texts is not a condition of purchase or of residency.")}</li>
              <li>{t("Carriers are not liable for delayed or undelivered messages.")}</li>
              <li>{t("We do not share your mobile number or text-messaging consent with third parties for their marketing.")}</li>
            </ul>

            <h2 id="choices">{t("Your choices and rights")}</h2>
            <p>
              {t("You can unsubscribe from emails using the link in any email, and stop texts by replying STOP. California residents have the right to know what personal information we hold, to ask us to correct or delete it, and to not be discriminated against for exercising these rights. To make a request, contact us below. We will verify your request before acting on it.")}
            </p>

            <h2 id="contact">{t("Contact us")}</h2>
            <p>
              {site.name}, {site.addressLine}
              <br />
              <a href={site.phoneHref}>{site.phone}</a> · <a href={`mailto:${site.email}`}>{site.email}</a>
              <br />
              {t("Operated by ")}
              {site.operator} · {t(site.licence)}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
