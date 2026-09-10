"use client";

import { useState } from "react";
import { community } from "@/data/community";
import { Icon } from "./Icon";

/** Get-in-touch form. Demonstration only: nothing is sent. */
export function StayInTouch() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="touch">
        <div>
          <h2>Thank you</h2>
          <p>Daniel, our family liaison, will be in touch within a working day. If it is urgent, ring {community.phone}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="touch">
      <div>
        <h2>Get in touch</h2>
        <p>
          Tell us a little about who you are looking for and how you would like to hear from us. Daniel, our family liaison, replies within a working day, and our monthly letter has the calendar highlights, what Luis is cooking and a few photos from the month.
        </p>
        <p className="small">
          <Icon name="phone" /> Prefer to talk now? <a href={community.phoneHref}>{community.phone}</a>, 6 am to 10 pm.
        </p>
      </div>
      <form
        className="touch-form"
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <div className="touch-row">
          <label>
            First name
            <input name="first" required autoComplete="given-name" />
          </label>
          <label>
            Last name
            <input name="last" required autoComplete="family-name" />
          </label>
        </div>
        <div className="touch-row">
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" autoComplete="tel" />
          </label>
        </div>
        <label>
          Interested in
          <select name="interest" defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            <option>Assisted living</option>
            <option>Memory care</option>
            <option>A tour</option>
            <option>The monthly letter</option>
            <option>Working here</option>
            <option>Something else</option>
          </select>
        </label>
        <div className="touch-consent">
          <label>
            <input type="checkbox" name="sms" />
            <span>Yes, I agree to receive text messages from Larkmoor House at the number above. Message and data rates may apply; reply STOP at any time.</span>
          </label>
          <label>
            <input type="checkbox" name="email-ok" />
            <span>Yes, I agree to receive emails from Larkmoor House, including the monthly letter. Unsubscribe at any time.</span>
          </label>
        </div>
        <div>
          <button className="btn btn-gold" type="submit">
            Send
          </button>
        </div>
        <p className="small muted" style={{ margin: 0 }}>We never share contact details. You can change or stop either at any time.</p>
      </form>
    </div>
  );
}
