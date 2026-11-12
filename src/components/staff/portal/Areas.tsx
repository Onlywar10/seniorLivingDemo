"use client";

// Settings → Who looks after whom. The administrator turns the layer on or off, sees each area (a floor, a wing,
// Lantern) with the person who looks after it, and places any resident who isn't in an area yet. Saved in this
// browser (cookies), so every screen routes the same way. Engagement and communication only: nothing clinical.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AREAS_COOKIE, ASSIGN_COOKIE } from "@/data/staff/shared";
import { Icon } from "../../Icon";
import { say } from "../store";
import { Badge } from "../ui";
import { Help } from "./Help";

export interface AreaRow { key: string; name: string; note: string; lead: string; leadRole: string; count: number; lantern?: boolean }
export interface Unplaced { name: string; apt: string; reason?: string }

const YEAR = 60 * 60 * 24 * 365;
/** Kept in a cookie so the server builds every screen with the same routing. */
function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${YEAR}; samesite=lax`;
}

export function AreasSettings({ on, areas, unplaced, placed }: { on: boolean; areas: AreaRow[]; unplaced: Unplaced[]; placed: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pick, setPick] = useState<Record<string, string>>({});
  const refresh = () => start(() => router.refresh());
  const toggle = () => {
    setCookie(AREAS_COOKIE, on ? "off" : "on");
    say(on ? "Turned off. Everything goes to roles again." : "Turned on. Each resident’s items now go to the person who looks after them.");
    refresh();
  };
  const place = (name: string) => {
    const area = pick[name];
    if (!area) return;
    const next = { ...placed, [name]: area };
    setCookie(ASSIGN_COOKIE, encodeURIComponent(JSON.stringify(next)));
    const a = areas.find((x) => x.key === area);
    say(`${name.split(" ")[0]} is in ${a?.name}, looked after by ${a?.lead.split(" ")[0]}.`);
    refresh();
  };

  return (
    <div className="ar" aria-busy={pending || undefined}>
      <div className="ar-switch">
        <div>
          <b>{on ? "On" : "Off"}</b>
          <p className="sx-hint">{on
            ? "Asks in person, invites, “We haven’t seen lately”, welcome checklists and family requests go to whoever looks after the resident. Lantern residents go to the Lantern team."
            : "Everything goes to roles, as it does now. Turn it on when caregivers or area leads each look after a set group of residents."}</p>
        </div>
        <button type="button" role="switch" aria-checked={on} className={`ar-toggle${on ? " on" : ""}`} onClick={toggle} disabled={pending}>
          <span aria-hidden="true" />
          <span className="vh">Who looks after whom</span>
        </button>
      </div>

      {on && (
        <>
          {unplaced.length > 0 ? (
            <div className="ar-unplaced" role="region" aria-label="Residents not in an area yet">
              <p className="ar-warn"><Icon name="alert" /> <b>{unplaced.length} {unplaced.length === 1 ? "resident isn’t" : "residents aren’t"} in an area yet.</b> Until then, their items come to you.</p>
              <ul>
                {unplaced.map((u) => (
                  <li key={u.name}>
                    <span><b>{u.name}</b><small>Apt {u.apt}{u.reason ? ` · ${u.reason}` : ""}</small></span>
                    <span className="ar-place">
                      <label><span className="vh">Area for {u.name}</span>
                        <select value={pick[u.name] ?? ""} onChange={(e) => setPick((p) => ({ ...p, [u.name]: e.target.value }))}>
                          <option value="">Choose an area</option>
                          {areas.filter((a) => !a.lantern).map((a) => <option key={a.key} value={a.key}>{a.name} · {a.lead}</option>)}
                        </select>
                      </label>
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-primary" disabled={!pick[u.name] || pending} onClick={() => place(u.name)}>Place</button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="ar-ok"><Icon name="check" /> Every resident is in an area with someone looking after them.</p>
          )}

          <ul className="ar-areas">
            {areas.map((a) => (
              <li key={a.key}>
                <span><b>{a.name}</b>{a.lantern && <Badge tone="info">Lantern team</Badge>}<small>{a.note}</small></span>
                <span><b>{a.lead}</b><small>{a.leadRole}</small></span>
                <span className="ar-n">{a.count} residents</span>
              </li>
            ))}
          </ul>
          <div className="sx-hint ar-note">
            Engagement and communication only. Medication, care plans and clinical notes stay in the community’s care systems, never here.
            <Help label="What changes when it’s on" align="end">
              <ul>
                <li><b>Today:</b> “Needs you” shows each person their own residents’ asks, family requests and new family members.</li>
                <li><b>People:</b> “My residents” at the top, with interests, life story, participation, family, recent notes and 1:1 visits.</li>
                <li><b>Care partners</b> can sign in with the Caregiver role: Today and People, for their residents only.</li>
              </ul>
            </Help>
          </div>
        </>
      )}
    </div>
  );
}
