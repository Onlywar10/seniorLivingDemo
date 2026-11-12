// Communications: every text and email conversation with a family member or resident, in one inbox. Replies the AI
// didn't act on come to the person they're assigned to ("Needs a reply"); everything the AI handled, and every
// conversation staff have had, is kept here too. Staff reply by text or email, in the person's language, or start a
// new conversation with anyone. The same messages appear on each resident's page. Server only.
import type { CommunitySlug } from "@/data/communities";
import { communities } from "@/data/communities";
import { addDays, dayShort, fmtTime, hash, nowMinutes, today } from "@/lib/clock";
import { careLogin, placements } from "./areas";
import { handledByAI } from "./engage";
import { getStaffData, planRows } from "./index";
import { baseQueue, type QItem } from "./portal";
import type { StaffRole } from "./shared";

/**
 * One message. `me` is from the community; `ai` means Kinlight sent it automatically (an announcement, an invite, a
 * confirmation), shown light gray so staff see what's already gone out; staff-written messages carry the writer's
 * name. `note` is a line about what happened, not a message anyone received.
 */
export interface ConvoMsg { id: string; me: boolean; who: string; text: string; original?: string; when: string; via: string; ai?: boolean; note?: boolean }
export interface Convo {
  id: string;
  name: string; relation: string; resident: string; lang: string;
  /** How they hear from us. */
  channel: "Text" | "Email" | "Text and email";
  phone: string; email: string;
  /** Waiting on a person: who it's assigned to, why, and replies to start from. */
  needsReply: boolean; owner?: StaffRole; ownerName?: string; why?: string; quick?: string[];
  /** Minutes ago of the last message, for sorting. */
  last: number;
  msgs: ConvoMsg[];
}
/** Anyone staff can start a conversation with. */
export interface Reachable { name: string; relation: string; resident: string; lang: string; channel: Convo["channel"]; phone: string; email: string }

const first = (n = "") => n.split(" ")[0];

/** "Today, 9:15 am", "Yesterday, 4:10 pm", "Sun, Nov 8, 5:00 pm" for something `mins` ago. */
function stamp(mins: number) {
  const now = nowMinutes();
  let abs = now - mins;
  if ((((abs % 1440) + 1440) % 1440) < 8 * 60) abs -= 12 * 60;
  const off = Math.floor(abs / 1440);
  const m = Math.round((((abs % 1440) + 1440) % 1440) / 5) * 5;
  return `${off === 0 ? "Today" : off === -1 ? "Yesterday" : dayShort(addDays(today(), off))}, ${fmtTime(m)}`;
}

