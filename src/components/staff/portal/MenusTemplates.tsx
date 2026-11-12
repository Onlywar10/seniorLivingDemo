"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { Icon } from "@/components/Icon";
import { tagLabels, type Dish, type MealPeriod, type Section, type Tag } from "@/data/shared";
import type { BoardVenue } from "@/data/staff/menus";
import { dayName, fmtRange, fromIso, shortDate } from "@/lib/clock";
import { say } from "../store";
import { Badge } from "../ui";
import { Help } from "./Help";
import { CycleCalendar, DishFields, type CycleValue } from "./MenusCalendar";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const spell = (tags?: Tag[]) => (tags ?? []).map((t) => tagLabels[t]).join(" · ");

/**
 * One restaurant's menu, the way its kitchen plans it: the cycle, the standing menu, or the daily board. Every part
 * stays mounted (only the chosen one shows), so changes made in one part are still there after looking at another.
 */
/** One restaurant's menu as it stands, edited here and read by its preview and imports. */
export interface MenuStore {
  cycle: CycleValue; setCycle: Dispatch<SetStateAction<CycleValue>>;
  standing: Section[]; setStanding: Dispatch<SetStateAction<Section[]>>;
  daily: BoardVenue["daily"]; setDaily: Dispatch<SetStateAction<BoardVenue["daily"]>>;
  /** The upload the cycle was last read from. */
  source?: string;
}

export function RestaurantView({ v, meals, todayIso, canEdit, me, chefFirst, held, holidays, store }: { v: BoardVenue; meals: MealPeriod[]; todayIso: string; canEdit: boolean; me: string; chefFirst: string; held: Record<string, string>; holidays: Record<string, string>; store: MenuStore }) {
  const [part, setPart] = useState<"rotation" | "standing" | "lantern" | "daily">(v.template === "cycle" ? "rotation" : v.template === "daily" ? "daily" : "standing");
  const parts: { key: typeof part; label: string }[] =
    v.template === "cycle"
      ? [{ key: "rotation", label: "The rotation" }, { key: "standing", label: "Always available" }, ...(v.lantern ? [{ key: "lantern" as const, label: "Lantern version" }] : [])]
      : v.template === "standing"
        ? [{ key: "standing", label: "Always available" }, ...(v.slots?.length ? [{ key: "daily" as const, label: "Chef’s specials" }] : [])]
        : [{ key: "daily", label: "Today’s board" }, { key: "standing", label: "Always available" }];

  return (
    <div className="mn-rv">
      <div className="sx-chips" role="group" aria-label={`${v.venue.name}: what to show`}>
        {parts.map((p) => <button key={p.key} type="button" aria-pressed={part === p.key} onClick={() => setPart(p.key)}>{p.label}</button>)}
      </div>
      {v.cycle && <div hidden={part !== "rotation"}><Rotation v={v} meals={meals} todayIso={todayIso} canEdit={canEdit} chefFirst={chefFirst} holidays={holidays} store={store} /></div>}
      <div hidden={part !== "standing"}><Standing v={v} periods={meals} canEdit={canEdit} held={held} value={store.standing} onValue={store.setStanding} /></div>
      {v.cycle && part === "lantern" && <Lantern v={v} todayIso={todayIso} days={store.cycle.days} meals={meals} />}
      {v.slots?.length ? <div hidden={part !== "daily"}><Daily v={v} todayIso={todayIso} canEdit={canEdit} me={me} value={store.daily} onValue={store.setDaily} /></div> : null}
    </div>
  );
}

/* ------------------------------------------------------------ cycle: the weeks as calendar cards */

