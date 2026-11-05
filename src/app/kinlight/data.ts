// What Kinlight's own team watches across the alpha. Wrenhaven's two communities come from the real staff data;
// the other pilot organisations and their communities are invented for this example. Server only.
import { communities, communitySlugs, type CommunitySlug } from "@/data/communities";
import { getStaffData } from "@/data/staff";
import { adoption, promises, type PromiseStatus } from "@/data/staff/alpha";
import { addDays, hash, shortDate, today } from "@/lib/clock";

export const PROMISES = [
  { code: "D1", name: "Up and running in 30 days" },
  { code: "D2", name: "Nothing lost in the move" },
  { code: "D3", name: "Every community page shows real life" },
  { code: "D4", name: "One post reaches every channel (3+)" },
  { code: "D5", name: "Changes arrive fast (15 min)" },
  { code: "D6", name: "Messages arrive (95%+, in the family’s language)" },
  { code: "D7", name: "Nothing wrong goes out (zero sends without approval)" },
  { code: "D8", name: "No inquiry left waiting (instant reply, team told in 5 min)" },
  { code: "D9", name: "Easy to find (live facts, Google profile, monthly AI report)" },
  { code: "D10", name: "It stays up (99.5%)" },
  { code: "D11", name: "They can see it working (monthly scorecard, export tested)" },
];

export const ADOPTION = [
  { code: "T1", name: "Staff post weekly" },
  { code: "T2", name: "Training sticks" },
  { code: "T3", name: "Pages current" },
  { code: "T4", name: "Families reachable (60% / 70%)" },
  { code: "T5", name: "Families read it (50%)" },
  { code: "T6", name: "Opt-outs 5% or less" },
  { code: "T7", name: "Calendar time −50%" },
  { code: "T8", name: "15+ hours saved" },
];

export const ONBOARDING = [
  "Built beside the old site",
  "Content and contacts loaded",
  "Texting registered",
  "Staff trained",
  "Baselines taken",
  "Domain switched (day 0)",
];

export const ACCEPTANCE = [
  "Every old page address redirects; none broken",
  "Accessibility scan passed",
  "Calendar, menus and news current on every page",
  "Family contacts imported; opt-ins and languages confirmed",
  "Texting registered; test text received in each language",
  "Champion and at least 3 staff trained and posted once",
  "Baselines recorded (inquiries, tours, calendar hours, family survey)",
  "Inquiry auto-reply tested day and night",
  "Full data export tested",
];

export type Plan = "Full" | "Website-only";
export interface KCommunity {
  name: string;
  city: string;
  plan: Plan;
  /** Day of the 90-day alpha (day 0 = domain switched); negative while onboarding (days until go-live). */
  day: number;
  onboarded: number;
  champion: string;
  promises: PromiseStatus[];
  promiseNote?: string;
  adoption: boolean[];
  signed?: { by: string; date: string };
  blocker?: string;
  ai: { chatgpt: number; gemini: number; google: number; errors: number; latest?: string };
  uptime: number;
  p50: number;
  p95: number;
  incidents: number;
  move: { from: string; redirects: number; total: number; broken: number; a11y: string };
  real?: boolean;
}
export interface KOrg { name: string; region: string; fictional: boolean; champion: string; nextCall: number; communities: KCommunity[] }

const dateAt = (day: number) => shortDate(addDays(today(), -day));
export const switchDate = (day: number) => dateAt(day);

function wrenhaven(slug: CommunitySlug, day: number): KCommunity {
  const s = getStaffData(slug);
  const c = communities[slug];
  const ps = promises(slug);
  const eng = (k: string) => s.engines.find((e) => e.k === k)?.score ?? 0;
  const open = s.wrongFacts.filter((w) => w.status !== "fixed");
  const total = slug === "alder-bend" ? 214 : 187;
  const atRisk = ps.find((p) => p.status !== "Kept");
  return {
    name: c.site.name,
    city: `${c.site.address.city}, ${c.site.address.state}`,
    plan: "Full",
    day,
    onboarded: 6,
    champion: s.people[s.roles.calendar].name,
    promises: ps.map((p) => p.status),
    promiseNote: atRisk ? `${atRisk.code}: ${atRisk.evidence}` : undefined,
    adoption: adoption(slug).map((a) => a.ok),
    signed: { by: s.people[s.roles.approver].name, date: dateAt(day) },
    ai: { chatgpt: eng("ChatGPT"), gemini: eng("Gemini"), google: eng("Google AI Overviews"), errors: open.length, latest: open[0]?.claim },
    uptime: 99.98,
    p50: slug === "alder-bend" ? 182 : 197,
    p95: slug === "alder-bend" ? 410 : 446,
    incidents: 0,
    move: { from: "Old agency website", redirects: total, total, broken: 0, a11y: "Passed" },
    real: true,
  };
}

const K: PromiseStatus = "Kept";
const N: PromiseStatus = "Not due yet";

