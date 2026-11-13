"use client";

// Remove a resident: one short screen. It always confirms which resident and why before anything changes: passed
// away, moved out, or moved to another care area (which isn't a removal: it moves them, into Lantern for example).
// The date, then what happens straight away, worked out for this resident: their automatic messages stop, they come
// off upcoming events (anyone waiting gets the seat), the newsletter, birthdays and photo suggestions; open requests
// and "ask in person" items close. Their apartment shows as available in Apartments only when the front desk marks it open.
// Then each family contact: keep the community news, stop everything, or one gentle message (staff can edit it; it's
// approved before it goes, and never automatic). No second person is needed; it's recorded with who and when.
import { useState } from "react";
import type { RemovalPlan } from "@/data/staff/removal";
import type { StaffRole } from "@/data/staff/shared";
import { Icon } from "../../Icon";
import { useAutoActions } from "../autoStore";
import { useRemove, type FamilyChoice, type Why } from "../removedStore";
import { say, useMoveCard } from "../store";
import { Initials } from "../ui";
import { Drawer } from "./Drawer";

const first = (n = "") => n.split(" ")[0];

export function RemoveResident({ plan, me, as, admin, approver, community, phone, todayIso, onClose }: {
  plan: RemovalPlan; me: string; as: StaffRole; admin: boolean; approver: string; community: string; phone: string; todayIso: string; onClose: () => void;
}) {
  const fn = first(plan.name);
  const [why, setWhy] = useState<Why | "">("");
  const [when, setWhen] = useState(todayIso);
  const [area, setArea] = useState(plan.areas.includes("Lantern") ? "Lantern" : plan.areas[0]);
  const gentle = (w: Why | "", to: string) => w === "passed"
    ? `Dear ${first(to)}, all of us at ${community} are thinking of you and your family. ${fn} brought so much warmth here, and we will miss them very much. If there is anything we can do, please call us at ${phone}.`
    : `Dear ${first(to)}, thank you for being part of ${community}. We’ll miss ${fn}, and we wish you all the very best. You’re always welcome to visit.`;
  const [fam, setFam] = useState(() => plan.family.filter((m) => m.status !== "Stopped").map((m) => ({ name: m.name, relation: m.relation, choice: "news" as FamilyChoice, message: "" })));
  const remove = useRemove();
  const auto = useAutoActions(me);
  const move = useMoveCard();
  const moving = why === "moved-area";
  const ready = !!why && !!when && (moving || fam.every((m) => m.choice !== "gentle" || m.message.trim()));

  const confirm = () => {
    if (!why) return;
    const at = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");
    remove.set({ name: plan.name, why, when, by: me, at, area: moving ? area : undefined, family: moving ? [] : fam.map((m) => ({ name: m.name, choice: m.choice, message: m.choice === "gentle" ? m.message : undefined, status: m.choice === "gentle" ? (admin ? "sent" : "waiting") : undefined })) });
    if (!moving) {
      auto.record({ auto: "", did: "stopped", reason: `${plan.name}: ${why === "passed" ? "passed away" : "moved out"}, ${when}`, note: `${plan.autoTotal} messages last week about them and their family; ${fam.filter((m) => m.choice === "news").length} family contacts keep the community news` });
      plan.cards.forEach((id) => move(id, { done: true }, { signal: "ask", who: as, kind: "done" }));
    } else if (area === "Lantern") {
      auto.record({ auto: "", did: "stopped", reason: `${plan.name} moved to Lantern, ${when}`, note: "No more texts to them for requests; asked in person instead. Their family keeps everything." });
    }
    const gentleN = fam.filter((m) => m.choice === "gentle").length;
    say(moving
      ? `${fn} moved to ${area}. Recorded with your name.`
      : `${fn} removed. Every automatic message about them has stopped.${gentleN ? admin ? ` ${gentleN === 1 ? "The gentle message is" : `${gentleN} gentle messages are`} on the way.` : ` ${gentleN === 1 ? "The gentle message waits" : `${gentleN} gentle messages wait`} for ${first(approver)} to approve.` : ""} Recorded with your name.`, () => remove.undo(plan.name));
    onClose();
  };

  return (
    <Drawer title={`Remove ${plan.name}?`} sub="Nothing changes until you confirm." onClose={onClose} wide
      foot={<div className="pt-act"><button type="button" className="sx-btn sx-btn-terra" disabled={!ready} onClick={confirm}>{moving ? `Move ${fn} to ${area}` : `Remove ${fn}`}</button><button type="button" className="sx-btn" onClick={onClose}>Cancel</button></div>}>
      <div className="sx-form rr">
        <div className="rr-who">
          <Initials name={plan.name} size={48} color={plan.lantern ? "var(--c-lantern, #8a5aa6)" : "var(--slate)"} />
          <span><b>{plan.name}</b><small>{plan.lantern ? plan.apt : `Apt ${plan.apt}`} · {plan.current}</small></span>
        </div>

        <fieldset className="rr-why">
          <legend>Why?</legend>
          {([["passed", "Passed away"], ["moved-out", "Moved out"], ["moved-area", "Moved to another care area"]] as [Why, string][]).map(([k, l]) => (
            <label key={k} className={`rr-opt${why === k ? " on" : ""}`}><input type="radio" name="rr-why" checked={why === k} onChange={() => setWhy(k)} /> {l}{k === "moved-area" && <small>This isn’t a removal: it moves them.</small>}</label>
          ))}
        </fieldset>

        <div className="sx-row">
          <label>When<input type="date" value={when} max={todayIso} onChange={(e) => setWhen(e.target.value)} /></label>
          {moving && <label>Moving to<select value={area} onChange={(e) => setArea(e.target.value)}>{plan.areas.map((a) => <option key={a}>{a}</option>)}</select></label>}
        </div>

        {why && !moving && (
          <section className="rr-what" aria-label="What happens straight away">
            <h3>What happens straight away</h3>
            <ul>
              <li><Icon name="sms" /><span><b>Every automatic message about {fn} stops</b>: invites, reminders, “Your week”, family updates about them, celebrations and dining bookings{plan.autos.length ? ` (${plan.autoTotal} last week: ${plan.autos.slice(0, 4).map((a) => a.name).join("; ")}${plan.autos.length > 4 ? "…" : ""})` : ""}.</span></li>
              <li><Icon name="calendar" /><span><b>{plan.events.length ? `Taken off ${plan.events.length} upcoming ${plan.events.length === 1 ? "event" : "events"}` : "No upcoming events booked"}</b>{plan.events.length > 0 && <>: {plan.events.map((e) => `${e.title} (${e.when})${e.seatTo ? `, the seat goes to ${e.seatTo}` : ""}`).join("; ")}.</>}</span></li>
              <li><Icon name="mail" /><span><b>Out of the newsletter, birthdays and photo suggestions</b>{plan.celebrations.length ? ` (${plan.celebrations.join(", ")})` : ""}{plan.photos.length ? `; no longer suggested in photos: ${plan.photos.join(", ")}` : ""}.</span></li>
              <li><Icon name="check" /><span><b>{plan.requests.length + plan.cards.length ? "Open requests and “ask in person” items about them close" : "No open requests about them"}</b>{plan.requests.length ? `: ${plan.requests.join("; ")}` : ""}{plan.cards.length ? `. ${plan.cards.length} ${plan.cards.length === 1 ? "card leaves" : "cards leave"} Today.` : ""}</span></li>
              <li><Icon name="home" /><span><b>{plan.lantern ? plan.apt : `Apt ${plan.apt}`} shows as available in Apartments only if the front desk marks it open.</b> Never automatically.</span></li>
            </ul>
          </section>
        )}
        {moving && (
          <section className="rr-what" aria-label="What changes">
            <h3>What changes</h3>
            <ul>
              <li><Icon name="users" /><span><b>{fn} stays in People</b>, now in {area}. Their family, history and notes stay as they are.</span></li>
              {area === "Lantern" ? (
                <li><Icon name="heart" /><span><b>No more texts to {fn} for requests.</b> Family requests are asked in person by the Lantern team, or go to their legal representative{plan.legal ? ` (${plan.legal})` : ""}. Their messages come from the Lantern calendar.</span></li>
              ) : <li><Icon name="calendar" /><span><b>Their invites follow the {area} calendar</b> from the date you choose.</span></li>}
              <li><Icon name="check" /><span>Nothing is sent to the family about the move automatically.</span></li>
            </ul>
          </section>
        )}

        {why && !moving && (
          <section className="rr-fam" aria-label="Their family contacts">
            <h3>Their family contacts</h3>
            {!fam.length && <p className="sx-hint">No family contacts on file.</p>}
            {fam.map((m, i) => (
              <div key={m.name} className="rr-member">
                <p><b>{m.name}</b> <small>{m.relation}</small></p>
                <div className="sx-seg" role="group" aria-label={`${m.name}: what happens`}>
                  {([["news", "Keep the community news"], ["stop", "Stop everything"], ["gentle", "One gentle message"]] as [FamilyChoice, string][]).map(([k, l]) => (
                    <button key={k} type="button" aria-pressed={m.choice === k} onClick={() => setFam((xs) => xs.map((x, j) => (j === i ? { ...x, choice: k, message: k === "gentle" && !x.message ? gentle(why, x.name) : x.message } : x)))}>{l}</button>
                  ))}
                </div>
                {m.choice === "news" && <small className="sx-hint">Some families like to stay in touch. They keep the Sunday email and midweek news; nothing about {fn}.</small>}
                {m.choice === "gentle" && (
                  <label>The message, in your words <span className="sx-hint">{admin ? "You approve messages, so it goes when you confirm." : `It goes to ${first(approver)} to approve before it’s sent. Never automatic.`} Then nothing else is sent.</span>
                    <textarea value={m.message} onChange={(e) => setFam((xs) => xs.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))} rows={4} />
                  </label>
                )}
              </div>
            ))}
          </section>
        )}
        <p className="sx-hint">A second person isn’t needed. This is recorded with your name ({me}) and the time.</p>
      </div>
    </Drawer>
  );
}
