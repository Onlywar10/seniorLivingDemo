// Bruceville Point news: the long-form article bodies (keyed by story slug) plus helpers.
// Mirrors src/data/articles.ts (Prairie City Landing) export for export.
//
// SHAPE DIFFERENCES FROM src/data/articles.ts
// - Stories use the local `Story` from ./site, which adds an optional `link` to the original
//   post on brucevillepoint.com. `findStory` and `publishedStories` return that type.
// - `extraStories` is empty: every post comes from brucevillepoint.com/blog-events/ and lives
//   in ./site `stories`.
//
// SOURCES: every post is real. Titles and dates are from brucevillepoint.com (WordPress post
// dates). The bodies below are short retellings in our own words; anything in quotation
// marks is verbatim from the post and attributed as there. Read the full post at `link`.

import { newsKinds, storyDate } from "@/data/shared";
import { stories, type Story } from "./site";

export { newsKinds, storyDate };

/** Posts that sit alongside the stories in site.ts. */
export const extraStories: Story[] = [];

export const articleBodies: Record<string, string[]> = {
  "i-moved-here-to-thrive": [
    "If you have seen our Day in the Life video, you have met Linda: raising a glass with friends, arranging flowers, in the gym, at the salon, at the movies and around the fire pit in the evening. At our 5th Anniversary Party she was named the community’s social butterfly — and the video is a fair picture of her days.",
    "Linda was married to her best friend for 49 years. After he died, she found herself alone in a two-story house full of family heirlooms. “I realized that I wasn’t keeping those heirlooms. They were keeping me.”",
    "She could have downsized to a smaller house, but that felt like a smaller version of the same life. She wanted a livelier one, without the bills, the yard and the water heaters. “Having a full kitchen is nice because it’s an opportunity here, not an obligation,” she says. Most days she would rather eat with friends in the dining room, and if the gardening urge strikes, there is the community garden.",
    "Before she moved, Linda toured, then followed our Facebook page for a while to be sure the fun was real. It was. As she puts it: “I moved here to thrive instead of just survive.”",
  ],
  "engage-connect-celebrate-every-day": [
    "Editor’s note: this post was written by Liesl, a high school sophomore who spent several days with residents at Bruceville Point.",
    "Liesl spent her visit with the Events & Adventures team — Timothy Smith, the Events and Adventures Director; Monica Thayer, the Events and Adventures Assistant; and Tina Trillo, the Fitness Director — and quickly learned that residents always have something going on.",
    "The surprise favorite was Bingo. The team once shied away from it as too typical, but residents asked for it back, and now the weekly game fills the Bistro. As Monica called the numbers, Liesl felt the room hold its breath — and then cheer for every winner.",
    "Then Miss Tina asked Liesl to lead a fitness class. It turned out to be axe throwing. Her nerves lasted about a minute: every resident who stepped up got a cheer, whatever the throw. Her conclusion — friendly competition with good company is something everyone should have, at any age.",
  ],
  "finding-camaraderie-and-care": [
    "Bob, Bill and Lou have seen a lot of the world. Bill spent 20 years in the Air Force; Lou served in the Coast Guard; and it turns out both of them have been to Thule, Greenland. But many of their stories are about caring for their wives, children and grandchildren.",
    "Caregiving can be isolating. Bill recently moved his wife into Harbor, our memory care neighborhood, and has found friends who have walked the same road. “They understand what I’m going through. They understand what’s going on, and that has been a big help,” he says.",
    "Lou cared for his wife before losing her to cancer, and remembers how hard living alone was at first. What changed things was an invitation from the Events and Adventures Director of the time to join a card game. A little at a time, Lou came out of his apartment more. Today he paints, plays poker and gathers with friends around the community.",
    "Team members are there to support residents, but some of the strongest connections are between residents who have shared a similar journey.",
  ],
  "people-make-all-the-difference": [
    "Ask team members to describe working at Bruceville Point and you hear words like family, valued, appreciated and happy. Ask residents to describe the team and you hear family, kind, friendly and respectful. The overlap is the point.",
    "Beautiful buildings and good benefits matter, but they don’t make a great place to live or work on their own. Relationships do. “I just can’t say enough about the caregivers,” says Susan, a resident. “They’re not just doing a job. They’re friendly, they’re kind, they really care. It’s a happy place.”",
    "The team feels it too. “I look forward to seeing the residents every night,” says Amanda, our lead server. “It’s work, but it’s not work sometimes because it’s like talking to your family.”",
    "Annie Stauber, our Human Resources Generalist, connects it back to the Tenfold name and the line it comes from: “Each gives to each, and like the star, gets back its gift in tenfold pay.” As she puts it, “This sums up how we work.”",
  ],
  "shared-stories-bring-connection": [
    "Every resident brings a story with them. Spend a few minutes with someone in the Bistro and you’ll hear about resilience, love, learning and purpose — sometimes from long ago, sometimes from yesterday.",
    "Shirley and Leon, founders of Sobon Wine, are the kind of neighbours who sit at a table for four so they can invite others to join them. Shirley wasn’t sure about moving at first, but she has come round. “Having someone clean your apartment and do the sheets for you? I love it!” she says.",
    "With the housekeeping taken care of, they spend their time on what they enjoy: fitness classes, walks along the courtyard paths and, in Shirley’s case, two days a week at the family winery. As Leon says, “She makes the rules!”",
    "“This is just a positive place,” Shirley says. It is — because of people like Shirley and Leon.",
  ],
  "assistance-is-the-path-to-independence": [
    "Most of us shy away from offers of help, as if needing support were a failing. But a little help often keeps us going: “I can’t walk steadily” becomes “so I use a cane”, and suddenly we are moving again.",
    "The senior living world doesn’t help by dividing people into “independent” and “assisted”, as if one were better than the other. Nobody is truly independent. We all rely on teachers, friends, neighbours and colleagues all our lives.",
    "At Bruceville Point, assistance is a service, not a place. Residents in any apartment can add support at any time, starting small — a reminder about a class, an escort to get there — so they can keep doing more of what they want.",
  ],
  "deciding-when-to-move-to-senior-living": [
    "There is no single right time to move to senior living. But residents rarely tell us they moved too soon. Much more often we hear, “Why did I wait so long?”",
    "Waiting for a crisis means someone else may end up making the decision. Instead of asking what you want the next several years to look like, you are left asking where you can go tomorrow.",
    "So think about “need” broadly. Social connection, purpose and staying mobile are needs too. If your world seems to be shrinking, it may be the right time to look at a different way of living.",
    "Shirley, a resident, was against the idea at first: “I really didn’t want to come. I was against it, but I knew my husband was ready for it. After the third day, I thought, ‘This place is great!’”",
  ],
  "respect-defines-bruceville-point": [
    "Editor’s note: this post was written by Liesl, then a high school freshman, who spent several days visiting residents at Bruceville Point.",
    "Liesl came along on her mom’s work trip expecting to be a tag-along. On the first morning she stood awkwardly at the side of a meeting in the Club Room — until Monica walked over, introduced herself and shook her hand. By the end of the first hour, every team member had welcomed her.",
    "At an ice cream social that afternoon, she watched a resident, a Care Partner and the Events and Adventures Director tease each other about who was whose favorite, and thought it wasn’t so different from joking with her own friends.",
    "Her takeaway: older adults and young people both know how it feels to be overlooked. At Bruceville Point, she felt heard — and so, she saw, did the residents.",
  ],
  "home-for-the-holidays": [
    "Holiday visits can bring changes in an older relative into sharp focus. Change is part of life; how we respond is what matters. Here are five tips for the conversations that follow.",
    "Start early, and with curiosity: ask what they want the next ten, twenty or thirty years to look like. Don’t parent your parent — you will always be their child. Be honest about what you can and can’t take on.",
    "Ask questions rather than making statements, and keep it small. A few short, specific conversations go further than one big talk.",
  ],
  "welcoming-marianne-richardson": [
    "We are thrilled to welcome Marianne Richardson as Bruceville Point’s new Executive Director, taking over from Eric Hostetter.",
    "Marianne has led senior living communities for more than fifteen years, with a focus on mentoring team members and bringing people together. “I am excited to embrace and experience the Tenfold culture—the focus on community, connection, and engagement,” she said.",
    "Her favorite way to connect? “Laughter breaks down walls. I love being a goofball whenever I can.” She describes the job as coach, mentor, teacher and more — though not chef: “One hat I don’t wear is the chef’s hat—not one of my strengths!”",
    "Away from work you might find her camping along the coast or reading a World War II novel. Please say hello when you see her.",
  ],
  "doughnut-bread-pudding": [
    "How do you turn a room full of people into a party? With food. Each month Danyale, our Dining Experience Director, gives residents a cooking lesson, and this month it was Comfort Crumb Custard — doughnut bread pudding.",
    "Curious faces turned into wide smiles as the demonstration went from instructional to delicious. Danyale shared the recipe, which makes a very big batch: plain cake doughnuts soaked in hot milk with sugar, butter, eggs, vanilla and a pinch of pumpkin pie spice, baked in a water bath and finished with a warm vanilla cream sauce.",
    "The full recipe is in the original post. Make it, gather friends and family, and smile.",
  ],
  "care-centered-around-being-with": [
    "In some care settings, care is something done to people. At Bruceville Point we think of it as being with them: Care Partners get to know residents through conversation and shared interests, and the support they give grows out of that relationship.",
    "Care Partner Allison is a good example. When a resident admired Allison’s tattoo and said she wanted one before she died, Allison came in the next day with temporary tattoos. The Care Partners put them on, then went to the resident’s apartment and gave her one too.",
    "It was a small thing and a big one. Together we share laughter and tears, and we are all richer for it.",
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
export const authorOf = (s: Story) => s.author ?? "Bruceville Point";
