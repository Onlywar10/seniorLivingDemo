// The week's automatic messages in one calm line, for Reports (Families) and the monthly scorecard: the same numbers
// Automations shows at the top. Works in Server Components.
import Link from "next/link";
import type { WeekSummary } from "@/data/staff/automations";
import { Icon } from "../../Icon";
import { Card, fmt } from "../ui";
import { Help } from "./Help";

export function AutoSummaryCard({ w, link }: { w: WeekSummary; link: boolean }) {
  return (
    <Card
      title="Automatic messages"
      sub="The last 7 days"
      action={
        <Help label="About automatic messages" align="end">
          <p>Reminders, invites, confirmations, the morning menu and the instant reply to inquiries: everything Kinlight sends without anyone pressing send. Posts and the newsletter aren’t counted.</p>
          <p>Promise D8 (“No inquiry left waiting”) and T6 (“Families stay subscribed”) are checked from this log.</p>
        </Help>
      }
    >
      <p className="au-rep-line">
        <b>This week:</b> {fmt(w.total)} automatic messages · {w.deliveredPct}% delivered · {w.failed} failed · {w.optedOut} opted out · {w.handled} replies handled
      </p>
      <ol className="au-days au-days-rep" aria-label="Messages each day">
        {w.days.map((d) => (
          <li key={d.label}><span className="au-day-l">{d.label}</span><b>{fmt(d.n)}</b>{d.failed > 0 && <small>{d.failed} failed</small>}</li>
        ))}
      </ol>
      {link && <p className="au-rep-link"><Link className="sx-link" href="/staff/automations">Open Automations <Icon name="right" /></Link> for the log, problems and what’s due next.</p>}
    </Card>
  );
}
