"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { money, planKindLabel, type Plan, type PlanKind } from "@/data/site";
import { FloorPlan } from "./FloorPlan";
import { AlertSignup } from "./AlertSignup";
import { availability, bathLabel, bedLabel } from "./data";

type KindFilter = "all" | PlanKind;
type BedFilter = "any" | "0" | "1" | "2";

const KINDS: [KindFilter, string][] = [
  ["all", "All plans"],
  ["independent", "Independent"],
  ["assisted", "Assisted"],
  ["harbor", "Harbor"],
];
const BEDS: [BedFilter, string][] = [
  ["any", "Any size"],
  ["0", "Studio"],
  ["1", "1 bedroom"],
  ["2", "2 bedrooms"],
];

export function PlanBrowser({ plans, initialKind = "all" }: { plans: Plan[]; initialKind?: KindFilter }) {
  const [kind, setKind] = useState<KindFilter>(initialKind);
  const [beds, setBeds] = useState<BedFilter>("any");
  const [openOnly, setOpenOnly] = useState(false);

  const shown = useMemo(
    () =>
      plans.filter(
        (p) =>
          (kind === "all" || p.kind === kind) &&
          (beds === "any" || (p.kind !== "harbor" && String(p.beds) === beds) || (beds === "0" && p.kind === "harbor")) &&
          (!openOnly || p.available > 0)
      ),
    [plans, kind, beds, openOnly]
  );
  const openCount = shown.reduce((s, p) => s + p.available, 0);

  return (
    <div className="fp-browser">
      <div className="fp-filters" role="group" aria-label="Filter floor plans">
        <div className="fp-seg" role="group" aria-label="Living option">
          {KINDS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="fp-seg" role="group" aria-label="Bedrooms">
          {BEDS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={beds === k} onClick={() => setBeds(k)}>
              {l}
            </button>
          ))}
        </div>
        <label className="check fp-openonly">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
          <span>Available now only</span>
        </label>
      </div>
      <p className="fp-count" aria-live="polite">
        {shown.length === 0
          ? "No floor plans match. Try another size, or ask Cynthia about the waitlist."
          : `${shown.length} floor plan${shown.length === 1 ? "" : "s"} · ${openCount} apartment${openCount === 1 ? "" : "s"} available now`}
      </p>

      <ul className="fp-grid">
        {shown.map((p) => {
          const a = availability(p);
          return (
            <li key={p.code} className={`fp-card fp-k-${p.kind}`}>
              <div className="fp-card-top">
                <span className={`fp-kind fp-kind-${p.kind}`}>{planKindLabel[p.kind]}</span>
                <span className={`fp-badge fp-badge-${a.tone}`}>
                  <span className="fp-badge-dot" aria-hidden="true" />
                  {a.text}
                </span>
              </div>
              <Link href={`/floor-plans/${p.code}`} className="fp-card-plan" aria-label={`${p.code} ${p.name}: floor plan and virtual tour`}>
                <FloorPlan plan={p} />
              </Link>
              <div className="fp-card-body">
                <h3>
                  <Link href={`/floor-plans/${p.code}`}>
                    <span className="fp-code" data-no-translate>
                      {p.code}
                    </span>{" "}
                    {p.name}
                  </Link>
                </h3>
                <ul className="fp-facts">
                  <li>{bedLabel(p)}</li>
                  <li>{bathLabel(p)}</li>
                  {p.sqft && <li>{p.sqft.toLocaleString("en-US")} sq ft</li>}
                  {p.balcony && <li>Balcony</li>}
                </ul>
                <p className="fp-price">
                  {p.from ? (
                    <>
                      <span>From</span> <strong>{money(p.from)}</strong>
                      <span>/month</span>
                    </>
                  ) : (
                    <strong className="fp-price-req">Price on request</strong>
                  )}
                </p>
                <div className="fp-card-actions">
                  <Link href={`/floor-plans/${p.code}#tour`} className="btn btn-sm">
                    <Icon name="eye" /> Virtual tour
                  </Link>
                  <Link href={`/floor-plans/${p.code}`} className="link-arrow">
                    Details <Icon name="arrow" />
                  </Link>
                </div>
                <AlertSignup code={p.code} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