export function inbox(slug: CommunitySlug, as: StaffRole): { convos: Convo[]; people: Reachable[] } {
  const s = getStaffData(slug);
  const contact = (name: string) => s.contacts.find((c) => c.contact === name);
  const chan = (c?: { channel: string }): Convo["channel"] => (!c ? "Text" : c.channel === "Email" ? "Email" : c.channel === "SMS" ? "Text" : "Text and email");
  const ownerName = (r: StaffRole) => {
    const k = { events: s.roles.calendar, desk: s.roles.desk, kitchen: s.roles.menus, manager: s.roles.approver, sales: s.roles.tours, caregiver: s.roles.calendar, lantern: s.roles.lantern }[r];
    return s.people[k]?.name ?? "";
  };
  const replies = baseQueue(slug).filter((q): q is Extract<QItem, { kind: "reply" }> => q.kind === "reply");
  const out: Convo[] = [];
  const used = new Set<string>();

  // Conversations staff have had, by text or email.
  for (const t of s.threads) {
    const c = contact(t.from);
    // The reply waiting on this conversation: the same person and their latest message.
    const lastIn = [...t.msgs].reverse().find((m) => !m.me)?.text;
    const r = replies.find((q) => q.from === t.from && q.text === lastIn);
    if (r) used.add(r.id);
    const owner: StaffRole = r?.for[0] ?? (/dinner|lunch|menu|soup|table/i.test(t.subject + t.msgs.map((m) => m.text).join(" ")) ? "kitchen" : "events");
    // Their question is the last word and nobody has answered: it waits on the person in charge, even if the AI
    // didn't flag it (Kinlight's own offer started the conversation, so it's still a question for staff).
    const lastMsg = t.msgs[t.msgs.length - 1];
    const unanswered = !lastMsg.me && t.unread;
    const res = first(t.resident), fam = first(t.from);
    const quick = r?.quick ?? (unanswered && /waitlist|waiting list/i.test(lastMsg.text)
      ? [`Hi ${fam}, thank you for asking. I’ll check the waiting list for ${res} and text you today. If a seat opens, you’ll both hear straight away.`, "Let me check and get back to you today."]
      : unanswered ? ["Let me check and get back to you today."] : undefined);
    out.push({
      id: `t-${t.id}`, name: t.from, relation: t.relation, resident: t.resident, lang: t.lang, channel: chan(c), phone: c?.phone ?? r?.phone ?? "", email: c?.email ?? "",
      needsReply: !!r || unanswered, owner, ownerName: ownerName(owner), quick, last: t.mins,
      why: r?.why ?? (unanswered ? "A question about a seat on a full trip, which staff answer." : undefined),
      msgs: t.msgs.map((m, i) => {
        const auto = !!m.me && i === 0;
        return { id: `${t.id}-${i}`, me: !!m.me, ai: auto, who: auto ? "Kinlight" : m.me ? first(ownerName(owner)) : first(t.from), text: m.text, original: m.original, when: stamp(m.mins), via: chan(c) === "Email" ? "Email" : "Text" };
      }),
    });
  }
  // Questions the AI passed to the front desk or the kitchen.
  for (const r of replies) {
    if (used.has(r.id)) continue;
    const c = contact(r.from);
    out.push({
      id: `r-${r.id}`, name: r.from, relation: r.relation, resident: r.resident, lang: r.lang, channel: chan(c), phone: r.phone, email: c?.email ?? "",
      needsReply: true, owner: r.for[0], ownerName: ownerName(r.for[0]), why: r.why, quick: r.quick, last: r.mins,
      msgs: [{ id: `${r.id}-0`, me: false, who: first(r.from), text: r.text, original: r.original, when: stamp(r.mins), via: "Text" }],
    });
  }
  // Clear answers to Kinlight's own questions, which the AI handled: kept here, nothing to do.
  handledByAI(slug).filter((h) => !out.some((x) => x.name === h.from)).slice(0, 3).forEach((h, i) => {
    const c = contact(h.from);
    const mins = 40 + i * 170;
    const who = first(h.from);
    // "Asked “RSVP 3 people? Reply YES.” They did. Sent to the resident." becomes the confirmation and their YES.
    const conf = h.did.match(/^Asked “(.+?)” They did\. (.*)$/);
    const msgs: ConvoMsg[] = [
      { id: `ai${i}-a`, me: true, who: "Kinlight", text: h.asked.replace(/^“|”$/g, ""), when: stamp(mins + 30), via: "Text", ai: true },
      { id: `ai${i}-b`, me: false, who, text: h.reply, when: stamp(mins + 4), via: "Text" },
      ...(conf ? [
        { id: `ai${i}-c`, me: true, who: "Kinlight", text: conf[1], when: stamp(mins + 3), via: "Text", ai: true },
        { id: `ai${i}-d`, me: false, who, text: "YES", when: stamp(mins + 1), via: "Text" },
      ] : []),
      { id: `ai${i}-e`, me: true, who: "Kinlight", text: conf ? conf[2] : h.did, when: stamp(mins), via: "Note", ai: true, note: true },
    ];
    const resident = h.relation === "Resident" ? h.from : c?.resident ?? "";
    out.push({ id: `ai-${i}`, name: h.from, relation: h.relation, resident, lang: c?.lang ?? "English", channel: chan(c), phone: c?.phone ?? "", email: c?.email ?? "", needsReply: false, owner: "events", last: mins, msgs });
  });

  out.push(...authored(slug, out));

  // Each person sees the conversations they're in charge of; the administrator sees every one.
  const mine = (x: Convo) => as === "manager" || x.owner === as;
  const convos = out.filter(mine).sort((a, b) => Number(b.needsReply && b.owner === as) - Number(a.needsReply && a.owner === as) || a.last - b.last);

  // Who they can start a conversation with: prospects for sales, families and residents for everyone else.
  if (as === "sales") {
    const pp: Reachable[] = [
      ...s.enquiries.map((e) => ({ name: e.name, relation: "Prospect", resident: e.interest, lang: "English", channel: "Text and email" as const, phone: prospectPhone(s, e.name), email: "" })),
      ...s.waitlist.map((w) => ({ name: w.name, relation: "On the waitlist", resident: planRows(slug).find((p) => p.code === w.plan)?.name ?? w.plan, lang: "English", channel: "Text and email" as const, phone: prospectPhone(s, w.name), email: "" })),
    ];
    return { convos, people: pp };
  }
  const people: Reachable[] = s.contacts.map((c) => ({ name: c.contact, relation: c.relation, resident: c.resident, lang: c.lang, channel: chan(c), phone: c.phone, email: c.email }));
  const seen = new Set<string>();
  for (const c of s.contacts) {
    if (seen.has(c.resident) || c.lantern) continue;
    seen.add(c.resident);
    people.push({ name: c.resident, relation: "Resident", resident: c.resident, lang: c.lang, channel: "Text", phone: "", email: "" });
  }
  return { convos, people: people.sort((a, b) => a.name.localeCompare(b.name)) };
}

