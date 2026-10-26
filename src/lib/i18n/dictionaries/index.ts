import type { Locale } from "../locales";
import { en } from "./en";
import { tr } from "./tr";
import type { Dictionary } from "./types";

export type { Dictionary } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en };

/** A language's words (ADR-032). Small enough to ship whole to the browser through LocaleProvider. */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
