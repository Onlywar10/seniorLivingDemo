import type { Metadata } from "next";
import Image from "next/image";
import { PageHead, Badge } from "@/components/staff/ui";
import { Icon } from "@/components/Icon";
import { library } from "@/data/staff";

export const metadata: Metadata = { title: "Content library" };

export default function LibraryPage() {
  return (
    <>
      <PageHead title="Content library" sub="Activity ideas, templates and menus your communities have used and shared. Use one and it lands in your calendar or the design studio, ready to edit.">
        <input className="sx-input" placeholder="Search ideas and templates" style={{ width: 260 }} />
        <button className="sx-btn sx-btn-primary" type="button">
          <Icon name="plus" /> Add to library
        </button>
      </PageHead>
      <div className="sx-chips" role="group" aria-label="Filter">
        {["All", "Activity ideas", "Templates", "Menus", "Seasonal", "Memory care", "Fitness"].map((f, i) => (
          <button key={f} type="button" aria-pressed={i === 0}>
            {f}
          </button>
        ))}
      </div>
      <div className="lib">
        {library.map((l) => (
          <article key={l.title} className="lib-card">
            <div className="lib-img">
              <Image src={l.photo} alt="" fill sizes="280px" />
              <Badge tone={l.kind === "Template" ? "info" : l.kind === "Menu" ? "accent" : "good"}>{l.kind}</Badge>
            </div>
            <div className="lib-b">
              <h3>{l.title}</h3>
              <p>{l.text}</p>
              <div className="lib-tags">
                {l.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="sx-note" style={{ margin: 0 }}>
                Used by {l.used} of 6 communities
              </p>
              <div className="lib-act">
                <button className="sx-btn sx-btn-primary" type="button">
                  Use this
                </button>
                <button className="sx-btn" type="button">
                  <Icon name="share" /> Share
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
