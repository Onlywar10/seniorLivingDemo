import Link from "next/link";
import { Icon } from "./Icon";

interface Props {
  title: string;
  sub?: string;
  href?: string;
  linkText?: string;
  id?: string;
  level?: 2 | 3;
}

/** The school-district style header bar: title on the left, one link on the right. */
export function SectionBar({ title, sub, href, linkText, id, level = 2 }: Props) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <div className="bar" id={id}>
      <div className="bar-title">
        <H>{title}</H>
        {sub && <span className="bar-sub">{sub}</span>}
      </div>
      {href && linkText && (
        <Link className="bar-link" href={href}>
          {linkText}
          <Icon name="arrow" />
        </Link>
      )}
    </div>
  );
}
