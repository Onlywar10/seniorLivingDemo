"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const KEY = "pcl.cookies";

export function CookieConsent() {
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
    <div className="cookie" role="region" aria-label="Cookie preferences">
      <b>
        <Icon name="cookie" /> We use cookies
      </b>
      <p>
        Essential cookies keep this site working. With your permission we also use analytics cookies to learn which pages help families most. <Link href="/privacy">Privacy policy</Link>
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-green btn-sm" onClick={() => choose("all")}>
          Accept all
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => choose("essential")}>
          Essential only
        </button>
      </div>
    </div>
  );
}
