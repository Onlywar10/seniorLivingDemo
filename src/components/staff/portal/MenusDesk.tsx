"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import type { CourseKey, CycleDish } from "@/data/shared";
import type { DiningRequest, HolidayTally, MealTally, RequestRule } from "@/data/staff/dining";
import type { BoardVenue, ComingCheck, ComingWeek, HolidayMenu, MenuBoard, SubEntry } from "@/data/staff/menus";
import { menuSamples } from "@/data/staff/menuSamples";
import { dayName, fmtRange, fromIso, shortDate } from "@/lib/clock";
import { say } from "../store";
import { Badge } from "../ui";
import { DiningRequests } from "./DiningRequests";
import { Auto, Help } from "./Help";
import { MenuImport, type Applied, type SampleKey } from "./MenuImport";
import { MenuPreview } from "./MenuPreview";
import { SubLog, Served } from "./MenusRecord";
import { MealTimes, type CycleValue } from "./MenusCalendar";
import { MenusSetup, templateName } from "./MenusSetup";
import { RestaurantView } from "./MenusTemplates";
import { LiveToday, type LiveMenu } from "./MenusToday";

const dayOf = (isoDate: string) => dayName(fromIso(isoDate));
const short = (isoDate: string) => shortDate(fromIso(isoDate));
const isOpen = (answers: Record<string, string>) => (c: ComingCheck) => c.kind !== "holiday" && !answers[c.id];

/** The coming weeks as one restaurant sees them: next week always, later weeks only when something there is its own. */
function weeksFor(week: MenuBoard, key: string): ComingWeek[] {
  return week.coming
    .map((c) => ({ ...c, plan: c.plan.filter((p) => p.venue === key), checks: c.checks.filter((x) => x.venue === key) }))
    .filter((c, i) => i === 0 || c.checks.length > 0);
}

export interface Dining { requests: DiningRequest[]; meals: MealTally[]; holiday: HolidayTally; rules: RequestRule[]; bookedNow: Record<string, { name: string; who: string }[]>; chef: string }
type Signal = "check" | "menu" | "preview" | "requests";
/** What each restaurant lets the page do to it: take an import, or jump to what needs doing. */
interface RoomHandle { apply: (a: Applied, summary: string) => void; go: (what: Signal) => void }
type Register = (key: string, h: RoomHandle) => void;

/**
 * The kitchen's menus. At the top, one line per restaurant: how its kitchen plans, today's status, next week's status
 * and the one thing to do; "Bring in a menu" takes any file the kitchen has. Below, the chosen restaurant: today (and
 * "we're out of something"), its menu edited in place with "Preview as" beside it, what to check next week, dining
 * requests by text, the record of what was served, and holiday and theme menus (nothing public until approved).
 * The front desk (`requestsOnly`) sees dining requests only.
 */
