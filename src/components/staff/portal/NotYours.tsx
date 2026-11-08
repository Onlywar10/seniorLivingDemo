import Link from "next/link";
import { Icon } from "../../Icon";

/** A section that isn't part of the signed-in person's role. */
export function NotYours({ section }: { section: string; who?: string }) {
  return (
    <>
      <header className="sx-head">
        <div>
          <h1>{section}</h1>
          <p>{section} isn’t part of your role. An administrator can add it for you in Settings.</p>
        </div>
      </header>
      <p><Link className="sx-btn sx-btn-primary" href="/staff/today"><Icon name="sun" /> Back to Today</Link></p>
    </>
  );
}
