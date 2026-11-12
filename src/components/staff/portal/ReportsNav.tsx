// Which report tabs each role may open (shared by the pages and the tab bar). No "use client": pure data.
import type { Access } from "@/data/staff/shared";

export type ReportTab = "scorecard" | "engagement" | "attendance" | "families" | "surveys" | "search" | "communities" | "today";

export const REPORT_TABS: { k: ReportTab; href: string; label: string }[] = [
  { k: "scorecard", href: "/staff/reports", label: "Scorecard" },
  { k: "engagement", href: "/staff/reports/engagement", label: "Engagement" },
  { k: "attendance", href: "/staff/reports/attendance", label: "Attendance" },
  { k: "families", href: "/staff/reports/families", label: "Families" },
  { k: "surveys", href: "/staff/reports/surveys", label: "Surveys" },
  { k: "search", href: "/staff/reports/search", label: "Website and AI search" },
  { k: "communities", href: "/staff/reports/communities", label: "All communities" },
  { k: "today", href: "/staff/reports/today", label: "Today" },
];

/**
 * Managers see every report, starting with the scorecard; the activities team sees their own community's (no All
 * communities), starting with Engagement; sales sees only the prospect numbers, which live on the first tab.
 */
export function reportTabsFor(access: Access | undefined): { k: ReportTab; href: string; label: string }[] {
  if (access === "full") return REPORT_TABS;
  // The activities team opens on Engagement, with the scorecard further along.
  if (access === "community") {
    const mine = REPORT_TABS.filter((t) => t.k !== "communities" && t.k !== "today").map((t) => (t.k === "scorecard" ? { ...t, href: "/staff/reports?tab=scorecard" } : t));
    return [...mine.filter((t) => t.k === "engagement" || t.k === "attendance"), ...mine.filter((t) => t.k !== "engagement" && t.k !== "attendance")];
  }
  if (access === "prospect-numbers") return [{ k: "scorecard", href: "/staff/reports", label: "Prospect numbers" }];
  return [];
}

export const mayOpen = (access: Access | undefined, tab: ReportTab) => reportTabsFor(access).some((t) => t.k === tab);
