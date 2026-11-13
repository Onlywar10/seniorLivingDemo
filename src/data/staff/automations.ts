// Automations: every message Kinlight sends to residents, families and prospects on its own. Each one follows on
// from something already approved, booked, chosen or asked (a confirmation, a reminder, the morning menu, the
// instant reply to an inquiry), so none of them waits for a person. Posts, the newsletter and announcements live in
// Post and Newsletter; alerts to staff live in Settings → Approvals and alerts. Neither is here.
//
// What's here: the list of automations (who gets each one, how and when, its wording in three languages, who owns
// it), a believable week of what actually went out (built from the community's own calendar, menus, bookings,
// inquiries and families, so names, events and dishes agree with every other screen), what went wrong, and what's
// due in the next 24 hours. Server Components only.
import { communities, type CommunitySlug } from "@/data/communities";
import { kindOf, type CalEvent } from "@/data/shared";
import { addDays, dayName, dow, fmtTime, fromIso, hash, iso, nowMinutes, shortDate, today } from "@/lib/clock";
import { weekToken } from "@/lib/residentLink";
import { es as esDict } from "@/i18n/es";
import { zh as zhDict } from "@/i18n/zh";
import { eventRequests, prospectMessages, suggestions } from "./alpha";
import { THANKSGIVING, diningRequests } from "./dining";
import { engagement, eventInterests } from "./engage";
import { getStaffData, planRows } from "./index";
import { fitnessKey, rsvpFor, type StaffData, type StaffRole } from "./shared";
import { fillIn, placeholdersIn, smsCount, type AutoGroup, type L, type LogRow, type MsgLang, type Status } from "./autoText";
import { INVITE, REMINDER, unitIn } from "./surveyKit";
import { surveyToken } from "./surveys";

const first = (n = "") => n.split(" ")[0].replace(/^The$/, "");
const last = (n = "") => n.split(" ").slice(-1)[0];
const DAY = 1440;

/* ------------------------------------------------------------ who Kinlight can reach */

export type ResidentChannel = "Text and email" | "Text" | "Email" | "Print only";
/**
 * How a resident hears from us: the rule People uses for each resident record. Lantern residents are never texted,
 * and residents without a family contact on file default to text.
 */
export function residentChannel(name: string, lantern: boolean, onFile = true): ResidentChannel {
  if (lantern) return "Print only";
  if (!onFile) return "Text";
  const h = hash(name);
  return h % 5 === 0 ? "Print only" : h % 3 === 0 ? "Email" : h % 2 ? "Text and email" : "Text";
}

export interface Person {
  name: string; kind: "resident" | "family" | "prospect";
  /** "Resident", "Daughter", "Prospect", "On the waitlist". */
  relation: string;
  /** The resident they belong to (families), or what they're interested in (prospects). */
  resident: string;
  lantern: boolean; lang: string; phone: string; email: string;
  text: boolean; mail: boolean;
}

const DOMAINS = ["gmail.com", "yahoo.com", "comcast.net", "icloud.com", "outlook.com", "sbcglobal.net"];
const phoneFor = (s: StaffData, name: string) => `${s.brand.phone.slice(0, 5)} 555-0${String(100 + (hash(name) % 899)).padStart(3, "0")}`;
const emailFor = (name: string) => {
  const clean = name.replace(/&.*$/, "").replace(/^The /, "").trim();
  return `${first(clean).toLowerCase().replace(/[^a-z]/g, "")}.${last(clean).toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@${DOMAINS[hash(name) % DOMAINS.length]}`;
};

/** Everyone Kinlight may message: residents, the families who joined, and prospects. Nobody who stopped. */
export function roster(slug: CommunitySlug): Person[] {
  const s = getStaffData(slug);
  const onFile = new Map(s.contacts.map((c) => [c.resident, c]));
  const out: Person[] = [];
  for (const name of [...new Set([...s.residentNames, ...s.lanternNames])]) {
    const lantern = s.lanternNames.includes(name);
    const ch = residentChannel(name, lantern, onFile.has(name));
    out.push({ name, kind: "resident", relation: "Resident", resident: name, lantern, lang: onFile.get(name)?.lang ?? "English", phone: phoneFor(s, name), email: emailFor(name), text: ch === "Text" || ch === "Text and email", mail: ch === "Email" || ch === "Text and email" });
  }
  for (const c of s.contacts) {
    // The same rule as each resident's Family tab: nothing to anyone who stopped, or who hasn't joined yet.
    if ((!c.sms && !c.emailOpt) || hash(c.contact) % 13 === 0) continue;
    out.push({ name: c.contact, kind: "family", relation: c.relation, resident: c.resident, lantern: !!c.lantern, lang: c.lang, phone: c.phone, email: c.email, text: c.sms && c.channel !== "Email", mail: c.emailOpt && c.channel !== "SMS" });
  }
  const seen = new Set<string>();
  const prospect = (name: string, relation: string, interest: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    out.push({ name, kind: "prospect", relation, resident: interest, lantern: false, lang: "English", phone: phoneFor(s, name), email: emailFor(name), text: true, mail: true });
  };
  s.enquiries.forEach((e) => prospect(e.name, "Prospect", e.interest));
  s.tours.forEach((t) => prospect(t.who, "Prospect", t.interest));
  s.waitlist.forEach((w) => prospect(w.name, "On the waitlist", planRows(slug).find((p) => p.code === w.plan)?.name ?? w.plan));
  return out;
}

/** Who chose each kind of news. A community-wide "on" only reaches these people. */
function choosers(slug: CommunitySlug) {
  const r = roster(slug);
  const res = r.filter((p) => p.kind === "resident" && !p.lantern && p.text);
  const fam = r.filter((p) => p.kind === "family" && p.text);
  return {
    menu: [...res.filter((p) => hash("menu" + p.name) % 9 !== 0), ...fam.filter((p) => hash("menu" + p.name) % 3 !== 0)],
    midweek: fam.filter((p) => hash(p.name + "mid") % 7 !== 0),
    week: res,
    invites: res.filter((p) => hash(p.name + "inv") % 9 !== 0),
    urgent: r.filter((p) => p.kind !== "prospect" && !(p.kind === "resident" && p.lantern) && (p.text || p.mail)),
  };
}

/** Residents and families who chose the morning menu text (Menus says the same number). */
export const morningMenuReach = (slug: CommunitySlug) => choosers(slug).menu.length;

/* ------------------------------------------------------------ the three languages */

const ES_DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const ZH_DAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const ES_MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

/** A dictionary lookup that leaves names it doesn't know (titles, rooms, dishes) in English, as the site does. */
const tr = (lang: MsgLang, s: string) => (lang === "es" ? esDict[s] : lang === "zh" ? zhDict[s] : undefined) || s;
function timeIn(lang: MsgLang, min: number) {
  const t = fmtTime(min);
  if (lang === "en") return t;
  const [hm, ap] = t.split(" ");
  if (lang === "es") return `${hm} ${ap === "am" ? "a. m." : "p. m."}`;
  const h = Math.floor(min / 60);
  return `${ap === "am" ? (h < 5 ? "凌晨" : "上午") : h === 12 ? "中午" : h < 18 ? "下午" : "晚上"}${hm}`;
}
function dayIn(lang: MsgLang, d: Date) {
  return lang === "es" ? ES_DAYS[dow(d)] : lang === "zh" ? ZH_DAYS[dow(d)] : dayName(d);
}
function dateIn(lang: MsgLang, d: Date) {
  return lang === "es" ? `${d.getUTCDate()} ${ES_MON[d.getUTCMonth()]}` : lang === "zh" ? `${d.getUTCMonth() + 1}月${d.getUTCDate()}日` : shortDate(d);
}
const rel = (lang: MsgLang, k: "today" | "tomorrow") => (lang === "es" ? (k === "today" ? "hoy" : "mañana") : lang === "zh" ? (k === "today" ? "今天" : "明天") : k);
const langOf = (name: string): MsgLang | null => (name === "Spanish" ? "es" : name === "Chinese" ? "zh" : name === "English" ? "en" : null);

type Vars = Record<string, string | number | undefined>;
type VarsFn = (lang: MsgLang) => Vars;

/* ------------------------------------------------------------ the automations */

export interface AutoDef {
  id: string; group: AutoGroup;
  name: string;
  /** The moment it fires: "When a family’s RSVP is approved". */
  fires: string;
  who: string;
  audience: ("Residents" | "Families" | "Prospects" | "Anyone")[];
  channel: "Text" | "Email" | "Text + email";
  when: string;
  /** What happens in quiet hours. */
  quiet: string;
  owner: StaffRole;
  locked?: "law" | "safety";
  text: L;
  /** Other wordings the same automation uses (a reminder, a waitlist place). Same placeholders. */
  variants?: Record<string, { label: string; text: L }>;
  subject?: L;
  /** Where the thing it follows on from lives (Post, Newsletter, Calendar…). */
  links?: { label: string; href: string }[];
  /** Coming in Beta: a part that isn't in the alpha yet. */
  beta?: string;
  /** Turning it off: what happens, in one or two sentences, worked out from what's coming up. */
  impact: string;
  /** "On · reaches 181 families who chose it" (the part after "On ·"). */
  reach: string;
}

/** An automation for a screen: its definition, a filled-in preview in each language, and the week's numbers. */
export interface AutoView extends AutoDef {
  ownerName: string;
  sample: L;
  sampleSubject?: L;
  sampleVars: Record<string, string>;
  placeholders: string[];
  week: number;
  /** "Wording changed by Nora · approved by Renata, Nov 12". */
  wording?: string;
}

interface Ctx {
  slug: CommunitySlug; s: StaffData; c: (typeof communities)[CommunitySlug];
  name: string; phone: string; domain: string; address: string;
  rep: string; lead: string; chef: string;
  main: string; mainName: string; lunchName: string;
}
function ctxOf(slug: CommunitySlug): Ctx {
  const s = getStaffData(slug);
  const c = communities[slug];
  const main = c.venueOrder[0];
  return {
    slug, s, c, name: c.site.name, phone: s.brand.phone, domain: s.brand.domain, address: c.site.addressLine,
    rep: s.people[s.roles.tours]?.name ?? "", lead: s.people[s.roles.lantern]?.name ?? "", chef: s.people[s.roles.menus]?.name ?? "",
    main, mainName: c.venues[main].name, lunchName: c.venues[c.venueOrder[1] ?? main].name,
  };
}

/** Sales automations that are hidden in the alpha: Kinlight doesn't answer inquiries or public sign-ups yet. */
const HIDDEN = new Set(["s-instant", "s-public"]);

function defsOf(x: Ctx): Omit<AutoDef, "impact" | "reach">[] {
  return allDefsOf(x).filter((d) => !HIDDEN.has(d.id));
}