export function MenusDesk({ week, dining, room, start, canEdit, isApprover, requestsOnly, me, diningHref, homeHref }: {
  week: MenuBoard; dining: Dining; room?: string; start?: string; canEdit: boolean; isApprover: boolean; requestsOnly?: boolean; me: string; diningHref: string; homeHref: string;
}) {
  // The chosen restaurant is kept in the address (?room=millpond), so a link or a reload opens the same one.
  const [vi, setVi] = useState(() => Math.max(0, week.venues.findIndex((v) => v.venue.key === room)));
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState<SampleKey | "open" | null>(() => (start === "import" ? "open" : start && ["juniper", "millpond", "perch", "thanksgiving"].includes(start) ? (start as SampleKey) : null));
  const handles = useRef<Record<string, RoomHandle>>({});
  const register = useCallback<Register>((key, h) => { handles.current[key] = h; }, []);
  // Open checks per restaurant, reported by each restaurant, for "next week" on its line.
  const [left, setLeft] = useState<Record<string, number>>(() => Object.fromEntries(week.venues.map((v) => [v.venue.key, week.nextStatus[v.venue.key]?.checks ?? 0])));
  const pick = (i: number) => {
    setVi(i);
    const u = new URL(window.location.href);
    u.searchParams.set("room", week.venues[i].venue.key);
    window.history.replaceState(null, "", u);
  };
  const go = (i: number, what: Signal) => {
    pick(i);
    handles.current[week.venues[i].venue.key]?.go(what);
  };
  const example = week.venues.find((v) => v.template === "cycle") ?? week.venues[0];
  const venues = week.venues.map((v) => ({ key: v.venue.key, name: v.venue.name }));

  if (requestsOnly) {
    return (
      <div className="mn">
        <p className="sx-note" style={{ marginTop: 0 }}><Icon name="info" /> {week.chef} looks after the menus. Dining requests by text come here for you and the kitchen.</p>
        <DiningRequests requests={dining.requests} meals={dining.meals} holiday={dining.holiday} rules={dining.rules} venueName="All restaurants" canAct chefFirst={week.chefFirst} />
      </div>
    );
  }

  return (
    <div className="mn">
      {/* ------------------------------------------------------------ every restaurant, one line each */}
      <section className="sx-card mn-pick" aria-labelledby="mn-pick-h">
        <header className="sx-card-head">
          <div>
            <h2 id="mn-pick-h">Your restaurants
              <Help label="About restaurants and how they plan">
                <p>Each restaurant follows how its kitchen already plans: a <b>cycle menu</b> that rolls forward each week, an <b>always-available</b> menu with a daily special, or <b>daily specials</b> filled each morning.</p>
                <p>Kinlight never makes up a dish, a price or a tag. Everything comes from what the kitchen gives it.</p>
              </Help>
            </h2>
            <p>{week.publishedAhead} · a week ahead, as Title 22 asks</p>
          </div>
          <span className="pt-act" style={{ margin: 0 }}>
            {canEdit && !importing && <button type="button" className="sx-btn sx-btn-terra" onClick={() => setImporting("open")}><Icon name="upload" /> Bring in a menu</button>}
            {canEdit && !adding && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAdding(true)}><Icon name="plus" /> Add a restaurant</button>}
          </span>
        </header>
        <div className="sx-card-body">
          <div className="mn-lines" role="tablist" aria-label="Restaurant">
            {week.venues.map((x, i) => {
              const n = left[x.venue.key] ?? 0;
              const daily = x.template === "daily";
              const next = daily ? { label: "Filled each morning", tone: "info" as const } : n ? { label: `${n} to check`, tone: "warn" as const } : { label: "Ready", tone: "good" as const };
              const action = n ? { label: `Check ${n}`, what: "check" as const } : daily ? { label: "Fill today’s board", what: "menu" as const } : x.template === "standing" ? { label: "Add a special", what: "menu" as const } : { label: "Preview next week", what: "preview" as const };
              return (
                <div key={x.venue.key} className={`mn-line${vi === i ? " on" : ""}`}>
                  <button type="button" role="tab" id={`mn-tab-${x.venue.key}`} aria-controls={`mn-room-${x.venue.key}`} aria-selected={vi === i} tabIndex={vi === i ? 0 : -1} className="mn-line-t"
                    onClick={() => pick(i)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                      e.preventDefault();
                      const m = (i + (e.key === "ArrowDown" ? 1 : week.venues.length - 1)) % week.venues.length;
                      pick(m);
                      document.getElementById(`mn-tab-${week.venues[m].venue.key}`)?.focus();
                    }}>
                    <span className="mn-line-n"><Icon name={x.bar ? "coffee" : "fork"} /> <b>{x.venue.name}</b></span>
                    <span className="mn-line-p">{templateName(x.template)}{x.template === "standing" && x.slots?.length ? " + daily special" : ""} · {x.line.replace(/^.*?· /, "")}</span>
                  </button>
                  <span className="mn-line-s"><small>Today</small><span className="mn-livebadge"><span className="mn-dot" aria-hidden="true" /> Live</span></span>
                  <span className="mn-line-s"><small>Next week</small><Badge tone={next.tone}>{next.label}</Badge></span>
                  {canEdit ? <button type="button" className={`sx-btn sx-btn-sm${n ? " sx-btn-primary" : ""}`} onClick={() => go(i, action.what)}>{action.label}</button> : <span />}
                </div>
              );
            })}
          </div>
          {adding && <MenusSetup key="new" example={example} chefFirst={week.chefFirst} canEdit={canEdit} todayIso={week.live.date} onClose={() => setAdding(false)} />}
        </div>
      </section>

      {importing && !canEdit && (
        <div className="sx-callout info" role="status"><Icon name="info" /><p>Menus are {week.chef}’s. Your file has been sent to {week.chefFirst} to bring in.</p></div>
      )}
      {importing && canEdit && (
        <MenuImport
          venues={venues}
          start={importing === "open" ? undefined : importing}
          onClose={() => setImporting(null)}
          onApply={(applied, summary) => {
            const i = week.venues.findIndex((v) => v.venue.key === applied.venue);
            if (i >= 0) pick(i);
            handles.current[applied.venue]?.apply(applied, summary);
          }}
        />
      )}

      {/* ------------------------------------------------------------ that restaurant: every one stays mounted, so its changes are kept */}
      {week.venues.map((v, i) => (
        <Room
          key={v.venue.key}
          hidden={vi !== i}
          week={week}
          v={v}
          dining={dining}
          canEdit={canEdit}
          isApprover={isApprover}
          me={me}
          diningHref={diningHref}
          homeHref={homeHref}
          onLeft={setLeft}
          register={register}
          startOut={start === "out" && i === vi}
          startAt={i === vi && start === "requests" ? "requests" : undefined}
          onImport={(k) => setImporting(k)}
        />
      ))}

      {/* ------------------------------------------------------------ beta */}
      <section className="sx-card mn-beta" aria-labelledby="mn-beta">
        <header className="sx-card-head">
          <div>
            <h2 id="mn-beta">Coming next <Help label="About what’s coming" align="end">
              <p>Menus straight from the dining system the kitchen already plans in (MealSuite, eMenuCHOICE and similar), so cycles and specials don’t need bringing in. Learning a cycle from one week’s uploads at a time. Until then, a whole cycle brought in once carries every week.</p>
              <p>Today’s menus on the lobby TVs and in-room TV, to-go and tray orders by text, and private dining room bookings.</p>
            </Help></h2>
          </div>
          <Badge tone="info">Coming in Beta</Badge>
        </header>
        <div className="sx-card-body">
          <ul className="mn-beta-l">
            <li>Menus from your dining system</li>
            <li>Learning a cycle from weekly uploads</li>
            <li>Menu boards and in-room TV</li>
            <li>To-go and tray orders, private dining</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

