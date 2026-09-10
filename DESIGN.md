---
name: Larkmoor House
description: Category-standard senior living community site where the current calendar, menu, staff, rates and inspection record are the whole pitch.
colors:
  bg: "#faf7f1"
  paper: "#ffffff"
  ink: "#1e2a26"
  ink-2: "#4a5753"
  ink-3: "#66726e"
  forest: "#1f4d3b"
  forest-deep: "#153627"
  forest-tint: "#e6efea"
  forest-tint-2: "#f1f6f3"
  on-forest-soft: "#dcebe3"
  on-forest-muted: "#cfe3d9"
  apricot: "#e8834a"
  apricot-hover: "#f0955f"
  apricot-deep: "#b0531c"
  apricot-light: "#f6b283"
  apricot-tint: "#fdeee2"
  red: "#a3271e"
  red-deep: "#7f1d16"
  red-tint: "#fbeae7"
  rule: "#e2dcd1"
  rule-2: "#ede8df"
  violet: "#4338a6"
  violet-ink: "#211c5c"
  violet-tint: "#eeedfb"
  violet-line: "#9a92dd"
  status-green: "#1e9a55"
  ok-text: "#146c3a"
  wait-amber: "#e0912b"
  lane-fast-bg: "#dff5e3"
  lane-fast-text: "#0f5a27"
  lane-approval-bg: "#ffe9c2"
  lane-approval-text: "#6e4300"
  lane-urgent-bg: "#ffd9d4"
  lane-urgent-text: "#7c1f18"
  cat-move: "#2f8f6b"
  cat-social: "#e0912b"
  cat-mind: "#4c6fd1"
  cat-faith: "#8b5cb8"
  cat-out: "#c5433a"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(34px, 4vw, 46px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "clamp(26px, 2.6vw, 32px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  bar-title:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  subtitle:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, Segoe UI, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
  small:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, Segoe UI, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, Segoe UI, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.03em"
  numeral:
    fontFamily: "Bricolage Grotesque, Segoe UI, Arial, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.1
rounded:
  tag: "5px"
  s: "6px"
  input: "8px"
  m: "10px"
  photo: "14px"
  pill: "999px"
spacing:
  2xs: "6px"
  xs: "8px"
  sm: "12px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  2xl: "32px"
  stack: "34px"
  page: "56px"
components:
  button-primary:
    backgroundColor: "{colors.apricot}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.apricot-hover}"
    textColor: "{colors.ink}"
  button-forest:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  button-forest-hover:
    backgroundColor: "{colors.forest-deep}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.forest}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.forest-tint}"
    textColor: "{colors.forest-deep}"
  button-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.red-deep}"
    rounded: "{rounded.pill}"
    padding: "10px 22px"
    height: "48px"
  button-paper-hover:
    backgroundColor: "{colors.red-tint}"
    textColor: "{colors.red-deep}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0 14px"
    height: "50px"
  nav-link-hover:
    backgroundColor: "transparent"
    textColor: "{colors.forest-deep}"
  section-bar:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    typography: "{typography.bar-title}"
    rounded: "{rounded.m}"
    padding: "12px 20px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "22px 24px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "20px 22px"
  stamp:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    typography: "{typography.small}"
    rounded: "{rounded.pill}"
    padding: "5px 13px"
  audience-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "46px"
  audience-tab-selected:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "46px"
  lane-chip-fast:
    backgroundColor: "{colors.lane-fast-bg}"
    textColor: "{colors.lane-fast-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  lane-chip-approval:
    backgroundColor: "{colors.lane-approval-bg}"
    textColor: "{colors.lane-approval-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  lane-chip-urgent:
    backgroundColor: "{colors.lane-urgent-bg}"
    textColor: "{colors.lane-urgent-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  module-label:
    backgroundColor: "{colors.violet-tint}"
    textColor: "{colors.violet-ink}"
    typography: "{typography.small}"
    rounded: "{rounded.s}"
    padding: "12px 16px"
  demo-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.violet}"
    typography: "{typography.small}"
    rounded: "{rounded.pill}"
    padding: "6px 12px 6px 8px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: "11px 14px"
    height: "48px"
  kpi-tile:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.forest-deep}"
    typography: "{typography.numeral}"
    rounded: "{rounded.m}"
    padding: "16px 18px"
  rate-tile:
    backgroundColor: "{colors.forest-tint-2}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.s}"
    padding: "14px 16px"
  note-box:
    backgroundColor: "{colors.apricot-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.s}"
    padding: "14px 18px"
  urgent-card:
    backgroundColor: "{colors.red-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "20px 22px"
  kind-tag-notice:
    backgroundColor: "{colors.apricot-tint}"
    textColor: "{colors.apricot-deep}"
    rounded: "{rounded.tag}"
    padding: "2px 7px"
  kind-tag-news:
    backgroundColor: "{colors.forest-tint}"
    textColor: "{colors.forest-deep}"
    rounded: "{rounded.tag}"
    padding: "2px 7px"
