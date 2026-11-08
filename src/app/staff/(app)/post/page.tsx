import type { Metadata } from "next";
import { Composer, type PostType, type UpcomingEvent } from "@/components/staff/portal/Composer";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { kindOf } from "@/data/shared";
import { nextDigest } from "@/data/staff";
import { sampleFamily } from "@/data/staff/alpha";
import { residents, viewer } from "@/data/staff/portal";
import { getStaffCommunity, getStaffRole } from "@/data/staff/server";
import { addDays, hash, iso, nowMinutes, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Post" };

const TYPES: PostType[] = ["photo", "event", "change", "menu", "flyer"];

export default async function PostPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Post" />;
  const { s, c } = sc;
  const as = await getStaffRole();
  const me = viewer(s.slug, as);
  const { type } = await searchParams;
  const initial = TYPES.includes(type as PostType) ? (type as PostType) : "photo";
  const t = today();
  const now = nowMinutes();
  // Events a change could be about: the rest of today and the next week, soonest first.
  const events: UpcomingEvent[] = c
    .staffEventsBetween(t, 8, iso(t))
    .flatMap((d) => d.events)
    .filter((e) => (e.date > iso(t) || e.start > now) && e.cat !== "faith")
    .slice(0, 40)
    .map((e) => ({ id: e.id, title: e.title, date: e.date, start: e.start, room: e.room, kind: kindOf(e), cap: e.cap, taken: e.taken ?? 6 + (hash(e.id) % 14), families: Math.round((e.taken ?? 6 + (hash(e.id) % 14)) * 1.3) }));
  const noConsent = [...new Set([...s.photoPresets.flatMap((p) => p.people.filter((x) => !x.consent).map((x) => x.name)), ...residents(s.slug).filter((r) => !r.photoConsent).map((r) => r.name)])];
  const fam = sampleFamily(s.slug);
  const approver = s.people[s.roles.approver].name;
  return (
    <>
      <PageHead title="Post" sub="Say it once. It goes to the website, families and residents by text and email, the Sunday email and print, in the right form for each." />
      <Composer
        initial={initial}
        brand={s.brand}
        copy={s.publish}
        presets={s.photoPresets}
        noConsent={noConsent}
        residentNames={[...s.residentNames, ...s.lanternNames].filter((n, i, a) => a.indexOf(n) === i).sort()}
        families={s.community.families}
        lanternFamilies={s.community.lanternFamilies}
        residents={Math.round(s.community.residents * 0.66)}
        lanternResidents={Math.round(s.community.lanternResidents * 0.3)}
        digest={nextDigest()}
        rooms={[...Object.values(c.rooms), "All floors"]}
        restaurants={c.venueOrder.map((k) => c.venues[k].name)}
        events={events}
        todayIso={iso(addDays(t, 0))}
        approver={{ name: approver, first: approver.split(" ")[0] }}
        isApprover={as === "manager"}
        me={me.name}
        sample={{ contact: fam.contact, resident: fam.resident }}
      />
    </>
  );
}
