// People → My residents (only with "Who looks after whom" on): the residents this person looks after, at the top, with
// their records filled out: interests, life story, participation, family, recent notes and 1:1 visits. Engagement and
// communication only; nothing clinical. A Server Component: each card links to the full record below.
import Link from "next/link";
import type { Engagement } from "@/data/staff/engage";
import type { ResidentRecord } from "@/data/staff/portal";
import { residentHref } from "../residentHref";
import { Icon } from "../../Icon";
import { Badge } from "../ui";
import { Help } from "./Help";

export interface MyResident {
  name: string; apt: string; area: string; lantern: boolean;
  eng?: Engagement; family: ResidentRecord["family"];
  notes: { when: string; by: string; text: string }[];
}

const first = (n = "") => n.split(" ")[0];

export function MyResidents({ title, sub, items, empty }: { title: string; sub: string; items: MyResident[]; empty?: string }) {
  return (
    <section className="mr" aria-labelledby="mr-h">
      <header className="mr-h">
        <h2 id="mr-h">{title} <small>{items.length}</small></h2>
        <p className="sx-hint">{sub}</p>
        <Help label="About My residents" align="end">
          <p>Everything to do with these residents comes to you: asks in person, “We haven’t seen lately”, things they might enjoy and welcome checklists. Family requests and new family members stay with the activities director.</p>
          <p>Engagement and communication only. Medication, care plans and clinical notes belong in the community’s care system, never here.</p>
        </Help>
      </header>
      {items.length === 0 ? <p className="pt-empty"><Icon name="check" /> {empty ?? "Nobody here."}</p> : (
        <ul className="mr-list">
          {items.map((r) => {
            const e = r.eng;
            const joined = r.family.filter((f) => f.status === "Joined").length;
            return (
              <li key={r.name} className="mr-card">
                <div className="mr-top">
                  <span className="mr-av" aria-hidden="true">{r.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</span>
                  <span className="mr-who">
                    <Link className="pt-name b" href={residentHref(r.name)}>{r.name}</Link>
                    <small>{r.lantern ? r.apt : `Apt ${r.apt}`} · {r.area}</small>
                  </span>
                  {e && e.lastDays >= 14 && <Badge tone="warn">Not seen in {e.lastDays} days</Badge>}
                </div>
                {e && e.interests.filter(Boolean).length > 0 && <p className="mr-ints">{[...new Set(e.interests.filter(Boolean))].map((i) => <span key={i}>{i}</span>)}</p>}
                {e?.story && <p className="mr-story"><span className="sx-lbl">Life story</span>{e.story}</p>}
                <dl className="mr-facts">
                  <div><dt>Participation</dt><dd>{e ? `${e.last30} ${e.last30 === 1 ? "activity" : "activities"} in 30 days` : "Not yet"}<small>{e ? `Last: ${e.lastLabel}${e.last30 && e.lastActivity ? `, ${e.lastActivity}` : ""}` : ""}</small></dd></div>
                  <div><dt>Invites</dt><dd>{e ? `${e.invites.yes} of ${e.invites.sent} said yes` : "None yet"}<small>Last 30 days</small></dd></div>
                  <div><dt>Family</dt><dd>{r.family.length ? `${joined} of ${r.family.length} joined` : "None added yet"}<small>{r.family.slice(0, 2).map((f) => `${first(f.name)} (${f.relation.toLowerCase()})`).join(", ")}</small></dd></div>
                  <div><dt>1:1 visits</dt><dd>{e?.visits.length ? `${e.visits.length} this month` : "None yet"}<small>{e?.visits[0] ? `${e.visits[0].date}: ${e.visits[0].note}` : ""}</small></dd></div>
                </dl>
                {r.notes.length > 0 && (
                  <ul className="mr-notes" aria-label={`Recent notes about ${first(r.name)}`}>
                    {r.notes.map((n, i) => <li key={i}><p>{n.text}</p><small>{n.by} · {n.when}</small></li>)}
                  </ul>
                )}
                <Link className="sx-btn sx-btn-sm" href={residentHref(r.name)}>Open their page</Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
