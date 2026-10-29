import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Dots } from "./Logo";

/** Standard inner-page hero: breadcrumb, eyebrow, title, lede, optional photo and actions. */
export function PageHero({ eyebrow, title, lede, photo, alt = "", crumbs = [], children, tone = "sand" }: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  photo?: string;
  alt?: string;
  crumbs?: [string, string][];
  children?: ReactNode;
  tone?: "sand" | "cream" | "white";
}) {
  const text = (
    <div>
      {crumbs.length > 0 && (
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          {crumbs.map(([label, href]) => (
            <span key={href}>
              <span aria-hidden="true">/ </span>
              <Link href={href}>{label}</Link>
            </span>
          ))}
        </nav>
      )}
      {eyebrow && <p className="eyebrow rise">{eyebrow}</p>}
      <h1 className="rise rise-2">{title}</h1>
      {lede && <p className="lede rise rise-3">{lede}</p>}
      {children && (
        <div className="rise rise-4" style={{ marginTop: 28 }}>
          {children}
        </div>
      )}
    </div>
  );
  return (
    <section className={`page-hero tone-${tone}`}>
      <Dots size={photo ? 220 : 300} style={photo ? { right: -70, bottom: -60, opacity: 0.28 } : { right: -60, top: -70, opacity: 0.22 }} />
      <div className="wrap">
        {photo ? (
          <div className="page-hero-photo">
            {text}
            <div className="ph rise rise-2">
              <Image src={photo} alt={alt} fill priority sizes="(max-width: 860px) 100vw, 50vw" />
            </div>
          </div>
        ) : (
          text
        )}
      </div>
    </section>
  );
}
