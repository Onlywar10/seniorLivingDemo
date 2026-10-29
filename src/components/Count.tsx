"use client";

import { useEffect, useRef } from "react";

/** A number that counts up the first time it scrolls into view. The real figure is in the HTML from the start. */
export function Count({ n, ms = 1400 }: { n: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const fmt = (v: number) => v.toLocaleString("en-US");
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / ms);
          el.textContent = fmt(Math.round(n * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = fmt(n);
    };
  }, [n, ms]);

  return (
    <span ref={ref} className="count">
      {n.toLocaleString("en-US")}
    </span>
  );
}
