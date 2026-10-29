import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Dots } from "@/components/Logo";
import { site } from "@/data/site";
import "@/components/info/info.css";

export const metadata: Metadata = {
  title: "Page not found",
};

const links = [
  { href: "/calendar", label: "Activity calendar", icon: "calendar" },
  { href: "/dining", label: "Dining & menus", icon: "fork" },
  { href: "/floor-plans", label: "Floor plans & pricing", icon: "home" },
  { href: "/tour", label: "Schedule a tour", icon: "users" },
  { href: "/news", label: "News", icon: "doc" },
  { href: "/contact", label: "Info & directions", icon: "pin" },
] as const;

export default function NotFound() {
  return (
    <section className="sec tone-sand inf-404">
      <Dots size={320} style={{ right: -80, top: -40, opacity: 0.25 }} />
      <div className="wrap-narrow center">
        <p className="eyebrow">Page not found</p>
        <h1>
          We can’t find <em>that page</em>
        </h1>
        <p className="muted inf-404-lede">
          It may have moved, or the link may be out of date. Here are some of the places people look for most — or call us at{" "}
          <a href={site.phoneHref}>{site.phone}</a> and we’ll point you in the right direction.
        </p>
        <ul className="inf-404-links">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>
                <Icon name={l.icon} /> {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="btn" href="/">
          Back to the home page
        </Link>
      </div>
    </section>
  );
}