function Rotation({ v, meals, todayIso, canEdit, chefFirst, holidays, store }: { v: BoardVenue; meals: MealPeriod[]; todayIso: string; canEdit: boolean; chefFirst: string; holidays: Record<string, string>; store: MenuStore }) {
  const cy = v.cycle!;
  const [next, setNext] = useState<"due" | "reading" | "in">("due");
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setNext("reading");
    window.setTimeout(() => { setNext("in"); say(`${cy.nextSeason} cycle read. It starts the day after ${cy.endsLabel}.`, () => setNext("due")); }, 1300);
    e.target.value = "";
  };
  return (
    <>
      <div className="mn-season">
        <p><b>{cy.season} cycle</b> · {cy.startsLabel} to {cy.endsLabel} · {cy.weeks > 1 ? `${cy.weeks} weeks long, then it starts again · this week is cycle week ${cy.now + 1}` : "the same menu every week"}</p>
        {next === "in" ? (
          <p className="mn-ok"><Icon name="check" /> {cy.nextSeason} cycle is in. It starts after {cy.endsLabel}.</p>
        ) : (
          <div className={`sx-callout ${cy.daysToDue <= 28 ? "" : "info"}`}>
            <Icon name="calendar" />
            <p><b>{cy.nextSeason} cycle due by {cy.dueLabel}.</b> Kinlight reminds {chefFirst} on {cy.reminders.join(" and ")}. If it doesn’t come, this cycle keeps running.</p>
            {canEdit && (
              <label className="sx-btn sx-btn-sm">
                <Icon name="upload" /> {next === "reading" ? "Reading…" : "Upload it now"}
                <input type="file" accept=".pdf,.doc,.docx,image/*" className="vh" onChange={onFile} />
              </label>
            )}
          </div>
        )}
      </div>
      <CycleCalendar
        cycle={cy}
        periods={meals}
        now={cy.now}
        todayIso={todayIso}
        canEdit={canEdit}
        holidays={holidays}
        source={store.source ?? `${v.venue.name.replace(/^The /, "")} ${cy.season} cycle, weeks 1–${cy.weeks}.pdf`}
        value={store.cycle}
        onValue={store.setCycle}
        standingName={`${v.venue.name}’s always-available menu`}
        onToStanding={(dish, period) => store.setStanding((ss) => {
          const i = Math.max(0, ss.findIndex((x) => /main|plate|entr/i.test(x.title)));
          const item = { name: dish.name, ...(dish.desc ? { desc: dish.desc } : {}), ...(dish.tags?.length ? { tags: dish.tags } : {}) };
          return ss.length ? ss.map((x, j) => (j === i ? { ...x, items: [...x.items, item] } : x)) : [{ title: period || "Every day", items: [item] }];
        })}
      />
      <p className="sx-note">Each day’s meals rotate with the cycle; dishes served every day are under Always available, shown once. Out of something today? Use Live today.</p>
    </>
  );
}

/* ------------------------------------------------------------ always available: shown once, edited in place */

/**
 * The always-available menu, edited in place: change, add or take off any dish, rename a meal period or course.
 * `review` is setup: nothing is published yet, so the toasts say so.
 */
