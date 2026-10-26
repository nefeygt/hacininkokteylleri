import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/locales";

// The panel edits house content in every built language besides Turkish (ADR-032). The panel itself stays
// Turkish, so each language has Turkish names here: a new language in LOCALES needs an entry in both maps below.

export const TRANSLATED_LOCALES = LOCALES.filter((l) => l !== DEFAULT_LOCALE) as Exclude<Locale, "tr">[];
export type TranslatedLocale = (typeof TRANSLATED_LOCALES)[number];

export const PANEL_LOCALE_NAMES: Record<TranslatedLocale, string> = { en: "İngilizce" };
/** "its English", for messages ("İngilizcesi kaydedilemedi"). */
export const PANEL_LOCALE_OF: Record<TranslatedLocale, string> = { en: "İngilizcesi" };

/** A house recipe in another language; an empty field shows the Turkish text on that language's pages. */
export interface TranslationInput {
  /** Empty keeps the Turkish name (ADR-032: names are not translated by default). */
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  garnish: string;
  glass: string;
  note: string;
  instructions: string[];
}

export function emptyTranslation(): TranslationInput {
  return { name: "", subtitle: "", baseAlcohol: "", flavor: "", tags: [], garnish: "", glass: "", note: "", instructions: [] };
}

/** A translation per language, each starting empty. */
export function emptyTranslations(): Record<TranslatedLocale, TranslationInput> {
  return Object.fromEntries(TRANSLATED_LOCALES.map((l) => [l, emptyTranslation()])) as Record<
    TranslatedLocale,
    TranslationInput
  >;
}

/** A name per language ("" = none yet), for catalogue items and ingredient lines. */
export function emptyNames(): Record<TranslatedLocale, string> {
  return Object.fromEntries(TRANSLATED_LOCALES.map((l) => [l, ""])) as Record<TranslatedLocale, string>;
}
