"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Icon } from "@/components/Icon";
import { courseLabels, tagLabels, type CourseKey, type CycleDish, type CycleMeal, type Dish, type MealPeriod, type Tag } from "@/data/shared";
import { addDays, dayName, dow, fmtRange, fromIso, iso, shortDate } from "@/lib/clock";
import { say } from "../store";

const TAGS: Tag[] = ["GF", "VG", "DF"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const spell = (tags?: Tag[]) => (tags ?? []).map((t) => tagLabels[t]).join(" · ");

/** The courses each meal is planned with, as dining programs write them: breakfast is lighter, dinner has every course. */
export function coursesFor(period: string): CourseKey[] {
  if (/breakfast|morning|brunch/i.test(period)) return ["entree", "alternate", "starch"];
  if (/lunch/i.test(period)) return ["entree", "alternate", "soup", "dessert"];
  return ["entree", "alternate", "starch", "vegetable", "soup", "dessert"];
}
/** Minutes from midnight ⇄ "HH:MM" for time inputs. */
export const toHM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export const fromHM = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };

/** Name, description and dietary tags for one dish: the fields every menu editor shares. */
export function DishFields({ label, dish, onChange, autoFocus, plain }: { label: string; dish: Dish & { plain?: string }; onChange: (d: Dish & { plain?: string }) => void; autoFocus?: boolean; plain?: boolean }) {
  const tags = dish.tags ?? [];
  return (
    <fieldset className="mn-df">
      <legend>{label}</legend>
      <label><span className="vh">{label}: name</span><input value={dish.name} autoFocus={autoFocus} placeholder="Dish name" onChange={(e) => onChange({ ...dish, name: e.target.value })} /></label>
      <label><span className="vh">{label}: description</span><input value={dish.desc ?? ""} placeholder="Description (optional)" onChange={(e) => onChange({ ...dish, desc: e.target.value || undefined })} /></label>
      {plain && <label><span className="vh">{label}: Lantern wording</span><input value={dish.plain ?? ""} placeholder="Lantern wording, simpler (optional)" onChange={(e) => onChange({ ...dish, plain: e.target.value })} /></label>}
      <Tags label={label} tags={tags} onChange={(t) => onChange({ ...dish, tags: t })} />
    </fieldset>
  );
}

