// "Find a community": every Wrenhaven location on a map of the United States, each pin a link to that community's
// site (or, for one still being built, to its interest list). Today they're all in Northern California, so a
// magnifier shows that corner close up. Beside the map, the same places as a list of cards, which is also how the
// map reads on a phone and to a screen reader. The communities are fictional; their places on the map are
// illustrative, around the Sacramento area (the 916 area code they use).
import Image from "next/image";
import type { Lang } from "@/i18n/config";
import { Icon } from "../Icon";
import type { CommunitySlug } from "@/data/communities";
import { comingCommunities } from "@/data/wrenhaven";
import { intoCommunity, summaries } from "./parts";

type T = (s: string) => string;

// The contiguous United States, simplified (longitude, latitude), and California within it.
const US: [number, number][] = [
  [-124.7, 48.4], [-123, 49], [-95.2, 49], [-89.6, 48], [-84.8, 46.5], [-82.5, 45.3], [-82.4, 43], [-79, 42.9], [-76.8, 43.6], [-74.9, 45],
  [-71.5, 45], [-69.2, 47.4], [-67, 45.2], [-70.2, 43.7], [-70.6, 42.6], [-70, 41.7], [-71.9, 41.3], [-74, 40.6], [-74, 39], [-75.5, 38.4],
  [-75.9, 36.9], [-75.5, 35.2], [-77.9, 33.9], [-80.9, 32], [-81.4, 30.4], [-80.1, 26.9], [-80.4, 25.2], [-81.8, 26.1], [-82.7, 27.9], [-83.6, 29.9],
  [-85.4, 29.7], [-88.1, 30.4], [-89.6, 30.2], [-89.4, 29], [-91.3, 29.3], [-93.8, 29.7], [-95, 29.3], [-97.4, 27.8], [-97.2, 25.9], [-99.1, 26.4],
  [-101.4, 29.8], [-103, 29], [-104.6, 29.9], [-106.5, 31.8], [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.5, 34],
  [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.8], [-124.4, 40.4], [-124.2, 42], [-124.1, 44.6], [-123.9, 46.2],
];
const CA: [number, number][] = [
  [-124.2, 42], [-120, 42], [-120, 39], [-114.6, 35], [-114.6, 32.7], [-117.1, 32.5], [-118.5, 34], [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.8], [-124.4, 40.4],
];

// Where each one sits inside the magnifier: illustrative, laid out so every name reads, keeping their rough
// directions from each other (Alder Bend in the middle, Kestrel Point to the southwest, Thistle Ridge to the
// northeast, Sorrel Hill to the southeast).
const PLACE: Record<string, [number, number]> = {
  "alder-bend": [-60, -30],
  "kestrel-point": [-115, 95],
  "thistle-ridge": [5, -105],
  "sorrel-hill": [30, 40],
};

const W = 960, H = 530;
const px = ([lon, lat]: [number, number]) => [((lon + 125) / 58.5) * W, ((49.5 - lat) / 25.5) * H] as const;
const path = (pts: [number, number][]) => `M${pts.map((p) => px(p).map((n) => n.toFixed(1)).join(" ")).join("L")}Z`;

// The magnifier: a circle over the West, showing the corner around Sacramento close up.
const CENTER: [number, number] = [-121.2, 38.72];
const LENS = { x: 410, y: 290, r: 205 };
const inLens = ([dx, dy]: [number, number]) => [LENS.x + dx, LENS.y + dy] as const;

export function CommunityMap({ t, href, lang, id = "find" }: { t: T; href: (p: string) => string; lang: Lang; id?: string }) {
  const open = summaries().map((s) => ({ key: s.slug as string, name: s.name, city: `${s.city}, CA`, href: intoCommunity(lang, s.slug as CommunitySlug), tour: intoCommunity(lang, s.slug as CommunitySlug, "/tour"), open: true as const, s }));
  const coming = comingCommunities.map((c) => ({ key: c.key, name: c.name, city: `${c.city}, ${c.state}`, planned: c.planned, open: false as const }));
  const places = [...open, ...coming];
  const [cx, cy] = px(CENTER);
  return (
    <div className="cm" id={id}>
      <figure className="cm-map">
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={t("Map of Wrenhaven communities in the United States")}>
          <path d={path(US)} className="cm-us" />
          <path d={path(CA)} className="cm-ca" />
          <circle cx={cx} cy={cy} r={7} className="cm-cluster" />
          <line x1={cx} y1={cy} x2={LENS.x - LENS.r * 0.82} y2={LENS.y - LENS.r * 0.57} className="cm-leader" />
          <circle cx={LENS.x} cy={LENS.y} r={LENS.r} className="cm-lens" />
          <text x={LENS.x} y={LENS.y - LENS.r + 40} textAnchor="middle" className="cm-lens-t">{t("Northern California")}</text>
          {places.map((p, i) => {
            const [x, y] = inLens(PLACE[p.key] ?? [0, 0]);
            const label = p.open ? t(`${p.name}, ${p.city}. Visit the community`) : t(`${p.name}, ${p.city}. Opening ${p.planned}. Join the interest list`);
            return (
              <a key={p.key} href={p.open ? p.href : href(`/communities#${p.key}`)} aria-label={label} className={`cm-pin${p.open ? "" : " is-coming"}`}>
                <circle cx={x} cy={y} r={19} />
                <text x={x} y={y + 7} textAnchor="middle">{i + 1}</text>
                <text x={x + 27} y={y + 7} className="cm-pin-name">{p.name}</text>
              </a>
            );
          })}
        </svg>
        <figcaption className="cm-legend">
          <span><i className="cm-dot" /> {t("Open now")}</span>
          <span><i className="cm-dot is-coming" /> {t("Opening 2027")}</span>
          <span className="muted">{t("Tap a pin or a community to go there.")}</span>
        </figcaption>
      </figure>

      <ol className="cm-list">
        {open.map((p, i) => (
          <li key={p.key} className="cm-card">
            <a className="cm-card-main" href={p.href}>
              <span className="cm-card-ph"><Image src={p.s.photo} alt="" fill sizes="120px" /></span>
              <span className="cm-card-t">
                <span className="cm-n" aria-hidden="true">{i + 1}</span>
                <b>{p.name}</b>
                <small><Icon name="pin" /> {p.city}</small>
                <small>{p.s.living.map((l) => t(l)).join(" · ")}</small>
              </span>
            </a>
            <div className="cm-card-act">
              <a className="btn btn-sm" href={p.href}>{t(`Visit ${p.name}`)}</a>
              <a className="btn btn-sm btn-ghost" href={p.tour}>{t("Book a tour")}</a>
            </div>
          </li>
        ))}
        {coming.map((p, i) => (
          <li key={p.key} className="cm-card is-coming">
            <a className="cm-card-main" href={href(`/communities#${p.key}`)}>
              <span className="cm-card-t">
                <span className="cm-n" aria-hidden="true">{open.length + i + 1}</span>
                <b>{p.name}</b>
                <small><Icon name="pin" /> {p.city}</small>
                <small>{t(`Opening ${p.planned}`)}</small>
              </span>
            </a>
            <div className="cm-card-act">
              <a className="btn btn-sm btn-ghost" href={href(`/communities#${p.key}`)}>{t("Join the interest list")}</a>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
