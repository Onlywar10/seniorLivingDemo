import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { Icon } from "@/components/Icon";
import { site } from "@/data/site";
import { faqGroups } from "@/data/info";
import { FaqSearch } from "@/components/info/FaqSearch";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about living at Prairie City Landing: what’s included, care, pets, visiting, parking, mail, moving in and the community fee.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero
        crumbs={[["About", "/about"], ["FAQs", "/faq"]]}
        eyebrow="FAQs"
        title={
          <>
            Questions families <em>ask us</em>
          </>
        }
        lede="Straight answers about living here, care, visiting and moving in. If yours isn’t here, Cynthia is a phone call away."
      >
        <div className="btn-row">
          <a className="btn" href={site.phoneHref}>
            <Icon name="phone" /> {site.phone}
          </a>
          <Link className="btn btn-ghost" href="/contact#enquire">
            Send a question
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
