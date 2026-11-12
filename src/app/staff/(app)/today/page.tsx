import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { OpenCommunity } from "@/components/staff/portal/OpenCommunity";
import { TodayDesk } from "@/components/staff/portal/TodayBlocks";
import { Badge } from "@/components/staff/ui";
import { communities } from "@/data/communities";
import { getStaffData } from "@/data/staff";
import { calendarEvents, everyone, inviteData, leaders } from "@/data/staff/calEvents";
import { celebrations, concerns, thankYous, todayActivities, unseen, welcomes } from "@/data/staff/engage";
import { concernOwners, queueAll, queueFor, roleNames, viewer } from "@/data/staff/portal";
import { newEventSetup, photoKit } from "@/data/staff/post";
import { placements } from "@/data/staff/areas";
import { diningRequests } from "@/data/staff/dining";
import { getAlertRules, getAreaState, getStaffCommunity, getStaffRole } from "@/data/staff/server";
import { accessOf, type StaffRole } from "@/data/staff/shared";
import { counts, groupOf } from "@/data/staff/signals";
import { didThisWeek, weekNumbers } from "@/data/staff/week";
import { dayName, fmtTime, fromIso, greeting, iso, longDate, nowMinutes, today } from "@/lib/clock";
import { communitySlugs } from "@/lib/sites";

export const metadata: Metadata = { title: "Today" };

const emptyFor: Record<StaffRole, string> = {
  events: "Family requests to approve, residents to ask in person and new family members appear here.",
  sales: "New inquiries appear here the moment they arrive.",
  manager: "Posts and the newsletter waiting for your approval appear here.",
  kitchen: "Menus to check appear here. Diet questions are in Communications.",
  desk: "Anything assigned to you appears here. Messages are in Communications.",
  caregiver: "Anything about your residents appears here: someone to ask in person, a family request, a new family member.",
  lantern: "Lantern family requests and Lantern concerns appear here.",
};

