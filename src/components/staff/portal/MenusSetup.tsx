"use client";

import { useState, type ChangeEvent } from "react";
import { Icon } from "@/components/Icon";
import { tagLabels, type MenuTemplate } from "@/data/shared";
import type { BoardVenue } from "@/data/staff/menus";
import { say } from "../store";
import { Badge } from "../ui";
import { CycleCalendar } from "./MenusCalendar";
import { Standing } from "./MenusTemplates";

export const TEMPLATES: { key: MenuTemplate; name: string; line: string; example: string }[] = [
  { key: "cycle", name: "Cycle menu", line: "Planned menus that repeat every few weeks and change by season.", example: "Week 1 Sunday: roast chicken. Week 2 Sunday: prime rib. Back to week 1 after week 4." },
  { key: "standing", name: "Always available", line: "One menu that stays the same. Change it when something changes.", example: "Caesar salad, the house burger, fish tacos, breakfast all day." },
  { key: "daily", name: "Daily specials", line: "A few slots you fill every day, from a photo of the board, a text or a quick form.", example: "Pour of the day, pastry of the day, soup." },
];
export const templateName = (k: MenuTemplate) => TEMPLATES.find((x) => x.key === k)!.name;

type Step = 0 | 1 | 2 | 3 | 4;

/**
 * The culinary director's one-time setup for a restaurant: pick the template that matches how the kitchen already
 * plans, bring in what it has, set hours and meal periods, and (for a cycle) the seasons. `sample` replays how an
 * existing restaurant was set up; without it, a new restaurant starts blank. After Kinlight reads a new restaurant's
 * upload, what it read is laid out to check and fix in place (the cycle as calendar cards, the standing menu dish by
 * dish) before finishing. Nothing is saved: it's a demo.
 */
