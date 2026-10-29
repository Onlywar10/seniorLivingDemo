import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { Icon } from "@/components/Icon";
import { MealCard, DietKey } from "@/components/lists";
import { Lead, Quote, PageCta } from "@/components/Story";
import { community, getTodayMenu, getWeekMenu, serviceHours } from "@/data/community";

export const metadata: Metadata = { title: "Dining" };

export default function DiningPage() {
  const todayMenu = getTodayMenu();
  const weekMenu = getWeekMenu();
  return (
    <>
      <PageHeader
        title="Dining"
        intro="Three meals a day from our own kitchen, in the Main Dining Room or the Bistro, with the menu posted a week ahead."
        stamp={`Updated ${community.updatedAt} · Chef Luis`}
        module="daily-life"
        moduleNote="Menus publish immediately on the approved template. The four-week cycle is written once; daily changes go up the same morning."
        photo="/photos/dining-group.jpg"
        alt="Residents sharing lunch at a long table in the Main Dining Room"
      />
      <div className="wrap page-body">
        <Lead title="Lunch is the middle of the day for a reason" photo="/photos/dining-three.jpg" alt="Three residents laughing over lunch" caption="Table six, most days" flip>
          <p>
            Luis Barrientos has run the kitchen for seven years. He buys from the same three farms every week, roasts on Sundays, and knows who takes their eggs soft and who will not touch a mushroom. The Sunday roast is the busiest meal of the week; the Friday fish tacos were added because the residents’ council asked.
          </p>
          <p>
            Tables are for four and six, nobody is seated alone unless they want to be, and family are welcome at any meal. Tell the front desk by ten and the kitchen sets a place.
          </p>
        </Lead>

        <section aria-labelledby="hours-h">
          <SectionBar id="hours-h" title="Service hours" sub="Every day, including holidays" />
          <div className="panel">
            <ul className="hours">
              {serviceHours.map((h) => (
                <li key={h.meal}>
                  <b>{h.meal}</b>
                  <span className="hours-t">{h.hours}</span>
                  <span className="muted">{h.where}</span>
                  <span className="muted small">{h.note}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="today-menu-h">
          <SectionBar id="today-menu-h" title="Today’s menu" sub={community.todayShort} />
          <div className="panel">
            <div className="meals">
              {todayMenu.meals.map((m) => (
                <MealCard key={m.name} meal={m} />
              ))}
            </div>
            <p className="panel-foot">
              <DietKey />
            </p>
          </div>
        </section>

        <section aria-labelledby="week-menu-h">
          <SectionBar id="week-menu-h" title="Menu for the week" sub={community.weekLabel} />
          <div className="panel">
            {weekMenu.map((d) => (
              <details key={d.day} className={`menu-day ${d.today ? "today" : ""}`} open={d.today}>
                <summary>
                  {d.day}
                  {d.today && <span className="today-tag">Today</span>}
                  <span className="dd">{d.date}</span>
                  <Icon name="arrow" className="chev" />
                </summary>
                <div className="meals">
                  {d.meals.map((m) => (
                    <MealCard key={m.name} meal={m} />
                  ))}
                </div>
              </details>
            ))}
            <p className="panel-foot">
              <span>Guest meals $9, Sunday roast $12; tell the front desk by 10 am.</span>
              <Link href="/larkmoor-house/handbook#documents">Download this month’s menu cycle (PDF, large print available)</Link>
              <Link href="/larkmoor-house/stay-connected">Get the menu by text or email every Monday</Link>
            </p>
          </div>
        </section>

        <Quote who="Dorothy Lindqvist" />

        <Lead title="Diets, textures and favourites" photo="/photos/tea.jpg" alt="Residents with tea and pie in the Bistro" caption="Afternoon tea in the Bistro">
          <p>
            Every item on the menu can be made vegetarian, low sodium, gluten free, soft or puréed, and the kitchen prints each resident’s diet on their meal ticket so nothing depends on memory. Allergies are recorded at move-in and flagged in the kitchen.
          </p>
          <p>
            Between meals the Bistro serves coffee, soup and sandwiches from nine to seven. Bring Luis a recipe from home and it will turn up on the menu within the month.
          </p>
        </Lead>
      </div>
      <PageCta title="Come for lunch" text="Tour in the late morning and stay for the meal; it is the best way to see the place." />
    </>
  );
}
