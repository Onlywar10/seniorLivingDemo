"use client";

import Link from "@/i18n/Link";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { money } from "@/data/shared";
import type { Community } from "@/data/communities";
import { useCommunity } from "@/lib/community";
import { keyPeople } from "@/data/communities/copy/living";
import { toolsCopy } from "@/data/communities/copy/tools";
import { useT } from "@/i18n/client";

interface Line {
  id: string;
  label: string;
  /** The question asked for this line, one per screen. */
  ask: string;
  hint?: string;
  value: number;
  comm: string; // what covers it at the community
}

// Typical monthly figures for a Calder-area household.
const BASE: Line[] = [
  { id: "housing", label: "Mortgage or rent", ask: "What do you pay each month for your mortgage or rent?", hint: "Enter 0 if your home is paid off", value: 1850, comm: "Your monthly rent" },
  { id: "tax", label: "Property tax & homeowners insurance", ask: "What do property tax and homeowners insurance cost you each month?", hint: "Take the yearly amount and divide by 12", value: 780, comm: "No property tax or homeowners insurance" },
  { id: "hoa", label: "HOA dues", ask: "Do you pay HOA dues? How much a month?", hint: "Enter 0 if you don’t have an HOA", value: 120, comm: "No HOA dues" },
  { id: "util", label: "Utilities", ask: "What do your utilities come to each month?", hint: "Electric, gas, water, sewer and garbage", value: 420, comm: "All utilities included" },
  { id: "net", label: "Internet, cable & phone", ask: "What do you pay for internet, cable and phone?", value: 210, comm: "Full internet and cable included" },
  { id: "maint", label: "Home maintenance & repairs", ask: "What do maintenance and repairs cost you in a typical month?", hint: "Roof, HVAC, appliances, plumbing", value: 450, comm: "All maintenance and handyman services included" },
  { id: "clean", label: "Housekeeping & yard care", ask: "What do you spend on housekeeping and yard care?", value: 360, comm: "Weekly housekeeping included" },
  { id: "food", label: "Groceries & meals out", ask: "What do groceries and meals out cost each month?", value: 850, comm: "Access to all three restaurants included" },
  { id: "car", label: "Transportation & car costs", ask: "What does getting around cost you each month?", hint: "Payment, insurance, fuel, upkeep", value: 640, comm: "Scheduled transportation included" },
  { id: "gym", label: "Fitness membership", ask: "Do you pay for a gym or fitness classes?", hint: "Enter 0 if you don’t", value: 65, comm: "25+ fitness classes a week included" },
  { id: "fun", label: "Entertainment & outings", ask: "What do you spend on entertainment and outings?", value: 250, comm: "Events & Adventures included" },
  { id: "pendant", label: "Emergency response pendant", ask: "Do you pay for an emergency response pendant?", hint: "Enter 0 if you don’t", value: 45, comm: "24-hour emergency response included" },
];

/** The household lines, with what covers each one at this community. */
const startLines = (c: Community): Line[] => BASE.map((l) => ({ ...l, comm: toolsCopy[c.slug].covers[l.id as keyof ToolsCovers] ?? l.comm }));
type ToolsCovers = (typeof toolsCopy)[keyof typeof toolsCopy]["covers"];

type AptId = "studio" | "1br" | "2br";
const aptIds: AptId[] = ["studio", "1br", "2br"];
/** Apartment sizes from the community's starting prices (studio, one bedroom, two bedroom). */
const aptsFor = (c: Community) => c.pricing.independent.slice(0, 3).map((r, i) => ({ id: aptIds[i], label: r.name, fee: r.from }));

const CARE_RATE = 36; // typical Calder-area home care, per hour
const WEEKS = 4.33;

/** The questions, one per screen: who is moving, each household cost, in-home care, then the community side. */
type Step = { kind: "who" } | { kind: "line"; id: string } | { kind: "care" } | { kind: "apt" } | { kind: "assisted" } | { kind: "personal" };
const STEPS: Step[] = [{ kind: "who" }, ...BASE.map((l) => ({ kind: "line" as const, id: l.id })), { kind: "care" }, { kind: "apt" }, { kind: "assisted" }, { kind: "personal" }];

