"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const langs = [
  ["en", "English"],
  ["es", "Español"],
  ["vi", "Tiếng Việt"],
  ["zh", "中文"],
  ["tl", "Tagalog"],
  ["ru", "Русский"],
  ["ko", "한국어"],
];

const content = [
  { k: "calendar", label: "This week’s activity calendar", when: "Mondays, 7 am" },
  { k: "menus", label: "The week’s menus", when: "Mondays, 7 am" },
  { k: "news", label: "News and photos", when: "Fridays" },
  { k: "events", label: "Family events and open houses", when: "As they are announced" },
];

/** "Stay connected": calendar, menus and news by text or email, in the family's own language. */
export function SubscribeForm() {
  const [done, setDone] = useState<{ name: string; lang: string; channels: string[] } | null>(null);
  const [channels, setChannels] = useState<string[]>(["text", "email"]);

  if (done) {
    const lang = langs.find((l) => l[0] === done.lang)?.[1] ?? "English";
    return (
      <div className="form-ok" role="status">
        <p style={{ margin: "0 0 6px" }}>
          <b>Welcome, {done.name.split(" ")[0]}. You’re connected.</b>
        </p>
        <p style={{ margin: 0 }}>
          We’ve sent a confirmation {done.channels.includes("text") ? "text" : "email"} now. Your first digest arrives on Monday at 7 am, in {lang}. Urgent notices reach you within minutes, any time. Reply STOP or use the link in any email to change or stop.
        </p>
      </div>
    );
  }
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setDone({ name: String(f.get("name") || ""), lang: String(f.get("lang") || "en"), channels });
      }}
    >
      <label>
        Your name
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Resident you are connected to <span className="hint">optional</span>
        <input name="resident" placeholder="e.g. Dorothy Lindqvist, apartment 114" />
      </label>
      <fieldset className="checks checks-row">
        <legend>Send it to me by</legend>
        <label>
          <input type="checkbox" checked={channels.includes("text")} onChange={(e) => setChannels(e.target.checked ? [...channels, "text"] : channels.filter((c) => c !== "text"))} />
          <span>
            <Icon name="sms" /> Text message
          </span>
        </label>
        <label>
          <input type="checkbox" checked={channels.includes("email")} onChange={(e) => setChannels(e.target.checked ? [...channels, "email"] : channels.filter((c) => c !== "email"))} />
          <span>
            <Icon name="mail" /> Email
          </span>
        </label>
      </fieldset>
      <div className="touch-row">
        {channels.includes("text") && (
          <label>
            Mobile number
            <input name="phone" type="tel" required autoComplete="tel" />
          </label>
        )}
        {channels.includes("email") && (
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
        )}
      </div>
      <fieldset className="checks">
        <legend>What would you like?</legend>
        {content.map((c) => (
          <label key={c.k}>
            <input type="checkbox" defaultChecked name={c.k} />
            <span>
              {c.label} <span className="hint">· {c.when}</span>
            </span>
          </label>
        ))}
        <label>
          <input type="checkbox" checked disabled readOnly />
          <span>
            Urgent notices <span className="hint">· always on, within minutes</span>
          </span>
        </label>
      </fieldset>
      <label>
        Language
        <select name="lang" defaultValue="en">
          {langs.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <div>
        <button className="btn btn-gold" type="submit" disabled={channels.length === 0}>
          Stay connected
        </button>
      </div>
      <p className="small muted" style={{ margin: 0 }}>Free for family and friends of residents. We never share contact details. Message and data rates may apply.</p>
    </form>
  );
}
