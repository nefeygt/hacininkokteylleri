import { headers } from "next/headers";
import { getDictionary } from "./dictionaries";
import { DEFAULT_LOCALE, splitLocale, type Locale } from "./locales";

/**
 * The language of the page that called a server action (ADR-032): actions have no route params, so the
 * visible address comes from the `referer` header ("/en/feed" → en). Turkish when the header is missing.
 */
export async function actionLocale(): Promise<Locale> {
  const referer = (await headers()).get("referer");
  if (!referer) return DEFAULT_LOCALE;
  try {
    return splitLocale(new URL(referer).pathname).locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** The words for a server action's messages, in the caller's language. */
export async function actionDictionary() {
  return getDictionary(await actionLocale());
}
