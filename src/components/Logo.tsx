"use client";

import Link from "@/i18n/Link";
import { useT } from "@/i18n/client";
import { useCommunity } from "@/lib/community";

/** The community wordmark beside the Wrenhaven mark. */
export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  const { t } = useT();
  const { site } = useCommunity();
  return (
    <Link href={href} className={`logo ${light ? "light" : ""}`} aria-label={t(`${site.name} home`)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/brand/dots.png" alt="" width={46} height={46} />
      <span className="logo-text">
        <b>{site.name}</b>
        <span>{t(site.byline)}</span>
      </span>
    </Link>
  );
}

/** The Wrenhaven mark as a decoration, placed absolutely by the caller. */
export function Dots({ size = 220, style, className = "" }: { size?: number; style?: React.CSSProperties; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/img/brand/dots.png" alt="" aria-hidden="true" width={size} height={size} className={`dots-deco ${className}`} style={style} />;
}
