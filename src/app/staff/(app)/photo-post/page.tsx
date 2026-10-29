import type { Metadata } from "next";
import { PhotoPost } from "@/components/staff/PhotoPost";
import { PageHead } from "@/components/staff/ui";
import { community, residentsInPhotos } from "@/data/staff";

export const metadata: Metadata = { title: "Photo post" };

const presets = [
  {
    k: "pumpkins", src: "/img/pumpkins.jpg", label: "Pumpkin carving",
    title: "Pumpkin carving in the Courtyard",
    caption: "Our residents brought their best ideas to the Courtyard for pumpkin carving this afternoon. Vote for your favorite on Facebook on Friday!",
    people: residentsInPhotos.pumpkins,
  },
  {
    k: "flag", src: "/img/flag.jpg", label: "Veterans Day ceremony",
    title: "Honoring our veterans",
    caption: "Thank you to every veteran who calls Prairie City Landing home. Families joined us for a ceremony in the theater and lunch in Natoma Café.",
    people: residentsInPhotos.flag,
  },
  {
    k: "marshmallows", src: "/img/marshmallows.jpg", label: "Roasted marshmallows",
    title: "Roasted marshmallows and camp stories",
    caption: "Golden-brown (and a few on fire) marshmallows around the fire table, with camp stories from residents who grew up in the Sierra foothills.",
    people: residentsInPhotos.marshmallows,
  },
];

export default function PhotoPostPage() {
  return (
    <>
      <PageHead title="Photo post" sub="Take a photo on your phone, and it becomes a news post, a family update and a Facebook post in one step." />
      <PhotoPost presets={presets} families={community.families} />
    </>
  );
}
