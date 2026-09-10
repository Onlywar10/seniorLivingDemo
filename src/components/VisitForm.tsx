"use client";

import { useState } from "react";

export function VisitForm() {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <p className="form-ok" role="status">
        Thank you. Daniel will call you back today to confirm a time. If it is urgent, ring (503) 555-0142 and ask for him.
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
        Phone
        <input name="phone" type="tel" required autoComplete="tel" />
      </label>
      <label>
        Who is the visit for? <span className="hint">optional</span>
        <input name="for" placeholder="e.g. my mother, currently at home in Salem" />
      </label>
      <label>
        Preferred day
        <select name="day" defaultValue="">
          <option value="" disabled>
            Choose a day
          </option>
          <option>Friday 11 September</option>
          <option>Saturday 12 September (pancake breakfast, 9 am)</option>
          <option>Monday 14 September</option>
          <option>Tuesday 15 September</option>
          <option>Another day, call me</option>
        </select>
      </label>
      <div>
        <button className="btn btn-gold" type="submit">
          Request a tour
        </button>
      </div>
    </form>
  );
}