/** How many conversations wait on this person, for the badge beside Communications. */
export const waitingReplies = (slug: CommunitySlug, as: StaffRole) => inbox(slug, as).convos.filter((c) => c.needsReply && c.owner === as).length;

/** A stable phone number in the community's area code for a prospect (the same rule Today's inquiry card uses). */
const prospectPhone = (s: ReturnType<typeof getStaffData>, name: string) => `${s.brand.phone.slice(0, 5)} 555-0${String(100 + (hash(name) % 899)).padStart(3, "0")}`;

type Line = [mins: number, them: boolean, text: string];

/**
 * The everyday conversations each person is in charge of, written from this community's own families, residents
 * and prospects: the front desk (visits, deliveries, lost and found), the kitchen (diets, special orders), the
 * executive director (billing, a move to more care, thanks), sales (prospects and the waitlist) and the care partners
 * (the families of the residents they look after). A few wait for a reply; the rest are answered.
 */
function authored(slug: CommunitySlug, taken: Convo[]): Convo[] {
  const s = getStaffData(slug);
  const c = communities[slug];
  const used = new Set(taken.map((x) => x.name));
  // English-speaking family members not already in a conversation, so each conversation is someone new.
  const pool = s.contacts.filter((x) => x.lang === "English" && !x.lantern && !used.has(x.contact));
  let n = 0;
  const next = () => { const x = pool[n++ % pool.length]; used.add(x.contact); return x; };
  const chan = (x: { channel: string }): Convo["channel"] => (x.channel === "Email" ? "Email" : x.channel === "SMS" ? "Text" : "Text and email");
  const venue = c.venues[c.venueOrder[0]]?.name ?? "the dining room";
  const out: Convo[] = [];
  let k = 0;
  const nm = (key: string) => first(s.people[key]?.name ?? "");
  const writer: Record<StaffRole, string> = { events: nm(s.roles.calendar), desk: nm(s.roles.desk), kitchen: nm(s.roles.menus), manager: nm(s.roles.approver), sales: nm(s.roles.tours), caregiver: nm(careLogin[slug]), lantern: nm(s.roles.lantern) };
  type Who = { name: string; relation: string; resident: string; phone: string; email: string; channel: Convo["channel"]; lang: string };
  const convo = (owner: StaffRole, who: Who, needsReply: boolean, why: string | undefined, lines: Line[], quick?: string[]) => {
    const id = `a-${owner}-${k++}`;
    out.push({
      id, name: who.name, relation: who.relation, resident: who.resident, lang: who.lang, channel: who.channel, phone: who.phone, email: who.email,
      needsReply, owner, why, quick, last: lines[lines.length - 1][0],
      msgs: lines.map(([mins, them, text], i) => ({ id: `${id}-${i}`, me: !them, who: them ? first(who.name) : writer[owner], text, when: stamp(mins), via: who.channel === "Email" ? "Email" : "Text" })),
    });
  };
  const famWho = (x: (typeof pool)[number]): Who => ({ name: x.contact, relation: x.relation, resident: x.resident, phone: x.phone, email: x.email, channel: chan(x), lang: x.lang });
  const fam = (owner: StaffRole, needsReply: boolean, why: string | undefined, lines: (r: string, f: string) => Line[], quick?: (r: string, f: string) => string[]) => {
    const x = next();
    const r = first(x.resident), f = first(x.contact);
    convo(owner, famWho(x), needsReply, why, lines(r, f), quick?.(r, f));
  };

  // The front desk: visits, deliveries, lost and found.
  fam("desk", true, "It’s about a delivery, which the front desk handles.",
    (r) => [[95, true, `A package is coming for ${r} on Thursday, a new lamp. Could the front desk keep it until I visit on Saturday?`]],
    (r, f) => [`Hi ${f}, yes, we’ll keep ${r}’s package at the front desk until Saturday.`, "Let me check and get back to you today."]);
  fam("desk", false, undefined, (r, f) => [
    [60 * 26, true, `What time can we visit on Thanksgiving Day? We’d like to bring ${r} some pie.`],
    [60 * 25, false, `Hi ${f}! Visiting is open all day on Thanksgiving. Please sign in at the front desk when you arrive.`],
    [60 * 24, true, "Perfect, thank you!"],
  ]);
  fam("desk", false, undefined, (r, f) => [
    [60 * 50, true, `${r} thinks they left their reading glasses in the theater room after the movie. Has anyone handed them in?`],
    [60 * 47, false, `Hi ${f}, they were handed in to the front desk this morning, and we’ve given them back to ${r}.`],
  ]);

  // The kitchen: diets, special orders, the restaurants.
  fam("kitchen", true, "It’s a special order for the kitchen.",
    (r) => [[140, true, `${r} turns 90 on Saturday. Could the kitchen make a small cake for lunch? There will be six of us.`]],
    (r, f) => [`Hi ${f}, thank you for telling us about ${r}’s birthday. I’ll check with the chef and get back to you today.`, "Let me check and get back to you today."]);
  fam("kitchen", false, undefined, (r, f) => [
    [60 * 30, true, `${r} says the soup has been very salty lately. Is that new?`],
    [60 * 28, false, `Hi ${f}, thank you for telling us. The chef has adjusted the recipe, and ${r} can always ask for a low-salt bowl at ${venue}.`],
    [60 * 27, true, "Great, that will help."],
  ]);

  // The executive director: billing, a move to more care, thanks.
  fam("manager", true, "It’s about a bill, which the AI never answers.",
    (r) => [[60 * 3, true, `${r}’s November statement has a $45 charge for guest meals, but we only came once. Can someone explain it?`]],
    (r, f) => [`Hi ${f}, thank you for asking. I’ll look into ${r}’s statement with the business office and call you today.`]);
  fam("sales", true, "It’s about moving to more care: a conversation for sales, not the activities team.",
    (r) => [[60 * 20, true, `We’ve been thinking ${r} might need more help soon. Could we talk about what assisted living here would look like?`]],
    (r, f) => [`Hi ${f}, of course. Would you like to come in this week to talk it through? I can also arrange a visit to an assisted living apartment.`]);
  fam("manager", false, undefined, (r, f) => [
    [60 * 70, true, `I just want to say thank you to the whole team. ${r} is happier than in years.`],
    [60 * 68, false, `Thank you, ${f}. That means a lot to everyone here. I’ve shared it with the team.`],
  ]);

  // Sales: prospects and the waitlist.
  const pr = (name: string, relation: string, resident: string): Who => ({ name, relation, resident, phone: prospectPhone(s, name), email: "", channel: "Text and email", lang: "English" });
  const e1 = s.enquiries.find((e) => e.status === "Contacted") ?? s.enquiries[0];
  const e2 = s.enquiries.find((e) => e.status === "Tour booked" && e !== e1) ?? s.enquiries[1];
  const e3 = s.enquiries.find((e) => e.status === "Nurturing" && e !== e1 && e !== e2) ?? s.enquiries[2];
  const w1 = [...s.waitlist].sort((a, b) => b.joinedDays - a.joinedDays)[0];
  const planName = (code: string) => planRows(slug).find((p) => p.code === code)?.name ?? code;
  if (e1) convo("sales", pr(e1.name, "Prospect", e1.interest), true, "A prospect’s question, which sales answers.", [
    [60 * 5, false, `Hi ${first(e1.name)}, thanks for your interest in ${c.site.name}. I’d love to show you around. Would a tour this week suit you?`],
    [55, true, "Thanks! Before we book, can my brother join the tour too? He helps with the decisions."],
  ], [`Hi ${first(e1.name)}, of course, he’s very welcome. What day suits you both?`]);
  if (e2) convo("sales", pr(e2.name, "Prospect", e2.interest), false, undefined, [
    [60 * 30, false, `Hi ${first(e2.name)}, your tour is booked. We’ll meet you at the front desk; parking is by the main entrance.`],
    [60 * 29, true, "See you then. Can my son join on a video call?"],
    [60 * 28, false, "Of course. Send me his email and I’ll add him to the invite."],
  ]);
  if (e3) convo("sales", pr(e3.name, "Prospect", e3.interest), false, undefined, [
    [60 * 24 * 6, false, `Hi ${first(e3.name)}, just checking in. Our next open house is coming up, if you’d like to see the apartments again.`],
    [60 * 24 * 5, true, "Thank you, we’re still deciding. Please keep us posted."],
  ]);
  if (w1) convo("sales", pr(w1.name, "On the waitlist", planName(w1.plan)), true, "A waitlist question, which sales answers.", [
    [60 * 8, true, `Any news on the ${planName(w1.plan)}? We’ve been on the list a while now.`],
  ], [`Hi ${first(w1.name)}, thank you for your patience. You’ve waited longest for the ${planName(w1.plan)}, and I’ll text you the moment one opens.`]);

  // Care partners: the families of the residents they look after.
  const mineRes = new Set(placements(slug).filter((p) => p.lead === careLogin[slug] && !p.lantern).map((p) => p.name));
  const theirs = s.contacts.filter((x) => mineRes.has(x.resident) && x.lang === "English" && !used.has(x.contact)).slice(0, 3);
  theirs.forEach((x, i) => {
    const r = first(x.resident), f = first(x.contact);
    if (i === 0) convo("caregiver", famWho(x), true, "A family question about their resident’s week.", [[70, true, `How has ${r} been this week? They sounded a bit low on the phone.`]],
      [`Hi ${f}, thank you for asking. I’ll stop by and see ${r} today, and let you know.`]);
    else if (i === 1) convo("caregiver", famWho(x), false, undefined, [[60 * 30, true, `Is ${r} going on the bus trip next week?`], [60 * 29, false, `Hi ${f}, yes, ${r} is booked. We’ll send photos.`]]);
    else convo("caregiver", famWho(x), false, undefined, [[60 * 52, false, `Hi ${f}, ${r} really enjoyed the music this afternoon and asked us to tell you.`], [60 * 50, true, "That made my day. Thank you!"]]);
  });
  return out;
}
