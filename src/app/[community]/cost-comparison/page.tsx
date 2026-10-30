import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/PageHero";
import { CostComparison } from "@/components/tools/CostComparison";
import { money } from "@/data/shared";
import { getCommunity } from "@/lib/community-server";
import { toolsCopy } from "@/data/communities/copy/tools";
import "@/components/tools/tools.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const { pricing, site } = await getCommunity();
  return {
    title: t("Cost Comparison"),
    description: t(`Compare what staying at home really costs each month with life at ${site.name}, from ${money(pricing.independentRange[0])} a month with no second-person fee.`),
  };
}

export default async function CostComparisonPage() {
  const { t } = await getT();
  const c = await getCommunity();
  const { guides, site } = c;
  const moneyGuide = guides.find((g) => /cost|fund/i.test(g.title)) ?? guides[0];
  return (
    <>
      <PageHero
        eyebrow="Cost Comparison"
        title={
          <>
            {t("What does staying home ")}<em>{t("really")}</em>{t(" cost?")}
          </>
        }
        lede={`A house has a lot of bills hiding in it. Add yours up, line by line, and see how they compare with one monthly rent at ${site.name}.`}
        photo="/img/coffee-woman.jpg"
        alt="A resident enjoying a coffee in the sunshine"
        crumbs={[["Living Options", "/living"], ["Cost Comparison", "/cost-comparison"]]}
      />
      <section className="sec-tight tone-cream">
        <div className="wrap">
          <CostComparison />
        </div>
      </section>
      <section className="sec-tight tone-sand">
        <div className="wrap cc-guides">
          <div className="cc-guides-ph">
            <Image src={moneyGuide.photo} alt="" fill sizes="(max-width: 860px) 100vw, 30vw" />
          </div>
          <div>
            <p className="eyebrow">{t("Free guides")}</p>
            <h2>
              {t("Planning the ")}<em>{t("money")}</em>{t(" side")}
            </h2>
            <p className="muted">
              {t("Our ")}{guides.length}{t(" senior living guides cover ")}{toolsCopy[c.slug].guidesCover.map((x, i) => (i % 2 ? x : <span key={i}>{t(x)}</span>))}
            </p>
            <div className="btn-row">
              <Link href="/guides" className="btn btn-green">
                <Icon name="download" />{t(" Browse the ")}{guides.length}{t(" guides")}
              </Link>
              <a href={site.phoneHref} className="link-arrow">
                <Icon name="phone" />{t(" Call ")}{site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
