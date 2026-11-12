import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@/app/staff/post.css";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PostDesk, type EditTarget, type PostKind } from "@/components/staff/portal/PostDesk";
import { OpenCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { communitySlugs } from "@/data/communities";
import { calendarEvents } from "@/data/staff/calEvents";
import { getStaffData } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import { announceSetup, ideaPrefill, importSetup, newEventSetup } from "@/data/staff/post";
import { getStaffCommunity } from "@/data/staff/server";
import { previewSetup } from "@/data/staff/weekPage";
import { fromIso, sundayOf } from "@/lib/clock";

export const metadata: Metadata = { title: "Post" };

const POST_KINDS: PostKind[] = ["event", "announcement", "import"];
/** Old links still land on the right form. */
const legacy: Record<string, PostKind> = { change: "announcement", alert: "announcement" };

type Params = { type?: string; event?: string; idea?: string; c?: string; as?: string; edit?: string; date?: string; back?: string };

/** Photos now live on each event in Calendar, resources on the Website, menus in Menus. */
function moved(q: Params): string | undefined {
  const keep = new URLSearchParams();
  if (q.c) keep.set("c", q.c);
  if (q.as) keep.set("as", q.as);
  const tail = (extra?: Record<string, string>) => { const u = new URLSearchParams(keep); for (const [k, v] of Object.entries(extra ?? {})) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  if (q.type === "photos" || q.type === "photo") return `/staff/calendar${tail(q.event ? { event: q.event, photos: "1" } : { photos: "1" })}`;
  if (q.type === "resource" || q.type === "flyer") return `/staff/website${tail()}#resources`;
  if (q.type === "menu") return `/staff/menus${tail()}`;
  return undefined;
}

export default async function PostPage({ searchParams }: { searchParams: Promise<Params> }) {
  const q = await searchParams;
  const to = moved(q);
  if (to) redirect(to);
  const { as, access } = await sectionAccess("post");
  if (!access) return <NotYours section="Post" />;
  const type = q.type ?? "";
  const asked = POST_KINDS.includes(type as PostKind) ? (type as PostKind) : legacy[type];
  const only: PostKind[] | undefined = access === "announcements" ? ["announcement"] : undefined;
  const initial: PostKind = only ? "announcement" : asked ?? "event";
  const sc = await getStaffCommunity();

  // All communities: an announcement can go to every community at once; events and imports belong to one community.
  if (!sc) {
    return (
      <>
        <PageHead title="Post" sub="An announcement to every community at once." />
        {!only && (
          <p className="po-allnote">
            <span>Events and imports belong to one community:</span>
            {communitySlugs.map((slug) => { const s = getStaffData(slug); return <span key={slug} className="po-allbtn"><b>{s.brand.name}</b> <OpenCommunity slug={slug} name={s.brand.name} /></span>; })}
          </p>
        )}
        <PostDesk initial="announcement" only={["announcement"]} ann={communitySlugs.map((slug) => announceSetup(slug))} />
      </>
    );
  }

  const slug = sc.s.slug;
  const full = !only;

  // Edit, from an event in Calendar or Today: ?edit=<id>&date=<its first date>&back=calendar|today. The event comes
  // from the calendar here; one added in this browser is found in the browser.
  let edit: EditTarget | undefined;
  if (full && q.edit && q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date)) {
    const base = calendarEvents(slug, sundayOf(fromIso(q.date)), 7).find((e) => e.id === q.edit && e.date === q.date);
    const back = q.back === "today"
      ? { href: "/staff/today", label: "Back to Today" }
      : { href: `/staff/calendar?event=${encodeURIComponent(q.edit)}&date=${q.date}`, label: "Back to the calendar" };
    edit = { id: q.edit, date: q.date, base, back };
  }
  // Calendar's "+ Add" on a day: ?type=event&date=<day>.
  const onDay = !edit && q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date) ? q.date : undefined;

  return (
    <>
      <PageHead
        title={edit ? "Edit event" : "Post"}
        sub={edit ? "Changes go everywhere it is: the website, the newsletter, week pages and invites." : only ? "News for residents and families, in each person’s language." : "Add it once. Kinlight puts it everywhere it belongs."}
      />
      <PostDesk
        initial={initial}
        only={only}
        ann={[announceSetup(slug)]}
        event={full ? newEventSetup(slug, as) : undefined}
        idea={full && initial === "event" ? ideaPrefill(slug, q.idea) : undefined}
        prefill={onDay ? { date: onDay } : undefined}
        imp={full ? importSetup(slug) : undefined}
        preview={full ? previewSetup(slug) : undefined}
        edit={edit}
      />
    </>
  );
}