export function MenusSetup({ sample, example, chefFirst, canEdit, todayIso, onClose }: {
  sample?: BoardVenue;
  /** For a new restaurant: a restaurant whose menus stand in for what Kinlight reads from the upload. */
  example?: BoardVenue;
  chefFirst: string;
  canEdit: boolean;
  todayIso: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState(sample?.venue.name ?? "");
  const [tpl, setTpl] = useState<MenuTemplate | null>(sample?.template ?? null);
  const [read, setRead] = useState<"none" | "reading" | "done">(sample ? "done" : "none");
  const [file, setFile] = useState(sample ? sampleFile(sample) : "");
  const [answer, setAnswer] = useState<string | null>(null);
  const hold = sample?.holds[0];
  const [slots, setSlots] = useState<string[]>(sample?.slots?.map((x) => x.label) ?? ["Soup of the day", "Pastry of the day"]);
  const [slotDraft, setSlotDraft] = useState("");
  const [hours, setHours] = useState(sample?.venue.hours ?? "11:00 am–7:00 pm");
  const [periods, setPeriods] = useState(sample ? sample.standing.map((x) => x.title).join(", ") : "Lunch, Dinner");
  const [ends, setEnds] = useState(sample?.cycle?.ends ?? "2027-03-27");
  const [due, setDue] = useState(sample?.cycle?.nextDue ?? "2027-03-01");
  const [done, setDone] = useState(false);
  const locked = !canEdit || !!sample;

  const steps = tpl === "cycle" ? ["Template", "What you have", "Hours", "Seasons"] : ["Template", "What you have", "Hours"];
  const last = steps.length - 1;
  const counts = sample?.cycle
    ? { weeks: sample.cycle.weeks, days: sample.cycle.weeks * 7, courses: sample.standing.length, dishes: sample.cycle.weeks * 14 + sample.standing.reduce((n, x) => n + x.items.length, 0) }
    : { weeks: 4, days: 28, courses: 4, dishes: 72 };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f.name);
    setRead("reading");
    window.setTimeout(() => setRead("done"), 1300);
    e.target.value = "";
  };

  const finish = () => {
    setDone(true);
    if (!sample) say(`${name || "The new restaurant"} is set up as ${templateName(tpl!)}`);
  };

  const canNext = step === 0 ? !!tpl && (!!sample || !!name.trim()) : step === 1 ? (tpl === "daily" ? slots.length > 0 : read === "done" && (!!sample || !hold || !!answer)) : true;

  return (
    <div className="mn-setup" role="region" aria-label={sample ? `How ${sample.venue.name} was set up` : "Set up a restaurant"}>
      <header className="mn-setup-h">
        <div>
          <h3>{sample ? `How ${sample.venue.name} was set up` : "Set up a restaurant"}</h3>
          <p>{sample ? `${chefFirst} did this once. Kinlight has carried it forward since.` : "Once per restaurant. About ten minutes."}</p>
        </div>
        <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={onClose}><Icon name="x" /> Close</button>
      </header>

      {!done && (
        <ol className="mn-steps" aria-label="Steps">
          {steps.map((x, i) => (
            <li key={x} aria-current={i === step ? "step" : undefined} className={i < step ? "past" : ""}>
              <button type="button" disabled={i > step && !sample} onClick={() => setStep(i as Step)}><span>{i + 1}</span> {x}</button>
            </li>
          ))}
        </ol>
      )}

      {done ? (
        <div className="mn-setup-b">
          <div className="sx-callout good" role="status"><Icon name="check" /><p>{sample ? `${sample.venue.name}: ${templateName(tpl!)}.` : `${name || "The new restaurant"} is set up as ${templateName(tpl!)}.`} From now on, automatically:</p></div>
          <ul className="mn-auto-l">
            {tpl === "cycle" && <li>Every Sunday the menu moves on to the next cycle week. After cycle week {counts.weeks}, it starts again at cycle week 1.</li>}
            {tpl === "cycle" && <li>Reminders to send the next season’s cycle four weeks and one week before it’s due.</li>}
            {tpl === "standing" && <li>The standing menu stays up every day until you change it.</li>}
            {tpl === "daily" && <li>Each morning, a place for {slots.length} specials. Send a photo of the board or a text, or fill in the form.</li>}
            <li>Each day’s menu goes up at 5 am on the website, in the newsletter and on the large-print card.</li>
            <li>A dated copy of what was served, kept at least 30 days.</li>
            <li>You only hear about what’s different: a holiday, a swap, or something Kinlight wasn’t sure of.</li>
          </ul>
          <p className="pt-act"><button type="button" className="sx-btn sx-btn-primary" onClick={onClose}><Icon name="check" /> Done</button></p>
        </div>
      ) : (
        <div className="mn-setup-b">
          {step === 0 && (
            <fieldset className="mn-tpl" disabled={locked && !!sample}>
              <legend>How does this kitchen plan its menus?</legend>
              {!sample && (
                <label className="mn-setup-name">Restaurant name
                  <input className="sx-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Garden Room" disabled={!canEdit} />
                </label>
              )}
              <div className="mn-tpl-l">
                {TEMPLATES.map((x) => (
                  <label key={x.key} className={`mn-tpl-o${tpl === x.key ? " on" : ""}`}>
                    <input type="radio" name="mn-tpl" value={x.key} checked={tpl === x.key} onChange={() => setTpl(x.key)} disabled={!canEdit && !sample} />
                    <b>{x.name}</b>
                    <span>{x.line}</span>
                    <small>For example: {x.example}</small>
                  </label>
                ))}
              </div>
              <p className="sx-note">Any restaurant can add daily specials on top, like Millpond’s chef’s special.</p>
            </fieldset>
          )}

          {step === 1 && tpl === "daily" && (
            <div className="mn-slots-set">
              <h4>Name the slots you fill each day</h4>
              <ul className="mn-slot-l">
                {slots.map((x, i) => (
                  <li key={x + i}>
                    <span>{x}</span>
                    {!locked && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" aria-label={`Remove ${x}`} onClick={() => setSlots((l) => l.filter((_, j) => j !== i))}><Icon name="x" /></button>}
                  </li>
                ))}
              </ul>
              {!locked && (
                <form className="mn-soup" onSubmit={(e) => { e.preventDefault(); if (slotDraft.trim()) { setSlots((l) => [...l, slotDraft.trim()]); setSlotDraft(""); } }}>
                  <label><span className="vh">New slot</span><input className="sx-input" value={slotDraft} onChange={(e) => setSlotDraft(e.target.value)} placeholder="Pour of the day" /></label>
                  <button type="submit" className="sx-btn" disabled={!slotDraft.trim()}><Icon name="plus" /> Add</button>
                </form>
              )}
              <p className="sx-note">Kinlight never fills a slot itself. Empty slots stay off the menu.</p>
            </div>
          )}

          {step === 1 && tpl !== "daily" && (
            <div className="mn-bring">
              <h4>{tpl === "cycle" ? "Upload the whole rotation, all the weeks" : "Upload the standing menu"}</h4>
              <p className="sx-note" style={{ marginTop: 0 }}>A PDF, a document or a photo of each page. Kinlight reads it into {tpl === "cycle" ? "weeks, days, meal periods and courses" : "meal periods and dishes"}, and only asks about what it wasn’t sure of.</p>
              {read === "none" && (
                <label className="sx-btn">
                  <Icon name="upload" /> Choose a file
                  <input type="file" accept=".pdf,.doc,.docx,image/*" className="vh" onChange={onFile} disabled={!canEdit} />
                </label>
              )}
              {read === "reading" && <p className="mn-ok" style={{ color: "var(--sx-ink-2)" }}><Icon name="clock" /> Reading {file}…</p>}
              {read === "done" && (
                <>
                  <p className="mn-ok"><Icon name="check" /> {file}</p>
                  <ul className="mn-read">
                    {tpl === "cycle" ? (
                      <>
                        <li><b>{counts.weeks}</b> weeks</li>
                        <li><b>{counts.days}</b> days</li>
                        <li><b>{counts.courses}</b> courses</li>
                        <li><b>{counts.dishes}</b> dishes</li>
                      </>
                    ) : (
                      <>
                        <li><b>{sample?.standing.length ?? 4}</b> meal periods</li>
                        <li><b>{sample?.standing.reduce((n, x) => n + x.items.length, 0) ?? 17}</b> dishes</li>
                      </>
                    )}
                  </ul>
                  {!hold && <p className="sx-note" style={{ marginTop: 0 }}>Nothing Kinlight wasn’t sure of.</p>}
                  {hold && (
                    <div className={`mn-q${answer ? " done" : ""}`}>
                      <b>{hold.dish} says “{hold.tags.map((x) => tagLabels[x]).join(" · ")}”, but it has {hold.why.map((w) => w.split(":")[0]).join(" and ")}. Which tags?</b>
                      {sample ? (
                        <small>Kinlight asked this when the menu came in. {chefFirst} hasn’t answered yet, so it’s waiting in Coming up and the tags aren’t published.</small>
                      ) : answer ? (
                        <p className="mn-ok"><Icon name="check" /> {answer}{!locked && <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => setAnswer(null)}>Change</button>}</p>
                      ) : (
                        <div className="mn-choose">
                          <button type="button" className="sx-btn" onClick={() => setAnswer("No tags")}>Take them off</button>
                          <button type="button" className="sx-btn" onClick={() => setAnswer("Dairy free only")}>Keep Dairy free</button>
                        </div>
                      )}
                    </div>
                  )}
                  {tpl === "cycle" && <p className="sx-note">Dishes served every day (starters, mains, sides, desserts) go on the always-available menu, shown once. Only the rotating special and soup stay in the weeks.</p>}
                  {!sample && example && canEdit && (
                    <div className="mn-review">
                      <h4>Check what Kinlight read</h4>
                      <p className="sx-note" style={{ marginTop: 0 }}>Anything it got wrong, click it and fix it here. Your changes go in before the first week goes up.</p>
                      {tpl === "cycle" && example.cycle ? (
                        <CycleCalendar cycle={example.cycle} periods={example.meals} now={0} todayIso={todayIso} canEdit review source={file} />
                      ) : (
                        <Standing v={{ ...example, holds: [] }} canEdit held={{}} review />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="sx-form mn-setup-f">
              <label>Hours<input value={hours} onChange={(e) => setHours(e.target.value)} disabled={locked} /></label>
              <label>Meal periods and courses<input value={periods} onChange={(e) => setPeriods(e.target.value)} disabled={locked} /></label>
              <p className="sx-note" style={{ marginTop: 0 }}>Used on the website, the menu cards and in every answer Kinlight gives about dining.</p>
            </div>
          )}

          {step === 3 && tpl === "cycle" && (
            <div className="sx-form mn-setup-f">
              <div className="sx-row">
                <label>This cycle<input value={sample?.cycle?.season ?? "Fall/Winter"} disabled readOnly /></label>
                <label>Ends<input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} disabled={locked} /></label>
              </div>
              <div className="sx-row">
                <label>Next cycle<input value={sample?.cycle?.nextSeason ?? "Spring/Summer"} disabled readOnly /></label>
                <label>Due from the kitchen by<input type="date" value={due} onChange={(e) => setDue(e.target.value)} disabled={locked} /></label>
              </div>
              <p className="sx-note" style={{ marginTop: 0 }}>Kinlight reminds {chefFirst} four weeks and one week before it’s due. If it doesn’t come, the current cycle keeps running.</p>
            </div>
          )}

          <p className="pt-act mn-setup-nav">
            {step > 0 && <button type="button" className="sx-btn" onClick={() => setStep((s) => (s - 1) as Step)}><Icon name="left" /> Back</button>}
            {step < last ? (
              <button type="button" className="sx-btn sx-btn-primary" disabled={!canNext} onClick={() => setStep((s) => (s + 1) as Step)}>Next <Icon name="right" /></button>
            ) : (
              <button type="button" className="sx-btn sx-btn-primary" disabled={!canNext || (!canEdit && !sample)} onClick={finish}><Icon name="check" /> {sample ? "See what happens next" : "Finish setup"}</button>
            )}
            {!canEdit && !sample && <Badge>View only</Badge>}
          </p>
        </div>
      )}
    </div>
  );
}

function sampleFile(v: BoardVenue) {
  const n = v.venue.name.replace(/^The /, "");
  return v.template === "cycle" ? `${n} ${v.cycle?.season ?? ""} cycle, weeks 1–${v.cycle?.weeks ?? 4}.pdf` : `${n} menu.pdf`;
}
