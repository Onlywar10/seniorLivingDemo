import type { Metadata } from "next";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { AlertSettings } from "@/components/staff/alpha/AlertSettings";
import { PrintList } from "@/components/staff/alpha/Library";
import { ApprovalRules, Team, type Preset } from "@/components/staff/portal/Settings";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, PageHead } from "@/components/staff/ui";
import { alertSettings, printItems, teamRoles } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const as = await getRole();
  if (!sectionsFor[as].includes("settings")) return <NotYours section="Settings" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Settings" />;
  const { s } = sc;
  const r = s.roles;
  const { people } = teamRoles(s.slug);
  const preset = (k: string): Preset => (k === r.approver ? "Administrator" : k === r.tours ? "Sales" : k === r.calendar || k === r.lantern ? "Approver" : "Poster");
  const first = (k: string) => s.people[k].name;
  // Who approves what, in plain words.
  const rules = [
    { what: "Resident photos", who: first(r.approver) },
    { what: "Changes to events families planned around", who: first(r.approver) },
    { what: "Prices and availability", who: first(r.approver) },
    { what: "Holiday and special menus", who: first(r.approver) },
    { what: "Family RSVPs and seat requests (after the resident says yes)", who: first(r.calendar) },
    { what: "Lantern family requests", who: first(r.lantern) },
  ];
  return (
    <>
      <PageHead title="Settings" sub={`For administrators. Who can do what at ${s.brand.name}, who hears about what, who approves what, and the things to print.`} />
      <div className="sx-grid g-2">
        <Card title="Team and roles" sub="Pick a role for each person; adjust one person if you need to.">
          <Team people={people.map((p) => ({ key: p.key, name: p.name, title: p.title, preset: preset(p.key), invited: p.status === "Invited" }))} community={s.brand.name} />
        </Card>
        <div className="sx-grid">
          <Card title="Approval rules" sub="Everything else goes out as soon as it’s posted.">
            <ApprovalRules rules={rules} people={Object.entries(s.people).map(([key, p]) => ({ key, name: p.name }))} />
          </Card>
          <Card title="Print" sub="Ready to print in large print, from what’s already posted.">
            <PrintList items={printItems(s.slug)} printer="the front desk printer" />
          </Card>
        </div>
      </div>
      <Card title="Who gets which alert" sub="By text, email or in the portal.">
        <AlertSettings rules={alertSettings(s.slug)} />
      </Card>
    </>
  );
}
