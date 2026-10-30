import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { getCommunity } from "@/lib/community-server";
import { infoCopy } from "@/data/communities/copy/info";
import { GuideLibrary } from "@/components/info/GuideLibrary";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  const c = await getCommunity();
  return {
    title: t("Senior Living Guides"),
    description: t(infoCopy[c.slug].guidesMetaDescription),
  };
}

export default async function GuidesPage() {
  const { t } = await getT();
  const { guides, guideSummaries } = await getCommunity();
  const items = guides.map((g, i) => ({ ...g, ...guideSummaries[i] }));
  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["Senior Living Guides", "/guides"]]}
        eyebrow="Free guides"
        title={
          <>
            {t("Good decisions start with ")}
            <em>{t("good answers")}</em>
          </>
        }
        lede="Nine short, practical guides for families weighing senior living — what it is, what it costs, how people pay for it, and how to tell if it’s time."
        photo="/img/reading-together.jpg"
        alt="Two people reading together at a table"
      />
      <section className="sec tone-cream">
        <div className="wrap">
          <GuideLibrary guides={items} />
        </div>
      </section>
      <section className="sec-tight tone-white">
        <div className="wrap inf-compare">
          <div>
            <p className="eyebrow">{t("Run the numbers")}</p>
            <h2>
              {t("Senior living vs. ")}
              <em>{t("staying at home")}</em>
            </h2>
            <p className="muted">
              {t("Add up what home really costs — the mortgage or rent, utilities, upkeep, groceries, transportation and help — and compare it with life here.")}
            </p>
          </div>
          <Link className="btn btn-lg" href="/cost-comparison">
            {t("Compare the costs")} <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
