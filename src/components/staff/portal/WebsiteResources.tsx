"use client";

// Website → Resources: pages or files that rarely change (visiting hours, the transport schedule, policies, the welcome
// pack). The executive director creates them here; each owner edits theirs in place. Saving puts it live on the
// website and gives it a short link Kinlight uses in messages. Changes stay in this browser.
import { useState } from "react";
import type { StaffRole } from "@/data/staff/shared";
import { resourceKinds, type ResourceKind, type ResourceSetup, type SiteResource } from "@/data/staff/website";
import { addDays, dayShort, fromIso, iso } from "@/lib/clock";
import { Icon } from "../../Icon";
import { Badge } from "../ui";

type Draft = { kind: ResourceKind; title: string; text: string; file: string; owner: StaffRole; review: string };

const daysUntil = (from: string, to: string) => Math.round((fromIso(to).getTime() - fromIso(from).getTime()) / 86400000);
const slugOf = (t: string) => t.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "resource";

export function WebsiteResources({ setup, site, mine, canCreate, showOwner }: { setup: ResourceSetup; site: string; mine?: StaffRole; canCreate: boolean; showOwner: boolean }) {
  const { domain, todayIso, owners } = setup;
  const [rows, setRows] = useState(() => setup.items.filter((r) => !mine || r.ownerRole === mine));
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [live, setLive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const nameOf = (r: StaffRole) => owners.find((o) => o.role === r)?.name ?? "";
  const inMonths = (m: number) => iso(addDays(fromIso(todayIso), Math.round(m * 30.4)));

  const startNew = () => {
    const k = resourceKinds[0];
    setEdit("new");
    setLive(null);
    setDraft({ kind: k.k, title: k.title, text: "", file: "", owner: k.owner, review: inMonths(k.months) });
  };
  const startEdit = (r: SiteResource) => {
    setEdit(r.id);
    setLive(null);
    setDraft({ kind: r.kind, title: r.title, text: r.text, file: r.file ?? "", owner: r.ownerRole, review: r.review });
  };
  const pickKind = (k: ResourceKind) => {
    const x = resourceKinds.find((y) => y.k === k)!;
    setDraft((d) => d && { ...d, kind: k, title: x.title, owner: x.owner, review: inMonths(x.months) });
  };

  const save = () => {
    if (!draft || !edit) return;
    const base = { title: draft.title.trim(), kind: draft.kind, text: draft.text.trim(), file: draft.file || undefined, ownerRole: draft.owner, ownerName: nameOf(draft.owner), review: draft.review, updated: "Just now" };
    if (edit === "new") {
      const k = resourceKinds.find((x) => x.k === draft.kind)!;
      const taken = new Set(rows.map((r) => r.slug));
      let slug = k.path && !taken.has(k.path) ? k.path : slugOf(base.title);
      while (taken.has(slug)) slug += "-2";
      const r: SiteResource = { ...base, id: `new-${slug}`, slug, path: "/guides" };
      setRows((xs) => [r, ...xs]);
      setLive(r.id);
    } else {
      setRows((xs) => xs.map((x) => (x.id === edit ? { ...x, ...base } : x)));
      setLive(edit);
    }
    setEdit(null);
    setDraft(null);
    setCopied(false);
  };

  const copy = (r: SiteResource) => {
    try { void navigator.clipboard?.writeText(`https://${domain}/r/${r.slug}`); } catch { /* nothing to do */ }
    setCopied(true);
  };

  const form = (isNew: boolean) => draft && (
    <form className="ws-edit ws-res-f sx-form" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label={isNew ? "New resource" : `Edit ${draft.title}`}>
      {isNew && (
        <fieldset>
          <legend className="sx-lbl">Kind</legend>
          <div className="sx-chips" role="group" aria-label="Kind of resource">
            {resourceKinds.map((k) => <button key={k.k} type="button" aria-pressed={draft.kind === k.k} onClick={() => pickKind(k.k)}>{k.label}</button>)}
          </div>
        </fieldset>
      )}
      <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required /></label>
      <label>
        What it says
        <textarea rows={4} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder={draft.file ? "Optional: a short summary" : "Type it here, or add a file"} />
      </label>
      <label className="ws-res-file">
        <Icon name="doc" />
        <span>{draft.file || "Add a file (PDF, document or photo)"}</span>
        <input type="file" className="vh" accept="application/pdf,image/*,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, file: f.name }); }} />
      </label>
      <div className="sx-row">
        <label>Owner<select value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value as StaffRole })}>{owners.map((o) => <option key={o.role} value={o.role}>{o.name}</option>)}</select></label>
        <label>Review by<input type="date" value={draft.review} min={todayIso} onChange={(e) => setDraft({ ...draft, review: e.target.value })} required /></label>
      </div>
      <div className="pt-act">
        <button type="submit" className="sx-btn sx-btn-primary" disabled={!draft.title.trim() || (!draft.text.trim() && !draft.file)}><Icon name="check" /> {isNew ? "Publish" : "Save"}</button>
        <button type="button" className="sx-btn" onClick={() => { setEdit(null); setDraft(null); }}>Cancel</button>
      </div>
    </form>
  );

  return (
    <>
      {canCreate && edit !== "new" && (
        <div className="ws-res-bar"><button type="button" className="sx-btn" onClick={startNew}><Icon name="plus" /> New resource</button></div>
      )}
      {edit === "new" && form(true)}
      {rows.length === 0 && edit !== "new" && <p className="sx-empty">No resources are yours yet.</p>}
      <ul className="ws-pages">
        {rows.map((r) => {
          const editing = edit === r.id;
          const due = daysUntil(todayIso, r.review);
          const stale = r.updated !== "Just now" && due <= 2;
          return (
            <li key={r.id} className={`ws-page${stale ? " stale" : ""}${editing ? " open" : ""}`}>
              <div className="ws-page-h">
                <span className="ws-page-t">
                  <b>{r.title}</b>
                  <small>{showOwner && <>{r.ownerName} · </>}review by {dayShort(fromIso(r.review))}</small>
                </span>
                <span className="ws-page-s">
                  {live === r.id ? <Badge tone="good"><Icon name="check" /> Live</Badge> : stale ? <Badge tone="warn"><Icon name="clock" /> Going stale</Badge> : null}
                </span>
                <span className="ws-page-a">
                  {!editing && <button type="button" className="sx-btn sx-btn-sm" onClick={() => startEdit(r)} aria-label={`Edit ${r.title}`}><Icon name="edit" /> Edit</button>}
                  <a className="sx-btn sx-btn-sm sx-btn-quiet" href={`${site}${r.path}`} target="_blank" rel="noopener" aria-label={`Open ${r.title} on the website`}><Icon name="eye" /> View</a>
                </span>
              </div>
              {editing ? form(false) : (
                <>
                  {r.text && <p className="ws-page-x">{r.text}</p>}
                  {r.file && <span className="ws-res-chip"><Icon name="doc" /> {r.file}</span>}
                  {live === r.id && (
                    <div className="ws-res-link">
                      <Icon name="link" />
                      <span>Linkable in messages: <b>{domain}/r/{r.slug}</b></span>
                      <button type="button" className="sx-btn sx-btn-sm sx-btn-quiet" onClick={() => copy(r)}>{copied ? "Copied" : "Copy link"}</button>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