---

# Design System: Larkmoor House

## Overview

**Creative North Star: "The Front Desk Binder"**

Every well-run community keeps a binder at the front desk: a green tab for each section, a white page under each tab, this week's calendar and today's menu on top. This system is that binder rendered as a national-operator website. The ground is a warm off-white; each module opens with a forest green header bar carrying the section title on the left and a single "see all" link on the right, joined to a white panel beneath. A small apricot square sits before every bar title, and the same apricot is the one action colour on the site: "Book a visit", and the marker on today's calendar day. Brick red exists for the site-wide alert band, urgent notices and inspection citations only. Nothing about the surface is meant to surprise; the argument is carried by what the panels hold: dated, timed, roomed, priced and cited information set at sizes a 78-year-old can read on a phone.

Density is moderate and even. Content sits in bordered paper panels on a single 1180px column, sections stack at a 34px gap, and 17px is the smallest running text anywhere. The page is flat: depth is drawn with 1px warm rules and the forest-on-off-white contrast, never with shadows on content. Headings are Bricolage Grotesque, a warm grotesque with enough personality to name a place; everything that has to be read is Atkinson Hyperlegible Next. Motion is short (180 to 250ms) on one spring-like ease and switches off under reduced motion.

One further world lives inside this one: the violet "module structure" overlay. It is driven by a fixed demo pill that sits outside the site chrome. When it is on, every section grows a dashed violet label naming the module, its editor, its content type and its publishing lane, and each section bar is ringed in violet. With the pill off, no violet appears anywhere on the site.

**Key Characteristics:**
- Warm off-white ground, forest green fields and section bars, apricot for the single action, brick red only for alerts and citations
- Bricolage Grotesque headings over Atkinson Hyperlegible Next text; 18px body, 17px floor
- Every home module is a forest bar joined to a paper panel: title left, one link right, apricot square before the title
- Flat surfaces with 1px warm rules; the shadow token belongs to the floating demo pill, not to content
- Pill buttons at 48px minimum, 10px panel corners, 6px small corners
- Violet is the annotation layer for structure mode only, switched from a fixed demo pill

## Colors

A conservative civic palette on warm paper: forest green for authority and structure, apricot for invitation, brick red for urgency, warm grey-green inks, and a violet annotation layer that never touches the family-facing site.

### Primary
- **Forest** (`forest`): the identity field on the home page, every section header bar, every subpage header, the selected audience tab, forest buttons, links, focus outlines, the brand mark, list-check icons and the document-row hover border. It is the colour of the institution.
- **Deep Forest** (`forest-deep`): hover state of forest buttons, links and nav links; the footer field; staff role lines; KPI, rate and handbook-term text. Always darker than `forest`, never lighter.
- **Forest Tint / Forest Tint 2** (`forest-tint`, `forest-tint-2`): hover washes for outline buttons and audience tabs, monogram circles, the meal-heading underline, the form success box and the input focus ring (Tint); table headers, calendar day headers, rate tiles, compact quality tiles and document-row hover (Tint 2). Tint 2 is the quiet fill, Tint is the interactive wash.
- **On-Forest Soft / On-Forest Muted** (`on-forest-soft`, `on-forest-muted`): secondary text on forest fields: the tagline, page intros and fact values (Soft); fact keys and bar sub-lines (Muted). Primary text on forest is pure white.

