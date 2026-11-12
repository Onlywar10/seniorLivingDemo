"use client";

// Website → Apartments and prices: every floor plan with what's included, its care level, starting price,
// availability and photos. Marking one open texts its waitlist, and the row says so. Price and availability changes
// go to the administrator before they show on the website; the administrator's own changes go live straight away.
// The price change waiting for approval is the same request as Today's "Pricing change" card: deciding it here or
// there clears both (useDecisions in ../store).
// Keeps the class names the /phones clips use (.pt-plans li, its first button "Mark one open", .pt-plan-f).
// Changes stay in this browser.
import { useState } from "react";
import { money } from "@/data/shared";
import type { PlanInfo } from "@/data/staff/website";
import { Icon } from "../../Icon";
import { say, useDecide, useDecisions } from "../store";
import { Badge } from "../ui";

type Change = { kind: "open" | "price"; from: number };
export interface PendingPrice { id: string; code: string; name: string; from: number; to: number; by: string; byYou: boolean; ago: string; why: string }

const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
const lower = (t: string) => t.replace(/^(Today|Yesterday)/, (x) => x.toLowerCase());

export function WebsiteApartments({ plans, approver, isApprover, pending }: { plans: PlanInfo[]; approver: string; isApprover: boolean; pending: PendingPrice | null }) {
  const [rows, setRows] = useState(plans);
  const [edit, setEdit] = useState<{ code: string; kind: Change["kind"] } | null>(null);
  const [price, setPrice] = useState("");
  const [waiting, setWaiting] = useState<Record<string, Change>>({});
  const [done, setDone] = useState<Record<string, string>>({});
  const decisions = useDecisions();
  const decide = useDecide();
  const appr = approver.split(" ")[0];

  const decision = pending ? decisions[pending.id] : undefined;
  const asked = pending && !decision ? pending : null;
  // An approved price change shows on its plan, wherever it was approved.
  const shown = rows.map((p) => (pending && decision === "approved" && p.code === pending.code && p.from === pending.from ? { ...p, from: pending.to } : p));

  const setRow = (code: string, f: (p: PlanInfo) => PlanInfo) => setRows((xs) => xs.map((x) => (x.code === code ? f(x) : x)));
  const note = (code: string, t: string | null) => setDone((d) => { const n = { ...d }; if (t) n[code] = t; else delete n[code]; return n; });

  const submit = (p: PlanInfo) => {
    if (!edit) return;
    const from = Number(price.replace(/\D/g, "")) || p.from;
    const c: Change = { kind: edit.kind, from };
    const before = p;
    setEdit(null);
    if (isApprover) {
      setRow(p.code, (x) => ({ ...x, from, available: c.kind === "open" ? x.available + 1 : x.available }));
      if (c.kind === "open") {
        // Texts can't be unsent, so there's no Undo here.
        const t = p.waiting ? `Marked open · ${people(p.waiting)} on the waitlist ${p.waiting === 1 ? "was" : "were"} texted` : "Marked open · nobody is on its waitlist yet";
        note(p.code, `${t}. It shows on the website from ${money(from)} a month.`);
        say(`${p.code}: ${t}`);
      } else {
        note(p.code, `New price live on the website: from ${money(from)} a month.`);
        say(`${p.code} now starts at ${money(from)} a month on the website`, () => { setRow(p.code, () => before); note(p.code, null); });
      }
    } else {
      setWaiting((w) => ({ ...w, [p.code]: c }));
      const undo = () => setWaiting((w) => { const n = { ...w }; delete n[p.code]; return n; });
      say(c.kind === "open"
        ? `Sent to ${appr} to approve. Once approved, ${p.code} shows as open${p.waiting ? ` and the ${people(p.waiting)} on its waitlist get a text` : ""}.`
        : `Sent to ${appr} to approve. The website shows ${money(p.from)} until then.`, undo);
    }
  };

  const decideNow = (ok: boolean) => {
    if (!asked) return;
    const who = asked.by.split(" ")[0];
    decide(asked.id, ok ? "approved" : "declined");
    const undo = () => decide(asked.id, null);
    say(ok ? `Approved. ${asked.code} now starts at ${money(asked.to)} a month on the website. ${who} was told.` : `Declined. ${asked.code} stays at ${money(asked.from)}. ${who} was told.`, undo);
  };

  return (
    <>
      {asked && (
        <div className={`ws-approve${isApprover ? "" : " mine"}`}>
          <p>
            <Icon name="clock" /> <span><b>{asked.code} · {asked.name}:</b> starting price from {money(asked.from)} to {money(asked.to)} a month.{" "}
              {isApprover
                ? `${asked.by} asked ${lower(asked.ago)}.`
                : `${asked.byYou ? "You" : asked.by} asked ${lower(asked.ago)}. Waiting for ${appr}; the website shows the old price until then.`}</span>
          </p>
          {asked.why && <small className="ws-approve-why">{asked.why}</small>}
          {isApprover && (
            <div className="pt-act">
              <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => decideNow(true)}><Icon name="check" /> Approve</button>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => decideNow(false)}>Decline</button>
              <small className="ws-approve-also">Also on Today. Deciding here clears it there.</small>
            </div>
          )}
        </div>
      )}
      <ul className="pt-plans ws-plans">
        {shown.map((p) => {
          const w = waiting[p.code];
          const editing = edit?.code === p.code;
          return (
            <li key={p.code}>
              <span className="pt-plan-t">
                <b>{p.code} · {p.name}</b>
                <small>{p.care} · {p.beds ? `${p.beds} bedroom${p.beds > 1 ? "s" : ""}` : "Studio"}{p.sqft ? ` · ${p.sqft.toLocaleString("en-US")} sq ft` : ""} · {p.from ? `from ${money(p.from)} a month` : "price on request"}</small>
              </span>
              <span className="pt-plan-s">
                {p.available ? <Badge tone="good">{p.available} open</Badge> : <Badge>None open</Badge>}
                {p.waiting > 0 && <small>{p.waiting} waiting</small>}
              </span>
              {editing ? (
                <form className="pt-plan-f" onSubmit={(e) => { e.preventDefault(); submit(p); }}>
                  <label>
                    <span className="vh">Starting price a month</span>
                    <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(p.from)} aria-label={`Starting price for ${p.code}`} />
                  </label>
                  <button type="submit" className="sx-btn sx-btn-primary sx-btn-sm">
                    <Icon name="check" /> {edit.kind === "open" ? (isApprover ? "Mark open" : "Mark open: ask to approve") : isApprover ? "Save price" : "Ask to approve"}
                  </button>
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => setEdit(null)}>Cancel</button>
                  <small className="ws-plan-why">
                    {!isApprover
                      ? `Approval needed: ${appr}`
                      : edit.kind === "open"
                        ? p.waiting ? `Shows on the website straight away and texts the ${people(p.waiting)} on its waitlist.` : "Shows on the website straight away. Nobody is on its waitlist yet."
                        : "Shows on the website straight away."}
                  </small>
                </form>
              ) : w ? (
                <span className="ws-plan-wait"><Badge tone="warn"><Icon name="clock" /> Waiting for {appr}</Badge> <small>{w.kind === "open" ? `Open from ${money(w.from)}` : `New price ${money(w.from)}`}</small></span>
              ) : (
                <span className="ws-plan-a">
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setEdit({ code: p.code, kind: "open" }); setPrice(String(p.from)); }}>Mark one open</button>
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setEdit({ code: p.code, kind: "price" }); setPrice(String(p.from)); }}>Change price</button>
                </span>
              )}
              {done[p.code] && <p className="ws-done ws-plan-done" role="status"><Icon name="check" /> {done[p.code]}</p>}
              <details className="ws-plan-d">
                <summary>What’s included and photos</summary>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <small>{p.photos} photos and the floor plan drawing{p.render ? ", plus a furnished 3D plan" : ""} on the floor plans page.</small>
              </details>
            </li>
          );
        })}
      </ul>
    </>
  );
}
