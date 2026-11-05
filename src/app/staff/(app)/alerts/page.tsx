import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AlertSettings } from "@/components/staff/alpha/AlertSettings";
import { OpenCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, Kpi, PageHead, XIcon } from "@/components/staff/ui";
import { communities } from "@/data/communities";
import { ago } from "@/data/staff";
import { alertSettings, alerts, type StaffAlert } from "@/data/staff/alpha";
import { getStaffScope } from "@/data/staff/server";
import { communitySlugs, type CommunitySlug } from "@/lib/sites";
import "../../alpha.css";

export const metadata: Metadata = { title: "Alerts" };

const kindLabel: Record<StaffAlert["kind"], string> = { inquiry: "New inquiry", tour: "Tour booked", rsvp: "RSVP waiting", seat: "Seat request", stale: "Page going stale", reply: "Family replies" };
const go: Record<StaffAlert["kind"], string> = { inquiry: "Tours & enquiries", tour: "Tours & enquiries", rsvp: "Sign-ups & RSVPs", seat: "Sign-ups & RSVPs", stale: "Dashboard", reply: "Messages" };

function KindIcon({ kind }: { kind: StaffAlert["kind"] }) {
  if (kind === "tour") return <XIcon name="door" />;
  if (kind === "rsvp") return <XIcon name="clipboard" />;
  const m = { inquiry: "inbox", seat: "bus", stale: "clock", reply: "sms" } as const;
  return <Icon name={m[kind]} />;
}

function AlertList({ items }: { items: StaffAlert[] }) {
  return (
    <ul className="al-list">
      {items.map((a) => (
        <li key={a.id} className={a.mins < 60 * 24 ? "fresh" : ""}>
          <span className={`al-ico k-${a.kind}`}><KindIcon kind={a.kind} /></span>
          <div>
            <p className="al-list-t">
              <b>{a.title}</b> {a.urgent && <Badge tone="accent">Needs you</Badge>}
            </p>
            <p className="sx-hint">{a.detail}</p>
            <p className="al-list-m">
              <span className="sx-hint">{kindLabel[a.kind]} · {ago(a.mins)}</span>
            </p>
          </div>
          <Link href={a.href} className="sx-btn sx-btn-sm">{go[a.kind]} <Icon name="arrow" /></Link>
        </li>
      ))}
    </ul>
  );
}

export default async function AlertsPage() {
  const scope = await getStaffScope();
  const slugs: CommunitySlug[] = scope === "all" ? [...communitySlugs] : [scope];
  const lists = slugs.map((slug) => ({ slug, name: communities[slug].site.name, items: alerts(slug) }));
  const all = lists.flatMap((l) => l.items);
  const n = (k: StaffAlert["kind"]) => all.filter((a) => a.kind === k).length;
  const today = all.filter((a) => a.mins < 60 * 24).length;

  return (
    <>
      <PageHead
        title="Alerts"
        sub={scope === "all" ? "Every community’s alerts, grouped by community." : `What needs ${communities[scope].site.name}’s team, newest first. Each alert goes to the right person by text, email or in the app.`}
      />
      <div className="sx-kpis">
        <Kpi label="New today" value={today} note={`${all.length} in all`} />
        <Kpi label="Inquiries and tours" value={n("inquiry") + n("tour")} note="hand-off within 5 minutes" href="/staff/tours" />
        <Kpi label="RSVPs and seat requests" value={all.filter((a) => a.kind === "rsvp" || a.kind === "seat").length} note="answer within 1 business day" href="/staff/sign-ups" />
        <Kpi label="Pages going stale" value={n("stale")} note="older than they should be" href="/staff/dashboard" />
      </div>

      {scope === "all" ? (
        <div className="ov-grid">
          {lists.map((l) => (
            <Card key={l.slug} title={<>{l.name} <Badge tone="accent">{l.items.length}</Badge></>} action={<OpenCommunity slug={l.slug} name={l.name} />}>
              <AlertList items={l.items} />
            </Card>
          ))}
        </div>
      ) : (
        <div className="sx-grid">
          <Card title="Alerts" sub={`${lists[0].items.length} alerts · ${today} today`}>
            <AlertList items={lists[0].items} />
          </Card>
          <Card title="Alert settings" sub="Who gets which alert, and how">
            <AlertSettings rules={alertSettings(scope)} />
          </Card>
        </div>
      )}
    </>
  );
}
