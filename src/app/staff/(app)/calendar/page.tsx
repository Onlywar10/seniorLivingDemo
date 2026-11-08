import type { Metadata } from "next";
import "@/app/staff/post.css";
import { CalendarBoard, type Booking, type CalEvent, type ReqRow } from "@/components/staff/portal/CalendarBoard";
import { NotYours } from "@/components/staff/portal/NotYours";
import { PickCommunity } from "@/components/staff/StaffCommunity";
import { PageHead } from "@/components/staff/ui";
import { cats, isLantern, kindOf } from "@/data/shared";
import { rsvpFor } from "@/data/staff";
import { sectionAccess } from "@/data/staff/access";
import { attendance, eventRequests, suggestions } from "@/data/staff/alpha";
import { checkIns, engagement, invitesFor } from "@/data/staff/engage";
import { newEventSetup } from "@/data/staff/post";
import { getStaffCommunity } from "@/data/staff/server";
import { WEEKDAYS, addDays, hash, iso, sundayOf, today } from "@/lib/clock";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const { as, access } = await sectionAccess("calendar");
  if (!access) return <NotYours section="Calendar" />;
  const sc = await getStaffCommunity();
  if (!sc) return <PickCommunity screen="Calendar" />;
  const { s, c } = sc;
  const slug = s.slug;
  const readOnly = access === "view";
  const { rooms } = c;
  // Meeting points and "All floors" can host several things at once.
  const shared = new Set<string>([rooms.lobby ?? "Lobby", "All floors"]);
  const t = today();
  const start = sundayOf(t);
  const m1 = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1));
  const from = m1 < start ? sundayOf(m1) : start;
  const days = c.staffEventsBetween(from, 49, iso(t));
  const reqs = eventRequests(slug);
  const eng = engagement(slug);
  const lanternRes = new Set(s.lanternNames);
  const taken = new Map(attendance(slug).rows.filter((r) => r.method !== "Not taken yet").map((r) => [`${r.event.id}|${r.event.date}`, r]));
  const out: CalEvent[] = [];
  for (const d of days) {
    const seen = new Map<string, string>();
    for (const e of d.events) {
      const key = `${e.room}|${e.start}`;
      const clash = !shared.has(e.room) && seen.has(key) ? seen.get(key) : undefined;
      if (!shared.has(e.room)) seen.set(key, e.title);
      const lantern = isLantern(e);
      const r = e.cap ? rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0, lantern) : undefined;
      const inv = lantern || e.cat === "faith" || e.cat === "movies" ? null : invitesFor(slug, e);
      const mine = reqs.filter((q) => q.event.id === e.id && (q.kind === "family-rsvp" || q.kind === "seat-request"));
      const requests: ReqRow[] = mine.map((q) => {
        const res = q.resident ?? "";
        const isL = lanternRes.has(res) || eng[res]?.lantern;
        return {
          id: q.id, from: q.from, relation: q.relation ?? "Family", resident: res, party: q.party, kind: q.kind === "family-rsvp" ? "rsvp" : "seat",
          stage: q.status === "checking" ? 2 : q.status === "waiting" ? 3 : 4, declined: q.status === "declined",
          lantern: isL || undefined, rep: isL ? eng[res]?.legalRep : undefined,
        };
      });
      const booked: Booking[] | undefined = r?.going.map((n, i) => ({
        name: n,
        via: mine.some((q) => q.kind === "seat-request" && q.resident === n && q.status === "confirmed") ? "Family asked, resident said yes"
          : inv?.yesNames.includes(n) ? `Invited by interest (${inv.interests.join(", ").toLowerCase()})`
          : (hash(n + e.id) + i) % 3 === 0 ? "Signed up at the desk" : "Replied YES by text",
      }));
      const att = taken.get(`${e.id}|${e.date}`);
      const ck = att ? checkIns(e.id, att.came) : undefined;
      const qr = att && !lantern ? ck!.qr : 0;
      const photos = att && hash(e.id + e.date) % 3 === 0 ? s.photoPresets.slice(hash(e.id) % 2, (hash(e.id) % 2) + 2).map((p) => p.src) : undefined;
      out.push({
        id: e.id, kind: kindOf(e), date: e.date, start: e.start, end: e.end, title: e.title, room: e.room, cat: e.cat, color: cats[e.cat].color, catLabel: cats[e.cat].label,
        cap: e.cap, taken: e.taken, waitlist: e.waitlist, lantern, leader: e.leader, desc: e.desc,
        rule: e.special ? undefined : `Every ${WEEKDAYS[d.date.getUTCDay()]}`,
        booked, waiting: r?.waiting, clash, requests: requests.length ? requests : undefined,
        came: att ? { n: att.came, of: att.expected, qr, staff: att.came - qr, how: att.method === "Tap list" ? "tap" : "sheet", by: att.by } : undefined,
        invites: inv ? { invited: inv.invited, yes: inv.yes, interests: inv.interests, text: inv.text, sentAt: inv.sentAt } : undefined,
        photos,
      });
    }
  }
  for (const e of out) if (e.clash) { const o = out.find((x) => x.date === e.date && x.room === e.room && x.start === e.start && x.title === e.clash); if (o) o.clash = e.title; }

  // Residents' ideas that became events, marked "Your idea".
  for (const sg of suggestions(slug)) {
    if (!sg.becameEvent) continue;
    const date = sg.becameEvent.date;
    out.push({ id: `idea-${sg.id}`, kind: "resident", date, start: 14 * 60, end: 15 * 60 + 30, title: sg.becameEvent.title, room: Object.values(rooms).find((r) => /club/i.test(r)) ?? Object.values(rooms)[0], cat: "community", color: cats.community.color, catLabel: cats.community.label, idea: sg.who ?? "a resident", desc: `Suggested by ${sg.who ?? "a resident (no name on the slip)"}: “${sg.text}”` });
  }

  const residents = [...s.residentNames, ...s.lanternNames].filter((n, i, a) => a.indexOf(n) === i).sort();
  return (
    <>
      <PageHead title="Calendar" sub={readOnly ? "Every event, to look up. Adding and changing events is for the activities team." : "Every event, and everything about it. The website calendar, the newsletter and the printed calendar all come from here."} />
      <CalendarBoard
        events={out}
        weekStarts={[0, 1, 2, 3, 4, 5].map((w) => iso(addDays(start, w * 7)))}
        todayIso={iso(t)}
        residents={residents}
        readOnly={readOnly}
        setup={readOnly ? undefined : newEventSetup(slug, as)}
        brand={{ name: s.brand.name, domain: s.brand.domain, phone: s.brand.phone }}
        approver={s.people[s.roles.approver].name}
      />
    </>
  );
}
