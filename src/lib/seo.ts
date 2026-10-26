import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localePath, OG_LOCALES, PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales";

/** Open Graph's base object in a language. */
export function openGraphBase(lang: Locale = DEFAULT_LOCALE) {
  return { siteName: BRAND, locale: OG_LOCALES[lang], type: "website" } satisfies Metadata["openGraph"];
}

// A page's openGraph replaces the root layout's whole object, so every page that sets one starts here.
export const OPEN_GRAPH_BASE = openGraphBase();

/**
 * The canonical address of a page in a language and, once more than one language is published, its
 * hreflang alternates (ADR-032). `path` is the Turkish, unprefixed path ("/cocktails").
 */
export function alternatesFor(lang: Locale, path: string): Metadata["alternates"] {
  const canonical = localePath(lang, path);
  if (PUBLISHED_LOCALES.length < 2) return { canonical };
  const languages: Record<string, string> = { "x-default": path };
  for (const l of PUBLISHED_LOCALES) languages[l] = localePath(l, path);
  return { canonical, languages };
}

/** The share image of a recipe page: its photo, else the generated card under /og (in the page's language). */
export function recipeOpenGraph(path: string, imageUrl?: string, lang: Locale = DEFAULT_LOCALE): Metadata["openGraph"] {
  const card = lang === DEFAULT_LOCALE ? `/og${path}` : `/og${path}?lang=${lang}`;
  return { ...openGraphBase(lang), url: localePath(lang, path), images: [imageUrl ?? card] };
}
