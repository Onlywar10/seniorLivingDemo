"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function Rsvp({ title, when, spaces, going }: { title: string; when: string; spaces: number; going: number }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<{ name: string; n: number } | null>(null);
  const left = spaces - going - (done?.n ?? 0);

  if (done) {
    return (
      <div className="form-ok" role="status">
        <b>See you there, {done.name.split(" ")[0]}.</b> {done.n} {done.n === 1 ? "place" : "places"} saved for {title.split(":")[0]}, {when}. We’ll text you a reminder the day before.
      </div>
    );
  }
  if (!open) {
    return (
      <div className="rsvp-row">
        <button type="button" className="btn btn-gold" onClick={() => setOpen(true)}>
          <Icon name="check" /> RSVP
        </button>
        <span className="muted small">
          {going} going · {left} spaces left
        </span>
      </div>
    );
  }
  return (
    <form
      className="form rsvp-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setDone({ name: String(f.get("name") || ""), n: Number(f.get("n") || 1) });
      }}
    >
      <div className="touch-row">
        <label>
          Your name
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          How many coming?
          <select name="n" defaultValue="2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Mobile or email
        <input name="contact" required />
      </label>
      <div className="rsvp-row">
        <button className="btn btn-gold" type="submit">
          Confirm RSVP
        </button>
        <button className="btn btn-outline" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