export function Standing({ v, periods = [], canEdit, held, review, value, onValue }: {
  v: Pick<BoardVenue, "standing" | "standingChanged" | "holds" | "venue">; periods?: MealPeriod[]; canEdit: boolean; held: Record<string, string>; review?: boolean;
  /** The restaurant's own copy (so its preview and imports see changes); setup keeps its own. */
  value?: Section[]; onValue?: Dispatch<SetStateAction<Section[]>>;
}) {
  const [inner, setInner] = useState<Section[]>(v.standing);
  const sections = value ?? inner;
  const setSections: Dispatch<SetStateAction<Section[]>> = value && onValue ? onValue : setInner;
  const [moveTo, setMoveTo] = useState<number | null>(null);
  const [changed, setChanged] = useState(v.standingChanged);
  /** "2:4" edits section 2, dish 4; "2:new" adds a dish to section 2; "2:title" renames section 2. */
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState<Dish>({ name: "" });
  const [title, setTitle] = useState("");
  const holdOf = (name: string) => v.holds.find((h) => h.dish === name);
  const where = review ? "Saved" : "Saved. The website and menu cards show it from now on";

  const commit = (next: Section[], msg: string) => {
    const before = { sections, changed };
    setSections(next);
    if (!review) setChanged("today");
    setEdit(null);
    say(msg, () => { setSections(before.sections); setChanged(before.changed); });
  };
  const save = (si: number, ii: number | "new") => {
    const name = draft.name.trim();
    if (!name) return;
    const dish = { ...draft, name };
    // Moved to another category: take it out of this one and add it at the end of that one.
    if (ii !== "new" && moveTo !== null && moveTo !== si) {
      commit(sections.map((s, i) => (i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : i === moveTo ? { ...s, items: [...s.items, dish] } : s)), `${name} moved to ${sections[moveTo].title}`);
      return;
    }
    commit(sections.map((s, i) => (i !== si ? s : { ...s, items: ii === "new" ? [...s.items, dish] : s.items.map((it, j) => (j === ii ? dish : it)) })), ii === "new" ? `${name} added to ${sections[si].title}` : where);
  };
  const remove = (si: number, ii: number) => {
    const name = sections[si].items[ii].name;
    commit(sections.map((s, i) => (i !== si ? s : { ...s, items: s.items.filter((_, j) => j !== ii) })), `${name} taken off the menu`);
  };
  const rename = (si: number) => {
    const t = title.trim();
    if (!t) return;
    commit(sections.map((s, i) => (i !== si ? s : { ...s, title: t })), where);
  };

  const editor = (si: number, ii: number | "new") => (
    <li key={`${si}:${ii}:e`} className="mn-std-e">
      <form className="sx-form" onSubmit={(e) => { e.preventDefault(); save(si, ii); }}>
        <DishFields label={ii === "new" ? `New dish in ${sections[si].title}` : "Dish"} dish={draft} autoFocus onChange={(d) => setDraft(d)} />
        {ii !== "new" && sections.length > 1 && (
          <label className="mn-move">Category
            <select value={moveTo ?? si} onChange={(e) => setMoveTo(Number(e.target.value))}>
              {sections.map((x, i) => <option key={i} value={i}>{x.title}</option>)}
            </select>
          </label>
        )}
        <p className="pt-act">
          <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!draft.name.trim()}><Icon name="check" /> {ii === "new" ? "Add" : "Save"}</button>
          <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(null)}>Cancel</button>
          {ii !== "new" && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet mn-rm" onClick={() => remove(si, ii)}><Icon name="x" /> Take it off</button>}
        </p>
      </form>
    </li>
  );

  return (
    <div className="mn-std">
      <div className="mn-std-h">
        <span>{review ? "Click any dish to fix it" : `Last changed ${changed}`}</span>
        <Help label="About the standing menu">
          <p>Dishes served every day. Kinlight shows them on the website and menu cards every day without anyone touching them.</p>
          <p>Change, add or take off a dish here and it changes everywhere from now on. Dietary tags are only published when they match what’s in the dish.</p>
        </Help>
      </div>
      <div className="mn-std-g">
        {sections.map((s, si) => (
          <div key={si}>
            {edit === `${si}:title` ? (
              <form className="mn-std-t" onSubmit={(e) => { e.preventDefault(); rename(si); }}>
                <label><span className="vh">Name of this part of the menu</span><input className="sx-input" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} /></label>
                <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm" disabled={!title.trim()}>Save</button>
                <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setEdit(null)}>Cancel</button>
              </form>
            ) : (
              <h4>
                {s.title}{(() => { const p = periods.find((x) => x.label.toLowerCase() === s.title.toLowerCase()); const note = p ? s.note?.replace(/\d{1,2}:\d{2}\s*(am|pm)?\s*[–-]\s*\d{1,2}:\d{2}\s*(am|pm)/i, fmtRange(p.start, p.end)) ?? fmtRange(p.start, p.end) : s.note; return note ? <small> · {note}</small> : null; })()}
                {canEdit && <button type="button" className="mn-std-tb" aria-label={`Rename ${s.title}`} onClick={() => { setEdit(`${si}:title`); setTitle(s.title); }}><Icon name="edit" /></button>}
              </h4>
            )}
            <ul>
              {s.items.map((it, ii) => {
                const k = `${si}:${ii}`;
                if (edit === k) return editor(si, ii);
                const h = holdOf(it.name);
                const answer = h ? held[`${v.venue.key}-${h.dish}`] : undefined;
                const body = (
                  <span>
                    <b>{it.name}</b>
                    {it.desc && <> · {it.desc}</>}
                    {it.tags?.length ? <em> {spell(it.tags)}</em> : null}
                    {h && !answer && <span className="mn-hold"><Icon name="alert" /> Tags held back: check in Coming up</span>}
                    {h && answer && <em> {answer === "No tags" ? "" : answer.replace(" only", "")}</em>}
                  </span>
                );
                return (
                  <li key={k}>
                    {canEdit ? (
                      <button type="button" className="mn-std-i" aria-label={`Change ${it.name}`} onClick={() => { setEdit(k); setDraft({ ...it }); setMoveTo(null); }}>
                        {body}
                        <Icon name="edit" />
                      </button>
                    ) : body}
                  </li>
                );
              })}
              {edit === `${si}:new` ? editor(si, "new") : canEdit && (
                <li className="mn-std-add"><button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setEdit(`${si}:new`); setDraft({ name: "" }); }}><Icon name="plus" /> Add a dish</button></li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ daily specials: the board, or specials on top */

function Daily({ v, todayIso, canEdit, me, value, onValue }: { v: BoardVenue; todayIso: string; canEdit: boolean; me: string; value?: BoardVenue["daily"]; onValue?: Dispatch<SetStateAction<BoardVenue["daily"]>> }) {
  const slots = v.slots ?? [];
  const [inner, setInner] = useState(v.daily);
  const days = value ?? inner;
  const setDays: Dispatch<SetStateAction<BoardVenue["daily"]>> = value && onValue ? onValue : setInner;
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Dish>>({});
  const [posted, setPosted] = useState(v.posted ?? "");
  const [reading, setReading] = useState(false);
  const how = v.via === "photo" ? "a photo of the board" : v.via === "text" ? `${v.template === "standing" ? "the chef’s" : "a"} text` : "the quick form";
  const today = days.find((d) => d.date === todayIso);

  const startDay = (date: string) => {
    if (open === date) { setOpen(null); return; }
    const d = days.find((x) => x.date === date);
    setDraft(Object.fromEntries(slots.map((s) => [s.key, { ...(d?.values[s.key] ?? { name: "" }) }])));
    setOpen(date);
  };
  const saveDay = (date: string) => {
    const before = { days, posted };
    const values = Object.fromEntries(Object.entries(draft).filter(([, x]) => x.name.trim()).map(([k, x]) => [k, { ...x, name: x.name.trim() }]));
    setDays((ds) => ds.map((d) => (d.date === date ? { ...d, values } : d)));
    if (date === todayIso && v.template === "daily") setPosted(`Today, just now, by ${me}`);
    setOpen(null);
    say(`${dayName(fromIso(date))} saved.${date <= todayIso ? " The website and the menu card show it now" : ""}`, () => { setDays(before.days); setPosted(before.posted); });
  };
  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setReading(true);
    window.setTimeout(() => {
      setReading(false);
      const before = posted;
      setPosted(`Today, just now, by ${me}`);
      say("Read and posted. Click any slot to fix what Kinlight read", () => setPosted(before));
    }, 1300);
    e.target.value = "";
  };

  const editor = (date: string) => (
    <form className="sx-form mn-day-e" onSubmit={(e) => { e.preventDefault(); saveDay(date); }} aria-label={`Change ${dayName(fromIso(date))}`}>
      <div className="mn-cal-ef">
        {slots.map((s, i) => <DishFields key={s.key} label={s.label} dish={draft[s.key] ?? { name: "" }} autoFocus={i === 0} onChange={(x) => setDraft((d) => ({ ...d, [s.key]: x }))} />)}
      </div>
      <p className="sx-note" style={{ margin: 0 }}>Leave a slot empty to keep it off the menu that day.</p>
      <p className="pt-act">
        <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm"><Icon name="check" /> Save {dayName(fromIso(date))}</button>
        <button type="button" className="sx-btn sx-btn-sm" onClick={() => setOpen(null)}>Cancel</button>
      </p>
    </form>
  );

  // Each day as a calendar card; click one to change what goes in its slots.
  const week = (
    <div className="mn-dw">
      <div className="mn-dw-g">
        {days.map((d) => {
          const body = (
            <>
              <span className="mn-cal-d"><b>{dayName(fromIso(d.date)).slice(0, 3)}</b> {shortDate(fromIso(d.date))}{d.date === todayIso ? <small>Today</small> : null}</span>
              {slots.map((s) => {
                const x = d.values[s.key];
                return (
                  <span key={s.key} className="mn-dw-s">
                    {slots.length > 1 && <small>{s.label}</small>}
                    <b className={x?.name ? "" : "mn-wait"}>{x?.name ?? (v.template === "daily" && d.date > todayIso ? "Filled that morning" : "Waiting")}</b>
                    {x?.tags?.length ? <em>{spell(x.tags)}</em> : null}
                  </span>
                );
              })}
            </>
          );
          const cls = `mn-cal-c${d.date === todayIso ? " td" : ""}${d.date < todayIso ? " past" : ""}${open === d.date ? " open" : ""}`;
          return canEdit ? (
            <button key={d.date} type="button" className={cls} aria-expanded={open === d.date} aria-label={`${dayName(fromIso(d.date))}, ${shortDate(fromIso(d.date))}. Change`} onClick={() => startDay(d.date)}>{body}</button>
          ) : <div key={d.date} className={cls}>{body}</div>;
        })}
      </div>
      {open && editor(open)}
    </div>
  );

  // A restaurant that adds specials on top of its template: the week's specials as calendar cards.
  if (v.template !== "daily") {
    return (
      <div className="mn-daily">
        <div className="mn-std-h"><span>{slots.map((s) => s.label).join(", ")} on top of the standing menu · read from the chef’s text{canEdit ? " · click a day to change it" : ""}</span>
          <Help label="About specials on top"><p>{v.venue.name} keeps its standing menu and adds a chef’s special each day. The chef texts the week’s specials; Kinlight reads them and asks only if a line is unclear. Anything it read wrong, change here.</p></Help>
        </div>
        {week}
      </div>
    );
  }

  return (
    <div className="mn-daily">
      <div className="mn-std-h"><span>{posted ? <>Today posted {posted.replace(/^Today, /, "")} from {how}</> : "Today: waiting"}</span>
        <Help label="How the board comes in"><p>Each morning, send a photo of the board or a text, or type it here. Kinlight reads the names into the slots; a slot left empty stays off the menu. It never fills one itself.</p></Help>
      </div>
      <ul className="mn-board">
        {slots.map((s) => {
          const x = today?.values[s.key];
          return (
            <li key={s.key}>
              {canEdit ? (
                <button type="button" onClick={() => startDay(todayIso)} aria-label={`${s.label}: ${x?.name ?? "waiting"}. Change today’s board`}>
                  <small>{s.label} · {s.period}</small>
                  <b>{x?.name || "Waiting"}</b>
                  <Icon name="edit" />
                </button>
              ) : (
                <>
                  <small>{s.label} · {s.period}</small>
                  <b>{x?.name || "Waiting"}</b>
                </>
              )}
            </li>
          );
        })}
      </ul>
      {canEdit && (
        <p className="pt-act">
          <label className="sx-btn sx-btn-sm">
            <Icon name="image" /> {reading ? "Reading…" : "Photo of the board"}
            <input type="file" accept="image/*" capture="environment" className="vh" onChange={onPhoto} />
          </label>
          <span className="sx-note" style={{ margin: 0 }}>Or text it to the kitchen number, or click a slot to type it</span>
        </p>
      )}
      <h4 className="mn-h3">This week</h4>
      {week}
    </div>
  );
}

/* ------------------------------------------------------------ Lantern: the same cycle, simpler and picture-friendly */

function Lantern({ v, todayIso, days, meals }: { v: BoardVenue; todayIso: string; days: CycleValue["days"]; meals: MealPeriod[] }) {
  const cy = v.cycle!;
  const td = fromIso(todayIso).getUTCDay();
  const [day, setDay] = useState(td);
  const today = days[cy.now]?.[day] ?? [];
  // Two plated choices per meal, so residents can point: the entrée and the alternate, in simpler words.
  const choices = today.filter((m) => !/breakfast|morning/i.test(m.period)).map((m) => ({
    label: meals.find((p) => p.key === m.period)?.label ?? m.period,
    pair: [m.courses.entree, m.courses.alternate].filter((x): x is NonNullable<typeof x> => !!x),
  }));
  const fish = (n: string) => /fish|sole|cod|halibut|mahi|salmon|scallop|shrimp|crab/i.test(n);
  return (
    <div className="mn-lan">
      <div className="mn-std-h"><span>{v.venue.name} menu for Lantern: cycle week {cy.now + 1}, two choices a meal</span>
        <Help label="About the Lantern menu">
          <p>The Lantern (memory care) menu is the same cycle, not a separate restaurant: simpler words, large print, two plated choices a meal shown with pictures so residents can point, and finger foods marked.</p>
          <p>Soft, chopped and puréed versions are noted as available. No resident’s own diet appears here; that stays with the care team.</p>
        </Help>
      </div>
      <div className="sx-chips" role="group" aria-label="Day">
        {DAYS.map((d, i) => <button key={d} type="button" aria-pressed={day === i} onClick={() => setDay(i)}>{d}{i === td ? " · today" : ""}</button>)}
      </div>
      {choices.map((c) => (
        <section key={c.label} className="mn-lan-meal" aria-label={c.label}>
          <h4 className="mn-h3">{c.label}: choose one</h4>
          <div className="mn-lan-g">
            {c.pair.map((d, i) => (
              <article key={i} className="mn-lan-c">
                {fish(d.name) ? <Image src="/img/dish-salmon.jpg" alt="" width={240} height={160} /> : <span className="mn-lan-p" aria-hidden="true"><Icon name="fork" /><small>Photo of the plate</small></span>}
                <small>{i === 0 ? "Choice 1" : "Choice 2"}</small>
                <b>{d.plain && d.plain !== d.name ? d.plain : d.name}</b>
                {(d.finger || /sandwich|taco|crab cake|meatball|wrap|panini|tender/i.test(d.name)) && <Badge tone="good">Finger food</Badge>}
              </article>
            ))}
          </div>
        </section>
      ))}
      <p className="mn-lan-n"><Icon name="info" /> Soft, chopped and puréed available for every dish.</p>
      {v.lantern && <p className="mn-lan-n"><Icon name="fork" /> Finger foods every day: {v.lantern.finger.join(", ")}.</p>}
      <p className="sx-note">Prints as a large-print card with the Lantern activity calendar: tabloid, 20 pt, one picture per choice.</p>
    </div>
  );
}
