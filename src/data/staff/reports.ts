// The monthly reports' numbers that aren't on the scorecard: engagement (who came to what, and how they checked in),
// families (reach, replies, thank-yous, concerns, and what the AI handled on its own), and the prospect numbers sales
// sees. Built from one community's staff data, calendar and engagement records. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { addDays, hash, iso, nowMinutes, today } from "@/lib/clock";
import { evidence } from "./alpha";
import { checkIns, concerns, engagement, handledByAI, thankYous, unseen, whatWorked } from "./engage";
import { getStaffData } from "./index";

/* ------------------------------------------------------------ engagement */

/** Engagement for the month: residents reached, activity visits, how people checked in, and 1:1 visits. */
export function engagementReport(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const c = communities[slug];
  const t = today();
  const now = nowMinutes();
  const records = Object.values(engagement(slug));
  const residents = s.community.residents;

  // Residents reached: came to at least one activity, or had a 1:1 visit, in the last 30 days.
  const reachedShare = records.filter((r) => r.last30 > 0 || r.visits.length > 0).length / Math.max(1, records.length);
  const reached = Math.round(residents * reachedShare);
  const reachedPrev = Math.max(0, reached - 6 - (hash(slug) % 5));

  // Every activity in the last four weeks with attendance taken, and how each person was checked in.
  let visits = 0, qr = 0, staff = 0, sessions = 0;
  for (let back = 0; back < 28; back++) {
    const d = addDays(t, -back);
    for (const e of c.staffEventsOn(d, iso(t))) {
      if (back === 0 && (e.end ?? e.start + 60) > now) continue;
      if (e.cat === "movies" || e.cat === "faith") continue;
      const h = hash(e.id);
      const expected = e.cap ? e.taken ?? e.cap : 8 + (h % 18);
      const came = Math.max(2, Math.min(expected, Math.round(expected * (0.62 + (h % 35) / 100))));
      const lantern = !!e.lantern || e.cat === "lantern";
      const ck = checkIns(e.id, came);
      sessions++;
      visits += came;
      // Lantern residents are always checked in by staff.
      qr += lantern ? 0 : ck.qr;
      staff += lantern ? came : ck.staff;
    }
  }
  const visitsPrev = Math.round(visits * 0.87);

  // 1:1 visits staff logged with residents who don't join groups.
  const oneToOne = records.flatMap((r) => r.visits.map((v) => ({ resident: r.name, lantern: r.lantern, ...v })));
  const invites = records.reduce((n, r) => ({ sent: n.sent + r.invites.sent, yes: n.yes + r.invites.yes }), { sent: 0, yes: 0 });

  return {
    residents, reached, reachedPrev,
    visits, visitsPrev, sessions,
    perResident: reached ? visits / reached : 0,
    checkIns: { qr, staff, qrPct: Math.round((qr / Math.max(1, qr + staff)) * 100) },
    oneToOne,
    oneToOneResidents: new Set(oneToOne.map((v) => v.resident)).size,
    unseen: unseen(slug),
    invites,
    worked: whatWorked(slug),
  };
}

/* ------------------------------------------------------------ families */

/** Families for the month: reached, opening, replies, thank-yous, concerns, and what the AI did on its own. */
export function familiesReport(slug: CommunitySlug) {
  const s = getStaffData(slug);
  const row = (k: string) => s.scoreRows.find((r) => r.k === k);
  const reached = row("Families reached");
  const open = row("Message open rate");
  const sent = s.sends.reduce((n, x) => n + x.sent, 0);
  const opened = s.sends.reduce((n, x) => n + x.opened, 0);
  const replied = s.sends.reduce((n, x) => n + x.replied, 0);
  const cs = concerns(slug);
  const ty = thankYous(slug);
  const handled = handledByAI(slug);
  // Replies to Kinlight's own questions it acted on after a confirmation; the rest went to a person.
  const aiCount = Math.round(replied * 0.74);
  return {
    families: s.community.families,
    reached: { now: reached?.now ?? s.weekKpis.familiesReached, prev: reached?.prev ?? 0 },
    openRate: { now: open?.now ?? s.weekKpis.openRate, prev: open?.prev ?? 0 },
    sends: { count: s.sends.length, sent, opened, replied },
    languages: s.languages,
    thankYous: ty,
    concerns: cs,
    concernsOpened: cs.length,
    // Care concerns are passed to the care team and recorded in the community’s own care system: not tracked here.
    concernsOwned: cs.filter((c) => !c.care).length,
    concernsResolved: cs.filter((c) => !c.care && c.status === "Resolved").length,
    concernsPassed: cs.filter((c) => !!c.care).length,
    ai: { handled: aiCount, toStaff: replied - aiCount, examples: handled },
  };
}

/* ------------------------------------------------------------ prospect numbers (sales) */

/** Only the prospect numbers: inquiries, reply times, tours and move-ins, and where inquiries came from. */
export function prospectNumbers(slug: CommunitySlug) {
  const s = getStaffData(slug);
  return { rows: evidence(slug).filter((r) => r.prospect), sources: s.enquirySources, sourcesPrev: s.enquirySourcesPrev };
}
