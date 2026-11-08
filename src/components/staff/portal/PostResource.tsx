"use client";

// A resource: a page or file that rarely changes (visiting hours, the transport schedule, a policy, the welcome pack).
// Kinlight publishes it on the website, makes it linkable in messages, and reminds its owner when it's due for review.
// Shown in this browser only.
import Link from "next/link";
import { useState } from "react";
import type { ResourceSetup } from "@/data/staff/post";
import { addDays, dayName, fromIso, monthName } from "@/lib/clock";
import { Icon } from "../../Icon";
import { useStaffCommunity } from "../StaffCommunity";
import { Badge } from "../ui";
import { Done } from "./PostBits";

export function Resource({ setup, fromFlyer = false }: { setup: ResourceSetup; fromFlyer?: boolean }) {
  const { site } = useStaffCommunity();
  const [k, setK] = useState(setup.kinds[0].k);
  const kind = setup.kinds.find((x) => x.k === k) ?? setup.kinds[0];
  const [title, setTitle] = useState(kind.title);
  const [body, setBody] = useState(kind.body);
  const [file, setFile] = useState("");
  const [owner, setOwner] = useState(kind.owner);
  const [review, setReview] = useState(kind.review);
  const [done, setDone] = useState(false);

  const pick = (n: string) => {
    const x = setup.kinds.find((y) => y.k === n)!;
    setK(n); setTitle(x.title); setBody(x.body); setOwner(x.owner); setReview(x.review); setFile("");
  };
  const ownerName = setup.owners.find((o) => o.key === owner)?.name ?? "";
  const due = addDays(fromIso(setup.todayIso), Number(review) * 30);
  const dueTxt = `${dayName(due)}, ${monthName(due)} ${due.getUTCDate()}`;
  const path = kind.path;

  if (done) {
    return (
      <Done
        title={`${title} is published`}
        line={<>Here’s what Kinlight did.</>}
        items={[
          { icon: "globe", title: "On the website", detail: <>At {setup.domain}/resources/{path}, and listed on the Resources page.</> },
          { icon: "link", title: "Linkable in messages", detail: <>When a family or resident asks about {title.toLowerCase()}, Kinlight replies with the link {setup.domain}/r/{path}. Staff can paste it too.</> },
          { icon: "bell", title: `${ownerName.split(" ")[0]} is reminded`, detail: `A reminder on ${dueTxt} to check it’s still right. If nobody does, it shows as going stale on Today.` },
          { icon: "check", title: "No approval needed", detail: "Resources publish straight away." },
        ]}
        actions={<Link className="sx-btn sx-btn-primary" href={site("/")} target="_blank"><Icon name="globe" /> See it on the website</Link>}
      />
    );
  }

  return (
    <div className="po-two">
      <form className="sx-card sx-card-body sx-form pt-form" onSubmit={(e) => { e.preventDefault(); setDone(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label="Resource">
        {fromFlyer && (
          <div className="sx-callout info"><Icon name="info" /><p>A flyer for one event is made automatically when you add the event. Use this for pages and files that rarely change.</p></div>
        )}
        <fieldset className="po-field">
          <legend className="sx-lbl">What is it?</legend>
          <div className="sx-chips" role="group" aria-label="Kind of resource">
            {setup.kinds.map((x) => <button key={x.k} type="button" aria-pressed={k === x.k} onClick={() => pick(x.k)}>{x.label}</button>)}
          </div>
        </fieldset>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label className="pub-file">
          <input type="file" accept="application/pdf,image/*,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f.name); }} />
          <span className="sx-thumb"><span className="pt-pdf"><Icon name="doc" /></span></span>
          <span><b>{file || "Add a file (optional)"}</b><span>A PDF, a document or a photo. Or type it below.</span></span>
        </label>
        <label>
          What it says
          <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder={file ? "Optional: a short summary for the web page" : "Type it here, or add a file above"} />
        </label>
        <div className="sx-row">
          <label>Who looks after it<select value={owner} onChange={(e) => setOwner(e.target.value)}>{setup.owners.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}</select></label>
          <label>Check it every<select value={review} onChange={(e) => setReview(e.target.value)}><option value="3">3 months</option><option value="6">6 months</option><option value="12">Year</option></select></label>
        </div>
        <div className="pt-submit">
          <p>Publishes straight away. {ownerName.split(" ")[0]} is reminded on {dueTxt}.</p>
          <button type="submit" className="sx-btn sx-btn-lg sx-btn-primary" disabled={!title || (!body.trim() && !file)}><Icon name="check" /> Publish</button>
        </div>
      </form>
      <section className="sx-card sx-card-body po-auto" aria-label="Resources already published">
        <h2 className="pt-prev-h">What Kinlight does when you publish it</h2>
        <ul className="po-autolist">
          <li><Icon name="globe" /><span><b>Website:</b> {setup.domain}/resources/{path}</span></li>
          <li><Icon name="link" /><span><b>A short link for messages:</b> {setup.domain}/r/{path}, used whenever someone asks about it.</span></li>
          <li><Icon name="bell" /><span><b>Review reminder</b> to {ownerName} on {dueTxt}.</span></li>
        </ul>
        <h2 className="pt-prev-h">Already published</h2>
        <ul className="po-res">
          {setup.existing.map((x) => (
            <li key={x.title}><span><b>{x.title}</b><small>{x.owner} · check by {x.due}</small></span>{x.stale ? <Badge tone="warn">Due soon</Badge> : <Badge tone="good">Up to date</Badge>}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
