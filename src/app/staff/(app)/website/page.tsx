import type { Metadata } from "next";
import Link from "next/link";
import "@/app/staff/website.css";
import { Icon } from "@/components/Icon";
import { NotYours } from "@/components/staff/portal/NotYours";
import { WebsiteApartments } from "@/components/staff/portal/WebsiteApartments";
import { WebsiteGalleries } from "@/components/staff/portal/WebsiteGalleries";
import { WebsiteLanguages } from "@/components/staff/portal/WebsiteLanguages";
import { WebsitePages } from "@/components/staff/portal/WebsitePages";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { Badge, Card, PageHead } from "@/components/staff/ui";
import { siteHref, type StaffRole } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import { getStaffCommunity } from "@/data/staff/server";
import { galleries, liveSources, pendingPrice, plansForWebsite, requiredPages, roleHolder, siteLanguages, sitePages } from "@/data/staff/website";

export const metadata: Metadata = { title: "Website" };

export default async function Page() {
  const { as, access } = await sectionAccess("website");
  if (!access) return <NotYours section="Website" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Website" />;
  const { s, c } = sc;
  const slug = s.slug;
  const site = siteHref(slug, "/").replace(/\/$/, "");
  const me = roleHolder(s, as);
  const approver = roleHolder(s, "manager").name;
  const full = access === "full";
  const mine = (r: StaffRole) => full || r === as;

  const all = sitePages(slug);
  const pages = all.filter((p) => p.group !== "Resources" && (full || (access === "own-pages" && p.ownerRole === as) || (access === "dining-page" && p.id === "dining")));
  const resources = all.filter((p) => p.group === "Resources" && (full || (access === "own-pages" && p.ownerRole === as)));
  const live = liveSources(slug).filter((x) => mine(x.ownerRole));
  const showPages = access !== "apartments";
  const showApartments = full || access === "apartments";
  const showGalleries = full || (access === "own-pages" && as === "events");
  const fresh = [
    ...live.map((x) => ({ id: x.id, title: x.title, owner: x.ownerName, rhythm: x.rhythm, state: x.state, stale: x.stale, href: x.href })),
    ...[...pages, ...resources].filter((p) => p.stale).map((p) => ({ id: p.id, title: p.title, owner: p.ownerName, rhythm: p.rhythm, state: `Updated ${p.updated.toLowerCase()}; due ${p.dueIn <= 0 ? "now" : p.dueIn === 1 ? "tomorrow" : `in ${p.dueIn} days`}.`, stale: true, href: undefined as string | undefined })),
  ];

  const sub = full
    ? `The pages people write for ${c.site.name}’s website, who looks after each one, and what updates itself. Most of the site fills itself from the calendar, menus, photos and apartments.`
    : access === "apartments"
      ? `Floor plans, prices and availability on ${c.site.name}’s website, for ${me.name}. Changes go to ${approver} before they show.`
      : access === "dining-page"
        ? `The dining page on ${c.site.name}’s website, for ${me.name}. Today’s menus fill it automatically from Menus; you look after the words.`
        : `The pages ${me.name} looks after on ${c.site.name}’s website. Everything else is looked after by ${approver} or updates itself.`;

  const groups = ["Community pages", "FAQs", "Contact", "Meet our team"] as const;

  return (
    <>
      <PageHead title="Website" sub={sub}>
        <a className="sx-btn" href={siteHref(slug, "/")} target="_blank" rel="noopener"><Icon name="globe" /> Open the website</a>
      </PageHead>

      {!full && (
        <p className="ws-scope">
          <Badge tone="info">{access === "apartments" ? "Apartments and prices" : access === "dining-page" ? "Your page" : "Your pages"}</Badge>
          <span>You see only what you look after here. An administrator can change that in Settings.</span>
        </p>
      )}

      {showApartments && (
        <Card title="Apartments and prices" sub={`Floor plans, what’s included, care levels, starting prices, availability and photos. Marking one open texts and emails everyone on that plan’s waitlist. ${as === "manager" ? "Your changes go live straight away; changes from sales wait for you." : `Price and availability changes go to ${approver} before they show.`}`} id="apartments">
          <WebsiteApartments plans={plansForWebsite(slug)} approver={approver} isApprover={as === "manager"} pending={pendingPrice(slug)} />
          <p className="sx-note">The waitlist itself is in <Link className="sx-link" href="/staff/prospects">Prospects</Link>.</p>
        </Card>
      )}

      {showPages && (
        <div className="ws-grid">
          <div className="ws-main">
            <Card title={full ? "Pages" : access === "dining-page" ? "Your page" : "Your pages"} sub={full ? "Each page has an owner and an update rhythm. Saving puts it live on the website." : "Edit the words and save: it’s live on the website straight away."}>
              {full ? (
                groups.map((g) => {
                  const ps = pages.filter((p) => p.group === g);
                  return ps.length ? (
                    <section key={g} className="ws-group">
                      <h3>{g}</h3>
                      <WebsitePages pages={ps} site={site} />
                    </section>
                  ) : null;
                })
              ) : (
                <WebsitePages pages={pages} site={site} showOwner={false} empty="No pages are yours yet. An administrator can give you one in Settings." />
              )}
            </Card>

            {resources.length > 0 && (
              <Card title={full ? "Resources" : "Your resources"} sub="Pages that rarely change. They can be linked from any message, and the owner is reminded when one is due for a look.">
                <WebsitePages pages={resources} site={site} showOwner={full} />
                <p className="sx-note">New resources start in <Link className="sx-link" href="/staff/post?type=resource">Post → Resource</Link>.</p>
              </Card>
            )}

            {showGalleries && (
              <Card title="Galleries" sub="Kinlight builds an album from each event’s photos. Only photos with consent on file are used. Feature one on the community pages, or hide one.">
                <WebsiteGalleries items={galleries(slug)} />
              </Card>
            )}
          </div>

          <div className="ws-side">
            <Card title="Freshness" sub={full ? "Each page’s owner gets a “going stale” alert in Today before it’s due." : "You get a “going stale” alert in Today before anything of yours is due."}>
              {fresh.length === 0 && <p className="sx-empty"><Icon name="check" /> Everything of yours is up to date.</p>}
              <ul className="sx-list ws-fresh">
                {fresh.map((f) => (
                  <li key={f.id} className={f.stale ? "stale" : ""}>
                    <span className="ws-fresh-i">{f.stale ? <Icon name="clock" /> : <Icon name="check" />}</span>
                    <span>
                      <b>{f.title}</b>
                      <small>{full ? `${f.owner} · ` : ""}{f.rhythm} · {f.state}</small>
                    </span>
                    {f.stale ? (f.href ? <Link className="sx-btn sx-btn-sm" href={f.href}>Update</Link> : <Badge tone="warn">Going stale</Badge>) : <Badge tone="good">Fresh</Badge>}
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Live blocks" sub="On every community page. Nobody maintains them: they update themselves.">
              <ul className="sx-list ws-live">
                {(access === "dining-page" ? ["menu"] : ["menu", "calendar", "news"]).map((k) => (
                  <li key={k}>
                    <b>{k === "menu" ? "Today’s menu" : k === "calendar" ? "The calendar" : "Recent news"}</b>
                    <small>{k === "menu" ? "From Menus, each morning, for every restaurant" : k === "calendar" ? "The next few days of events, from the calendar. Never seats, waitlists or pickup points." : "The latest photo posts and announcements"}</small>
                    <Badge tone="good">Automatic</Badge>
                  </li>
                ))}
              </ul>
            </Card>

            {full && (
              <>
                <Card title="Languages" sub="The site and every event page in each language families read. Automatic, with a review option.">
                  <WebsiteLanguages langs={siteLanguages(slug)} canChange />
                </Card>

                <Card title="Required pages" sub="Set up by Kinlight at launch.">
                  <ul className="sx-list ws-live">
                    {requiredPages(slug).map((r) => (
                      <li key={r.title}>
                        <b>{r.title}</b>
                        <small>{r.detail} · {r.where}</small>
                        <a className="sx-btn sx-btn-sm sx-btn-quiet" href={siteHref(slug, r.path)} target="_blank" rel="noopener"><Icon name="eye" /> View</a>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            <p className="ws-kin">
              <Icon name="search" />
              <span>Search and AI search upkeep is Kinlight’s job, along with uptime and the move from the old site. Nothing to do here{full ? <>; results are in <Link className="sx-link" href="/staff/reports/search">Reports → Website and AI search</Link></> : null}.</span>
            </p>
          </div>
        </div>
      )}

      {!showPages && (
        <p className="ws-kin">
          <Icon name="search" />
          <span>Kinlight keeps the floor plans page right for search and AI search. Prospect numbers are in <Link className="sx-link" href="/staff/reports">Reports</Link>.</span>
        </p>
      )}
    </>
  );
}