function allDefsOf(x: Ctx): Omit<AutoDef, "impact" | "reach">[] {
  const fam = sampleFamilyOf(x);
  const relWord = fam.relation === "Son" || fam.relation === "Daughter" ? "mom" : first(fam.resident);
  return [
    /* ---------- joining */
    {
      id: "j-signup", group: "joining", name: "Sign-up confirmation (Stay connected)", fires: "When a family member signs up on Stay connected", who: "Families", audience: ["Families"], channel: "Text + email", when: "Right away",
      quiet: "Sends at any hour: it answers their own sign-up.", owner: "events",
      text: {
        en: "Thanks for signing up, {first name}! A welcome message is on its way, and community news from {community} starts this week. Reply STOP to stop texts, or HELP for help.",
        es: "¡Gracias por inscribirse, {first name}! Pronto recibirá un mensaje de bienvenida, y las noticias de {community} empiezan esta semana. Responda STOP para dejar de recibir mensajes, o HELP para obtener ayuda.",
        zh: "{first name}，感谢您的订阅！欢迎信息即将发出，{community} 的社区新闻将于本周开始发送。回复 STOP 停止接收短信，回复 HELP 获取帮助。",
      },
      subject: { en: "You’re signed up for news from {community}", es: "Ya está inscrito para recibir noticias de {community}", zh: "您已订阅 {community} 的新闻" },
      links: [{ label: "Stay connected page", href: `/${x.slug}/stay-connected` }],
    },
    {
      id: "j-ask", group: "joining", name: `“${first(fam.contact)} would like to join your updates. OK?”`, fires: "When a family member asks to see a resident’s week", who: "The resident (Lantern residents are asked in person)", audience: ["Residents"], channel: "Text", when: "Right away; one reminder the next day",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "Hi {first name}, {family} would like to see what you’re signed up for each week, and photos of you that we share. Is that OK? Reply YES or NO. You can change your mind any time.",
        es: "Hola, {first name}: a {family} le gustaría ver en qué actividades está inscrito cada semana y las fotos suyas que compartimos. ¿Está de acuerdo? Responda SÍ o NO. Puede cambiar de opinión cuando quiera.",
        zh: "{first name}您好，{family} 希望能看到您每周报名的活动，以及我们分享的您的照片。可以吗？请回复 YES 或 NO。您可以随时改变主意。",
      },
      variants: { reminder: { label: "Next-day reminder", text: { en: "Hi {first name}, just checking: is it OK for {family} to see your week and your photos? Reply YES or NO.", es: "Hola, {first name}: ¿le parece bien que {family} vea su semana y sus fotos? Responda SÍ o NO.", zh: "{first name}您好，想再确认一下：可以让 {family} 看到您的一周和照片吗？请回复 YES 或 NO。" } } },
    },
    {
      id: "j-welcome", group: "joining", name: "Welcome, once the resident agrees", fires: "When the resident replies YES", who: "The family member", audience: ["Families"], channel: "Text + email", when: "Right away",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "Welcome, {first name}! {resident} said yes, so you’ll now get {resident}’s week every Sunday, with photos, and the community news. Reply STOP any time to stop.",
        es: "¡Bienvenido, {first name}! {resident} dijo que sí, así que cada domingo recibirá la semana de {resident}, con fotos, y las noticias de la comunidad. Responda STOP cuando quiera para dejar de recibirlos.",
        zh: "欢迎您，{first name}！{resident} 已同意，您今后每周日都会收到 {resident} 的一周动态（含照片）和社区新闻。随时回复 STOP 即可停止。",
      },
      subject: { en: "Welcome to {community} updates", es: "Bienvenido a las novedades de {community}", zh: "欢迎订阅 {community} 动态" },
    },

    /* ---------- news */
    {
      id: "n-midweek", group: "news", name: "Midweek highlight", fires: "Every Wednesday, from the week’s calendar", who: "Families who chose it", audience: ["Families"], channel: "Text", when: "Wednesdays, 10:00 am",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "Midweek at {community}: {highlight}. The whole week comes by email on Sunday. Reply STOP to stop texts.",
        es: "A mitad de semana en {community}: {highlight}. La semana completa llega por correo el domingo. Responda STOP para dejar de recibir mensajes.",
        zh: "{community} 周中精选：{highlight}。完整的一周安排将于周日通过电子邮件发送。回复 STOP 停止接收短信。",
      },
      links: [{ label: "The Sunday newsletter lives in Newsletter", href: "/staff/newsletter" }],
    },
    {
      id: "n-menu", group: "news", name: "Morning menu", fires: "Every morning, from the day’s published menu", who: "Residents and families who chose it", audience: ["Residents", "Families"], channel: "Text", when: "9:00 am daily",
      quiet: "Never in quiet hours.", owner: "kitchen",
      text: {
        en: "Good morning! Today at {restaurant}: {menu}. Always available: ask your server. Reply BOOK to reserve.",
        es: "¡Buenos días! Hoy en {restaurant}: {menu}. Siempre disponible: pregunte a su mesero. Responda BOOK para reservar.",
        zh: "早上好！今天 {restaurant} 供应：{menu}。常备菜单请咨询服务员。回复 BOOK 预订。",
      },
      links: [{ label: "Menus", href: "/staff/menus" }],
    },
    {
      id: "n-week", group: "news", name: "Your week (each resident’s bookings, with a link)", fires: "Every Sunday, from their bookings", who: "Residents", audience: ["Residents"], channel: "Text", when: "Sundays, 8:00 am",
      quiet: "Never in quiet hours.", owner: "events",
      text: {
        en: "Good morning, {first name}! Your week at {community}: {bookings}. See it all, and say yes to more: {link}",
        es: "¡Buenos días, {first name}! Su semana en {community}: {bookings}. Véala completa y apúntese a más: {link}",
        zh: "{first name}，早上好！您在 {community} 的一周：{bookings}。查看全部并报名更多活动：{link}",
      },
    },

    /* ---------- events */
    {
      id: "e-invite", group: "events", name: "Personal invite by interest", fires: "When an event is posted that matches what they enjoy", who: "Residents with that interest", audience: ["Residents"], channel: "Text", when: "When the event is posted",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "{first name}, {event} is {day} at {time}. Want to come? Reply YES.",
        es: "{first name}, {event} es el {day} a las {time}. ¿Quiere venir? Responda SÍ.",
        zh: "{first name}，{event} 将于{day}{time}举行。想来参加吗？请回复 YES。",
      },
      links: [{ label: "Calendar", href: "/staff/calendar" }],
    },
    {
      id: "e-nudge", group: "events", name: "Reminder if they haven’t answered", fires: "When an invite has no answer the day before", who: "The same residents", audience: ["Residents"], channel: "Text", when: "Day before, 10:00 am",
      quiet: "Never in quiet hours.", owner: "events",
      text: {
        en: "Just a reminder: {event} is tomorrow at {time}. Still want to come? Reply YES, or tap your week page.",
        es: "Un recordatorio: {event} es mañana a las {time}. ¿Todavía quiere venir? Responda SÍ o abra su página de la semana.",
        zh: "温馨提醒：{event} 将于明天{time}举行。还想参加吗？请回复 YES，或打开您的每周页面。",
      },
    },
    {
      id: "e-remind", group: "events", name: "Reminder for people booked", fires: "Before an event someone is booked on", who: "Residents and families booked", audience: ["Residents", "Families"], channel: "Text", when: "Morning of, 8:30 am; day before at 4:00 pm for trips",
      quiet: "Never in quiet hours.", owner: "events",
      text: {
        en: "Reminder: {event} is {day} at {time}, {place}. See you there, {first name}!",
        es: "Recordatorio: {event} es {day} a las {time}, {place}. ¡Nos vemos allí, {first name}!",
        zh: "提醒：{event} 将于{day}{time}在{place}举行。{first name}，到时见！",
      },
    },
    {
      id: "e-checkfirst", group: "events", name: `“We’ll check with your ${relWord} first”`, fires: "When a family member asks for a seat or RSVPs", who: "The family member who asked", audience: ["Families"], channel: "Text", when: "Right away",
      quiet: "Sends at any hour: it answers their own message.", owner: "events",
      text: {
        en: "Thanks, {first name}! We’ve got your RSVP for the {event} ({party} guests). We’ll check with {resident} first and text you the answer.",
        es: "¡Gracias, {first name}! Recibimos su confirmación para {event} ({party} invitados). Primero lo consultaremos con {resident} y le enviaremos la respuesta por mensaje.",
        zh: "{first name}，谢谢！我们已收到您参加 {event} 的回复（{party} 位客人）。我们会先征得 {resident} 的同意，再短信告诉您结果。",
      },
    },
    {
      id: "e-askres", group: "events", name: "Asking the resident about a family request", fires: "When a family request comes in", who: "The resident (never Lantern: those are asked in person)", audience: ["Residents"], channel: "Text", when: "Right away; a reminder the next day",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "{family} would like to come to the {event} with you on {day}, with {party} guests. Is that OK? Reply YES or NO.",
        es: "A {family} le gustaría acompañarle a {event} el {day}, con {party} invitados. ¿Le parece bien? Responda SÍ o NO.",
        zh: "{family} 希望{day}和您一起参加 {event}，同行 {party} 位客人。可以吗？请回复 YES 或 NO。",
      },
      variants: { reminder: { label: "Next-day reminder", text: { en: "Hi {first name}, {family} is still hoping to join you at the {event} on {day}. Is that OK? Reply YES or NO.", es: "Hola, {first name}: {family} todavía quiere acompañarle a {event} el {day}. ¿Le parece bien? Responda SÍ o NO.", zh: "{first name}您好，{family} 仍希望{day}和您一起参加 {event}。可以吗？请回复 YES 或 NO。" } } },
    },
    {
      id: "e-outcome", group: "events", name: "Confirmed, waitlisted, or a seat opened", fires: "When staff approve, the event is full, or a seat opens", who: "The family and the resident", audience: ["Families", "Residents"], channel: "Text", when: "When it happens",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "Good news, {first name}! {resident} is looking forward to it. You’re confirmed for the {event}: {party} guests plus {resident}, {day} at {time}, in the {place}.",
        es: "¡Buenas noticias, {first name}! {resident} tiene muchas ganas. Su lugar en {event} está confirmado: {party} invitados más {resident}, el {day} a las {time}, en {place}.",
        zh: "好消息，{first name}！{resident} 很期待。您已确认参加 {event}：{party} 位客人和 {resident}，{day}{time}，地点 {place}。",
      },
      variants: {
        opened: { label: "A seat opened", text: { en: "Good news, {first name}: a place opened up on the {event}, {day} at {time}. Reply YES to take it.", es: "Buenas noticias, {first name}: se liberó un lugar en {event}, el {day} a las {time}. Responda SÍ para quedárselo.", zh: "好消息，{first name}：{event}（{day}{time}）空出了一个名额。回复 YES 即可预留。" } },
        no: { label: "A kind no", text: { en: "Hi {first name}, we asked {resident} about the {event}, and {resident} would rather not this time, so we haven’t added you. We’ll let you know about the next family event.", es: "Hola, {first name}: le preguntamos a {resident} por {event} y esta vez prefiere no ir, así que no le hemos inscrito. Le avisaremos del próximo evento familiar.", zh: "{first name}您好，我们询问了 {resident} 关于 {event} 的安排，{resident} 这次不想参加，所以我们没有为您报名。下次有家庭活动时会通知您。" } },
      },
    },
    {
      id: "e-change", group: "events", name: "Change or cancellation to an event they’re booked on", fires: "When staff save a change to the time, place or date", who: "Everyone booked", audience: ["Residents", "Families"], channel: "Text", when: "When staff save the change",
      quiet: "Waits until 8:00 am, unless the event is before 10:00 am.", owner: "events",
      text: {
        en: "Change for {day}: {event} now starts at {time} (was {old time}), still in the {place}.",
        es: "Cambio para el {day}: {event} ahora empieza a las {time} (antes a las {old time}), en {place} como siempre.",
        zh: "{day}的变更：{event} 改为{time}开始（原定{old time}），地点仍在{place}。",
      },
      links: [{ label: "Calendar", href: "/staff/calendar" }],
    },
    {
      id: "e-checkin", group: "events", name: "Check-in confirmation", fires: "When staff scan a resident’s check-in card at the door", who: "The resident", audience: ["Residents"], channel: "Text", when: "On scan",
      quiet: "Only when their card is scanned.", owner: "events",
      text: { en: "You’re checked in to {event}, {first name}. Enjoy!", es: "Ya está registrado en {event}, {first name}. ¡Que lo disfrute!", zh: "{first name}，您已签到 {event}。祝您愉快！" },
    },
    {
      id: "e-idea", group: "events", name: "“Your idea made the calendar”", fires: "When a resident’s suggestion is scheduled", who: "The resident who suggested it", audience: ["Residents"], channel: "Text", when: "When it’s scheduled",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: {
        en: "Your idea made the calendar, {first name}! {event}, {day} at {time}, in the {place}. Thank you for suggesting it.",
        es: "¡Su idea ya está en el calendario, {first name}! {event}, el {day} a las {time}, en {place}. Gracias por sugerirla.",
        zh: "{first name}，您的建议已列入活动日历！{event}，{day}{time}，地点 {place}。感谢您的提议。",
      },
      links: [{ label: "Resident ideas in Feedback", href: "/staff/feedback" }],
    },

    /* ---------- Lantern */
    {
      id: "l-inperson", group: "lantern", name: "“We’ll ask in person first”", fires: "When a Lantern family RSVPs or asks for a seat", who: "The Lantern family member who asked", audience: ["Families"], channel: "Text", when: "Right away",
      quiet: "Sends at any hour: it answers their own message.", owner: "lantern",
      text: {
        en: "Thanks, {first name}! We’ve got your RSVP for the {event} ({party} guests). {lead} will ask {resident} in person and text you the answer.",
        es: "¡Gracias, {first name}! Recibimos su confirmación para {event} ({party} invitados). {lead} se lo preguntará a {resident} en persona y le enviará la respuesta por mensaje.",
        zh: "{first name}，谢谢！我们已收到您参加 {event} 的回复（{party} 位客人）。{lead} 会当面询问 {resident}，再短信告诉您结果。",
      },
    },
    {
      id: "l-outcome", group: "lantern", name: "The answer, after asking in person", fires: "When the Lantern team records the resident’s answer", who: "The Lantern family member", audience: ["Families"], channel: "Text", when: "When it’s recorded",
      quiet: "Waits until 8:00 am.", owner: "lantern",
      text: {
        en: "Good news, {first name}! {lead} asked {resident}, who is looking forward to it. You’re confirmed for the {event}, {day} at {time}. Please sign in at the front desk when you arrive.",
        es: "¡Buenas noticias, {first name}! {lead} se lo preguntó a {resident}, que tiene muchas ganas. Su lugar en {event} está confirmado, el {day} a las {time}. Por favor, regístrese en la recepción al llegar.",
        zh: "好消息，{first name}！{lead} 已当面询问 {resident}，{resident} 很期待。您已确认参加 {event}，{day}{time}。到达时请在前台登记。",
      },
    },

    /* ---------- dining */
    {
      id: "d-booking", group: "dining", name: "Booking confirmed, reminder before the meal", fires: "When a resident or family books a table", who: "The resident or family member", audience: ["Residents", "Families"], channel: "Text", when: "Right away, then 2 hours before",
      quiet: "The confirmation answers them at any hour; the reminder never falls in quiet hours.", owner: "kitchen",
      text: {
        en: "You’re booked: a table for {party} at {time}, {day}, at {restaurant}. We’ll text a reminder 2 hours before. Reply CANCEL to cancel.",
        es: "Reserva confirmada: mesa para {party} a las {time}, {day}, en {restaurant}. Le enviaremos un recordatorio 2 horas antes. Responda CANCEL para cancelar.",
        zh: "预订成功：{day}{time}，{restaurant}，{party} 人桌。我们会在用餐前 2 小时短信提醒您。回复 CANCEL 取消。",
      },
      variants: { reminder: { label: "2 hours before", text: { en: "Reminder: your table for {party} at {restaurant} is at {time} today. Reply CANCEL if plans change.", es: "Recordatorio: su mesa para {party} en {restaurant} es hoy a las {time}. Responda CANCEL si cambian sus planes.", zh: "提醒：您今天{time}在 {restaurant} 预订了 {party} 人桌。如有变动请回复 CANCEL。" } } },
      links: [{ label: "Dining requests in Menus", href: "/staff/menus" }],
    },
    {
      id: "d-holiday", group: "dining", name: "Guest or holiday booking confirmed (Thanksgiving)", fires: "When a guest meal or a holiday seating is booked", who: "The resident or family member", audience: ["Residents", "Families"], channel: "Text + email", when: "Right away",
      quiet: "Answers them at any hour.", owner: "kitchen",
      text: {
        en: "You’re booked for {event} at {restaurant}: {party} at the {time} seating on {day}. {prices}. Reply CANCEL to cancel.",
        es: "Reserva confirmada para {event} en {restaurant}: {party} personas en el turno de las {time}, el {day}. {prices}. Responda CANCEL para cancelar.",
        zh: "已为您预订 {restaurant} 的 {event}：{day}{time}场次，{party} 人。{prices}。回复 CANCEL 取消。",
      },
      subject: { en: "You’re booked: {event} at {restaurant}", es: "Reserva confirmada: {event} en {restaurant}", zh: "预订成功：{restaurant} {event}" },
    },
    {
      id: "d-swap", group: "dining", name: "“We’re out of the salmon; the chef suggests…”", fires: "When the kitchen swaps or takes off a dish", who: "People booked for that meal", audience: ["Residents", "Families"], channel: "Text", when: "When the kitchen swaps a dish",
      quiet: "Only during meal times.", owner: "kitchen",
      text: {
        en: "{restaurant}: we’re out of the {dish} today. The chef suggests {instead} instead. Anything else from the always-available menu too: just ask your server.",
        es: "{restaurant}: hoy se nos acabó {dish}. El chef sugiere {instead} en su lugar. También puede pedir cualquier plato del menú permanente: pregunte a su mesero.",
        zh: "{restaurant}：今天的{dish}已售完。主厨推荐改选{instead}。也可以点常备菜单上的任何菜品，请咨询服务员。",
      },
    },
    {
      id: "d-lunch", group: "dining", name: "Answers to “What’s for lunch?”", fires: "When someone texts to ask what’s on", who: "Whoever asks", audience: ["Anyone"], channel: "Text", when: "On request",
      quiet: "Answers at any hour.", owner: "kitchen",
      text: {
        en: "Lunch at {restaurant} today: {menu}. Always available: ask your server.",
        es: "Almuerzo hoy en {restaurant}: {menu}. Siempre disponible: pregunte a su mesero.",
        zh: "{restaurant} 今日午餐：{menu}。常备菜单请咨询服务员。",
      },
    },

    /* ---------- sales */
    {
      id: "s-instant", group: "sales", name: "Instant reply to a new inquiry", fires: "When someone asks about moving in (website, chat, phone, referral)", who: "The prospect", audience: ["Prospects"], channel: "Text + email", when: "Right away, day or night",
      quiet: "Sends at any hour: it answers their own question.", owner: "sales",
      text: {
        en: "Hi {first name}, thanks for asking about {interest} at {community}. {rep} will call you shortly. Want to see it in person? Book a tour any time: {link}. Reply STOP to opt out.",
        es: "Hola, {first name}: gracias por su interés en {interest} en {community}. {rep} le llamará en breve. ¿Quiere conocerlo en persona? Reserve una visita cuando quiera: {link}. Responda STOP para no recibir más mensajes.",
        zh: "{first name}您好，感谢您咨询 {community} 的{interest}。{rep} 会尽快给您打电话。想亲自参观吗？随时预约参观：{link}。回复 STOP 退订。",
      },
      subject: { en: "Thank you for your interest in {community}", es: "Gracias por su interés en {community}", zh: "感谢您关注 {community}" },
      links: [{ label: "Prospects", href: "/staff/prospects" }],
    },
    {
      id: "s-tour", group: "sales", name: "Tour confirmed, reminder, thank-you after", fires: "When a tour is booked, the day before, and after the visit", who: "The prospect", audience: ["Prospects"], channel: "Text + email", when: "When booked, day before at 4:00 pm, after the tour",
      quiet: "Waits until 8:00 am.", owner: "desk",
      text: {
        en: "{community}: your tour is booked for {day} at {time} with {rep}. Lunch is on us. Address: {address}. Need to change it? Reply here or call {phone}.",
        es: "{community}: su visita está reservada para el {day} a las {time} con {rep}. El almuerzo corre por nuestra cuenta. Dirección: {address}. ¿Necesita cambiarla? Responda aquí o llame al {phone}.",
        zh: "{community}：您的参观已预约在{day}{time}，由 {rep} 接待。午餐由我们招待。地址：{address}。需要更改？请回复此短信或致电 {phone}。",
      },
      variants: {
        reminder: { label: "Day before", text: { en: "Reminder from {community}: we’ll see you tomorrow at {time}. Park by the main entrance and ask for {rep} at the front desk.", es: "Recordatorio de {community}: le esperamos mañana a las {time}. Estacione junto a la entrada principal y pregunte por {rep} en la recepción.", zh: "{community} 提醒：我们明天{time}恭候您。请在主入口旁停车，并到前台找 {rep}。" } },
        thanks: { label: "After the tour", text: { en: "Thank you for visiting {community} today, {first name}. It was lovely to meet you. Questions? Reply here or call {phone}.", es: "Gracias por visitar {community} hoy, {first name}. Fue un gusto conocerle. ¿Preguntas? Responda aquí o llame al {phone}.", zh: "{first name}，感谢您今天参观 {community}，很高兴认识您。有任何问题请回复此短信或致电 {phone}。" } },
      },
      subject: { en: "Your tour of {community}", es: "Su visita a {community}", zh: "您的 {community} 参观预约" },
    },
    {
      id: "s-open", group: "sales", name: "“An apartment you’re waiting for is open”", fires: "When the front desk marks a floor plan available", who: "The waitlist for that floor plan, longest waiting first", audience: ["Prospects"], channel: "Text + email", when: "When sales marks it open",
      quiet: "Waits until 8:00 am.", owner: "desk",
      text: {
        en: "Good news, {first name}: a {plan} apartment is open at {community}. You’re on the waitlist, so you hear first. Reply YES and we’ll call you today.",
        es: "Buenas noticias, {first name}: hay un apartamento {plan} disponible en {community}. Está en la lista de espera, así que es de los primeros en saberlo. Responda SÍ y le llamaremos hoy.",
        zh: "好消息，{first name}：{community} 有一套 {plan} 公寓空出。您在候补名单上，所以优先通知您。回复 YES，我们今天会给您打电话。",
      },
      subject: { en: "A {plan} is open at {community}", es: "Hay un {plan} disponible en {community}", zh: "{community} 有 {plan} 空出" },
      links: [{ label: "The waitlist in Apartments", href: "/staff/prospects#waitlist" }],
    },
    {
      id: "s-public", group: "sales", name: "Public event sign-up confirmed", fires: "When someone signs up for an open event on the website", who: "The prospect", audience: ["Prospects"], channel: "Email", when: "Right away",
      quiet: "Email: sends at any hour.", owner: "sales",
      text: {
        en: "Thank you for signing up for {event} at {community}, {day} at {time}. We’re at {address}; parking is by the main entrance. Questions? Call {phone}.",
        es: "Gracias por inscribirse en {event} en {community}, el {day} a las {time}. Estamos en {address}; el estacionamiento está junto a la entrada principal. ¿Preguntas? Llame al {phone}.",
        zh: "感谢您报名参加 {community} 的 {event}，时间为{day}{time}。地址：{address}，请在主入口旁停车。如有问题请致电 {phone}。",
      },
      subject: { en: "You’re signed up: {event}", es: "Inscripción confirmada: {event}", zh: "报名成功：{event}" },
    },

    /* ---------- surveys */
    {
      id: "v-family", group: "surveys", name: "Survey: Family satisfaction", fires: "90 days after a family joins, then every 6 months (Surveys)", who: "Families", audience: ["Families"], channel: "Text + email", when: "Day 90, then every 6 months, 10:00 am; one reminder after 3 days",
      quiet: "Waits until 8:00 am.", owner: "manager",
      text: surveyInvite({ en: "how we’re doing", es: "cómo lo estamos haciendo", zh: "我们的服务" }, 2),
      variants: { reminder: { label: "Reminder after 3 days", text: surveyInvite({ en: "how we’re doing", es: "cómo lo estamos haciendo", zh: "我们的服务" }, 2, true) } },
      subject: { en: "How are we doing? A few questions from {community}", es: "¿Cómo lo estamos haciendo? Unas preguntas de {community}", zh: "我们做得怎么样？来自 {community} 的几个问题" },
      links: [{ label: "The survey in Surveys", href: "/staff/surveys/family" }, { label: "Results in Reports", href: "/staff/reports/surveys?id=family" }],
    },
    {
      id: "sv-dining", group: "surveys", name: "Survey: Dining experience", fires: "Sent once by the kitchen’s survey, from the approved template (Surveys)", who: `Residents and families who ate at ${x.mainName} this week`, audience: ["Residents", "Families"], channel: "Text + email", when: "Sent at 10:00 am; one reminder after 3 days",
      quiet: "Waits until 8:00 am.", owner: "kitchen",
      text: surveyInvite({ en: "dining", es: "las comidas", zh: "餐饮" }, 2),
      variants: { reminder: { label: "Reminder after 3 days", text: surveyInvite({ en: "dining", es: "las comidas", zh: "餐饮" }, 2, true) } },
      subject: { en: "Your thoughts on dining at {community}", es: "Su opinión sobre las comidas en {community}", zh: "请分享您对 {community} 餐饮的看法" },
      links: [{ label: "The survey in Surveys", href: "/staff/surveys/dining" }],
    },
    {
      id: "sv-trips", group: "surveys", name: "Survey: After a bus trip", fires: "The day after every bus trip (Surveys)", who: "Everyone who went on the trip", audience: ["Residents"], channel: "Text", when: "Day after, 10:00 am; no reminder",
      quiet: "Waits until 8:00 am.", owner: "events",
      text: surveyInvite({ en: "{event}", es: "{event}", zh: "{event}" }, 1),
      links: [{ label: "The survey in Surveys", href: "/staff/surveys/trips" }],
    },

    /* ---------- replies */
    {
      id: "r-ai", group: "replies", name: "Answers the AI sends to clear replies", fires: "When someone answers one of Kinlight’s own questions (YES, a number, “what time?”)", who: "Whoever replied", audience: ["Anyone"], channel: "Text", when: "On reply",
      quiet: "Answers at any hour.", owner: "manager",
      text: {
        en: "You’re booked, {first name}! {event}, {day} at {time}. We’ll remind you that morning.",
        es: "¡Ya está inscrito, {first name}! {event}, el {day} a las {time}. Le enviaremos un recordatorio esa mañana.",
        zh: "{first name}，已为您报名！{event}，{day}{time}。当天早上我们会提醒您。",
      },
      links: [{ label: "Communications", href: "/staff/messages" }],
    },

    /* ---------- required */
    {
      id: "q-stop", group: "required", name: "STOP and HELP replies, opt-out confirmation", fires: "When anyone texts STOP, HELP or START", who: "Anyone", audience: ["Anyone"], channel: "Text", when: "On request", locked: "law",
      quiet: "Answers at any hour.", owner: "manager",
      text: {
        en: "{community}: you won’t get any more texts from us. Reply START to join again, or call {phone}.",
        es: "{community}: ya no recibirá más mensajes nuestros. Responda START para volver a suscribirse, o llame al {phone}.",
        zh: "{community}：您将不再收到我们的短信。回复 START 可重新订阅，或致电 {phone}。",
      },
      variants: { help: { label: "HELP", text: { en: "{community}: we text the updates you chose. Reply STOP to stop, or call {phone} for help.", es: "{community}: le enviamos las novedades que eligió. Responda STOP para dejar de recibirlas, o llame al {phone} si necesita ayuda.", zh: "{community}：我们只发送您选择接收的消息。回复 STOP 停止接收，如需帮助请致电 {phone}。" } } },
    },

    /* ---------- emergency */
    {
      id: "x-urgent", group: "emergency", name: "Urgent notices (weather, closures)", fires: "When staff post an urgent notice", who: "Everyone who chose them", audience: ["Residents", "Families"], channel: "Text + email", when: "When staff post one", locked: "safety",
      quiet: "Sends at any hour, even when Kinlight is paused.", owner: "manager",
      text: {
        en: "{notice} Questions? Call the front desk at {phone}.",
        es: "{notice} ¿Preguntas? Llame a la recepción al {phone}.",
        zh: "{notice} 如有问题，请致电前台 {phone}。",
      },
      subject: { en: "Urgent from {community}", es: "Urgente de {community}", zh: "{community} 紧急通知" },
      links: [{ label: "Urgent notices are posted in Post", href: "/staff/post" }],
    },
  ];
}

