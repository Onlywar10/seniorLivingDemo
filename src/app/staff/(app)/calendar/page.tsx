import type { Metadata } from "next";
import Link from "next/link";
import { PageHead, Card, Badge } from "@/components/staff/ui";
import { CalendarEditor } from "@/components/staff/Editors";
import { Icon } from "@/components/Icon";
import { categories, getWeek, community } from "@/data/community";
import { scope } from "@/data/staff";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const s = scope(c ?? "larkmoor-house");
  const st = s.list[0];
  return (
    <>
      <PageHead title="Activity calendar" sub={`${s.label} · ${community.weekLabel}`}>
        <Link className="sx-btn" href={`/staff/publish${c ? `?c=${c}` : ""}`}>
          <Icon name="upload" /> Upload the paper calendar
        </Link>
        <Link className="sx-btn" href="/larkmoor-house/activities" target="_blank">
          <Icon name="eye" /> View on website
        </Link>
        <button className="sx-btn sx-btn-primary" type="button">
          <Icon name="printer" /> Print large-print calendar
        </button>
      </PageHead>
      <Card
        title="This week"
        sub={`Last published ${st.calendarUpdated} · changes go live as you make them`}
        action={<Badge tone={st.fresh === "stale" ? "bad" : "good"}>{st.fresh === "stale" ? "Out of date" : "Live"}</Badge>}
      >
        <div className="sx-legend">
          {Object.entries(categories).map(([k, v]) => (
            <span key={k}>
              <i className={`cat c-${k}`} style={{ height: 10, width: 10 }} /> {v}
            </span>
          ))}
        </div>
        <CalendarEditor week={getWeek()} />
      </Card>
    </>
  );
}
