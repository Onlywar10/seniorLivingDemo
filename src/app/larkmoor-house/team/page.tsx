import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SectionBar } from "@/components/SectionBar";
import { StaffCard } from "@/components/lists";
import { Lead, Quote, PageCta } from "@/components/Story";
import { staff, staffing } from "@/data/community";

export const metadata: Metadata = { title: "Care team" };

export default function TeamPage() {
  return (
    <>
      <PageHeader
        title="The people who work here"
        intro="Who to call about what. Everyone below is on site most weekdays; the nurse line is answered 24 hours a day."
        stamp="Updated this week"
        module="care-team"
        photo="/photos/nurse.jpg"
        alt="A nurse smiling with a resident in her room"
      />
      <div className="wrap page-body">
        <Lead title="A nurse in the building, day and night" photo="/photos/hands.jpg" alt="Two residents holding hands with a caregiver" caption="Second floor, after breakfast">
          <p>
            Priya Raghunathan runs nursing with a rule she learned on a hospital ward: the family hears from us first. If someone goes to hospital, the nurse on duty rings before the ambulance has left Fern Street, and rings again when they are back.
          </p>
          <p>
            Sixty-one people work here. Most of the caregivers have been here for years and know whose door to knock on twice. Marianne, the Executive Director, eats lunch in the dining room most days, which is the easiest place to find her.
          </p>
        </Lead>

        <section aria-labelledby="staff-h">
          <SectionBar id="staff-h" title="Leadership and department heads" sub={`${staff.length} people, with who to call about what`} />
          <div className="panel">
            <ul className="staff">
              {staff.map((s) => (
                <StaffCard key={s.name} s={s} />
              ))}
            </ul>
            <p className="panel-foot">
              <span>To reach an extension, call (503) 555-0142 and dial it at any time. Our 52 caregivers, med aides, cooks and housekeepers are introduced on the floor.</span>
            </p>
          </div>
        </section>

        <Quote who="James Okonkwo" />

        <section aria-labelledby="staffing-h">
          <SectionBar id="staffing-h" title="Staffing, in numbers" sub="From last month’s actual roster" />
          <div className="panel">
            <ul className="kpis">
              {staffing.map((k) => (
                <li key={k.value}>
                  <span className="v">{k.value}</span>
                  <span className="k">{k.label}</span>
                </li>
              ))}
            </ul>
            <p className="panel-foot">
              <span>Agency staff covered 3% of hours in August. Ratios are recomputed monthly from the shift roster.</span>
            </p>
          </div>
        </section>
      </div>
      <PageCta title="Meet Daniel and a nurse" text="Every tour includes time with our family liaison and one of the nurses, with no one else in the room." />
    </>
  );
}
