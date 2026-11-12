"use client";

// Reports → Today: each person's queue right now (overdue, today, this week, after anything done, snoozed or handed
// on), and what's been done with cards in this browser. Kinds of card that are mostly snoozed or handed on, rather
// than done, are marked "Consider turning this off" (Settings → Approvals and alerts).
import Link from "next/link";
import type { QLite } from "@/data/staff/lite";
import type { StaffRole } from "@/data/staff/shared";
import { groupOf } from "@/data/staff/signals";
import { nowMinutes } from "@/lib/clock";
import { Icon } from "../../Icon";
import { onToday, useTodayState } from "../store";
import { Badge, Card } from "../ui";

export function QueueReport({ items, signalOf, names, titles, labels }: { items: QLite[]; signalOf: Record<string, string>; names: Record<StaffRole, string>; titles: Record<string, string>; labels: Record<string, string> }) {
  const { moves, log } = useTodayState();
  const now = nowMinutes();
  const roles = Object.keys(names) as StaffRole[];
  const rows = roles.map((r) => {
    const mine = items.filter((q) => onToday(q, r, moves)).map((q) => groupOf(q.due, now)).filter(Boolean);
    const acts = log.filter((l) => l.who === r);
    return {
      r, late: mine.filter((g) => g === "late").length, today: mine.filter((g) => g === "hour" || g === "today").length, week: mine.filter((g) => g === "week").length,
      done: acts.filter((l) => l.kind === "done").length, doneLate: acts.filter((l) => l.kind === "done" && l.overdue).length,
      snoozed: acts.filter((l) => l.kind === "snoozed").length, handed: acts.filter((l) => l.kind === "reassigned").length,
    };
  });
  // By kind: how often it's done, and how often it's put off.
  const kinds = [...new Set(log.map((l) => l.signal))].map((k) => {
    const xs = log.filter((l) => l.signal === k);
    const off = xs.filter((l) => l.kind === "snoozed" || l.kind === "reassigned" || l.kind === "dismissed").length;
    return { k, n: xs.length, done: xs.filter((l) => l.kind === "done").length, off, flag: xs.length >= 2 && off / xs.length > 0.5 };
  }).sort((a, b) => Number(b.flag) - Number(a.flag) || b.n - a.n);

  return (
    <div className="sx-grid">
      <Card title="Each person’s queue right now" sub="Overdue and today make the number in their menu; this week shows without counting">
        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead><tr><th>Who</th><th className="al-c">Overdue</th><th className="al-c">Today</th><th className="al-c">This week</th><th className="al-c">Done</th><th className="al-c">Done late</th><th className="al-c">Snoozed</th><th className="al-c">Handed on</th></tr></thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.r}>
                  <td><b>{names[x.r]}</b><small>{titles[x.r]}</small></td>
                  <td className="al-c">{x.late ? <Badge tone="bad">{x.late}</Badge> : "0"}</td>
                  <td className="al-c"><b>{x.today}</b></td>
                  <td className="al-c">{x.week}</td>
                  <td className="al-c">{x.done}</td>
                  <td className="al-c">{x.doneLate}</td>
                  <td className="al-c">{x.snoozed}</td>
                  <td className="al-c">{x.handed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sx-hint">Done, snoozed and handed on count what people did on Today in this browser. A healthy queue is short: a few a day, rarely overdue.</p>
      </Card>
      <Card title="By kind of card" sub="What gets done, and what gets put off">
        {kinds.length ? (
          <ul className="pt-week">
            {kinds.map((k) => (
              <li key={k.k}>
                <span><b>{labels[k.k] ?? k.k}</b><small>{k.n} acted on · {k.done} done · {k.off} snoozed or handed on</small></span>
                <span>{k.flag ? <Link className="sx-btn sx-btn-sm" href="/staff/settings?tab=approvals"><Icon name="alert" /> Consider turning this off</Link> : <Badge tone="good">Useful</Badge>}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sx-card-body sx-hint">Nothing yet: as people act on their Today cards, this fills in. {items.length} cards are waiting across the team; {Object.values(signalOf).length ? "see the table above" : ""}.</p>
        )}
      </Card>
    </div>
  );
}
