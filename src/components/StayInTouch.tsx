"use client";

import Image from "next/image";
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
          <h2>Thank you. Daniel will reply by 5 pm tomorrow.</h2>
          <p>Daniel Whitcombe, our family liaison, answers every enquiry himself, by phone or email, whichever you prefer. A copy of your message is on its way to your inbox. If it is urgent, ring {community.phone} and ask for him.</p>
          <p className="people" style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className="people-photo-sm">
              <Image src="/photos/staff-daniel.jpg" alt="" fill sizes="56px" />
            </span>
            <span>
              <b>Daniel Whitcombe</b>
              <span className="muted small" style={{ display: "block" }}>Family Liaison · ext. 105</span>
            </span>
          </p>
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