### Secondary
- **Apricot** (`apricot`, hover `apricot-hover`): the primary call to action ("Book a visit" in the header, identity block and visit form), the 10px square before every bar title, the nav hover underline, the brand mark roof, and the 2px border plus "Today" pill on the current calendar and menu day. Apricot always carries `ink` text, never white.
- **Apricot Light / Apricot Deep / Apricot Tint** (`apricot-light`, `apricot-deep`, `apricot-tint`): text selection and the bar-link hover colour (Light); "Notice" tag text (Deep); "Notice" tag fill, note boxes and the today header wash (Tint).

### Tertiary
- **Brick Red** (`red`, `red-deep`, `red-tint`): the site-wide alert band above the header, the urgent-notice card, citation text in the survey history, calendar cancellation notes. Deep is the text on paper buttons and urgent headings; Tint is the urgent card wash and paper-button hover. Red means something a family must act on; it is never decorative.
- **Annotation Violet** (`violet`, `violet-ink`, `violet-tint`, `violet-line`): the demo pill, the structure banner, module labels, the bar ring and the focus outline while structure mode is on. Nothing else.

### Neutral
- **Warm Paper** (`bg`): the page ground and the audience-tab tray.
- **Paper** (`paper`): the header, the audience strip, every panel, card, tile, form field, stamp and chip.
- **Ink** (`ink`): body text, headings on paper, button text on apricot, the toast.
- **Ink 2** (`ink-2`): secondary text, table headers, captions, stamps, nav links at rest, keys of key/value pairs. Passes AA on both papers.
- **Ink 3** (`ink-3`): the "charged separately" icon only; the quietest ink.
- **Rule / Rule 2** (`rule`, `rule-2`): 1px panel, card, table, header and input borders (Rule); interior row dividers, the nav row's top edge and compact-list dividers (Rule 2). Both are warm, never grey.

### Status and category
- **Status Green / OK Text / Wait Amber** (`status-green`, `ok-text`, `wait-amber`): the "updated" dot on stamps and the availability dot ("available" green, "wait list" amber); green result text ("No deficiencies") in the quality record. Always paired with words.
- **Lane chips** (`lane-fast-*`, `lane-approval-*`, `lane-urgent-*`): green, amber and red pills naming the publishing lane; shown in the structure banner, module labels and the about page.
- **Calendar categories** (`cat-move`, `cat-social`, `cat-mind`, `cat-faith`, `cat-out`): 12px squares in the legend and event list, 5px vertical bars beside calendar events. Each has a visually hidden text label; the colour is a reading aid, not the meaning.

### Named Rules
**The One Apricot Rule.** Apricot fills the primary action and marks "today"; the only other places it appears are the 10px square before a bar title and the nav hover underline. Every other button is forest, outline or paper.

**The Red Means Act Rule.** Brick red appears only on the alert band, urgent notices, citations and cancellations, things a family must react to. It is never used for emphasis, headings or decoration.

**The Violet Overlay Rule.** Violet belongs to the demo pill and the structure-mode annotation layer. With structure off, no violet is visible anywhere on the site.

**The Words Beside Colour Rule.** Every colour that carries state (green dot, category square, citation red, lane chip) sits beside text that says the same thing. Nothing is conveyed by colour alone.

## Typography

**Display Font:** Bricolage Grotesque (with Segoe UI, Arial, sans-serif), loaded through next/font as `--font-display`
**Body Font:** Atkinson Hyperlegible Next (with system-ui, Segoe UI, Arial, sans-serif), loaded through next/font as `--font-body`

**Character:** A warm, slightly quirky grotesque for anything that names the place (the community, a section, a day, a meal, a KPI) over a sans designed for low-vision readers. Bricolage gives the institution a face without a serif's formality; Atkinson does the reading work. Headings are tight (-0.015em) and balanced; running text is loose (1.55) and capped at 70ch.

