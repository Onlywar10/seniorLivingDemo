import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { getCommunity } from "@/lib/community-server";
import "@/components/info/info.css";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("Page not found") };
}

const links = [
  { href: "/calendar", label: "Activity calendar", icon: "calendar" },
  { href: "/dining", label: "Dining & menus", icon: "fork" },
  { href: "/floor-plans", label: "Floor plans & pricing", icon: "home" },
  { href: "/tour", label: "Schedule a tour", icon: "users" },
  { href: "/news", label: "News", icon: "doc" },
  { href: "/contact", label: "Info & directions", icon: "pin" },
] as const;

export default async function NotFound() {
  const { t } = await getT();
  const { site } = await getCommunity();
  return (
    <section className="sec tone-sand inf-404">
      <Dots size={320} style={{ right: -80, top: -40, opacity: 0.25 }} />
      <div className="wrap-narrow center">
        <p className="eyebrow">{t("Page not found")}</p>
        <h1>
          {t("We can’t find ")}
          <em>{t("that page")}</em>
        </h1>
        <p className="muted inf-404-lede">
          {t("It may have moved, or the link may be out of date. Here are some of the places people look for most — or call us at")}{" "}
          <a href={site.phoneHref}>{site.phone}</a>
          {t(" and we’ll point you in the right direction.")}
        </p>
        <ul className="inf-404-links">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                <Icon name={l.icon} /> {t(l.label)}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="btn" href="/">
          {t("Back to the home page")}
        </Link>
      </div>
    </section>
  );
}
