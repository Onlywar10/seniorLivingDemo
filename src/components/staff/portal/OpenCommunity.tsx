"use client";

// Opens one community from the "All communities" view: sets the staff community and rebuilds the screen.
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { STAFF_COOKIE } from "@/data/staff/shared";
import type { CommunitySlug } from "@/lib/sites";

export function OpenCommunity({ slug, name }: { slug: CommunitySlug; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="sx-btn sx-btn-sm"
      aria-busy={pending || undefined}
      aria-label={`Open ${name}`}
      onClick={() => {
        document.cookie = `${STAFF_COOKIE}=${slug}; path=/; max-age=31536000; samesite=lax`;
        start(() => router.refresh());
      }}
    >
      {pending ? "Opening…" : "Open"}
    </button>
  );
}
