import { notFound } from "next/navigation";

/** Any unknown address inside a community gets that community's own 404 (src/app/[community]/not-found.tsx). */
export default function UnknownCommunityPage() {
  notFound();
}
