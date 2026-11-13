import type { Metadata } from "next";
import "@/app/staff/reports.css";
import "@/app/staff/prospects.css";
import { NotYours } from "@/components/staff/portal/NotYours";
import { scorecardMonths, sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { Icon } from "@/components/Icon";
import { Help } from "@/components/staff/portal/Help";
import { TourCount, Waitlist, type TourCountRow, type WaitPlan } from "@/components/staff/portal/Sales";
import { WebsiteApartments } from "@/components/staff/portal/WebsiteApartments";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Card, PageHead } from "@/components/staff/ui";
import { dayLabel, siteHref } from "@/data/staff";
import { evidence } from "@/data/staff/alpha";
import { availability } from "@/data/staff/portal";
import { getStaffCommunity } from "@/data/staff/server";
import { plansForWebsite } from "@/data/staff/website";
import { addDays, fmtTime, nowMinutes, shortDate, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Apartments" };

/** How long someone has waited, in plain words. */
const waited = (days: number) => (days < 14 ? `${days} day${days === 1 ? "" : "s"}` : days < 60 ? `${Math.floor(days / 7)} weeks` : `${Math.floor(days / 30)} months`);

/**
 * Apartments, kept by the front desk: which floor plans are open (marking one open texts its waitlist), the waitlist,
 * and the number of tours. Kinlight doesn't do sales in the alpha: no inquiries, prospects, follow-ups or outcomes.
 * Tours are booked by visitors themselves, through the website chat and the tour page.
 */
export default async function ApartmentsPage() {
  const as = await getRole();
  if (!sectionsFor[as].includes("prospects")) return <NotYours section="Apartments" who="your" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Apartments" />;
  const { s } = sc;
  const now = nowMinutes();
  const approver = s.people[s.roles.approver].name;

  const tours: TourCountRow[] = s.tours
    .filter((t) => t.days < 7)
    .sort((a, b) => a.days - b.days || a.time - b.time)
    .map((t) => ({ id: t.who, who: t.who, interest: t.interest, source: t.source, day: dayLabel(t.days), time: fmtTime(t.time), done: t.days === 0 && t.time + 60 <= now }));
  const m = scorecardMonths();
  const tourRow = evidence(s.slug).find((r) => r.label === "Tours");

  // The waitlist by floor plan, longest waiting first. Names and how long they've waited only: no notes or deposits.
  const plans = availability(s.slug);
  const waitPlans: WaitPlan[] = [...new Set(s.waitlist.map((w) => w.plan))]
    .map((code) => {
      const p = plans.find((x) => x.code === code);
      return {
        code, name: p?.name ?? code, open: p?.available ?? 0,
        rows: s.waitlist.filter((w) => w.plan === code).sort((a, b) => b.joinedDays - a.joinedDays).map((w) => ({ name: w.name, waited: waited(w.joinedDays), since: shortDate(addDays(today(), -w.joinedDays)) })),
      };
    })
    .sort((a, b) => b.rows.length - a.rows.length);

  return (
    <>
      <PageHead title="Apartments" sub="Which floor plans are open, the waitlist and tours">
        <a className="sx-btn" href={siteHref(s.slug, "/tour")} target="_blank" rel="noopener"><Icon name="globe" /> Tour booking page</a>
      </PageHead>

      <Card id="availability" title={<>Open apartments <Help label="About open apartments">
        <p>How many of each floor plan are open, as the website shows them. Mark one open when an apartment is ready, and taken when someone moves in.</p>
        <p>Marking one open texts everyone on that plan’s waitlist, longest waiting first. Prices are set by {approver} in Website.</p>
      </Help></>}>
        <WebsiteApartments plans={plansForWebsite(s.slug)} approver={approver} isApprover={as === "manager"} pending={null} availabilityOnly={as !== "manager"} />
      </Card>

      <div className="sx-grid g-21">
        <Card id="waitlist" title={<>Waitlist <Help label="About the waitlist" align="end">
          <p>People join from the website and the chat. Kinlight texts them automatically when their floor plan opens, so there’s nothing to send by hand.</p>
          <p>Names and how long they’ve waited only, with no notes, so health and personal details stay out of it.</p>
        </Help></>} sub={`${s.waitlist.length} people, by floor plan`}>
          <Waitlist plans={waitPlans} />
        </Card>
        <Card id="tours" title={<>Tours <Help label="About tours" align="end">
          <p>Visitors book tours themselves, through the website chat and the tour page, and get a confirmation and a reminder automatically.</p>
          <p>After each tour, tap whether it happened. That’s the tour number on the monthly scorecard.</p>
        </Help></>} sub="This week">
          <TourCount tours={tours} month={{ label: m.month, now: tourRow?.now ?? 0, prev: tourRow?.prev ?? 0, prevLabel: m.prev }} />
        </Card>
      </div>
    </>
  );
}
