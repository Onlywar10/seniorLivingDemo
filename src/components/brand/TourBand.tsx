import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";

/** Closing call to action used across the brand pages. */
export function TourBand({
  title = (
    <>
      Come see it for <em>yourself.</em>
    </>
  ),
  text = "Tour the apartments, meet the team and stay for lunch in one of our three restaurants — it’s on us.",
  photo = "/img/courtyard-dining.jpg",
}: {
  title?: React.ReactNode;
  text?: string;
  photo?: string;
}) {
  return (
    <section className="br-tour" aria-labelledby="br-tour-h">
      <div className="br-tour-photo">
        <Image src={photo} alt="" fill sizes="100vw" />
      </div>
      <div className="wrap br-tour-inner">
        <Dots size={200} style={{ right: -40, top: -60, opacity: 0.35 }} />
        <div className="br-tour-card">
          <p className="eyebrow">Visit Prairie City Landing</p>
          <h2 id="br-tour-h">{title}</h2>
          <p>{text}</p>
          <div className="btn-row">
            <Link className="btn btn-lg" href="/tour">
              <Icon name="calendar" /> Schedule a Tour
            </Link>
            <a className="btn btn-ghost btn-lg" href={site.phoneHref}>
              <Icon name="phone" /> Call {site.phone}
            </a>
          </div>
          <p className="small muted br-tour-meta">{site.hoursOffice}</p>
        </div>
      </div>
    </section>
  );
}