### Hierarchy
- **Display** (800, clamp(34px, 4vw, 46px), 1.15, -0.015em): the `h1` on the identity field and every subpage header. White on forest.
- **Headline** (700, clamp(26px, 2.6vw, 32px), 1.15): `h2` on paper, where a page needs a heading outside a bar.
- **Bar Title** (700, 23px, -0.01em): the `h2` or `h3` inside a section bar; white, preceded by the apricot square. The brand name in the header is the same face at 26px / 800 / -0.02em.
- **Title** (700, 22px, 1.15): `h3` inside a panel ("Recent photos", the urgent-notice heading). Day names in the calendar and meal names use the same face at 20 to 21px / 800.
- **Subtitle** (700, 19px, 1.15): `h4`; staff names, news headlines and handbook terms (20px) sit at this level.
- **Body** (400, 18px, 1.55): paragraphs, capped at min(70ch, 100%). Page intros run at 19px on forest; the identity tagline at 20px.
- **Small** (400, 17px, 1.4): everything else: table cells, event rows, captions, stamps, footers, hints, module labels. Fine print is Small in `ink-2`, never a smaller size.
- **Label** (700, 17px, 0.03em, uppercase): the key half of a key/value pair: fact keys on forest, quality-summary keys. Labels name a datum; they never sit above a heading.
- **Numeral** (Bricolage 800, 30px, 1.1): KPI values in `forest-deep`; rate-summary values use 26px, quality-summary values 22px. Tables and `<time>` use tabular figures.

### Named Rules
**The 17px Floor Rule.** No running text, cell, caption, hint or key on the site is smaller than 17px; body copy is 18px. Fine print is expressed by colour (`ink-2`), never by size.

**The Grotesque Names, Hyperlegible Reads Rule.** Bricolage Grotesque is for names, headings, day and meal names and numerals. Any run of text longer than a line, and the alert band's own heading (20px, tracking reset to 0), is Atkinson.

**The Square Before The Title Rule.** Every section bar title carries a 10px apricot square (2px corners, 12px gap) before it. It is the bar's mark; it is never added to headings outside a bar.

## Layout

A single centred column: `.wrap` is min(1180px, 100% - 40px), so a 20px side gutter holds at every width. There is no wider variant; the calendar shares the column.

The chrome stacks in fixed order: the red alert band, then a two-row paper header (brand and actions on the first row at 84px minimum, seven section links on a 50px row below, divided by a 1px `rule-2`), then the violet structure banner when structure is on. The home page opens with the forest identity field (a 1.15fr / 0.85fr grid of facts and photo, 40px block padding), then the paper audience strip, then the modules. Subpages open with a forest page header (30px / 32px block padding, `h1` left, stamp right, baseline-aligned) and a `page-body` grid with 30px gaps and 32px / 56px block padding.

Modules on the home page live in `.home-sections`, a grid at a 34px gap with 36px / 56px block padding. Each module is a section bar joined to a panel: the bar rounds its top corners (10px), the panel rounds its bottom corners and drops its top border so the two read as one object. Inside panels, `split` (1.1fr / 0.9fr, 24px 36px gap), `split-2` (20px 36px) and `split-3` (20px 28px) collapse to one column at 900px. Staff and document lists are two-column grids at 12px / 10px gaps; KPI tiles are auto-fit at 210px minimum; the calendar is seven columns at 10px, four at 1180px, and a one-column accordion with only today open at 820px.

Spacing rhythm is a 6 / 8 / 12 / 14 / 18 / 24 ladder inside components, 28 to 32px between groups, 34px between modules, 56px to the foot of a page. Panel interior padding is 22px 24px; cards 20px 22px; tiles 16px 18px; table cells 12px 14px (10px 8px on phones); on phones cards tighten to 14px 12px.

Breakpoints, wide to narrow: 1180px (calendar 7 to 4 columns), 1000px (photos 4 to 2), 900px (identity, splits and the quality grid stack), 860px (meals, staff and handbook stack), 820px (calendar becomes an accordion; summaries become tappable at 52px), 800px (footer stacks), 760px (nav row and header button hide, rate tiles and documents stack, alert becomes two columns, cards tighten), 700px (audience tabs stack into a 14px-radius column), 640px (news stacks), 600px (module labels go single-column, demo pill spans the width), 560px (facts 2-up), 520px (photos single column), 480px (event rows stack).

### Named Rules
**The Bar Then Panel Rule.** Every home module is a forest bar with the title left and exactly one "see all" link right, joined to a paper panel. The bar is the section separator; there are no rules between modules.

