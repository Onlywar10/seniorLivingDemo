"use client";

import { useState } from "react";
import { Icon } from "../Icon";

export function ImportContacts() {
  const [step, setStep] = useState<"idle" | "open" | "reading" | "done">("idle");
  return (
    <>
      <button className="sx-btn" type="button" onClick={() => setStep("open")}>
        <Icon name="upload" /> Import from a spreadsheet
      </button>
      {step !== "idle" && (
        <div className="sx-modal" role="dialog" aria-modal="true" aria-label="Import contacts">
          <div className="sx-modal-box sx-card">
            <header className="sx-card-head">
              <div>
                <h2>Import families from a spreadsheet</h2>
                <p>Excel or CSV. We match the columns for you.</p>
              </div>
              <button className="sx-btn" type="button" onClick={() => setStep("idle")} aria-label="Close">
                <Icon name="x" />
              </button>
            </header>
            <div className="sx-card-body sx-form">
              {step === "open" && (
                <button type="button" className="pub-drop" onClick={() => { setStep("reading"); window.setTimeout(() => setStep("done"), 1300); }}>
                  <Icon name="upload" />
                  <b>Drop a file here, or choose one</b>
                  <span>Larkmoor family contacts.xlsx</span>
                </button>
              )}
              {step === "reading" && <p>Reading 247 rows…</p>}
              {step === "done" && (
                <>
                  <div className="pub-ocr">
                    <b>
                      <Icon name="check" /> 247 contacts found. 231 new, 12 already here (we will update them), 4 missing a phone or email.
                    </b>
                  </div>
                  <table className="sx-table">
                    <thead>
                      <tr>
                        <th>Your column</th>
                        <th>Becomes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Family Name", "Contact name"],
                        ["Resident", "Resident"],
                        ["Apt #", "Apartment"],
                        ["Cell", "Mobile (for texts)"],
                        ["E-mail", "Email"],
                        ["Lang.", "Language"],
                      ].map(([a, b]) => (
                        <tr key={a}>
                          <td>{a}</td>
                          <td>
                            <b>{b}</b>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <label className="sx-check">
                    <input type="checkbox" defaultChecked /> Send each new contact a welcome text asking them to confirm
                  </label>
                  <button className="sx-btn sx-btn-primary sx-btn-lg" type="button" onClick={() => setStep("idle")}>
                    Import 243 contacts
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
