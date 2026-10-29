"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Lists and grids whose items pop in one after another as they scroll into view.
const GROUPS = [
  ".pillars", ".shared", ".care-grid", ".quotes", ".mosaic", ".people", ".trust", ".locations", ".staff", ".apts2", ".pevents",
  ".news", ".kpis", ".amenities", ".regulars", ".photos", ".docs", ".meals", ".hours", ".q-summary", ".faq", ".today-col .events", ".finder-chips",
].join(",");

// Two-column layouts whose halves slide in from their own side.
const SPLITS = [".split", ".people-grid", ".week-grid", ".lead", ".cta-inner", ".touch-row", ".vt-alerts", ".notice-card"].join(",");

const STEP = 0.07;
const MAX_DELAY = 0.6;

/** Tells the page transition which way to slide: deeper or further along the menu is forward, back up or the browser's Back is back. */
export function NavDirection() {
  useEffect(() => {
    const html = document.documentElement;
    const depth = (p: string) => p.split("/").filter(Boolean).length;
    const order = (p: string) => Array.from(document.querySelectorAll<HTMLAnchorElement>(".site-nav a")).findIndex((a) => a.pathname === p);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a");
      if (!a || a.origin !== location.origin || a.pathname === location.pathname) return;
      const from = location.pathname;
      const to = a.pathname;
      let dir = depth(to) > depth(from) ? "forward" : depth(to) < depth(from) ? "back" : "forward";
      if (depth(to) === depth(from)) {
        const [i, j] = [order(from), order(to)];
        if (i >= 0 && j >= 0 && j < i) dir = "back";
      }
      html.dataset.nav = dir;
    };
    const onPop = () => (html.dataset.nav = "back");
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);
  return null;
}

/** Site-wide entrance motion for the public pages. Everything is visible without JS, under reduced motion and in print. */
export function Motion() {
  const path = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("motion");

    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const box = e.target as HTMLElement;
          io.unobserve(box);
          box.dataset.popIn = "1";
          // Once everything has arrived, hand transitions back to the components' own hover styles.
          const n = box.querySelectorAll(":scope > [data-pop]").length;
          timers.push(
            window.setTimeout(() => {
              box.querySelectorAll<HTMLElement>(":scope > [data-pop]").forEach((c) => {
                delete c.dataset.pop;
                delete c.dataset.slide;
                c.style.removeProperty("--pop-d");
              });
            }, (Math.min(n * STEP, MAX_DELAY) + 1) * 1000)
          );
        });
      },
      { rootMargin: "0px 0px -8% 0px" }
    );

    const raf = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>(`main :is(${GROUPS})`).forEach((box) => {
        if (box.dataset.popIn === "1") return;
        if (!box.dataset.popIn) {
          const kids = Array.from(box.children) as HTMLElement[];
          if (!kids.length) return;
          box.dataset.popIn = "0";
          kids.forEach((c, i) => {
            c.dataset.pop = "";
            c.style.setProperty("--pop-d", `${Math.min(i * STEP, MAX_DELAY)}s`);
          });
        }
        io.observe(box);
      });

      document.querySelectorAll<HTMLElement>(`main :is(${SPLITS})`).forEach((box) => {
        if (box.dataset.popIn === "1") return;
        if (!box.dataset.popIn) {
          const kids = (Array.from(box.children) as HTMLElement[]).filter((c) => c.offsetWidth > 0);
          if (kids.length < 2) return;
          const b = box.getBoundingClientRect();
          box.dataset.popIn = "0";
          kids.forEach((c, i) => {
            const r = c.getBoundingClientRect();
            // Stacked (phone) columns rise; side-by-side ones come from their own side.
            const side = r.width > b.width * 0.8 ? "u" : r.left + r.width / 2 < b.left + b.width / 2 ? "l" : "r";
            c.dataset.pop = "";
            c.dataset.slide = side;
            c.style.setProperty("--pop-d", `${i * 0.12}s`);
          });
        }
        io.observe(box);
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [path]);

  return null;
}
