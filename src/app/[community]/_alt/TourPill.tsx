"use client";

import { useEffect, useState } from "react";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/client";
import { Icon } from "@/components/Icon";
import "./tour-pill.css";

/**
 * Phones only: a floating "Book a tour" button for the alternative community homepages, shown once the
 * hero's own button has scrolled away. Sits bottom-left, clear of the chat button on the right.
 */
export function TourPill({ watch }: { watch: string }) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  return (
    <Link href="/tour" className={`alt-pill ${show ? "is-on" : ""}`} aria-hidden={!show} tabIndex={show ? 0 : -1}>
      <Icon name="calendar" /> {t("Book a tour")}
    </Link>
  );
}
