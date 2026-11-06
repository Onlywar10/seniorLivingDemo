"use client";

// Plays the message workflows from bands.tsx: a tab per audience, a list of that audience's workflows, and a storyboard.
// The active step grows to take most of the row: its little scene plays (Scenes.tsx), then the real screens it stands
// for take over (the phone, the printed sheet, or the live website being used), each for as long as it takes to read
// (timing set in bands.tsx). Tap any step (or a phase bar) to pause there, on its real screen if it has one; the expand
// button opens it full size. The tab lives in the address (#staff…).
import { Children, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Phone, PhoneTour } from "@/components/phone/Phone";
import { Scene } from "./Scenes";
import { SiteFrame } from "./SiteFrame";
import type { Actor, Band, BandKey, Frame, Preview, Step } from "./types";
import "./flows.css";

const KEYS: BandKey[] = ["family", "prospect", "resident", "staff"];
const actorLabel: Record<Actor, string> = { family: "Family", prospect: "Prospect", resident: "Resident", staff: "Staff", auto: "Automatic" };

const subHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const subMotion = (cb: () => void) => {
  const m = window.matchMedia("(prefers-reduced-motion: reduce)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** The phases of a step: its scene, then each real screen. Each entry is how long it stays up. */
function phases(st: Step): number[] {
  return [st.sceneMs ?? 2400, ...(st.preview?.dwell ?? [])];
}

/** Slowly scrolls a long screen (an email, a personal-link page) so the whole of it shows while it's up. */
function AutoScroll({ ms, still }: { ms: number; still: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current?.parentElement;
    if (!root || still) return;
    const boxes = [...root.querySelectorAll<HTMLElement>("*")].filter((el) => {
      const o = getComputedStyle(el).overflowY;
      return (o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight + 24 && !el.classList.contains("ph-sms-body");
    });
    if (!boxes.length) return;
    const start = performance.now() + 900;
    const span = Math.max(800, ms - 1900);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / span));
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      for (const b of boxes) b.scrollTop = e * (b.scrollHeight - b.clientHeight);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms, still]);
  return <span ref={ref} hidden />;
}

/** One frame of what a step stands for: a phone screen, a printed sheet, or the live website. */
function FrameView({ f, ms, still, onDone }: { f: Frame; ms: number; still: boolean; onDone?: () => void }) {
  if (f.kind === "site") {
    return (
      <div className="fl-shot-site">
        <SiteFrame path={f.path} host={f.host} actions={f.actions} chat={f.chat} onDone={onDone} />
      </div>
    );
  }
  if (f.kind === "paper") {
    return (
      <div className="fl-shot-paper">
        {Children.toArray(f.node)}
        <AutoScroll ms={ms} still={still} />
      </div>
    );
  }
  const s = f.step;
  return (
    <div className="fl-shot-phone">
      <Phone time={s.time} dark={s.dark} size="sm" label={s.label}>
        <div className="ph-step">
          {/* Fragments from the server arrive as plain arrays; toArray gives them keys. */}
          {Children.toArray(s.screen)}
          <AutoScroll ms={ms} still={still} />
        </div>
      </Phone>
    </div>
  );
}

/** What the active step shows for phase `sub`: 0 is the scene, then its frames. */
function Shot({ st, sub, ms, still, onDone }: { st: Step; sub: number; ms: number; still: boolean; onDone: () => void }) {
  const f = sub > 0 ? st.preview?.frames[sub - 1] : undefined;
  if (!f) {
    return (
      <span className="fl-shot-scene is-on">
        <Scene kind={st.scene} text={st.text} text2={st.text2} />
      </span>
    );
  }
  return <FrameView f={f} ms={ms} still={still} onDone={onDone} />;
}

/** Full size: a phone you can tap through, or the frame being shown (the website, a sheet) at full width. */
function PreviewBody({ p, at }: { p: Preview; at: number }) {
  const phones = p.frames.flatMap((f) => (f.kind === "phone" ? [f.step] : []));
  if (phones.length === p.frames.length) return <PhoneTour steps={phones} size="md" />;
  const f = p.frames[Math.max(0, Math.min(p.frames.length - 1, at))];
  if (f.kind === "site") return <div className="fl-dialog-site"><SiteFrame path={f.path} host={f.host} actions={f.actions} chat={f.chat} /></div>;
  if (f.kind === "paper") return <div className="fl-paper-wrap">{Children.toArray(f.node)}</div>;
  return <PhoneTour steps={[f.step]} size="md" />;
}

