"use client";

import Link from "@/i18n/Link";
import { useEffect, useState } from "react";
import { useT } from "@/i18n/client";
import { Icon } from "./Icon";

const KEY = "wh.cookies";

export function CookieConsent() {
  const { t } = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);
  if (!show) return null;
  const choose = (v: string) => {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    setShow(false);
  };
  return (
    <div className="cookie" role="region" aria-label={t("Cookie preferences")}>
      <b>
        <Icon name="cookie" /> {t("We use cookies")}
      </b>
      <p>
        {t("Essential cookies keep this site working. With your permission we also use analytics cookies to learn which pages help families most. ")}<Link href="/privacy">{t("Privacy policy")}</Link>
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-green btn-sm" onClick={() => choose("all")}>
          {t("Accept all")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose("essential")}>
          {t("Essential only")}
        </button>
      </div>
    </div>
  );
}
