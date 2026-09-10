import Image from "next/image";
import type { ReactNode } from "react";
import { ModuleLabel } from "./ModuleLabel";
import type { ModuleKey } from "@/data/community";

interface Props {
  title: string;
  intro?: ReactNode;
  stamp?: string;
  module?: ModuleKey;
  moduleNote?: string;
  photo?: string;
  alt?: string;
}

/** Page opener: a photograph with the title over a soft green gradient. */
export function PageHeader({ title, intro, stamp, module, moduleNote, photo, alt = "" }: Props) {
  return (
    <div className={`page-header ${photo ? "has-photo" : ""}`}>
      {photo && (
        <div className="page-header-photo" aria-hidden={alt === ""}>
          <Image src={photo} alt={alt} fill priority sizes="100vw" />
        </div>
      )}
      <div className="wrap page-header-inner">
        {module && <ModuleLabel k={module} note={moduleNote} />}
        <div className="page-header-row">
          <div>
            <h1>{title}</h1>
            {intro && <p className="page-intro">{intro}</p>}
          </div>
          {stamp && (
            <span className="stamp stamp-on-dark">
              <span className="dot" aria-hidden="true" />
              {stamp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
