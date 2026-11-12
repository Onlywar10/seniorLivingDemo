"use client";

// The monthly report's one-page PDF: download it now, or see when it's emailed (the 1st of each month).
import { useState } from "react";
import { Icon } from "../../Icon";

export function ReportsActions({ month, to, next }: { month: string; to: string; next: string }) {
  const [done, setDone] = useState<"" | "pdf" | "mail">("");
  return (
    <>
      {done === "pdf" ? (
        <span className="al-done good" role="status"><Icon name="download" /> {month} report downloaded (1 page)</span>
      ) : (
        <button type="button" className="sx-btn" onClick={() => setDone("pdf")}><Icon name="download" /> Download the one-page PDF</button>
      )}
      {done === "mail" ? (
        <span className="al-done good" role="status"><Icon name="check" /> Sent to {to}</span>
      ) : (
        <button type="button" className="sx-btn sx-btn-primary" onClick={() => setDone("mail")} title={`Sends to ${to}. Emailed automatically on ${next}`}><Icon name="mail" /> Email it now</button>
      )}
      <span className="rp-when">Emailed on the 1st · next {next}</span>
    </>
  );
}
