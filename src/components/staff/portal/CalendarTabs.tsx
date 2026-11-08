"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Access } from "@/data/staff/shared";
import { reportTabsFor } from "./ReportsNav";

/** Tabs inside one section of the workspace. */
export function SubTabs({ tabs, label }: { tabs: { href: string; label: string }[]; label: string }) {
  const path = usePathname();
  return (
    <nav className="pt-subtabs" aria-label={label}>
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** The monthly reports: only the tabs the signed-in role may open (see reportTabsFor). */
export const ReportTabs = ({ access }: { access: Access | undefined }) => {
  const tabs = reportTabsFor(access);
  return tabs.length > 1 ? <SubTabs label="Reports" tabs={tabs.map(({ href, label }) => ({ href, label }))} /> : null;
};
