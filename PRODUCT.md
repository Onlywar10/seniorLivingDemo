# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js 16 (App Router, TypeScript, no Tailwind; global CSS with custom properties). The user asked for Next.js after reviewing a single-page HTML version, which is archived in `_previous/index.html`. Run with `npm run dev`; `npm run build && npm start` serves the static prerender.

## Users
Three audiences share one content set (confirmed in brief):
- An adult child shopping for care, usually after a crisis, who cannot tell three communities apart. Often on a phone, often in a hospital car park.
- A current family member who wants to know what their mother is doing this week.
- The remote sibling who has not visited and is often blocking the decision; the person you text a link to.
Secondary reader of this artifact: the founder of the CMS company the author works for. The page is a pitch artifact making a product argument, not a sales page for a community.

## Product Purpose
Demonstrate, structurally rather than in copy, that in senior living the information IS the sales asset. A real, dated, current calendar is un-fakeable; a community with thin programming physically cannot publish one. Stock photography is a promise; Tuesday's actual schedule is evidence. Success: the founder presses the "show module structure" toggle and sees the website turn into a product spec.

## Positioning
The product is a governed publishing platform adapted from school district websites (calendars, menus, staff directories, documents, alerts, published continuously to a community that already belongs). Six content modules, each with a different owner inside the building and a different approval lane. That ownership split is why this needs a governed platform rather than a website builder. Competitors (large operators) publish sample calendars as PDFs or nothing at all; the real information lives on resident-built sites on separate domains.

## Operating Context
Six modules in fixed page order, after an active alert and a compact identity block:
1. Daily Life — this week's activity calendar (real times, rooms), today's menu with service hours, recent event photos with dates and attendance. Owner: Life Enrichment Director + Dining Services. Fast lane: publishes immediately on approved templates.
2. Care Team — names, roles, credentials, years of service, who to call about what; staffing ratios, average tenure. Owner: HR, synced from staff record. Approval required.
3. Costs & Inclusions — monthly rates by apartment type and care level, level-of-care band, one-time fees, included vs. charged separately, effective date. Owner: Executive Director. Approval required.
4. Quality Record — most recent state survey result and date, licence number and status, accreditation, staffing ratios, multi-year survey history table (pulled from state licensing register). Owner: Executive Director. Approval required.
5. Family Handbook — visiting hours, pets, transport, guest meals, mail, complaints incl. state ombudsman number, downloadable documents. Owner: Operations. Approval required.
6. Alerts & News — routine news plus urgent layer (outbreaks, closures, visiting changes). Urgent bypasses approval; also goes by email, text, app, translated per recipient. Owner: Executive Director.
No hero image, no lead form on the home page. Daily Life first: proof before pitch.
Site shape (revised 10 Sep 2026, third round): six navigation pillars in this order: Activities, Dining, Apartments, Care team, Family handbook, Alerts; the inspection record page stays at /inspection-record, linked from the footer and the home page trust lines but not from the top nav (user request, 10 Sep 2026). Routes: (/inspection-record, /activities, /dining, /apartments, /team, /handbook, /alerts), plus /tour (the only form), /accessibility and /about-this-demo. The home page opens with a full-screen rotating photo of the building, "Welcome home.", Book a tour and Call buttons and a scroll cue, then flows through a short pitch (pillar tiles, this week, testimonials, care levels, people) with a tour or call action in every section. Detail pages keep the header-bar-and-panel structure. Demo-only controls (structure toggle, "what is this?") live in a small fixed "Demo" pill outside the site chrome so the site itself reads as real.

## Capabilities and Constraints
- Two interactions: (a) "show module structure" toggle that labels every section with module name, editor/owner, underlying content type, and lane (fast-lane vs approval-required); (b) three-way audience switcher near the top (looking for care / family lives here / sending this to someone) that changes only the contextual line and primary CTA, and with labels on states explicitly that the content underneath is identical.
- Content rules: fictional community, 555 phone number, everything specific and real-feeling. Named staff with credentials, real activity names at real times in named rooms, actual menu with dietary accommodations, dollar figures, plausible-format state licence number, dates consistent with a real week (week of Monday 7 September 2026; today is Thursday 10 September 2026). No lorem, no placeholders, no real company names.
- Survey history must include a real citation from a prior year with how fast it was corrected.
- Photos: honest placeholders with real captions and dates, not fake imagery.
- Closing panel explaining what the demo shows, so it stands alone.
- Accessibility is a product requirement and is stated on the page: min 17px body, contrast above WCAG AA, 44px touch targets, visible focus, semantic headings and tables.

## Brand Commitments
Community name and identity are invented (fictional). The site must read as a real front-facing senior living community website when labels are off. The platform/CMS company is not named. Visual direction fixed by the user on 10 Sep 2026: professional and calming; dull green and a dull golden sheen; warm linen grounds rather than bright white; a classic serif for headings; gentle gradients and fades between sections.

## Evidence on Hand
None supplied. All community content is synthetic demonstration data, authored at full fidelity. Market observations in the brief (largest US operator publishes a sample calendar as PDF; most publish nothing) are the author's; the page must not name real companies.

## Product Principles
- Proof before pitch: evidence content leads, brochure content does not exist.
- One content set, three framings: the audience switcher changes framing, never content.
- Ownership is the architecture: every section has a named owner and a lane.
- Credible imperfection beats a clean record.
- Accessibility is a product feature with a legal origin, not a style choice.

## Accessibility & Inclusion
WCAG AA or better. Readers may be 78 or on a phone under stress. 17px minimum body text, 44px minimum touch targets, visible focus states, semantic headings and tables, no reliance on colour alone.

## Group site (added 10 Sep 2026)
Larkmoor Senior Living, the fictional operator, is the site root (/) with a location finder (six communities: Larkmoor House in Millbrook Bend, Ashby Grove in Salem, Willow Bend in Eugene, Harbor View in Astoria, Maple Court in Vancouver WA, Fernhill in Bend), the six standards every home shares, three care levels, testimonials, FAQ and a phone-first closing band. The community site lives under /larkmoor-house (home, activities, dining, apartments, team, handbook, news, inspection-record, tour). The other five homes have no pages; their links return the custom not-found page, by the user's decision (10 Sep 2026). "All locations" was removed from the community header; the footer still links up to the group. Data in src/data/group.ts. The community site links up via "All locations" in the header and the footer. The community home page also has a "Stay in touch" section (monthly letter or request a call back).
