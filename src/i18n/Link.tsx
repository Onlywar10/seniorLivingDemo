"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useT } from "./client";

/** next/link that keeps the visitor in their language: href="/dining" goes to /zh/dining on Chinese pages. */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { href: localize } = useT();
  const to = typeof href === "string" ? localize(href) : href.pathname ? { ...href, pathname: localize(href.pathname) } : href;
  return <NextLink href={to} {...props} />;
}
