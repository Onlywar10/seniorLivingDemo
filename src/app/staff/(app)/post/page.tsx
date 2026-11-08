import type { Metadata } from "next";
import "@/app/staff/post.css";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PostDesk, type PostKind } from "@/components/staff/portal/PostDesk";
import { OpenCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { communitySlugs } from "@/data/communities";
import { getStaffData } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import { announceSetup, ideaPrefill, importSetup, newEventSetup, photoSetup, planHelp, resourceSetup } from "@/data/staff/post";
import { getStaffCommunity } from "@/data/staff/server";

export const metadata: Metadata = { title: "Post" };

const POST_KINDS: PostKind[] = ["event", "import", "announcement", "photos", "resource"];

/** Old links (photo, change, menu, flyer) still land on the right form. */
const legacy: Record<string, { kind: PostKind; note?: "menu" | "change" | "flyer" }> = {
  photo: { kind: "photos" },
  change: { kind: "announcement", note: "change" },
  alert: { kind: "announcement", note: "change" },
  menu: { kind: "event", note: "menu" },
  flyer: { kind: "resource", note: "flyer" },
};

const SUB = "Add something once. Kinlight does the rest: the website, texts and emails, invites, flyers, the newsletter and print.";

export default async function PostPage({ searchParams }: { searchParams: Promise<{ type?: string; event?: string; idea?: string }> }) {
  const { as, access } = await sectionAccess("post");
  if (!access) return <NotYours section="Post" />;
  const { type = "", event, idea } = await searchParams;
  const asked = POST_KINDS.includes(type as PostKind) ? { kind: type as PostKind } : legacy[type];
  const only: PostKind[] | undefined = access === "announcements" ? ["announcement"] : undefined;
  const initial: PostKind = only ? "announcement" : asked?.kind ?? "event";
  const sc = await getStaffCommunity();

  // All communities: an announcement can go to every community at once; everything else belongs to one community.
  if (!sc) {
    const all = communitySlugs.map((slug) => announceSetup(slug));
    return (
      <>
        <PageHead title="Post" sub="Announcements from here can go to every community at once." />
        <div className="sx-callout info po-allnote">
          <p>New events, photos, imports and resources belong to one community. Open one to add them:</p>
          <span className="po-allbtns">
            {communitySlugs.map((slug) => { const s = getStaffData(slug); return <span key={slug} className="po-allbtn"><b>{s.brand.name}</b> <OpenCommunity slug={slug} name={s.brand.name} /></span>; })}
          </span>
        </div>
        <PostDesk initial="announcement" only={["announcement"]} ann={all} note={asked?.note === "change" ? "change" : undefined} />
      </>
    );
  }

  const slug = sc.s.slug;
  const full = !only;
  return (
    <>
      <PageHead title="Post" sub={only ? "Announcements for residents and families. Kinlight sends them in each person’s language." : SUB} />
      <PostDesk
        initial={initial}
        only={only}
        note={asked?.note}
        ann={[announceSetup(slug)]}
        event={full ? newEventSetup(slug, as) : undefined}
        idea={full && initial === "event" ? ideaPrefill(slug, idea) : undefined}
        imp={full ? importSetup(slug) : undefined}
        photos={full ? photoSetup(slug, as, event) : undefined}
        res={full ? resourceSetup(slug) : undefined}
        plan={full ? planHelp(slug) : undefined}
      />
    </>
  );
}