**The One Column Rule.** All content shares the 1180px column. Full-bleed colour (alert, header, identity, page header, banner, footer) is applied to the band, never to the wrap.

## Elevation & Depth

Flat. Depth is drawn with 1px warm `rule` borders, the forest-on-paper contrast of bars and fields, and `forest-tint-2` fills for headers and tiles. Content never carries a shadow: panels, cards, tiles, calendar days and the toast are bordered or solid. The shadow token (`--shadow`) is reserved for the one thing that floats above the page, the fixed demo pill. The identity photo carries its own deep, tight shadow to seat it in the forest field; the demo switch knob carries a 1px knob shadow; form fields show focus as a 3px `forest-tint` halo. Structure mode rings each section bar with an inset 2px `violet-line` rather than recolouring it.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 2px 6px rgba(30,42,38,.06), 0 12px 28px -12px rgba(30,42,38,.18)`): the fixed demo pill only. Ink-tinted, soft, never a hard offset.
- **Photo seat** (`box-shadow: 0 16px 40px -16px rgba(0,0,0,.5)`): the identity photo on the forest field.
- **Knob** (`box-shadow: 0 1px 3px rgba(0,0,0,.35)`): the demo-switch thumb.
- **Focus halo** (`box-shadow: 0 0 0 3px var(--forest-tint)`): form fields on focus, with the border turning `forest`.

### Named Rules
**The Border Not Shadow Rule.** A panel, card or tile gets a 1px `rule` border and no shadow, on either paper. The float shadow belongs to elements fixed over the page, never to content in the flow.

**The Ring Not Fill Rule.** Structure mode annotates by ringing (inset 2px `violet-line` on bars) and labelling (dashed labels), never by recolouring the site's own surfaces.

## Shapes

Softly rounded, never sharp. Panels, cards, tiles, calendar and menu days, photo cards, the urgent card and section bars use 10px (`m`). Secondary containers (note boxes, rate tiles, module labels, document rows, the form success box) use 6px (`s`). Inputs and the skip link use 8px; the identity photo and the stacked audience-tab tray use 14px. Small tags ("Notice", "News", dietary abbreviations) use 5px; category squares 3px; the bar's apricot square 2px; the focus outline corners at 4px. Every button, stamp, lane chip, channel chip, audience tab and tray, the demo pill, the "Today" tag and the toast are full pills (999px). Monograms, status dots and the switch knob are circles. Borders are 1px `rule` for containers, 1.5px for dietary abbreviations, 2px for states that must be seen at a glance (the today card, the urgent card, form fields, button borders, the demo pill, the dashed module label) and 3px for the nav hover underline.

## Components

### Buttons
Confident, pill-shaped, thumb-sized. Bold inherited text (18px), an optional 1.15em inline SVG icon at 10px gap, a 2px border matching the fill, no wrapping.
- **Shape:** full pill (999px), 48px minimum height, 10px 22px padding.
- **Primary (apricot):** `apricot` fill, `ink` text; hover `apricot-hover`. Header "Book a visit", identity "Book a visit", the visit-form submit.
- **Forest:** `forest` fill, white text; hover `forest-deep`. The audience CTA and the alerts sign-up submit.
- **Outline:** transparent, `forest` text and border; hover `forest-tint` fill, `forest-deep` text.
- **Paper:** white fill, `red-deep` text; hover `red-tint`. Only on the red alert band ("Call the nurse on duty").
- **Press / Focus:** 1px translateY on `:active`; 180ms transform on `--ease`, 180ms colour; 3px `forest` outline at 3px offset with 4px corners on `:focus-visible` (violet in structure mode).

### Chips
- **Stamp:** paper pill, 1px `rule`, 17px `ink-2`, 5px 13px, leading 10px `status-green` dot. Says when the data was updated. `stamp-on-dark` on forest fields: 10% white fill, 30% white border, white text.
- **Lane chip:** 17px bold pill, 3px 10px, line-height 1.3; green (fast), amber (approval), red (urgent).
- **Channel chip:** paper pill with 1px `rule`, icon plus text, 4px 12px; lists delivery channels under an urgent notice.
- **Kind tag:** uppercase 800, 5px radius, 2px 7px, 0.05em; `kind-notice` in apricot tint / deep, `kind-news` in forest tint / deep. Inline before a news headline.
- **Availability:** 9px dot before text; green for available, `wait-amber` for wait list.
- **Dietary abbreviation:** 1.5px `rule` border, 5px radius, 800 weight, `ink-2`, 0.03em; wraps `<abbr>` with a full title.

### Section Bar and Panel
The signature structure. The bar is a flex row on `forest`, 12px 20px, wrapping, top corners 10px: title left (`h2` or `h3` at 23px white with the apricot square, optional `on-forest-muted` 17px sub-line at 14px gap), one `bar-link` right (white, bold, 44px tall, apricot-light underline, hover `apricot-light`, trailing arrow icon). The panel beneath is `paper`, 1px `rule` on three sides, bottom corners 10px, 22px 24px padding. A `panel-foot` row (17px `ink-2`, 14px above, wrapping) carries the stamp and one sentence.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** `paper` on the warm ground; `forest-tint-2` for rate tiles and compact quality tiles (no border).
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px `rule`. Urgent card: 2px `red` on `red-tint`. Note box: 1px `#f3cfae` on `apricot-tint`, 6px radius. Today card: 2px `apricot`.
- **Internal Padding:** 20px 22px; 16px 18px for staff cards and tiles; 12px 16px for document rows (56px minimum height); 14px 12px on phones.
- **Scrolling tables** live in `card.scroll` with horizontal overflow (560px minimum table width, 760px for the survey history) so the page never side-scrolls.

