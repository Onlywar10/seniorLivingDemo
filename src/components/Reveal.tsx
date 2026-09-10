"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Fades a section in gently as it enters the viewport. Content is visible without JS and under reduced motion. */
export function Reveal({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    if (!("IntersectionObserver" in window)) {
      el.classList.add("in");
      return;
    }
    el.classList.add("reveal");
    const safety = window.setTimeout(() => el.classList.add("in"), 2500);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);
  return (
    <section ref={ref} className={className} id={id}>
      {children}
    </section>
  );
}
