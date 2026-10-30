import type { Metadata } from "next";
import { PageHead } from "@/components/staff/ui";
import { Publisher } from "@/components/staff/Publisher";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { nextDigest } from "@/data/staff";
import { getStaffCommunity } from "@/data/staff/server";
import { fromIso, iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Post once" };

export default async function PublishPage() {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Post once, publish everywhere" />;
  const { s, c } = sc;
  const { community } = s;
  const t = today();
  // The real calendar event the "Event" starting point is about, for its time and seats.
  const ev = c.eventsOn(fromIso(s.publish.eventDate), iso(t)).find((e) => e.title.includes(s.publish.eventTitle));
  const wine = ev ?? { date: s.publish.eventDate, start: 10 * 60, cap: 12, taken: 0 };
  const approver = s.people[s.roles.approver].name;
  return (
    <>
      <PageHead title="Post once, publish everywhere" sub="Add it once. It goes to the website, families’ phones, the weekly email, the front desk printer and social media, in the right format for each." />
      <Publisher
        rooms={[...Object.values(c.rooms), "All floors"]}
        families={community.families}
        harborFamilies={community.harborFamilies}
        smsReachable={community.smsReachable}
        emailReachable={community.emailReachable}
        digest={nextDigest()}
        wine={{ date: wine.date, start: wine.start, cap: wine.cap ?? 12, taken: wine.taken ?? 0 }}
        todayIso={iso(t)}
        brand={s.brand}
        approver={{ name: approver, first: approver.split(" ")[0] }}
        copy={s.publish}
      />
    </>
  );
}
