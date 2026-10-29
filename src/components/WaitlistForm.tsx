"use client";

import { useState } from "react";
import { apartments } from "@/data/community";

export function WaitlistForm({ preset }: { preset?: string }) {
  const [done, setDone] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<string[]>(preset ? [preset] : []);

  if (done) {
    return (
      <div className="form-ok" role="status">
        <p style={{ margin: "0 0 6px" }}>
          <b>You are on the list.</b>
        </p>
        <p style={{ margin: 0 }}>
          We will text and email you the day a {done.join(" or ").toLowerCase() || "suitable apartment"} comes free. Daniel Whitcombe will call you by the end of tomorrow to introduce himself.
        </p>
      </div>
    );
  }
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(apartments.filter((a) => picked.includes(a.key)).map((a) => a.name));
      }}
    >
      <fieldset className="checks">
        <legend>Apartments you are interested in</legend>
        {apartments.map((a) => (
          <label key={a.key}>
            <input type="checkbox" checked={picked.includes(a.key)} onChange={(e) => setPicked(e.target.checked ? [...picked, a.key] : picked.filter((k) => k !== a.key))} />
            <span>{a.name}</span>
          </label>
        ))}
      </fieldset>
      <label>
        Your name
        <input name="name" required autoComplete="name" />
      </label>
      <div className="touch-row">
        <label>
          Mobile
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <label>
        How soon?
        <select name="when" defaultValue="3">
          <option value="now">As soon as possible</option>
          <option value="3">In the next three months</option>
          <option value="6">In the next six months</option>
          <option value="later">Just planning ahead</option>
        </select>
      </label>
      <div>
        <button className="btn btn-gold" type="submit">
          Get availability alerts
        </button>
      </div>
    </form>
  );
}
