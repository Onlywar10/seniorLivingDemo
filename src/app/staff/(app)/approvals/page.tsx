import type { Metadata } from "next";
import Link from "next/link";
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
      <PageHead title="Approvals" sub="Nothing with a resident’s photo, a price or a holiday menu goes public until a manager has seen it, on the desktop or on their phone." />
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
        <div className="sx-grid">
          <Card title="Who approves what" action={<Link className="sx-btn sx-btn-sm" href="/staff/team">Team & roles</Link>}>
            <ul className="sx-list">
              {s.approvalRules.map((r) => (
                <li key={r.what}><b>{r.what}</b><br /><span className="sx-hint">{r.who}</span></li>
              ))}
            </ul>
            <p className="sx-note" style={{ marginBottom: 0 }}>
              Change who approves what, and who may post, in <Link className="sx-link" href="/staff/team">Team & roles</Link>.
            </p>
          </Card>
          <Card title="Approving on the go">
            <p style={{ margin: 0 }}>
              Approvers get each request on their phone as a notification, with the photo, the change or the menu, and can approve, crop or send it back in one tap. Nothing waits for them to be at a desk.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
