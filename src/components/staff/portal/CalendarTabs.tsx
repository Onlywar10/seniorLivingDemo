"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

/** Events and Menus, two tabs of Calendar. */
export const CalendarTabs = () => (
  <SubTabs
    label="Calendar"
    tabs={[
      { href: "/staff/calendar", label: "Events" },
      { href: "/staff/calendar/menus", label: "Menus" },
    ]}
  />
);

/** The monthly reports, for managers. */
export const ReportTabs = () => (
  <SubTabs
    label="Reports"
    tabs={[
      { href: "/staff/reports", label: "Scorecard" },
      { href: "/staff/reports/surveys", label: "Surveys" },
      { href: "/staff/reports/search", label: "Website and AI search" },
      { href: "/staff/reports/communities", label: "All communities" },
    ]}
  />
);
