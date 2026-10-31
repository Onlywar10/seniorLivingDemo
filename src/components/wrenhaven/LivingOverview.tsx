// The parent overview of one living option (Independent Living, Assisted Living Services, Lantern Memory Care),
// comparing every open community. Server Component.
import Image from "next/image";
import type { Metadata } from "next";
import { getT } from "@/i18n/server";
import { Icon } from "@/components/Icon";
import type { LivingKey } from "@/data/shared";
import { summaries, intoCommunity, TfCta, TfHead, TfHero } from "./parts";

const copy: Record<LivingKey, {
  meta: { title: string; description: string };
  hero: { eyebrow: string; a: string; em: string; lede: string; photo: string; alt: string };
  intro: { eyebrow: string; a: string; em: string; text: string };
  points: string[];
  priceLabel: string;
  countLabel: (n: number) => string;
  ctaPhoto: string;
}> = {
  independent: {
    meta: { title: "Independent Living", description: "Independent Living at Wrenhaven communities in Fairhollow and Rivermead: spacious luxury apartments with full kitchens, in-apartment washers and dryers, and no second-person fee." },
    hero: { eyebrow: "Independent Living", a: "Real apartment homes, ", em: "real independence", lede: "Spacious studio, one- and two-bedroom apartments with full kitchens, your own washer and dryer, and a lifestyle you shape yourself.", photo: "/img/apt-living.jpg", alt: "A bright apartment living room and kitchen" },
    intro: { eyebrow: "Home on your terms", a: "Everything a home should be, ", em: "and more", text: "Wrenhaven apartments are planned like a house, not a hotel room: full-size kitchens, space for your furniture and big windows. Just outside your door are restaurants, a fitness program and a full calendar of Events & Adventures." },
    points: [
      "Full-sized kitchens with stainless steel appliances",
      "Solid-surface counters and a peninsula",
      "Oversized windows",
      "Room for a full dining set and a sectional",
      "Walk-in closets",
      "An in-apartment washer and dryer",
      "No second-person fee for couples",
      "Assisted Living Services available in every apartment",
    ],
    priceLabel: "Independent Living from",
    countLabel: (n) => `${n} Independent & Assisted Living apartments`,
    ctaPhoto: "/img/apt-dining.jpg",
  },
  assisted: {
    meta: { title: "Assisted Living Services", description: "Assisted Living Services delivered in every apartment at Wrenhaven communities in Fairhollow and Rivermead, so residents can age in place." },
    hero: { eyebrow: "Assisted Living Services", a: "Support that comes ", em: "to you", lede: "Assisted Living Services are available in every Wrenhaven apartment, so residents can age in place and never have to move to get the help they need.", photo: "/img/care-chat.jpg", alt: "A Care Partner chatting with a resident on her sofa" },
    intro: { eyebrow: "Aging in place", a: "Your apartment stays ", em: "your home", text: "When your needs change, your address doesn’t. The resident services team tailors support to you, delivered privately in your own apartment, and adjusts it as you go." },
    points: [
      "Available in every apartment",
      "Medication management",
      "Assistance with personal care",
      "Escorts to meals, activities and appointments",
      "Coordination with your healthcare providers",
      "A personal assessment before move-in",
      "A team on site 24 hours",
      "An emergency response system in every apartment",
    ],
    priceLabel: "Base support fee",
    countLabel: (n) => `Available in all ${n} Independent & Assisted Living apartments`,
    ctaPhoto: "/img/care-laugh.jpg",
  },
  lantern: {
    meta: { title: "Lantern Memory Care", description: "Lantern Memory Care at Wrenhaven communities in Fairhollow and Rivermead: a home-like, secured neighborhood with its own courtyard, activity team and Events & Adventures." },
    hero: { eyebrow: "Lantern Memory Care", a: "A warm light, ", em: "always on", lede: "Lantern is a calm, secure neighborhood within each Wrenhaven community, where days are full of warmth, routine and good humour.", photo: "/img/lantern-living.jpg", alt: "Lantern’s bright living room with armchairs" },
    intro: { eyebrow: "Life at Lantern", a: "Purpose, joy and ", em: "adventure", text: "Lantern residents have their own activity team and their own Events & Adventures, with outings beyond the community, and they are welcome at every community event." },
    points: [
      "A home-like, secured neighborhood",
      "A secure courtyard of its own",
      "Its own Events & Adventures program",
      "Ceramics, music, pet therapy, therapeutic storytelling and gardening",
      "Outings to museums, golf and more, even stand-up paddling",
      "Fitness classes designed by the Fitness Director",
      "Invited to every community event",
    ],
    priceLabel: "Lantern from",
    countLabel: (n) => `${n} Lantern apartments`,
    ctaPhoto: "/img/lantern-couple.jpg",
  },
};

export async function livingMetadata(key: LivingKey): Promise<Metadata> {
  const { t } = await getT();
  return { title: t(copy[key].meta.title), description: t(copy[key].meta.description) };
}

