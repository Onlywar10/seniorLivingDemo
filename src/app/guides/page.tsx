import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { guides } from "@/data/site";
import { guideSummaries } from "@/data/info";
import { GuideLibrary } from "@/components/info/GuideLibrary";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Senior Living Guides",
  description: "Free guides to choosing and paying for senior living: care options, costs, funding sources, insurance, VA Aid and Attendance, safety and staying social.",
};

export default function GuidesPage() {
  const items = guides.map((g, i) => ({ ...g, ...guideSummaries[i] }));
  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["Senior Living Guides", "/guides"]]}
        eyebrow="Free guides"
        title={
          <>
            Good decisions start with <em>good answers</em>
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
            <p className="eyebrow">Run the numbers</p>
            <h2>
              Senior living vs. <em>staying at home</em>
            </h2>
            <p className="muted">
              Add up what home really costs — the mortgage or rent, utilities, upkeep, groceries, transportation and help — and compare it with life here.
            </p>
          </div>
          <Link className="btn btn-lg" href="/cost-comparison">
            Compare the costs <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
