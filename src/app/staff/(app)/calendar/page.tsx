import type { Metadata } from "next";
import "@/app/staff/post.css";
import { CalendarBoard, type CalFocus } from "@/components/staff/portal/CalendarBoard";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { sectionAccess } from "@/data/staff/access";
import { calendarEvents, everyone, inviteData, leaders } from "@/data/staff/calEvents";
import { viewer } from "@/data/staff/portal";
import { newEventSetup, photoKit, planHelp } from "@/data/staff/post";
import { getStaffCommunity } from "@/data/staff/server";
import { addDays, iso, sundayOf, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Calendar" };

type Params = { event?: string; date?: string; photos?: string; plan?: string; clash?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Params> }) {
  const q = await searchParams;
  const { as, access } = await sectionAccess("calendar");
  if (!access) return <NotYours section="Calendar" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Calendar" />;
  const { s } = sc;
  const slug = s.slug;
  const readOnly = access === "view";
  const t = today();
  const start = sundayOf(t);
  const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const from = m1 < start ? sundayOf(m1) : start;
  const out = calendarEvents(slug, from, 49);

  // ?event=<id>&photos=1 opens that event's Photos area; ?photos=1 alone opens the latest of today's events still
  // wanting photos; ?plan=1 opens the Ideas panel; ?clash=<id> opens a room clash side by side.
  const nowIso = iso(t);
  const wantsPhotos = q.photos === "1" || q.photos === "true";
  let focus: CalFocus | undefined;
  if (q.clash) focus = { clash: q.clash, date: q.date };
  else if (q.event) focus = { id: q.event, date: q.date, photos: wantsPhotos };
  else if (wantsPhotos) {
    const pick = out.filter((e) => e.date === nowIso && e.wanted && !e.photos?.length).sort((a, b) => b.start - a.start)[0]
      ?? out.filter((e) => e.date <= nowIso && e.wanted && !e.photos?.length).sort((a, b) => (b.date === a.date ? b.start - a.start : b.date.localeCompare(a.date)))[0];
    if (pick) focus = { id: pick.id, date: pick.date, photos: true };
  } else if (q.plan) focus = { plan: true };
  return (
    <>
      <PageHead title="Calendar" sub={readOnly ? "Every event, to look up." : "Every event, and everything about it."} />
      <CalendarBoard
        events={out}
        weekStarts={[0, 1, 2, 3, 4, 5].map((w) => iso(addDays(start, w * 7)))}
        todayIso={iso(t)}
        residents={everyone(slug)}
        staff={leaders(slug)}
        me={viewer(slug, as).name}
        readOnly={readOnly}
        setup={readOnly ? undefined : newEventSetup(slug, as)}
        brand={{ name: s.brand.name, domain: s.brand.domain, phone: s.brand.phone }}
        kit={readOnly ? undefined : photoKit(slug, as)}
        plan={readOnly ? undefined : planHelp(slug)}
        focus={focus}
        invite={inviteData(slug)}
      />
    </>
  );
}
