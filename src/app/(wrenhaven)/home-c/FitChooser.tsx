"use client";

import { useId, useState } from "react";
import { useT } from "@/i18n/client";
import { Icon } from "@/components/Icon";

export type Need = "independent" | "assisted" | "lantern";
type Area = "alder-bend" | "kestrel-point" | "either";
type Who = "one" | "two";

export interface FitCommunity {
  slug: "alder-bend" | "kestrel-point";
  name: string;
  city: string;
  /** The community's own "from" line for each living option. */
  from: Record<Need, string>;
  couplesSave: string;
  links: { plans: string; assessment: string; tour: string };
  phone: string;
  phoneHref: string;
  contact: string;
}

const needs: { key: Need; label: string; note: string }[] = [
  { key: "independent", label: "An easier home and more company", note: "Managing well day to day, but the house, the driving or the quiet are getting harder." },
  { key: "assisted", label: "Some help with daily life", note: "Medication, getting ready in the morning, or a hand getting to meals and appointments." },
  { key: "lantern", label: "Memory support", note: "A calm, secure neighborhood with its own team, courtyard and activities." },
];

const areas: { key: Area; label: string }[] = [
  { key: "alder-bend", label: "Fairhollow" },
  { key: "kestrel-point", label: "Rivermead" },
  { key: "either", label: "Not sure yet" },
];

const result: Record<Need, { title: string; text: string }> = {
  independent: { title: "Independent Living", text: "A full apartment with its own kitchen and washer and dryer, with restaurants, classes and outings downstairs. If more help is needed later, Assisted Living Services come to the same apartment." },
  assisted: { title: "Independent Living with Assisted Living Services", text: "Help comes to the apartment from the resident services team, so nobody has to move to receive it. A personal assessment before move-in sets the care plan." },
  lantern: { title: "Lantern Memory Care", text: "A small, secure neighborhood inside the community, with its own courtyard, its own activity team and its own Events & Adventures calendar." },
};

/** "Find the right fit": three quick questions that point to a living option and a community, with its real prices and next steps. */
export function FitChooser({ communities }: { communities: FitCommunity[] }) {
  const { t } = useT();
  const id = useId();
  const [need, setNeed] = useState<Need | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [who, setWho] = useState<Who | null>(null);
  const done = need && area && who;
  const shown = area === "either" || !area ? communities : communities.filter((c) => c.slug === area);

  return (
    <div className="hc-fit">
      <form className="hc-fit-q" onSubmit={(e) => e.preventDefault()}>
        <fieldset>
          <legend>
            <span className="hc-step">1</span> {t("What does your parent need most right now?")}
          </legend>
          <div className="hc-options">
            {needs.map((n) => (
              <label key={n.key} className={`hc-option ${need === n.key ? "is-on" : ""}`}>
                <input type="radio" name={`${id}-need`} value={n.key} checked={need === n.key} onChange={() => setNeed(n.key)} />
                <span>
                  <b>{t(n.label)}</b>
                  <span>{t(n.note)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <span className="hc-step">2</span> {t("Where would they like to live?")}
          </legend>
          <div className="hc-options hc-options-row">
            {areas.map((a) => (
              <label key={a.key} className={`hc-option hc-chip ${area === a.key ? "is-on" : ""}`}>
                <input type="radio" name={`${id}-area`} value={a.key} checked={area === a.key} onChange={() => setArea(a.key)} />
                <b>{t(a.label)}</b>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <span className="hc-step">3</span> {t("Moving on their own, or as a couple?")}
          </legend>
          <div className="hc-options hc-options-row">
            {(
              [
                ["one", "On their own"],
                ["two", "As a couple"],
              ] as [Who, string][]
            ).map(([k, label]) => (
              <label key={k} className={`hc-option hc-chip ${who === k ? "is-on" : ""}`}>
                <input type="radio" name={`${id}-who`} value={k} checked={who === k} onChange={() => setWho(k)} />
                <b>{t(label)}</b>
              </label>
            ))}
          </div>
        </fieldset>
      </form>

      <div className="hc-fit-result" aria-live="polite">
        {!done ? (
          <div className="hc-fit-empty">
            <Icon name="spark" />
            <p>{t("Answer the three questions and we’ll show the living option and community that fit, with starting prices and the next step.")}</p>
          </div>
        ) : (
          <>
            <p className="hc-fit-kicker">{t("A good place to start")}</p>
            <h3>{t(result[need].title)}</h3>
            <p>{t(result[need].text)}</p>
            <ul className="hc-fit-cards">
              {shown.map((c) => (
                <li key={c.slug}>
                  <div className="hc-fit-name">
                    <b>{c.name}</b>
                    <span>{c.city}, CA</span>
                  </div>
                  <p className="hc-fit-price">{t(c.from[need === "assisted" ? "independent" : need])}</p>
                  {need === "assisted" && <p className="hc-fit-note">{t(`Assisted Living Services: ${c.from.assisted}`)}</p>}
                  {who === "two" && need !== "lantern" && <p className="hc-fit-note">{t(`No second-person fee: couples save about ${c.couplesSave} a year.`)}</p>}
                  <div className="hc-fit-links">
                    <a className="btn btn-sm" href={c.links.tour}>
                      {t("Book a tour")}
                    </a>
                    {need === "independent" ? (
                      <a className="btn btn-sm btn-ghost" href={c.links.plans}>
                        {t("Floor plans & prices")}
                      </a>
                    ) : (
                      <a className="btn btn-sm btn-ghost" href={c.links.assessment}>
                        {t("Care assessment")}
                      </a>
                    )}
                  </div>
                  <p className="hc-fit-call">
                    <a href={c.phoneHref}>
                      <Icon name="phone" /> {c.phone}
                    </a>{" "}
                    · {t(`ask for ${c.contact}`)}
                  </p>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="hc-reset"
              onClick={() => {
                setNeed(null);
                setArea(null);
                setWho(null);
              }}
            >
              {t("Start again")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