/** A survey invitation (or its reminder) in each language: "Alder Bend would love your thoughts on dining. It takes
 *  about 2 minutes: [link]". The survey's own page asks the questions; the text never does. */
function surveyInvite(topic: L, mins: number, reminder = false): L {
  const one = (k: MsgLang) => fillIn((reminder ? REMINDER : INVITE)[k], { topic: topic[k], minutes: mins, unit: unitIn(k, mins) });
  return { en: one("en"), es: one("es"), zh: one("zh") };
}

/** The family member the sample phone texts use, and their resident (the same one Today and the phone tours use). */
function sampleFamilyOf(x: Ctx) {
  const s = x.s;
  return s.contacts.find((c) => c.lang === "Russian" && !c.lantern) ?? s.contacts.find((c) => c.lang === "English" && c.sms && !c.lantern) ?? s.contacts[0];
}

/** Who owns each kind (they can switch it and change its wording); the administrator owns the rest. */
export const OWNER_AREA: Record<StaffRole, string> = {
  manager: "Everything", events: "Events and activities", kitchen: "Dining", sales: "Sales and tours", lantern: "Lantern", desk: "Tours and the waitlist", caregiver: "", fitness: "",
};
export const ownsAutomations = (as: StaffRole) => as === "manager" || as === "events" || as === "kitchen" || as === "desk" || as === "lantern";
const roleKey = (s: StaffData, r: StaffRole) => ({ manager: s.roles.approver, events: s.roles.calendar, kitchen: s.roles.menus, sales: s.roles.tours, lantern: s.roles.lantern, desk: s.roles.desk, caregiver: s.roles.calendar, fitness: fitnessKey(s) })[r];

