import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { residentHref } from "@/components/staff/residentHref";
import "@/app/staff/reports.css";
import { NotYours } from "@/components/staff/portal/NotYours";
import { sectionsFor } from "@/data/staff/shared";
import { getStaffRole as getRole } from "@/data/staff/server";
import { People } from "@/components/staff/portal/People";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { INTERESTS, engagement, welcomes } from "@/data/staff/engage";
import { residents, viewer, type ResidentRecord } from "@/data/staff/portal";
import { getAreaState, getStaffCommunity } from "@/data/staff/server";
import { placements, residentNotes } from "@/data/staff/areas";
import { MyResidents, type MyResident } from "@/components/staff/portal/MyResidents";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ welcome?: string; r?: string }> }) {
  const as = await getRole();
  if (!sectionsFor[as].includes("people")) return <NotYours section="People" who={as === "sales" ? "sales" : as === "events" ? "the events team" : "your"} />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="People" />;
  const { s } = sc;
  const { welcome, r } = await searchParams;
  // Old links (and Today's "Finish" welcome) open the resident's own page.
  if (welcome) redirect(`${residentHref(welcome)}?welcome=1`);
  if (r) redirect(residentHref(r));
  const me = viewer(s.slug, as);
  const news = welcomes(s.slug);
  // New residents first, with their welcome checklist; their family is invited from the move-in contacts.
  const fresh: ResidentRecord[] = news.map((w) => ({ name: w.name, apt: w.apt, lantern: false, channel: "Text", lang: "English", photoConsent: true, shares: true, family: [] }));
  const eng = engagement(s.slug);
  news.forEach((w, i) => {
    eng[w.name] = {
      name: w.name, lantern: false, interests: i ? ["Music", "Learning"] : [],
      story: i ? "Moved from Portland to be near the grandchildren. Loves opera and long walks." : "Not written yet. Add a few lines with the resident.",
      last30: i ? 2 : 0, lastDays: i ? 1 : w.days, lastActivity: i ? "Happy Hour" : "None yet", lastLabel: i ? "Yesterday" : "Not yet", visits: [], invites: { sent: i ? 2 : 0, yes: i ? 1 : 0 },
      // Asked in the welcome checklist, with photo consent.
      celebrate: true,
    };
  });
  const all = [...fresh, ...residents(s.slug)];
  // "Who looks after whom" (Settings): your own residents first, with their records filled out; then everyone else.
  // A care partner sees only their own residents.
  const areas = await getAreaState();
  if (!areas.on)
    return (
      <>
        <PageHead title="People" sub="Each resident, how they hear from us, and their family." />
        <People records={all} total={s.community.residents} eng={eng} welcomes={news} interests={INTERESTS} me={me.name} community={s.brand.name} initial={welcome ?? r} />
      </>
    );
  const placed = placements(s.slug, areas.placed);
  const lead = (k: string | null) => (k ? s.people[k]?.name ?? k : "");
  const myPlaces = as === "manager" ? placed.filter((p) => !p.area) : placed.filter((p) => p.lead === me.key);
  const mineSet = new Set(myPlaces.map((p) => p.name));
  const byName = new Map(all.map((x) => [x.name, x]));
  const mine: MyResident[] = myPlaces.map((p) => ({
    name: p.name, apt: p.apt, area: p.area?.name ?? (p.reason ?? "Not in an area yet"), lantern: p.lantern, eng: eng[p.name], family: byName.get(p.name)?.family ?? [],
    notes: residentNotes(s.slug, p.name, lead(p.lead) || me.name),
  }));
  const caregiver = as === "caregiver";
  const rest = caregiver ? all.filter((x) => mineSet.has(x.name)) : all.filter((x) => !mineSet.has(x.name));
  return (
    <>
      <PageHead title="People" sub={caregiver ? "The residents you look after, and their families." : "Your residents first, then everyone else."} />
      <MyResidents
        title={as === "manager" ? "Not in an area yet" : "My residents"}
        sub={as === "manager" ? "Their items come to you until they’re placed in Settings." : `${myPlaces[0]?.area?.name ?? "Your area"} · ${myPlaces.length} residents`}
        items={mine}
        empty={as === "manager" ? "Every resident is in an area." : "Nobody is assigned to you yet. Ask your administrator to place you in Settings."}
      />
      {rest.length > 0 && <h2 className="mr-rest-h" id="pe-record">{caregiver ? "Their records" : "Everyone else"}</h2>}
      {rest.length > 0 && <People records={rest} total={caregiver ? rest.length : s.community.residents} eng={eng} welcomes={news.filter((w) => rest.some((x) => x.name === w.name))} interests={INTERESTS} me={me.name} community={s.brand.name} initial={welcome ?? (r && rest.some((x) => x.name === r) ? r : undefined)} />}
    </>
  );
}