### Tables
Full-width, collapsed borders, tabular numerals. Left-aligned caption in bold `ink-2` with 10px below. Header cells bold 17px `ink-2` on `forest-tint-2`. Cells 12px 14px with 1px `rule` row dividers, none on the last row. Numeric columns right-aligned and no-wrap. A flagged row (the citation year) gets a `#fff7ec` wash and `red` 800 result text; clean results are `ok-text` 800.

### Inputs / Fields
- **Style:** paper, 2px `rule` border, 8px radius, 11px 14px padding, 48px minimum height, inherited 18px text. Labels are bold, stacked at a 6px gap; a `hint` span inside the label is 17px `ink-2` regular.
- **Focus:** border `forest`, native outline off, 3px `forest-tint` halo.
- **Success:** the form is replaced by a `form-ok` box: `forest-tint`, 6px radius, 14px 18px, bold, `role="status"`.
- Forms are a 16px-gap grid capped at 560px.

### Navigation
- **Header:** static paper, 1px `rule` below. Row one: brand (46px forest mark with apricot roof, Bricolage 800 26px name, `forest` 600 17px sub-line), phone (800, 19px, 44px tall), apricot "Book a visit". Row two: section links.
- **Links:** 17px bold `ink-2`, 50px tall, 0 14px padding, 3px transparent bottom border; hover `forest-deep` text and `apricot` underline. No active-section state.
- **Mobile:** below 760px the nav row, sub-line and header button hide; the brand and phone remain at 68px; every page keeps its footer link list.
- **Skip link:** forest 8px-radius block, revealed on focus at the top-left.

### Audience Switcher
A three-tab tray on the paper strip: `bg` fill, 1px `rule`, full pill, 5px inner padding, 6px gap. Tabs are pills at 46px, bold 17px, icon plus label, `ink-2`; hover `forest-tint` / `forest-deep`; selected fills `forest` with white text. Arrow keys move between tabs. The panel beneath holds one 18px sentence (60ch) and one forest button. Below 700px the tray stacks into a 14px-radius column. In structure mode an `aud-note` line appears in bold violet.

### Demo Pill and Structure Overlay
The demo control sits fixed at the bottom right (16px), outside the site chrome: paper pill, 2px `violet-line` border, the float shadow, a `violet` uppercase "Demo" tag at 800, a `role="switch"` with a 44 x 26px track (grey `#c9c6d9` off, `violet` on, 20px white knob travelling 18px over 250ms) and a "What is this?" link. Below 600px it spans the width and drops the link. When on, `html[data-structure="on"]` shows the violet banner (white text, lane legend right), rings each bar, and reveals a `module-label` at the top of each section: a dashed 2px `violet-line` box on `violet-tint`, 6px radius, 12px 16px, `violet-ink` text, a two-column key/value grid with uppercase 800 `violet` keys naming module, editor, content type and lane. Labels rise 6px over 400ms; the animation is removed under reduced motion.

