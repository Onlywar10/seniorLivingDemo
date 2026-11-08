"use client";

// Import a month: upload or photograph the paper calendar, Kinlight reads every event, spots the repeating ones and
// flags anything it wasn't sure about ("312 events read, 6 to check"). Staff fix the few flagged items and add the
// month: about 15 minutes instead of a day of typing. Shown in this browser only.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ImportSetup } from "@/data/staff/post";
import { Icon } from "../../Icon";
import { Badge } from "../ui";
import { Done } from "./PostBits";

const steps = ["Finding the days", "Reading each event", "Matching rooms and times", "Spotting repeating activities", "Checking for duplicates"];

export function ImportMonth({ setup }: { setup: ImportSetup }) {
  const [stage, setStage] = useState<"upload" | "reading" | "check" | "added">("upload");
  const [file, setFile] = useState("");
  const [step, setStep] = useState(0);
  const [fixed, setFixed] = useState<Record<string, string>>({});
  useEffect(() => {
    if (stage !== "reading") return;
    const ids = steps.map((_, i) => window.setTimeout(() => setStep(i + 1), 520 * (i + 1)));
    ids.push(window.setTimeout(() => setStage("check"), 520 * steps.length + 300));
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [stage]);

  const read = (name: string) => { setFile(name); setStep(0); setStage("reading"); };
  const left = setup.flags.filter((f) => !fixed[f.id]).length;

  if (stage === "added") {
    return (
      <Done
        title={`${setup.month} is on the calendar`}
        line={<>{setup.read} events from {file}, with {setup.flags.length} checked by you. About 15 minutes instead of a day of typing.</>}
        items={[
          { icon: "calendar", title: `${setup.read} events added`, detail: `${setup.repeating} repeating activities, each set to repeat, and the one-off events on their days.` },
          { icon: "globe", title: "Website calendar", detail: "Every event, on its day. Resident activities show name, day, time and description only." },
          { icon: "printer", title: "Printed calendar", detail: `The large-print ${setup.month} calendar is ready to print, with the suggestion QR code on it.` },
          { icon: "sparkle", title: "Descriptions written", detail: "Kinlight wrote a short description for each new event, from what was on the calendar." },
          { icon: "sms", title: "Personal invites scheduled", detail: "Residents get invites to events that match their interests, two days before each one." },
          { icon: "mail", title: "Newsletters", detail: `Each Sunday’s newsletter in ${setup.month} carries the week ahead.` },
        ]}
        actions={<Link className="sx-btn sx-btn-primary" href="/staff/calendar"><Icon name="calendar" /> Open the calendar</Link>}
      />
    );
  }

  return (
    <div className="sx-card sx-card-body sx-form pt-form po-import">
      {stage === "upload" && (
        <>
          <p className="po-lead">Photograph or upload the paper calendar for <b>{setup.month}</b>. Kinlight reads every event into the calendar, and you check only what it wasn’t sure about.</p>
          <label className="pub-file po-drop">
            <input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) read(f.name); }} />
            <span className="sx-thumb"><span className="pt-pdf"><Icon name="upload" /></span></span>
            <span>
              <b>Take a photo, or choose a file</b>
              <span>A photo of the printed calendar, a PDF or a scan. One page per month is fine.</span>
            </span>
          </label>
          <p className="po-or"><button type="button" className="sx-btn" onClick={() => read(setup.file)}><Icon name="doc" /> Use “{setup.file}”, scanned at the front desk this morning</button></p>
          <p className="sx-hint"><Icon name="clock" /> Most months take about 15 minutes to check, instead of a day of typing.</p>
        </>
      )}

      {stage === "reading" && (
        <div className="po-reading" role="status" aria-live="polite">
          <h2>Reading {file}…</h2>
          <ol className="po-steps">
            {steps.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "now" : ""}><Icon name={i < step ? "check" : "clock"} /> {s}</li>)}
          </ol>
        </div>
      )}

      {stage === "check" && (
        <>
          <div className="po-read">
            <div><b>{setup.read}</b><span>events read</span></div>
            <div><b>{setup.repeating}</b><span>repeating activities spotted</span></div>
            <div className={left ? "warn" : "good"}><b>{left}</b><span>{left ? "to check" : "all checked"}</span></div>
          </div>
          <p className="sx-hint">From {file}. Everything else matched last month’s calendar and the rooms on file.</p>
          <h2 className="pt-prev-h">Kinlight wasn’t sure about {setup.flags.length}</h2>
          <ul className="po-flags">
            {setup.flags.map((f) => (
              <li key={f.id} className={fixed[f.id] ? "ok" : ""}>
                <div className="po-flag-h">
                  <b>{f.title}</b>
                  <span className="sx-hint">{f.read}</span>
                  {fixed[f.id] ? <Badge tone="good">Checked</Badge> : <Badge tone="warn">{f.kind === "duplicate" ? "Possible duplicate" : f.kind === "time" ? "Unsure time" : f.kind === "room" ? "Unreadable room" : f.kind === "date" ? "Unsure day" : f.kind === "seats" ? "Seats missing" : "New name"}</Badge>}
                </div>
                <p>{f.why}</p>
                <div className="sx-chips" role="group" aria-label={`Fix ${f.title}`}>
                  {f.options.map((o) => <button key={o} type="button" aria-pressed={fixed[f.id] === o} onClick={() => setFixed({ ...fixed, [f.id]: o })}>{fixed[f.id] === o && <Icon name="check" />}{o}</button>)}
                </div>
              </li>
            ))}
          </ul>
          <details className="po-sample">
            <summary>See how the first day was read</summary>
            <ul>{setup.sample.map((x) => <li key={x.title + x.time}><time>{x.time}</time> <b>{x.title}</b> <span className="sx-hint">{x.room}{x.repeat ? " · repeats weekly" : ""}</span></li>)}</ul>
          </details>
          <div className="pt-submit">
            <p>{left ? `${left} still to check. You can add the month once they’re done.` : `Ready: ${setup.read} events go on the calendar, the website and the printed calendar.`}</p>
            <button type="button" className="sx-btn sx-btn-lg sx-btn-primary" disabled={left > 0} onClick={() => { setStage("added"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <Icon name="check" /> Add to the calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
