"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import { useT } from "@/i18n/client";

/** Availability alert for one floor plan: email or text, confirmed locally. */
export function AlertSignup({ code, open: startOpen = false, compact = false }: { code: string; open?: boolean; compact?: boolean }) {
  const { t } = useT();
  const id = useId();
  const [open, setOpen] = useState(startOpen);
  const [how, setHow] = useState<"text" | "email">("text");
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done) {
    return (
      <div className="fp-alert-done" role="status">
        <Icon name="check" />
        <span>
          {t(how === "text" ? `We’ll text you the moment an ${code} opens up.` : `We’ll email you the moment an ${code} opens up.`)}
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="fp-alert-btn" onClick={() => setOpen(true)} aria-expanded="false">
        <Icon name="bell" /> {t("Get availability alerts")}
      </button>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (how === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setError(t("Please enter a valid email address."));
    if (how === "text" && v.replace(/\D/g, "").length < 10) return setError(t("Please enter a 10-digit mobile number."));
    setError("");
    setDone(true);
  };

  return (
    <form className={`fp-alert ${compact ? "is-compact" : ""}`} onSubmit={submit} noValidate>
      <fieldset className="fp-alert-how">
        <legend className="vh">{t("How should we reach you?")}</legend>
        <label className={how === "text" ? "on" : ""}>
          <input type="radio" name={`${id}-how`} checked={how === "text"} onChange={() => { setHow("text"); setError(""); }} />
          <Icon name="sms" /> {t("Text")}
        </label>
        <label className={how === "email" ? "on" : ""}>
          <input type="radio" name={`${id}-how`} checked={how === "email"} onChange={() => { setHow("email"); setError(""); }} />
          <Icon name="mail" /> {t("Email")}
        </label>
      </fieldset>
      <div className="fp-alert-row">
        <label className="vh" htmlFor={`${id}-v`}>
          {t(how === "text" ? `Mobile number for ${code} alerts` : `Email address for ${code} alerts`)}
        </label>
        <input
          id={`${id}-v`}
          className="input"
          type={how === "text" ? "tel" : "email"}
          inputMode={how === "text" ? "tel" : "email"}
          autoComplete={how === "text" ? "tel" : "email"}
          placeholder={how === "text" ? "(916) 555-0123" : "you@email.com"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-e` : undefined}
        />
        <button type="submit" className="btn btn-green btn-sm">
          {t("Notify me")}
        </button>
      </div>
      {error && (
        <p id={`${id}-e`} className="fp-alert-err" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
