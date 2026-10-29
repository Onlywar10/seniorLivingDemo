import Link from "next/link";
import { site } from "@/data/site";

/** Prairie City Landing wordmark with the Tenfold confetti crescent. */
export function Logo({ light = false, href = "/" }: { light?: boolean; href?: string }) {
  return (
    <Link href={href} className={`logo ${light ? "light" : ""}`} aria-label={`${site.name} home`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/brand/dots.png" alt="" width={46} height={46} />
      <span className="logo-text">
        <b>{site.name}</b>
        <span>{site.byline}</span>
      </span>
    </Link>
  );
}

/** Decorative confetti crescent, placed absolutely by the caller. */
export function Dots({ size = 220, style, className = "" }: { size?: number; style?: React.CSSProperties; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/img/brand/dots.png" alt="" aria-hidden="true" width={size} height={size} className={`dots-deco ${className}`} style={style} />;
}