export async function LivingOverview({ which }: { which: LivingKey }) {
  const { t, href, lang } = await getT();
  const k = copy[which];
  const all = summaries();
  const price = (s: (typeof all)[number]) => (which === "assisted" ? t(`${s.from.assisted}/mo`) : t(`from ${s.from[which]}/mo`));
  const count = (s: (typeof all)[number]) => (which === "lantern" ? s.apartments.lantern : s.apartments.independentAssisted);
  const others = (["independent", "assisted", "lantern"] as LivingKey[]).filter((x) => x !== which);
  return (
    <>
      <TfHero
        t={t}
        href={href}
        crumbs={[[k.hero.eyebrow, `/living/${which === "independent" ? "independent-living" : which === "assisted" ? "assisted-living" : "lantern-memory-care"}`]]}
        eyebrow={k.hero.eyebrow}
        title={
          <>
            {t(k.hero.a)}
            <em>{t(k.hero.em)}</em>
          </>
        }
        lede={t(k.hero.lede)}
        photo={k.hero.photo}
        alt={k.hero.alt}
      >
        <div className="btn-row">
          <a className="btn" href="#compare">
            {t("Compare communities")}
          </a>
        </div>
      </TfHero>

      <section className="sec tone-cream" aria-labelledby="lv-intro-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="lv-intro-h"
            eyebrow={k.intro.eyebrow}
            title={
              <>
                {t(k.intro.a)}
                <em>{t(k.intro.em)}</em>
              </>
            }
            lede={k.intro.text}
          />
          <ul className="tf-points">
            {k.points.map((p) => (
              <li key={p}>
                <Icon name="check" /> <span>{t(p)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="compare" className="sec tone-white" aria-labelledby="lv-compare-h">
        <div className="wrap">
          <TfHead
            t={t}
            id="lv-compare-h"
            eyebrow="Compare communities"
            title={
              <>
                {t(`${k.hero.eyebrow} at `)}
                <em>{t("each community")}</em>
              </>
            }
          />
          <div className="tf-compare">
            {all.map((s) => {
              const living = s.c.living[which];
              return (
                <article key={s.slug} className="tf-compare-card" aria-labelledby={`lv-${s.slug}`}>
                  <div className="tf-comm-ph">
                    <Image src={living.photo} alt={t(living.alt)} fill sizes="(max-width: 760px) 100vw, 50vw" />
                  </div>
                  <div className="tf-compare-body">
                    <p className="tf-comm-city">
                      <Icon name="pin" /> {s.city}, CA
                    </p>
                    <h3 id={`lv-${s.slug}`}>{s.name}</h3>
                    <p className="tf-compare-from">
                      <span className="vh">{t(k.priceLabel)} </span>
                      {price(s)}
                    </p>
                    <p className="muted" style={{ margin: 0 }}>
                      {t(k.countLabel(count(s)))}
                    </p>
                    <p style={{ margin: 0 }}>{t(living.lede)}</p>
                    <ul>
                      {living.points.slice(0, 5).map((p) => (
                        <li key={p}>
                          <Icon name="check" /> <span>{t(p)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="btn-row">
                      <a className="btn btn-green btn-sm" href={intoCommunity(lang, s.slug, living.href)}>
                        {t(`${k.hero.eyebrow} at ${s.name}`)}
                      </a>
                      <a className="btn btn-ghost btn-sm" href={intoCommunity(lang, s.slug, "/tour")}>
                        {t("Schedule a Tour")}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="tf-table-wrap" style={{ marginTop: 36 }}>
            <table className="tf-table">
              <caption className="vh">{t(`${k.hero.eyebrow}: communities side by side`)}</caption>
              <thead>
                <tr>
                  <td />
                  {all.map((s) => (
                    <th key={s.slug} scope="col">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{t(k.priceLabel)}</th>
                  {all.map((s) => (
                    <td key={s.slug}>{price(s)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t(which === "lantern" ? "Lantern apartments" : "Apartments")}</th>
                  {all.map((s) => (
                    <td key={s.slug}>{count(s)}</td>
                  ))}
                </tr>
                {which === "independent" && (
                  <tr>
                    <th scope="row">{t("Couples save each year")}</th>
                    {all.map((s) => (
                      <td key={s.slug}>{t(`about $${s.c.pricing.secondPersonSaving.toLocaleString("en-US")}`)}</td>
                    ))}
                  </tr>
                )}
                <tr>
                  <th scope="row">{t("Opened")}</th>
                  {all.map((s) => (
                    <td key={s.slug}>{t(s.opened)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{t("Call")}</th>
                  {all.map((s) => (
                    <td key={s.slug}>
                      <a href={s.c.site.phoneHref}>{s.c.site.phone}</a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>
            {t(which === "assisted" ? "Monthly base support fee, plus personal care by care plan. Each community confirms pricing after a personal assessment." : "Starting monthly rates. Each community’s floor plans page has every plan and current availability.")}
          </p>
        </div>
      </section>

      <section className="sec-tight tone-sand" aria-labelledby="lv-more-h">
        <div className="wrap">
          <h2 id="lv-more-h" className="vh">
            {t("Other living options")}
          </h2>
          <div className="grid-2">
            {others.map((o) => (
              <a key={o} className="tf-coming-card" href={href(`/living/${o === "independent" ? "independent-living" : o === "assisted" ? "assisted-living" : "lantern-memory-care"}`)}>
                <span className="eyebrow">{t("Living options")}</span>
                <h3>{t(copy[o].hero.eyebrow)}</h3>
                <p className="muted">{t(copy[o].hero.lede)}</p>
                <span className="link-arrow">
                  {t("Learn more")} <Icon name="arrow" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <TfCta t={t} href={href} photo={k.ctaPhoto} />
    </>
  );
}
