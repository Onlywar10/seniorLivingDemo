// The blocks a website page is made of, for the block editor in Website → Pages. Plain data, safe to send to the
// browser. People write the text blocks; "live" blocks fill themselves from elsewhere in Kinlight (Menus, the
// calendar, Apartments and prices, Settings) and can be moved or removed, never retyped.

export type Align = "left" | "center" | "right";
export type FontSize = "small" | "medium" | "large" | "x-large";
export type Tone = "default" | "accent" | "muted" | "contrast";

export type LiveSource = "plans" | "care" | "menu" | "calendar" | "trips" | "classes" | "news" | "gallery" | "lantern" | "team" | "contact";

export interface LiveRow { t: string; s?: string; img?: string }

export type Block =
  | { id: string; type: "paragraph"; html: string; align?: Align; size?: FontSize; color?: Tone; bg?: Tone; dropCap?: boolean }
  | { id: string; type: "heading"; html: string; level: 2 | 3 | 4; align?: Align; color?: Tone }
  | { id: string; type: "list"; items: string[]; ordered?: boolean }
  | { id: string; type: "quote"; html: string; cite: string }
  | { id: string; type: "image"; src: string; alt: string; caption: string; align?: "none" | "wide" | "full" }
  | { id: string; type: "gallery"; images: { src: string; alt: string }[]; columns: 2 | 3 | 4 }
  | { id: string; type: "buttons"; buttons: { text: string; href: string; style: "fill" | "outline" }[]; align?: Align }
  | { id: string; type: "columns"; cols: { heading: string; html: string }[] }
  | { id: string; type: "separator" }
  | { id: string; type: "spacer"; height: number }
  | { id: string; type: "live"; source: LiveSource; title: string; from: string; href: string; updates: string; rows: LiveRow[] };

export type BlockType = Block["type"];

/** A picture the media library offers. */
export interface MediaItem { src: string; alt: string }
