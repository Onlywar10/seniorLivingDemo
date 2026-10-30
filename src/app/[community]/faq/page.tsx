import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { getCommunity } from "@/lib/community-server";
import { contactCopy } from "@/data/communities/copy/contact";
import { FaqSearch } from "@/components/info/FaqSearch";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Frequently Asked Questions"),
    description: t(contactCopy[c.slug].faqMetaDescription),
  };
}

export default async function FaqPage() {
  const { t } = await getT();
  const { site, team, faqGroups } = await getCommunity();
  const host = team.find((m) => m.role === "Community Relations Director");
  const hostFirst = host && !host.unnamed ? host.name.split(" ")[0] : null;
  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["FAQs", "/faq"]]}
        eyebrow="FAQs"
        title={
          <>
            {t("Questions families ")}
            <em>{t("ask us")}</em>
          </>
        }
        lede={`Straight answers about living here, care, visiting and moving in. If yours isn’t here, ${hostFirst ?? "our team"} is a phone call away.`}
      >
        <div className="btn-row">
          <a className="btn" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
          <Link className="btn btn-ghost" href="/contact#enquire">
            {t("Send a question")}
          </Link>
        </div>
      </PageHero>
      <section className="sec tone-cream">
        <div className="wrap">
          <FaqSearch groups={faqGroups} />
        </div>
      </section>
    </>
  );
}
