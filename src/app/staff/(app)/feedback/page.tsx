import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/feedback.css";
import { Icon } from "@/components/Icon";
import { FeedbackConcerns, type Owner } from "@/components/staff/portal/FeedbackConcerns";
import { FeedbackSuggestions } from "@/components/staff/portal/FeedbackSuggestions";
import { FeedbackThanks } from "@/components/staff/portal/FeedbackThanks";
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
        <PageHead title="Feedback" sub={`Residents’ ideas for ${c.site.name}, from paper slips, the QR code on printed calendars, or a text. Log a slip when someone hands you one.`} />
        <p className="fb-scope"><Badge tone="info">Resident suggestions</Badge><span>You see the suggestions part of Feedback. An administrator can change that in Settings.</span></p>
        <Card title="Resident suggestions" sub={`${list.length} ideas · most votes first. When an idea makes the calendar, the resident who suggested it is told.`}>
          <FeedbackSuggestions ideas={list} residents={s.residentNames} me={me.name} />
        </Card>
      </>
    );
  }

  const cs = concerns(slug);
  const ty = thankYous(slug);
  const sv = surveys(slug);
  const P = (k: string) => s.people[k]?.name ?? k;
  const findKey = (re: RegExp, fallback: string) => Object.keys(s.people).find((k) => re.test(s.people[k].role)) ?? fallback;
  const owners: Owner[] = [
    { key: s.roles.lantern, label: "Care team" },
    { key: findKey(/Resident Services/, s.roles.lantern), label: "Care and resident services" },
    { key: findKey(/Business Office/, s.roles.approver), label: "Business office" },
    { key: findKey(/Dining/, s.roles.menus), label: "Dining" },
    { key: s.roles.menus, label: "Kitchen" },
    { key: s.roles.calendar, label: "Activities" },
    { key: s.roles.approver, label: "Executive director" },
  ]
    .filter((o, i, all) => all.findIndex((x) => x.key === o.key) === i)
    .map((o) => ({ ...o, name: P(o.key), label: `${o.label}: ${P(o.key)}` }));
  const open = cs.filter((x) => x.status !== "Resolved").length;
  const newIdeas = list.filter((x) => x.status === "New").length;

  const schedule = [
    { title: sv.family.title, how: "By text and email, in each family’s language", steps: [["Before go-live", "Done"], ["Day 90", `Answers coming in: ${sv.family.answered} of ${sv.family.sent}`], ["Then every 6 months", "Scheduled"]] },
    { title: "Resident survey", how: "Printed, or read aloud by staff for anyone who prefers", steps: [["Before go-live", "Done"], ["Day 90", `${sv.resident.answered} residents so far`], ["Then every 6 months", "Scheduled"]] },
    { title: sv.staff.title, how: sv.staff.when, steps: [...sv.staff.months.map((m) => [m, "Done"]), ["Next: first Monday of next month", "Scheduled"]] },
  ];

  return (
    <>
      <PageHead title="Feedback" sub={`Everything residents and families tell ${c.site.name} that isn’t a booking, each with an owner and a status.`} />

      <ul className="fb-sum" aria-label="At a glance">
        <li><a href="#concerns"><b>{open}</b><span>family {open === 1 ? "concern" : "concerns"} not resolved</span></a></li>
        <li><a href="#suggestions"><b>{newIdeas}</b><span>new resident {newIdeas === 1 ? "idea" : "ideas"}</span></a></li>
        <li><a href="#thanks"><b>{ty.length}</b><span>thank-yous this month</span></a></li>
      </ul>

      <div className="fb-grid">
        <div className="fb-main">
          <Card id="concerns" title="Family concerns" sub="A family reply the AI recognises as a concern, or one staff mark as a concern. Each goes to the right person and stays open until it’s marked resolved.">
            <p className="fb-why"><Icon name="info" /> <span><b>Why concerns are separate from replies:</b> an unanswered concern becomes a bad review or a move-out. Giving each one an owner and a “resolved” status is what stops that, and it shows families we take them seriously.</span></p>
            <FeedbackConcerns items={cs} owners={owners} me={me.name} />
          </Card>

          <Card id="suggestions" title="Resident suggestions" sub="From paper slips, the QR code on printed calendars, or a text. Most votes first. When an idea makes the calendar, the resident who suggested it is told.">
            <FeedbackSuggestions ideas={list} residents={s.residentNames} me={me.name} />
          </Card>
        </div>

        <div className="fb-side">
          <Card id="thanks" title="Thank-yous" sub={`Family replies that thank staff, passed to the person named. ${ty.length} this month on the scorecard.`}>
            <FeedbackThanks items={ty} />
          </Card>

          <Card title="Surveys" sub="Sent on schedule by Kinlight. Results go to Reports.">
            <ul className="sx-list fb-surveys">
              {schedule.map((x) => (
                <li key={x.title}>
                  <b>{x.title}</b>
                  <small>{x.how}</small>
                  <ol>
                    {x.steps.map(([when, state]) => (
                      <li key={when}>
                        <span>{when}</span>
                        <Badge tone={state === "Done" ? "good" : state === "Scheduled" ? "neutral" : "info"}>{state}</Badge>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
            <p className="sx-note"><Link className="sx-link" href="/staff/reports/surveys">See the results in Reports → Surveys</Link></p>
          </Card>
        </div>
      </div>
    </>
  );
}
