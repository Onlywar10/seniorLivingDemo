// News: the long-form article bodies (keyed by story slug) plus the newest posts.
import { newsKinds, storyDate, type Story } from "@/data/shared";
import { stories } from "./site";

export { newsKinds, storyDate };

/** Posts that sit alongside the stories in site.ts. */
export const extraStories: Story[] = [
  {
    slug: "halloween-pumpkin-creations",
    kind: "Events & Adventures",
    title: "Our Halloween Pumpkin Creations",
    dek: "Knives, paint pens and plenty of laughs around the fire table. Here is what residents came up with this year.",
    date: "2026-10-30",
    photo: "/img/pumpkins.jpg",
    alt: "A row of carved and painted pumpkins",
    body: [],
  },
  {
    slug: "honoring-our-veterans-november-11",
    kind: "News",
    title: "Honoring Our Veterans on November 11",
    dek: "The Old Town parade in the morning, a Veterans’ Lunch in Millpond Café and an afternoon ceremony for veterans and their families.",
    date: "2026-10-26",
    photo: "/img/flag.jpg",
    alt: "An American flag flying against a blue sky",
    body: [],
  },
];

export const articleBodies: Record<string, string[]> = {
  "halloween-pumpkin-creations": [
    "Pumpkin week has become one of the courtyard’s busiest traditions, and this year more residents joined in than ever. On Wednesday afternoon chairs were pulled up around the fire table and the carving began, some people working from careful sketches and others simply making it up as they went.",
    "By the end of the day we had black cats, a wise old owl, a haunted mansion with tiny windows, two likenesses of Thor and a pumpkin wearing the Fairhollow Bulldogs logo for our neighbours at Fairhollow High School. The Events & Adventures team did the messy scooping, and the Perch kept hot cider coming.",
    "Thursday morning belonged to Lantern. Residents there painted their pumpkins in the Lantern courtyard, each picking their own colors and designs, and several asked for theirs to sit by the front door so visiting families would spot them straight away.",
    "Every pumpkin went on display in the Lobby for Friday’s Halloween Happy Hour, and the photo gallery is on our Facebook page. Thanks to everyone who voted for a favorite, and to the grandchildren who returned on Saturday for the Trick-or-Treat Hallway.",
  ],
  "honoring-our-veterans-november-11": [
    "Our residents include veterans of the Army, Navy, Marines, Air Force and Coast Guard, along with the husbands, wives, sons and daughters of many more. Veterans Day is our chance to thank all of them, and we give it the whole day.",
    "We start early. The bus leaves the Lobby at 7:30 am for the Fairhollow Veterans Day Parade in Old Town. There are 18 seats, so sign up at the front desk or with Nora in Events & Adventures. We will bring blankets and a flask of coffee.",
    "At 11:00 am Millpond Café hosts a Veterans’ Lunch for every resident veteran and one guest. At 2:00 pm the Theatre holds a ceremony for veterans and their families only, with the names and branches of service read aloud. Families are very welcome; just let us know you are coming so a seat is waiting.",
    "Wartime veterans and their surviving spouses may qualify for the VA Aid and Attendance benefit, which can help with the cost of senior living. Our free guide explains the basics, and Priya Nandakumar is glad to go through it with you.",
  ],
  "calder-valley-memory-walk": [
    "The week before the Calder Valley Memory Walk, the Lantern activity room was full of buckets, rubber bands and bright dye. Lantern residents made their own team shirts, no two the same, and pegged them up in the courtyard to dry in the autumn sun.",
    "On the morning of the walk, residents, families and Care Partners set off along the Calder River parkway as one team. Some went the whole distance; others waved homemade signs from a bench in the shade. Grandchildren took turns pushing wheelchairs and soon had everyone keeping up with them.",
    "Lantern Memory Care Director Maribel Ortiz says the walk means more than the money raised. “We don’t walk on our residents’ behalf,” she said. “We walk beside them, and that is the whole idea.”",
    "Thank you to every family who came, and to the team members who gave up a day off to be there. The shirts are hanging in residents’ closets again, and a few have already made an appearance at happy hour.",
  ],
  "paint-and-sip-with-talia": [
    "Most residents know Talia from the evening shift on our Care Partner team. Fewer knew that she spends her weekends painting the hills around Millpond Lake, until she mentioned it over coffee in the Perch.",
    "Nora Castellano, our Events & Adventures Director, asked her on the spot to teach a class. A few weeks later the Art Studio was laid out with easels, fresh canvases and a glass of wine or sparkling cider at every place.",
    "Talia took the group through a lakeside sunset one step at a time: the sky, then the water, then a lone pine on the shore. Every pine came out different, which was exactly what she wanted. There was laughter, some paint on cuffs, and real pride when the finished pictures came off the easels.",
    "The paintings hung in the hallway by the Art Studio for the rest of the week. It is one of the things we love about Alder Bend: the people who look after you have talents of their own, and they are happy to share them.",
  ],
  "mine-tour": [
    "Some outings are about a long lunch and a pretty drive. This one went underground. The bus climbed into the hills above Fairhollow to the Copper Creek Mine, where miners followed a seam of gold-bearing quartz in the 1850s.",
    "With hard hats on and headlamps lit, residents followed our guide into the tunnels and saw where the miners chipped away by hand and by candlelight. A couple of residents had last been inside as schoolchildren; others had driven past the sign for years and never stopped.",
    "Back in the daylight the group looked over the old stamp mill and strolled the creek trail before lunch in Old Town. The ride home was the contented kind of quiet that follows a really good day.",
    "This is what Events & Adventures is for, from small everyday pleasures to the trips people have always meant to take. If there is somewhere you have always wanted to go, bring it to Nora at the Friday Activity Meeting. Most of our favorite trips started there.",
  ],
  "social-fitness": [
    "Ask Fitness Director Devin Marsh how to stay active past 70 and he will not name an exercise. He will ask who you are bringing. “The people who keep coming are the ones who come with someone,” he says. “The class gets them through the door once. Friends get them back.”",
    "Devin works on site full time and teaches more than 25 classes a week, including Better Balance, Resistance Bands, Circuit Playground and Stretch Breathe Relax in Lantern. Every one is planned around company as much as exercise: introductions at the start, a chat at the end, and usually a song in the middle that everyone can sing along to.",
    "He calls it social fitness, and you can see it all over the calendar. The Monday nature walks are as much about the conversation as the distance. The monthly Healthy Happy Hour mixes music, healthy snacks and a few dance steps. Plenty of residents who arrive insisting they are not ‘exercise people’ come for the friends and end up staying for the class.",
    "The research agrees with him: staying active and staying connected both help with balance, mood and memory as we age, and each makes the other easier. Residents put it more simply. “I go because Devin will notice if I don’t,” one Better Balance regular told us. “And so will everyone else.”",
    "Want to see for yourself? Residents can join any class on the calendar, and visitors on a tour are welcome to look in. Devin will almost certainly ask you to join in.",
  ],
  "relationships-make-alder-bend-home": [
    "Ask residents what makes Alder Bend feel like home and they start listing people: the Ambassador who has their coffee ready, the neighbour who keeps a chair free at trivia, the Care Partner who knows just how they like their mornings.",
    "The apartments are lovely, but new residents rarely ring their families to talk about the kitchen. They talk about who they had lunch with, who roped them into Pinochle Club and who knocked to make sure they were coming to happy hour.",
    "Our team is part of those friendships, not watching from the side. Opal Merriweather and the Ambassadors greet residents by name every morning. Events & Adventures finds out what each newcomer enjoys and makes sure they hear about it. And Executive Director Renata Holloway really does keep her door open.",
    "Families notice too. Many tell us the moment they knew their parent had settled in was a call that began, “I can’t stay on long. I’m on my way out.”",
  ],
  "gather-around-the-table": [
    "There are three places to eat at Alder Bend: the Juniper Room with its tablecloths, the all-day Millpond Café and the Perch, our coffeehouse and wine bar. Behind all three is the same belief: a meal tastes better with company.",
    "Culinary Director Rafael Domingo builds every menu around what is in season. The Juniper Room’s dinner menu changes weekly, while Millpond Café keeps the easygoing California favorites going, from flapjacks in the morning to fish tacos at lunch. Once a month Rafael hosts Conversations with Chef, where residents taste new dishes and give him their honest verdict.",
    "Dining Experience Director Simone Archer makes sure the service lives up to the cooking. Her team learns residents’ names, usual tables and dietary needs, and books family lunches and private dinners in the Club Room.",
    "Still, the most important ingredient is the conversation. Every new resident is invited to join a table on their first evening, and it is often the longtime residents who do the inviting. Visiting families are always welcome at lunch, and every tour includes a meal in one of the restaurants.",
  ],
  "renata-named-executive-director-of-the-year": [
    "Congratulations to Executive Director Renata Holloway, named Executive Director of the Year by the Calder Valley Senior Care Council.",
    "The council gives the award each spring to a leader whose work has made a lasting difference to residents, families and staff across the Calder Valley. Nobody at Alder Bend was surprised. Renata keeps her door open, remembers the names of residents’ grandchildren and holds a Town Hall every month where any question gets a straight answer.",
    "Renata was quick to pass the praise along. “This is the team’s award,” she said. “It belongs to every director, every Care Partner and every Ambassador who comes in and makes this a place people are proud to live.”",
    "Do congratulate her when you see her in the Lobby, although she will most likely ask how you are doing first.",
  ],
  "a-great-place-to-work": [
    "We believe residents feel cared for when the people caring for them feel valued too. So looking after our team is part of the job, not an extra.",
    "That begins with solid basics: medical, dental and vision insurance, a 401(k) with a company match, 15 days’ PTO that grows after year four, and a free meal on every shift. It carries on with tuition assistance and paid training, so a Care Partner can work toward becoming a Med Tech and a Med Tech can work toward whatever comes next.",
    "Each month residents and colleagues nominate a Team Steward of the Month, and the nominations are some of the nicest reading we get. People write about a colleague who noticed a resident was unusually quiet, stayed on to finish a jigsaw, or learned someone’s favorite song on the piano.",
    "Team members bring their own talents to the calendar as well. Care Partner Talia taught a Paint and Sip class; others lead walks, swap recipes and come along on trips. When the work feels worthwhile and people feel valued, they stay, and residents get to see the same friendly faces year after year.",
    "If that sounds like somewhere you would like to work, we would love to hear from you.",
  ],
  "what-makes-an-amazing-community": [
    "Beautiful rooms bring people out of their apartments. The people they find there are what keep them coming back.",
    "We are proud of what we have built: the Perch, the Theatre, the Art Studio, the Fitness Center, the Living Room library and a courtyard with a fire table, grills and a cutting garden. Every one of them was designed to be used, not just admired on a tour.",
    "Still, a room is only as good as what goes on in it. Tuesday happy hour with a live band. The Friday Activity Meeting, where residents pick next week’s outings. A Bridge Club that has kept the same table for years and always finds room for one more player.",
    "That is why we put as much care into the calendar and the people as into the buildings. When you visit, look at the rooms, then look at who is using them. That will tell you more than any brochure.",
  ],
};

/** All published posts, newest first. Posts dated after today stay unpublished. */
export function publishedStories(todayIso: string): Story[] {
  return [...extraStories, ...stories].filter((s) => s.date <= todayIso).sort((a, b) => b.date.localeCompare(a.date));
}

/** Every post, including scheduled ones (article pages resolve by slug). */
export function findStory(slug: string): Story | undefined {
  return [...extraStories, ...stories].find((s) => s.slug === slug);
}

export const bodyOf = (s: Story) => articleBodies[s.slug] ?? s.body;
export const authorOf = (s: Story) => s.author ?? "Alder Bend";
