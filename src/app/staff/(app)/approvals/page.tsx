import type { Metadata } from "next";
import { PageHead, Card, Badge } from "@/components/staff/ui";
import { Approvals } from "@/components/staff/Approvals";
import { nameOf } from "@/data/staff";

export const metadata: Metadata = { title: "Approvals" };

const rules = [
  { what: "Calendar, menus, photos", who: "Publish immediately", tone: "good" as const },
  { what: "News posts and flyers", who: "Executive Director approves", tone: "warn" as const },
  { what: "Rates and apartment prices", who: "Executive Director + VP Sales", tone: "warn" as const },
  { what: "Staff profiles", who: "HR, then Executive Director", tone: "warn" as const },
  { what: "Urgent notices", who: "Send immediately; ED and nurse on duty can send", tone: "bad" as const },
];

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return (
    <>
      <PageHead title="Approvals" sub="Items your teams have submitted that need a manager’s sign-off before they publish." />
      <div className="sx-grid g-21">
        <Approvals where={c ? nameOf(c) : undefined} />
        <Card title="Who approves what" sub="Set once for the organisation">
          <ul className="sx-list">
            {rules.map((r) => (
              <li key={r.what} className="sx-fresh">
                <b>{r.what}</b>
                <Badge tone={r.tone}>{r.tone === "good" ? "No approval" : r.tone === "bad" ? "Bypasses approval" : "Approval"}</Badge>
                <small>{r.who}</small>
              </li>
            ))}
          </ul>
          <p className="sx-note">Average time to approval this month: 41 minutes.</p>
        </Card>
      </div>
    </>
  );
}
