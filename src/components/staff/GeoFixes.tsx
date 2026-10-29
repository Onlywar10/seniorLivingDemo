"use client";

import { useState } from "react";
import type { WrongFact } from "@/data/staff";
import { Icon } from "../Icon";
import { Badge } from "./ui";

const engineColor: Record<string, string> = { ChatGPT: "#2f7a62", "Google AI Overviews": "#4c87a2", Perplexity: "#425968", Gemini: "#6b5aa6" };
const tone = { fixed: "good", "in progress": "warn", monitoring: "info" } as const;
const label = { fixed: "Fixed", "in progress": "In progress", monitoring: "Monitoring" };

export function GeoFixes({ facts }: { facts: (WrongFact & { when: string })[] }) {
  const [sent, setSent] = useState<Record<string, "busy" | "done">>({});
  return (
    <div>
      {facts.map((f) => {
        const s = sent[f.id];
        return (
          <article key={f.id} className="wrongf">
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
              <div className="geo-flags">
                {f.engines.map((e) => (
                  <span key={e} className="eng" style={{ background: engineColor[e] }}>
                    {e}
                  </span>
                ))}
                <span>Source AI is reading: {f.source}</span>
              </div>
              <p className="wrongf-claim">
                AI says: <s>{f.claim}</s>
              </p>
              <p className="wrongf-truth">
                <Icon name="check" /> {f.truth}
              </p>
              <div className="wrongf-fix">
                <Icon name="wand" />
                <span>
                  <b>Fix: </b>
                  {f.fix}{" "}
                  <a className="sx-link" href={f.fixUrl} target="_blank" rel="noopener">
                    {f.fixUrl}
                  </a>
                </span>
              </div>
            </div>
            <div className="wrongf-side">
              <Badge tone={s === "done" ? "warn" : tone[f.status]}>{s === "done" ? "In progress" : label[f.status]}</Badge>
              <span className="sx-hint">{s === "done" ? "Correction published just now" : `Updated ${f.when}`}</span>
              {f.status !== "fixed" &&
                (s === "done" ? (
                  <span className="sx-hint" role="status">
                    <Icon name="check" /> Recrawl requested from Google and Bing. We’ll re-check all four AI engines tomorrow.
                  </span>
                ) : (
                  <button
                    type="button"
                    className="sx-btn sx-btn-sm sx-btn-primary"
                    disabled={s === "busy"}
                    onClick={() => {
                      setSent((x) => ({ ...x, [f.id]: "busy" }));
                      window.setTimeout(() => setSent((x) => ({ ...x, [f.id]: "done" })), 900);
                    }}
                  >
                    <Icon name="send" /> {s === "busy" ? "Publishing…" : "Publish correction"}
                  </button>
                ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
