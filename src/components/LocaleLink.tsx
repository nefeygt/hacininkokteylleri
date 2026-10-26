"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "./LocaleProvider";

/**
 * next/link in the page's language (ADR-032): "/cocktails" becomes "/en/cocktails" on an English page.
 * Use it for every link inside the site; external links, anchors and object hrefs pass unchanged.
 */
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { href: localize } = useLocale();
  return <Link href={typeof href === "string" ? localize(href) : href} {...props} />;
}