/* ------------------------------------------------------------ the events this week, from the calendar */

interface Ev extends CalEvent { off: number }
function eventsAround(x: Ctx, from: number, days: number): Ev[] {
  const t = today();
  return x.c.staffEventsBetween(addDays(t, from), days, iso(t)).flatMap((d) => d.events.map((e) => ({ ...e, off: from + Math.round((fromIso(e.date).getTime() - addDays(t, from).getTime()) / 864e5) })));
}
const isTrip = (e: CalEvent) => e.cat === "trips" || /^Bus Trip/i.test(e.title);
const shortTitle = (t: string) => t.replace(/^Bus Trip: /, "");
const residentOnly = (e: CalEvent) => kindOf(e) === "resident" && !e.lantern && e.cat !== "lantern";

/* ------------------------------------------------------------ a week of what went out */

type Raw = Omit<LogRow, "id" | "status"> & { status?: Status; key?: string };

function buildLog(slug: CommunitySlug): { rows: LogRow[]; changeEvent?: { title: string; booked: number } } {
  const x = ctxOf(slug);
  const { s, c } = x;
  const t = today();
  const now = nowMinutes();
  const people = roster(slug);
  const byName = new Map(people.map((p) => [p.name, p]));
  const ch = choosers(slug);
  const eng = engagement(slug);
  const defs = new Map(defsOf(x).map((d) => [d.id, d]));
  const out: Raw[] = [];
  const inWindow = (at: number) => at >= -6 * DAY && at <= now;
  const relOf = (p: Person) => (p.kind === "resident" ? "Resident" : p.kind === "prospect" ? `${p.relation} · ${p.resident}` : `${p.relation} of ${p.resident}`);
  const base = (): Vars => ({ community: x.name, phone: x.phone, address: x.address, rep: first(x.rep), lead: first(x.lead) });

  /** One message to one person, on one channel, in their language. */
  const send = (auto: string, p: Person | undefined, at: number, vars: VarsFn, o: { ch?: "Text" | "Email"; variant?: string; reply?: Raw["reply"]; status?: Status; asked?: string } = {}) => {
    if (!p || !inWindow(at)) return;
    const via = o.ch ?? "Text";
    if (via === "Text" && !p.text) return;
    if (via === "Email" && !p.mail) return;
    const d = defs.get(auto)!;
    const tpl = o.variant ? d.variants?.[o.variant]?.text ?? d.text : d.text;
    const lg = langOf(p.lang);
    const v = (l: MsgLang) => ({ ...base(), "first name": first(p.name), ...vars(l) });
    const text = fillIn(tpl.en, v("en"));
    const original = lg && lg !== "en" ? fillIn(tpl[lg], v(lg)) : undefined;
    const subject = via === "Email" && d.subject ? fillIn(d.subject.en, v("en")) : undefined;
    out.push({ at: Math.round(at), auto, to: p.name, rel: relOf(p), resident: p.kind === "prospect" ? undefined : p.resident, ch: via, lang: p.lang, text, original, subject, reply: o.reply, status: o.status, ...(o.asked ? { asked: o.asked } : {}) } as Raw);
  };
  /** Both channels the person uses, for automations that send text and email. */
  const both = (auto: string, p: Person | undefined, at: number, vars: VarsFn, o: { variant?: string } = {}) => {
    send(auto, p, at, vars, { ...o, ch: "Text" });
    send(auto, p, at + 1, vars, { ...o, ch: "Email" });
  };
  const evVars = (e: CalEvent, extra: Vars = {}): VarsFn => (l) => ({ event: tr(l, shortTitle(e.title)), day: dayIn(l, fromIso(e.date)), time: timeIn(l, e.start), place: tr(l, e.room), ...extra });
  const jitter = (k: string, n: number) => hash(k) % n;

  /* ---------- news: the morning menu, the midweek highlight, each resident's week */
  for (let d = -6; d <= 0; d++) {
    const date = addDays(t, d);
    const m = c.menuFor(x.main, date);
    const menu: VarsFn = (l) => ({
      restaurant: x.mainName,
      menu: l === "es" ? `especial del chef: ${tr(l, m.special.name)}; sopa: ${tr(l, m.soup.name)}` : l === "zh" ? `主厨特选：${tr(l, m.special.name)}；例汤：${tr(l, m.soup.name)}` : `Chef’s special: ${m.special.name}; soup: ${m.soup.name}`,
    });
    ch.menu.forEach((p) => send("n-menu", p, d * DAY + 9 * 60, menu));
    if (dow(date) === 3) {
      const hi = eventsAround(x, d + 1, 6).find((e) => e.special && kindOf(e) !== "resident") ?? eventsAround(x, d + 1, 6).find((e) => e.special) ?? eventsAround(x, d + 1, 6)[0];
      if (hi) ch.midweek.forEach((p) => send("n-midweek", p, d * DAY + 10 * 60, (l) => ({ highlight: `${tr(l, hi.title)}, ${dayIn(l, fromIso(hi.date))} ${l === "en" ? "at " : l === "es" ? "a las " : ""}${timeIn(l, hi.start)}` })));
    }
    if (dow(date) === 0) {
      const week = eventsAround(x, d, 7).filter((e) => e.cap && residentOnly(e));
      ch.week.forEach((p) => {
        const mine = week.filter((e) => rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).going.includes(p.name)).slice(0, 3);
        const list = (l: MsgLang) => (mine.length ? mine.map((e) => `${dayIn(l, fromIso(e.date)).slice(0, l === "zh" ? 3 : 3)} ${tr(l, shortTitle(e.title))} ${timeIn(l, e.start)}`).join("; ") : l === "es" ? "aún no tiene nada reservado" : l === "zh" ? "暂无预约" : "nothing booked yet");
        send("n-week", p, d * DAY + 8 * 60, (l) => ({ bookings: list(l), link: `${x.domain}/w/${weekToken(p.name)}` }));
      });
    }
  }

  /* ---------- events: invites by interest, the nudge, reminders, check-ins, a change, ideas */
  const evs = eventsAround(x, -6, 13);
  const texters = ch.invites.filter((p) => eng[p.name]);
  for (const e of evs.filter(residentOnly)) {
    const booked = e.cap ? rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).going : [];
    const bookedSet = new Set(booked);
    // Personal invites, sent when it was posted (three to six days ahead), to residents whose interests match.
    const ints = eventInterests(e);
    const posted = e.off - (3 + jitter(e.id, 4));
    const inviteAt = posted * DAY + 10 * 60 + jitter(e.id + "t", 50);
    if (ints.length && !(e.cap && (e.taken ?? 0) >= e.cap)) {
      const asked = texters.filter((p) => !bookedSet.has(p.name) && eng[p.name].interests.some((i) => ints.includes(i))).filter((p) => hash(p.name + e.id) % 2 === 0).slice(0, 12);
      asked.forEach((p) => {
        const h = hash("reply" + e.id + p.name);
        const yes = h % 7 === 0;
        const no = !yes && h % 17 === 0;
        const replyAt = inviteAt + 6 + (h % 70);
        send("e-invite", p, inviteAt, evVars(e), yes ? { status: "replied", reply: { text: ["YES", "Yes please", "yes!", "YES 😊"][h % 4], at: replyAt, handled: "Booked. Confirmation sent." } } : no ? { status: "replied", reply: { text: "No thank you", at: replyAt, handled: "Noted. Not asked again about this one." } } : {});
        if (yes && replyAt <= now) send("r-ai", p, replyAt + 1, evVars(e));
        // Said yes: reminded like everyone booked.
        if (yes) send("e-remind", p, isTrip(e) ? (e.off - 1) * DAY + 16 * 60 : e.off * DAY + 8 * 60 + 30, evVars(e));
        // The day before, a reminder to anyone who hasn't answered.
        if (!yes && !no && h % 5 < 3) send("e-nudge", p, (e.off - 1) * DAY + 10 * 60, evVars(e));
      });
    }
    // Reminders to everyone booked: the morning of, or the afternoon before a trip.
    const remindAt = isTrip(e) ? (e.off - 1) * DAY + 16 * 60 : e.off * DAY + 8 * 60 + 30;
    booked.forEach((n) => send("e-remind", byName.get(n), remindAt, evVars(e)));
    // Card scans at the door, for activities that have started.
    const started = e.off < 0 || (e.off === 0 && e.start <= now);
    if (started) {
      const came = (booked.length ? booked : texters.filter((p) => eng[p.name].interests.some((i) => ints.includes(i))).map((p) => p.name)).filter((n) => hash(n + e.id + "qr") % 5 < 2).slice(0, 6);
      came.forEach((n) => send("e-checkin", byName.get(n), e.off * DAY + e.start - 4 + jitter(n + e.id, 9), evVars(e)));
    }
  }
  // Reminders say "today" or "tomorrow", in every language.
  for (const r of out) {
    if (r.auto !== "e-remind") continue;
    const e = evs.find((y) => r.text.includes(shortTitle(y.title)) && Math.floor(r.at / DAY) === (isTrip(y) ? y.off - 1 : y.off));
    if (!e) continue;
    const k = isTrip(e) ? "tomorrow" : "today";
    const p = byName.get(r.to)!;
    const lg = langOf(p.lang);
    const v = (l: MsgLang) => ({ ...base(), "first name": first(p.name), ...evVars(e)(l), day: rel(l, k) });
    r.text = fillIn(defs.get("e-remind")!.text.en, v("en"));
    if (lg && lg !== "en") r.original = fillIn(defs.get("e-remind")!.text[lg], v(lg));
  }

  // One change this week: a capped activity moved 30 minutes later, two days before it ran. Everyone booked is told.
  const changed = [...evs.filter((e) => residentOnly(e) && e.cap && !isTrip(e) && e.off <= -1 && e.off >= -5)].sort((a, b) => (b.taken ?? 0) - (a.taken ?? 0))[0];
  if (changed) {
    const booked = rsvpFor(s, changed.id, changed.taken ?? 0, changed.waitlist ?? 0).going;
    const at = (changed.off - 2) * DAY + 14 * 60 + 20;
    booked.forEach((n) => send("e-change", byName.get(n), at, (l) => ({ ...evVars(changed)(l), time: timeIn(l, changed.start + 30), "old time": timeIn(l, changed.start) })));
  }

  // Residents whose idea became an event.
  for (const sg of suggestions(slug)) {
    if (!sg.who || !sg.becameEvent || sg.days > 6) continue;
    const e = evs.find((y) => y.title === sg.becameEvent!.title) ?? c.staffEventsBetween(t, 30, iso(t)).flatMap((d) => d.events).find((y) => y.title === sg.becameEvent!.title);
    const date = fromIso(sg.becameEvent.date);
    send("e-idea", byName.get(sg.who), -sg.days * DAY + 11 * 60 + 15, (l) => ({ event: tr(l, sg.becameEvent!.title), day: dayIn(l, date), time: timeIn(l, e?.start ?? 14 * 60), place: tr(l, e?.room ?? "") }));
  }

  /* ---------- family requests: check with the resident first, then confirm */
  for (const r of eventRequests(slug)) {
    if (r.kind !== "family-rsvp" && r.kind !== "seat-request") continue;
    if (r.mins > 6 * DAY) continue;
    const at = now - r.mins;
    const famP = byName.get(r.from);
    const resP = r.resident ? byName.get(r.resident) : undefined;
    const e = { ...r.event, room: r.event.place, cat: (r.event.cat ?? "social") as CalEvent["cat"] } as unknown as CalEvent;
    const v = (l: MsgLang): Vars => ({ ...evVars(e)(l), party: r.party, resident: first(r.resident), family: first(r.from) });
    const lantern = !!resP?.lantern || s.lanternNames.includes(r.resident ?? "");
    if (lantern) {
      send("l-inperson", famP, at, v);
      continue;
    }
    send("e-checkfirst", famP, at, v);
    // Asked by text the same minute, or at 8:00 am if it came in during quiet hours.
    const tod = ((at % DAY) + DAY) % DAY;
    const askAt = tod >= 20 * 60 ? Math.floor(at / DAY) * DAY + DAY + 8 * 60 : tod < 8 * 60 ? Math.floor(at / DAY) * DAY + 8 * 60 : at + 1;
    const answered = r.status !== "checking";
    const replyAt = askAt + 40 + jitter(r.id, 120);
    const answer = r.status === "declined" ? "No thank you" : "YES";
    send("e-askres", resP, askAt, (l) => ({ ...v(l), "first name": first(r.resident) }), answered && replyAt <= now ? { status: "replied", reply: { text: answer, at: replyAt, handled: r.status === "declined" ? "Recorded the no. The family was told kindly." : r.status === "waiting" ? "Recorded the yes. Waiting for staff to approve." : "Recorded the yes. Sent to staff to approve." } } : {});
    if (!answered) send("e-askres", resP, askAt + DAY, (l) => ({ ...v(l), "first name": first(r.resident) }), { variant: "reminder" });
    if (r.status === "confirmed") send("e-outcome", famP, replyAt + 95 + jitter(r.id + "o", 200), v);
    if (r.status === "declined") send("e-outcome", famP, replyAt + 2, v, { variant: "no" });
  }

  /* ---------- dining: bookings and reminders, Thanksgiving, a swap, "What's for lunch?" */
  const dr = diningRequests(slug);
  const diners = people.filter((p) => p.text && ((p.kind === "resident" && !p.lantern) || p.kind === "family"));
  for (let d = -6; d <= 0; d++) {
    const date = addDays(t, d);
    // Dinner bookings by text, a few a day, each confirmed at once and reminded 2 hours before.
    diners.filter((p) => hash(p.name + "din" + d) % 13 === 0).slice(0, 4).forEach((p, i) => {
      const seat = [16 * 60 + 30, 17 * 60 + 30, 18 * 60 + 30][hash(p.name + d) % 3];
      const party = 1 + (hash(p.name + "party" + d) % 4);
      const bookedAt = d * DAY + 8 * 60 + 15 + i * 47 + jitter(p.name + d, 30);
      const v: VarsFn = (l) => ({ party, time: timeIn(l, seat), day: rel(l, "today"), restaurant: x.mainName });
      send("d-booking", p, bookedAt, v, { asked: `Table for ${party} at ${fmtTime(seat).replace(" pm", "")}?` });
      send("d-booking", p, d * DAY + seat - 120, v, { variant: "reminder" });
    });
    // "What's for lunch?", answered from the day's menu.
    const lm = c.menuFor(c.venueOrder[1] ?? x.main, date);
    diners.filter((p) => hash("lunch" + d + p.name) % 11 === 0).slice(0, 6).forEach((p, i) => {
      const at = d * DAY + 10 * 60 + 40 + i * 23 + jitter(p.name, 20);
      send("d-lunch", p, at, (l) => ({ restaurant: x.lunchName, menu: `${tr(l, lm.special.name)}; ${tr(l, lm.soup.name)}` }), { asked: "What’s for lunch?" });
    });
  }
  // The confirmations Kinlight sent to this morning's dining texts, exactly as sent.
  for (const q of dr.requests) {
    if (q.status !== "confirmed" || !/^Today|^Yesterday/.test(q.at)) continue;
    const m = q.at.match(/(\d{1,2}):(\d{2}) (am|pm)/);
    if (!m) continue;
    const min = ((Number(m[1]) % 12) + (m[3] === "pm" ? 12 : 0)) * 60 + Number(m[2]);
    const at = (q.at.startsWith("Yesterday") ? -DAY : 0) + min;
    const p = byName.get(q.from);
    if (!p || !inWindow(at)) continue;
    out.push({ at, auto: "d-booking", to: p.name, rel: relOf(p), resident: p.resident, ch: "Text", lang: p.lang, text: q.reply, asked: q.text } as Raw);
  }
  // Thanksgiving: guest seatings booked this week.
  const tg = fromIso(THANKSGIVING);
  people.filter((p) => (p.kind === "family" || (p.kind === "resident" && !p.lantern)) && hash(p.name + "tg") % 7 === 0).slice(0, 9).forEach((p) => {
    const at = -(1 + (hash(p.name) % 6)) * DAY + 9 * 60 + (hash(p.name + "m") % 600);
    const seat = hash(p.name) % 2 ? 11 * 60 + 30 : 13 * 60 + 30;
    const party = 2 + (hash(p.name + "g") % 3);
    both("d-holiday", p, at, (l) => ({ event: tr(l, "Thanksgiving Dinner"), restaurant: x.mainName, party, time: timeIn(l, seat), day: `${dayIn(l, tg)}, ${dateIn(l, tg)}`, prices: l === "es" ? "Invitados: $32 adultos, $16 niños de 12 años o menos" : l === "zh" ? "客人：成人 $32，12 岁及以下儿童 $16" : dr.holiday.prices }));
  });
  // The kitchen's swaps (the substitution log in Menus): everyone booked for that meal heard.
  const swaps: { back: number; at: number; vi: number; instead: (m: ReturnType<typeof c.menuFor>) => string }[] = [
    { back: 1, at: 18 * 60 + 15, vi: 0, instead: (m) => m.soup.name.toLowerCase() },
    { back: 2, at: 11 * 60 + 40, vi: 1, instead: () => "grilled cheese and tomato soup" },
  ];
  for (const sw of swaps) {
    const k = c.venueOrder[sw.vi % c.venueOrder.length];
    const m = c.menuFor(k, addDays(t, -sw.back));
    diners.filter((p) => hash(p.name + "swap" + sw.back) % 6 === 0).slice(0, 7).forEach((p, i) => send("d-swap", p, -sw.back * DAY + sw.at + i, (l) => ({ restaurant: c.venues[k].name, dish: tr(l, m.special.name).toLowerCase(), instead: tr(l, sw.instead(m)) })));
  }

  /* ---------- tours and the waitlist (instant replies and public sign-ups are sales: hidden in the alpha) */
  for (const e of s.enquiries) {
    if (e.mins > 6 * DAY || HIDDEN.has("s-instant")) continue;
    const p = byName.get(e.name);
    const msgs = prospectMessages(slug, { name: e.name, interest: e.interest, mins: e.mins });
    if (!p) continue;
    const at = now - e.mins;
    out.push({ at: at + 1, auto: "s-instant", to: p.name, rel: relOf(p), ch: "Text", lang: "English", text: msgs[0].text } as Raw);
    out.push({ at: at + 1, auto: "s-instant", to: p.name, rel: relOf(p), ch: "Email", lang: "English", text: msgs[1].text.replace(/\n+/g, " "), subject: msgs[1].subject } as Raw);
  }
  for (const tour of s.tours) {
    const p = byName.get(tour.who);
    if (!p) continue;
    const rep = s.people[tour.with]?.name ?? x.rep;
    const tv: VarsFn = (l) => ({ day: dayIn(l, addDays(t, tour.days)), time: timeIn(l, tour.time), rep: first(rep) });
    const bookedOn = tour.days - (2 + (hash(tour.who) % 5));
    both("s-tour", p, bookedOn * DAY + 9 * 60 + 20 + (hash(tour.who) % 400), tv);
    send("s-tour", p, (tour.days - 1) * DAY + 16 * 60, tv, { variant: "reminder" });
    if (tour.days === 0 && tour.time + 150 <= now) both("s-tour", p, tour.time + 150, tv, { variant: "thanks" });
  }
  const alert = [...s.alerts].sort((a, b) => a.days - b.days)[0];
  if (alert) {
    const plan = planRows(slug).find((p) => p.code === alert.plan);
    s.waitlist.filter((w) => w.plan === alert.plan).forEach((w) => both("s-open", byName.get(w.name), -Math.min(alert.days, 6) * DAY + 10 * 60 + 5, (l) => ({ plan: plan ? `${plan.code} ${tr(l, plan.name)}` : alert.plan })));
  }
  for (const r of eventRequests(slug)) {
    if (r.kind !== "public-signup" || !r.email || r.mins > 6 * DAY || HIDDEN.has("s-public")) continue;
    const at = now - r.mins;
    const p: Person = { name: r.from, kind: "prospect", relation: "Prospect", resident: "Public event", lantern: false, lang: "English", phone: r.phone ?? "", email: r.email, text: false, mail: true };
    const e = { ...r.event, room: r.event.place } as unknown as CalEvent;
    send("s-public", p, at + 1, (l) => ({ ...evVars(e)(l), event: tr(l, r.event.title) }), { ch: "Email" });
  }

  /* ---------- surveys, joining, and the required replies */
  // Survey invitations (Surveys): the family survey at day 90, the dining survey and its reminder, and the survey
  // the day after each bus trip. Each link opens that person's own survey page.
  const svLink = (id: string, anon: boolean, name: string) => `${x.domain}/s/${surveyToken({ id, anonymous: anon }, name)}`;
  people.filter((p) => p.kind === "family" && hash(p.name + "day90") % 9 === 0).slice(0, 4).forEach((p) => {
    const at = -(hash(p.name) % 7) * DAY + 10 * 60;
    both("v-family", p, at, () => ({ link: svLink("family", false, p.name) }));
    if (at + 3 * DAY <= now && hash(p.name) % 2) send("v-family", p, at + 3 * DAY, () => ({ link: svLink("family", false, p.name) }), { variant: "reminder" });
  });
  const svDiners = people.filter((p) => p.text && (p.kind === "family" || (p.kind === "resident" && !p.lantern)) && hash("svd" + p.name) % 4 === 0);
  svDiners.forEach((p, i) => {
    both("sv-dining", p, -3 * DAY + 10 * 60 + i, () => ({ link: svLink("dining", false, p.name) }));
    if (hash("svr" + p.name) % 3) send("sv-dining", p, 10 * 60 + i, () => ({ link: svLink("dining", false, p.name) }), { variant: "reminder" });
  });
  for (const e of eventsAround(x, -7, 7).filter((y) => isTrip(y) && residentOnly(y) && y.cap)) {
    rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).going.forEach((n) => send("sv-trips", byName.get(n), (e.off + 1) * DAY + 10 * 60, (l) => ({ event: tr(l, shortTitle(e.title)), link: svLink("trips", false, n) })));
  }
  const joiners = people.filter((p) => p.kind === "family" && !p.lantern && byName.get(p.resident)?.text).filter((p) => hash(p.name + "join") % 6 === 0).slice(0, 3);
  const sampleFam = sampleFamilyOf(x);
  if (!joiners.some((p) => p.name === sampleFam.contact) && byName.get(sampleFam.contact)) joiners.unshift(byName.get(sampleFam.contact)!);
  joiners.slice(0, 3).forEach((p, i) => {
    const day = -(1 + ((hash(p.name) + i * 2) % 5));
    const signed = day * DAY + 20 * 60 + 40 + i * 17; // in the evening: the confirmation goes at once
    both("j-signup", p, signed, () => ({}));
    const res = byName.get(p.resident)!;
    const askAt = (day + 1) * DAY + 8 * 60; // the resident is asked at 8:00 am, after quiet hours
    const yesAt = askAt + 55 + (hash(p.name) % 90);
    send("j-ask", res, askAt, () => ({ "first name": first(res.name), family: first(p.name) }), { status: "replied", reply: { text: "Yes, that’s fine", at: yesAt, handled: `${first(p.name)} now sees ${first(res.name)}’s week.` } });
    both("j-welcome", p, yesAt + 1, () => ({ resident: first(res.name) }));
  });
  // Someone asked for HELP.
  const helper = people.find((p) => p.kind === "resident" && p.text && hash(p.name + "help") % 11 === 0);
  if (helper) send("q-stop", helper, -3 * DAY + 15 * 60 + 12, () => ({}), { variant: "help", asked: "HELP" });

  return { rows: finish(x, out, people, now, defs), changeEvent: changed ? { title: changed.title, booked: rsvpFor(s, changed.id, changed.taken ?? 0, changed.waitlist ?? 0).going.length } : undefined };
}

