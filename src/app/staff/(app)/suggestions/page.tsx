import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SuggestionList } from "@/components/staff/alpha/Suggestions";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, Kpi, PageHead } from "@/components/staff/ui";
import { ago } from "@/data/staff";
import { suggestions } from "@/data/staff/alpha";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, dayShort, fromIso, today } from "@/lib/clock";
import "../../alpha.css";

export const metadata: Metadata = { title: "Resident suggestions" };

export default async function SuggestionsPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Resident suggestions" />;
  const { s } = sc;
  const list = suggestions(s.slug);
  const rows = list
    .map((x) => ({ ...x, ago: ago(x.days * 1440), eventWhen: x.becameEvent ? dayShort(fromIso(x.becameEvent.date)) : undefined }))
    .sort((a, b) => b.votes - a.votes);
  const became = list.filter((x) => x.status === "On the calendar");
  const fromQr = list.filter((x) => x.from === "QR code").length;
  const calName = s.people[s.roles.calendar].name;

  return (
    <>
      <PageHead title="Resident suggestions" sub={`What residents would like to see, read by ${calName} every week. Ideas that become activities are marked “Your idea” on the calendar.`}>
        <Link href="/staff/library#print" className="sx-btn"><Icon name="printer" /> Print suggestion slips</Link>
      </PageHead>
      <div className="sx-kpis">
        <Kpi label="Suggestions this quarter" value={list.length} note={`${list.length - fromQr} on paper · ${fromQr} by QR code`} />
        <Kpi label="New, not read yet" value={list.filter((x) => x.status === "New").length} note="read every Monday" />
        <Kpi label="Became activities" value={became.length} note={`${Math.round((became.length / list.length) * 100)}% of suggestions`} href="/staff/calendar" />
        <Kpi label="Planned" value={list.filter((x) => x.status === "Planned").length} note="being arranged" />
      </div>
      <div className="sx-grid g-21">
        <SuggestionList items={rows} nextSlot={dayShort(addDays(today(), 9))} />
        <div className="sx-grid">
          <Card title="On the calendar" sub="Ideas residents gave us">
            <ul className="sx-list">
              {rows.filter((x) => x.becameEvent).map((x) => (
                <li key={x.id}>
                  <b>{x.becameEvent?.title}</b> <span className="sx-hint">· {x.eventWhen}</span>
                  <br /><span className="sx-hint">“{x.text}” · {x.who ?? "Anonymous"}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="How suggestions come in">
            <ul className="sx-list">
              <li><b>Paper slips</b><br /><span className="sx-hint">A box at the front desk and in the Lantern lounge; staff type them in or photograph them.</span></li>
              <li><b>QR code</b><br /><span className="sx-hint">On every printed calendar and slip. Residents or their families scan it and type the idea.</span></li>
              <li><Link className="sx-link" href="/staff/library#print">Print more slips</Link><br /><span className="sx-hint">Letter, 4 per page, large print, with the QR code.</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
