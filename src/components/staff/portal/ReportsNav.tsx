// Which report tabs each role may open (shared by the pages and the tab bar). No "use client": pure data.
import type { Access } from "@/data/staff/shared";

export type ReportTab = "scorecard" | "engagement" | "families" | "surveys" | "search" | "communities";

export const REPORT_TABS: { k: ReportTab; href: string; label: string }[] = [
  { k: "scorecard", href: "/staff/reports", label: "Scorecard" },
  { k: "engagement", href: "/staff/reports/engagement", label: "Engagement" },
  { k: "families", href: "/staff/reports/families", label: "Families" },
  { k: "surveys", href: "/staff/reports/surveys", label: "Surveys" },
  { k: "search", href: "/staff/reports/search", label: "Website and AI search" },
  { k: "communities", href: "/staff/reports/communities", label: "All communities" },
];

/**
 * Managers see every report; the activities team sees their own community's (no All communities); sales sees
 * only the prospect numbers, which live on the first tab.
 */
export function reportTabsFor(access: Access | undefined): { k: ReportTab; href: string; label: string }[] {
  if (access === "full") return REPORT_TABS;
  if (access === "community") return REPORT_TABS.filter((t) => t.k !== "communities");
  if (access === "prospect-numbers") return [{ k: "scorecard", href: "/staff/reports", label: "Prospect numbers" }];
  return [];
}

export const mayOpen = (access: Access | undefined, tab: ReportTab) => reportTabsFor(access).some((t) => t.k === tab);
