"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { money, pricing, site } from "@/data/site";

interface Line {
  id: string;
  label: string;
  hint?: string;
  value: number;
  pcl: string; // what covers it at Prairie City Landing
}

// Typical monthly figures for a Folsom / Sacramento-area household.
const START: Line[] = [
  { id: "housing", label: "Mortgage or rent", hint: "Enter 0 if your home is paid off", value: 1850, pcl: "Your monthly rent" },
  { id: "tax", label: "Property tax & homeowners insurance", value: 780, pcl: "No property tax or homeowners insurance" },
  { id: "hoa", label: "HOA dues", value: 120, pcl: "No HOA dues" },
  { id: "util", label: "Utilities", hint: "Electric, gas, water, sewer and garbage", value: 420, pcl: "All utilities included" },
  { id: "net", label: "Internet, cable & phone", value: 210, pcl: "Full internet and cable included" },
  { id: "maint", label: "Home maintenance & repairs", hint: "Roof, HVAC, appliances, plumbing", value: 450, pcl: "All maintenance and handyman services included" },
  { id: "clean", label: "Housekeeping & yard care", value: 360, pcl: "Weekly housekeeping included" },
  { id: "food", label: "Groceries & meals out", value: 850, pcl: "Access to all three restaurants included" },
  { id: "car", label: "Transportation & car costs", hint: "Payment, insurance, fuel, upkeep", value: 640, pcl: "Scheduled transportation included" },
  { id: "gym", label: "Fitness membership", value: 65, pcl: "25+ fitness classes a week included" },
  { id: "fun", label: "Entertainment & outings", value: 250, pcl: "Events & Adventures included" },
  { id: "pendant", label: "Emergency response pendant", value: 45, pcl: "24-hour emergency response included" },
];

const APTS = [
  { id: "studio", label: "Studio", fee: pricing.independent[0].from },
  { id: "1br", label: "One bedroom", fee: pricing.independent[1].from },
  { id: "2br", label: "Two bedroom", fee: pricing.independent[2].from },
] as const;

const CARE_RATE = 36; // typical Sacramento-area home care, per hour
const WEEKS = 4.33;

