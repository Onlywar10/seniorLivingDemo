import Image from "next/image";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { getCommunity } from "@/lib/community-server";
import { tourCopy } from "@/data/communities/copy/tour";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";

/** Closing call to action used across the brand pages. */
export async function TourBand({
  title,
  text,
  photo = "/img/courtyard-dining.jpg",
}: {
  title?: React.ReactNode;
  text?: string;
  photo?: string;
}) {
  const { t } = await getT();
  const { site, slug } = await getCommunity();
  text ??= tourCopy[slug].lunchOnUs
    ? "Tour the apartments, meet the team and stay for lunch in one of our three restaurants — it’s on us."
    : "Tour the apartments, meet the team and see the three restaurants for yourself.";
  return (
    <section className="br-tour" aria-labelledby="br-tour-h">
      <div className="br-tour-photo">
        <Image src={photo} alt="" fill sizes="100vw" />
      </div>
      <div className="wrap br-tour-inner">
        <Dots size={200} style={{ right: -40, top: -60, opacity: 0.35 }} />
        <div className="br-tour-card">
          <p className="eyebrow">{t(`Visit ${site.name}`)}</p>
          <h2 id="br-tour-h">
            {title ?? (
              <>
                {t("Come see it for ")}<em>{t("yourself.")}</em>
              </>
            )}
          </h2>
          <p>{t(text)}</p>
          <div className="btn-row">
            <Link className="btn btn-lg" href="/tour">
              <Icon name="calendar" /> {t("Schedule a Tour")}
            </Link>
            <a className="btn btn-ghost btn-lg" href={site.phoneHref}>
              <Icon name="phone" /> {t("Call ")}{site.phone}
            </a>
          </div>
          <p className="small muted br-tour-meta">{t(site.hoursOffice)}</p>
        </div>
      </div>
    </section>
  );
}
