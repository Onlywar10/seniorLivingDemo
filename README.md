# Larkmoor House — senior living website demonstration

A fictional assisted living and memory care community, built as a product argument: in senior living the
information *is* the sales asset. The home page leads with today's calendar and menu, and every section links
to the full record (team, costs, state inspection history, family handbook, alerts) instead of to a lead form.

Press **Show module structure** in the "Demo" control at the bottom right to see every section labelled with
its content module, its editor inside the building, the underlying content type, and its publishing lane.

## Run

```
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Next.js 16, App Router, TypeScript. All content lives in `src/data/community.ts`. Every name, price, date and
phone number is invented; photos are Unsplash images downloaded to `public/photos`.

The earlier single-page version is kept in `_previous/index.html`.
