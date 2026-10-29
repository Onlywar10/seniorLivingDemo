# Prairie City Landing

Website and staff system for Prairie City Landing, a Tenfold Senior Living community in Folsom, California.

- Public site: `/` (calendar, dining, floor plans and virtual tours, living options, tour booking, care assessment, cost comparison, chat, English/Spanish, large text and high contrast)
- Staff system: `/staff` (dashboard, post once, approvals, calendar and menu editors, family messaging, contacts, photo posts, apartments and waitlist, tours and enquiries, SEO, AI search, monthly scorecard)

## Run

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Next.js 16 (App Router), TypeScript, plain CSS. Content lives in `src/data/`: `site.ts` (community facts, plans, team),
`calendar.ts` (weekly programme and dated events), `menus.ts` (three restaurants), `staff.ts` (staff system), `es.ts` (Spanish).
Pages render per request, so "today" is always the current day in Folsom. The site is set to noindex.