const toNum = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "")) || 0));

export function CostComparison() {
  const { t } = useT();
  const c = useCommunity();
  const { pricing, site } = c;
  const copy = toolsCopy[c.slug];
  const name = site.name;
  const contact = keyPeople(c).relations;
  const APTS = aptsFor(c);
  const [step, setStep] = useState(0); // STEPS.length = result
  const [lines, setLines] = useState(() => startLines(c));
  const [hours, setHours] = useState(0);
  const [rate, setRate] = useState(CARE_RATE);
  const [apt, setApt] = useState<AptId>("1br");
  const [assisted, setAssisted] = useState(false);
  const [couple, setCouple] = useState(false);
  const [personal, setPersonal] = useState(300);
  const head = useRef<HTMLHeadingElement>(null);

  const total = STEPS.length;
  const done = step >= total;
  const s = done ? null : STEPS[step];
  const move = (to: number) => {
    setStep(Math.max(0, Math.min(total, to)));
    requestAnimationFrame(() => head.current?.focus());
  };

  const care = Math.round(hours * WEEKS * rate);
  const home = lines.reduce((sum, l) => sum + (l.value || 0), 0) + care;
  const fee = APTS.find((a) => a.id === apt)!.fee;
  const comm = fee + (assisted ? pricing.assistedBase : 0) + personal;
  const diff = home - comm;
  const max = Math.max(home, comm, 1);

  const set = (id: string, v: string) => setLines(lines.map((l) => (l.id === id ? { ...l, value: toNum(v) } : l)));

  // stacked bar segments for "at home"
  const groups = [
    { label: "Housing", v: lines.filter((l) => ["housing", "tax", "hoa", "maint"].includes(l.id)).reduce((sum, l) => sum + l.value, 0), c: "var(--slate)" },
    { label: "Bills & services", v: lines.filter((l) => ["util", "net", "clean", "pendant"].includes(l.id)).reduce((sum, l) => sum + l.value, 0), c: "var(--sky)" },
    { label: "Food, car & fun", v: lines.filter((l) => ["food", "car", "gym", "fun"].includes(l.id)).reduce((sum, l) => sum + l.value, 0), c: "var(--olive)" },
    { label: "In-home care", v: care, c: "var(--brick)" },
  ].filter((g) => g.v > 0);
  const pclSegs = [
    { label: "Monthly rent", v: fee, c: "var(--green)" },
    { label: "Assisted Living base", v: assisted ? pricing.assistedBase : 0, c: "var(--terra)" },
    { label: "Personal spending", v: personal, c: "var(--butter)" },
  ].filter((g) => g.v > 0);

  const line = s?.kind === "line" ? lines.find((l) => l.id === s.id)! : null;
  // The running total so far, shown under the household questions.
  const soFar = lines.slice(0, line ? lines.indexOf(line) + 1 : 0).reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="cc cc-wizard">
      <div className="ca-progress" aria-hidden={done}>
        <div className="ca-bar">
          <span style={{ width: `${(Math.min(step, total) / total) * 100}%` }} />
        </div>
        <p className="ca-step">{done ? t("All done") : t(`Question ${step + 1} of ${total}`)}</p>
      </div>

      {s && (
        <form
          className="ca-card cc-q"
          key={step}
          onSubmit={(e) => {
            e.preventDefault();
            move(step + 1);
          }}
        >
          {s.kind === "who" && (
            <>
              <p className="ca-topic">{t("Getting started")}</p>
              <h2 ref={head} tabIndex={-1}>
                {t(`Who would be moving to ${name}?`)}
              </h2>
              <fieldset className="ca-opts">
                <legend className="vh">{t(`Who would be moving to ${name}?`)}</legend>
                {[
                  { v: false, label: "Just me" },
                  { v: true, label: "Two of us" },
                ].map((o) => (
                  <label key={o.label} className={`ca-opt ${couple === o.v ? "on" : ""}`}>
                    <input type="radio" name="cc-who" checked={couple === o.v} onChange={() => setCouple(o.v)} />
                    <span className="ca-mark" aria-hidden="true" />
                    {t(o.label)}
                  </label>
                ))}
              </fieldset>
              <p className="ca-help">{t(`There’s no second-person fee at ${name}: couples save about ${money(pricing.secondPersonSaving)} a year.`)}</p>
            </>
          )}

          {line && (
            <>
              <p className="ca-topic">{t("Your costs at home")}</p>
              <h2 ref={head} tabIndex={-1}>
                <label htmlFor={`cc-${line.id}`}>{t(line.ask)}</label>
              </h2>
              {line.hint && <p className="ca-help">{t(line.hint)}</p>}
              <div className="cc-ask">
                <div className="cc-money cc-money-l">
                  <span aria-hidden="true">$</span>
                  <input
                    id={`cc-${line.id}`}
                    inputMode="numeric"
                    value={line.value ? line.value.toLocaleString("en-US") : "0"}
                    onChange={(e) => set(line.id, e.target.value)}
                    onFocus={(e) => e.target.select()}

                  />
                </div>
                <span className="cc-ask-unit">{t("a month")}</span>
              </div>
              <p className="cc-ask-note">
                {t(`We’ve filled in a typical ${site.address.city}-area amount; change it to match yours.`)}
              </p>
              <p className="cc-sofar">
                <span>{t("Your costs at home so far")}</span> <b>{money(soFar)}</b>
              </p>
            </>
          )}

          {s.kind === "care" && (
            <>
              <p className="ca-topic">{t("In-home care")}</p>
              <h2 ref={head} tabIndex={-1}>
                <label htmlFor="cc-hours">{t("How many hours of in-home care a week do you have, or expect to need?")}</label>
              </h2>
              <p className="ca-help">{t("Leave it at 0 if you don’t need any help at home.")}</p>
              <div className="cc-care-in cc-care-big">
                <input id="cc-hours" type="range" min={0} max={60} step={2} value={hours} onChange={(e) => setHours(+e.target.value)} aria-valuetext={t(`${hours} hours a week`)} />
                <output htmlFor="cc-hours">
                  {t(`${hours} hours a week`)} · <b>{money(care)}</b>
                  {t("/mo")}
                </output>
              </div>
              <div className="cc-rate">
                <label htmlFor="cc-rate">{t("Hourly rate")}</label>
                <div className="cc-money cc-money-s">
                  <span aria-hidden="true">$</span>
                  <input id="cc-rate" inputMode="numeric" value={rate} onChange={(e) => setRate(toNum(e.target.value))} />
                </div>
              </div>
            </>
          )}

          {s.kind === "apt" && (
            <>
              <p className="ca-topic">{t(`At ${name}`)}</p>
              <h2 ref={head} tabIndex={-1}>
                {t("Which apartment size would suit you?")}
              </h2>
              <fieldset className="ca-opts">
                <legend className="vh">{t("Which apartment size would suit you?")}</legend>
                {APTS.map((a) => (
                  <label key={a.id} className={`ca-opt ${apt === a.id ? "on" : ""}`}>
                    <input type="radio" name="cc-apt" checked={apt === a.id} onChange={() => setApt(a.id)} />
                    <span className="ca-mark" aria-hidden="true" />
                    <span className="cc-opt-text">
                      {t(a.label)}
                      <small>
                        {t("from ")}
                        {money(a.fee)}
                        {t("/mo")}
                      </small>
                    </span>
                  </label>
                ))}
              </fieldset>
            </>
          )}

          {s.kind === "assisted" && (
            <>
              <p className="ca-topic">{t("Assisted Living Services")}</p>
              <h2 ref={head} tabIndex={-1}>
                {t("Would you add Assisted Living Services?")}
              </h2>
              <p className="ca-help">
                {money(pricing.assistedBase)}
                {t(" a month base support fee, plus personal care by care plan")}
              </p>
              <fieldset className="ca-opts">
                <legend className="vh">{t("Would you add Assisted Living Services?")}</legend>
                {[
                  { v: false, label: "Not right now" },
                  { v: true, label: "Yes, add Assisted Living Services" },
                ].map((o) => (
                  <label key={o.label} className={`ca-opt ${assisted === o.v ? "on" : ""}`}>
                    <input type="radio" name="cc-assisted" checked={assisted === o.v} onChange={() => setAssisted(o.v)} />
                    <span className="ca-mark" aria-hidden="true" />
                    {t(o.label)}
                  </label>
                ))}
              </fieldset>
            </>
          )}

          {s.kind === "personal" && (
            <>
              <p className="ca-topic">{t(`At ${name}`)}</p>
              <h2 ref={head} tabIndex={-1}>
                <label htmlFor="cc-personal">{t("How much would you set aside for personal spending?")}</label>
              </h2>
              <p className="ca-help">{t("Meals with family off site, the salon, outings of your own")}</p>
              <div className="cc-ask">
                <div className="cc-money cc-money-l">
                  <span aria-hidden="true">$</span>
                  <input id="cc-personal" inputMode="numeric" value={personal.toLocaleString("en-US")} onChange={(e) => setPersonal(toNum(e.target.value))} onFocus={(e) => e.target.select()} />
                </div>
                <span className="cc-ask-unit">{t("a month")}</span>
              </div>
            </>
          )}

          <div className="ca-nav cc-q-nav">
            <button type="button" className="btn btn-ghost" onClick={() => move(step - 1)} disabled={step === 0}>
              <Icon name="left" />
              {t(" Back")}
            </button>
            <button type="submit" className="btn btn-green">
              {t(step === total - 1 ? "See my comparison" : "Next")} <Icon name="right" />
            </button>
          </div>
        </form>
      )}

      {done && (
        <>
          <section className="cc-result" aria-labelledby="cc-res-h" aria-live="polite">
            <div className="cc-res-head">
              <h2 id="cc-res-h" ref={head} tabIndex={-1}>
                {diff > 0 ? (
                  <>
                    {t(`${name} could cost `)}
                    <em>
                      {money(diff)}
                      {t(" less")}
                    </em>
                    {t(" a month")}
                  </>
                ) : diff < 0 ? (
                  <>
                    {t(`${name} would cost `)}
                    <em>
                      {money(-diff)}
                      {t(" more")}
                    </em>
                    {t(" a month")}
                  </>
                ) : (
                  <>{t("The two come out about the same")}</>
                )}
              </h2>
              <p>
                {t(
                  diff > 0
                    ? `That’s ${money(diff * 12)} a year${couple ? `, and couples share one rent with no second-person fee` : ""}.`
                    : diff < 0
                      ? `That’s ${money(-diff * 12)} a year, and it buys ${copy.buys}${couple ? ", for both of you, with no second-person fee" : ""}.`
                      : copy.same
                )}
              </p>
            </div>
            <div className="cc-bars" role="img" aria-label={t(`Your costs at home: ${money(home)} a month. At ${name}: ${money(comm)} a month.`)}>
              {[
                { name: "Your costs at home", total: home, segs: groups },
                { name: `At ${name}`, total: comm, segs: pclSegs },
              ].map((b) => (
                <div key={b.name} className="cc-bar-row">
                  <div className="cc-bar-lbl">
                    <span>{t(b.name)}</span>
                    <b>{money(b.total)}</b>
                  </div>
                  <div className="cc-bar">
                    <div className="cc-bar-fill" style={{ width: `${(b.total / max) * 100}%` }}>
                      {b.segs.map((g) => (
                        <span key={g.label} style={{ flexGrow: g.v, background: g.c }} title={`${t(g.label)}: ${money(g.v)}`} />
                      ))}
                    </div>
                  </div>
                  <ul className="cc-legend">
                    {b.segs.map((g) => (
                      <li key={g.label}>
                        <i style={{ background: g.c }} />
                        {t(g.label)} {money(g.v)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="cc-res-stats">
              <div>
                <span>{t("Monthly difference")}</span>
                <b>
                  {diff >= 0 ? "" : "+"}
                  {money(Math.abs(diff))}
                </b>
                <small>{t(diff >= 0 ? `less at ${name}` : `more at ${name}`)}</small>
              </div>
              <div>
                <span>{t("Over a year")}</span>
                <b>{money(Math.abs(diff * 12))}</b>
                <small>{t(diff >= 0 ? "kept in your pocket" : "for everything included")}</small>
              </div>
              <div>
                <span>{t("Your home’s yearly cost")}</span>
                <b>{money(home * 12)}</b>
                <small>{t("before any surprise repairs")}</small>
              </div>
            </div>
            <p className="cc-fine">
              {care > 0 && t(`Personal care at ${name} is priced by care plan and isn’t included in the total above. `)}
              {t(`Figures are estimates for planning. Rents shown are starting prices; ${contact && !contact.unnamed ? contact.name : "our Community Relations Director"} can give you exact pricing for the apartments open now at `)}
              <a href={site.phoneHref}>{site.phone}</a>
              {t(". Personal care under Assisted Living Services is priced by care plan after a pre-move-in assessment.")}
            </p>
            <div className="btn-row">
              <Link href="/tour?interest=independent" className="btn btn-lg">
                <Icon name="calendar" />
                {t(" Schedule a Tour")}
              </Link>
              <Link href="/floor-plans" className="btn btn-ghost btn-lg">
                {t("See floor plans")}
              </Link>
            </div>
          </section>

          {/* What one rent covers, line by line, against the visitor's own answers */}
          <section className="cc-panel cc-panel-comm" aria-labelledby="cc-wh-h">
            <div className="cc-panel-h">
              <span className="cc-ic cc-ic-comm">
                <Icon name="building" />
              </span>
              <div>
                <h2 id="cc-wh-h">{t(`What your rent covers at ${name}`)}</h2>
                <p>{t("One monthly rent that covers almost every line you entered.")}</p>
              </div>
            </div>
            <ul className="cc-inc">
              <li className="cc-inc-fee">
                <span>
                  {t("Monthly rent, ")}
                  {t(APTS.find((a) => a.id === apt)!.label.toLowerCase())}
                </span>
                <b>{money(fee)}</b>
              </li>
              {assisted && (
                <li className="cc-inc-fee">
                  <span>{t("Assisted Living Services base fee")}</span>
                  <b>{money(pricing.assistedBase)}</b>
                </li>
              )}
              {couple && (
                <li className="cc-inc-fee">
                  <span>{t("Second person")}</span>
                  <b>$0</b>
                </li>
              )}
              <li className="cc-inc-fee">
                <span>{t("Personal spending")}</span>
                <b>{money(personal)}</b>
              </li>
              {lines
                .filter((l) => l.id !== "housing")
                .map((l) => (
                  <li key={l.id}>
                    <span>
                      <Icon name="check" /> {t(l.comm)}
                    </span>
                    <s aria-label={t(`instead of ${money(l.value)}`)}>{l.value ? money(l.value) : ""}</s>
                  </li>
                ))}
              {care > 0 && (
                <li>
                  <span>
                    <Icon name="heart" /> {t(assisted ? "Personal care from Care Partners on site" : "Assisted Living Services, available in every apartment")}
                  </span>
                  <span className="cc-inc-plan">{t("by care plan")}</span>
                </li>
              )}
            </ul>
          </section>

          <div className="ca-nav">
            <button type="button" className="btn btn-ghost" onClick={() => move(total - 1)}>
              <Icon name="left" />
              {t(" Change my answers")}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setLines(startLines(c));
                setHours(0);
                setRate(CARE_RATE);
                setApt("1br");
                setAssisted(false);
                setCouple(false);
                setPersonal(300);
                move(0);
              }}
            >
              {t("Start over")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
