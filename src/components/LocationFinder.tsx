"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { communities, type CareLevel } from "@/data/group";
import { Icon } from "./Icon";

const levels: CareLevel[] = ["Independent living", "Assisted living", "Memory care"];

export function LocationFinder() {
  const [q, setQ] = useState("");
  const [care, setCare] = useState<CareLevel | "">("");

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return communities.filter((c) => {
      const hay = `${c.name} ${c.city} ${c.state} ${c.zip} ${c.state === "OR" ? "oregon" : "washington"}`.toLowerCase();
      return (!t || hay.includes(t)) && (!care || c.care.includes(care));
    });
  }, [q, care]);

  return (
    <div className="finder">
      <form className="finder-form" onSubmit={(e) => e.preventDefault()} role="search" aria-label="Find a community">
        <label className="finder-search">
          <span className="vh">City, town or postcode</span>
          <Icon name="search" />
          <input type="search" placeholder="City, town or zip code" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="finder-chips" role="group" aria-label="Care level">
          <button type="button" aria-pressed={care === ""} onClick={() => setCare("")}>
            All care
          </button>
          {levels.map((l) => (
            <button key={l} type="button" aria-pressed={care === l} onClick={() => setCare(care === l ? "" : l)}>
              {l}
            </button>
          ))}
        </div>
      </form>

      <p className="finder-count" role="status">
        {list.length === communities.length ? `All ${communities.length} communities` : `${list.length} of ${communities.length} communities`}
        {q && ` matching “${q}”`}
      </p>

      <ul className="locations">
        {list.map((c) => (
          <li key={c.slug} className="loc">
            <Link href={c.href ?? `/communities/${c.slug}`} className="loc-photo" aria-label={`${c.name}, ${c.city}`}>
              <Image src={c.photo} alt={c.alt} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" />
            </Link>
            <div className="loc-body">
              <h3>
                <Link href={c.href ?? `/communities/${c.slug}`}>{c.name}</Link>
              </h3>
              <p className="loc-place">
                <Icon name="pin" /> {c.city}, {c.state}
              </p>
              <p className="loc-care">{c.care.join(" · ")}</p>
              <p className="loc-line">{c.line}</p>
              <div className="loc-actions">
                <Link className="btn btn-gold" href={c.href ?? `/communities/${c.slug}`}>
                  {c.href ? "Visit the community site" : "About this home"}
                </Link>
                <a className="loc-phone" href={c.phoneHref}>
                  <Icon name="phone" /> {c.phone}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="finder-empty">
          No community matches that yet. We are in Millbrook Bend, Salem, Eugene, Astoria and Bend in Oregon, and Vancouver in Washington. Call {`(503) 555-0100`} and we will help you find the closest.
        </p>
      )}
    </div>
  );
}
