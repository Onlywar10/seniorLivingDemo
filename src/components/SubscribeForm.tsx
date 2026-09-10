"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <p className="form-ok" role="status">
        Thank you. We will confirm by text and email within the hour, and you will receive every notice in the language you chose.
      </p>
    );
  }
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label>
        Your name
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Mobile number <span className="hint">for text alerts</span>
        <input name="phone" type="tel" autoComplete="tel" />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" />
      </label>
      <label>
        Resident you are connected to
        <input name="resident" placeholder="Name and apartment number" />
      </label>
      <label>
        Language for notices
        <select name="lang" defaultValue="en">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="ru">Russian</option>
          <option value="vi">Vietnamese</option>
        </select>
      </label>
      <div>
        <button className="btn btn-green" type="submit">
          Sign up for alerts
        </button>
      </div>
    </form>
  );
}
