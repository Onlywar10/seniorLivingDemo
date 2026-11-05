import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { InviteMember } from "@/components/staff/alpha/Team";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Avatar, Badge, Card, Kpi, PageHead } from "@/components/staff/ui";
import { ago } from "@/data/staff";
import { teamRoles } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";
import "../../alpha.css";

export const metadata: Metadata = { title: "Team & roles" };

const roleTone = { Administrator: "accent", Manager: "info", Champion: "good", Sales: "info", Contributor: "neutral" } as const;

export default async function TeamPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Team & roles" />;
  const { s } = sc;
  const { people, perms, rules } = teamRoles(s.slug);
  const active = people.filter((p) => p.status === "Active");
  const week = active.filter((p) => p.lastPost !== undefined && p.lastPost < 60 * 24 * 7).length;

  return (
    <>
      <PageHead title="Team & roles" sub={`Who at ${s.brand.name} can post, edit and approve. Everyone signs in with their own account; every approval is logged.`} />
      <div className="sx-kpis">
        <Kpi label="Team members" value={people.length} note={`${active.length} active · ${people.length - active.length} invited`} />
        <Kpi label="Posted this week" value={<>{week}<small> / {active.length}</small></>} note="staff with at least one post" />
        <Kpi label="Approvers" value={people.filter((p) => p.perms.some((x) => x.startsWith("Approve"))).length} note="for photos, messages and RSVPs" />
        <Kpi label="Sends without approval" value={0} note="this month (approval log)" />
      </div>

      <Card title="Staff accounts" action={<InviteMember community={s.brand.name} />} pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last post</th></tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.key}>
                  <td><span className="sx-name"><Avatar who={p.key} size={30} /><span><b>{p.name}</b><small>{p.title}</small></span></span></td>
                  <td><Badge tone={roleTone[p.role as keyof typeof roleTone] ?? "neutral"}>{p.role}</Badge></td>
                  <td>{p.status === "Active" ? <Badge tone="good">Active</Badge> : <Badge tone="warn">Invited</Badge>}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{p.lastPost !== undefined ? ago(p.lastPost) : <span className="sx-hint">Not yet</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Permissions" sub="Who can post, and who approves what" pad={false}>
        <div className="sx-table-wrap">
          <table className="sx-table tm-matrix">
            <thead>
              <tr>
                <th>Team member</th>
                {perms.map((p) => <th key={p} className="tm-c"><span>{p}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.key}>
                  <td><b>{p.name}</b><small>{p.role}</small></td>
                  {perms.map((x) => (
                    <td key={x} className="tm-c">
                      {p.perms.includes(x) ? <span className="tm-yes" aria-label="Yes"><Icon name="check" /></span> : <span className="tm-no" aria-label="No">·</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Who approves what" sub="Nothing with a resident’s photo, a price or a family message goes out without the right person seeing it">
        <ul className="sx-list tm-rules">
          {rules.map((r) => (
            <li key={r.what}><b>{r.what}</b><span className="sx-hint">{r.who}</span></li>
          ))}
        </ul>
      </Card>
    </>
  );
}