export default async function TodayPage() {
  const as = await getStaffRole();
  const sc = await getStaffCommunity();
  if (!sc) return <AllCommunities as={as} />;
  const { s, c } = sc;
  const slug = s.slug;
  const me = viewer(slug, as);
  const t = today();
  const now = nowMinutes();
  const acts = todayActivities(slug);
  const { familiesReached } = s.weekKpis;
  const team = as === "events" || as === "desk";
  // "Who looks after whom" (Settings): each person's own residents, and who looks after everyone.
  const areas = await getAreaState();
  const rules = await getAlertRules();
  const placed = areas.on ? placements(slug, areas.placed) : [];
  const careOf = areas.on ? Object.fromEntries(placed.filter((p) => p.lead).map((p) => [p.name, (s.people[p.lead!]?.name ?? "").split(" ")[0]])) : undefined;
  const mine = new Set(placed.filter((p) => p.lead === me.key || (!p.lead && as === "manager")).map((p) => p.name));
  const lanternSet = new Set(s.lanternNames);
  const todayShort = dayName(t).slice(0, 3);

  /* ---------- Your day, by role */
  const tours = s.tours.filter((x) => x.days === 0).sort((a, b) => a.time - b.time);
  const reqs = diningRequests(slug).requests;
  const mealGuests = reqs.filter((r) => (r.kind === "guest" || r.kind === "family" || r.kind === "reservation") && r.meal?.startsWith(todayShort) && r.status !== "waitlist");
  const holidayAsks = reqs.filter((r) => r.kind === "holiday");
  const buses = calendarEvents(slug, t, 2).filter((e) => !e.cancelled && (e.stops?.length || e.cat === "trips") && (e.date > iso(t) || e.start > now - 30)).slice(0, 4);
  const toursCard = (
    <section className="sx-card pt-tcard" aria-labelledby="pt-tours-h">
      <header className="pt-tcard-h"><h2 id="pt-tours-h">Tours today</h2></header>
      <ul className="pt-week">
        {tours.map((x) => (
          <li key={x.who}>
            <span><b>{fmtTime(x.time)} · {x.who}</b><small>{x.interest}{x.for ? ` · for ${x.for}` : ""} · with {s.people[x.with]?.name.split(" ")[0] ?? "the team"}{x.lunch ? " · staying for lunch" : ""}</small></span>
            <span>{x.time + 60 <= now ? <Badge tone="good">Done</Badge> : <Badge tone="info">{x.time <= now ? "On now" : "Later"}</Badge>}</span>
          </li>
        ))}
        {!tours.length && <li><span className="sx-hint">No tours today.</span></li>}
      </ul>
    </section>
  );
  const guestsCard = (
    <section className="sx-card pt-tcard" aria-labelledby="pt-guests-h">
      <header className="pt-tcard-h"><h2 id="pt-guests-h">Guests for meals today</h2></header>
      <ul className="pt-week">
        {mealGuests.map((r) => <li key={r.id}><span><b>{r.meal}</b><small>{r.from} · “{r.text}”</small></span><span><Badge tone={r.status === "confirmed" ? "good" : "info"}>{r.status === "confirmed" ? "Booked" : "Asked"}</Badge></span></li>)}
        {!mealGuests.length && <li><span className="sx-hint">No guests booked for today’s meals.</span></li>}
      </ul>
    </section>
  );
  const busesCard = (
    <section className="sx-card pt-tcard" aria-labelledby="pt-bus-h">
      <header className="pt-tcard-h"><h2 id="pt-bus-h">Buses leaving</h2></header>
      <ul className="pt-week">
        {buses.map((e) => <li key={e.id + e.date}><span><b>{e.date === iso(t) ? "Today" : dayName(fromIso(e.date))}, {fmtTime(e.start)} · {e.title.replace(/^Bus Trip: /, "")}</b><small>From the lobby{e.cap ? ` · ${e.taken ?? 0} of ${e.cap} booked` : ""}</small></span></li>)}
        {!buses.length && <li><span className="sx-hint">No buses today or tomorrow.</span></li>}
      </ul>
    </section>
  );
  const menusCard = (
    <section className="sx-card pt-tcard" aria-labelledby="pt-menu-h">
      <header className="pt-tcard-h"><h2 id="pt-menu-h">Live on the website today</h2><span className="pt-tcard-a"><Link href="/staff/menus" className="sx-btn sx-btn-sm">Menus</Link></span></header>
      <ul className="pt-week">
        {c.venueOrder.map((v) => <li key={v}><span><b>{c.venues[v].name}</b><small>{c.venues[v].hours}</small></span><span><Badge tone="good">Live</Badge><small>Special: {c.menuFor(v, t).special.name}</small></span></li>)}
      </ul>
    </section>
  );
  const holidayLine = holidayAsks.length ? (
    <section className="sx-card pt-tcard" aria-labelledby="pt-hol-h">
      <header className="pt-tcard-h"><h2 id="pt-hol-h">Holiday bookings</h2></header>
      <ul className="pt-week">{holidayAsks.map((r) => <li key={r.id}><span><b>{r.meal ?? r.venueName}</b><small>{r.from} · “{r.text}”</small></span></li>)}</ul>
    </section>
  ) : null;
  const careNote = as === "caregiver" && !areas.on ? (
    <section className="sx-card pt-tcard"><p className="sx-card-body">Your residents’ activities show here when <b>Who looks after whom</b> is on in <Link className="sx-link" href="/staff/settings">Settings</Link>.</p></section>
  ) : null;
  const day = { manager: <>{toursCard}{holidayLine}</>, sales: toursCard, kitchen: <>{menusCard}{guestsCard}</>, desk: <>{busesCard}{guestsCard}</>, events: null, caregiver: careNote, lantern: null }[as];

  /* ---------- When you have a minute: at most three, chosen for today */
  const thanks = thankYous(slug).filter((x) => x.staffName === me.name).map((x) => ({ id: x.id, from: x.from, relation: x.relation, resident: x.resident, text: x.text }));
  const cel = as === "events" || as === "manager" ? celebrations(slug) : as === "lantern" ? celebrations(slug).filter((x) => lanternSet.has(x.who)) : [];
  const wel = areas.on ? welcomes(slug).filter((w) => mine.has(w.name)) : as === "events" ? welcomes(slug) : [];
  const uns = areas.on ? unseen(slug).filter((u) => mine.has(u.name)) : as === "events" ? unseen(slug) : as === "lantern" ? unseen(slug).filter((u) => lanternSet.has(u.name)) : [];
  const pick = { thanks: [] as typeof thanks, celebrations: [] as typeof cel, welcomes: [] as typeof wel, unseen: [] as typeof uns };
  const pools = [["thanks", thanks], ["celebrations", cel], ["welcomes", wel], ["unseen", uns]] as const;
  for (let round = 0, left = 3; left > 0 && round < 3; round++) {
    for (const [k, list] of pools) if (left > 0 && list[round]) { (pick[k] as unknown[]).push(list[round]); left--; }
  }
  const friday = t.getUTCDay() === 5;

  return (
    <div className="pt-today">
      <TodayDesk
        me={{ as, name: me.name, first: me.first, names: roleNames(slug) }}
        hello={{ greeting: greeting(), date: longDate(t) }}
        team={team}
        items={queueAll(slug, rules, areas)}
        empty={emptyFor[as]}
        owners={concernOwners(slug)}
        events={calendarEvents(slug, t, 2)}
        acts={acts}
        dayActs={as === "kitchen" ? "none" : as === "lantern" ? "lantern" : "all"}
        myResidents={as === "caregiver" && areas.on ? [...mine] : undefined}
        careOf={careOf}
        residents={everyone(slug)}
        invite={inviteData(slug)}
        staff={leaders(slug)}
        todayIso={iso(t)}
        brand={{ name: s.brand.name, domain: s.brand.domain, phone: s.brand.phone }}
        kit={team || as === "manager" || as === "lantern" ? photoKit(slug, as) : undefined}
        setup={team || as === "manager" || as === "lantern" ? newEventSetup(slug, as) : undefined}
        day={day}
        suggest={pick}
        did={as !== "sales" && as !== "caregiver" ? { items: didThisWeek(slug), range: `${weekNumbers(slug).range} · ${familiesReached} of ${s.community.families} families reached`, full: friday } : undefined}
        numbers={as === "manager" ? `This week: ${familiesReached} of ${s.community.families} families reached · ${weekNumbers(slug).activities} activities · ${s.enquiries.length} inquiries.` : undefined}
      />
    </div>
  );
}

