import type { Metadata } from "next";
import { PageHead } from "@/components/staff/ui";
import { Publisher } from "@/components/staff/Publisher";
import { eventsOn, rooms } from "@/data/calendar";
import { community, nextDigest } from "@/data/staff";
import { fromIso, iso, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Post once" };

export default function PublishPage() {
  const t = today();
  const wine = eventsOn(fromIso("2026-11-20"), iso(t)).find((e) => e.title.includes("Wise Villa"))!;
  return (
    <>
      <PageHead title="Post once, publish everywhere" sub="Add it once. It goes to the website, families’ phones, the weekly email, the front desk printer and social media, in the right format for each." />
      <Publisher
        rooms={[...Object.values(rooms), "All floors"]}
        families={community.families}
        harborFamilies={community.harborFamilies}
        smsReachable={community.smsReachable}
        emailReachable={community.emailReachable}
        digest={nextDigest()}
        wine={{ date: wine.date, start: wine.start, cap: wine.cap ?? 12, taken: wine.taken ?? 0 }}
        todayIso={iso(t)}
      />
    </>
  );
}