/** Failures, opt-outs, the daily limit, delivery and opening, then ids, newest first. */
function finish(x: Ctx, raw: Raw[], people: Person[], now: number, defs: Map<string, Omit<AutoDef, "impact" | "reach">>): LogRow[] {
  let rows = raw.sort((a, b) => a.at - b.at);
  const of = (name: string, via: "Text" | "Email") => rows.filter((r) => r.to === name && r.ch === via);

  // What went wrong: a landline and a wrong number (texts), a mailbox that bounced. After a failure Kinlight stops
  // using that number or address until someone fixes it, so each fails once.
  const fails: { pick: (p: Person) => boolean; via: "Text" | "Email"; why: string }[] = [
    { pick: (p) => p.kind === "family" && p.text && !p.mail, via: "Text", why: "Landline: this number can’t receive texts" },
    { pick: (p) => p.kind === "family" && p.text && p.mail, via: "Text", why: "Wrong number: not in service" },
    { pick: (p) => p.kind === "resident" && p.text && !p.lantern, via: "Text", why: "Wrong number: not in service" },
    { pick: (p) => p.kind === "prospect", via: "Text", why: "Landline: this number can’t receive texts" },
    { pick: (p) => p.kind === "family" && p.mail, via: "Email", why: "Bounced: mailbox full" },
    { pick: (p) => p.kind === "prospect", via: "Email", why: "Bounced: no such address" },
  ];
  const used = new Set<string>();
  for (const [i, f] of fails.entries()) {
    const cands = people.filter((p) => f.pick(p) && !used.has(p.name) && of(p.name, f.via).length > 0 && of(p.name, f.via).length <= 14);
    const p = cands[hash(x.slug + i) % Math.max(1, cands.length)];
    if (!p) continue;
    used.add(p.name);
    const mine = of(p.name, f.via);
    const firstRow = mine.find((r) => r.at > -5 * DAY) ?? mine[0];
    firstRow.status = "failed";
    firstRow.fail = f.why;
    firstRow.reply = undefined;
    rows = rows.filter((r) => !(r.to === p.name && r.ch === f.via && r.at > firstRow.at));
  }

  // Opt-outs: one family member who only takes texts (so nobody can reach that family by text any more), one who
  // still has email, and one resident tired of invites. STOP is answered at once, by law, and nothing else is texted.
  const stops: { pick: (p: Person) => boolean; auto?: string }[] = [
    { pick: (p) => p.kind === "family" && p.text && !p.mail && !p.lantern },
    { pick: (p) => p.kind === "family" && p.text && p.mail },
    { pick: (p) => p.kind === "resident" && p.text, auto: "e-invite" },
  ];
  for (const [i, st] of stops.entries()) {
    const cands = people.filter((p) => st.pick(p) && !used.has(p.name) && rows.some((r) => r.to === p.name && r.ch === "Text" && r.at > -4 * DAY && r.at < -DAY && (!st.auto || r.auto === st.auto)));
    const p = cands[hash(x.slug + "stop" + i) % Math.max(1, cands.length)];
    if (!p) continue;
    used.add(p.name);
    const row = rows.find((r) => r.to === p.name && r.ch === "Text" && r.at > -4 * DAY && r.at < -DAY && (!st.auto || r.auto === st.auto))!;
    row.status = "opted-out";
    row.reply = { text: ["STOP", "Stop", "STOP please"][i], at: row.at + 7 + i * 11 };
    const d = defs.get("q-stop")!;
    rows.push({ at: row.reply.at + 1, auto: "q-stop", to: p.name, rel: row.rel, resident: row.resident, ch: "Text", lang: p.lang, text: fillIn(d.text.en, { community: x.name, phone: x.phone }), asked: "STOP" } as Raw);
    rows = rows.filter((r) => !(r.to === p.name && r.ch === "Text" && r.at > row.reply!.at + 1));
  }
  rows.sort((a, b) => a.at - b.at);

  // No more than 3 texts a day per person: anything after the third is combined into one ("Two things for today: …").
  // Answers to what someone asked (a confirmation, STOP, "What's for lunch?") and emergencies don't count.
  const answer = new Set(["r-ai", "q-stop", "x-urgent", "d-lunch", "s-instant", "j-signup", "e-checkfirst", "l-inperson", "e-checkin"]);
  const groups = new Map<string, Raw[]>();
  for (const r of rows) {
    if (r.ch !== "Text" || answer.has(r.auto) || r.status === "failed" || r.status === "opted-out" || r.reply) continue;
    const k = `${r.to}|${Math.floor(r.at / DAY)}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const drop = new Set<Raw>();
  for (const g of groups.values()) {
    if (g.length <= 3) continue;
    const extra = g.slice(2);
    const n = Math.min(3, extra.length - 2);
    const keep = extra[0];
    const list = (xs: string[]) => xs.map((t, i) => `${i + 1}) ${t.replace(/ Reply STOP to stop texts\.$/, "")}`).join(" ");
    keep.text = `${["Two", "Three", "Four", "Five"][n]} things from ${x.name}: ${list(extra.map((r) => r.text))}`;
    const lg = langOf(keep.lang);
    keep.original = lg && lg !== "en" && extra.every((r) => r.original)
      ? `${lg === "es" ? `${["Dos", "Tres", "Cuatro", "Cinco"][n]} avisos de ${x.name}:` : `${x.name}的${["两", "三", "四", "五"][n]}条消息：`} ${list(extra.map((r) => r.original!))}`
      : undefined;
    keep.combined = true;
    keep.at = extra[extra.length - 1].at;
    extra.slice(1).forEach((r) => drop.add(r));
  }
  rows = rows.filter((r) => !drop.has(r));

  // Delivery: texts are delivered within seconds; most emails are opened. Anything from the last few minutes is
  // still "sent".
  return rows
    .map((r) => {
      let status: Status = r.status ?? (r.reply ? "replied" : r.ch === "Email" ? (hash(r.to + r.at) % 100 < 63 ? "opened" : "delivered") : "delivered");
      if (!r.status && !r.reply && now - r.at < 3 && r.at <= now) status = "sent";
      return { ...r, status };
    })
    .sort((a, b) => b.at - a.at)
    .map((r, i) => {
      const { key: _k, ...rest } = r;
      void _k;
      return { ...rest, id: `${r.auto}-${i}` } as LogRow;
    });
}

// Built once per community every few minutes: every screen that shows the log reads the same rows.
const cache = new Map<string, ReturnType<typeof buildLog>>();
function logOf(slug: CommunitySlug) {
  const k = `${slug}|${iso(today())}|${Math.floor(nowMinutes() / 5)}`;
  let hit = cache.get(k);
  if (!hit) {
    for (const key of cache.keys()) if (key.startsWith(slug + "|")) cache.delete(key);
    hit = buildLog(slug);
    cache.set(k, hit);
  }
  return hit;
}

/* ------------------------------------------------------------ what the screens read */

/** Every automatic message sent in the last 7 days, newest first. Area owners see their own automations' only. */
export function automationLog(slug: CommunitySlug, as: StaffRole = "manager"): LogRow[] {
  const rows = logOf(slug).rows;
  if (as === "manager") return rows;
  const mine = new Set(defsOf(ctxOf(slug)).filter((d) => d.owner === as).map((d) => d.id));
  return rows.filter((r) => mine.has(r.auto));
}

/** Each automation's name, by id (for the log on a resident's page). */
export const automationNames = (slug: CommunitySlug): Record<string, string> => Object.fromEntries(defsOf(ctxOf(slug)).map((d) => [d.id, d.name]));

/** Messages Kinlight sent to one resident and their family, for their page in People. */
export function sentAbout(slug: CommunitySlug, resident: string): LogRow[] {
  return logOf(slug).rows.filter((r) => r.resident === resident || r.to === resident);
}

export interface WeekSummary { total: number; delivered: number; deliveredPct: number; failed: number; optedOut: number; handled: number; days: { label: string; n: number; failed: number }[] }
/** "This week: 1,214 automatic messages · 99% delivered · 6 failed · 3 opted out · 41 replies handled". */
export function summarize(rows: LogRow[], todayIso = iso(today())): WeekSummary {
  const failed = rows.filter((r) => r.status === "failed").length;
  const optedOut = rows.filter((r) => r.status === "opted-out").length;
  const handled = rows.filter((r) => r.reply?.handled).length;
  const ok = rows.filter((r) => r.status !== "failed" && r.status !== "sent").length;
  const t = fromIso(todayIso);
  const days = Array.from({ length: 7 }, (_, i) => {
    const off = i - 6;
    const d = addDays(t, off);
    const these = rows.filter((r) => Math.floor(r.at / DAY) === off);
    return { label: off === 0 ? "Today" : dayName(d).slice(0, 3), n: these.length, failed: these.filter((r) => r.status === "failed").length };
  });
  return { total: rows.length, delivered: ok, deliveredPct: rows.length ? Math.floor((ok / Math.max(1, rows.length - rows.filter((r) => r.status === "sent").length)) * 100) : 100, failed, optedOut, handled, days };
}
export const weekSummary = (slug: CommunitySlug, as: StaffRole = "manager") => summarize(automationLog(slug, as));
export const summaryLine = (w: WeekSummary) => `${w.total.toLocaleString("en-US")} automatic messages · ${w.deliveredPct}% delivered · ${w.failed} failed · ${w.optedOut} opted out · ${w.handled} replies handled`;

/** Every automation, with a preview in each language and the week's numbers. Area owners get their own. */
export function automations(slug: CommunitySlug, as: StaffRole = "manager"): AutoView[] {
  const x = ctxOf(slug);
  const { s, c } = x;
  const t = today();
  const rows = logOf(slug).rows;
  const ch = choosers(slug);
  const ppl = roster(slug);
  const fam = sampleFamilyOf(x);
  const resFirst = first(fam.resident);
  const soon = eventsAround(x, 1, 10);
  const ev = soon.find((e) => residentOnly(e) && /talk|lecture|travel/i.test(e.title)) ?? soon.find(residentOnly) ?? soon[0];
  const famEv = soon.find((e) => kindOf(e) === "family") ?? ev;
  const trip = soon.find((e) => isTrip(e) && e.cap && residentOnly(e)) ?? soon.find((e) => e.cap && residentOnly(e)) ?? ev;
  const pubEv = soon.find((e) => kindOf(e) === "public") ?? famEv;
  const m = c.menuFor(x.main, t);
  const lm = c.menuFor(c.venueOrder[1] ?? x.main, t);
  const plan = planRows(slug).find((p) => p.code === s.alerts[0]?.plan) ?? planRows(slug)[0];
  const tour = s.tours[0];
  const enq = s.enquiries[0];
  const tg = fromIso(THANKSGIVING);
  const dr = diningRequests(slug);

  // Sample values for previews: real names, events and dishes from this community.
  const sample = (d: Omit<AutoDef, "impact" | "reach">) => (l: MsgLang): Vars => {
    const e = d.id === "e-remind" ? trip : d.id === "e-checkfirst" || d.id === "e-askres" || d.id === "e-outcome" || d.id === "l-inperson" || d.id === "l-outcome" ? famEv : ev;
    const evv: Vars = { event: tr(l, shortTitle(e.title)), day: dayIn(l, fromIso(e.date)), time: timeIn(l, e.start), place: tr(l, e.room) };
    const prospectName = d.id === "s-tour" ? tour?.who : d.id === "s-open" ? s.waitlist.find((w) => w.plan === plan?.code)?.name ?? s.waitlist[0]?.name : enq?.name;
    const isProspect = d.group === "sales";
    const res = d.audience[0] === "Residents";
    const firstName = isProspect ? first((prospectName ?? "").replace(/&.*$/, "").trim()) : res ? resFirst : first(fam.contact);
    const base: Vars = { community: x.name, phone: x.phone, address: x.address, rep: first(x.rep), lead: first(x.lead), "first name": firstName, resident: resFirst, family: first(fam.contact), party: 2, ...evv };
    switch (d.id) {
      case "e-remind": return { ...base, day: rel(l, "tomorrow") };
      case "e-change": return { ...base, time: timeIn(l, e.start + 30), "old time": timeIn(l, e.start) };
            case "n-menu": return { ...base, restaurant: x.mainName, menu: l === "es" ? `especial del chef: ${tr(l, m.special.name)}; sopa: ${tr(l, m.soup.name)}` : l === "zh" ? `主厨特选：${tr(l, m.special.name)}；例汤：${tr(l, m.soup.name)}` : `Chef’s special: ${m.special.name}; soup: ${m.soup.name}` };
      case "n-midweek": return { ...base, highlight: `${tr(l, famEv.title)}, ${dayIn(l, fromIso(famEv.date))} ${l === "en" ? "at " : l === "es" ? "a las " : ""}${timeIn(l, famEv.start)}` };
      case "n-week": return { ...base, bookings: `${dayIn(l, fromIso(ev.date)).slice(0, 3)} ${tr(l, shortTitle(ev.title))} ${timeIn(l, ev.start)}`, link: `${x.domain}/w/${weekToken(fam.resident)}` };
      case "d-booking": return { ...base, party: 2, time: timeIn(l, 17 * 60 + 30), day: rel(l, "today"), restaurant: x.mainName };
      case "d-holiday": return { ...base, event: tr(l, "Thanksgiving Dinner"), restaurant: x.mainName, party: 3, time: timeIn(l, 11 * 60 + 30), day: `${dayIn(l, tg)}, ${dateIn(l, tg)}`, prices: l === "es" ? "Invitados: $32 adultos, $16 niños de 12 años o menos" : l === "zh" ? "客人：成人 $32，12 岁及以下儿童 $16" : dr.holiday.prices };
      case "d-swap": return { ...base, restaurant: x.mainName, dish: tr(l, m.special.name).toLowerCase(), instead: tr(l, m.soup.name).toLowerCase() };
      case "d-lunch": return { ...base, restaurant: x.lunchName, menu: `${tr(l, lm.special.name)}; ${tr(l, lm.soup.name)}` };
      case "s-instant": return { ...base, interest: tr(l, enq?.interest ?? "Independent Living"), link: `${x.domain}/tour` };
      case "s-tour": return { ...base, day: tour ? dayIn(l, addDays(t, tour.days)) : base.day, time: tour ? timeIn(l, tour.time) : base.time };
      case "s-open": return { ...base, plan: plan ? `${plan.code} ${tr(l, plan.name)}` : "" };
      case "v-family": return { ...base, link: `${x.domain}/s/family~${first(fam.contact).toLowerCase()}` };
      case "sv-dining": return { ...base, link: `${x.domain}/s/dining~${first(fam.contact).toLowerCase()}` };
      case "sv-trips": return { ...base, event: tr(l, shortTitle(trip.title)), "first name": resFirst, link: `${x.domain}/s/trips~${resFirst.toLowerCase()}` };
      case "x-urgent": return { ...base, notice: l === "es" ? "Prueba de la alarma de incendios a las 10:30 esta mañana. No hace falta salir de su apartamento." : l === "zh" ? "今天上午10:30进行火警警报测试，无需离开您的公寓。" : "Fire alarm test at 10:30 this morning. There’s no need to leave your apartment." };
      case "s-public": return { ...base, event: tr(l, pubEv.title), day: dayIn(l, fromIso(pubEv.date)), time: timeIn(l, pubEv.start) };
      default: return base;
    }
  };

  // How many each automation could reach: only people who chose that kind of message.
  const families = ppl.filter((p) => p.kind === "family");
  const textRes = ppl.filter((p) => p.kind === "resident" && !p.lantern && p.text);
  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const reachOf: Record<string, string> = {
    "j-signup": "to anyone who signs up", "j-ask": `reaches ${plural(textRes.length, "resident")} who get texts`, "j-welcome": "to each family member the resident says yes to",
    "n-midweek": `reaches ${plural(ch.midweek.length, "family", "families")} who chose it`, "n-menu": `reaches ${plural(ch.menu.length, "resident and family", "residents and families")} who chose it`, "n-week": `reaches ${plural(ch.week.length, "resident")} who chose texts`,
    "e-invite": `reaches ${plural(ch.invites.length, "resident")} who chose invites`, "e-nudge": "only residents who were invited and haven’t answered", "e-remind": "only people booked who get texts",
    "e-checkfirst": "only the family member who asked", "e-askres": `reaches ${plural(textRes.length, "resident")} who get texts`, "e-outcome": "only the family and the resident",
    "e-change": "only people booked on that event", "e-checkin": "only the resident who scanned", "e-idea": "only the resident who suggested it",
    "l-inperson": `reaches ${plural(families.filter((p) => p.lantern).length, "Lantern family", "Lantern families")} on file`, "l-outcome": "only the Lantern family member who asked",
    "d-booking": "only the person who booked", "d-holiday": "only the person who booked", "d-swap": "only people booked for that meal", "d-lunch": "only the person who asked",
    "s-instant": "every new inquiry", "s-tour": "only prospects with a tour", "s-open": `reaches ${plural(s.waitlist.length, "household")} on the waitlist`, "s-public": "only the person who signed up",
    "v-family": `reaches ${plural(families.length, "family member")} on file`, "sv-dining": "only people who ate there this week", "sv-trips": "only people booked on the trip", "r-ai": "only the person who replied",
    "q-stop": "anyone who texts STOP or HELP", "x-urgent": `reaches ${plural(ch.urgent.length, "resident and family member", "residents and family members")} who chose them`,
  };

  // What turning each one off would mean, from what's coming up.
  const tripBooked = trip?.cap ? rsvpFor(s, trip.id, trip.taken ?? 0, trip.waitlist ?? 0).going.filter((n) => ppl.find((p) => p.name === n)?.text).length : 0;
  const tripDay = trip ? dayName(fromIso(trip.date)) : "";
  const wk = (id: string) => rows.filter((r) => r.auto === id).length;
  const famReqs = eventRequests(slug).filter((r) => (r.kind === "family-rsvp" || r.kind === "seat-request") && r.status !== "confirmed" && r.status !== "declined").length;
  const tomorrowDinners = dr.meals.find((mm) => mm.key === "tomorrow")?.booked ?? 0;
  const impactOf: Record<string, string> = {
    "j-signup": "Families who sign up on the website won’t hear that it worked, and may sign up twice.",
    "j-ask": `Family members asking to join will wait until staff ask the resident in person. That goes to ${first(s.people[s.roles.calendar]?.name)}’s Today.`,
    "j-welcome": "Family members the resident says yes to won’t be told they’re in. They’ll still get the Sunday email.",
    "n-midweek": `${plural(ch.midweek.length, "family", "families")} who chose it won’t get Wednesday’s highlight. The Sunday email still goes.`,
    "n-menu": `${plural(ch.menu.length, "resident and family", "residents and families")} who chose it won’t get tomorrow’s menu at 9:00 am. The website and the large-print cards still show it.`,
    "n-week": `${plural(ch.week.length, "resident")} won’t get their week on Sunday. Their week page still works.`,
    "e-invite": `Residents won’t hear about new events that match what they enjoy: ${plural(wk("e-invite"), "invite")} went out this week.`,
    "e-nudge": "Residents who were invited and haven’t answered won’t get a second word.",
    "e-remind": trip ? `${plural(tripBooked, "resident")} booked on ${tripDay}’s ${shortTitle(trip.title)} won’t be reminded, and neither will anyone booked on tomorrow’s activities.` : "People booked won’t be reminded.",
    "e-checkfirst": "Families who ask for a seat won’t hear that we got it. They often ask again by phone.",
    "e-askres": `Family requests will wait for staff to ask each resident in person (${plural(famReqs, "request")} open now). “Confirmed, waitlisted, or a seat opened” waits with them.`,
    "e-outcome": "Families and residents won’t be told a request was approved, waitlisted or that a seat opened. Staff would need to call each one.",
    "e-change": "If staff change an event, the people booked won’t be told. They’d turn up at the old time.",
    "e-checkin": "Check-ins still count. Residents just won’t get the “you’re checked in” text.",
    "e-idea": "Residents won’t hear that their idea made the calendar. Staff can still tell them in person.",
    "l-inperson": "Lantern families won’t hear that their request arrived until the Lantern team calls them.",
    "l-outcome": "Lantern families won’t hear the answer by text. The Lantern team would call each one.",
    "d-booking": `Bookings still go to the kitchen, but nobody gets a confirmation or a reminder: ${tomorrowDinners} people are booked for dinner tomorrow.`,
    "d-holiday": "Thanksgiving bookings still go to the kitchen, but families won’t get a confirmation with the seating time and prices.",
    "d-swap": "If the kitchen swaps a dish, people booked won’t know until they sit down.",
    "d-lunch": "Texts asking what’s on will go to the kitchen to answer by hand.",
    "s-instant": "New inquiries won’t get an instant reply. Promise D8, “No inquiry left waiting”, depends on it.",
    "s-tour": "Prospects won’t get a confirmation, a reminder or a thank-you. More tours are missed without the reminder.",
    "s-open": `The waitlist won’t hear when an apartment opens: ${plural(s.waitlist.length, "household")} are waiting.`,
    "s-public": "People who sign up for an open event won’t get the time and directions.",
    "v-family": "Family surveys stop. The 90-day results in Reports stop updating.",
    "sv-dining": "The dining survey’s reminder won’t go. People who already have the link can still answer.",
    "sv-trips": "Nobody is asked about the next bus trip. Results in Reports stop updating.",
    "r-ai": "Clear replies (YES, a number) will wait for staff in Communications. Bookings by reply stop until someone answers.",
    "q-stop": "", "x-urgent": "",
  };

  const nm = (r: StaffRole) => s.people[roleKey(s, r)]?.name ?? "";
  const wordingOf: Record<string, string> = {
    "e-invite": `Wording changed by ${first(nm("events"))} · approved by ${first(nm("manager"))}, ${shortDate(addDays(t, 0))}`,
    "n-menu": `Wording changed by ${first(nm("kitchen"))} · approved by ${first(nm("manager"))}, ${shortDate(addDays(t, -9))}`,
    "s-instant": `Wording changed by ${first(nm("sales"))} · approved by ${first(nm("manager"))}, ${shortDate(addDays(t, -21))}`,
  };

  return defsOf(x)
    .filter((d) => as === "manager" || d.owner === as)
    .map((d) => {
      const v = sample(d);
      const fill = (l: MsgLang) => fillIn(d.text[l], v(l));
      return {
        ...d,
        impact: impactOf[d.id] ?? "",
        reach: reachOf[d.id] ?? "",
        ownerName: nm(d.owner),
        sample: { en: fill("en"), es: fill("es"), zh: fill("zh") },
        sampleSubject: d.subject ? { en: fillIn(d.subject.en, v("en")), es: fillIn(d.subject.es, v("es")), zh: fillIn(d.subject.zh, v("zh")) } : undefined,
        sampleVars: Object.fromEntries(Object.entries(v("en")).map(([k, val]) => [k, String(val)])),
        placeholders: placeholdersIn(d.text.en),
        week: wk(d.id),
        wording: wordingOf[d.id],
      };
    });
}

/* ------------------------------------------------------------ what went wrong */

export interface Problem {
  id: string;
  kind: "failed" | "bounced" | "opted-out" | "unreachable" | "reply";
  who: string; rel: string; resident?: string;
  title: string; detail: string; when: string; at: number;
  /** Whose it is: the resident's owner, or sales for prospects. */
  owner: StaffRole; ownerName: string;
  action: "fix" | "call" | "open" | "done";
  phone?: string; email?: string; href?: string; auto?: string;
}

/** Who looks after a resident's family, by default: the Lantern lead for Lantern residents, otherwise activities. */
const residentOwner = (s: StaffData, resident?: string): StaffRole => (resident && s.lanternNames.includes(resident) ? "lantern" : "events");

/** Failed texts, bounced emails, opt-outs this week, and families nobody can reach by text any more. */
export function automationProblems(slug: CommunitySlug): Problem[] {
  const x = ctxOf(slug);
  const s = x.s;
  const rows = logOf(slug).rows;
  const ppl = new Map(roster(slug).map((p) => [p.name, p]));
  const defs = new Map(defsOf(x).map((d) => [d.id, d]));
  const nm = (r: StaffRole) => s.people[roleKey(s, r)]?.name ?? "";
  const out: Problem[] = [];
  const todayIso = iso(today());
  const whenOf = (at: number) => {
    const off = Math.floor(at / DAY);
    return `${off === 0 ? "Today" : off === -1 ? "Yesterday" : dayName(addDays(fromIso(todayIso), off))}, ${fmtTime(((at % DAY) + DAY) % DAY)}`;
  };
  for (const r of rows) {
    const p = ppl.get(r.to);
    const owner: StaffRole = p?.kind === "prospect" || !r.resident ? "desk" : residentOwner(s, r.resident);
    const name = defs.get(r.auto)?.name ?? r.auto;
    if (r.status === "failed") {
      const landline = /Landline/.test(r.fail ?? "");
      out.push({
        id: `pb-${r.to}-${r.ch}`, kind: r.ch === "Email" ? "bounced" : "failed", who: r.to, rel: r.rel, resident: r.resident,
        title: r.ch === "Email" ? `Email bounced: ${r.to}` : `Text failed: ${r.to}`,
        detail: `${r.fail}. It was “${name}”. Kinlight won’t ${r.ch === "Email" ? "email that address" : "text that number"} again until it’s fixed.`,
        when: whenOf(r.at), at: r.at, owner, ownerName: nm(owner), action: landline ? "call" : "fix", phone: p?.phone, email: p?.email, auto: r.auto,
      });
    }
    if (r.status === "opted-out") {
      // Did that leave the family with no way to be reached by text?
      const res = r.resident;
      const others = res ? [...ppl.values()].filter((q) => q.kind === "family" && q.resident === res && q.name !== r.to && q.text) : [];
      const stillEmail = !!p?.mail;
      const nobody = p?.kind === "family" && others.length === 0 && !stillEmail;
      out.push({
        id: `pb-stop-${r.to}`, kind: nobody ? "unreachable" : "opted-out", who: r.to, rel: r.rel, resident: r.resident,
        title: nobody ? `${first(res)}’s family can’t be reached` : `${r.to} opted out of texts`,
        detail: nobody
          ? `${r.to} replied STOP to “${name}”. They were the only family member on file who takes texts, and has no email, so nobody can reach ${first(res)}’s family by text now. A call to check how they’d like to hear from us?`
          : `Replied STOP to “${name}”. Kinlight confirmed it and won’t text them again.${stillEmail ? " They still get email." : ""}`,
        // A family nobody can reach is an operations problem, not an activities one: it goes to the executive director.
        when: whenOf(r.reply?.at ?? r.at), at: r.reply?.at ?? r.at, owner: nobody ? "manager" : owner, ownerName: nm(nobody ? "manager" : owner), action: nobody ? "call" : "done", phone: p?.phone, email: p?.email, auto: r.auto,
      });
    }
  }
  return out.sort((a, b) => b.at - a.at);
}

/** Families nobody can reach by text any more, for the resident's owner's Today ("Can't reach"). */
export function unreachableFamilies(slug: CommunitySlug) {
  return automationProblems(slug).filter((p) => p.kind === "unreachable");
}

/* ------------------------------------------------------------ the next 24 hours */

export interface Upcoming { id: string; at: number; auto: string; n: number; what: string; note?: string }

/** What's due to send in the next 24 hours, so staff can catch a mistake before it goes. */
export function nextDay(slug: CommunitySlug, as: StaffRole = "manager"): Upcoming[] {
  const x = ctxOf(slug);
  const { s, c } = x;
  const t = today();
  const now = nowMinutes();
  const ch = choosers(slug);
  const ppl = new Map(roster(slug).map((p) => [p.name, p]));
  const out: Upcoming[] = [];
  const add = (u: Upcoming) => { if (u.at > now && u.at <= now + DAY && u.n > 0) out.push(u); };
  const textable = (names: string[]) => names.filter((n) => ppl.get(n)?.text).length;
  const evs = eventsAround(x, 0, 3);
  for (const e of evs.filter(residentOnly)) {
    if (e.cap) {
      const booked = textable(rsvpFor(s, e.id, e.taken ?? 0, e.waitlist ?? 0).going);
      const at = isTrip(e) ? (e.off - 1) * DAY + 16 * 60 : e.off * DAY + 8 * 60 + 30;
      add({ id: `up-rem-${e.id}`, at, auto: "e-remind", n: booked, what: `${booked} ${booked === 1 ? "reminder" : "reminders"} for ${shortTitle(e.title)}`, note: isTrip(e) ? `The ${dayName(fromIso(e.date))} trip: reminded the afternoon before` : undefined });
    }
  }
  // The nudge for tomorrow's invites nobody answered.
  const tomorrow = evs.filter((e) => residentOnly(e) && e.off === 2 && eventInterests(e).length).slice(0, 2);
  tomorrow.forEach((e) => add({ id: `up-nudge-${e.id}`, at: DAY + 10 * 60, auto: "e-nudge", n: 2 + (hash(e.id) % 4), what: `${2 + (hash(e.id) % 4)} reminders to residents who haven’t answered about ${shortTitle(e.title)}` }));
  const menuAt = now < 9 * 60 ? 9 * 60 : DAY + 9 * 60;
  const m = c.menuFor(x.main, addDays(t, menuAt >= DAY ? 1 : 0));
  add({ id: "up-menu", at: menuAt, auto: "n-menu", n: ch.menu.length, what: `${ch.menu.length} morning menu texts`, note: `${x.mainName}: ${m.special.name}` });
  const dr = diningRequests(slug);
  const tonight = dr.meals.find((mm) => mm.key === "tonight");
  if (tonight && now < 17 * 60 + 30 - 120) add({ id: "up-din", at: 15 * 60 + 30, auto: "d-booking", n: Math.round(tonight.booked / 3), what: `${Math.round(tonight.booked / 3)} dinner reminders, 2 hours before each table`, note: "Only people who booked by text" });
  const tmr = dr.meals.find((mm) => mm.key === "tomorrow-lunch");
  if (tmr) add({ id: "up-lunch", at: DAY + 9 * 60 + 30, auto: "d-booking", n: Math.round(tmr.booked / 3), what: `${Math.round(tmr.booked / 3)} lunch reminders, 2 hours before`, note: "Only people who booked by text" });
  for (const tour of s.tours.filter((tt) => tt.days === 1 || tt.days === 2)) {
    if (tour.days === 1) add({ id: `up-tour-${tour.who}`, at: 16 * 60, auto: "s-tour", n: 1, what: `Tour reminder to ${tour.who}`, note: `Tomorrow at ${fmtTime(tour.time)}` });
    if (tour.days === 2) add({ id: `up-tour-${tour.who}`, at: DAY + 16 * 60, auto: "s-tour", n: 1, what: `Tour reminder to ${tour.who}`, note: `${dayName(addDays(t, 2))} at ${fmtTime(tour.time)}` });
  }
  const wd = dow(t);
  if (wd === 2) add({ id: "up-mid", at: DAY + 10 * 60, auto: "n-midweek", n: ch.midweek.length, what: `${ch.midweek.length} midweek highlights to families` });
  if (wd === 6) add({ id: "up-week", at: DAY + 8 * 60, auto: "n-week", n: ch.week.length, what: `${ch.week.length} “Your week” texts to residents` });
  const owned = as === "manager" ? null : new Set(defsOf(x).filter((d) => d.owner === as).map((d) => d.id));
  return out.filter((u) => !owned || owned.has(u.auto)).sort((a, b) => a.at - b.at);
}

/* ------------------------------------------------------------ the record of changes */

export interface ChangeRecord { id: string; auto: string; by: string; at: string; did: "off" | "on" | "wording" | "rules" | "pause" | "resume" | "stopped"; reason?: string; note?: string }

/** Who switched what, when, and why: the earlier entries (this screen adds new ones as they happen). */
export function changeHistory(slug: CommunitySlug): ChangeRecord[] {
  const x = ctxOf(slug);
  const s = x.s;
  const t = today();
  const nm = (r: StaffRole) => s.people[roleKey(s, r)]?.name ?? "";
  const d = (n: number, min: number) => `${shortDate(addDays(t, -n))}, ${fmtTime(min)}`;
  return [
    { id: "h1", auto: "e-invite", by: nm("events"), at: d(0, 8 * 60 + 40), did: "wording", note: `Approved by ${first(nm("manager"))}` },
    { id: "h2", auto: "n-menu", by: nm("kitchen"), at: d(9, 15 * 60 + 5), did: "wording", note: `Approved by ${first(nm("manager"))}` },
    { id: "h3", auto: "d-swap", by: nm("kitchen"), at: d(16, 7 * 60 + 10), did: "on" },
    { id: "h4", auto: "d-swap", by: nm("kitchen"), at: d(17, 16 * 60 + 45), did: "off", reason: "New menu board went in; testing the swaps by hand for a day." },
    { id: "h5", auto: "e-nudge", by: nm("manager"), at: d(24, 9 * 60 + 30), did: "rules", note: "Daily limit set to 3 texts per person" },
    { id: "h6", auto: "", by: nm("manager"), at: d(31, 6 * 60 + 50), did: "resume", note: "Power back on; everything sending again" },
    { id: "h7", auto: "", by: nm("manager"), at: d(32, 19 * 60 + 15), did: "pause", reason: `Power cut across ${s.brand.city}. Pausing reminders until the kitchen and the lifts are back.` },
  ].map((r) => ({ ...r, did: r.did as ChangeRecord["did"] }));
}

/** The people who switch things, so the screen can say "Turned off by Rafael". */
export function areaOwners(slug: CommunitySlug): Record<StaffRole, string> {
  const s = getStaffData(slug);
  return Object.fromEntries((["manager", "events", "kitchen", "sales", "lantern", "desk", "caregiver"] as StaffRole[]).map((r) => [r, s.people[roleKey(s, r)]?.name ?? ""])) as Record<StaffRole, string>;
}

/** For an edit: the characters, and whether it splits. */
export const textCount = smsCount;
