import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Approvals } from "@/components/staff/Approvals";
import { Avatar, Badge, Card, PageHead } from "@/components/staff/ui";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { ago, staffPeople } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Approvals" />;
  const { s } = sc;
  const { approvals, approvedRecently } = s;
  const approver = s.people[s.roles.approver].name;
  return (
    <>
      <PageHead title="Approvals" sub="Nothing with a resident’s photo, a price or a holiday menu goes public until a manager has seen it." />
      <Approvals items={approvals.map((a) => ({ ...a, when: ago(a.mins) }))} approver={approver} />
      <div className="sx-grid g-21">
        <Card title="Recently decided">
          <ul className="sx-feed">
            {approvedRecently.map((r) => (
              <li key={r.title}>
                <Avatar who={r.by} />
                <div>
                  <p>
                    <b>{r.title}</b> <span className="muted">from {staffPeople[r.by].name}</span>{" "}
                    {r.ok ? <Badge tone="good"><Icon name="check" /> Approved by {approver.split(" ")[0]}</Badge> : <Badge tone="warn">Changes requested</Badge>}
                  </p>
                  {r.note && <p className="sx-hint">{r.note}</p>}
                  <time>{ago(r.mins)}</time>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Who approves what">
          <ul className="sx-list">
            {s.approvalRules.map((r) => (
              <li key={r.what}><b>{r.what}</b><br /><span className="sx-hint">{r.who}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
