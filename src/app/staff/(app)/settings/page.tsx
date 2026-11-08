import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { AlertSettings } from "@/components/staff/alpha/AlertSettings";
import { PrintList } from "@/components/staff/alpha/Library";
import { NotYours } from "@/components/staff/portal/NotYours";
import { ApprovalRules, CommunityDetails, Team, type CommunityFacts } from "@/components/staff/portal/Settings";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { alertSettings, printItems, teamRoles } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { access } = await sectionAccess("settings");
  if (!access) return <NotYours section="Settings" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Settings" />;
  const { s, c } = sc;
  const r = s.roles;
  const { people } = teamRoles(s.slug);
  const name = (k: string) => s.people[k]?.name ?? k;
  // Who approves what, in plain words.
  const rules = [
    { what: "Resident photos", who: name(r.approver), note: "Kinlight checks photo consent first" },
    { what: "Prices and availability", who: name(r.approver) },
    { what: "Holiday and special menus", who: name(r.approver) },
    { what: "Changes to events families planned around", who: name(r.approver) },
    { what: "Family requests, after the resident says yes", who: name(r.calendar), note: "RSVPs to family events and seats on outings" },
    { what: "Lantern family requests", who: name(r.lantern), note: "The memory care director, who knows each resident" },
  ];
  const facts: CommunityFacts = {
    name: c.site.name,
    phone: c.site.phone,
    address: c.site.addressLine,
    hours: c.visiting,
    restaurants: c.venueOrder.map((k) => c.venues[k]).filter(Boolean).map((v) => ({ name: v.name, kind: v.kind, hours: v.hours })),
    rooms: Object.values(c.rooms),
    care: Object.values(c.living).map((l) => ({ name: l.name, note: l.key === "lantern" ? `${s.community.lanternResidents} residents` : undefined })),
  };
  return (
    <>
      <PageHead title="Settings" sub={`For administrators. Who can do what at ${s.brand.name}, who approves what, who hears about what, the things to print, and the community’s details.`} />
      <div className="sx-grid g-2">
        <Card title="Team and roles" sub="Pick a preset role for each person; adjust one person if you need to.">
          <Team people={people.map((p) => ({ key: p.key, name: p.name, title: p.title, preset: p.preset, invited: p.status === "Invited", adjusted: p.adjusted }))} community={s.brand.name} />
        </Card>
        <div className="sx-grid">
          <Card title="Approval rules" sub="Who approves resident photos, prices, special menus and family requests.">
            <ApprovalRules rules={rules} people={Object.entries(s.people).map(([key, p]) => ({ key, name: p.name, role: p.role }))} />
          </Card>
          <Card title="Community details" sub="Used everywhere automatically: the website, texts and emails, flyers, the newsletter and the AI’s answers.">
            <CommunityDetails facts={facts} />
          </Card>
        </div>
      </div>
      <Card title="Who gets which alert" sub="By text, email or in the staff area. Each one says when it’s expected.">
        <AlertSettings rules={alertSettings(s.slug)} />
      </Card>
      <Card title="Print" sub="Ready to print in large print, from what’s already posted.">
        <PrintList items={printItems(s.slug)} printer="the front desk printer" community={s.brand.name} />
      </Card>
    </>
  );
}
