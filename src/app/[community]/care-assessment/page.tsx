import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { CareAssessment } from "@/components/tools/CareAssessment";
import { getCommunity } from "@/lib/community-server";
import { keyPeople } from "@/data/communities/copy/living";
import "@/components/tools/tools.css";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("Care Assessment"),
    description: t("Ten friendly questions to see whether Independent Living, Assisted Living Services or Lantern Memory Care is the right fit."),
  };
}

export default async function CareAssessmentPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { site } = c;
  const contact = keyPeople(c).relations;
  return (
    <section className="ca-page">
      <Dots size={320} style={{ right: -90, top: -80, opacity: 0.22 }} />
      <div className="wrap ca-layout">
        <div className="ca-intro">
          <nav className="crumbs" aria-label={t("Breadcrumb")}>
            <Link href="/">{t("Home")}</Link>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/living">{t("Living Options")}</Link>
            </span>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/care-assessment">{t("Care Assessment")}</Link>
            </span>
          </nav>
          <p className="eyebrow">{t("Care Assessment")}</p>
          <h1>
            {t("What kind of support ")}<em>{t("fits")}</em>?
          </h1>
          <p className="ca-lede">{t("A few friendly questions, about three minutes. We’ll suggest the living option that fits best, and why.")}</p>
          <div className="ca-intro-photo">
            <Image src="/img/mother-daughter.jpg" alt={t("A mother and her adult daughter smiling together")} fill sizes="(max-width: 960px) 0px, 30vw" />
          </div>
          <p className="ca-intro-call small">
            <Icon name="phone" />
            <span>
              {t("Rather talk it through? Call ")}
              {contact && !contact.unnamed ? (
                <>
                  <span data-no-translate>{contact.name}</span>
                  {t(" at ")}
                </>
              ) : null}
              <a href={site.phoneHref}>{site.phone}</a>.
            </span>
          </p>
        </div>
        <CareAssessment />
      </div>
    </section>
  );
}
