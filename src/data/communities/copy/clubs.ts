// Clubs & groups (src/app/[community]/clubs): what each club does, who runs it and how to join. When it meets and its
// next dates come from the calendar (events whose title matches `match`), so the page never disagrees with it.
// Residents who run a club are never named here; staff and volunteer leaders are, as on the team page.
import type { CommunitySlug } from "@/lib/sites";

export interface Club {
  slug: string;
  name: string;
  /** Calendar titles that belong to this club. */
  match: RegExp;
  what: string;
  runBy: string;
  join: string;
  photo: string;
  /** Families are welcome too. */
  families?: boolean;
}

const COME = "Just come along. To hear about it each week, reply YES to the invite text.";

export const clubs: Record<CommunitySlug, Club[]> = {
  "alder-bend": [
    { slug: "petal-pushers", name: "Petal Pushers Flower Club", match: /^Petal Pushers/, photo: "/img/couple-flowers.jpg", what: "Residents arrange seasonal flowers into centerpieces for the dining rooms and the Lobby. The club brings the flowers, the vases and plenty of advice.", runBy: "Run by residents, with the Events & Adventures team", join: COME },
    { slug: "switch-bowling", name: "Switch Bowling leagues", match: /^Switch Bowling/, photo: "/img/theatre.jpg", what: "Two four-player teams, “The Cool Chicks” and “The Lucky Strikes”, bowl on the big screen in the Theater while the armchairs cheer them on.", runBy: "Run by the team captains, who are residents", join: "Each team has four places. Reply YES to the invite text to go on the reserve list, or just come and cheer." },
    { slug: "gardening", name: "Gardening Club", match: /^Gardening Club/, photo: "/img/gardening.jpg", what: "Planting, watering and picking in the raised beds of the Lantern Courtyard, at a gentle pace.", runBy: "Led by the Lantern team", join: "Lantern residents are invited by the team. Families are welcome to join in on a visit.", families: true },
    { slug: "bible-study", name: "Bible Study", match: /^Bible Study/, photo: "/img/lounge.jpg", what: "A friendly weekly study and conversation, open to every faith and none.", runBy: "Run by residents", join: COME },
    { slug: "brain-busters", name: "Brain Busters with Ava", match: /^Brain Busters/, photo: "/img/friends-laugh.jpg", what: "Puzzles, riddles and memory games to keep the mind nimble, with plenty of laughs.", runBy: "Led by Ava, a visiting instructor", join: COME },
    { slug: "book-club", name: "Book Club", match: /^Book Club/, photo: "/img/living-room.jpg", what: "One book a month, chosen by the group, and a lively conversation over coffee.", runBy: "Run by residents", join: "Ask at the front desk for this month’s book, then come along." },
    { slug: "bridge", name: "Bridge Club", match: /^Bridge Club/, photo: "/img/club-room.jpg", what: "Social bridge most weeks. Partners can be found on the day.", runBy: "Run by residents", join: "Just come along. New players are paired with an experienced partner." },
    { slug: "knitting", name: "Knitting Club", match: /^Knitting Club/, photo: "/img/hands.jpg", what: "Knitting and crochet for charity and for the grandchildren, with spare yarn and needles to borrow.", runBy: "Run by residents", join: COME },
    { slug: "cards", name: "Card clubs", match: /^(Hand & Foot|Pinochle|Poker Club|Pegs & Jokers|Card Game 65)/, photo: "/img/club-room.jpg", what: "Hand & Foot, Pinochle, Poker, Pegs & Jokers and more, most days of the week.", runBy: "Run by residents", join: "Just come along. Someone will teach you the rules." },
    { slug: "word-games", name: "Word games", match: /^(Scrabble Club|Wordle|Word in a Word)/, photo: "/img/coffee-woman.jpg", what: "Scrabble, the group crossword and Wordle, with dictionaries close at hand.", runBy: "Run by residents", join: COME },
    { slug: "trivia", name: "Trivia with Nora", match: /^Trivia with Nora/, photo: "/img/theatre.jpg", what: "Team trivia in the Theater, with prizes for the winners and for the best wrong answer.", runBy: "Led by Nora Castellano, Events & Adventures Director", join: "Just come along. Teams form on the day." },
  ],
  "kestrel-point": [
    { slug: "garden-club", name: "Garden Club", match: /^Garden Club/, photo: "/img/gardening.jpg", what: "Planting and tending the courtyard’s raised beds and cutting garden.", runBy: "Run by residents", join: "Just come along. Gloves and tools are provided." },
    { slug: "paint-and-sip", name: "Paint and Sip", match: /^Paint and Sip/, photo: "/img/art-studio.jpg", what: "Our monthly favorite: a guided painting, a glass of something, and nobody judging.", runBy: "Led by the Events & Adventures team", join: "Residents reply YES to the invite text. Families are welcome: reply to your text to RSVP.", families: true },
    { slug: "ceramics", name: "Ceramics Open Studio", match: /^Ceramics Open Studio/, photo: "/img/art-studio.jpg", what: "Hand-building and glazing in the studio, with clay and tools ready to go.", runBy: "Run by residents", join: COME },
    { slug: "bible-study", name: "Bible Study", match: /^Bible Study/, photo: "/img/lounge.jpg", what: "A friendly weekly study and conversation, open to every faith and none.", runBy: "Run by residents", join: COME },
    { slug: "brain-games", name: "Brain Games", match: /^Brain Games/, photo: "/img/friends-laugh.jpg", what: "Puzzles, riddles and memory games to keep the mind nimble, with plenty of laughs.", runBy: "Led by Callie Brooks, Events and Adventures Assistant", join: COME },
    { slug: "book-club", name: "Book Club", match: /^Book Club/, photo: "/img/living-room.jpg", what: "One book a month, chosen by the group, and a lively conversation over coffee.", runBy: "Run by residents", join: "Ask at the front desk for this month’s book, then come along." },
    { slug: "bridge", name: "Bridge Club", match: /^Bridge Club/, photo: "/img/club-room.jpg", what: "Social bridge most weeks. Partners can be found on the day.", runBy: "Run by residents", join: "Just come along. New players are paired with an experienced partner." },
    { slug: "dominoes", name: "Mexican Train Dominoes", match: /^Mexican Train/, photo: "/img/club-room.jpg", what: "The table that laughs the loudest. Easy to learn in one round.", runBy: "Run by residents", join: COME },
    { slug: "cards", name: "Card clubs", match: /^(Hand & Foot|Pinochle|Poker Club|Card Games)/, photo: "/img/club-room.jpg", what: "Hand & Foot, Pinochle, Poker and more, most days of the week.", runBy: "Run by residents", join: "Just come along. Someone will teach you the rules." },
    { slug: "word-games", name: "Word games", match: /^(Scrabble Club|Group Crossword|Word Games)/, photo: "/img/coffee-woman.jpg", what: "Scrabble, the group crossword and word puzzles, with dictionaries close at hand.", runBy: "Run by residents", join: COME },
    { slug: "trivia", name: "Morning Trivia", match: /^Morning Trivia/, photo: "/img/theatre.jpg", what: "Team trivia to start the day, with prizes for the winners and for the best wrong answer.", runBy: "Led by Grant Ellison, Events and Adventures Director", join: "Just come along. Teams form on the day." },
  ],
};
