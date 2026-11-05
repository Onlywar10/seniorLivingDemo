"use client";

// Inviting a team member. The invitation list is kept in this browser only.
import { useState } from "react";
import { Icon } from "../../Icon";
import { Badge, Initials } from "../ui";

const roles = ["Contributor", "Champion", "Manager", "Sales", "Administrator"] as const;
const roleNote: Record<(typeof roles)[number], string> = {
  Contributor: "Posts updates and photos; a manager approves anything with a resident’s photo.",
  Champion: "Runs the calendar and menus, approves event RSVPs and keeps family contacts.",
  Manager: "Everything a Champion does, plus approving family messages.",
  Sales: "Inquiries, tours, pricing and availability.",
  Administrator: "Everything, including settings and roles.",
};

export function InviteMember({ community }: { community: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof roles)[number]>("Contributor");
  const [sent, setSent] = useState<{ name: string; email: string; role: string }[]>([]);
  const send = () => {
    if (!name.trim() || !email.includes("@")) return;
    setSent((s) => [{ name: name.trim(), email: email.trim(), role }, ...s]);
    setName("");
    setEmail("");
    setOpen(false);
  };
  return (
    <div className="tm-invite">
      {open ? (
        <form className="sx-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <div className="sx-row3">
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" required /></label>
            <label>Work email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required /></label>
            <label>
              Role
              <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <p className="sx-hint">{roleNote[role]} They get an email to set up their sign-in for {community}.</p>
          <div className="tm-btns">
            <button type="submit" className="sx-btn sx-btn-primary"><Icon name="send" /> Send invitation</button>
            <button type="button" className="sx-btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button type="button" className="sx-btn sx-btn-primary" onClick={() => setOpen(true)}><Icon name="plus" /> Invite a team member</button>
      )}
      {sent.length > 0 && (
        <ul className="sx-list">
          {sent.map((p) => (
            <li key={p.email} className="al-row">
              <Initials name={p.name} size={28} />
              <span><b>{p.name}</b><small>{p.email} · {p.role}</small></span>
              <Badge tone="warn">Invited just now</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
