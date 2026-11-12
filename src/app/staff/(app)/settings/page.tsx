import type { Metadata } from "next";
import "@/app/staff/reports.css";
import { SignalRules } from "@/components/staff/alpha/SignalRules";
import { PrintList } from "@/components/staff/alpha/Library";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { ActivityCategories, ApprovalRules, AreaList, CommunityDetails, ExportData, PresetHelp, SettingsTabs, Team, type CommunityFacts } from "@/components/staff/portal/Settings";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { printItems, teamRoles } from "@/data/staff/alpha";
import { roleNames } from "@/data/staff/portal";
import { AreasSettings } from "@/components/staff/portal/Areas";
import { areasOf, placements } from "@/data/staff/areas";
import { getAlertRules, getAreaState, getStaffCommunity } from "@/data/staff/server";

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
  // Who approves what, in plain words. The notes sit behind the card's "?".
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
  const signalRules = await getAlertRules();
  const areaState = await getAreaState();
  const placed = placements(s.slug, areaState.placed);
  const areaRows = areasOf(s.slug).map((a) => ({ key: a.key, name: a.name, note: a.note, lantern: a.lantern, lead: name(a.lead), leadRole: s.people[a.lead]?.role ?? "", count: placed.filter((p) => p.area?.key === a.key).length }));
  const approves = new Set(people.filter((p) => p.preset === "Approver" || p.preset === "Administrator").map((p) => p.key));
  const team = (
    <>
      <Card title="Team and roles" sub="A preset role for each person" action={<PresetHelp />}>
        <Team people={people.map((p) => ({ key: p.key, name: p.name, title: p.title, preset: p.preset, invited: p.status === "Invited", adjusted: p.adjusted }))} community={s.brand.name} />
      </Card>
      <Card
        title="Who looks after whom"
        sub="Optional: each resident’s area and the person who looks after them"
        action={<Help label="About who looks after whom" align="end"><p>In assisted living and memory care, caregivers and area leads usually look after a set group of residents. Turn this on and everything to do with a resident goes to that person.</p><p>When it’s off, the staff area works by role, as it does now. The areas themselves are set once, under Community.</p></Help>}
      >
        <AreasSettings on={areaState.on} areas={areaRows} placed={areaState.placed} unplaced={placed.filter((p) => !p.area).map((p) => ({ name: p.name, apt: p.apt, reason: p.reason }))} />
      </Card>
    </>
  );
  const approvals = (
    <div className="sx-grid">
      <Card
        title="Approval rules"
        sub="Who approves what"
        action={
          <Help label="About approval rules" align="end">
            <p>Nothing on this list goes out without the approval set here. Everything else publishes as soon as it’s saved. Emergencies and closures always skip approval.</p>
            <ul>{rules.filter((x) => x.note).map((x) => <li key={x.what}><b>{x.what}:</b> {x.note}.</li>)}</ul>
          </Help>
        }
      >
        <ApprovalRules rules={rules} people={Object.entries(s.people).map(([key, p]) => ({ key, name: p.name, role: p.role, approves: approves.has(key) }))} />
      </Card>
      <Card
        title="What reaches Today, and who gets a text"
        sub="One set of rules for Today, the menu number and text alerts"
        action={
          <Help label="About these rules" align="end">
            <p>Each kind of thing that needs a person goes to one owner. Time-sensitive ones (due within the hour) also send a text; active ones wait on Today; passive ones only go in the Friday summary.</p>
            <p>“Whoever it’s about” means the person who led the activity, owns the page or the concern, or looks after the resident.</p>
          </Help>
        }
      >
        <SignalRules rules={signalRules} names={roleNames(s.slug)} />
      </Card>
    </div>
  );
  const community = (
    <div className="sx-grid g-2">
      <Card title="Community details" sub="Used everywhere" action={<Help label="Where these are used" align="end"><p>The website, texts and emails, flyers, the newsletter and the AI’s answers all read these, so a change here shows everywhere.</p></Help>}>
        <CommunityDetails facts={facts} />
      </Card>
      <div className="sx-grid">
        <Card title="Floors and areas" sub="Set once, used everywhere" action={<Help label="Where these are used" align="end"><p>“Who it’s for” on events, the audience for announcements, and Who looks after whom all use this list.</p></Help>}>
          <AreaList areas={areasOf(s.slug).map((a) => ({ name: a.name, note: a.note }))} />
        </Card>
        <Card title="Activity categories" sub="What kind of activity it is" action={<Help label="Where these are used" align="end"><p>The event form, the activity sheet and the attendance report. Separate from who an activity is for.</p></Help>}>
          <ActivityCategories />
        </Card>
      </div>
    </div>
  );
  const print = (
    <Card title="Print" sub="Large print, from what’s already posted">
      <PrintList items={printItems(s.slug)} printer="the front desk printer" community={s.brand.name} />
    </Card>
  );
  const data = (
    <Card title="Export all your data" sub="Everything, in one download" action={<Help label="About the export" align="end"><p>Your data is yours. The export has everything Kinlight holds for {s.brand.name}, so you can take it anywhere.</p><p>A full export is tested once during the alpha (promise D11).</p></Help>}>
      <ExportData community={s.brand.name} />
    </Card>
  );
  return (
    <>
      <PageHead title="Settings" sub={`${s.brand.name} · for administrators`} />
      <SettingsTabs tabs={[
        { k: "team", label: "Team", node: team },
        { k: "approvals", label: "Approvals and alerts", node: approvals },
        { k: "community", label: "Community", node: community },
        { k: "print", label: "Print", node: print },
        { k: "data", label: "Data", node: data },
      ]} />
    </>
  );
}
