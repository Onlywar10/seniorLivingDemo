// Shapes for the message workflows (bands.tsx builds them on the server, FlowBoard.tsx plays them).
import type { ReactNode } from "react";
import type { TourStep } from "@/components/phone/Phone";

export type BandKey = "family" | "prospect" | "resident" | "staff";
/** Who takes the step. "auto" is the system doing it on its own. */
export type Actor = "family" | "prospect" | "resident" | "staff" | "auto";
/** The little animated picture for a step (see Scenes.tsx). */
export type SceneKind =
  | "qr" | "form" | "text" | "reply" | "email" | "camera" | "approve" | "translate" | "route" | "calendar" | "rsvp"
  | "fork" | "stop" | "print" | "talk" | "bell" | "chart" | "home" | "call" | "list" | "guide" | "send" | "slip" | "build" | "web" | "chat" | "ways";

/** One thing the visitor does on the real website, played inside the embedded page (nothing is ever submitted). */
export type SiteAction =
  | { do: "scroll" | "click" | "point"; sel: string; /** Only an element (or its card) containing this text. */ text?: string; /** Which match, from 0. */ n?: number }
  | { do: "type"; sel: string; value: string }
  | { do: "wait"; ms: number };

/** What a step stands for, shown after its little scene: a phone screen, a printed sheet, or the live website. */
export type Frame =
  | { kind: "phone"; step: TourStep }
  | { kind: "paper"; node: ReactNode }
  /** A whole email (not on a phone), scrolled to the part being acted on. */
  | { kind: "mail"; node: ReactNode }
  | { kind: "site"; path: string; host: string; actions: SiteAction[]; /** Keep the site's chat button (hidden otherwise). */ chat?: boolean; /** A staff workspace page: the community it should show, and who is signed in. */ staff?: string; as?: "events" | "sales" | "manager" | "kitchen" | "desk" };

/** `dwell`: how long each frame stays up while the storyboard plays, in ms. Set by bands.tsx. */
export interface Preview { frames: Frame[]; dwell?: number[] }

export interface Step {
  id: string;
  scene: SceneKind;
  /** Two to four words. */
  label: string;
  actor: Actor;
  /** How it reaches the person or how they do it (Text, Email, Form, Button…), shown above the label. Defaults from the scene. */
  via?: string;
  /** Happens at the same time as the step before (not after it): drawn stacked under it in the same column. */
  with?: boolean;
  /** Where a flow splits in two (yes or no): 0 is the path drawn on top, 1 the one below. Each path plays in turn. */
  lane?: 0 | 1;
  when?: string;
  /** Words drawn inside the scene (a text bubble, a notification…). Keep it short. */
  text?: string;
  text2?: string;
  /** For a "ways" scene: the different ways into the same next step (drawn as cards that join into text2). */
  ways?: string[];
  preview?: Preview;
  /** How long the scene animation plays before the real screen takes over, in ms. Set by bands.tsx. */
  sceneMs?: number;
  /** Where the story carries on in another audience's tab (a story involving two people lives in one tab only). */
  next?: { tab: BandKey; flow: string; text: string };
}
/** The email a person gets for this use case, drawn full size (opened from a button under the flow). */
export interface FlowEmail { label: string; subject: string; node: ReactNode }
export interface Flow { id: string; title: string; hook: string; steps: Step[]; email?: FlowEmail }
export interface Band { key: BandKey; label: string; tagline: string; note?: string; flows: Flow[] }
