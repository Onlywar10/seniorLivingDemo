"use client";

// Website → Apartments and prices: every floor plan with what's included, its care level, starting price,
// availability and photos. Marking one open alerts its waitlist. Price and availability changes go to the
// administrator before they show on the website; the administrator's own changes go live straight away.
// Keeps the class names the /phones clips use (.pt-plans li, its first button "Mark one open", .pt-plan-f).
// Changes stay in this browser.
import { useState } from "react";
import { money } from "@/data/shared";
import type { PlanInfo } from "@/data/staff/website";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

type Change = { kind: "open" | "price"; from: number };
export interface PendingPrice { code: string; name: string; from: number; to: number; by: string; ago: string }

export function WebsiteApartments({ plans, approver, isApprover, pending: seeded }: { plans: PlanInfo[]; approver: string; isApprover: boolean; pending: PendingPrice | null }) {
  const [rows, setRows] = useState(plans);
  const [edit, setEdit] = useState<{ code: string; kind: Change["kind"] } | null>(null);
  const [price, setPrice] = useState("");
  const [waiting, setWaiting] = useState<Record<string, Change>>({});
  const [asked, setAsked] = useState<PendingPrice | null>(seeded);
  const [toast, setToast] = useState("");
  const appr = approver.split(" ")[0];

  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 5000); };
  const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

  const apply = (p: PlanInfo, c: Change) => {
    setRows((xs) => xs.map((x) => (x.code === p.code ? { ...x, from: c.from, available: c.kind === "open" ? x.available + 1 : x.available } : x)));
  };

  const submit = (p: PlanInfo) => {
    if (!edit) return;
    const from = Number(price.replace(/\D/g, "")) || p.from;
    const c: Change = { kind: edit.kind, from };
    setEdit(null);
    if (isApprover) {
      apply(p, c);
      if (c.kind === "open") say(p.waiting ? `${p.code} is open from ${money(from)} a month and on the website. The ${people(p.waiting)} on its waitlist got a text and an email.` : `${p.code} is open from ${money(from)} a month and on the website.`);
      else say(`${p.code} now starts at ${money(from)} a month on the website.`);
    } else {
      setWaiting((w) => ({ ...w, [p.code]: c }));
      say(c.kind === "open"
        ? `Sent to ${appr} to approve. When ${appr} does, ${p.code} shows as open from ${money(from)}${p.waiting ? ` and the ${people(p.waiting)} on its waitlist get a text and an email` : ""}.`
        : `Sent to ${appr} to approve. The website keeps showing ${money(p.from)} until then.`);
    }
  };

  const decide = (ok: boolean) => {
    if (!asked) return;
    const p = rows.find((x) => x.code === asked.code);
    if (ok && p) apply(p, { kind: "price", from: asked.to });
    say(ok ? `Approved. ${asked.code} now starts at ${money(asked.to)} a month on the website. ${asked.by.split(" ")[0]} was told.` : `Declined. ${asked.code} stays at ${money(asked.from)}. ${asked.by.split(" ")[0]} was told.`);
    setAsked(null);
  };

  return (
    <>
      {asked && (
        <div className={`ws-approve${isApprover ? "" : " mine"}`}>
          <p>
            <Icon name="clock" /> <span><b>{asked.code} · {asked.name}:</b> starting price from {money(asked.from)} to {money(asked.to)} a month.{" "}
              {isApprover ? `${asked.by} asked ${asked.ago.toLowerCase()}.` : `You asked ${asked.ago.toLowerCase()}. Waiting for ${appr}; the website shows the old price until then.`}</span>
          </p>
          {isApprover && (
            <div className="pt-act">
              <button type="button" className="sx-btn sx-btn-primary sx-btn-sm" onClick={() => decide(true)}><Icon name="check" /> Approve</button>
              <button type="button" className="sx-btn sx-btn-sm" onClick={() => decide(false)}>Decline</button>
            </div>
          )}
        </div>
      )}
      <ul className="pt-plans ws-plans">
        {rows.map((p) => {
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
                  {!isApprover && <small className="ws-plan-why">Prices and availability go to {appr} before they show.</small>}
                </form>
              ) : w ? (
                <span className="ws-plan-wait"><Badge tone="warn"><Icon name="clock" /> Waiting for {appr}</Badge> <small>{w.kind === "open" ? `Open from ${money(w.from)}` : `New price ${money(w.from)}`}</small></span>
              ) : (
                <span className="ws-plan-a">
                  <button type="button" className="sx-btn sx-btn-sm" onClick={() => { setEdit({ code: p.code, kind: "open" }); setPrice(String(p.from)); }}>Mark one open</button>
                  <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => { setEdit({ code: p.code, kind: "price" }); setPrice(String(p.from)); }}>Change price</button>
                </span>
              )}
              <details className="ws-plan-d">
                <summary>What’s included and photos</summary>
                <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
                <small>{p.photos} photos and the floor plan drawing{p.render ? ", plus a furnished 3D plan" : ""} on the floor plans page.</small>
              </details>
            </li>
          );
        })}
      </ul>
      {toast && <div className="sx-toast" role="status"><Icon name="check" /> {toast}</div>}
    </>
  );
}