export function FlowBoard({ bands, community }: { bands: Band[]; community: string }) {
  const hash = useSyncExternalStore(subHash, () => window.location.hash.slice(1), () => "");
  const reduced = useSyncExternalStore(subMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const tab: BandKey = (KEYS as string[]).includes(hash) ? (hash as BandKey) : "family";
  const band = bands.find((b) => b.key === tab) ?? bands[0];

  const [flowBy, setFlowBy] = useState<Partial<Record<BandKey, number>>>({});
  const fi = Math.min(flowBy[tab] ?? 0, band.flows.length - 1);
  const flow = band.flows[fi];
  const key = `${tab}/${flow.id}`;

  // The active step and phase, remembered per flow (a new flow starts at the beginning).
  const [pos, setPos] = useState({ key: "", i: 0, sub: 0 });
  const here = pos.key === key;
  const i = here ? Math.min(pos.i, flow.steps.length - 1) : 0;
  const step = flow.steps[i];
  const plan = phases(step);
  const sub = here ? Math.min(pos.sub, plan.length - 1) : 0;
  const dur = plan[sub];
  const nPhases = plan.length;
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reduced;
  const [open, setOpen] = useState<Step | null>(null);
  const ref = useRef<HTMLDialogElement>(null);

  // Autoplay: each phase for its own time, then the next step; after the last step, a beat, then start again.
  // The live website moves on when its visitor has finished (with a generous fallback while a page first loads).
  const lastSub = sub >= nPhases - 1;
  const lastStep = i >= flow.steps.length - 1;
  const isSite = sub > 0 && step.preview?.frames[sub - 1]?.kind === "site";
  const advance = () => setPos(lastSub ? (lastStep ? { key, i: 0, sub: 0 } : { key, i: i + 1, sub: 0 }) : { key, i, sub: sub + 1 });
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });
  useEffect(() => {
    if (!playing || open) return;
    const id = window.setTimeout(() => advanceRef.current(), (isSite ? dur + 15000 : dur) + (lastSub && lastStep ? 1400 : 0));
    return () => window.clearTimeout(id);
  }, [playing, open, i, sub, key, dur, isSite, lastSub, lastStep]);
  const siteDone = () => {
    if (playing && !open) window.setTimeout(() => advanceRef.current(), lastSub && lastStep ? 1400 : 0);
  };

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const goTab = (k: BandKey) => {
    history.replaceState(null, "", `#${k}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const goFlow = (n: number) => {
    setFlowBy((m) => ({ ...m, [tab]: n }));
    setPaused(false);
  };
  // Picking a step pauses on it, showing its real screen when it has one (the detail, not the picture).
  const goStep = (n: number, s?: number) => {
    const at = Math.max(0, Math.min(flow.steps.length - 1, n));
    setPos({ key, i: at, sub: s ?? (flow.steps[at].preview ? 1 : 0) });
    setPaused(true);
  };
  // The website needs more room than a phone, so the active step widens further while it shows one.
  const cols = flow.steps.map((_, n) => (n === i ? `minmax(0, ${isSite ? 5 : 2.8}fr)` : "minmax(0, 1fr)")).join(" ");

  return (
    <div className={`fl fl-band-${tab}`}>
      <header className="fl-head">
        <p className="fl-kicker">{community}</p>
        <div className="fl-tabs" role="tablist" aria-label="Audience">
          {bands.map((b) => (
            <button key={b.key} type="button" role="tab" aria-selected={b.key === tab} className={`fl-tab fl-tab-${b.key}`} onClick={() => goTab(b.key)}>
              {b.label}
            </button>
          ))}
        </div>
      </header>

      <div className="fl-body" role="tabpanel" aria-label={band.label}>
        <aside className="fl-side">
          <p className="fl-tagline">{band.tagline}</p>
          {band.note && <p className="fl-note">{band.note}</p>}
          <ol className="fl-flowlist">
            {band.flows.map((f, n) => (
              <li key={f.id}>
                <button type="button" aria-current={n === fi ? "true" : undefined} onClick={() => goFlow(n)}>
                  <span className="fl-flowlist-n">{n + 1}</span>
                  {f.title}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <section className="fl-stage" aria-labelledby="fl-title">
          <div className="fl-stage-head">
            <div>
              <h1 id="fl-title">{flow.title}</h1>
              <p>{flow.hook}</p>
            </div>
            {!reduced && (
              <button type="button" className="fl-play" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play" : "Pause"}>
                {paused ? "▶" : "❚❚"}
              </button>
            )}
          </div>

          <ol className="fl-track" style={{ gridTemplateColumns: cols }}>
            {flow.steps.map((st, n) => {
              const state = n < i ? "is-done" : n === i ? "is-on" : "is-next";
              const active = n === i;
              return (
                <li key={st.id} className={`fl-step ${state}`}>
                  {n > 0 && (
                    <span className={`fl-wire${n < i ? " is-full" : active ? " is-filling" : ""}`} aria-hidden="true">
                      <span key={active ? `${key}-${i}` : "rest"} />
                    </span>
                  )}
                  {active ? (
                    <div className="fl-card fl-card-on">
                      <div
                        className={`fl-shot${st.preview && sub === 0 ? " is-tappable" : ""}`}
                        onClick={(e) => {
                          // Tapping the picture pauses and opens the detail (the phase bars do the same from the keyboard).
                          if (!(e.target as HTMLElement).closest(".fl-expand")) goStep(i, sub === 0 && st.preview ? 1 : sub);
                        }}
                      >
                        <Shot key={`${key}-${i}-${sub}`} st={st} sub={sub} ms={plan[sub]} still={!playing} onDone={siteDone} />
                        {st.preview && (
                          <button type="button" className="fl-expand" onClick={() => setOpen(st)} aria-label={`Open “${st.label}” full size`} title="Full size">
                            ⤢
                          </button>
                        )}
                      </div>
                      {plan.length > 1 && (
                        <span className="fl-phases">
                          {plan.map((ms, k) => (
                            <button key={k} type="button" className={k === sub ? "on" : k < sub ? "done" : undefined} onClick={() => goStep(i, k)} aria-label={k === 0 ? "The picture" : `Screen ${k}`}>
                              <i style={k === sub && playing ? { animationDuration: `${ms}ms` } : undefined} key={k === sub ? `${key}-${i}-${sub}` : "x"} />
                            </button>
                          ))}
                        </span>
                      )}
                      <span className="fl-card-label">
                        <span className={`fl-actor fl-actor-${st.actor}`}>{actorLabel[st.actor]}</span>
                        <b>{st.label}</b>
                        {st.when && <small>{st.when}</small>}
                      </span>
                    </div>
                  ) : (
                    <button type="button" className="fl-card" onClick={() => goStep(n)}>
                      <span className="fl-thumb">
                        <Scene kind={st.scene} text={st.text} text2={st.text2} />
                      </span>
                      <span className="fl-card-label">
                        <span className={`fl-actor fl-actor-${st.actor}`}>{actorLabel[st.actor]}</span>
                        <b>{st.label}</b>
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="fl-dots" aria-hidden="true">
            {flow.steps.map((st, n) => (
              <span key={st.id} className={n === i ? "on" : undefined} />
            ))}
          </div>
          <p className="vh" aria-live="polite">
            Step {i + 1} of {flow.steps.length}: {step.label}
          </p>
        </section>
      </div>

      <dialog
        ref={ref}
        className={`fl-dialog${open?.preview?.frames.some((f) => f.kind === "site") ? " fl-dialog-wide" : ""}`}
        aria-label={open?.label ?? "Preview"}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(null);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
      >
        {open?.preview && (
          <div className="fl-dialog-in">
            <div className="fl-dialog-head">
              <b>{open.label}</b>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close">
                ×
              </button>
            </div>
            <PreviewBody key={open.id} p={open.preview} at={sub - 1} />
          </div>
        )}
      </dialog>
    </div>
  );
}
