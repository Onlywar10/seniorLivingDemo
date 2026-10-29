"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { SmsConsent } from "./bits";

/** Wraps a form: on submit it validates natively, then swaps to a confirmation. */
function useDone() {
  const [done, setDone] = useState<Record<string, string> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries([...new FormData(e.currentTarget).entries()].map(([k, v]) => [k, String(v)]));
    setDone(data);
    requestAnimationFrame(() => ref.current?.focus());
  };
  return { done, setDone, ref, submit };
}

function Done({ innerRef, title, children, onReset, resetLabel }: { innerRef: React.RefObject<HTMLDivElement | null>; title: string; children: ReactNode; onReset?: () => void; resetLabel?: string }) {
  return (
    <div className="success inf-done" ref={innerRef} tabIndex={-1} role="status">
      <Icon name="check" />
      <div>
        <h3>{title}</h3>
        {children}
        {onReset && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
            {resetLabel ?? "Send another"}
          </button>
        )}
      </div>
    </div>
  );
}

const interestOptions = ["Independent Living", "Assisted Living Services", "Harbor Memory Care", "Not sure yet", "Something else"];
const heardOptions = ["Choose one", "Google or another search", "A friend or family member", "A resident", "My doctor, hospital or care advisor", "Facebook", "Driving past", "Folsom Telegraph or Style Magazine", "An event at the community", "Other"];

export function EnquiryForm({ phone }: { phone: string }) {
  const { done, setDone, ref, submit } = useDone();
  const [method, setMethod] = useState("Phone");
  if (done) {
    const first = (done.name ?? "").split(" ")[0];
    return (
      <Done innerRef={ref} title={`Thank you${first ? ", " + first : ""}. We’ve got your message.`} onReset={() => setDone(null)}>
        <p>
          Cynthia Bazin or a member of our team will reach out by {method.toLowerCase()} within one business day — usually much sooner. If it’s urgent,
          call {phone}.
        </p>
      </Done>
    );
  }
  return (
    <form className="form-grid ct-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="ct-name">Name</label>
        <input id="ct-name" name="name" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="ct-phone">Phone</label>
        <input id="ct-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required={method !== "Email"} />
      </div>
      <div className="field full">
        <label htmlFor="ct-email">Email</label>
        <input id="ct-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="ct-interest">I’m interested in</label>
        <select id="ct-interest" name="interest" defaultValue="Independent Living">
          {interestOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="ct-heard">How did you hear about us?</label>
        <select id="ct-heard" name="heard" defaultValue="Choose one">
          {heardOptions.map((o) => (
            <option key={o} value={o === "Choose one" ? "" : o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="field full">
        <label htmlFor="ct-msg">Message</label>
        <textarea id="ct-msg" name="message" placeholder="Tell us what you’d like to know." />
      </div>
      <fieldset className="full inf-radios">
        <legend>Best way to reach you</legend>
        {["Phone", "Email", "Text"].map((m) => (
          <label key={m} className={`inf-radio ${method === m ? "on" : ""}`}>
            <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} />
            {m}
          </label>
        ))}
      </fieldset>
      <div className="full">
        <SmsConsent id="ct-sms" purpose="my enquiry and visits" />
      </div>
      <div className="full">
        <button className="btn btn-lg" type="submit">
          Send message <Icon name="send" />
        </button>
      </div>
    </form>
  );
}

export interface Opening { title: string; dept: string; type: string; pay: string }

export function CareersApply({ openings }: { openings: Opening[] }) {
  const [pos, setPos] = useState(openings[0].title);
  const choose = (t: string) => {
    setPos(t);
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => document.getElementById("cr-name")?.focus({ preventScroll: true }), 500);
  };
  return (
    <div className="cr-apply">
      <ul className="cr-openings">
        {openings.map((o) => (
          <li key={o.title} className="card cr-opening">
            <div>
              <span className="pill pill-sky">{o.dept}</span>
              <h3>{o.title}</h3>
              <p className="small muted">{o.type}</p>
            </div>
            <div className="cr-opening-side">
              <b>{o.pay}</b>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => choose(o.title)} aria-label={`Apply for ${o.title}`}>
                Apply <Icon name="arrow" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="card card-pad cr-form-card" id="apply">
        <h3>Apply now</h3>
        <p className="small muted">It takes about ten minutes. All fields are required unless marked optional.</p>
        <ApplyForm positions={openings.map((o) => o.title)} pos={pos} setPos={setPos} />
      </div>
    </div>
  );
}

function ApplyForm({ positions, pos, setPos }: { positions: string[]; pos: string; setPos: (v: string) => void }) {
  const { done, setDone, ref, submit } = useDone();
  if (done) {
    const first = (done.name ?? "").split(" ")[0];
    return (
      <Done innerRef={ref} title={`Thanks${first ? ", " + first : ""} — your application is in.`} onReset={() => setDone(null)} resetLabel="Apply for another role">
        <p>
          We’ve received your application for <b>{done.position}</b>. Our recruiter will review it and, if it’s a fit, call you for a short phone screen —
          usually within three business days. A copy is on its way to {done.email}.
        </p>
      </Done>
    );
  }
  return (
    <form className="form-grid cr-form" onSubmit={submit}>
      <div className="field full">
        <label htmlFor="cr-pos">Position</label>
        <select id="cr-pos" name="position" required value={pos} onChange={(e) => setPos(e.target.value)}>
          {positions.map((p) => (
            <option key={p}>{p}</option>
          ))}
          <option>General application</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="cr-name">Full name</label>
        <input id="cr-name" name="name" autoComplete="name" required />
      </div>
      <div className="field">
        <label htmlFor="cr-phone">Phone</label>
        <input id="cr-phone" name="phone" type="tel" autoComplete="tel" required />
      </div>
      <div className="field full">
        <label htmlFor="cr-email">Email</label>
        <input id="cr-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="cr-avail">Availability</label>
        <select id="cr-avail" name="availability" defaultValue="Full-time">
          {["Full-time", "Part-time", "Weekends only", "On call", "Flexible"].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="cr-start">Earliest start date</label>
        <input id="cr-start" name="start" type="date" />
      </div>
      <div className="field full">
        <label htmlFor="cr-cv">Résumé (optional)</label>
        <input id="cr-cv" name="cv" type="file" accept=".pdf,.doc,.docx" />
      </div>
      <div className="field full">
        <label htmlFor="cr-about">Tell us a little about yourself</label>
        <textarea id="cr-about" name="about" placeholder="Experience, certifications (CNA, Med Tech, ServSafe…), and what draws you to senior living." />
      </div>
      <div className="full">
        <button className="btn btn-lg" type="submit">
          Submit application <Icon name="send" />
        </button>
      </div>
    </form>
  );
}