function Tags({ label, tags, onChange }: { label: string; tags: Tag[]; onChange: (t: Tag[]) => void }) {
  return (
    <div className="med-tags" role="group" aria-label={`${label}: dietary tags`}>
      {TAGS.map((t) => (
        <button key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => onChange(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{tagLabels[t]}</button>
      ))}
    </div>
  );
}

/** One side course in a line: its name and tags. */
function CourseField({ label, dish, onChange }: { label: string; dish?: Dish; onChange: (d: Dish) => void }) {
  const d = dish ?? { name: "" };
  return (
    <div className="mn-cf">
      <label><span>{label}</span><input value={d.name} placeholder={`${label} (optional)`} onChange={(e) => onChange({ ...d, name: e.target.value })} /></label>
      <Tags label={label} tags={d.tags ?? []} onChange={(t) => onChange({ ...d, tags: t })} />
    </div>
  );
}

type Scope = "cycle" | "once" | "standing";
/** A cycle as edited: each day meal by meal, and dates that differ from the cycle. */
export interface CycleValue { days: CycleMeal[][][]; once: Record<string, CycleMeal[]> }

/**
 * A cycle menu as calendar cards: one row per week of the rotation, one card per day, dated with the next time that
 * day is served. Each card lists the day's meals (breakfast, lunch, dinner…) with their service times; the filter shows
 * one meal across the whole rotation with its courses. Any card opens an editor in place, a tab per meal, with that
 * meal's times for the day and every course. A change goes into the cycle (every time that week comes round) or onto
 * that date only. `periods` are the restaurant's meals and usual times; a day can keep its own times for a meal.
 */
export function CycleCalendar({ cycle, periods, now, todayIso, canEdit, holidays = {}, source, review, value, onValue, onToStanding, standingName }: {
  cycle: { weeks: number; season: string; days: CycleMeal[][][] };
  periods: MealPeriod[];
  /** Which week of the rotation this week is (0 for week 1). */
  now: number;
  todayIso: string;
  canEdit: boolean;
  holidays?: Record<string, string>;
  /** The upload Kinlight read the rotation from. */
  source?: string;
  /** In setup: nothing is live yet, so changes only go into the cycle. */
  review?: boolean;
  /** The restaurant's own copy, so its preview and imports see every change (optional: setup keeps its own). */
  value?: CycleValue;
  onValue?: Dispatch<SetStateAction<CycleValue>>;
  /** "Applies to the standing menu": put the dish on the always-available menu instead. */
  onToStanding?: (dish: Dish, period: string) => void;
  standingName?: string;
}) {
  const [inner, setInner] = useState<CycleValue>({ days: cycle.days, once: {} });
  const val = value ?? inner;
  const setVal: Dispatch<SetStateAction<CycleValue>> = value && onValue ? onValue : setInner;
  const { days, once } = val;
  const setDays = (f: SetStateAction<CycleMeal[][][]>) => setVal((v) => ({ ...v, days: typeof f === "function" ? f(v.days) : f }));
  const setOnce = (f: SetStateAction<Record<string, CycleMeal[]>>) => setVal((v) => ({ ...v, once: typeof f === "function" ? f(v.once) : f }));
  const [edited, setEdited] = useState<Record<string, true>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ meals: CycleMeal[]; scope: Scope; tab: string }>({ meals: [], scope: "cycle", tab: "" });
  const [view, setView] = useState<string>("all");

  const t = fromIso(todayIso);
  const sun = addDays(t, -dow(t));
  const weeks = days.length;
  // The date each card stands for: this week's row is this week; the others are the next time that week comes round.
  const dateOf = (w: number, d: number) => iso(addDays(sun, 7 * ((w - now + weeks) % weeks) + d));
  const changes = Object.keys(edited).length + Object.keys(once).length;
  // How a change to the cycle repeats, in plain words: "Every 4 weeks" (a 4-week cycle) or "Every Thursday" (weekly).
  const every = (date: string) => (weeks === 1 ? `Every ${dayName(fromIso(date))}` : `Every ${weeks} weeks`);
  const nextDates = (date: string) => [0, 1, 2].map((k) => shortDate(addDays(fromIso(date), 7 * weeks * k))).join(", ");
  const periodOf = (key: string) => periods.find((p) => p.key === key);
  const mealsOf = (w: number, d: number) => once[dateOf(w, d)] ?? days[w][d];
  const shown = view === "all" ? periods : periods.filter((p) => p.key === view);

  const start = (w: number, d: number) => {
    const k = `${w}:${d}`;
    if (open === k) { setOpen(null); return; }
    const have = mealsOf(w, d);
    const meals = periods.map((p) => {
      const m = have.find((x) => x.period === p.key);
      return m ? { ...m, courses: { ...m.courses } } : { period: p.key, courses: {} };
    });
    setDraft({ meals, scope: once[dateOf(w, d)] ? "once" : "cycle", tab: view !== "all" ? view : periods[periods.length - 1]?.key ?? "" });
    setOpen(k);
  };
  const setMeal = (key: string, f: (m: CycleMeal) => CycleMeal) => setDraft((dr) => ({ ...dr, meals: dr.meals.map((m) => (m.period === key ? f(m) : m)) }));
  const setCourse = (key: string, c: CourseKey, dish: Dish & { plain?: string }) => setMeal(key, (m) => ({ ...m, courses: { ...m.courses, [c]: { ...dish, plain: dish.plain ?? dish.name } as CycleDish } }));

  const save = (w: number, d: number) => {
    // Clean up: trim names, drop empty courses, and forget times that are just the usual ones.
    const meals: CycleMeal[] = draft.meals.map((m) => {
      const p = periodOf(m.period);
      const courses = Object.fromEntries(Object.entries(m.courses).flatMap(([c, x]) => (x && x.name.trim() ? [[c, { ...x, name: x.name.trim(), plain: x.plain?.trim() || x.name.trim() }]] : []))) as CycleMeal["courses"];
      const own = p && m.start != null && m.end != null && (m.start !== p.start || m.end !== p.end);
      return { period: m.period, courses, ...(own ? { start: m.start, end: m.end } : {}) };
    });
    const before = { days, edited, once };
    const date = dateOf(w, d);
    if (draft.scope === "standing" && onToStanding) {
      const meal = meals.find((m) => m.period === draft.tab) ?? meals[0];
      const dish = meal?.courses.entree;
      const p = periodOf(draft.tab);
      if (!dish) return;
      onToStanding(dish, p?.label ?? "");
      setOpen(null);
      say(`${dish.name} is on the always-available menu now, every day`);
      return;
    }
    if (draft.scope === "cycle") {
      setDays((s) => s.map((wk, i) => (i !== w ? wk : wk.map((x, j) => (j === d ? meals : x)))));
      setEdited((e) => ({ ...e, [`${w}:${d}`]: true }));
      setOnce((o) => { const n = { ...o }; delete n[date]; return n; });
    } else {
      setOnce((o) => ({ ...o, [date]: meals }));
    }
    setOpen(null);
    const undo = () => { setDays(before.days); setEdited(before.edited); setOnce(before.once); };
    say(draft.scope === "cycle" ? (review ? `Saved to cycle week ${w + 1}, ${dayName(fromIso(date))}` : `Saved for ${dayName(fromIso(date))}s ${weeks === 1 ? "every week" : `every ${weeks} weeks`}: ${nextDates(date)} and on`) : `Saved for ${dayName(fromIso(date))}, ${shortDate(fromIso(date))} only. The cycle stays as it was`, undo);
  };
  const resetOnce = (date: string) => {
    const before = once;
    setOnce((o) => { const n = { ...o }; delete n[date]; return n; });
    setOpen(null);
    say("Back to the cycle for that day", () => setOnce(before));
  };

  return (
    <div className="mn-cal">
      <div className="mn-cal-bar">
        <p>
          {source ? <><Icon name="doc" /> Read from <b>{source}</b>. </> : null}
          {canEdit ? "Click any day to change a meal, its times or its courses." : "Only the kitchen can change it."}
        </p>
        {changes > 0 && <span className="mn-cal-n"><Icon name="edit" /> {changes} {changes === 1 ? "change" : "changes"} saved</span>}
      </div>
      {periods.length > 1 && (
        <div className="sx-chips mn-cal-v" role="group" aria-label="Which meal to show">
          <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>All meals</button>
          {periods.map((p) => <button key={p.key} type="button" aria-pressed={view === p.key} onClick={() => setView(p.key)}>{p.label} <small>{fmtRange(p.start, p.end)}</small></button>)}
        </div>
      )}

      <div className={`mn-cal-g${view === "all" ? "" : " one"}`} role="group" aria-label={`${cycle.season} cycle, ${weeks} ${weeks === 1 ? "week" : "weeks"}, as calendar cards`}>
        <div className="mn-cal-hd" aria-hidden="true">
          <span />
          {DAYS.map((d) => <span key={d}>{d}</span>)}
        </div>
        {/* Rows run as a calendar does: this week first, then each week as it comes round. In setup, plain week order. */}
        {Array.from({ length: weeks }, (_, r) => (review ? r : (now + r) % weeks)).map((w) => {
          const rel = (w - now + weeks) % weeks;
          const first = fromIso(dateOf(w, 0));
          const openDay = open?.startsWith(`${w}:`) ? Number(open.split(":")[1]) : null;
          return (
            <div key={w} className={`mn-cal-wk${w === now && !review ? " now" : ""}`}>
              <div className="mn-cal-row">
                <span className="mn-cal-wl">
                  <b>Cycle week {w + 1}</b>
                  <small>{review ? "" : rel === 0 ? "This week" : rel === 1 ? "Next week" : `From ${shortDate(first)}`}</small>
                </span>
                {days[w].map((_, d) => {
                  const date = dateOf(w, d);
                  const o = once[date];
                  const meals = mealsOf(w, d);
                  const hol = holidays[date];
                  const past = !review && date < todayIso;
                  const main = meals.find((m) => m.period === periods[periods.length - 1]?.key)?.courses.entree;
                  const cls = ["mn-cal-c", date === todayIso && !review ? "td" : "", past ? "past" : "", hol ? "hol" : "", openDay === d ? "open" : "", o ? "once" : edited[`${w}:${d}`] ? "edited" : ""].filter(Boolean).join(" ");
                  const body = (
                    <>
                      <span className="mn-cal-d"><b>{DAYS[d]}</b> {review ? "" : shortDate(fromIso(date))}{date === todayIso && !review ? <small>Today</small> : null}</span>
                      {hol && <span className="mn-cal-hol"><Icon name="star" /> {hol} replaces it</span>}
                      {shown.map((p) => {
                        const m = meals.find((x) => x.period === p.key);
                        const own = m?.start != null && m.end != null;
                        const c = m?.courses ?? {};
                        return (
                          <span key={p.key} className="mn-cal-ml">
                            <small className="mn-cal-mt">{view === "all" && <b>{p.label}</b>} <span className={own ? "mn-cal-tx" : ""}>{fmtRange(own ? m!.start! : p.start, own ? m!.end! : p.end)}</span></small>
                            <span className="mn-cal-sp">{c.entree?.name || <i>Nothing planned</i>}</span>
                            {view !== "all" && (
                              <>
                                {c.entree?.tags?.length ? <em>{spell(c.entree.tags)}</em> : null}
                                {coursesFor(p.key).slice(1).filter((k) => c[k]?.name).map((k) => <small key={k} className="mn-cal-so">{courseLabels[k]}: {c[k]!.name}</small>)}
                              </>
                            )}
                          </span>
                        );
                      })}
                      {o ? <span className="mn-cal-m">This date only</span> : edited[`${w}:${d}`] ? <span className="mn-cal-m">Changed</span> : null}
                    </>
                  );
                  return canEdit ? (
                    <button key={d} type="button" className={cls} aria-expanded={openDay === d} aria-label={`Cycle week ${w + 1}, ${dayName(fromIso(date))}${main ? `: ${main.name}` : ""}. Change`} onClick={() => start(w, d)}>{body}</button>
                  ) : (
                    <div key={d} className={cls}>{body}</div>
                  );
                })}
              </div>
              {openDay !== null && <DayEditor
                title={`Cycle week ${w + 1} · ${dayName(fromIso(dateOf(w, openDay)))}${review ? "" : `, ${shortDate(fromIso(dateOf(w, openDay)))}`}`}
                dayShort={`${dayName(fromIso(dateOf(w, openDay))).slice(0, 3)}, ${shortDate(fromIso(dateOf(w, openDay)))}`}
                every={every(dateOf(w, openDay))}
                repeats={`${dayName(fromIso(dateOf(w, openDay))).slice(0, 3)} ${nextDates(dateOf(w, openDay))} and on. Changes the cycle.`}
                periods={periods}
                draft={draft}
                review={review}
                isOnce={!!once[dateOf(w, openDay)]}
                onTab={(tab) => setDraft((dr) => ({ ...dr, tab }))}
                onScope={(scope) => setDraft((dr) => ({ ...dr, scope }))}
                onMeal={setMeal}
                onCourse={setCourse}
                onSave={() => save(w, openDay)}
                standingName={onToStanding ? standingName ?? "the always-available menu" : undefined}
                onCancel={() => setOpen(null)}
                onReset={() => resetOnce(dateOf(w, openDay))}
              />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The editor for one day: a tab per meal, each with its service times for that day and its courses. */
function DayEditor({ title, dayShort, every, repeats, periods, draft, review, isOnce, onTab, onScope, onMeal, onCourse, onSave, onCancel, onReset, standingName }: {
  title: string; dayShort: string; every: string; repeats: string; periods: MealPeriod[]; draft: { meals: CycleMeal[]; scope: Scope; tab: string }; review?: boolean; isOnce: boolean;
  onTab: (k: string) => void; onScope: (s: Scope) => void; onMeal: (k: string, f: (m: CycleMeal) => CycleMeal) => void; onCourse: (k: string, c: CourseKey, d: Dish & { plain?: string }) => void;
  onSave: () => void; onCancel: () => void; onReset: () => void; standingName?: string;
}) {
  const p = periods.find((x) => x.key === draft.tab) ?? periods[0];
  const m = draft.meals.find((x) => x.period === p.key) ?? { period: p.key, courses: {} };
  const s = m.start ?? p.start;
  const e = m.end ?? p.end;
  const own = s !== p.start || e !== p.end;
  const courses = coursesFor(p.key);
  const ok = draft.meals.some((x) => x.courses.entree?.name.trim());
  return (
    <form className="mn-cal-e sx-form" onSubmit={(ev) => { ev.preventDefault(); if (ok) onSave(); }} aria-label={`Change ${title}`}>
      <header>
        <b>{title}</b>
        <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onCancel} aria-label="Close"><Icon name="x" /></button>
      </header>
      <div className="sx-tabs mn-cal-mtabs" role="tablist" aria-label="Meal">
        {periods.map((x) => {
          const dm = draft.meals.find((y) => y.period === x.key);
          return (
            <button key={x.key} type="button" role="tab" aria-selected={x.key === p.key} onClick={() => onTab(x.key)}>
              {x.label} <small className="mn-tabn">{fmtRange(dm?.start ?? x.start, dm?.end ?? x.end)}</small>
            </button>
          );
        })}
      </div>

      <fieldset className="mn-times">
        <legend>{p.label} times{review ? "" : ` on ${dayShort}`}</legend>
        <label>Starts<input type="time" value={toHM(s)} onChange={(ev) => onMeal(p.key, (x) => ({ ...x, start: fromHM(ev.target.value), end: x.end ?? p.end }))} /></label>
        <label>Ends<input type="time" value={toHM(e)} onChange={(ev) => onMeal(p.key, (x) => ({ ...x, start: x.start ?? p.start, end: fromHM(ev.target.value) }))} /></label>
        <p>
          {own ? <><span className="mn-cal-tx">Not the usual times.</span> Usually {fmtRange(p.start, p.end)}. <button type="button" className="sx-link mn-linkbtn" onClick={() => onMeal(p.key, (x) => ({ ...x, start: undefined, end: undefined }))}>Use the usual times</button></> : <>The usual {p.label.toLowerCase()} times. Change them for this day only, like a late holiday dinner.</>}
        </p>
        {e <= s && <p className="mn-warn" role="alert"><Icon name="alert" /> Ends before it starts.</p>}
      </fieldset>

      <div className="mn-cal-ef">
        <DishFields label={`${p.label} ${courseLabels.entree.toLowerCase()}`} dish={m.courses.entree ?? { name: "", plain: "" }} autoFocus plain onChange={(x) => onCourse(p.key, "entree", x)} />
        <div className="mn-cfs">
          {courses.slice(1).map((c) => <CourseField key={c} label={courseLabels[c]} dish={m.courses[c]} onChange={(x) => onCourse(p.key, c, x)} />)}
        </div>
      </div>

      {!review && (
        <div className="mn-scope" role="radiogroup" aria-label="Where the change goes">
          <label className={draft.scope === "cycle" ? "on" : ""}>
            <input type="radio" name={`scope-${title}`} checked={draft.scope === "cycle"} onChange={() => onScope("cycle")} />
            <span><b>{every}</b><small>{repeats}</small></span>
          </label>
          <label className={draft.scope === "once" ? "on" : ""}>
            <input type="radio" name={`scope-${title}`} checked={draft.scope === "once"} onChange={() => onScope("once")} />
            <span><b>Only {dayShort}</b><small>Just this date. The cycle stays as it is.</small></span>
          </label>
          {standingName && (
            <label className={draft.scope === "standing" ? "on" : ""}>
              <input type="radio" name={`scope-${title}`} checked={draft.scope === "standing"} onChange={() => onScope("standing")} />
              <span><b>Every day</b><small>Put this {p.label.toLowerCase()} entrée on {standingName}</small></span>
            </label>
          )}
        </div>
      )}
      <p className="pt-act">
        <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!ok || e <= s}><Icon name="check" /> Save the day</button>
        <button type="button" className="sx-btn sx-btn-sm" onClick={onCancel}>Cancel</button>
        {isOnce && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onReset}>Back to the cycle</button>}
      </p>
    </form>
  );
}

const PRESETS: { label: string; start: number; end: number }[] = [
  { label: "Breakfast", start: 7 * 60, end: 10 * 60 + 30 },
  { label: "Brunch", start: 10 * 60, end: 13 * 60 },
  { label: "Lunch", start: 11 * 60 + 30, end: 13 * 60 + 30 },
  { label: "Afternoon tea", start: 15 * 60, end: 16 * 60 },
  { label: "Dinner", start: 16 * 60 + 30, end: 19 * 60 },
  { label: "Evening snack", start: 19 * 60 + 30, end: 20 * 60 + 30 },
];

/**
 * A restaurant's meals and their usual service times, shown in one line and changed in place: rename a meal, change
 * its times, add one (brunch, afternoon tea) or take one away. Days that keep their own times are left alone.
 */
export function MealTimes({ name, periods, canEdit, onChange }: { name: string; periods: MealPeriod[]; canEdit: boolean; onChange: (p: MealPeriod[]) => void }) {
  const [draft, setDraft] = useState<MealPeriod[] | null>(null);
  const bad = draft?.some((p) => !p.label.trim() || p.end <= p.start);
  const save = () => {
    if (!draft || bad) return;
    const before = periods;
    onChange([...draft].sort((a, b) => a.start - b.start).map((p) => ({ ...p, label: p.label.trim() })));
    setDraft(null);
    say(`${name} meal times saved. The website, menu cards and the week’s cards use them now`, () => onChange(before));
  };
  if (!draft) {
    return (
      <div className="mn-mt">
        <Icon name="clock" />
        <ul aria-label={`${name} meal times`}>
          {periods.map((p) => <li key={p.key}><b>{p.label}</b> {fmtRange(p.start, p.end)}</li>)}
        </ul>
        {canEdit && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setDraft(periods.map((p) => ({ ...p })))}><Icon name="edit" /> Meal times</button>}
      </div>
    );
  }
  const unused = PRESETS.filter((x) => !draft.some((p) => p.label.toLowerCase() === x.label.toLowerCase()));
  return (
    <form className="mn-mt-f sx-form" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label={`${name} meal times`}>
      <ul>
        {draft.map((p, i) => (
          <li key={p.key}>
            <label><span className="vh">Meal name</span><input value={p.label} autoFocus={i === 0} onChange={(e) => setDraft((d) => d!.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></label>
            <label><span className="vh">{p.label} starts</span><input type="time" value={toHM(p.start)} onChange={(e) => setDraft((d) => d!.map((x, j) => (j === i ? { ...x, start: fromHM(e.target.value) } : x)))} /></label>
            <span aria-hidden="true">to</span>
            <label><span className="vh">{p.label} ends</span><input type="time" value={toHM(p.end)} onChange={(e) => setDraft((d) => d!.map((x, j) => (j === i ? { ...x, end: fromHM(e.target.value) } : x)))} /></label>
            <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-label={`Take ${p.label} away`} disabled={draft.length === 1} onClick={() => setDraft((d) => d!.filter((_, j) => j !== i))}><Icon name="x" /></button>
          </li>
        ))}
      </ul>
      {unused.length > 0 && (
        <div className="mn-mt-add">
          <span>Add</span>
          {unused.map((x) => <button key={x.label} type="button" className="sx-btn sx-btn-sm" onClick={() => setDraft((d) => [...d!, { key: `${x.label.toLowerCase().replace(/\s+/g, "-")}-${d!.length}`, ...x }])}><Icon name="plus" /> {x.label}</button>)}
        </div>
      )}
      {bad && <p className="mn-warn" role="alert"><Icon name="alert" /> Each meal needs a name, and must end after it starts.</p>}
      <p className="pt-act">
        <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={bad}><Icon name="check" /> Save meal times</button>
        <button type="button" className="sx-btn sx-btn-sm" onClick={() => setDraft(null)}>Cancel</button>
      </p>
    </form>
  );
}
