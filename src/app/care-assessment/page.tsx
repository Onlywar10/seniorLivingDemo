import type { Metadata } from "next";
import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { CareAssessment } from "@/components/tools/CareAssessment";
import { site } from "@/data/site";
import "@/components/tools/tools.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Care Assessment",
  description: "Ten friendly questions to see whether Independent Living, Assisted Living Services or Harbor Memory Care is the right fit.",
};

export default function CareAssessmentPage() {
  return (
    <section className="ca-page">
      <Dots size={320} style={{ right: -90, top: -80, opacity: 0.22 }} />
      <div className="wrap ca-layout">
        <div className="ca-intro">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/living">Living Options</Link>
            </span>
            <span>
              <span aria-hidden="true">/ </span>
              <Link href="/care-assessment">Care Assessment</Link>
            </span>
          </nav>
          <p className="eyebrow">Care Assessment</p>
          <h1>
            What kind of support <em>fits</em>?
          </h1>
          <p className="ca-lede">A few friendly questions, about three minutes. We’ll suggest the living option that fits best, and why.</p>
          <div className="ca-intro-photo">
            <Image src="/img/mother-daughter.jpg" alt="A mother and her adult daughter smiling together" fill sizes="(max-width: 960px) 0px, 30vw" />
          </div>
          <p className="ca-intro-call small">
            <Icon name="phone" />
            <span>
              Rather talk it through? Call <span data-no-translate>Cynthia Bazin</span> at <a href={site.phoneHref}>{site.phone}</a>.
            </span>
          </p>
        </div>
        <CareAssessment />
      </div>
    </section>
  );
}