export function CostComparison() {
  const [lines, setLines] = useState(START);
  const [hours, setHours] = useState(0);
  const [rate, setRate] = useState(CARE_RATE);
  const [apt, setApt] = useState<(typeof APTS)[number]["id"]>("1br");
  const [assisted, setAssisted] = useState(false);
  const [couple, setCouple] = useState(false);
  const [personal, setPersonal] = useState(300);

  const care = Math.round(hours * WEEKS * rate);
  const home = lines.reduce((s, l) => s + (l.value || 0), 0) + care;
  const fee = APTS.find((a) => a.id === apt)!.fee;
  const pcl = fee + (assisted ? pricing.assistedBase : 0) + personal;
  const diff = home - pcl;
  const max = Math.max(home, pcl, 1);

  const set = (id: string, v: string) => {
    const n = Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "")) || 0));
    setLines(lines.map((l) => (l.id === id ? { ...l, value: n } : l)));
  };

  // stacked bar segments for "at home"
  const groups = [
    { label: "Housing", v: lines.filter((l) => ["housing", "tax", "hoa", "maint"].includes(l.id)).reduce((s, l) => s + l.value, 0), c: "var(--slate)" },
    { label: "Bills & services", v: lines.filter((l) => ["util", "net", "clean", "pendant"].includes(l.id)).reduce((s, l) => s + l.value, 0), c: "var(--sky)" },
    { label: "Food, car & fun", v: lines.filter((l) => ["food", "car", "gym", "fun"].includes(l.id)).reduce((s, l) => s + l.value, 0), c: "var(--olive)" },
    { label: "In-home care", v: care, c: "var(--brick)" },
  ].filter((g) => g.v > 0);
  const pclSegs = [
    { label: "Monthly rent", v: fee, c: "var(--green)" },
    { label: "Assisted Living base", v: assisted ? pricing.assistedBase : 0, c: "var(--terra)" },
    { label: "Personal spending", v: personal, c: "var(--butter)" },
  ].filter((g) => g.v > 0);

  return (
    <div className="cc">
      <div className="cc-cols">
        {/* At home */}
        <section className="cc-panel" aria-labelledby="cc-home-h">
          <div className="cc-panel-h">
            <span className="cc-ic cc-ic-home">
              <Icon name="home" />
            </span>
            <div>
              <h2 id="cc-home-h">Your costs at home</h2>
              <p>Monthly figures. We’ve filled in typical Folsom-area amounts; change any of them to match yours.</p>
            </div>
          </div>
          <ul className="cc-lines">
            {lines.map((l) => (
              <li key={l.id} className="cc-line">
                <label htmlFor={`cc-${l.id}`}>
                  <span>{l.label}</span>
                  {l.hint && <small>{l.hint}</small>}
                </label>
                <div className="cc-money">
                  <span aria-hidden="true">$</span>
                  <input id={`cc-${l.id}`} inputMode="numeric" value={l.value ? l.value.toLocaleString("en-US") : "0"} onChange={(e) => set(l.id, e.target.value)} onFocus={(e) => e.target.select()} />
                </div>
              </li>
            ))}
            <li className="cc-line cc-care">
              <label htmlFor="cc-hours">
                <span>In-home care</span>
                <small>
                  {hours} hours a week at {money(rate)}/hr
                </small>
              </label>
              <div className="cc-care-in">
                <input id="cc-hours" type="range" min={0} max={60} step={2} value={hours} onChange={(e) => setHours(+e.target.value)} aria-valuetext={`${hours} hours a week`} />
                <output htmlFor="cc-hours">{money(care)}</output>
              </div>
              <div className="cc-rate">
                <label htmlFor="cc-rate">Hourly rate</label>
                <div className="cc-money cc-money-s">
                  <span aria-hidden="true">$</span>
                  <input id="cc-rate" inputMode="numeric" value={rate} onChange={(e) => setRate(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))} />
                </div>
              </div>
            </li>
          </ul>
          <p className="cc-total">
            <span>Total at home</span>
            <strong>{money(home)}</strong>
            <small>a month</small>
          </p>
        </section>

        {/* PCL */}
        <section className="cc-panel cc-panel-pcl" aria-labelledby="cc-pcl-h">
          <div className="cc-panel-h">
            <span className="cc-ic cc-ic-pcl">
              <Icon name="building" />
            </span>
            <div>
              <h2 id="cc-pcl-h">At Prairie City Landing</h2>
              <p>One monthly rent that covers almost every line on the left.</p>
            </div>
          </div>

          <fieldset className="cc-apts">
            <legend>Apartment</legend>
            {APTS.map((a) => (
              <label key={a.id} className={apt === a.id ? "on" : ""}>
                <input type="radio" name="cc-apt" checked={apt === a.id} onChange={() => setApt(a.id)} />
                <b>{a.label}</b>
                <span>from {money(a.fee)}</span>
              </label>
            ))}
          </fieldset>

          <div className="cc-toggles">
            <label className="check">
              <input type="checkbox" checked={assisted} onChange={(e) => setAssisted(e.target.checked)} />
              <span>
                <b>Add Assisted Living Services</b> · {money(pricing.assistedBase)} a month base support fee, plus personal care by care plan
              </span>
            </label>
            <label className="check">
              <input type="checkbox" checked={couple} onChange={(e) => setCouple(e.target.checked)} />
              <span>
                <b>A second person is moving in too</b> · $0, there’s no second-person fee
              </span>
            </label>
          </div>

          <ul className="cc-inc">
            <li className="cc-inc-fee">
              <span>Monthly rent, {APTS.find((a) => a.id === apt)!.label.toLowerCase()}</span>
              <b>{money(fee)}</b>
            </li>
            {assisted && (
              <li className="cc-inc-fee">
                <span>Assisted Living Services base fee</span>
                <b>{money(pricing.assistedBase)}</b>
              </li>
            )}
            {couple && (
              <li className="cc-inc-fee">
                <span>Second person</span>
                <b>$0</b>
              </li>
            )}
            {lines
              .filter((l) => l.id !== "housing")
              .map((l) => (
                <li key={l.id}>
                  <span>
                    <Icon name="check" /> {l.pcl}
                  </span>
                  <s aria-label={`instead of ${money(l.value)}`}>{l.value ? money(l.value) : ""}</s>
                </li>
              ))}
            {care > 0 && (
              <li>
                <span>
                  <Icon name="heart" /> {assisted ? "Personal care from Care Partners on site" : "Assisted Living Services, available in every apartment"}
                </span>
                <span className="cc-inc-plan">by care plan</span>
              </li>
            )}
          </ul>

          <div className="cc-line cc-personal">
            <label htmlFor="cc-personal">
              <span>Personal spending</span>
              <small>Meals with family off site, the salon, outings of your own</small>
            </label>
            <div className="cc-money">
              <span aria-hidden="true">$</span>
              <input id="cc-personal" inputMode="numeric" value={personal.toLocaleString("en-US")} onChange={(e) => setPersonal(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))} onFocus={(e) => e.target.select()} />
            </div>
          </div>
          <p className="cc-total cc-total-pcl">
            <span>Total at Prairie City Landing</span>
            <strong>{money(pcl)}</strong>
            <small>a month</small>
          </p>
        </section>
      </div>

      {/* Result */}
      <section className="cc-result" aria-labelledby="cc-res-h" aria-live="polite">
        <div className="cc-res-head">
          <h2 id="cc-res-h">
            {diff > 0 ? (
              <>
                Prairie City Landing could cost <em>{money(diff)} less</em> a month
              </>
            ) : diff < 0 ? (
              <>
                Prairie City Landing would cost <em>{money(-diff)} more</em> a month
              </>
            ) : (
              <>The two come out about the same</>
            )}
          </h2>
          <p>
            {diff > 0
              ? `That’s ${money(diff * 12)} a year${couple ? `, and couples share one rent with no second-person fee` : ""}.`
              : diff < 0
                ? `That’s ${money(-diff * 12)} a year, and it buys three restaurants, a 24-hour team, weekly housekeeping, transportation and a calendar full of things to do${couple ? ", for both of you, with no second-person fee" : ""}.`
                : "And at Prairie City Landing, the housekeeping, maintenance, transportation and calendar come with it."}
          </p>
        </div>
        <div className="cc-bars" role="img" aria-label={`Your costs at home: ${money(home)} a month. At Prairie City Landing: ${money(pcl)} a month.`}>
          {[
            { name: "Your costs at home", total: home, segs: groups },
            { name: "At Prairie City Landing", total: pcl, segs: pclSegs },
          ].map((b) => (
            <div key={b.name} className="cc-bar-row">
              <div className="cc-bar-lbl">
                <span>{b.name}</span>
                <b>{money(b.total)}</b>
              </div>
              <div className="cc-bar">
                <div className="cc-bar-fill" style={{ width: `${(b.total / max) * 100}%` }}>
                  {b.segs.map((s) => (
                    <span key={s.label} style={{ flexGrow: s.v, background: s.c }} title={`${s.label}: ${money(s.v)}`} />
                  ))}
                </div>
              </div>
              <ul className="cc-legend">
                {b.segs.map((s) => (
                  <li key={s.label}>
                    <i style={{ background: s.c }} />
                    {s.label} {money(s.v)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="cc-res-stats">
          <div>
            <span>Monthly difference</span>
            <b>
              {diff >= 0 ? "" : "+"}
              {money(Math.abs(diff))}
            </b>
            <small>{diff >= 0 ? "less at Prairie City Landing" : "more at Prairie City Landing"}</small>
          </div>
          <div>
            <span>Over a year</span>
            <b>{money(Math.abs(diff * 12))}</b>
            <small>{diff >= 0 ? "kept in your pocket" : "for everything included"}</small>
          </div>
          <div>
            <span>Your home’s yearly cost</span>
            <b>{money(home * 12)}</b>
            <small>before any surprise repairs</small>
          </div>
        </div>
        <p className="cc-fine">
          {care > 0 && "Personal care at Prairie City Landing is priced by care plan and isn’t included in the total above. "}
          Figures are estimates for planning. Rents shown are starting prices; Cynthia Bazin can give you exact pricing for the apartments open now at <a href={site.phoneHref}>{site.phone}</a>. Personal care under Assisted Living Services is priced by care plan after a pre-move-in assessment.
        </p>
        <div className="btn-row">
          <Link href="/tour?interest=independent" className="btn btn-lg">
            <Icon name="calendar" /> Schedule a Tour
          </Link>
          <Link href="/floor-plans" className="btn btn-ghost btn-lg">
            See floor plans
          </Link>
        </div>
      </section>
    </div>
  );
}
