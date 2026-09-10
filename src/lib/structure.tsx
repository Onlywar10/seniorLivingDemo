"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface StructureState {
  on: boolean;
  setOn: (v: boolean) => void;
}

const Ctx = createContext<StructureState>({ on: false, setOn: () => {} });

const KEY = "larkmoor.structure";

export function StructureProvider({ children }: { children: ReactNode }) {
  const [on, setOnState] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("structure");
      if (q === "on" || q === "off") {
        localStorage.setItem(KEY, q);
        setOnState(q === "on");
        return;
      }
      const saved = localStorage.getItem(KEY);
      if (saved === "on") setOnState(true);
    } catch {}
  }, []);

  // Hidden demo control: Ctrl+Shift+M toggles the module-structure overlay on any page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setOnState((v) => {
          try {
            localStorage.setItem(KEY, v ? "off" : "on");
          } catch {}
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.structure = on ? "on" : "off";
  }, [on]);

  const setOn = (v: boolean) => {
    setOnState(v);
    try {
      localStorage.setItem(KEY, v ? "on" : "off");
    } catch {}
  };

  return <Ctx.Provider value={{ on, setOn }}>{children}</Ctx.Provider>;
}

export const useStructure = () => useContext(Ctx);
