import Link from "next/link";
import { group } from "@/data/group";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <section className="home-sec tone-linen">
      <div className="wrap">
        <div className="intro">
          <h2>There is no page here yet</h2>
          <p>
            Only Larkmoor House has a full website so far. Every other Larkmoor home is listed on the front page with its phone number, and the front desk at each has this week’s calendar and menus.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" href="/#find">
              <Icon name="pin" />
              Find a location
            </Link>
            <a className="btn btn-outline" href={group.phoneHref}>
              <Icon name="phone" />
              Call {group.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