/** An invented community with plausible figures. `day` < 0 while onboarding. */
function made(name: string, city: string, day: number, opts: Partial<KCommunity> & { champion: string; from: string; signer?: string } ): KCommunity {
  const h = hash(name);
  const live = day >= 0;
  const promisesFor: PromiseStatus[] = live
    ? PROMISES.map((p) => (p.code === "D11" && day < 30 ? N : p.code === "D9" && day < 30 ? N : K))
    : PROMISES.map(() => N);
  const total = 90 + (h % 260);
  return {
    name,
    city,
    plan: opts.plan ?? "Full",
    day,
    onboarded: live ? 6 : opts.onboarded ?? 3,
    champion: opts.champion,
    promises: opts.promises ?? promisesFor,
    promiseNote: opts.promiseNote,
    adoption: live ? ADOPTION.map((_, i) => (day < 30 && (i === 6 || i === 7) ? true : (h >> i) % 9 !== 0)) : ADOPTION.map(() => false),
    signed: live ? { by: opts.signer ?? "Executive Director", date: dateAt(day) } : undefined,
    blocker: opts.blocker,
    ai: opts.ai ?? { chatgpt: 48 + (h % 30), gemini: 40 + ((h >> 3) % 28), google: 45 + ((h >> 5) % 30), errors: live ? (h % 3) : 2 + (h % 4), latest: undefined },
    uptime: opts.uptime ?? (live ? +(99.9 + (h % 10) / 100).toFixed(2) : 0),
    p50: 160 + (h % 90),
    p95: 380 + (h % 260),
    incidents: opts.incidents ?? 0,
    move: live
      ? { from: opts.from, redirects: total, total, broken: 0, a11y: "Passed" }
      : { from: opts.from, redirects: Math.round(total * Math.min(1, (opts.onboarded ?? 3) / 5)), total, broken: 0, a11y: (opts.onboarded ?? 3) >= 2 ? "2 issues to fix" : "Scheduled" },
  };
}

export function orgs(): KOrg[] {
  const [ab, kp] = communitySlugs;
  return [
    {
      name: "Wrenhaven Senior Living",
      region: "Calder County, California",
      fictional: false,
      champion: getStaffData(ab).people[getStaffData(ab).roles.calendar].name,
      nextCall: 3,
      communities: [wrenhaven(ab, 58), wrenhaven(kp, 54)],
    },
    {
      name: "Marrowbrook Senior Living",
      region: "Willamette Valley, Oregon",
      fictional: true,
      champion: "Dana Okafor",
      nextCall: 6,
      communities: [
        made("Marrowbrook at Ashby Creek", "Ashby Creek, OR", 71, { champion: "Dana Okafor", from: "WordPress (agency)", signer: "Lyle Brandt" }),
        made("Marrowbrook Linden Hollow", "Linden Hollow, OR", 69, { champion: "Rosa Kim", from: "WordPress (agency)", signer: "Lyle Brandt" }),
        made("Marrowbrook Copper Ridge", "Copper Ridge, OR", 66, {
          champion: "Theo Varga", from: "Wix", signer: "Anne Holt",
          promises: PROMISES.map((p) => (p.code === "D5" ? "Missed" : K)),
          promiseNote: "D5 missed: one menu change took 41 min on day 38 (cache purge failed). Nothing owed for this community.",
          incidents: 1,
        }),
        made("Marrowbrook Fennimore", "Fennimore, OR", 64, { champion: "Priscilla Dunn", from: "WordPress (agency)", signer: "Anne Holt" }),
        made("Marrowbrook Hartwell Green", "Hartwell Green, OR", 63, { champion: "Gus Albrecht", from: "Squarespace", plan: "Website-only", signer: "Lyle Brandt" }),
        made("Marrowbrook Saltmarsh Point", "Saltmarsh Point, OR", 62, {
          champion: "Ines Carvalho", from: "WordPress (agency)", signer: "Anne Holt",
          promises: PROMISES.map((p) => (p.code === "D9" ? "At risk" : K)),
          promiseNote: "D9 at risk: Google Business Profile still lists the old phone number; owner verification pending.",
        }),
        made("Marrowbrook Juniper Flats", "Juniper Flats, OR", 60, { champion: "Wes Tran", from: "Wix", signer: "Lyle Brandt" }),
      ],
    },
    {
      name: "Tidewell Communities",
      region: "Puget Sound, Washington",
      fictional: true,
      champion: "Mara Ellison",
      nextCall: 10,
      communities: [
        made("Tidewell Harbor Glen", "Harbor Glen, WA", 27, {
          champion: "Mara Ellison", from: "Corporate CMS", signer: "Owen Pruitt",
          promises: PROMISES.map((p) => (p.code === "D6" ? "At risk" : p.code === "D9" || p.code === "D11" ? N : K)),
          promiseNote: "D6 at risk: 93.8% delivered this week; one carrier filtering links. Short-link domain re-registered.",
        }),
        made("Tidewell Cedar Sound", "Cedar Sound, WA", 25, { champion: "Jonah Reyes", from: "Corporate CMS", signer: "Owen Pruitt" }),
        made("Tidewell Larch Bay", "Larch Bay, WA", 22, { champion: "Heidi Strom", from: "Corporate CMS", signer: "Owen Pruitt" }),
        made("Tidewell Orca Point", "Orca Point, WA", 20, { champion: "Sam Whitlow", from: "Corporate CMS", plan: "Website-only", signer: "Owen Pruitt" }),
        made("Tidewell Pinecrest", "Pinecrest, WA", 15, { champion: "Lena Moreau", from: "Corporate CMS", signer: "Owen Pruitt" }),
        made("Tidewell Driftwood", "Driftwood, WA", 12, { champion: "Carlos Mendes", from: "Corporate CMS", signer: "Owen Pruitt", uptime: 99.86, incidents: 1 }),
      ],
    },
    {
      name: "Ostara Lane Retirement",
      region: "Phoenix area, Arizona",
      fictional: true,
      champion: "Bea Lindqvist",
      nextCall: 1,
      communities: [
        made("Ostara Lane Mesquite Park", "Mesquite Park, AZ", -4, { champion: "Bea Lindqvist", from: "Old agency website", onboarded: 5, blocker: "Domain switch booked for Monday 6 am" }),
        made("Ostara Lane Saguaro Hills", "Saguaro Hills, AZ", -6, { champion: "Ray Duchamp", from: "Old agency website", onboarded: 4, blocker: "Baseline survey closes Friday" }),
        made("Ostara Lane Desert Willow", "Desert Willow, AZ", -11, { champion: "Kim Albers", from: "Old agency website", onboarded: 3, blocker: "Staff training on Thursday" }),
        made("Ostara Lane Agave Springs", "Agave Springs, AZ", -16, { champion: "Noor Haddad", from: "Old agency website", onboarded: 2, blocker: "Texting registration with carriers: 4–7 days" }),
        made("Ostara Lane Paloma Ridge", "Paloma Ridge, AZ", -22, { champion: "Felix Ortega", from: "Old agency website", onboarded: 1, plan: "Website-only", blocker: "Waiting for family contact export from the resident system" }),
      ],
    },
  ];
}

