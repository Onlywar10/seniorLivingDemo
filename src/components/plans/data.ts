import type { Plan, PlanKind } from "@/data/shared";
import { roomName } from "./FloorPlan";

/** The plan with this code in a community's plans (case-insensitive), or undefined. */
export const findPlan = (plans: Plan[], code: string) => plans.find((p) => p.code.toLowerCase() === code.toLowerCase());

export function availability(p: Plan): { text: string; tone: "open" | "wait" } {
  if (p.available > 0) return { text: `${p.available} available`, tone: "open" };
  if (p.waitlist > 0) return { text: `Waitlist · ${p.waitlist} ahead`, tone: "wait" };
  return { text: "Waitlist", tone: "wait" };
}

export const bedLabel = (p: Plan) => (p.kind === "lantern" ? "Private room" : p.beds === 0 ? "Studio" : `${p.beds} bedroom${p.beds > 1 ? "s" : ""}`);
/** "1 bath", "2 baths", "Shared bath"; null where the community doesn't publish the bath count. */
export const bathLabel = (p: Plan) => (p.baths === null ? null : p.baths === 0.5 ? "Shared bath" : `${p.baths} bath${p.baths > 1 ? "s" : ""}`);

/** A plan with a wrap-around balcony (its features say so). */
export const wrapBalcony = (p: Plan) => p.features.some((f) => /wrap-around balcony/i.test(f));

export const interestFor: Record<PlanKind, string> = { independent: "independent", assisted: "assisted", lantern: "lantern" };

export interface Spot {
  x: number;
  y: number;
  label: string;
  text: string;
}
export interface Stop {
  key: string; // room key on the plan (or "courtyard" for Lantern)
  title: string;
  photo: string;
  alt: string;
  caption: string;
  spots: Spot[];
}

/** What the tour needs to know about the community: its city (for the bedroom's ceiling fan) and Lantern's entry. */
export interface TourPlace {
  city: string;
  /** Lantern's shared living room, just outside the residents' rooms. */
  lanternEntry: Pick<Stop, "photo" | "alt" | "caption" | "spots">;
}