type SetLeft = (f: (l: Record<string, number>) => Record<string, number>) => void;
type Hol = HolidayMenu & { back?: boolean; replaces?: string };

/** Everything on the Menus page for one restaurant, with its own menu, answers, swaps, requests and special menus. */
function Room({ hidden, week, v, dining, canEdit, isApprover, me, diningHref, homeHref, onLeft, register, startOut, startAt, onImport }: {
  hidden: boolean; week: MenuBoard; v: BoardVenue; dining: Dining; canEdit: boolean; isApprover: boolean; me: string; diningHref: string; homeHref: string; onLeft: SetLeft;
  register: Register; startOut?: boolean; startAt?: Signal; onImport: (k: SampleKey | "open") => void;
}) {
  const k = v.venue.key;
  const todayIso = week.live.date;
  const weeks = useMemo(() => weeksFor(week, k), [week, k]);
  const live = useMemo(() => ({ ...week, live: { ...week.live, menus: week.live.menus.filter((m) => m.venue.key === k) } }), [week, k]);

  // The restaurant's menu as it stands: edited in place, read by the preview, changed by imports.
  const [cycle, setCycle] = useState<CycleValue>({ days: v.cycle?.days ?? [], once: {} });
  const [standing, setStanding] = useState(v.standing);
  const [daily, setDaily] = useState(v.daily);
  const [source, setSource] = useState<string>();
  const [liveMenu, setLiveMenu] = useState<LiveMenu>();
  const onMenus = useCallback((m: LiveMenu[]) => setLiveMenu(m[0]), []);
  const [lastImport, setLastImport] = useState<string>();
  const [preview, setPreview] = useState(false);

  const [todaySubs, setTodaySubs] = useState<SubEntry[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [blocked, setBlocked] = useState(false);
  const [wk, setWk] = useState(0);
  const [oneOff, setOneOff] = useState<Record<string, string>>({});
  const [setup, setSetup] = useState(false);
  const [hol, setHol] = useState<Hol[]>(() => week.holidays.filter((h) => h.venue === k));
  const [adding, setAdding] = useState(false);
  const [newSpecial, setNewSpecial] = useState({ name: "", date: "", kind: "holiday" as "holiday" | "theme" });
  const [hours, setHours] = useState(v.venue.hours);
  const [meals, setMeals] = useState(v.meals);
  const mealLine = meals.map((p) => `${p.label} ${fmtRange(p.start, p.end)}`).join(" · ");
  const [hourDraft, setHourDraft] = useState<string | null>(null);

  const cw = weeks[Math.min(wk, weeks.length - 1)];
  const open = isOpen(answers);
  const leftIn = (c: ComingWeek) => c.checks.filter(open).length;
  const left = leftIn(cw);
  // Next week's open checks, for the line at the top (later weeks show in their own tab here).
  const nextLeft = weeks[0] ? leftIn(weeks[0]) : 0;
  useEffect(() => { onLeft((l) => (l[k] === nextLeft ? l : { ...l, [k]: nextLeft })); }, [nextLeft, k, onLeft]);
  const held = Object.fromEntries(Object.entries(answers).filter(([x]) => x.startsWith("tags-")).map(([x, a]) => [x.slice(5), a]));
  const holidays = Object.fromEntries(hol.filter((h) => h.status === "approved").map((h) => [h.date, h.name]));
  const subs = [...todaySubs, ...week.subs.filter((s) => s.venue === k)];
  const served = week.served.map((d) => ({ ...d, menus: d.menus.filter((m) => m.venue === k), changes: week.subs.filter((s) => s.venue === k && s.date === d.date).length }));
  const requests = dining.requests.filter((r) => r.venue === k);
  const reqMeals = dining.meals.filter((m) => m.venue === k);

  // From the line at the top: jump to what needs doing.
  const go = (what: Signal) => {
    if (what === "preview") setPreview(true);
    const id = what === "preview" ? `mp-h-${k}` : what === "check" ? `mn-coming-${k}` : what === "requests" ? `dr-h-${v.venue.name}` : `mn-rest-${k}`;
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  // An import confirmed in "Bring in a menu" lands here.
  const apply = (a: Applied, summary: string) => {
    setLastImport(summary);
    if (a.kind === "cycle-week") {
      setSource(menuSamples.juniper.file);
      setCycle((c) => ({
        ...c,
        days: c.days.map((wkDays, w) => (w !== a.week ? wkDays : wkDays.map((day, d) => {
          const ch = a.days[d];
          if (!ch) return day;
          return day.map((m) => {
            const courses = { ...m.courses };
            const set = (key: CourseKey, x?: { name: string; desc?: string; tags?: CycleDish["tags"] }) => { if (x) courses[key] = { ...x, plain: x.name }; };
            if (/lunch/i.test(m.period) && ch.lunch) set("entree", { name: ch.lunch });
            if (/dinner/i.test(m.period) && ch.dinner) set("entree", ch.dinner);
            if (ch.soup === null) delete courses.soup;
            return { ...m, courses };
          });
        }))),
      }));
    } else if (a.kind === "standing") {
      setStanding(a.sections);
    } else if (a.kind === "daily") {
      setDaily((ds) => ds.map((d) => (d.date === todayIso ? { ...d, values: a.values } : d)));
    } else {
      setHol((h) => [{ ...h.find((x) => x.date === a.date && x.kind === "holiday")!, id: `upd-${Date.now()}`, status: "waiting", approved: undefined, announced: undefined, booking: a.booking, items: a.items, sent: "Just now", by: me, replaces: "the approved version stays up until then" }, ...h]);
    }
  };
  useEffect(() => { register(k, { apply, go }); });
  // Opened from Today ("2 to answer", "We're out of something"): go straight there.
  useEffect(() => {
    const id = startAt === "requests" ? `dr-h-${v.venue.name}` : startOut ? `mn-live-${k}` : null;
    if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 300);
  }, [startAt, startOut, k, v.venue.name]);

  const answer = (c: ComingCheck, a: string) => {
    const before = answers;
    const next = { ...answers, [c.id]: a };
    setAnswers(next);
    const rest = cw.checks.filter(isOpen(next)).length;
    say(`${a} · ${rest === 0 ? `nothing left to check for ${v.venue.name}` : `${rest} left to check`}`, () => setAnswers(before));
  };
  const reopen = (id: string) => {
    setAnswers((a) => { const n = { ...a }; delete n[id]; return n; });
    setConfirmed((x) => ({ ...x, [cw.key]: false }));
  };
  const confirm = () => {
    if (left > 0) { setBlocked(true); return; }
    setConfirmed((x) => ({ ...x, [cw.key]: true }));
    say(`${v.venue.name} confirmed · ${cw.key === "next" ? "next week" : cw.tab} goes up each morning at 5 am from ${dayOf(cw.dates[0])}`, () => setConfirmed((x) => ({ ...x, [cw.key]: false })));
  };
  const onOneOff = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setOneOff((x) => ({ ...x, [cw.key]: f.name }));
    say(`Read ${f.name}. It replaces ${v.venue.name}’s menu for ${cw.range} only`, () => setOneOff((x) => { const n = { ...x }; delete n[cw.key]; return n; }));
    e.target.value = "";
  };
  const saveHours = () => {
    const h = hourDraft?.trim();
    if (!h) return;
    const before = hours;
    setHours(h);
    setHourDraft(null);
    say(`${v.venue.name} hours saved. The website and menu cards show them now`, () => setHours(before));
  };
  const holOf = (id?: string) => hol.find((h) => h.id === id);
  const approve = (id: string) => setHol((x) => x.map((y) => (y.id === id ? { ...y, status: "approved", back: false, approved: `${week.approverFirst} approved just now`, announced: ["Website dining page", "Sunday newsletter", `Text to ${week.textOptIns} opted-in residents and families`] } : y)));

  return (
    <div className="mn-room" id={`mn-room-${k}`} role="tabpanel" aria-labelledby={`mn-tab-${k}`} hidden={hidden}>
      {/* ------------------------------------------------------------ the restaurant itself */}
      <section className="sx-card mn-room-h" aria-label={`${v.venue.name}: how it runs`}>
        <div className="sx-card-body">
          <div className="mn-room-id">
            <h2><Icon name={v.bar ? "coffee" : "fork"} /> {v.venue.name}</h2>
            <Badge tone={v.template === "cycle" ? "info" : v.template === "daily" ? "accent" : "neutral"}>{templateName(v.template)}{v.template === "standing" && v.slots?.length ? " + daily special" : ""}</Badge>
          </div>
          <p className="mn-room-l">{v.line}</p>
          <p className="mn-room-c"><Icon name="check" /> {v.carry}</p>
          {v.cycle && (
            <p className="mn-room-c"><Icon name="calendar" /> {v.cycle.season} cycle ends {v.cycle.endsLabel}. <b>{v.cycle.nextSeason} cycle due by {v.cycle.dueLabel}</b>: Kinlight reminds {week.chefFirst} on {v.cycle.reminders.join(" and ")}.</p>
          )}
          <MealTimes name={v.venue.name} periods={meals} canEdit={canEdit} onChange={setMeals} />
          <div className="mn-room-f">
            {hourDraft !== null ? (
              <form className="mn-hour-f" onSubmit={(e) => { e.preventDefault(); saveHours(); }}>
                <label><span className="vh">Hours for {v.venue.name}</span><input className="sx-input" value={hourDraft} autoFocus onChange={(e) => setHourDraft(e.target.value)} /></label>
                <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!hourDraft.trim()}>Save</button>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setHourDraft(null)}>Cancel</button>
              </form>
            ) : (
              <span className="mn-hour-v">
                <Icon name="building" /> Open {hours}
                {canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setHourDraft(hours)} aria-label={`Change ${v.venue.name} hours`}><Icon name="edit" /> Hours</button>}
              </span>
            )}
            <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-expanded={setup} onClick={() => setSetup((s) => !s)}>How it’s set up</button>
          </div>
          {setup && <MenusSetup key={k} sample={v} chefFirst={week.chefFirst} canEdit={canEdit} todayIso={todayIso} onClose={() => setSetup(false)} />}
        </div>
      </section>

      {/* ------------------------------------------------------------ live now, and "we're out of something" */}
      <LiveToday week={live} times={mealLine} canEdit={canEdit} me={me} diningHref={diningHref} homeHref={homeHref} booked={dining.bookedNow[k]} onMenus={onMenus} startOut={startOut}
        onLog={(e) => setTodaySubs((x) => (e ? [e, ...x] : x.slice(1)))} />

      {/* ------------------------------------------------------------ the menu, the way this kitchen plans it */}
      <section className="sx-card" aria-labelledby={`mn-rest-${k}`}>
        <header className="sx-card-head">
          <div>
            <h2 id={`mn-rest-${k}`}>{v.venue.name} menu</h2>
            <p>{canEdit ? "Click any dish to change it: name, description, tags or category." : "Built from what the kitchen sent."}{lastImport ? ` Last brought in: ${lastImport}.` : ""}</p>
          </div>
          <span className="pt-act" style={{ margin: 0 }}>
            <button type="button" className="sx-btn sx-btn-sm" aria-expanded={preview} onClick={() => setPreview((p) => !p)}><Icon name="eye" /> Preview as…</button>
            {canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => onImport(v.template === "cycle" ? "juniper" : v.template === "daily" ? "perch" : "millpond")}><Icon name="upload" /> Bring in</button>}
            {!canEdit && <Badge>View only</Badge>}
          </span>
        </header>
        <div className="sx-card-body">
          <RestaurantView v={v} meals={meals} todayIso={todayIso} canEdit={canEdit} me={me} chefFirst={week.chefFirst} held={held} holidays={holidays}
            store={{ cycle, setCycle, standing, setStanding, daily, setDaily, source }} />
        </div>
      </section>

      {preview && (
        <MenuPreview v={v} meals={meals} cycle={cycle} standing={standing} daily={daily} live={liveMenu} holidays={hol} todayIso={todayIso} community={week.community} optIns={week.textOptIns} onClose={() => setPreview(false)} />
      )}

      {/* ------------------------------------------------------------ coming up */}
      <section className="sx-card" aria-labelledby={`mn-coming-${k}`}>
        <header className="sx-card-head">
          <div>
            <h2 id={`mn-coming-${k}`}>Coming up · {cw.range}
              <Help label="How the week is filled">
                <p>Already filled from {v.venue.name}’s menu. You only see what differs: a holiday, a swap, something out of stock, a tag that doesn’t match a dish, or anything Kinlight wasn’t sure of.</p>
                <p>Menus are published a week ahead, as California’s Title 22 asks.</p>
              </Help>
            </h2>
            {!canEdit && <p>{week.chef} checks it before {week.sendsBy}</p>}
          </div>
          {confirmed[cw.key] ? <Badge tone="good"><Icon name="check" /> Confirmed</Badge> : left === 0 ? <Badge tone="good"><Icon name="check" /> Nothing to check</Badge> : <Badge tone="warn">{left} to check</Badge>}
        </header>
        <div className="sx-card-body mn-check">
          {weeks.length > 1 && (
            <div className="sx-tabs" role="tablist" aria-label="Which week">
              {weeks.map((c, i) => (
                <button key={c.key} role="tab" aria-selected={cw.key === c.key} onClick={() => { setWk(i); setBlocked(false); }}>
                  {c.tab} <small className="mn-tabn">{c.range}{leftIn(c) ? ` · ${leftIn(c)} to check` : ""}</small>
                </button>
              ))}
            </div>
          )}

          <ul className="mn-plan" aria-label="Filled already">
            {cw.plan.map((p) => <li key={p.venue}><Icon name="check" /><span>{p.line.charAt(0).toUpperCase() + p.line.slice(1)}</span></li>)}
            {oneOff[cw.key] && <li><Icon name="upload" /><span><b>One-off menu</b> {oneOff[cw.key]} replaces the menu for these days</span></li>}
          </ul>

          {blocked && left > 0 && <div className="sx-callout" role="alert"><Icon name="alert" /><p>Answer {left === 1 ? "this one" : `these ${left}`} first, then confirm.</p></div>}

          {cw.checks.length > 0 && (
            <ul className="mn-flags">
              {cw.checks.map((c) => {
                const a = answers[c.id];
                const h = holOf(c.holiday);
                return (
                  <li key={c.id} className={a || (c.kind === "holiday" && h?.status === "approved") ? "done" : c.kind === "holiday" ? "info" : ""}>
                    <div>
                      <b>{c.title}</b>
                      <span>{c.date ? `${dayOf(c.date)}, ${short(c.date)}` : "Every day"}</span>
                      <small>{c.detail}</small>
                    </div>
                    {c.kind === "holiday" ? (
                      <p className="mn-ask">
                        {h?.status === "approved" ? <><Icon name="check" /> {h.approved ?? `Approved by ${week.approverFirst}`}</> : h?.back ? <><Icon name="alert" /> Sent back to {week.chefFirst}</> : <><Icon name="clock" /> Waiting for {week.approverFirst} in <a className="sx-link" href={`#mn-hol-${k}`}>Holiday and theme menus</a></>}
                      </p>
                    ) : a ? (
                      <p className="mn-ok"><Icon name="check" /> {a}{canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => reopen(c.id)}>Change</button>}</p>
                    ) : canEdit ? (
                      <div className="mn-choose" role="group" aria-label={c.title}>
                        {c.options.map((o) => <button key={o.label} type="button" className="sx-btn" onClick={() => answer(c, o.answer)}>{o.label}</button>)}
                        {c.other && (
                          <form className="mn-soup" onSubmit={(e) => { e.preventDefault(); if (drafts[c.id]?.trim()) answer(c, drafts[c.id].trim()); }}>
                            <label><span className="vh">{c.other}</span><input className="sx-input" value={drafts[c.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))} placeholder={c.other} /></label>
                            <button type="submit" className="sx-btn" disabled={!drafts[c.id]?.trim()}>Save</button>
                          </form>
                        )}
                      </div>
                    ) : (
                      <p className="mn-ask"><Icon name="lock" /> {week.chefFirst} answers this here with one tap. You can see it, not change it.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mn-pub">
            {canEdit ? (
              confirmed[cw.key] ? (
                <div className="sx-callout good" role="status"><Icon name="check" /><p>{v.venue.name} confirmed by {me}. Each day goes up at 5 am, starting {dayOf(cw.dates[0])}, {short(cw.dates[0])}.</p></div>
              ) : (
                <div className="mn-go">
                  <button type="button" className="sx-btn sx-btn-terra sx-btn-lg" disabled={left > 0} onClick={confirm}><Icon name="check" /> Confirm {cw.key === "next" ? "next week" : cw.tab}</button>
                  <p>{left > 0 ? `Answer the ${left === 1 ? "one check" : `${left} checks`} above first.` : `Nothing else to do. Each day goes out at 5:00 am to the website, the cards and ${week.textOptIns} opted-in texts.`}</p>
                </div>
              )
            ) : (
              <p className="sx-note" style={{ marginTop: 0 }}>{confirmed[cw.key] ? "Confirmed. Each day’s menu goes up at 5 am." : `${week.chef} confirms it before ${week.sendsBy}. If nothing needs checking, it goes up on its own.`}</p>
            )}
            <Auto summary="Then automatically: website, texts, newsletter and print">
              <ul>
                <li><b>Website:</b> the dining page and every community page show {v.venue.name}’s menu each day at 5:00 am, dietary tags spelled out, with “Always available: ask your server”.</li>
                <li><b>Texts:</b> the morning menu to the {week.textOptIns} residents and families who opted in, and answers to “What’s for lunch?”.</li>
                <li><b>Newsletter:</b> Sunday’s issue carries the week’s highlights and the next holiday or theme meal.</li>
                <li><b>Print:</b> a large-print card for each day, the weekly sheet and the monthly dining calendar.</li>
                <li><b>Records:</b> a dated copy of what was served, kept 30 days.</li>
              </ul>
            </Auto>
            {canEdit && (
              <label className="sx-btn sx-btn-sm sx-btn-quiet mn-oneoff">
                <Icon name="upload" /> Upload a one-off menu for these days
                <input type="file" accept=".pdf,.doc,.docx,image/*" className="vh" onChange={onOneOff} />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ dining requests by text */}
      {(requests.length > 0 || reqMeals.length > 0) && (
        <DiningRequests requests={requests} meals={reqMeals} holiday={dining.holiday.venue === k ? dining.holiday : undefined} rules={dining.rules} venueName={v.venue.name} canAct={canEdit} chefFirst={week.chefFirst} />
      )}

      {/* ------------------------------------------------------------ holiday and theme menus: nothing public until approved */}
      <section className="sx-card" id={`mn-hol-${k}`} aria-labelledby={`mn-hol-h-${k}`}>
        <header className="sx-card-head">
          <div>
            <h2 id={`mn-hol-h-${k}`}>Holiday and theme menus <Help label="About holiday and theme menus"><p>A holiday menu replaces the day; a theme night replaces one meal. Each goes to {week.approver} first, and nothing appears on any public page until it’s approved.</p><p>Once approved, Kinlight announces it on the website, in the Sunday newsletter and by text to everyone who opted in, with booking by text reply.</p></Help></h2>
            <p>Approved by {week.approverFirst} before anything goes public</p>
          </div>
          {canEdit && !adding && (
            <span className="pt-act" style={{ margin: 0 }}>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => onImport("thanksgiving")}><Icon name="upload" /> Import one</button>
              <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAdding(true)}><Icon name="plus" /> Build one</button>
            </span>
          )}
        </header>
        <div className="sx-card-body">
          {adding && (
            <form className="sx-form mn-add" onSubmit={(e) => {
              e.preventDefault();
              if (!newSpecial.name.trim() || !newSpecial.date) return;
              setHol((h) => [...h, { id: `new-${k}-${h.length}`, kind: newSpecial.kind, status: "waiting", venue: k, venueName: v.venue.name, date: newSpecial.date, label: `${dayOf(newSpecial.date).slice(0, 3)}, ${short(newSpecial.date)}`, name: newSpecial.name.trim(), items: [], by: me, sent: "Just now" }]);
              setNewSpecial({ name: "", date: "", kind: "holiday" });
              setAdding(false);
              say(`Sent to ${week.approverFirst}. Nothing goes public until she approves`);
            }}>
              <label>What it is<input value={newSpecial.name} onChange={(e) => setNewSpecial((n) => ({ ...n, name: e.target.value }))} placeholder="Christmas Day brunch" /></label>
              <div className="sx-row">
                <label>Day<input type="date" value={newSpecial.date} onChange={(e) => setNewSpecial((n) => ({ ...n, date: e.target.value }))} /></label>
                <label>It replaces<select value={newSpecial.kind} onChange={(e) => setNewSpecial((n) => ({ ...n, kind: e.target.value as "holiday" | "theme" }))}><option value="holiday">The whole day (holiday)</option><option value="theme">One meal (theme night)</option></select></label>
              </div>
              <p className="pt-act"><button type="submit" className="sx-btn sx-btn-primary"><Icon name="send" /> Send to {week.approverFirst}</button><button type="button" className="sx-btn" onClick={() => setAdding(false)}>Cancel</button></p>
            </form>
          )}
          {hol.length === 0 && !adding && <p className="sx-note" style={{ marginTop: 0 }}>No holiday or theme menus at {v.venue.name} coming up.</p>}
          <ul className="mn-hols">
            {hol.map((h) => (
              <li key={h.id} className={h.status === "approved" ? "ok" : ""}>
                <div>
                  <b>{h.name} <small className="mn-kind">{h.kind === "theme" ? "Theme night" : "Holiday menu"}</small></b>
                  <span>{h.label}{h.hours ? ` · ${h.hours}` : ""}</span>
                  {h.items.length > 0 && <small>{h.items.join(" · ")}</small>}
                  {h.booking && <small><Icon name="sms" /> {h.booking}</small>}
                  <small>Sent by {h.by}, {h.sent === "Just now" ? "just now" : h.sent}{h.replaces ? ` · ${h.replaces}` : ""}</small>
                  {h.status === "approved" && h.announced && <small className="mn-ann"><Icon name="check" /> Announced: {h.announced.join(" · ")}</small>}
                  {h.status !== "approved" && <small className="mn-ann off"><Icon name="lock" /> Not on any public page until it’s approved</small>}
                </div>
                {h.status === "approved" ? (
                  <Badge tone="good"><Icon name="check" /> {h.approved ?? "Approved"}</Badge>
                ) : h.back ? (
                  <Badge tone="warn">Sent back to {week.chefFirst}</Badge>
                ) : isApprover ? (
                  <span className="pt-act">
                    <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => { approve(h.id); say(`${h.name} approved: announced on the website, in the newsletter and by text`); }}><Icon name="check" /> Approve</button>
                    <button type="button" className="sx-btn sx-btn-sm" onClick={() => setHol((x) => x.map((y) => (y.id === h.id ? { ...y, back: true } : y)))}>Send back</button>
                  </span>
                ) : (
                  <Badge tone="warn">Waiting for {week.approverFirst}</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ the record */}
      <div className="sx-grid g-2">
        <SubLog entries={subs} />
        <Served days={served} today={todaySubs} />
      </div>
      <p className="mn-quiet"><Icon name="check" /> {week.publishedAhead}, a week ahead.</p>
    </div>
  );
}
