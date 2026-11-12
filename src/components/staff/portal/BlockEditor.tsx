"use client";
/* eslint-disable @next/next/no-img-element -- pictures here are the community's own files or local uploads, shown as-is */
/* eslint-disable react-hooks/refs, react-hooks/purity -- the refs (caret target, typing run, saved selection) and
   Date.now are only read inside event handlers; the per-block handler factories are built during render, which these
   rules can't tell apart from reading them. */

// Website → Pages → Edit: a full-screen block editor laid out like the page editor most website people already know.
// Top bar (back, add block, undo/redo, list view; the page's name in the middle; preview, view, Save, settings and
// options on the right), the page as blocks on a canvas styled like the public site, a toolbar over the selected block,
// "/" to pick a block, a settings sidebar with Page and Block tabs, a breadcrumb along the bottom, and a media library.
// Live blocks fill themselves from elsewhere in Kinlight: they can be moved or removed, never retyped.
// Everything stays in this browser.
import {
  createElement, useLayoutEffect, useMemo, useRef, useState,
  type ClipboardEvent as RClip, type CSSProperties, type FormEvent, type KeyboardEvent as RKey, type MouseEvent as RMouse, type ReactNode, type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { Align, Block, BlockType, FontSize, MediaItem, Tone } from "@/data/staff/blocks";
import type { Rhythm, SitePage } from "@/data/staff/website";

/* ------------------------------------------------------------ types and helpers */

export interface EditorDoc { title: string; blocks: Block[]; meta: string; rhythm: Rhythm; owner: string }

type Where = "start" | "end" | number;
type IconName =
  | "plus" | "close" | "undo" | "redo" | "listview" | "sidebar" | "more" | "desktop" | "tablet" | "mobile" | "external" | "back"
  | "chevUp" | "chevDown" | "chevRight" | "drag" | "link" | "alignLeft" | "alignCenter" | "alignRight" | "paragraph" | "heading"
  | "list" | "olist" | "quote" | "image" | "gallery" | "buttons" | "columns" | "separator" | "spacer" | "live" | "page" | "search"
  | "check" | "trash" | "copy" | "upload" | "pattern" | "media" | "keyboard" | "wide" | "full" | "none";

const uid = () => Math.random().toString(36).slice(2, 9);
const plain = (h: string) =>
  h.replace(/<br\s*\/?>/gi, " ").replace(/<\/(p|li|div|h\d)>/gi, " ").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cleanHtml = (h: string) => (/^(<br\s*\/?>)?$/i.test(h) ? "" : h);
const TEXTUAL = new Set<BlockType>(["paragraph", "heading", "list", "quote"]);
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const key = (k: string) => (isMac() ? k.replace("Ctrl+", "⌘").replace("Shift+", "⇧").replace("Alt+", "⌥") : k);

const NAMES: Record<BlockType, string> = {
  paragraph: "Paragraph", heading: "Heading", list: "List", quote: "Quote", image: "Image", gallery: "Gallery",
  buttons: "Buttons", columns: "Columns", separator: "Separator", spacer: "Spacer", live: "Live block",
};
const DESC: Record<BlockType, string> = {
  paragraph: "Plain words. The block most pages are made of.",
  heading: "A title for a part of the page, so people can scan it.",
  list: "Points in a row, with bullets or numbers.",
  quote: "Someone’s words, with who said them.",
  image: "One photo, with a caption if you like.",
  gallery: "Several photos in a grid.",
  buttons: "Links that look like buttons, such as Book a tour.",
  columns: "Words side by side.",
  separator: "A line between parts of the page.",
  spacer: "Space between blocks.",
  live: "Fills itself from elsewhere in Kinlight, so it’s never out of date.",
};
const ICONS: Record<BlockType, IconName> = {
  paragraph: "paragraph", heading: "heading", list: "list", quote: "quote", image: "image", gallery: "gallery",
  buttons: "buttons", columns: "columns", separator: "separator", spacer: "spacer", live: "live",
};
const SIZES: { k: FontSize; label: string; short: string }[] = [
  { k: "small", label: "Small", short: "S" }, { k: "medium", label: "Medium", short: "M" }, { k: "large", label: "Large", short: "L" }, { k: "x-large", label: "Extra large", short: "XL" },
];
const TONES: { k: Tone; label: string; fg: string; bg: string }[] = [
  { k: "default", label: "Default", fg: "#26343c", bg: "#ffffff" },
  { k: "accent", label: "Slate", fg: "#415a68", bg: "#e3eaee" },
  { k: "muted", label: "Sage", fg: "#5f6e5e", bg: "#e9eee8" },
  { k: "contrast", label: "Brick", fg: "#b33536", bg: "#f7e1e0" },
];
const RHYTHMS: Rhythm[] = ["Weekly", "Monthly", "Every 3 months", "Every 6 months", "Every year"];

function blank(t: Exclude<BlockType, "live">): Block {
  const id = uid();
  switch (t) {
    case "paragraph": return { id, type: t, html: "" };
    case "heading": return { id, type: t, html: "", level: 2 };
    case "list": return { id, type: t, items: [""] };
    case "quote": return { id, type: t, html: "", cite: "" };
    case "image": return { id, type: t, src: "", alt: "", caption: "", align: "wide" };
    case "gallery": return { id, type: t, images: [], columns: 3 };
    case "buttons": return { id, type: t, buttons: [{ text: "", href: "", style: "fill" }] };
    case "columns": return { id, type: t, cols: [{ heading: "", html: "" }, { heading: "", html: "" }] };
    case "separator": return { id, type: t };
    case "spacer": return { id, type: t, height: 48 };
  }
}

const textOf = (b: Block) => (b.type === "paragraph" || b.type === "heading" || b.type === "quote" ? b.html : b.type === "list" ? b.items.join("<br>") : "");

function transform(b: Block, to: "paragraph" | "heading" | "list" | "quote"): Block {
  const html = textOf(b);
  switch (to) {
    case "paragraph": return { id: b.id, type: "paragraph", html };
    case "heading": return { id: b.id, type: "heading", html: html.replace(/<br\s*\/?>/gi, " "), level: 2 };
    case "list": return { id: b.id, type: "list", items: html.split(/<br\s*\/?>/i) };
    case "quote": return { id: b.id, type: "quote", html, cite: "" };
  }
}

function blockLabel(b: Block) {
  if (b.type === "heading") return plain(b.html) || "Heading";
  if (b.type === "live") return b.title;
  if (b.type === "image") return b.alt ? `Image: ${b.alt}` : "Image";
  return NAMES[b.type];
}

/* ------------------------------------------------------------ caret */

function placeCaret(el: HTMLElement, where: Where) {
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  if (typeof where === "number") {
    let left = where;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    let done = false;
    while ((node = walk.nextNode())) {
      const len = node.textContent?.length ?? 0;
      if (left <= len) { r.setStart(node, left); r.collapse(true); done = true; break; }
      left -= len;
    }
    if (!done) { r.selectNodeContents(el); r.collapse(false); }
  } else {
    r.selectNodeContents(el);
    r.collapse(where === "start");
  }
  sel.removeAllRanges();
  sel.addRange(r);
}

function caretAt(el: HTMLElement, edge: "start" | "end") {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return false;
  const r = sel.getRangeAt(0);
  if (!r.collapsed || !el.contains(r.startContainer)) return false;
  const x = document.createRange();
  x.selectNodeContents(el);
  if (edge === "start") x.setEnd(r.startContainer, r.startOffset);
  else x.setStart(r.endContainer, r.endOffset);
  return x.toString().length === 0;
}

function splitAtCaret(el: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return { before: cleanHtml(el.innerHTML), after: "" };
  const r = sel.getRangeAt(0);
  r.deleteContents();
  const tail = document.createRange();
  tail.selectNodeContents(el);
  tail.setStart(r.endContainer, r.endOffset);
  const d = document.createElement("div");
  d.appendChild(tail.extractContents());
  return { before: cleanHtml(el.innerHTML), after: cleanHtml(d.innerHTML) };
}

/* ------------------------------------------------------------ icons */

const PATHS: Record<IconName, ReactNode> = {
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  undo: <><path d="M9 14 4.5 9.5 9 5" /><path d="M4.5 9.5H14a5 5 0 0 1 0 10h-3" /></>,
  redo: <><path d="m15 14 4.5-4.5L15 5" /><path d="M19.5 9.5H10a5 5 0 0 0 0 10h3" /></>,
  listview: <><path d="M9.5 7h10M9.5 12h10M9.5 17h10" /><path d="M4.5 7h1.5M4.5 12h1.5M4.5 17h1.5" strokeWidth={2.2} /></>,
  sidebar: <><rect x="3.75" y="4.75" width="16.5" height="14.5" rx="1.5" /><path d="M14.5 4.75v14.5" /></>,
  more: <><circle cx="12" cy="5.5" r="1.4" className="f" /><circle cx="12" cy="12" r="1.4" className="f" /><circle cx="12" cy="18.5" r="1.4" className="f" /></>,
  desktop: <><rect x="3.5" y="4.5" width="17" height="11.5" rx="1" /><path d="M9 19.5h6M12 16v3.5" /></>,
  tablet: <><rect x="5.5" y="3.5" width="13" height="17" rx="1.5" /><path d="M11 17.5h2" /></>,
  mobile: <><rect x="7.5" y="3.5" width="9" height="17" rx="1.5" /><path d="M11 17.5h2" /></>,
  external: <><path d="M13.5 4.5h6v6M19.5 4.5l-8.5 8.5" /><path d="M17.5 13.5v5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h5" /></>,
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevUp: <path d="m7 14.5 5-5 5 5" />,
  chevDown: <path d="m7 9.5 5 5 5-5" />,
  chevRight: <path d="m10 7 5 5-5 5" />,
  drag: <>{[7, 12, 17].flatMap((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" className="f" />))}</>,
  link: <><path d="M10.5 13.5a3.8 3.8 0 0 0 5.4 0l3-3a3.8 3.8 0 0 0-5.4-5.4l-1.1 1.1" /><path d="M13.5 10.5a3.8 3.8 0 0 0-5.4 0l-3 3a3.8 3.8 0 0 0 5.4 5.4l1.1-1.1" /></>,
  alignLeft: <path d="M4.5 6.5h15M4.5 10.5h9M4.5 14.5h15M4.5 18.5h9" />,
  alignCenter: <path d="M4.5 6.5h15M7.5 10.5h9M4.5 14.5h15M7.5 18.5h9" />,
  alignRight: <path d="M4.5 6.5h15M10.5 10.5h9M4.5 14.5h15M10.5 18.5h9" />,
  paragraph: <path d="M13 4.5v15M16.5 4.5v15M18.5 4.5H10a3.75 3.75 0 0 0 0 7.5h3" />,
  heading: <path d="M6.5 5v14M17.5 5v14M6.5 12h11" />,
  list: <><path d="M10 7h9.5M10 12h9.5M10 17h9.5" /><circle cx="5.5" cy="7" r="1.2" className="f" /><circle cx="5.5" cy="12" r="1.2" className="f" /><circle cx="5.5" cy="17" r="1.2" className="f" /></>,
  olist: <><path d="M10.5 7h9M10.5 12h9M10.5 17h9" /><path d="M5 5.5h1v3.5M4.5 15.5h2l-2 3h2" /></>,
  quote: <path d="M10 7.5H6.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H9v.5c0 1.8-1 3-3 3.5M18.5 7.5H15a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h2.5v.5c0 1.8-1 3-3 3.5" />,
  image: <><rect x="3.75" y="4.75" width="16.5" height="14.5" rx="1.5" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17.5 4.5-4.5 4 4 2.5-2.5 5 5" /></>,
  gallery: <><rect x="6.75" y="3.75" width="13.5" height="12.5" rx="1.2" /><path d="M3.75 7.5v11.25a1.5 1.5 0 0 0 1.5 1.5H17" /><path d="m7 14 3.5-3.5 3 3 2-2 4.5 4.5" /></>,
  buttons: <><rect x="3.75" y="8.25" width="16.5" height="7.5" rx="2" /><path d="M8.5 12h7" /></>,
  columns: <><rect x="3.75" y="4.75" width="16.5" height="14.5" rx="1" /><path d="M12 4.75v14.5" /></>,
  separator: <><path d="M4 12h16" /><path d="M8 6.5h8M8 17.5h8" opacity=".35" /></>,
  spacer: <path d="M12 5v14M8.5 8 12 4.5 15.5 8M8.5 16l3.5 3.5 3.5-3.5" />,
  live: <><path d="M5 12a7 7 0 0 1 12.2-4.7M19 12a7 7 0 0 1-12.2 4.7" /><path d="M17.5 3.5v4h-4M6.5 20.5v-4h4" /></>,
  page: <><path d="M7 3.75h7.25l4 4v12.5H7z" /><path d="M14 3.75v4h4.25M9.5 12h6M9.5 15.5h6" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6" /><path d="m19.5 19.5-4.6-4.6" /></>,
  check: <path d="m5.5 12.5 4 4 9-9.5" />,
  trash: <><path d="M5 7.5h14M10 7.5V5h4v2.5M7 7.5l1 12h8l1-12" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="1.2" /><path d="M5.5 15.5h-.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9.5a1 1 0 0 1 1 1v.5" /></>,
  upload: <path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M5 19.5h14" />,
  pattern: <><rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1" /><rect x="13" y="4.5" width="6.5" height="6.5" rx="1" /><rect x="4.5" y="13" width="6.5" height="6.5" rx="1" /><rect x="13" y="13" width="6.5" height="6.5" rx="1" /></>,
  media: <><rect x="3.75" y="4.75" width="16.5" height="14.5" rx="1.5" /><path d="m10 9 5 3-5 3z" /></>,
  keyboard: <><rect x="3" y="6.5" width="18" height="11" rx="1.5" /><path d="M6.5 10h1M10 10h1M13.5 10h1M17 10h.5M8 14h8" /></>,
  wide: <><path d="M4 5.5h16M4 18.5h16" /><rect x="5.5" y="8.5" width="13" height="7" rx="1" /></>,
  full: <><path d="M4 5.5h16M4 18.5h16" /><rect x="3.5" y="8.5" width="17" height="7" /></>,
  none: <><path d="M4 5.5h16M4 18.5h16" /><rect x="8" y="8.5" width="8" height="7" rx="1" /></>,
};

function Ico({ n, size = 24 }: { n: IconName; size?: number }) {
  return <svg className="be-ico" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">{PATHS[n]}</svg>;
}

/* ------------------------------------------------------------ rich text */

interface RTProps {
  rid?: string; tag?: string; html: string; onChange: (html: string, el: HTMLElement) => void; placeholder?: string;
  className?: string; style?: CSSProperties; onKeyDown?: (e: RKey<HTMLElement>) => void; inline?: boolean; label?: string;
}

/** An editable piece of text. Uncontrolled while typing; brought back in line when the value changes from outside (undo). */
function RichText({ rid, tag = "p", html, onChange, placeholder, className, style, onKeyDown, inline, label }: RTProps) {
  const ref = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== html) el.innerHTML = html;
  }, [html]);
  const empty = !html || /^(<li>(<br>)?<\/li>)+$/.test(html);
  const Tag = tag as "p";
  return (
    <Tag
      ref={ref as RefObject<HTMLParagraphElement>}
      data-rt={rid}
      className={`be-rt${className ? ` ${className}` : ""}`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={inline ? undefined : true}
      aria-label={label ?? placeholder}
      data-placeholder={placeholder}
      data-empty={empty ? "" : undefined}
      onInput={(e: FormEvent<HTMLElement>) => onChange(cleanHtml(e.currentTarget.innerHTML), e.currentTarget)}
      onKeyDown={onKeyDown}
      onPaste={(e: RClip<HTMLElement>) => {
        e.preventDefault();
        const t = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, inline ? t.replace(/\s+/g, " ") : t);
      }}
    />
  );
}

/* ------------------------------------------------------------ small pieces */

function Panel({ title, open = true, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="be-panel" open={open}>
      <summary><span>{title}</span><Ico n="chevUp" size={20} /></summary>
      <div className="be-panel-b">{children}</div>
    </details>
  );
}

function Seg<T extends string | number>({ value, options, onChange, label }: { value: T; options: { k: T; label: string; short?: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="be-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.k)} type="button" role="radio" aria-checked={value === o.k} aria-label={o.label} title={o.label} className={value === o.k ? "is-on" : ""} onClick={() => onChange(o.k)}>
          {o.short ?? o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="be-toggle">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="be-toggle-t" aria-hidden="true"><span /></span>
      {label}
    </label>
  );
}

function MenuItem({ icon, children, kbd, onClick, checked, danger, disabled }: { icon?: IconName; children: ReactNode; kbd?: string; onClick?: () => void; checked?: boolean; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" role={checked === undefined ? "menuitem" : "menuitemcheckbox"} aria-checked={checked} disabled={disabled} className={`be-mi${danger ? " is-danger" : ""}`} onClick={onClick}>
      <span className="be-mi-i">{checked ? <Ico n="check" size={20} /> : icon ? <Ico n={icon} size={20} /> : null}</span>
      <span className="be-mi-t">{children}</span>
      {kbd && <kbd>{kbd}</kbd>}
    </button>
  );
}

/* ------------------------------------------------------------ the editor */

interface Item { key: string; name: string; icon: IconName; cat: "Text" | "Media" | "Design" | "Fills itself"; kw: string; make: () => Block }
interface Pattern { name: string; make: () => Block[] }
type Menu = null | "transform" | "level" | "align" | "imgAlign" | "format" | "block" | "device" | "options" | "link";
type Media = null | { id: string; mode: "image" | "gallery" } | { id: null; mode: "insert" };

export interface BlockEditorProps {
  page: SitePage;
  site: string;
  siteShort: string;
  media: MediaItem[];
  live: Block[];
  links: { title: string; path: string }[];
  owners: string[];
  canAssign: boolean;
  langs: string[];
  onSave: (d: EditorDoc) => void;
  onClose: () => void;
}

export function BlockEditor(props: BlockEditorProps) {
  const { page, site, siteShort, media, live, links, owners, canAssign, langs, onSave, onClose } = props;
  const root = useRef<HTMLDivElement>(null);

  const [hist, setHist] = useState(() => {
    const first = page.blocks.find((b) => b.type === "paragraph");
    const meta = plain(first?.type === "paragraph" ? first.html : page.text).slice(0, 155).replace(/\s\S*$/, "") + "…";
    const doc: EditorDoc = { title: page.title, blocks: page.blocks, meta, rhythm: page.rhythm, owner: page.ownerName };
    return { past: [] as EditorDoc[], doc, future: [] as EditorDoc[] };
  });
  const doc = hist.doc;
  const [saved, setSaved] = useState(hist.doc);
  const dirty = doc !== saved;
  const [saving, setSaving] = useState(false);

  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<"page" | "block">("page");
  const [side, setSide] = useState(() => typeof window === "undefined" || window.innerWidth >= 960);
  const [left, setLeft] = useState<null | "inserter" | "list">(null);
  const [insTab, setInsTab] = useState<"blocks" | "patterns" | "media">("blocks");
  const [lvTab, setLvTab] = useState<"list" | "outline">("list");
  const [search, setSearch] = useState("");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [menu, setMenu] = useState<Menu>(null);
  const [slash, setSlash] = useState<{ id: string; q: string; i: number } | null>(null);
  const [quick, setQuick] = useState<null | { before?: string; after?: string; replace?: string }>(null);
  const [qq, setQq] = useState("");
  const [mediaFor, setMediaFor] = useState<Media>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [urlFor, setUrlFor] = useState<string | null>(null);
  const [urlVal, setUrlVal] = useState("");
  const [linkVal, setLinkVal] = useState("");
  const [btnIdx, setBtnIdx] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "keys" | "leave" | "palette">(null);
  const [pq, setPq] = useState("");
  const [pi, setPi] = useState(0);
  const [spot, setSpot] = useState(false);
  const [topBar, setTopBar] = useState(false);
  const [code, setCode] = useState(false);
  const [anchors, setAnchors] = useState<Record<string, string>>({});
  const [revs, setRevs] = useState(() => [
    { who: page.ownerName, when: page.updated },
    { who: page.ownerName, when: "Last month" },
    { who: "Kinlight", when: "At launch" },
  ]);

  const typing = useRef<{ key: string; t: number } | null>(null);
  const focusReq = useRef<{ id: string; where: Where } | null>(null);
  const savedRange = useRef<Range | null>(null);
  const snackTimer = useRef<number | undefined>(undefined);

  // Put the caret where the last action asked for it, once the block is on screen.
  useLayoutEffect(() => {
    const f = focusReq.current;
    if (!f) return;
    const el = root.current?.querySelector<HTMLElement>(`[data-rt="${f.id}"]`);
    if (!el) return;
    focusReq.current = null;
    el.focus();
    placeCaret(el, f.where);
  });

  // The editor covers the whole window, like full-screen mode: stop the page behind it scrolling.
  useLayoutEffect(() => {
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = o; window.clearTimeout(snackTimer.current); };
  }, []);

  /* ---------------- changes and history */

  const change = (fn: (d: EditorDoc) => EditorDoc, k?: string) => {
    const now = Date.now();
    const merge = !!k && typing.current?.key === k && now - typing.current.t < 1200;
    typing.current = k ? { key: k, t: now } : null;
    setHist((h) => {
      const next = fn(h.doc);
      if (next === h.doc) return h;
      return { past: merge ? h.past : [...h.past.slice(-99), h.doc], doc: next, future: [] };
    });
  };
  const mut = (id: string, fn: (b: Block) => Block, k?: string) => change((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? fn(b) : b)) }), k);
  const set = (id: string, patch: object, k?: string) => mut(id, (b) => ({ ...b, ...patch }) as Block, k);
  const undo = () => { typing.current = null; setHist((h) => (h.past.length ? { past: h.past.slice(0, -1), doc: h.past[h.past.length - 1], future: [h.doc, ...h.future] } : h)); };
  const redo = () => { typing.current = null; setHist((h) => (h.future.length ? { past: [...h.past, h.doc], doc: h.future[0], future: h.future.slice(1) } : h)); };

  const select = (id: string | null) => {
    setSel(id);
    setTab(id ? "block" : "page");
    if (!id) setSlash(null);
  };
  const focusBlock = (id: string, where: Where) => { focusReq.current = { id, where }; };

  const insert = (b: Block | Block[], at: { after?: string | null; before?: string; replace?: string } = {}) => {
    const list = Array.isArray(b) ? b : [b];
    if (!list.length) return;
    change((d) => {
      const bs = [...d.blocks];
      if (at.replace) {
        const i = bs.findIndex((x) => x.id === at.replace);
        bs.splice(i < 0 ? bs.length : i, i < 0 ? 0 : 1, ...list);
      } else if (at.before) {
        const i = bs.findIndex((x) => x.id === at.before);
        bs.splice(i < 0 ? 0 : i, 0, ...list);
      } else {
        const a = at.after === undefined ? sel : at.after;
        const i = a ? bs.findIndex((x) => x.id === a) : -1;
        if (i < 0) bs.push(...list); else bs.splice(i + 1, 0, ...list);
      }
      return { ...d, blocks: bs };
    });
    select(list[0].id);
    if (TEXTUAL.has(list[0].type)) focusBlock(list[0].id, "end");
    setTimeout(() => root.current?.querySelector(`[data-block="${list[0].id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 30);
  };

  const remove = (id: string) => {
    const i = doc.blocks.findIndex((b) => b.id === id);
    const next = doc.blocks[i - 1] ?? doc.blocks[i + 1];
    change((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
    select(next?.id ?? null);
    if (next && TEXTUAL.has(next.type)) focusBlock(next.id, "end");
    else if (next) setTimeout(() => root.current?.querySelector<HTMLElement>(`[data-block="${next.id}"]`)?.focus(), 0);
  };
  const move = (id: string, dir: -1 | 1) => change((d) => {
    const i = d.blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= d.blocks.length) return d;
    const bs = [...d.blocks];
    [bs[i], bs[j]] = [bs[j], bs[i]];
    return { ...d, blocks: bs };
  });
  const duplicate = (id: string) => {
    const b = doc.blocks.find((x) => x.id === id);
    if (b) insert({ ...structuredClone(b), id: uid() }, { after: id });
  };

  const flash = (msg: string) => {
    setSnack(msg);
    window.clearTimeout(snackTimer.current);
    snackTimer.current = window.setTimeout(() => setSnack(null), 6000);
  };

  const save = () => {
    if (!dirty || saving) return;
    const d = doc;
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setSaved(d);
      onSave(d);
      setRevs((r) => [{ who: "You", when: "Just now" }, ...r]);
      flash(langs.length ? `Page updated, in English and ${langs.length === 1 ? langs[0] : `${langs.length} other languages`}.` : "Page updated.");
    }, 650);
  };
  const tryClose = () => (dirty ? setModal("leave") : onClose());

  /* ---------------- what can be added */

  const items: Item[] = useMemo(() => [
    { key: "paragraph", name: "Paragraph", icon: "paragraph", cat: "Text", kw: "text words p", make: () => blank("paragraph") },
    { key: "heading", name: "Heading", icon: "heading", cat: "Text", kw: "title h2 h3 subtitle", make: () => blank("heading") },
    { key: "list", name: "List", icon: "list", cat: "Text", kw: "bullets points numbered ul ol", make: () => blank("list") },
    { key: "quote", name: "Quote", icon: "quote", cat: "Text", kw: "testimonial cite words", make: () => blank("quote") },
    { key: "image", name: "Image", icon: "image", cat: "Media", kw: "photo picture img", make: () => blank("image") },
    { key: "gallery", name: "Gallery", icon: "gallery", cat: "Media", kw: "photos album grid", make: () => blank("gallery") },
    { key: "buttons", name: "Buttons", icon: "buttons", cat: "Design", kw: "link cta call to action tour", make: () => blank("buttons") },
    { key: "columns", name: "Columns", icon: "columns", cat: "Design", kw: "side by side layout", make: () => blank("columns") },
    { key: "separator", name: "Separator", icon: "separator", cat: "Design", kw: "line divider hr", make: () => blank("separator") },
    { key: "spacer", name: "Spacer", icon: "spacer", cat: "Design", kw: "space gap", make: () => blank("spacer") },
    ...live.map((l): Item => ({ key: `live-${l.type === "live" ? l.source : l.id}`, name: l.type === "live" ? l.title : "Live", icon: "live", cat: "Fills itself", kw: `live ${l.type === "live" ? l.from : ""}`, make: () => ({ ...structuredClone(l), id: uid() }) })),
  ], [live]);
  const match = (q: string) => (it: Item) => {
    const s = q.trim().toLowerCase();
    return !s || it.name.toLowerCase().includes(s) || it.kw.includes(s);
  };
  const popular = ["paragraph", "heading", "image", "list", "buttons", "quote"];

  const patterns: Pattern[] = useMemo(() => [
    { name: "Book a tour", make: () => [
      { id: uid(), type: "heading", html: "Come and see for yourself", level: 2, align: "center" },
      { id: uid(), type: "paragraph", html: "Tours run every day, and lunch is on us.", align: "center" },
      { id: uid(), type: "buttons", align: "center", buttons: [{ text: "Book a tour", href: "/tour", style: "fill" }, { text: "Call us", href: "/contact", style: "outline" }] },
    ] },
    { name: "Photo and words", make: () => [
      { id: uid(), type: "image", src: media[0]?.src ?? "", alt: media[0]?.alt ?? "", caption: "", align: "wide" },
      { id: uid(), type: "paragraph", html: "A line or two about what’s in the photo.", size: "large" },
    ] },
    { name: "A resident’s words", make: () => [
      { id: uid(), type: "quote", html: "The best part of my week is Thursday lunch with my friends.", cite: "A resident" },
    ] },
    { name: "Questions and answers", make: () => [
      { id: uid(), type: "heading", html: "A question families ask", level: 3 },
      { id: uid(), type: "paragraph", html: "A short, plain answer." },
      { id: uid(), type: "heading", html: "Another question", level: 3 },
      { id: uid(), type: "paragraph", html: "Another short answer." },
    ] },
    { name: "Two columns", make: () => [
      { id: uid(), type: "columns", cols: [{ heading: "Mornings", html: "Coffee, the paper and a walk by the lake." }, { heading: "Evenings", html: "Dinner with friends, then music in the lounge." }] },
    ] },
    { name: "Photo grid", make: () => [
      { id: uid(), type: "gallery", columns: 3, images: media.slice(0, 6).map((m) => ({ src: m.src, alt: m.alt })) },
    ] },
  ], [media]);

  /* ---------------- formatting */

  const exec = (cmd: string, value?: string) => document.execCommand(cmd, false, value);
  const keepSel = (e: RMouse) => { if ((e.target as HTMLElement).closest("button, a")) e.preventDefault(); };
  const openLink = () => {
    const s = window.getSelection();
    savedRange.current = s && s.rangeCount ? s.getRangeAt(0).cloneRange() : null;
    const b = doc.blocks.find((x) => x.id === sel);
    const node = savedRange.current?.startContainer;
    const a = (node instanceof Element ? node : node?.parentElement)?.closest("a");
    setLinkVal(b?.type === "buttons" ? b.buttons[btnIdx]?.href ?? "" : a?.getAttribute("href") ?? "");
    setMenu("link");
  };
  const applyLink = (href: string) => {
    const b = doc.blocks.find((x) => x.id === sel);
    setMenu(null);
    if (!b) return;
    if (b.type === "buttons") {
      mut(b.id, (x) => (x.type === "buttons" ? { ...x, buttons: x.buttons.map((y, j) => (j === btnIdx ? { ...y, href } : y)) } : x));
      return;
    }
    const r = savedRange.current;
    if (!r) return;
    const host = (r.startContainer instanceof Element ? r.startContainer : r.startContainer.parentElement)?.closest<HTMLElement>("[contenteditable]");
    if (!host) return;
    host.focus();
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    if (!href) exec("unlink");
    else if (r.collapsed) exec("insertHTML", `<a href="${esc(href)}">${esc(links.find((l) => l.path === href)?.title ?? href)}</a>`);
    else exec("createLink", href);
  };

  /* ---------------- keys */

  const slashItems = slash ? items.filter(match(slash.q)).slice(0, 9) : [];
  const pickSlash = (it: Item) => {
    if (!slash) return;
    insert(it.make(), { replace: slash.id });
    setSlash(null);
  };

  const textKeys = (b: Block) => (e: RKey<HTMLElement>) => {
    const el = e.currentTarget;
    if (slash && slash.id === b.id && slashItems.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlash({ ...slash, i: (slash.i + 1) % slashItems.length }); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlash({ ...slash, i: (slash.i - 1 + slashItems.length) % slashItems.length }); return; }
      if (e.key === "Enter") { e.preventDefault(); pickSlash(slashItems[slash.i] ?? slashItems[0]); return; }
      if (e.key === "Escape") { e.preventDefault(); setSlash(null); return; }
    }
    const i = doc.blocks.findIndex((x) => x.id === b.id);
    const prev = doc.blocks[i - 1];
    const next = doc.blocks[i + 1];

    if (e.key === "Enter" && !e.shiftKey && (b.type === "paragraph" || b.type === "heading")) {
      e.preventDefault();
      const { before, after } = splitAtCaret(el);
      const nb: Block = { id: uid(), type: "paragraph", html: after };
      change((d) => ({ ...d, blocks: d.blocks.flatMap((x) => (x.id === b.id ? [{ ...x, html: before } as Block, nb] : [x])) }));
      select(nb.id);
      focusBlock(nb.id, "start");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && b.type === "list") {
      // Enter on an empty last point leaves the list, like a word processor.
      const s = window.getSelection();
      const node = s?.anchorNode;
      const li = (node instanceof Element ? node : node?.parentElement)?.closest("li");
      const lis = el.querySelectorAll(":scope > li");
      if (li && li === lis[lis.length - 1] && !li.textContent && lis.length > 1) {
        e.preventDefault();
        const nb: Block = { id: uid(), type: "paragraph", html: "" };
        change((d) => ({ ...d, blocks: d.blocks.flatMap((x) => (x.id === b.id && x.type === "list" ? [{ ...x, items: x.items.slice(0, -1) }, nb] : [x])) }));
        select(nb.id);
        focusBlock(nb.id, "start");
      }
      return;
    }
    if (e.key === "Backspace" && caretAt(el, "start")) {
      const empty = !(el.textContent ?? "").length && !el.querySelector("img");
      if (empty && b.type !== "paragraph") {
        e.preventDefault();
        mut(b.id, (x) => transform(x, "paragraph"));
        focusBlock(b.id, "start");
        return;
      }
      if (empty && doc.blocks.length > 1) {
        e.preventDefault();
        remove(b.id);
        return;
      }
      if (prev && (prev.type === "paragraph" || prev.type === "heading") && (b.type === "paragraph" || b.type === "heading")) {
        e.preventDefault();
        const off = plain(prev.html).length;
        change((d) => ({ ...d, blocks: d.blocks.filter((x) => x.id !== b.id).map((x) => (x.id === prev.id && x.type === prev.type ? { ...x, html: prev.html + b.html } : x)) }));
        select(prev.id);
        focusBlock(prev.id, off);
      }
      return;
    }
    if (e.key === "ArrowUp" && prev && caretAt(el, "start")) {
      if (TEXTUAL.has(prev.type)) { e.preventDefault(); select(prev.id); focusBlock(prev.id, "end"); }
      return;
    }
    if (e.key === "ArrowDown" && next && caretAt(el, "end")) {
      if (TEXTUAL.has(next.type)) { e.preventDefault(); select(next.id); focusBlock(next.id, "start"); }
    }
  };

  const objectKeys = (b: Block) => (e: RKey<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); remove(b.id); }
    if (e.key === "Enter") { e.preventDefault(); insert(blank("paragraph"), { after: b.id }); }
  };

  const onRootKey = (e: RKey<HTMLDivElement>) => {
    const ctrl = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (ctrl && k === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if ((ctrl && k === "z" && e.shiftKey) || (ctrl && k === "y")) { e.preventDefault(); redo(); return; }
    if (ctrl && k === "s") { e.preventDefault(); save(); return; }
    if (ctrl && k === "k") { e.preventDefault(); setPq(""); setPi(0); setModal("palette"); return; }
    if (ctrl && e.shiftKey && k === "d" && sel) { e.preventDefault(); duplicate(sel); return; }
    if (e.shiftKey && e.altKey && k === "z" && sel) { e.preventDefault(); remove(sel); return; }
    if (ctrl && e.altKey && k === "t" && sel) { e.preventDefault(); insert(blank("paragraph"), { before: sel }); return; }
    if (ctrl && e.altKey && k === "y" && sel) { e.preventDefault(); insert(blank("paragraph"), { after: sel }); return; }
    if (ctrl && e.altKey && k === "o") { e.preventDefault(); setLeft((x) => (x === "list" ? null : "list")); return; }
    if (ctrl && e.shiftKey && k === ",") { e.preventDefault(); setSide((x) => !x); return; }
    if (e.key === "Escape") {
      if (modal) setModal(null);
      else if (menu) setMenu(null);
      else if (quick) setQuick(null);
      else if (slash) setSlash(null);
      else if (mediaFor) setMediaFor(null);
      else select(null);
    }
  };

  /* ---------------- render: block toolbar */

  const selBlock = doc.blocks.find((b) => b.id === sel) ?? null;
  const selIndex = selBlock ? doc.blocks.indexOf(selBlock) : -1;

  const toolbar = (b: Block) => {
    const textual = TEXTUAL.has(b.type);
    const i = doc.blocks.indexOf(b);
    return (
      <div className="be-tb" role="toolbar" aria-label={`${NAMES[b.type]} tools`} onMouseDown={keepSel}>
        <div className="be-tb-g" data-menu="">
          <button type="button" className="be-tb-b" aria-label={`${NAMES[b.type]}: change block type`} aria-haspopup={textual ? "menu" : undefined} title={textual ? "Change block type" : NAMES[b.type]} onClick={() => textual && setMenu((m) => (m === "transform" ? null : "transform"))}>
            <Ico n={b.type === "list" && b.ordered ? "olist" : ICONS[b.type]} />
          </button>
          {menu === "transform" && textual && (
            <div className="be-pop" role="menu">
              <p className="be-pop-h">Transform to</p>
              {(["paragraph", "heading", "list", "quote"] as const).filter((t) => t !== b.type).map((t) => (
                <MenuItem key={t} icon={ICONS[t]} onClick={() => { mut(b.id, (x) => transform(x, t)); setMenu(null); focusBlock(b.id, "end"); }}>{NAMES[t]}</MenuItem>
              ))}
            </div>
          )}
        </div>
        <div className="be-tb-g be-tb-mover">
          <span className="be-tb-drag" aria-hidden="true" title="Drag"><Ico n="drag" /></span>
          <span className="be-tb-ud">
            <button type="button" aria-label="Move up" title={`Move up (${key("Ctrl+Shift+Alt+T")})`} disabled={i === 0} onClick={() => move(b.id, -1)}><Ico n="chevUp" size={20} /></button>
            <button type="button" aria-label="Move down" title="Move down" disabled={i === doc.blocks.length - 1} onClick={() => move(b.id, 1)}><Ico n="chevDown" size={20} /></button>
          </span>
        </div>

        {b.type === "heading" && (
          <div className="be-tb-g" data-menu="">
            <button type="button" className="be-tb-b be-tb-txt" aria-label="Change level" aria-haspopup="menu" onClick={() => setMenu((m) => (m === "level" ? null : "level"))}>H{b.level}<Ico n="chevDown" size={16} /></button>
            {menu === "level" && (
              <div className="be-pop be-pop-row" role="menu">
                {([2, 3, 4] as const).map((l) => (
                  <button key={l} type="button" role="menuitemradio" aria-checked={b.level === l} className={`be-tb-b be-tb-txt${b.level === l ? " is-on" : ""}`} onClick={() => { set(b.id, { level: l }); setMenu(null); }}>H{l}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {(b.type === "paragraph" || b.type === "heading" || b.type === "buttons") && (
          <div className="be-tb-g" data-menu="">
            <button type="button" className="be-tb-b" aria-label="Align text" aria-haspopup="menu" onClick={() => setMenu((m) => (m === "align" ? null : "align"))}>
              <Ico n={b.align === "center" ? "alignCenter" : b.align === "right" ? "alignRight" : "alignLeft"} />
            </button>
            {menu === "align" && (
              <div className="be-pop" role="menu">
                {(["left", "center", "right"] as Align[]).map((a) => (
                  <MenuItem key={a} icon={a === "center" ? "alignCenter" : a === "right" ? "alignRight" : "alignLeft"} checked={(b.align ?? "left") === a ? true : undefined} onClick={() => { set(b.id, { align: a }); setMenu(null); }}>
                    Align text {a}
                  </MenuItem>
                ))}
              </div>
            )}
          </div>
        )}

        {b.type === "list" && (
          <div className="be-tb-g">
            <button type="button" className={`be-tb-b${!b.ordered ? " is-on" : ""}`} aria-label="Bulleted list" aria-pressed={!b.ordered} onClick={() => set(b.id, { ordered: false })}><Ico n="list" /></button>
            <button type="button" className={`be-tb-b${b.ordered ? " is-on" : ""}`} aria-label="Numbered list" aria-pressed={!!b.ordered} onClick={() => set(b.id, { ordered: true })}><Ico n="olist" /></button>
          </div>
        )}

        {b.type === "image" && b.src && (
          <>
            <div className="be-tb-g" data-menu="">
              <button type="button" className="be-tb-b" aria-label="Width" aria-haspopup="menu" onClick={() => setMenu((m) => (m === "imgAlign" ? null : "imgAlign"))}><Ico n={b.align ?? "none"} /></button>
              {menu === "imgAlign" && (
                <div className="be-pop" role="menu">
                  {(["none", "wide", "full"] as const).map((a) => (
                    <MenuItem key={a} icon={a} checked={(b.align ?? "none") === a ? true : undefined} onClick={() => { set(b.id, { align: a }); setMenu(null); }}>
                      {a === "none" ? "Normal width" : a === "wide" ? "Wide width" : "Full width"}
                    </MenuItem>
                  ))}
                </div>
              )}
            </div>
            <div className="be-tb-g">
              <button type="button" className="be-tb-b be-tb-txt" onClick={() => { setPicked([]); setMediaFor({ id: b.id, mode: "image" }); }}>Replace</button>
            </div>
          </>
        )}

        {b.type === "gallery" && (
          <div className="be-tb-g">
            <button type="button" className="be-tb-b be-tb-txt" onClick={() => { setPicked([]); setMediaFor({ id: b.id, mode: "gallery" }); }}>Add</button>
          </div>
        )}

        {(textual || b.type === "columns" || b.type === "buttons") && (
          <div className="be-tb-g" data-menu="">
            {b.type !== "buttons" && (
              <>
                <button type="button" className="be-tb-b be-tb-txt be-b" aria-label="Bold" title={`Bold (${key("Ctrl+B")})`} onClick={() => exec("bold")}>B</button>
                <button type="button" className="be-tb-b be-tb-txt be-i" aria-label="Italic" title={`Italic (${key("Ctrl+I")})`} onClick={() => exec("italic")}>I</button>
              </>
            )}
            <button type="button" className="be-tb-b" aria-label="Link" title={`Link (${key("Ctrl+K")})`} onClick={openLink}><Ico n="link" /></button>
            {b.type !== "buttons" && (
              <button type="button" className="be-tb-b be-tb-more" aria-label="More formatting" aria-haspopup="menu" onClick={() => setMenu((m) => (m === "format" ? null : "format"))}><Ico n="chevDown" size={18} /></button>
            )}
            {menu === "format" && (
              <div className="be-pop" role="menu">
                <MenuItem onClick={() => { exec("strikeThrough"); setMenu(null); }}><s>Strikethrough</s></MenuItem>
                <MenuItem onClick={() => { exec("superscript"); setMenu(null); }}>Superscript</MenuItem>
                <MenuItem onClick={() => { exec("subscript"); setMenu(null); }}>Subscript</MenuItem>
                <MenuItem onClick={() => { exec("hiliteColor", "#f6f2dd"); setMenu(null); }}>Highlight</MenuItem>
                <MenuItem onClick={() => { exec("removeFormat"); exec("unlink"); setMenu(null); }}>Clear formatting</MenuItem>
              </div>
            )}
            {menu === "link" && (
              <div className="be-pop be-link" role="dialog" aria-label="Link">
                <form onSubmit={(e) => { e.preventDefault(); applyLink(linkVal.trim()); }}>
                  <input autoFocus value={linkVal} onChange={(e) => setLinkVal(e.target.value)} placeholder="Search or type a link" aria-label="Link" />
                  <button type="submit" className="be-tb-b" aria-label="Apply"><Ico n="check" /></button>
                </form>
                <ul>
                  {links.filter((l) => !linkVal || l.title.toLowerCase().includes(linkVal.toLowerCase()) || l.path.includes(linkVal)).slice(0, 5).map((l) => (
                    <li key={l.path}><button type="button" onClick={() => applyLink(l.path)}><Ico n="page" size={20} /><span><b>{l.title}</b><small>{l.path}</small></span><em>Page</em></button></li>
                  ))}
                </ul>
                {linkVal && <button type="button" className="be-link-x" onClick={() => applyLink("")}>Remove link</button>}
              </div>
            )}
          </div>
        )}

        {b.type === "live" && (
          <div className="be-tb-g">
            <a className="be-tb-b be-tb-txt" href={b.href}>Edit in {b.from.split(/ (→|and) /)[0]}</a>
          </div>
        )}

        <div className="be-tb-g" data-menu="">
          <button type="button" className="be-tb-b" aria-label="Options" aria-haspopup="menu" onClick={() => setMenu((m) => (m === "block" ? null : "block"))}><Ico n="more" /></button>
          {menu === "block" && (
            <div className="be-pop be-pop-end" role="menu">
              <MenuItem icon="copy" onClick={() => { void navigator.clipboard?.writeText(plain(textOf(b)) || blockLabel(b)); setMenu(null); flash("Copied."); }}>Copy</MenuItem>
              <MenuItem kbd={key("Ctrl+Shift+D")} onClick={() => { duplicate(b.id); setMenu(null); }}>Duplicate</MenuItem>
              <MenuItem kbd={key("Ctrl+Alt+T")} onClick={() => { insert(blank("paragraph"), { before: b.id }); setMenu(null); }}>Add before</MenuItem>
              <MenuItem kbd={key("Ctrl+Alt+Y")} onClick={() => { insert(blank("paragraph"), { after: b.id }); setMenu(null); }}>Add after</MenuItem>
              <hr />
              <MenuItem kbd={key("Shift+Alt+Z")} danger onClick={() => { setMenu(null); remove(b.id); }}>Delete</MenuItem>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---------------- render: blocks */

  const placeholder = (b: Extract<Block, { type: "image" | "gallery" }>) => (
    <div className="be-ph">
      <div className="be-ph-h"><Ico n={ICONS[b.type]} /> {NAMES[b.type]}</div>
      <p>{b.type === "image" ? "Upload a photo, pick one from the media library, or paste a link." : "Pick photos from the media library or upload new ones."}</p>
      <div className="be-ph-a">
        <label className="be-btn be-btn-pri">
          Upload
          <input type="file" accept="image/*" multiple={b.type === "gallery"} className="vh" onChange={(e) => {
            const fs = Array.from(e.target.files ?? []);
            if (!fs.length) return;
            const imgs = fs.map((f) => ({ src: URL.createObjectURL(f), alt: "" }));
            if (b.type === "image") set(b.id, { src: imgs[0].src, alt: "" });
            else set(b.id, { images: [...b.images, ...imgs] });
          }} />
        </label>
        <button type="button" className="be-btn be-btn-sec" onClick={() => { setPicked([]); setMediaFor({ id: b.id, mode: b.type }); }}>Media Library</button>
        {b.type === "image" && <button type="button" className="be-btn be-btn-ter" onClick={() => { setUrlFor(b.id); setUrlVal(""); }}>Insert from URL</button>}
      </div>
      {urlFor === b.id && (
        <form className="be-url" onSubmit={(e) => { e.preventDefault(); if (urlVal.trim()) set(b.id, { src: urlVal.trim() }); setUrlFor(null); }}>
          <input autoFocus value={urlVal} onChange={(e) => setUrlVal(e.target.value)} placeholder="Paste or type a link" aria-label="Image link" />
          <button type="submit" className="be-btn be-btn-pri">Apply</button>
        </form>
      )}
    </div>
  );

  const toneStyle = (fg?: Tone, bg?: Tone): CSSProperties => ({
    color: fg && fg !== "default" ? TONES.find((t) => t.k === fg)?.fg : undefined,
    background: bg && bg !== "default" ? TONES.find((t) => t.k === bg)?.bg : undefined,
  });

  const content = (b: Block) => {
    const on = sel === b.id;
    switch (b.type) {
      case "paragraph":
        return (
          <>
            <RichText rid={b.id} tag="p" html={b.html} label="Paragraph" placeholder={on ? "Type / to choose a block" : undefined}
              className={`fs-${b.size ?? "medium"} al-${b.align ?? "left"}${b.dropCap ? " has-drop" : ""}${b.bg && b.bg !== "default" ? " has-bg" : ""}`}
              style={toneStyle(b.color, b.bg)}
              onChange={(h, el) => {
                set(b.id, { html: h }, b.id);
                const t = el.textContent ?? "";
                if (/^\/[a-z ]{0,20}$/i.test(t) && !/\s{2}/.test(t)) setSlash({ id: b.id, q: t.slice(1), i: 0 });
                else if (slash?.id === b.id) setSlash(null);
              }}
              onKeyDown={textKeys(b)} />
            {on && !b.html && (
              <button type="button" className="be-inline-ins" aria-label="Add block" onClick={() => { setQq(""); setQuick({ replace: b.id }); }}><Ico n="plus" size={20} /></button>
            )}
          </>
        );
      case "heading":
        return <RichText rid={b.id} tag={`h${b.level}`} html={b.html} label={`Heading ${b.level}`} placeholder="Heading" className={`al-${b.align ?? "left"}`} style={toneStyle(b.color)} onChange={(h) => set(b.id, { html: h }, b.id)} onKeyDown={textKeys(b)} />;
      case "list":
        return (
          <RichText rid={b.id} tag={b.ordered ? "ol" : "ul"} html={b.items.map((x) => `<li>${x}</li>`).join("") || "<li></li>"} label="List" placeholder="List"
            onChange={(_, el) => {
              const lis = Array.from(el.querySelectorAll(":scope > li")).map((li) => cleanHtml(li.innerHTML));
              set(b.id, { items: lis.length ? lis : [""] }, b.id);
            }}
            onKeyDown={textKeys(b)} />
        );
      case "quote":
        return (
          <blockquote className="be-quote">
            <RichText rid={b.id} tag="p" html={b.html} label="Quote" placeholder="Add quote" onChange={(h) => set(b.id, { html: h }, b.id)} onKeyDown={textKeys(b)} />
            {(on || b.cite) && <RichText tag="cite" inline html={b.cite} placeholder="Add who said it" onChange={(h) => set(b.id, { cite: h }, `${b.id}c`)} />}
          </blockquote>
        );
      case "image":
        if (!b.src) return placeholder(b);
        return (
          <figure className={`be-img al-${b.align ?? "none"}`}>
            <img src={b.src} alt={b.alt} />
            {(on || b.caption) && <RichText tag="figcaption" inline html={b.caption} placeholder="Add caption" onChange={(h) => set(b.id, { caption: h }, `${b.id}c`)} />}
          </figure>
        );
      case "gallery":
        if (!b.images.length) return placeholder(b);
        return (
          <div className={`be-gal cols-${b.columns}`}>
            {b.images.map((im, k) => (
              <figure key={`${im.src}${k}`}>
                <img src={im.src} alt={im.alt} />
                {on && <button type="button" className="be-gal-x" aria-label={`Remove photo ${k + 1}`} onClick={() => set(b.id, { images: b.images.filter((_, j) => j !== k) })}><Ico n="close" size={16} /></button>}
              </figure>
            ))}
            {on && <button type="button" className="be-gal-add" onClick={() => { setPicked([]); setMediaFor({ id: b.id, mode: "gallery" }); }}><Ico n="plus" /><span>Add</span></button>}
          </div>
        );
      case "buttons":
        return (
          <div className={`be-btns al-${b.align ?? "left"}`}>
            {b.buttons.map((x, k) => (
              <span key={k} className={`be-cta ${x.style}${on && btnIdx === k ? " is-cur" : ""}`} onMouseDown={() => setBtnIdx(k)}>
                <RichText rid={k === 0 ? b.id : `${b.id}-${k}`} tag="span" inline html={x.text} placeholder="Add text…" label={`Button ${k + 1}`}
                  onChange={(h) => mut(b.id, (y) => (y.type === "buttons" ? { ...y, buttons: y.buttons.map((z, j) => (j === k ? { ...z, text: h } : z)) } : y), `${b.id}-${k}`)} />
              </span>
            ))}
            {on && (
              <button type="button" className="be-cta-add" aria-label="Add a button" onClick={() => { mut(b.id, (y) => (y.type === "buttons" ? { ...y, buttons: [...y.buttons, { text: "", href: "", style: "outline" }] } : y)); setBtnIdx(b.buttons.length); focusBlock(`${b.id}-${b.buttons.length}`, "start"); }}>
                <Ico n="plus" size={20} />
              </button>
            )}
          </div>
        );
      case "columns":
        return (
          <div className="be-cols" style={{ gridTemplateColumns: `repeat(${b.cols.length}, minmax(0, 1fr))` }}>
            {b.cols.map((c, k) => (
              <div key={k} className="be-col">
                <RichText tag="h3" inline html={c.heading} placeholder="Heading" onChange={(h) => mut(b.id, (y) => (y.type === "columns" ? { ...y, cols: y.cols.map((z, j) => (j === k ? { ...z, heading: h } : z)) } : y), `${b.id}-h${k}`)} />
                <RichText tag="p" html={c.html} placeholder="Type / to choose a block" onChange={(h) => mut(b.id, (y) => (y.type === "columns" ? { ...y, cols: y.cols.map((z, j) => (j === k ? { ...z, html: h } : z)) } : y), `${b.id}-p${k}`)} />
              </div>
            ))}
          </div>
        );
      case "separator":
        return <hr className="be-sep" />;
      case "spacer":
        return (
          <div className="be-spacer" style={{ height: b.height }}>
            {on && (
              <span className="be-spacer-h" role="slider" aria-label="Height" aria-valuenow={b.height} aria-valuemin={8} aria-valuemax={320} tabIndex={0}
                onKeyDown={(e) => { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); set(b.id, { height: Math.max(8, Math.min(320, b.height + (e.key === "ArrowDown" ? 8 : -8))) }, `${b.id}h`); } }}
                onPointerDown={(e) => {
                  const y0 = e.clientY;
                  const h0 = b.height;
                  const mv = (ev: PointerEvent) => set(b.id, { height: Math.max(8, Math.min(320, Math.round(h0 + ev.clientY - y0))) }, `${b.id}h`);
                  const up = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
                  window.addEventListener("pointermove", mv);
                  window.addEventListener("pointerup", up);
                }} />
            )}
          </div>
        );
      case "live":
        return (
          <div className="be-live">
            <div className="be-live-h"><Ico n="live" size={18} /><b>{b.title}</b><span>Fills itself from {b.from}</span></div>
            <ul className={`be-live-rows${b.rows.some((r) => r.img) ? " has-img" : ""}`}>
              {b.rows.map((r, k) => (
                <li key={k}>
                  {r.img && <img src={r.img} alt="" />}
                  <b>{r.t}</b>
                  {r.s && <small>{r.s}</small>}
                </li>
              ))}
            </ul>
          </div>
        );
    }
  };

  /* ---------------- render: quick inserter */

  const pickQuick = (it: Item) => {
    const q = quick;
    setQuick(null);
    if (!q) return;
    if (q.replace) insert(it.make(), { replace: q.replace });
    else if (q.before) insert(it.make(), { before: q.before });
    else insert(it.make(), { after: doc.blocks[doc.blocks.length - 1]?.id ?? null });
  };
  const quickInserter = (
    <div className="be-quick" data-menu="" role="dialog" aria-label="Add a block">
      <label className="be-search">
        <input autoFocus value={qq} onChange={(e) => setQq(e.target.value)} placeholder="Search" aria-label="Search blocks" />
        <Ico n="search" />
      </label>
      <div className="be-grid">
        {(qq ? items.filter(match(qq)) : items.filter((x) => popular.includes(x.key))).slice(0, 6).map((it) => (
          <button key={it.key} type="button" className="be-item" onClick={() => pickQuick(it)}><Ico n={it.icon} /><span>{it.name}</span></button>
        ))}
      </div>
      <button type="button" className="be-quick-all" onClick={() => { setQuick(null); setSearch(qq); setLeft("inserter"); setInsTab("blocks"); }}>Browse all</button>
    </div>
  );

  /* ---------------- render: panels */

  const words = useMemo(() => {
    const t = [doc.title, ...doc.blocks.map((b) => (b.type === "columns" ? b.cols.map((c) => `${c.heading} ${c.html}`).join(" ") : b.type === "quote" ? `${b.html} ${b.cite}` : b.type === "image" ? b.caption : textOf(b)))].map(plain).join(" ").trim();
    return { chars: t.replace(/\s/g, "").length, words: t ? t.split(/\s+/).length : 0 };
  }, [doc]);

  const inserterPanel = (
    <aside className="be-left" aria-label="Block inserter">
      <div className="be-left-tabs" role="tablist">
        {(["blocks", "patterns", "media"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={insTab === t} className={insTab === t ? "is-on" : ""} onClick={() => setInsTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
        ))}
        <button type="button" className="be-hb be-left-x" aria-label="Close block inserter" onClick={() => setLeft(null)}><Ico n="close" /></button>
      </div>
      {insTab === "blocks" && (
        <div className="be-left-b">
          <label className="be-search">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" aria-label="Search blocks" autoFocus />
            <Ico n="search" />
          </label>
          {(["Text", "Media", "Design", "Fills itself"] as const).map((cat) => {
            const list = items.filter((x) => x.cat === cat).filter(match(search));
            return list.length ? (
              <section key={cat} className="be-cat">
                <h3>{cat}</h3>
                {cat === "Fills itself" && <p className="be-help">Kept up to date by Kinlight from Menus, the calendar, Apartments and Settings.</p>}
                <div className="be-grid">
                  {list.map((it) => (
                    <button key={it.key} type="button" className={`be-item${it.cat === "Fills itself" ? " is-live" : ""}`} onClick={() => insert(it.make())} draggable={false}>
                      <Ico n={it.icon} /><span>{it.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null;
          })}
          {!items.some(match(search)) && <p className="be-help">No blocks found.</p>}
        </div>
      )}
      {insTab === "patterns" && (
        <div className="be-left-b">
          <p className="be-help">Groups of blocks, ready to fill in.</p>
          <ul className="be-pats">
            {patterns.map((p) => (
              <li key={p.name}>
                <button type="button" onClick={() => insert(p.make())}>
                  <span className="be-pat-prev" aria-hidden="true"><span className="be-canvas be-mini">{p.make().map((b) => <div key={b.id} className={`be-block be-${b.type}`}>{staticBlock(b)}</div>)}</span></span>
                  <span className="be-pat-n">{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {insTab === "media" && (
        <div className="be-left-b">
          <p className="be-help">Photos on the website. Only photos with consent on file show people.</p>
          <ul className="be-media-grid">
            {media.map((m) => (
              <li key={m.src}><button type="button" aria-label={`Add ${m.alt || "photo"}`} onClick={() => insert({ id: uid(), type: "image", src: m.src, alt: m.alt, caption: "", align: "wide" })}><img src={m.src} alt="" /></button></li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );

  const heads = doc.blocks.filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading");
  const listPanel = (
    <aside className="be-left" aria-label="Document overview">
      <div className="be-left-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={lvTab === "list"} className={lvTab === "list" ? "is-on" : ""} onClick={() => setLvTab("list")}>List View</button>
        <button type="button" role="tab" aria-selected={lvTab === "outline"} className={lvTab === "outline" ? "is-on" : ""} onClick={() => setLvTab("outline")}>Outline</button>
        <button type="button" className="be-hb be-left-x" aria-label="Close document overview" onClick={() => setLeft(null)}><Ico n="close" /></button>
      </div>
      {lvTab === "list" ? (
        <ul className="be-lv" role="tree" aria-label="Blocks">
          {doc.blocks.map((b) => (
            <li key={b.id} role="treeitem" aria-selected={sel === b.id}>
              <button type="button" className={sel === b.id ? "is-sel" : ""} onClick={() => {
                select(b.id);
                if (TEXTUAL.has(b.type)) focusBlock(b.id, "end");
                root.current?.querySelector(`[data-block="${b.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
              }}>
                <Ico n={b.type === "list" && b.ordered ? "olist" : ICONS[b.type]} size={20} />
                <span>{blockLabel(b)}</span>
                {b.type === "live" && <em>Live</em>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="be-left-b">
          <dl className="be-stats">
            <div><dt>Characters</dt><dd>{words.chars.toLocaleString()}</dd></div>
            <div><dt>Words</dt><dd>{words.words.toLocaleString()}</dd></div>
            <div><dt>Time to read</dt><dd>{Math.max(1, Math.round(words.words / 200))} min</dd></div>
          </dl>
          <h3 className="be-sub">Headings</h3>
          {heads.length ? (
            <ul className="be-outline">
              {heads.map((h) => (
                <li key={h.id} style={{ paddingLeft: (h.level - 2) * 16 }}>
                  <button type="button" onClick={() => { select(h.id); focusBlock(h.id, "end"); }}><b>H{h.level}</b> {plain(h.html) || <i>(Empty heading)</i>}</button>
                </li>
              ))}
            </ul>
          ) : <p className="be-help">No headings yet. Headings help people and search engines find their way around a page.</p>}
        </div>
      )}
    </aside>
  );

  const hero = doc.blocks.find((b): b is Extract<Block, { type: "image" }> => b.type === "image" && !!b.src);
  const firstP = doc.blocks.find((b) => b.type === "paragraph");
  const lives = doc.blocks.filter((b): b is Extract<Block, { type: "live" }> => b.type === "live");

  const pagePanel = (
    <div className="be-side-b">
      <div className="be-feat">
        {hero ? (
          <button type="button" className="be-feat-img" onClick={() => { select(hero.id); setPicked([]); setMediaFor({ id: hero.id, mode: "image" }); }} aria-label="Replace the main photo">
            <img src={hero.src} alt={hero.alt} />
          </button>
        ) : (
          <button type="button" className="be-feat-set" onClick={() => insert({ ...blank("image"), id: uid() }, { before: doc.blocks[0]?.id })}>Set the main photo</button>
        )}
      </div>
      <div className="be-pcard">
        <Ico n="page" />
        <div>
          <b>{doc.title || "(no title)"}</b>
          <p>{plain(firstP?.type === "paragraph" ? firstP.html : "").slice(0, 110) || "No words yet."}</p>
        </div>
      </div>
      <dl className="be-rows">
        <div><dt>Status</dt><dd><span className="be-status"><i /> Published</span></dd></div>
        <div><dt>Last saved</dt><dd>{revs[0].when}</dd></div>
        <div><dt>Link</dt><dd><a href={`${site}${page.path}`} target="_blank" rel="noopener" className="be-a">{page.path}</a></dd></div>
        <div>
          <dt>Owner</dt>
          <dd>
            {canAssign ? (
              <select aria-label="Owner" value={doc.owner} onChange={(e) => change((d) => ({ ...d, owner: e.target.value }))}>
                {[doc.owner, ...owners.filter((o) => o !== doc.owner)].map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : doc.owner}
          </dd>
        </div>
        <div>
          <dt>Look again</dt>
          <dd>
            <select aria-label="How often to look again" value={doc.rhythm} onChange={(e) => change((d) => ({ ...d, rhythm: e.target.value as Rhythm }))}>
              {RHYTHMS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </dd>
        </div>
        <div><dt>Languages</dt><dd>{["English", ...langs].join(", ")}</dd></div>
        <div><dt>Template</dt><dd>Community page</dd></div>
      </dl>
      <Panel title="Search and AI search">
        <label className="be-field">
          <span>Description</span>
          <textarea rows={4} value={doc.meta} onChange={(e) => change((d) => ({ ...d, meta: e.target.value }), "__meta")} />
        </label>
        <p className="be-help">Shows under the page’s name in search results and AI answers. Kinlight wrote it from the page. {doc.meta.length}/155 characters.</p>
      </Panel>
      {lives.length > 0 && (
        <Panel title="Fills itself">
          <ul className="be-plist">
            {lives.map((l) => (
              <li key={l.id}><Ico n="live" size={20} /><span><b>{l.title}</b><small>{l.from} · {l.updates.toLowerCase()}</small></span></li>
            ))}
          </ul>
        </Panel>
      )}
      <Panel title={`Revisions (${revs.length + 9})`} open={false}>
        <ul className="be-plist">
          {revs.map((r, k) => <li key={k}><span><b>{r.who}</b><small>{r.when}</small></span></li>)}
        </ul>
      </Panel>
    </div>
  );

  const blockPanel = !selBlock ? (
    <div className="be-side-b"><p className="be-side-empty">No block selected.</p></div>
  ) : (
    <div className="be-side-b">
      <div className="be-bcard">
        <Ico n={ICONS[selBlock.type]} />
        <div><b>{selBlock.type === "live" ? selBlock.title : NAMES[selBlock.type]}</b><p>{DESC[selBlock.type]}</p></div>
      </div>
      {(selBlock.type === "paragraph" || selBlock.type === "heading") && (
        <Panel title="Color">
          <div className="be-colors">
            <span>Text</span>
            <div className="be-swatches" role="radiogroup" aria-label="Text color">
              {TONES.map((t) => <button key={t.k} type="button" role="radio" aria-checked={(selBlock.color ?? "default") === t.k} aria-label={t.label} title={t.label} style={{ background: t.fg }} onClick={() => set(selBlock.id, { color: t.k })} />)}
            </div>
            {selBlock.type === "paragraph" && (
              <>
                <span>Background</span>
                <div className="be-swatches" role="radiogroup" aria-label="Background color">
                  {TONES.map((t) => <button key={t.k} type="button" role="radio" aria-checked={(selBlock.bg ?? "default") === t.k} aria-label={t.label} title={t.label} style={{ background: t.bg }} onClick={() => set(selBlock.id, { bg: t.k })} />)}
                </div>
              </>
            )}
          </div>
        </Panel>
      )}
      {selBlock.type === "paragraph" && (
        <Panel title="Typography">
          <p className="be-label">Font size</p>
          <Seg label="Font size" value={selBlock.size ?? "medium"} options={SIZES.map((s) => ({ k: s.k, label: s.label, short: s.short }))} onChange={(v) => set(selBlock.id, { size: v })} />
          <Toggle on={!!selBlock.dropCap} onChange={(v) => set(selBlock.id, { dropCap: v })} label="Drop cap" />
        </Panel>
      )}
      {selBlock.type === "heading" && (
        <Panel title="Typography">
          <p className="be-label">Level</p>
          <Seg label="Heading level" value={selBlock.level} options={[2, 3, 4].map((l) => ({ k: l as 2 | 3 | 4, label: `Heading ${l}`, short: `H${l}` }))} onChange={(v) => set(selBlock.id, { level: v })} />
        </Panel>
      )}
      {selBlock.type === "list" && (
        <Panel title="Settings">
          <Seg label="List style" value={selBlock.ordered ? "n" : "b"} options={[{ k: "b", label: "Bulleted" }, { k: "n", label: "Numbered" }]} onChange={(v) => set(selBlock.id, { ordered: v === "n" })} />
        </Panel>
      )}
      {selBlock.type === "image" && (
        <Panel title="Settings">
          <label className="be-field">
            <span>Alternative text</span>
            <textarea rows={3} value={selBlock.alt} onChange={(e) => set(selBlock.id, { alt: e.target.value }, `${selBlock.id}alt`)} />
          </label>
          <p className="be-help">Say what’s in the photo for people who can’t see it. Leave it empty if the photo is only decoration.</p>
          {!selBlock.alt && selBlock.src && <p className="be-warn">This photo has no description yet.</p>}
          <p className="be-label">Width</p>
          <Seg label="Width" value={selBlock.align ?? "none"} options={[{ k: "none", label: "Normal" }, { k: "wide", label: "Wide" }, { k: "full", label: "Full" }]} onChange={(v) => set(selBlock.id, { align: v })} />
          <p className="be-help">Only photos with consent on file show residents.</p>
        </Panel>
      )}
      {selBlock.type === "gallery" && (
        <Panel title="Settings">
          <p className="be-label">Columns</p>
          <Seg label="Columns" value={selBlock.columns} options={[2, 3, 4].map((c) => ({ k: c as 2 | 3 | 4, label: String(c) }))} onChange={(v) => set(selBlock.id, { columns: v })} />
          <p className="be-help">{selBlock.images.length} photo{selBlock.images.length === 1 ? "" : "s"}.</p>
        </Panel>
      )}
      {selBlock.type === "buttons" && (
        <Panel title="Buttons">
          {selBlock.buttons.map((x, k) => (
            <fieldset key={k} className="be-fs">
              <legend>{plain(x.text) || `Button ${k + 1}`}</legend>
              <label className="be-field"><span>Link</span><input value={x.href} placeholder="/tour" onChange={(e) => mut(selBlock.id, (y) => (y.type === "buttons" ? { ...y, buttons: y.buttons.map((z, j) => (j === k ? { ...z, href: e.target.value } : z)) } : y), `${selBlock.id}l${k}`)} /></label>
              <Seg label="Style" value={x.style} options={[{ k: "fill", label: "Fill" }, { k: "outline", label: "Outline" }]} onChange={(v) => mut(selBlock.id, (y) => (y.type === "buttons" ? { ...y, buttons: y.buttons.map((z, j) => (j === k ? { ...z, style: v } : z)) } : y))} />
              {selBlock.buttons.length > 1 && <button type="button" className="be-a be-danger" onClick={() => mut(selBlock.id, (y) => (y.type === "buttons" ? { ...y, buttons: y.buttons.filter((_, j) => j !== k) } : y))}>Remove this button</button>}
            </fieldset>
          ))}
        </Panel>
      )}
      {selBlock.type === "columns" && (
        <Panel title="Settings">
          <p className="be-label">Columns</p>
          <Seg label="Columns" value={selBlock.cols.length} options={[2, 3, 4].map((c) => ({ k: c, label: String(c) }))} onChange={(v) => mut(selBlock.id, (y) => (y.type === "columns" ? { ...y, cols: Array.from({ length: v }, (_, j) => y.cols[j] ?? { heading: "", html: "" }) } : y))} />
        </Panel>
      )}
      {selBlock.type === "spacer" && (
        <Panel title="Settings">
          <label className="be-field be-field-row"><span>Height in pixels</span><input type="number" min={8} max={320} step={8} value={selBlock.height} onChange={(e) => set(selBlock.id, { height: Math.max(8, Math.min(320, Number(e.target.value) || 8)) }, `${selBlock.id}h`)} /></label>
        </Panel>
      )}
      {selBlock.type === "live" && (
        <Panel title="Where it comes from">
          <dl className="be-rows">
            <div><dt>From</dt><dd>{selBlock.from}</dd></div>
            <div><dt>Updates</dt><dd>{selBlock.updates}</dd></div>
            <div><dt>Shows now</dt><dd>{selBlock.rows.length} item{selBlock.rows.length === 1 ? "" : "s"}</dd></div>
          </dl>
          <p className="be-help">Move it or remove it here. What it shows comes from {selBlock.from}, so it’s never out of date.</p>
          <a className="be-btn be-btn-sec be-btn-block" href={selBlock.href}>Edit in {selBlock.from.split(/ (→|and) /)[0]}</a>
        </Panel>
      )}
      <Panel title="Advanced" open={false}>
        <label className="be-field">
          <span>Anchor</span>
          <input value={anchors[selBlock.id] ?? ""} placeholder="e.g. hours" onChange={(e) => setAnchors((a) => ({ ...a, [selBlock.id]: e.target.value.replace(/[^\w-]/g, "-").toLowerCase() }))} />
        </label>
        <p className="be-help">A name for linking straight to this block{anchors[selBlock.id] ? <>: {page.path}#{anchors[selBlock.id]}</> : "."}</p>
      </Panel>
    </div>
  );

  /* ---------------- render: modals */

  const mediaModal = mediaFor && (
    <div className="be-modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) setMediaFor(null); }}>
      <div className="be-modal be-mm" role="dialog" aria-modal="true" aria-label="Media library">
        <div className="be-modal-h">
          <h2>{mediaFor.mode === "gallery" ? "Add photos to the gallery" : "Pick a photo"}</h2>
          <button type="button" className="be-hb" aria-label="Close" onClick={() => setMediaFor(null)}><Ico n="close" /></button>
        </div>
        <div className="be-mm-tabs"><span className="is-on">Media Library</span><label className="be-mm-up">Upload files<input type="file" accept="image/*" className="vh" multiple onChange={(e) => {
          const fs = Array.from(e.target.files ?? []).map((f) => ({ src: URL.createObjectURL(f), alt: "" }));
          if (!fs.length || !mediaFor) return;
          if (mediaFor.mode === "gallery") set(mediaFor.id, { images: [...((doc.blocks.find((b) => b.id === mediaFor.id) as Extract<Block, { type: "gallery" }>)?.images ?? []), ...fs] });
          else if (mediaFor.mode === "image") set(mediaFor.id, { src: fs[0].src, alt: "" });
          else insert({ id: uid(), type: "image", src: fs[0].src, alt: "", caption: "", align: "wide" });
          setMediaFor(null);
        }} /></label></div>
        <div className="be-mm-body">
          <ul className="be-mm-grid">
            {media.map((m) => {
              const on = picked.includes(m.src);
              return (
                <li key={m.src}>
                  <button type="button" aria-pressed={on} className={on ? "is-on" : ""} onClick={() => setPicked((p) => (mediaFor.mode === "gallery" ? (on ? p.filter((x) => x !== m.src) : [...p, m.src]) : [m.src]))}>
                    <img src={m.src} alt={m.alt} />
                    {on && <span className="be-mm-check"><Ico n="check" size={16} /></span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <aside className="be-mm-side">
            {picked.length ? (() => {
              const m = media.find((x) => x.src === picked[picked.length - 1]);
              return m ? (
                <>
                  <h3>Photo details</h3>
                  <img src={m.src} alt="" />
                  <p><b>{m.src.split("/").pop()}</b></p>
                  <p className="be-help">{m.alt || "No description"}</p>
                  <p className="be-help">Consent on file for everyone in it.</p>
                </>
              ) : null;
            })() : <p className="be-help">Pick a photo to see its details.</p>}
          </aside>
        </div>
        <div className="be-modal-f">
          <span className="be-help">{picked.length ? `${picked.length} selected` : ""}</span>
          <button type="button" className="be-btn be-btn-pri" disabled={!picked.length} onClick={() => {
            const ims = picked.map((src) => ({ src, alt: media.find((m) => m.src === src)?.alt ?? "" }));
            if (mediaFor.mode === "gallery") mut(mediaFor.id, (y) => (y.type === "gallery" ? { ...y, images: [...y.images, ...ims] } : y));
            else if (mediaFor.mode === "image") set(mediaFor.id, { src: ims[0].src, alt: ims[0].alt });
            else insert({ id: uid(), type: "image", ...ims[0], caption: "", align: "wide" });
            setMediaFor(null);
          }}>{mediaFor.mode === "gallery" ? "Add to gallery" : "Select"}</button>
        </div>
      </div>
    </div>
  );

  const commands: { label: string; icon: IconName; run: () => void }[] = [
    { label: "Save", icon: "check", run: save },
    { label: left === "inserter" ? "Hide the block inserter" : "Show the block inserter", icon: "plus", run: () => setLeft((x) => (x === "inserter" ? null : "inserter")) },
    { label: left === "list" ? "Hide list view" : "Show list view", icon: "listview", run: () => setLeft((x) => (x === "list" ? null : "list")) },
    { label: side ? "Hide settings" : "Show settings", icon: "sidebar", run: () => setSide((x) => !x) },
    { label: spot ? "Turn off spotlight mode" : "Turn on spotlight mode", icon: "paragraph", run: () => setSpot((x) => !x) },
    { label: code ? "Exit the code editor" : "Open the code editor", icon: "page", run: () => setCode((x) => !x) },
    { label: "Preview in a new tab", icon: "external", run: () => window.open(`${site}${page.path}`, "_blank", "noopener") },
    { label: "Keyboard shortcuts", icon: "keyboard", run: () => setModal("keys") },
    { label: "Back to Website", icon: "back", run: tryClose },
    ...items.map((it) => ({ label: `Add ${it.name.toLowerCase().startsWith("the ") ? it.name : `a ${it.name.toLowerCase()}`} block`, icon: it.icon, run: () => insert(it.make()) })),
  ];
  const cmdList = commands.filter((c) => !pq || c.label.toLowerCase().includes(pq.toLowerCase())).slice(0, 9);

  const modals = (
    <>
      {modal === "palette" && (
        <div className="be-modal-bg be-modal-top" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="be-modal be-palette" role="dialog" aria-modal="true" aria-label="Command palette">
            <label className="be-search be-search-lg">
              <Ico n="search" />
              <input autoFocus value={pq} placeholder="Search commands and blocks" aria-label="Search commands"
                onChange={(e) => { setPq(e.target.value); setPi(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setPi((i) => (i + 1) % Math.max(1, cmdList.length)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setPi((i) => (i - 1 + cmdList.length) % Math.max(1, cmdList.length)); }
                  if (e.key === "Enter" && cmdList[pi]) { e.preventDefault(); setModal(null); cmdList[pi].run(); }
                }} />
            </label>
            <ul role="listbox" aria-label="Commands">
              {cmdList.map((c, i) => (
                <li key={c.label} role="option" aria-selected={i === pi}>
                  <button type="button" className={i === pi ? "is-on" : ""} onMouseEnter={() => setPi(i)} onClick={() => { setModal(null); c.run(); }}><Ico n={c.icon} size={20} />{c.label}</button>
                </li>
              ))}
              {!cmdList.length && <li className="be-help">Nothing found.</li>}
            </ul>
          </div>
        </div>
      )}
      {modal === "keys" && (
        <div className="be-modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="be-modal be-keys" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div className="be-modal-h"><h2>Keyboard shortcuts</h2><button type="button" className="be-hb" aria-label="Close" onClick={() => setModal(null)}><Ico n="close" /></button></div>
            {[
              ["Global", [["Save your changes", "Ctrl+S"], ["Undo", "Ctrl+Z"], ["Redo", "Ctrl+Shift+Z"], ["Command palette", "Ctrl+K"], ["Show or hide list view", "Ctrl+Alt+O"], ["Show or hide settings", "Ctrl+Shift+,"]]],
              ["Blocks", [["Pick a block", "/"], ["Duplicate the block", "Ctrl+Shift+D"], ["Delete the block", "Shift+Alt+Z"], ["Add a block before", "Ctrl+Alt+T"], ["Add a block after", "Ctrl+Alt+Y"], ["Deselect", "Escape"]]],
              ["Text", [["Bold", "Ctrl+B"], ["Italic", "Ctrl+I"], ["Underline", "Ctrl+U"], ["New paragraph", "Enter"], ["New line in the same block", "Shift+Enter"]]],
            ].map(([h, rows]) => (
              <section key={h as string}>
                <h3>{h as string}</h3>
                <dl>{(rows as string[][]).map(([a, b]) => <div key={a}><dt>{a}</dt><dd><kbd>{key(b)}</kbd></dd></div>)}</dl>
              </section>
            ))}
          </div>
        </div>
      )}
      {modal === "leave" && (
        <div className="be-modal-bg">
          <div className="be-modal be-confirm" role="alertdialog" aria-modal="true" aria-label="Unsaved changes">
            <p>You have changes that aren’t saved. Leave without saving?</p>
            <div className="be-modal-f">
              <button type="button" className="be-btn be-btn-ter" onClick={() => setModal(null)}>Keep editing</button>
              <button type="button" className="be-btn be-btn-sec" onClick={() => { setModal(null); onClose(); }}>Leave without saving</button>
              <button type="button" className="be-btn be-btn-pri" onClick={() => { setModal(null); save(); window.setTimeout(onClose, 700); }}>Save and leave</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  /* ---------------- render */

  const codeHtml = useMemo(() => doc.blocks.map((b) => {
    const c = `<!-- block:${b.type}${b.type === "live" ? ` {"from":"${b.from}"}` : ""} -->`;
    const end = `<!-- /block:${b.type} -->`;
    const body = b.type === "paragraph" ? `<p>${b.html}</p>` : b.type === "heading" ? `<h${b.level}>${b.html}</h${b.level}>` : b.type === "list" ? `<${b.ordered ? "ol" : "ul"}>${b.items.map((x) => `<li>${x}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`
      : b.type === "quote" ? `<blockquote><p>${b.html}</p><cite>${b.cite}</cite></blockquote>` : b.type === "image" ? `<figure><img src="${b.src}" alt="${esc(b.alt)}"/>${b.caption ? `<figcaption>${b.caption}</figcaption>` : ""}</figure>`
        : b.type === "gallery" ? `<figure class="gallery">${b.images.map((x) => `<img src="${x.src}" alt="${esc(x.alt)}"/>`).join("")}</figure>` : b.type === "buttons" ? b.buttons.map((x) => `<a class="button" href="${x.href}">${x.text}</a>`).join("")
          : b.type === "columns" ? `<div class="columns">${b.cols.map((x) => `<div><h3>${x.heading}</h3><p>${x.html}</p></div>`).join("")}</div>` : b.type === "separator" ? "<hr/>" : b.type === "spacer" ? `<div style="height:${b.height}px"></div>` : "";
    return body ? `${c}\n${body}\n${end}` : c;
  }).join("\n\n"), [doc.blocks]);

  const last = doc.blocks[doc.blocks.length - 1];
  const showAppender = !last || !(last.type === "paragraph" && !last.html);

  const ui = (
    <div ref={root} className={`be${left ? " has-left" : ""}${side ? " has-side" : ""}${spot ? " is-spot" : ""}${topBar ? " is-topbar" : ""}`} onKeyDown={onRootKey}
      onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("[data-menu]")) { setMenu(null); if (quick && !(e.target as HTMLElement).closest(".be-quick, .be-inline-ins, .be-appender-plus, .be-between")) setQuick(null); } }}
      role="application" aria-label={`Editing ${doc.title}`}>
      <header className="be-head">
        <div className="be-head-l">
          <button type="button" className="be-site" onClick={tryClose} aria-label="Back to Website" title="Back to Website">
            <span className="be-site-ic">{siteShort}</span>
            <span className="be-site-back"><Ico n="back" /></span>
          </button>
          <button type="button" className={`be-hb be-ins-t${left === "inserter" ? " is-on" : ""}`} aria-label={left === "inserter" ? "Close block inserter" : "Block inserter"} aria-pressed={left === "inserter"} title="Block inserter" onClick={() => { setSearch(""); setLeft((x) => (x === "inserter" ? null : "inserter")); }}>
            <Ico n="plus" />
          </button>
          <button type="button" className="be-hb" aria-label="Undo" title={`Undo (${key("Ctrl+Z")})`} aria-disabled={!hist.past.length} onClick={undo}><Ico n="undo" /></button>
          <button type="button" className="be-hb" aria-label="Redo" title={`Redo (${key("Ctrl+Shift+Z")})`} aria-disabled={!hist.future.length} onClick={redo}><Ico n="redo" /></button>
          <button type="button" className={`be-hb be-hide-s${left === "list" ? " is-on" : ""}`} aria-label="Document overview" aria-pressed={left === "list"} title={`Document overview (${key("Ctrl+Alt+O")})`} onClick={() => setLeft((x) => (x === "list" ? null : "list"))}><Ico n="listview" /></button>
        </div>
        <div className="be-head-c">
          <button type="button" className="be-docbar" onClick={() => { setPq(""); setPi(0); setModal("palette"); }} aria-label={`${doc.title}. Open the command palette`}>
            <Ico n="page" size={20} />
            <span className="be-docbar-t"><b>{doc.title || "No title"}</b><span> · Page</span></span>
            <kbd>{key("Ctrl+K")}</kbd>
          </button>
        </div>
        <div className="be-head-r">
          <div className="be-rel" data-menu="">
            <button type="button" className="be-hb be-hide-s" aria-label="View" aria-haspopup="menu" title="View" onClick={() => setMenu((m) => (m === "device" ? null : "device"))}><Ico n={device} /></button>
            {menu === "device" && (
              <div className="be-pop be-pop-end" role="menu">
                {(["desktop", "tablet", "mobile"] as const).map((d) => (
                  <MenuItem key={d} checked={device === d ? true : undefined} onClick={() => { setDevice(d); setMenu(null); }}>{d[0].toUpperCase() + d.slice(1)}</MenuItem>
                ))}
                <hr />
                <MenuItem icon="external" onClick={() => { setMenu(null); window.open(`${site}${page.path}`, "_blank", "noopener"); }}>Preview in a new tab</MenuItem>
              </div>
            )}
          </div>
          <a className="be-hb be-hide-s" href={`${site}${page.path}`} target="_blank" rel="noopener" aria-label="View page" title="View page"><Ico n="external" /></a>
          <button type="button" className={`be-save${saving ? " is-busy" : ""}`} aria-disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
          <button type="button" className={`be-hb${side ? " is-on" : ""}`} aria-label="Settings" aria-pressed={side} title={`Settings (${key("Ctrl+Shift+,")})`} onClick={() => setSide((x) => !x)}><Ico n="sidebar" /></button>
          <div className="be-rel" data-menu="">
            <button type="button" className="be-hb" aria-label="Options" aria-haspopup="menu" title="Options" onClick={() => setMenu((m) => (m === "options" ? null : "options"))}><Ico n="more" /></button>
            {menu === "options" && (
              <div className="be-pop be-pop-end be-pop-wide" role="menu">
                <p className="be-pop-h">View</p>
                <MenuItem checked={topBar} onClick={() => setTopBar((x) => !x)}>Top toolbar</MenuItem>
                <MenuItem checked={spot} onClick={() => setSpot((x) => !x)}>Spotlight mode</MenuItem>
                <MenuItem checked disabled>Full-screen mode</MenuItem>
                <hr />
                <p className="be-pop-h">Editor</p>
                <MenuItem checked={!code} onClick={() => { setCode(false); setMenu(null); }}>Visual editor</MenuItem>
                <MenuItem checked={code} onClick={() => { setCode(true); setMenu(null); select(null); }}>Code editor</MenuItem>
                <hr />
                <p className="be-pop-h">Tools</p>
                <MenuItem icon="keyboard" onClick={() => { setMenu(null); setModal("keys"); }}>Keyboard shortcuts</MenuItem>
                <MenuItem icon="copy" onClick={() => { void navigator.clipboard?.writeText(codeHtml); setMenu(null); flash("All blocks copied."); }}>Copy all blocks</MenuItem>
              </div>
            )}
          </div>
        </div>
      </header>

      {topBar && selBlock && !code && <div className="be-dock">{toolbar(selBlock)}</div>}

      <div className="be-body">
        {left === "inserter" && inserterPanel}
        {left === "list" && listPanel}

        <main className={`be-stage dev-${device}`} onMouseDown={(e) => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("be-canvas")) select(null); }}>
          {code ? (
            <div className="be-code">
              <div className="be-code-h"><span>Editing code</span><button type="button" className="be-a" onClick={() => setCode(false)}>Exit code editor</button></div>
              <h1 className="be-code-title">{doc.title}</h1>
              <textarea readOnly value={codeHtml} aria-label="The page as code" />
              <p className="be-help">The code is read-only here; edit the blocks in the visual editor.</p>
            </div>
          ) : (
            <div className="be-frame">
              <div className="be-canvas">
                <RichText rid="__title" tag="h1" className="be-title" inline html={esc(doc.title)} placeholder="Add title" label="Add title"
                  onChange={(_, el) => change((d) => ({ ...d, title: el.textContent ?? "" }), "__title")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const f = doc.blocks[0];
                      if (f && TEXTUAL.has(f.type)) { select(f.id); focusBlock(f.id, "start"); }
                      else insert(blank("paragraph"), { before: f?.id });
                    }
                  }} />
                {doc.blocks.map((b) => {
                  const on = sel === b.id;
                  return (
                    <div key={b.id} data-block={b.id} id={anchors[b.id] || undefined}
                      className={`be-block be-${b.type}${on ? " is-sel" : ""}${spot && sel && !on ? " is-dim" : ""}${b.type === "image" && b.src ? ` al-${b.align ?? "none"}` : ""}`}
                      tabIndex={TEXTUAL.has(b.type) ? undefined : 0}
                      aria-label={TEXTUAL.has(b.type) ? undefined : `Block: ${blockLabel(b)}`}
                      onMouseDownCapture={() => { if (sel !== b.id) select(b.id); }}
                      onFocusCapture={() => { if (sel !== b.id) select(b.id); }}
                      onKeyDown={TEXTUAL.has(b.type) ? undefined : objectKeys(b)}>
                      <div className="be-between">
                        <button type="button" aria-label="Add a block here" tabIndex={-1} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setQq(""); setQuick({ before: b.id }); }}><Ico n="plus" size={16} /></button>
                      </div>
                      {on && !topBar && toolbar(b)}
                      {content(b)}
                      {quick && (quick.before === b.id || quick.replace === b.id) && quickInserter}
                      {slash?.id === b.id && (
                        <div className="be-slash" role="listbox" aria-label="Blocks">
                          {slashItems.length ? slashItems.map((it, k) => (
                            <button key={it.key} type="button" role="option" aria-selected={k === slash.i} className={k === slash.i ? "is-on" : ""} onMouseDown={(e) => { e.preventDefault(); pickSlash(it); }}>
                              <Ico n={it.icon} size={20} /><span>{it.name}</span>
                            </button>
                          )) : <p className="be-help">No blocks found.</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {showAppender && (
                  <div className="be-appender">
                    <button type="button" className="be-appender-p" onClick={() => insert(blank("paragraph"), { after: last?.id ?? null })}>Type / to choose a block</button>
                    <button type="button" className="be-appender-plus" aria-label="Add block" onClick={() => { setQq(""); setQuick({ after: "__end" }); }}><Ico n="plus" size={20} /></button>
                    {quick?.after === "__end" && quickInserter}
                  </div>
                )}
              </div>
            </div>
          )}
          {snack && (
            <div className="be-snack" role="status">
              <span>{snack}</span>
              {snack.startsWith("Page updated") && <a href={`${site}${page.path}`} target="_blank" rel="noopener">View Page</a>}
            </div>
          )}
        </main>

        {side && (
          <aside className="be-side" aria-label="Editor settings">
            <div className="be-side-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "page"} className={tab === "page" ? "is-on" : ""} onClick={() => setTab("page")}>Page</button>
              <button type="button" role="tab" aria-selected={tab === "block"} className={tab === "block" ? "is-on" : ""} onClick={() => setTab("block")}>Block</button>
              <button type="button" className="be-hb be-side-x" aria-label="Close settings" onClick={() => setSide(false)}><Ico n="close" /></button>
            </div>
            {tab === "page" ? pagePanel : blockPanel}
          </aside>
        )}
      </div>

      <footer className="be-foot" aria-label="Block breadcrumb">
        <button type="button" onClick={() => select(null)}>Page</button>
        {selBlock && <><Ico n="chevRight" size={16} /><span>{NAMES[selBlock.type]}</span></>}
        {selBlock && selIndex >= 0 && <span className="be-foot-n">Block {selIndex + 1} of {doc.blocks.length}</span>}
      </footer>

      {mediaModal}
      {modals}
    </div>
  );

  return createPortal(ui, document.body);
}

/** A read-only block, for pattern previews. */
function staticBlock(b: Block): ReactNode {
  switch (b.type) {
    case "paragraph": return <p className={`fs-${b.size ?? "medium"} al-${b.align ?? "left"}`} dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "heading": return createElement(`h${b.level}`, { className: `al-${b.align ?? "left"}`, dangerouslySetInnerHTML: { __html: b.html } });
    case "list": return <ul>{b.items.map((x, i) => <li key={i} dangerouslySetInnerHTML={{ __html: x }} />)}</ul>;
    case "quote": return <blockquote className="be-quote"><p dangerouslySetInnerHTML={{ __html: b.html }} /><cite>{b.cite}</cite></blockquote>;
    case "image": return b.src ? <figure className="be-img"><img src={b.src} alt="" /></figure> : null;
    case "gallery": return <div className={`be-gal cols-${b.columns}`}>{b.images.map((im, i) => <figure key={i}><img src={im.src} alt="" /></figure>)}</div>;
    case "buttons": return <div className={`be-btns al-${b.align ?? "left"}`}>{b.buttons.map((x, i) => <span key={i} className={`be-cta ${x.style}`}>{x.text}</span>)}</div>;
    case "columns": return <div className="be-cols" style={{ gridTemplateColumns: `repeat(${b.cols.length}, 1fr)` }}>{b.cols.map((c, i) => <div key={i} className="be-col"><h3>{c.heading}</h3><p>{c.html}</p></div>)}</div>;
    case "separator": return <hr className="be-sep" />;
    case "spacer": return <div style={{ height: b.height / 2 }} />;
    case "live": return <div className="be-live"><div className="be-live-h"><b>{b.title}</b></div></div>;
  }
}