/** Tour stops for a plan: only the rooms it has, in walking order. */
export function tourStops(p: Plan, place: TourPlace): Stop[] {
  const has = (k: string) => p.rooms.some((r) => r[0] === k);
  const care = p.kind !== "independent";
  const stops: Stop[] = [];

  if (p.kind === "lantern") {
    stops.push({ key: "entry", title: "Entry", ...place.lanternEntry });
    stops.push({
      key: "bedroom",
      title: roomName("bedroom", p),
      photo: "/img/apt-bedroom-2.jpg",
      alt: "A furnished private room with a queen bed, blue accent wall and a large window",
      caption: "A private room with space for a favorite chair, family photos and familiar furniture from home.",
      spots: [
        { x: 74, y: 40, label: "Natural light", text: "Oversized windows bring in morning light, which helps keep days and nights in rhythm." },
        { x: 40, y: 44, label: "Emergency pull cord", text: "Emergency pull cords in every room reach the Lantern team right away." },
        { x: 45, y: 80, label: "Bring what matters", text: "Your own bed, quilt and keepsakes make the room feel like home from the first night." },
      ],
    });
    if (has("bath")) {
      stops.push({
        key: "bath",
        title: p.baths === 0.5 ? "Shared bath" : "Private bath",
        photo: "/img/apt-bath.jpg",
        alt: "A bright bathroom with a walk-in shower, grab bars and a solid-surface vanity",
        caption: p.baths === 0.5 ? "A bathroom shared with one neighbour, with a walk-in shower and grab bars." : "A private bathroom with a walk-in shower and grab bars.",
        spots: [
          { x: 53, y: 52, label: "Grab bars", text: "Grab bars by the toilet and in the shower for steady, confident footing." },
          { x: 84, y: 60, label: "Walk-in shower", text: "A low-threshold walk-in shower with a seat and a hand-held shower head." },
          { x: 40, y: 58, label: "Emergency pull cord", text: "One pull reaches a Care Partner, any hour of the day or night." },
        ],
      });
    }
    stops.push({
      key: "courtyard",
      title: "Lantern courtyard",
      photo: "/img/lantern-garden.jpg",
      alt: "Lantern’s secured courtyard with lawn, garden chairs and a shade tree",
      caption: "Lantern’s own secured courtyard, open whenever the weather is good.",
      spots: [
        { x: 18, y: 80, label: "Secured courtyard", text: "Walk, sit in the sun or putt on the green, safely, whenever you like." },
        { x: 68, y: 78, label: "Gardening", text: "Raised planters for Lantern’s gardening club, one of residents’ favorite roles." },
      ],
    });
    return stops;
  }

  if (has("entry")) {
    stops.push(
      p.beds === 0
        ? {
            key: "entry",
            title: "Entry",
            photo: "/img/apt-dining.jpg",
            alt: "Looking in from the entry: a sofa, glass coffee table, dining table and the kitchen beyond",
            caption: "Step inside: living, dining and kitchen in one bright, open room.",
            spots: [
              { x: 50, y: 30, label: "Full kitchen", text: "A full kitchen with stainless appliances, just past the dining table." },
              { x: 25, y: 62, label: "Room for a sofa", text: "Bring your sofa and a coffee table. There’s room to entertain." },
              { x: 6, y: 40, label: "Washer and dryer", text: "Your own washer and dryer, tucked away beside the entry." },
            ],
          }
        : {
            key: "entry",
            title: "Entry",
            photo: "/img/apt-1br.jpg",
            alt: "Looking in from the entry: a round dining table, a dresser and the bedroom through a wide doorway",
            caption: "From the front door, the whole home opens up: dining, living and the bedroom beyond.",
            spots: [
              { x: 17, y: 42, label: "Wide doorways", text: "Wide doorways throughout, with plenty of room for a walker." },
              { x: 84, y: 30, label: "Natural light", text: "Oversized windows fill the apartment with natural light all day." },
              { x: 4, y: 62, label: "Washer and dryer", text: "Your own full-size washer and dryer, a few steps from the front door." },
              { x: 45, y: 86, label: "Room for a dining set", text: "There’s room for a full dining table, so family dinners can happen at home too." },
            ],
          }
    );
  }
  if (has("living")) {
    stops.push({
      key: "living",
      title: roomName("living", p),
      photo: "/img/apt-living.jpg",
      alt: "An open living room with a white sofa, a kitchen peninsula with bar stools and large windows",
      caption: "A real living room, with space for a sectional and a dining table by the window.",
      spots: [
        { x: 63, y: 30, label: "Oversized windows", text: "Floor-to-ceiling light from oversized windows in every living room." },
        { x: 33, y: 13, label: "Pendant lights", text: "Pendant lights hang over the peninsula, warm and bright for evenings in." },
        { x: 28, y: 50, label: "Peninsula with bar seating", text: "Pull up a stool for morning coffee or a glass of wine with friends." },
        { x: 80, y: 62, label: "Room for a sectional", text: "There’s space for the furniture you love, including a sectional." },
      ],
    });
  }
  if (has("kitchen")) {
    stops.push({
      key: "kitchen",
      title: roomName("kitchen", p),
      photo: "/img/apt-kitchen.jpg",
      alt: "A kitchen with light wood cabinets, stainless appliances, a solid-surface island and pendant lights",
      caption: care ? "A kitchen of your own for breakfast and snacks, with three restaurants downstairs for everything else." : "A full-size kitchen, for the days you feel like cooking.",
      spots: [
        { x: 70, y: 66, label: "Stainless appliances", text: "Stainless range, microwave, dishwasher and refrigerator." },
        { x: 40, y: 62, label: "Solid-surface counters", text: "Solid-surface counters that are easy to clean and kind to the eye." },
        { x: 43, y: 14, label: "Pendant lights", text: "Pendant lights over the counter, with soft under-cabinet light." },
        { x: 60, y: 44, label: "Everything within reach", text: "Open shelving and drawers at a comfortable height." },
      ],
    });
  }
  if (has("bedroom")) {
    stops.push({
      key: "bedroom",
      title: roomName("bedroom", p),
      photo: "/img/apt-bedroom.jpg",
      alt: "A bedroom with a queen bed, two lamps, a ceiling fan and a large window",
      caption: "A restful bedroom with room for a queen or king bed and a reading chair.",
      spots: [
        { x: 62, y: 40, label: "Natural light", text: "Oversized windows, with sheers and blackout curtains of your choosing." },
        { x: 95, y: 42, label: "Walk-in closet", text: "Through the door: a walk-in closet with room for every season." },
        { x: 13, y: 10, label: "Ceiling fan", text: `A ceiling fan for warm ${place.city} summer nights.` },
        { x: 30, y: 52, label: "Emergency pull cord", text: "An emergency pull cord by the bed reaches our team, on site 24 hours." },
      ],
    });
  }
  if (has("bedroom2")) {
    stops.push({
      key: "bedroom2",
      title: roomName("bedroom2", p),
      photo: "/img/apt-bedroom-2.jpg",
      alt: "A second bedroom with a blue accent wall, queen bed and upholstered bench",
      caption: "A second bedroom for guests, grandchildren, a study or a hobby room.",
      spots: [
        { x: 74, y: 40, label: "Guest-ready", text: "Room for a queen bed, so family can stay the weekend." },
        { x: 40, y: 72, label: "Make it a study", text: "Plenty of residents turn this room into a study, sewing room or art space." },
      ],
    });
  }
  if (has("bath")) {
    const spots: Spot[] = [
      { x: 84, y: 60, label: "Walk-in shower", text: "A low-threshold walk-in shower, easy now and easy later." },
      { x: 22, y: 64, label: "Solid-surface vanity", text: "A solid-surface vanity with generous storage underneath." },
      { x: 40, y: 58, label: "Emergency pull cord", text: "One pull reaches our team, on site 24 hours a day." },
    ];
    if (care) spots.unshift({ x: 53, y: 52, label: "Grab bars", text: "Grab bars by the toilet and in the shower, installed from day one." });
    stops.push({
      key: "bath",
      title: (p.baths ?? 1) > 1 ? "Baths" : "Bath",
      photo: "/img/apt-bath.jpg",
      alt: "A bright bathroom with a walk-in shower, grab bar and solid-surface vanity",
      caption: (p.baths ?? 1) > 1 ? "Two full bathrooms, each with a walk-in shower." : "A bright, generous bathroom with a walk-in shower.",
      spots,
    });
  }
  if (has("balcony")) {
    const grand = wrapBalcony(p);
    stops.push({
      key: "balcony",
      title: "Balcony view",
      photo: grand ? "/img/courtyard-aerial.jpg" : "/img/courtyard-palms.jpg",
      alt: grand ? "The courtyard from above: paths, planters, the fire table and outdoor dining" : "The courtyard seen from the balconies: lawn, palms and outdoor seating",
      caption: grand ? "From the wrap-around balcony, the whole courtyard is laid out below." : "Morning coffee on your own balcony, looking over the courtyard.",
      spots: grand
        ? [
            { x: 72, y: 62, label: "Fire table", text: "The fire table and outdoor dining, a favorite on summer evenings." },
            { x: 40, y: 30, label: "Garden paths", text: "Winding paths, raised planters and the cutting garden." },
          ]
        : [
            { x: 52, y: 22, label: "Courtyard views", text: "Balconies look over the courtyard’s palms, lawn and gardens." },
            { x: 24, y: 80, label: "Outdoor living room", text: "Fire table, barbecues and outdoor dining, just downstairs." },
          ],
    });
  }
  return stops;
}
