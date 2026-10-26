// The site's languages (ADR-032). Turkish is the source and lives at the root ("/cocktails"); every other
// language has a prefix ("/en/cocktails"). A language is built once it is in LOCALES and has a dictionary;
// it is served (routes, sitemap, switcher) once it is in PUBLISHED_LOCALES. Browser- and app-safe.

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tr";

/** The languages visitors reach (English since 2026-10-26); a new one joins once its dictionary and content are complete. */
export const PUBLISHED_LOCALES: readonly Locale[] = ["tr", "en"];

/** Each language in its own words, for the switcher. */
export const LOCALE_NAMES: Record<Locale, string> = { tr: "Türkçe", en: "English" };

/** Open Graph's locale tag per language. */
export const OG_LOCALES: Record<Locale, string> = { tr: "tr_TR", en: "en_US" };

/** BCP 47 tags for Intl (dates, numbers) and <html lang>. */
export const INTL_LOCALES: Record<Locale, string> = { tr: "tr-TR", en: "en-US" };

export function isLocale(value: string | null | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? "");
}

/** A route's `lang` segment as a language; anything unknown reads as Turkish (the layout 404s those first). */
export function asLocale(value: string): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function isPublished(locale: Locale): boolean {
  return PUBLISHED_LOCALES.includes(locale);
}

/** "/cocktails" in a language: unchanged for Turkish, "/en/cocktails" for English. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//")) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The language of a visible path and the path without its prefix: "/en/feed" → en, "/feed". */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const first = pathname.split("/")[1];
  if (first !== DEFAULT_LOCALE && isLocale(first)) {
    return { locale: first, path: pathname.slice(first.length + 1) || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}
