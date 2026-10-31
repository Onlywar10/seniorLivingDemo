// Kestrel Point news: the long-form article bodies (keyed by story slug) plus helpers.
// Mirrors the Alder Bend articles module export for export. Fictional example content: the
// residents, team members and events in these posts are invented.
//
// SHAPE DIFFERENCES FROM THE ALDER BEND MODULE
// - Stories use the local `Story` from ./site, which adds an optional `link` (the post's
//   permalink on kestrelpoint.example). `findStory` and `publishedStories` return that type.
// - `extraStories` is empty: every post lives in ./site `stories`.

import { newsKinds, storyDate } from "@/data/shared";
import { stories, type Story } from "./site";

export { newsKinds, storyDate };

/** Posts that sit alongside the stories in site.ts. */
export const extraStories: Story[] = [];

export const articleBodies: Record<string, string[]> = {
  "i-moved-here-to-thrive": [
    "Doreen spent thirty-one years as a school librarian in Rivermead. When she retired, she stayed on in the house she and her husband had bought in their twenties, until the stairs, the gutters and the empty evenings began to add up.",
    "“Everyone told me to downsize,” she says. “But I didn’t want a smaller version of the same quiet life. I wanted more going on, not less.”",
    "She moved into a one-bedroom at Kestrel Point and brought six boxes of books. Two of them ended up on a spare shelf in the Bistro with a hand-lettered sign: take one, bring one back when you can. Within a month the shelf was full, then overflowing, and Ray’s team built her a proper bookcase.",
    "Now Doreen runs a Thursday book swap, reads aloud to visiting grandchildren on Saturday mornings and has signed up for the Paint and Sip, which she swears she is terrible at. “I didn’t move here to slow down,” she says. “I moved here to have time for the good parts.”",
  ],
  "engage-connect-celebrate-every-day": [
    "Editor’s note: this post was written by Margot, a high school junior from Rivermead who volunteered with the Events & Adventures team for a week this summer.",
    "I thought I would be handing out programs and stacking chairs. On my first morning, Grant Ellison, the Events and Adventures Director, handed me a clipboard and said, “You’re running the cribbage table.” I had never played cribbage.",
    "A resident named Harriet taught me in about ten minutes and then beat me four games in a row. By Wednesday I had won one, and the whole table clapped. Nobody let me forget it for the rest of the week.",
    "On Friday, Callie Brooks and Kara Lindqvist set up the Courtyard Games: ring toss, a beanbag throw and a putting course made from pool noodles. My job was keeping score, which turned out to be the most important job there, because everyone wanted a recount.",
    "What I learned is that a little friendly competition makes people feel alive at any age. I am going back at winter break. Harriet says she will go easy on me. I don’t believe her.",
  ],
  "finding-camaraderie-and-care": [
    "Walt taught high school wood shop for thirty years. Desmond drove long-haul trucks across the West. Gene carried mail on the same Rivermead route for almost as long. They might never have met, except that each of them spent years caring for his wife at home.",
    "“You don’t realize how alone you’ve become until somebody asks how you’re doing and actually waits for the answer,” says Desmond, whose wife now lives in Lantern, our memory care neighborhood. He visits her every afternoon, and every morning he has coffee with Walt and Gene.",
    "It started with a bocce game. Gene had lost his wife the year before and rarely left his apartment. Walt, who had been through the same thing, talked him into joining a match on the courtyard court. Desmond was the third player they needed. They have kept the same table in Meadowbrook Cafe every Thursday since.",
    "Our team is here to support residents through hard seasons, but some of the best support comes from neighbors who have walked the same road. As Walt puts it: “We don’t have to explain anything to each other. That’s the gift.”",
  ],
  "people-make-all-the-difference": [
    "Ask residents to describe the people who work at Kestrel Point and you hear words like warm, patient and funny. Ask team members about the residents and you hear almost the same words. That isn’t a coincidence.",
    "Good buildings and good benefits matter, but on their own they don’t make a good place to live or to work. People do. “The Care Partners notice everything,” says Corinne, a resident. “If I’m quiet at breakfast, somebody checks on me by lunch. That’s not a job description. That’s just who they are.”",
    "The team feels it from the other side. “I’ve worked in restaurants where nobody knew my name,” says Priya, one of our servers. “Here, the residents ask about my exams and remember my sister’s birthday.”",
    "Dana, our Human Resources Generalist, says that is what she looks for when she hires. “We can teach someone the job. What we can’t teach is caring about the person in front of you. That’s the part that makes this place work.”",
  ],
  "shared-stories-bring-connection": [
    "Every resident arrives with a lifetime of stories. Sit down with someone in the Bistro and you might hear about a first job, a long marriage, a lucky escape or something that happened just last week.",
    "Marguerite and Sol ran a small bakery in Calder for forty years. Sol’s alarm went off at 4 am six days a week; Marguerite did the books and the wedding cakes. Their sourdough starter, which still lives in their refrigerator, is older than both of their children.",
    "At dinner they always ask for a table for four, so there are two empty chairs for whoever wants them. “Every meal here is a chance to meet somebody new,” Marguerite says. Sol has taught three neighbors to bake bread so far, and the Juniper Room kitchen has asked to borrow some of the starter.",
    "With housekeeping and maintenance taken care of, they spend their time on what they love: the morning stretch class, slow laps of the courtyard and, for Sol, the occasional Saturday back at the old bakery, which a former apprentice now runs.",
  ],
  "assistance-is-the-path-to-independence": [
    "Most of us push help away, as if needing it means we have failed. But the right support is often what keeps us going. Glasses let us read. A railing gets us down the steps. A reminder means the pill gets taken and the day goes on.",
    "Senior living doesn’t always help, with its tidy labels of “independent” and “assisted”, as though one were a better kind of person. In truth nobody is fully independent. All of us lean on someone, every day of our lives.",
    "Harriet, a resident, resisted any help for her first year. When she finally agreed to medication reminders and an escort to her watercolor class on bad-knee days, she was surprised. “I thought I was giving something up,” she says. “Instead I got my Tuesdays back.”",
    "At Kestrel Point, help is a service that comes to you, not a place you have to move to. Residents in any apartment can start small and add more when they want it, so they can keep doing the things that matter to them.",
  ],
  "deciding-when-to-move-to-senior-living": [
    "Nobody can tell you the perfect day to move to senior living. But we can tell you what residents say once they are here, and it is almost never “I came too early”. Much more often it is “I wish I had done this sooner.”",
    "Waiting for a fall or a hospital stay to force the issue means the decision may not be yours. Instead of asking what you want the next ten years to look like, your family ends up asking which community has an opening this week.",
    "It helps to think about need in a wider way. Company, purpose and staying active are needs too. If the days have started to feel smaller, with fewer visitors, fewer outings and more time alone, that is worth paying attention to.",
    "Rosemary, a resident, put off touring for two years. “I kept saying, maybe next spring,” she says. “Then I came to lunch with a friend who lived here, stayed for the trivia and drove home thinking, what exactly am I waiting for?”",
  ],
  "respect-defines-kestrel-point": [
    "Editor’s note: this post was written by Margot, then a high school freshman, who visited Kestrel Point to record residents’ stories for a school oral-history project.",
    "I showed up with a borrowed recorder and a list of twelve questions. I was nervous that people would think a ninth grader asking about their lives was strange. The first resident I met, a retired nurse named Lorna, pulled out a chair for me and said, “Finally, someone who wants to hear the long version.”",
    "Over three afternoons I recorded seven people. One had driven a school bus for thirty years, one had sung in a band, and one had met her husband at a county fair dance. Every one of them asked me questions back: what I liked at school, what I wanted to do, what I thought about the world.",
    "Older people and teenagers both know what it feels like when people talk past you. At Kestrel Point, I didn’t feel that once. I felt listened to, and I could see the residents did too. I got an A on the project, but that wasn’t the best part.",
  ],
  "home-for-the-holidays": [
    "Holiday visits can bring changes in an older relative into focus: a messier kitchen, a missed bill, a story told twice. Change is a normal part of aging. What matters is how we talk about it. Here are five ideas for those conversations.",
    "Notice, but don’t diagnose. Share what you saw, simply and kindly, and leave the conclusions to doctors. Ask before you tell: “How are things going with the house?” opens more doors than “You can’t manage the house.”",
    "Share the load. Bring siblings and other family into the conversation so it doesn’t rest on one person. Then plan the next talk instead of trying to settle everything in one sitting.",
    "Above all, keep the visit a happy one. The holidays are for being together. A short, warm conversation now is worth more than a long, tense one, and it leaves the door open for the next.",
  ],
  "welcoming-joanna-kessel": [
    "We are delighted to welcome Joanna Kessel as Kestrel Point’s new Executive Director.",
    "Joanna’s first job in senior living was waiting tables in a community dining room while she was in college. She expected it to last a semester. Instead she moved on to activities, then to resident services, and has led communities in the Calder Valley for most of her career.",
    "“If you want to know how a place is doing, ask the residents at lunch,” she says, and she means it: expect to see her in Meadowbrook Cafe most days, asking what is working and what isn’t. She calls herself a coach, a listener and a problem-solver, though not a cook: “Nobody wants my cooking. Trust me.”",
    "Away from work, Joanna kayaks the Calder River, grows far too many tomatoes and enters a pie contest every summer, which she has never won. Please stop and say hello when you see her.",
  ],
  "doughnut-bread-pudding": [
    "What turns a room full of people into a party? Food, every time. Once a month Celeste, our Dining Experience Director, teaches residents a recipe, and this month she brought a tray of day-old doughnuts.",
    "There were a few raised eyebrows at first. Then the smell of warm vanilla and spice filled Meadowbrook Cafe, and by the time the pudding came out of the oven, there was a line for second helpings.",
    "To make it at home: tear a dozen plain cake doughnuts into pieces and spread them in a buttered baking dish. Whisk four eggs with two cups of warm milk, half a cup of sugar, a teaspoon of vanilla and a pinch of cinnamon and nutmeg, and pour it over. Let it soak for twenty minutes, then bake at 350°F for about 45 minutes, until set and golden.",
    "Celeste serves it with a warm vanilla sauce. Make it for a crowd, share it with people you love, and save the last piece for yourself.",
  ],
  "care-centered-around-being-with": [
    "In some places, care is a list of tasks done to people. At Kestrel Point we think of it as being with them. Care Partners get to know residents through conversation and shared interests, and the support they give grows out of that relationship.",
    "Rosa, one of our Care Partners, noticed that a resident she helped each morning hummed waltzes while she got ready. It turned out she had danced every Saturday night for fifty years, and hadn’t since her husband died.",
    "The next week Rosa brought in a small speaker. With two other Care Partners, she cleared the hallway outside the resident’s apartment, put on a Strauss waltz and asked her for a dance. Neighbors came out of their doors to watch, and a few joined in.",
    "It was a small thing and a big one. That is what care looks like here: sharing laughter, music and the occasional tear, and all of us better for it.",
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
export const authorOf = (s: Story) => s.author ?? "Kestrel Point";
