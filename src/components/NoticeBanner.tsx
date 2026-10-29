"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { urgentNotice } from "@/data/community";
import { Icon } from "./Icon";

const KEY = "larkmoor.notice.dismissed";

/** Urgent notice, pinned above the header on every community page until it expires or is closed. */
export function NoticeBanner() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === urgentNotice.title) setHidden(true);
    } catch {}
  }, []);
  if (hidden) return null;
  return (
    <div className="notice" role="region" aria-label="Urgent notice">
      <div className="wrap notice-inner">
        <Icon name="alert" className="notice-icon" />
        <p>
          <b>{urgentNotice.title}.</b> <span>{urgentNotice.body}</span> <Link href="/larkmoor-house/news">All notices</Link>
        </p>
        <button
          type="button"
          className="notice-close"
          aria-label="Close notice"
          onClick={() => {
            setHidden(true);
            try {
              sessionStorage.setItem(KEY, urgentNotice.title);
            } catch {}
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
