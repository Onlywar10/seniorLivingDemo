// News: the long-form article bodies (keyed by story slug) plus the newest posts.
import { stories, type Story } from "@/data/site";

export const newsKinds: Story["kind"][] = ["Events & Adventures", "News", "Dining", "Wellness", "Careers"];

/** Posts that sit alongside the stories in site.ts. */
export const extraStories: Story[] = [
  {
    slug: "halloween-pumpkin-creations",
    kind: "Events & Adventures",
    title: "Our Halloween Pumpkin Creations",
    dek: "Carving knives, paintbrushes and a lot of laughter in the courtyard. See what residents made this year.",
    date: "2026-10-30",
    photo: "/img/pumpkins.jpg",
    alt: "A row of carved and painted pumpkins",
    body: [],
  },
  {
    slug: "honoring-our-veterans-november-11",
    kind: "News",
    title: "Honoring Our Veterans on November 11",
    dek: "A morning at the parade, a Veterans’ Lunch in Natoma Café and a ceremony for veterans and their families.",
    date: "2026-10-26",
    photo: "/img/flag.jpg",
    alt: "An American flag flying against a blue sky",
    body: [],
  },
];

export const articleBodies: Record<string, string[]> = {
  "halloween-pumpkin-creations": [
    "Every October the courtyard turns into a pumpkin workshop, and this year was our busiest yet. On Wednesday afternoon residents pulled up chairs around the fire table, rolled up their sleeves and got to work — some with a sketch drawn on beforehand, some with nothing but confidence.",
    "We saw cats, owls, a very convincing haunted house, two portraits of Thor, and one pumpkin carved with the Folsom Bulldogs logo in honor of our neighbours at Folsom High School. The Events & Adventures team handled the heavy scooping, and the Rendezvous kept the cider coming.",
    "On Thursday morning it was Harbor’s turn. Harbor residents painted their pumpkins in the Harbor courtyard, choosing their own colors and patterns. Several of them asked for their pumpkin to be placed by the front door so visiting families would see it first.",
    "The finished creations lined the Lobby for Halloween Happy Hour on Friday, and we shared the full gallery on our Facebook page. Thank you to everyone who voted for a favorite — and to the grandkids who came back on Saturday for the Trick-or-Treat Hallway.",
  ],
  "honoring-our-veterans-november-11": [
    "Many of our residents served in the Army, Navy, Marines, Air Force and Coast Guard, and many more are spouses, children and parents of those who did. On Veterans Day we set aside the whole day to say thank you.",
    "The day starts early: our bus leaves the Lobby at 7:30 am for the Veterans Day Parade. Seats are limited to 18, so please sign up at the front desk or with Toni in Events & Adventures. Blankets and coffee will be on board.",
    "At 11:00 am, Natoma Café hosts the Veterans’ Lunch for every resident veteran and a guest. At 2:00 pm, the Theatre is reserved for a Veterans’ & Families Only Ceremony, with the reading of names and branches of service. Families are warmly invited — please let us know you are coming so we can save you a seat.",
    "If you or your parent is a wartime veteran, it is worth asking about the VA Aid and Attendance benefit, which can help pay for senior living. Our free guide explains how it works, and Cynthia Bazin is always happy to talk it through.",
  ],
  "walk-to-end-alzheimers": [
    "The week before the Walk to End Alzheimer’s, Harbor’s activity room smelled like rubber bands and dye. Harbor residents tie-dyed their own walk shirts in every color of the rainbow — no two alike — and hung them in the courtyard to dry in the October sun.",
    "On walk day, families, Care Partners and residents set off together as one team. Some walked the full route; some cheered from the shade with lemonade and a stack of handmade signs. A few grandchildren took turns pushing wheelchairs and set the pace for everyone else.",
    "For Harbor Memory Care Director Janelle Zweber, the walk is about more than fundraising. “Our residents aren’t just the reason we walk,” she said. “They walk with us. That’s the point.”",
    "Thank you to every family member who joined us, and to the team members who came in on their day off. The shirts are back in residents’ closets now — and more than one has already been worn to happy hour.",
  ],
  "paint-and-sip-with-cassandra": [
    "Cassandra has spent her career as a med tech, and many residents know her best from the medication cart. What they didn’t know until this autumn is that she is also studying design at Sacramento State.",
    "When she mentioned it to Toni Glenn, our Events & Adventures Director, the answer was immediate: teach a class. A few weeks later the Art Studio was set up with easels, canvases and a glass of wine (or sparkling cider) at every seat.",
    "Cassandra walked the group through a simple autumn landscape step by step — the sky first, then the hills, then a single oak tree. Nobody’s tree looked quite like anybody else’s, which was exactly the idea. There was a lot of laughter, a little paint on sleeves, and real pride when the canvases came off the easels.",
    "The finished paintings lined the hallway outside the Art Studio for a week. It is one of our favorite things about this community: the people who care for you have talents of their own, and they love to share them.",
  ],
  "gold-bug-mine": [
    "Some trips are about a good lunch and a scenic drive. This one was about going underground. Our bus headed up the hill to Gold Bug Park in Placerville, home to a real hard-rock gold mine from the Gold Rush era.",
    "Residents put on hard hats, switched on their lights and walked into the mine, where the guide showed us the quartz veins the miners followed by hand and candlelight. A few residents remembered visiting as children; others had driven past for decades and never stopped.",
    "Back in the sunshine, the group explored the stamp mill and the creekside trail before lunch in town. The ride home was quiet in the way that only a really good day out can be.",
    "It is exactly the kind of can-do adventure Events & Adventures is about — from everyday enjoyment to once-in-a-lifetime bucket list items. If there is somewhere you’ve always wanted to go, tell Toni at the Friday Activity Meeting. That is how most of our best trips begin.",
  ],
  "social-fitness": [
    "Ask Fitness Director Jason Cherry for the secret to staying active after 70 and he won’t name an exercise. He’ll name a friend. “People keep moving when they move together,” he says. “The workout matters. Who you do it with matters more.”",
    "Jason is full-time on site and teaches more than 25 classes a week, from Better Balance and Resistance Bands to Circuit Playground and Stretch Breathe Relax in Harbor. Each one is built to be as social as it is physical. Classes start with names, end with conversation, and in between there is usually a song everyone knows.",
    "That idea, which Jason calls social fitness, shows up everywhere. The Monday nature walks are as much about the chat on the trail as the steps. The monthly Healthy Happy Hour mixes music, nutritious snacks and a little choreography. Residents who arrive saying they ‘don’t do exercise’ often find they come for the company and stay for the class.",
    "The research backs him up: regular movement and strong social ties both support balance, mood and memory as we age, and they reinforce each other. Residents describe it more simply. “I come because Jason expects me,” one Better Balance regular told us. “And because my friends will ask where I was.”",
    "Curious? Every class on the calendar is open to residents, and visitors on a tour are welcome to drop in and watch. Jason will probably invite you to join.",
  ],
  "relationships-make-prairie-city-landing-home": [
    "Ask any resident what makes Prairie City Landing feel like home and you will hear names: the Ambassador who remembers your coffee order, the neighbour who saves you a seat at trivia, the Care Partner who knows exactly how you like your morning to start.",
    "Apartments matter, and ours are beautiful. But a new resident rarely tells their family about the countertops. They tell them who they sat with at lunch, who invited them to Pinochle Club, and who knocked on the door to check they were coming to happy hour.",
    "Our team is part of that web of relationships, not outside it. Shirley Richard and the Ambassador team greet residents by name every morning. The Events & Adventures team learns what each new resident loves and makes sure they hear about it. And Executive Director Cheryl Martin’s door really is open.",
    "Families feel it too. Many tell us that the first sign their parent had settled in was a phone call that started, “I can’t talk long — I’m on my way to something.”",
  ],
  "gather-around-the-table": [
    "Prairie City Landing has three places to eat — the white-tablecloth Cypress Room, the all-day Natoma Café and the Rendezvous coffeehouse and wine bar — and one idea behind all of them: good food is better shared.",
    "Culinary Director Conrad Caguimbal designs every menu around the season. The Cypress Room’s farm-to-table dinner menu changes every week, while Natoma Café keeps the California comfort food coming from breakfast flapjacks to fish tacos. Each month Conrad hosts Conversations with Chef, where residents taste what’s next and tell him exactly what they think.",
    "Dining Experience Director Mickei Butler makes sure the experience matches the food. Her team learns residents’ names, favorite tables and dietary needs, and takes reservations for family lunches and private dinners in the Club Room.",
    "The real ingredient, though, is the conversation. New residents are invited to join a table on their first night, and long-time residents are often the ones doing the inviting. Families visiting for lunch are always welcome, and a meal in one of our restaurants is part of every tour.",
  ],
  "cheryl-receives-outstanding-executive-director-award": [
    "Congratulations to Executive Director Cheryl Martin, recipient of the California Assisted Living Association’s Outstanding Executive Director Award.",
    "The award recognizes executive directors whose leadership makes a lasting difference for residents, families and team members. Residents who know Cheryl won’t be surprised: her door is open, she knows the names of residents and their grandchildren, and she hosts a monthly Town Hall where residents ask anything and get straight answers.",
    "Cheryl is quick to share the credit. “This belongs to our team,” she said. “Every department director, every Care Partner and every Ambassador who shows up and makes this a place people are proud to call home.”",
    "Please join us in congratulating Cheryl the next time you see her in the Lobby — though she will probably ask you how you are first.",
  ],
  "a-great-place-to-work": [
    "Our purpose includes our team: we are driven to create communities where team members are seen and appreciated. We believe residents feel cared for when the people caring for them feel the same way.",
    "That starts with the basics done well — medical, dental and vision insurance, a 401(k) with company match, 15 days’ PTO that grows after year four, and a free meal every day you work. It continues with tuition assistance and paid professional development, so a Care Partner who wants to become a Med Tech, or a Med Tech who wants to study design, has a path to get there.",
    "Every month residents and colleagues nominate a Team Steward of the Month. The nominations are some of the best things we read all month: notes about a team member who noticed a resident seemed quiet, stayed late to finish a puzzle, or learned a favorite song on the piano.",
    "Team members also bring their own talents to the calendar. Care Partner Cassandra taught a Paint and Sip class; others lead walks, share recipes and join residents on trips. When work is meaningful and people are appreciated, they stay — and residents get to know the same faces year after year.",
    "If that sounds like the kind of place you want to work, we would love to hear from you.",
  ],
  "what-makes-an-amazing-community": [
    "Amazing spaces get people out of their apartments. Amazing people make them want to stay.",
    "We are proud of our spaces: the Rendezvous coffeehouse and wine bar, the Theatre, the Art Studio, the Fitness Center, the Living Room library and a courtyard with a fire table, barbecues and a cutting garden. Each one was designed for something to happen in it, not just to look nice on a tour.",
    "But a room is only as good as what happens there. A Tuesday happy hour with live music. A Friday Activity Meeting where residents decide next week’s trips. A Bridge Club that has had the same table for years and always makes room for one more.",
    "That is why we spend as much time on the calendar and the people as we do on the buildings. When you visit, look at the spaces — then look at who is in them. That will tell you more than any brochure.",
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
export const authorOf = (s: Story) => s.author ?? "Prairie City Landing";

/** "October 30, 2026" */
export function storyDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[m - 1]} ${d}, ${y}`;
}
