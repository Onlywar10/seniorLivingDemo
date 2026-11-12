import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/feedback.css";
import { FeedbackConcerns, type Owner } from "@/components/staff/portal/FeedbackConcerns";
import { concernOwners } from "@/data/staff/portal";
import { FeedbackSuggestions } from "@/components/staff/portal/FeedbackSuggestions";
import { FeedbackThanks } from "@/components/staff/portal/FeedbackThanks";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { surveys } from "@/data/staff/alpha";
import { concerns, thankYous } from "@/data/staff/engage";
import { ideas } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { roleHolder } from "@/data/staff/website";

export const metadata: Metadata = { title: "Feedback" };

const suggestionsHelp = (
  <Help label="About resident suggestions">
    <p>Ideas come from paper slips, the QR code on printed calendars, or a text. Most votes first.</p>
    <p>“Make it an event” opens Post with the idea filled in. When an idea makes the calendar, the resident who suggested it is told.</p>
  </Help>
);

export default async function Page() {
  const { as, access } = await sectionAccess("feedback");
  if (!access) return <NotYours section="Feedback" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Feedback" />;
  const { s, c } = sc;
  const slug = s.slug;
  const me = roleHolder(s, as);
  const full = access === "full";
  const list = ideas(slug);

  if (!full) {
    return (
      <>
        <PageHead title="Feedback" sub="Residents’ ideas. Log a slip when someone hands you one." />
        <div className="fb-scope">
          <Badge tone="info">Resident suggestions</Badge>
          <Help label="Why you see only suggestions"><p>You see the suggestions part of Feedback. An administrator can change that in Settings.</p></Help>
        </div>
        <Card title={<>Resident suggestions {suggestionsHelp}</>} sub={`${list.length} ideas`}>
          <FeedbackSuggestions ideas={list} residents={s.residentNames} me={me.name} />
        </Card>
      </>
    );
  }

  const cs = concerns(slug);
  const ty = thankYous(slug);
  const sv = surveys(slug);
  // Who a concern can be passed to. Care and safety go to the care team's own system, never here.
  const owners: Owner[] = concernOwners(slug);
  const open = cs.filter((x) => x.status !== "Resolved" && !x.care).length;
  const newIdeas = list.filter((x) => x.status === "New").length;

  const schedule = [
    { title: sv.family.title, how: "Text and email", steps: [["Before go-live", "Done"], ["Day 90", `${sv.family.answered} of ${sv.family.sent} answered`], ["Every 6 months", "Scheduled"]] },
    { title: "Resident survey", how: "Printed or read aloud", steps: [["Before go-live", "Done"], ["Day 90", `${sv.resident.answered} so far`], ["Every 6 months", "Scheduled"]] },
    { title: sv.staff.title, how: sv.staff.when, steps: [...sv.staff.months.map((m) => [m, "Done"]), ["Next month", "Scheduled"]] },
  ];

  return (
    <>
      <PageHead title="Feedback" sub={`What residents and families tell ${c.site.name}, each with an owner.`} />

      <ul className="fb-sum" aria-label="At a glance">
        <li><a href="#concerns"><b>{open}</b><span>{open === 1 ? "concern" : "concerns"} not resolved</span></a></li>
        <li><a href="#suggestions"><b>{newIdeas}</b><span>new {newIdeas === 1 ? "idea" : "ideas"}</span></a></li>
        <li><a href="#thanks"><b>{ty.length}</b><span>thank-yous this month</span></a></li>
      </ul>

      <div className="fb-grid">
        <div className="fb-main">
          <Card id="concerns" title={<>Family concerns <Help label="About family concerns">
            <p>A family reply the AI recognises as a concern, or one staff mark as a concern. Each goes to the right person and stays open until it’s marked resolved. Never answered by AI.</p>
            <p><b>Why concerns are separate from replies:</b> an unanswered concern becomes a bad review or a move-out. Giving each one an owner and a “resolved” status is what stops that, and it shows families we take them seriously.</p>
            <p>Care concerns are passed to the care team and recorded in the community’s own care system, not here.</p>
          </Help></>}>
            <FeedbackConcerns items={cs} owners={owners} me={me.name} />
          </Card>

          <Card id="suggestions" title={<>Resident suggestions {suggestionsHelp}</>} sub={`${list.length} ideas`}>
            <FeedbackSuggestions ideas={list} residents={s.residentNames} me={me.name} />
          </Card>
        </div>

        <div className="fb-side">
          <Card id="thanks" title={<>Thank-yous <Help label="About thank-yous" align="end"><p>Family replies that thank staff, passed to the person named and counted on the scorecard: {ty.length} this month.</p></Help></>}>
            <FeedbackThanks items={ty} />
          </Card>

          <Card title={<>Surveys <Help label="About surveys" align="end">
            <p>Sent on schedule by Kinlight: before go-live, at day 90, then every six months. The staff pulse goes monthly.</p>
            <p>Family surveys go by text and email in each family’s language. Resident surveys are printed, or read aloud by staff for anyone who prefers.</p>
          </Help></>} action={<Link className="sx-btn sx-btn-sm sx-btn-quiet" href="/staff/reports/surveys">Results</Link>}>
            <ul className="sx-list fb-surveys">
              {schedule.map((x) => (
                <li key={x.title}>
                  <b>{x.title}</b>
                  <small>{x.how}</small>
                  <ol>
                    {x.steps.map(([when, state]) => (
                      <li key={when}>
                        <span>{when}</span>
                        {state === "Done" ? <span className="fb-done">Done</span> : <Badge tone={state === "Scheduled" ? "neutral" : "info"}>{state}</Badge>}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
