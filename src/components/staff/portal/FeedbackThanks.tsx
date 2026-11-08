"use client";

// Feedback → Thank-yous: family replies that thank staff, passed to the staff member named and counted on the
// scorecard. Changes stay in this browser.
import { useState } from "react";
import type { ThankYou } from "@/data/staff/engage";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

const first = (n = "") => n.split(" ")[0];

export function FeedbackThanks({ items }: { items: ThankYou[] }) {
  const [rows, setRows] = useState(items);
  return (
    <ul className="sx-list fb-thanks">
      {rows.map((t) => (
        <li key={t.id}>
          <p className="pt-quote">“{t.text}”</p>
          <small>{t.from}, {t.relation.toLowerCase()} of {t.resident} · {t.ago} · for {t.staffName}</small>
          {t.passed ? (
            <Badge tone="good"><Icon name="check" /> Passed to {first(t.staffName)}</Badge>
          ) : (
            <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" onClick={() => setRows((xs) => xs.map((x) => (x.id === t.id ? { ...x, passed: true } : x)))}>
              <Icon name="heart" /> Pass it to {first(t.staffName)}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