/** "All communities": every community side by side, with what's waiting for this person in each. */
function AllCommunities({ as }: { as: StaffRole }) {
  const me = viewer(communitySlugs[0], as);
  return (
    <div className="pt-today">
      <header className="pt-hello">
        <div>
          <h1>{greeting()}, <em>{me.first}</em></h1>
          <p>{longDate(today())} · All communities</p>
        </div>
        {accessOf(as, "post") === "full" && (
          <Link href="/staff/post?type=announcement" className="sx-btn sx-btn-terra sx-btn-lg pt-post">
            <Icon name="plus" /> Post to every community
          </Link>
        )}
      </header>
      <div className="sx-grid g-2">
        {communitySlugs.map((slug) => {
          const s = getStaffData(slug);
          const site = communities[slug].site;
          // The one number: overdue plus due today, the same rule as each community's menu.
          const q = queueFor(slug, as).filter((x) => counts(groupOf(x.due ?? 0, nowMinutes())));
          const open = concerns(slug).filter((x) => !x.care && x.status !== "Resolved").length;
          return (
            <section key={slug} className="sx-card pt-allc" aria-label={site.name}>
              <header className="sx-card-head">
                <div>
                  <h2>{site.name}</h2>
                  <p>{site.address.city}</p>
                </div>
                <OpenCommunity slug={slug} name={site.name} />
              </header>
              <ul className="pt-week">
                <li><span><b>Needs you today</b></span><span><b>{q.length}</b></span></li>
                <li><span><b>Posts to approve</b></span><span>{s.approvals.length}</span></li>
                <li><span><b>Family concerns open</b></span><span>{open}</span></li>
                <li><span><b>Families reached this week</b></span><span>{s.weekKpis.familiesReached} of {s.community.families}</span></li>
              </ul>
            </section>
          );
        })}
      </div>
      {accessOf(as, "reports") === "full" && (
        <p><Link className="sx-btn" href="/staff/reports/communities"><Icon name="chart" /> Every community side by side, in Reports</Link></p>
      )}
    </div>
  );
}
