import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { Approvals } from "@/components/staff/Approvals";
import { Avatar, Badge, Card, PageHead } from "@/components/staff/ui";
import { ago, approvals, approvedRecently, staffPeople } from "@/data/staff";

export const metadata: Metadata = { title: "Approvals" };

export default function ApprovalsPage() {
  return (
    <>
      <PageHead title="Approvals" sub="Nothing with a resident’s photo, a price or a holiday menu goes public until a manager has seen it." />
      <Approvals items={approvals.map((a) => ({ ...a, when: ago(a.mins) }))} />
      <div className="sx-grid g-21">
        <Card title="Recently decided">
          <ul className="sx-feed">
            {approvedRecently.map((r) => (
              <li key={r.title}>
                <Avatar who={r.by} />
                <div>
                  <p>
                    <b>{r.title}</b> <span className="muted">from {staffPeople[r.by].name}</span>{" "}
                    {r.ok ? <Badge tone="good"><Icon name="check" /> Approved by Cheryl</Badge> : <Badge tone="warn">Changes requested</Badge>}
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
            <li><b>Resident photos on Facebook or the website</b><br /><span className="sx-hint">Cheryl Martin · checks photo consent is on file</span></li>
            <li><b>Pricing and availability</b><br /><span className="sx-hint">Cheryl Martin · prepared by Douglas Wigner</span></li>
            <li><b>Holiday and special-event menus</b><br /><span className="sx-hint">Cheryl Martin · prepared by Conrad Caguimbal</span></li>
            <li><b>Everyday events, menus and family texts</b><br /><span className="sx-hint">Publish straight away, no approval needed</span></li>
          </ul>
        </Card>
      </div>
    </>
  );
}