### Calendar
Seven `details.day` cards (10px radius, 1px `rule`) at a 10px gap. The summary row is `forest-tint-2` with a Bricolage 800 20px day name and a 17px `ink-2` date; today swaps in `apricot-tint`, a 2px apricot border and an uppercase apricot "Today" pill. Event rows are a 5px category bar beside 800 time, 700 name and `ink-2` room, all 17px, divided by `rule-2`. Cancellations are bold `red` notes. On the home page the same events render as a 96px time column beside name and pin-icon room.

### Toast
Fixed, bottom-centred `ink` pill with white bold text, 80px above the bottom edge (clear of the demo pill); fades and rises 20px over 250ms. Used for copy-link confirmation.

## Do's and Don'ts

### Do:
- **Do** keep every running text size at 17px or above and body copy at 18px / 1.55; express "fine print" with `ink-2`, not a smaller size.
- **Do** give every interactive element a 44px minimum hit area (48px for buttons and fields, 46px for tabs, 50px for nav links) and the 3px `forest` focus outline at 3px offset.
- **Do** pair every status colour with words: a green dot with "Updated today", a red row with "1 citation", a category square with a visually hidden label.
- **Do** open every home module with a forest bar (title left with the apricot square, one link right) joined to a paper panel, and close the panel with a stamp or one sentence in `ink-2`.
- **Do** use one apricot button per view for the primary action; make every other button forest, outline or paper.
- **Do** put semantic tables (`caption`, `th scope`) inside a horizontally scrolling card rather than letting the page side-scroll.
- **Do** use the inline SVG icon set (24px viewBox, 2px stroke, round caps) at 1.15em beside text; sized 26 to 28px only in the alert band and document rows.
- **Do** keep the demo pill and every violet element outside the site's own chrome, so the site reads as real with structure off.

### Don't:
- **Don't** use brick red for anything other than the alert band, urgent notices, citations and cancellations.
- **Don't** let violet appear outside the demo pill and structure mode; it is the annotation layer, not a brand colour.
- **Don't** set white text on apricot; apricot always carries `ink`.
- **Don't** put a shadow on a panel, card or tile; the float shadow is for the fixed demo pill only.
- **Don't** set running text in Bricolage Grotesque; the grotesque is for names, headings, day and meal names and numerals only.
- **Don't** use uppercase labels as kickers above headings; the Label style is reserved for the key half of a key/value pair.
- **Don't** add a second link or a button to a section bar; the bar carries the title and exactly one "see all" link.
- **Don't** add motion longer than 250ms outside the module-label reveal, and never without a `prefers-reduced-motion` fallback.


## Home page addendum (10 Sep 2026, after the pitch rebuild)

The home page no longer uses bar-then-panel sections; those remain the grammar of every detail page. The home page is a short pitch: a two-column hero (audience tabs, one headline, one apricot action, phone, two overlapping photos), a forest proof strip of four linked facts, a photo mosaic beside today's events and tonight's dinner, four testimonials with round portraits, two photo-led care cards, a people section on the pale tint, and a forest closing band. Every section exits either to a detail page or to /tour. Section headings on the home page are large grotesque headings with a one-line lead, not bars.


## Palette and type revision (10 Sep 2026, third round)

The forest/apricot/Bricolage world above was replaced at the user's request. Current tokens live in `src/app/globals.css`: linen ground `#efede5`, ivory paper `#f7f5ee`, sage paper `#e9ebe2`; dull green `#4f6353` (deep `#34453a`) for every field, bar, page header and the closing band; dull gold `#b4975a` (light `#d6c28c`, deep `#86703c`) as the single action colour, rendered as a soft vertical sheen on buttons; red only for citations. Type: EB Garamond (weight 400–500) for all headings and quotes, Source Sans 3 for body at 18px with a 17px floor. Home page sections use vertical gradients between linen, ivory and sage paper and fade in on scroll; the opening screen is a full-height rotating photo with a dark green gradient overlay.
