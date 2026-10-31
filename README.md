# Wrenhaven Senior Living

An example website and staff system for **Wrenhaven Senior Living**, a fictional senior living company, and its two fictional communities. Every name, person, address, phone number, price and story here is invented; any resemblance to a real operator is coincidental.

- **Wrenhaven parent site:** `/` (home, communities including those opening in 2027, living options, lifestyle, about, careers, contact)
- **Community sites**, each with the same pages and tools:
  - `/alder-bend/…` (Fairhollow)
  - `/kestrel-point/…` (Rivermead)
  - Pages: calendar, dining and menus, floor plans and virtual tours, living options, tour booking, care assessment, cost comparison, team, news and chat.
- **Languages:** English at the plain address, Spanish under `/es/…`, Simplified Chinese under `/zh/…`. Every page is translated on the server. A visitor whose browser asks for Spanish or Chinese is offered the switch, and the choice is remembered.
- **Staff system:** `/staff`. It has a community switcher, plus a Wrenhaven-wide overview on the dashboard and scorecard.

## Run

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Next.js 16 (App Router), TypeScript, plain CSS. Pages render per request, so "today" is always the current day in California. The site is set to noindex.

## How it fits together

- **Routing:** `src/proxy.ts` reads the language prefix and the community from the address and passes both to the page in request headers. Old single-community addresses (`/dining`) redirect to `/alder-bend/dining`.
- **Pages:**
  - `src/app/(wrenhaven)/`: the parent site.
  - `src/app/[community]/`: the community pages, shared by every community.
  - `src/app/staff/`: the staff system.
- **Content:**
  - `src/data/wrenhaven.ts`: company-wide content.
  - `src/data/communities/<slug>/`: each community's facts, calendar, menus, info and news, gathered in `src/data/communities/index.ts`.
  - `src/data/communities/copy/`: community-specific page copy.
  - `src/data/shared.ts`: shared types.
  - `src/data/staff/`: staff-system data.
- **Reading the community:** Server Components use `getCommunity()` (`src/lib/community-server.ts`); Client Components use `useCommunity()` (`src/lib/community.tsx`).
- **Translation:** `src/i18n/`. Wrap English text in `t()` from `getT()` (server) or `useT()` (client). The dictionaries `es.ts` and `zh.ts` are keyed by the exact English. Dates, times and prices inside strings are converted automatically. In development, any text without a translation is logged as `[i18n-miss]`.
- **Links:** use `Link` from `@/i18n/Link` or `href()`. `"/dining"` stays in the current community and language; `"~/communities"` goes to the parent site.

To add a community:
1. Add its folder under `src/data/communities/`.
2. Register it in `src/data/communities/index.ts` and `src/lib/sites.ts`.
3. Add its entries to the copy files and to `src/data/staff/`.
