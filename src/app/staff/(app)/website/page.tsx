import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/website.css";
import "@/app/staff/editor.css";
import { Icon } from "@/components/Icon";
import { Help } from "@/components/staff/portal/Help";
import { NotYours } from "@/components/staff/portal/NotYours";
import { WebsiteApartments } from "@/components/staff/portal/WebsiteApartments";
import { WebsiteGalleries } from "@/components/staff/portal/WebsiteGalleries";
import { WebsiteLanguages } from "@/components/staff/portal/WebsiteLanguages";
import { WebsitePages, type EditorSetup } from "@/components/staff/portal/WebsitePages";
import { WebsiteResources } from "@/components/staff/portal/WebsiteResources";
import { WebsiteTabs } from "@/components/staff/portal/WebsiteTabs";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, PageHead } from "@/components/staff/ui";
import { siteHref, type StaffRole } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import type { Block } from "@/data/staff/blocks";
import { mediaLibrary } from "@/data/staff/pageBlocks";
import { getStaffCommunity } from "@/data/staff/server";
import { galleries, liveSources, pendingPrice, plansForWebsite, requiredPages, roleHolder, siteLanguages, sitePages, siteResources } from "@/data/staff/website";
import { fromIso } from "@/lib/clock";

export const metadata: Metadata = { title: "Website" };

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const { as, access } = await sectionAccess("website");
  if (!access) return <NotYours section="Website" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Website" />;
  const { s } = sc;
  const slug = s.slug;
  const site = siteHref(slug, "/").replace(/\/$/, "");
  const approver = roleHolder(s, "manager").name;
  const full = access === "full";
  const mine = (r: StaffRole) => full || r === as;

  const all = sitePages(slug);
  const pages = all.filter((p) => full || (access === "own-pages" && p.ownerRole === as) || (access === "dining-page" && p.id === "dining"));
  const res = siteResources(slug);
  const showResources = full || (access === "own-pages" && res.items.some((r) => r.ownerRole === as));
  const live = liveSources(slug).filter((x) => mine(x.ownerRole));
  const showPages = access !== "apartments";
  const showApartments = full || access === "apartments";
  const showGalleries = full || (access === "own-pages" && as === "events");

  const liveSeen = new Set<string>();
  const editor: EditorSetup = {
    media: mediaLibrary(slug),
    live: all.flatMap((p) => p.blocks).filter((b): b is Extract<Block, { type: "live" }> => b.type === "live" && !liveSeen.has(b.source) && !!liveSeen.add(b.source)),
    links: all.map((p) => ({ title: p.title, path: p.path })),
    owners: res.owners.map((o) => o.name),
    canAssign: full,
    langs: siteLanguages(slug).map((l) => l.lang),
    siteShort: s.brand.short,
  };

  const dueText = (n: number) => (n <= 0 ? "due now" : n === 1 ? "due tomorrow" : `due in ${n} days`);
  const day0 = fromIso(res.todayIso).getTime();
  const fresh = [
    ...live.map((x) => ({ id: x.id, title: x.title, owner: x.ownerName, rhythm: x.rhythm as string, state: x.state, stale: x.stale, href: x.href as string | undefined })),
    ...pages.filter((p) => p.stale).map((p) => ({ id: p.id, title: p.title, owner: p.ownerName, rhythm: p.rhythm as string, state: dueText(p.dueIn), stale: true, href: `/staff/website?edit=${p.id}` as string | undefined })),
    ...(showResources ? res.items : [])
      .filter((r) => mine(r.ownerRole))
      .map((r) => ({ r, n: Math.round((fromIso(r.review).getTime() - day0) / 86400000) }))
      .filter((x) => x.n <= 2)
      .map(({ r, n }) => ({ id: `res-${r.id}`, title: r.title, owner: r.ownerName, rhythm: "Resource", state: dueText(n), stale: true, href: "#resources" as string | undefined })),
  ];

  const sub = full
    ? "The pages people write. The rest fills itself."
    : access === "apartments"
      ? "Floor plans, prices and availability."
      : access === "dining-page"
        ? "The dining page. Menus fill it."
        : "The pages you look after.";

  const groups = ["Community pages", "FAQs", "Contact", "Meet our team"] as const;

  const pending = showApartments ? pendingPrice(slug) : null;

  const apartmentsTab = (
    <Card
      id="apartments"
      title={<>Apartments and prices <Help label="About apartments and prices">
        <p>Floor plans, what’s included, care levels, starting prices, availability and photos, as they show on the floor plans page.</p>
        <p>Marking one open texts everyone on that plan’s waitlist.</p>
        <p>{as === "manager" ? "Your changes go live straight away. The front desk marks floor plans open or taken in Apartments; prices are yours." : `Price and availability changes go to ${approver} before they show.`}</p>
      </Help></>}
      action={<Link className="sx-btn sx-btn-sm sx-btn-quiet" href="/staff/prospects#waitlist">Apartments and waitlist</Link>}
    >
      <WebsiteApartments plans={plansForWebsite(slug)} approver={approver} isApprover={as === "manager"} pending={pending} />
    </Card>
  );

  const pagesTab = (
    <div className="ws-grid">
      <div className="ws-main">
        <Card title={<>{full ? "Pages" : access === "dining-page" ? "Your page" : "Your pages"} <Help label="About pages">
          <p>Each page has an owner and an update rhythm. Saving puts it live on the website straight away, in every language.</p>
          <p>People write the words; floor plans, menus, the calendar, names and hours fill themselves.</p>
        </Help></>}>
          <p className="ws-hint" id="ws-edit-hint">
            <Icon name="edit" /> <span><b>Edit page</b> opens the full page editor here. Your changes go live on the website, in every language, when you save. <b>Preview this page</b> opens the page on the website in a new tab.</span>
          </p>
          {full ? (
            groups.map((g) => {
              const ps = pages.filter((p) => p.group === g);
              return ps.length ? (
                <section key={g} className="ws-group">
                  <h3>{g}</h3>
                  <WebsitePages pages={ps} site={site} editor={editor} openId={edit} />
                </section>
              ) : null;
            })
          ) : (
            <WebsitePages pages={pages} site={site} showOwner={false} empty="No pages are yours yet." editor={editor} openId={edit} />
          )}
        </Card>
      </div>

      <div className="ws-side">
        <Card title={<>Live blocks <Help label="About live blocks" align="end">
          <p>On every community page. Nobody maintains them: they update themselves.</p>
          <ul>
            <li>Today’s menu: from Menus, each morning, for every restaurant.</li>
            <li>The calendar: the next few days of events. Never seats, waitlists or pickup points.</li>
            <li>Recent news: the latest photo posts and announcements.</li>
          </ul>
        </Help></>}>
          <ul className="sx-list ws-live">
            {(access === "dining-page" ? ["menu"] : ["menu", "calendar", "news"]).map((k) => (
              <li key={k}>
                <b>{k === "menu" ? "Today’s menu" : k === "calendar" ? "The calendar" : "Recent news"}</b>
                <Badge tone="good">Automatic</Badge>
              </li>
            ))}
          </ul>
        </Card>

        {full && (
          <>
            <Card title={<>Languages <Help label="About languages" align="end">
              <p>The site and every event page are translated into each language families read. New pages publish automatically; switch on “Check first” to have a person look before they go live.</p>
            </Help></>}>
              <WebsiteLanguages langs={siteLanguages(slug)} canChange />
            </Card>

            <Card title={<>Required pages <Help label="About required pages" align="end"><p>Set up by Kinlight at launch: the state licence number, privacy policy and accessibility statement.</p></Help></>}>
              <ul className="sx-list ws-live">
                {requiredPages(slug).map((r) => (
                  <li key={r.title}>
                    <b>{r.title}</b>
                    <small>{r.where}</small>
                    <a className="sx-btn sx-btn-sm sx-btn-quiet" href={siteHref(slug, r.path)} target="_blank" rel="noopener"><Icon name="eye" /> View</a>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}

        <div className="ws-kin">
          <Icon name="search" />
          <span>Search and AI search: looked after by Kinlight</span>
          <Help label="About search and AI search" align="end">
            <p>Search and AI search upkeep is Kinlight’s job, along with uptime and the move from the old site. Nothing to do here.</p>
            {full && <p>Results are in <Link className="sx-link" href="/staff/reports/search">Reports → Website and AI search</Link>.</p>}
          </Help>
        </div>
      </div>
    </div>
  );

  const resourcesTab = (
    <Card id="resources" title={<>{full ? "Resources" : "Your resources"} <Help label="About resources">
      <p>Pages or files that rarely change: visiting hours, the transport schedule, policies, the welcome pack. {full ? "Create them here and choose who looks after each one." : `${approver} creates them; you keep yours up to date.`}</p>
      <p>Each one is published on the website and gets a short link. When a family or resident asks about it, Kinlight replies with that link; staff can paste it too.</p>
      <p>The owner is reminded before the review date. If nobody checks it, it shows as going stale on Today.</p>
      <p>Resources publish straight away, with no approval.</p>
    </Help></>}>
      <WebsiteResources setup={res} site={site} mine={full ? undefined : as} canCreate={full} showOwner={full} />
    </Card>
  );

  const galleriesTab = (
    <Card title={<>Galleries <Help label="About galleries">
      <p>Kinlight builds an album from each event’s photos once the event has happened.</p>
      <p>Only photos with consent on file are used. Photos “held back” have someone in them without photo consent.</p>
      <p>Feature one on the community pages, or hide one.</p>
    </Help></>}>
      <WebsiteGalleries items={galleries(slug)} />
    </Card>
  );

  const freshnessTab = (
    <Card title={<>Freshness <Help label="About freshness">
      <p>Each owner gets a “going stale” alert in Today before a page or resource is due.</p>
      <p>Menus are checked weekly, the calendar monthly, fitness weekly.</p>
    </Help></>}>
      {fresh.length === 0 && <p className="sx-empty"><Icon name="check" /> Everything of yours is up to date.</p>}
      <ul className="sx-list ws-fresh">
        {fresh.map((f) => (
          <li key={f.id} className={f.stale ? "stale" : ""}>
            <span className="ws-fresh-i">{f.stale ? <Icon name="clock" /> : <Icon name="check" />}</span>
            <span>
              <b>{f.title}</b>
              <small>{full ? `${f.owner} · ` : ""}{f.rhythm} · {f.state}</small>
            </span>
            {f.stale ? (f.href ? (f.href.startsWith("#") ? <a className="sx-btn sx-btn-sm" href={f.href}>Update</a> : <Link className="sx-btn sx-btn-sm" href={f.href}>Update</Link>) : <Badge tone="warn">Going stale</Badge>) : null}
          </li>
        ))}
      </ul>
    </Card>
  );

  return (
    <>
      <PageHead title="Website" sub={sub}>
        <a className="sx-btn" href={siteHref(slug, "/")} target="_blank" rel="noopener"><Icon name="globe" /> Open the website</a>
      </PageHead>

      {!full && (
        <div className="ws-scope">
          <Badge tone="info">{access === "apartments" ? "Apartments and prices" : access === "dining-page" ? "Your page" : "Your pages"}</Badge>
          <Help label="Why you see only these">
            <p>You see only what you look after. Everything else is looked after by {approver} or updates itself. An administrator can change this in Settings.</p>
            {access === "dining-page" && <p>Today’s menus fill the page automatically from Menus; you look after the words.</p>}
            {access === "apartments" && <p>Price and availability changes go to {approver} before they show.</p>}
          </Help>
        </div>
      )}

      <WebsiteTabs edit={edit} tabs={[
        ...(showPages ? [{ k: "pages", label: access === "dining-page" ? "Your page" : full ? "Pages" : "Your pages", node: pagesTab }] : []),
        ...(showApartments ? [{ k: "apartments", label: "Apartments and prices", node: apartmentsTab }] : []),
        ...(showGalleries ? [{ k: "galleries", label: "Galleries", node: galleriesTab }] : []),
        ...(showResources ? [{ k: "resources", label: full ? "Resources" : "Your resources", node: resourcesTab }] : []),
        ...(showPages ? [{ k: "freshness", label: "Freshness", count: fresh.filter((f) => f.stale).length || undefined, node: freshnessTab }] : []),
      ]} />

      {!showPages && (
        <div className="ws-kin ws-kin-solo">
          <Icon name="search" />
          <span>Search and AI search: looked after by Kinlight</span>
          <Help label="About search and AI search" align="end">
            <p>Kinlight keeps the floor plans page right for search and AI search. Prospect numbers are in <Link className="sx-link" href="/staff/reports">Reports</Link>.</p>
          </Help>
        </div>
      )}
    </>
  );
}
