import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHero } from "@/components/PageHero";
import { CostComparison } from "@/components/tools/CostComparison";
import { guides, money, pricing, site } from "@/data/site";
import "@/components/tools/tools.css";

export const metadata: Metadata = {
  title: "Cost Comparison",
  description: `Compare what staying at home really costs each month with life at Prairie City Landing, from ${money(pricing.independentRange[0])} a month with no second-person fee.`,
};

export default function CostComparisonPage() {
  return (
    <>
      <PageHero
        eyebrow="Cost Comparison"
        title={
          <>
            What does staying home <em>really</em> cost?
          </>
        }
        lede="A house has a lot of bills hiding in it. Add yours up, line by line, and see how they compare with one monthly rent at Prairie City Landing."
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
            <Image src={guides[2].photo} alt="" fill sizes="(max-width: 860px) 100vw, 30vw" />
          </div>
          <div>
            <p className="eyebrow">Free guides</p>
            <h2>
              Planning the <em>money</em> side
            </h2>
            <p className="muted">
              Our {guides.length} senior living guides cover {guides[2].title.toLowerCase()}, {guides[3].title.replace(/^10 /, "ten ").toLowerCase()}, insurance options and VA Aid and Attendance. Download any of them, free.
            </p>
            <div className="btn-row">
              <Link href="/guides" className="btn btn-green">
                <Icon name="download" /> Browse the {guides.length} guides
              </Link>
              <a href={site.phoneHref} className="link-arrow">
                <Icon name="phone" /> Call {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