export interface Ticket { id: string; org: string; community: string; from: string; kind: "Feedback button" | "Bug" | "Question" | "Idea"; text: string; hoursAgo: number; status: "Open" | "Replied" | "Fixed" | "Planned" }

export function tickets(): Ticket[] {
  const ab = communities["alder-bend"].site.name;
  const kp = communities["kestrel-point"].site.name;
  const sab = getStaffData("alder-bend");
  const skp = getStaffData("kestrel-point");
  return [
    { id: "K-412", org: "Wrenhaven", community: ab, from: sab.people[sab.roles.menus].name, kind: "Feedback button", text: "Menu import from the PDF still needs a second look on soups.", hoursAgo: 5, status: "Open" },
    { id: "K-411", org: "Tidewell", community: "Harbor Glen", from: "Mara Ellison", kind: "Bug", text: "Two family texts showed a link preview without the photo.", hoursAgo: 9, status: "Open" },
    { id: "K-409", org: "Ostara Lane", community: "Agave Springs", from: "Noor Haddad", kind: "Question", text: "Can families choose texts only on weekends?", hoursAgo: 20, status: "Replied" },
    { id: "K-407", org: "Wrenhaven", community: kp, from: skp.people[skp.roles.calendar].name, kind: "Idea", text: "Let me copy last month’s recurring outings into the new month in one go.", hoursAgo: 31, status: "Planned" },
    { id: "K-405", org: "Marrowbrook", community: "Copper Ridge", from: "Theo Varga", kind: "Bug", text: "A menu change took 41 minutes to reach the website.", hoursAgo: 52, status: "Fixed" },
    { id: "K-401", org: "Marrowbrook", community: "Ashby Creek", from: "Dana Okafor", kind: "Feedback button", text: "Attendance tap list: put the residents who usually come at the top.", hoursAgo: 70, status: "Planned" },
    { id: "K-398", org: "Wrenhaven", community: ab, from: sab.people[sab.roles.approver].name, kind: "Question", text: "Who else can approve photos when I’m on vacation?", hoursAgo: 96, status: "Replied" },
  ];
}

/** Business hours left before the 2-business-day reply promise runs out (16 business hours). */
export const replyLeft = (hoursAgo: number) => Math.max(0, 16 - Math.round(hoursAgo * 0.4));

export function wrenhavenAnswers() {
  return communitySlugs.map((slug) => {
    const s = getStaffData(slug);
    return {
      name: communities[slug].site.name,
      wrong: s.wrongFacts.map((w) => ({ claim: w.claim, truth: w.truth, engines: w.engines.join(", "), status: w.status })),
    };
  });
}
