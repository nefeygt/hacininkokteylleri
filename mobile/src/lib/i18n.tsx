import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Dictionary, getDictionary } from "@shared/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale, isPublished, type Locale } from "@shared/i18n/locales";
import { getLocales } from "expo-localization";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en } from "@/lib/i18n/en";
import { type AppDictionary, tr } from "@/lib/i18n/tr";
import { supabase } from "@/lib/supabase";

/** Where the language is kept; the same key as the site's cookie-less storage names (haci.theme). */
export const LOCALE_STORAGE_KEY = "haci.locale";

const APP_DICTIONARIES: Record<Locale, AppDictionary> = { tr, en };

/** The site's words (t) and the app's own (a) in one language. */
export type Words = { locale: Locale; t: Dictionary; a: AppDictionary };

function wordsOf(locale: Locale): Words {
  return { locale, t: getDictionary(locale), a: APP_DICTIONARIES[locale] };
}

/** The phone's language when the visitor has not chosen: Turkish for Turkish phones, English for everything else. */
function phoneLocale(): Locale {
  try {
    return getLocales()[0]?.languageCode === "tr" ? "tr" : "en";
  } catch {
    return DEFAULT_LOCALE;
  }
}

// Plain modules (lib/*.ts) cannot use hooks: they read the current words from here. The provider keeps it in step.
let current: Words = wordsOf(DEFAULT_LOCALE);

/** The words in the language shown now, for code outside React components (error messages in lib modules). */
export function words(): Words {
  return current;
}

type LocaleValue = Words & { setLocale: (locale: Locale) => void };

const LocaleContext = createContext<LocaleValue | null>(null);

/** Holds the language (AsyncStorage, else the phone's) and keeps the splash screen up until it is read. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY)
      .then((stored) => {
        const chosen = isLocale(stored) && isPublished(stored) ? stored : phoneLocale();
        current = wordsOf(chosen);
        setLocaleState(chosen);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    current = wordsOf(next);
    setLocaleState(next);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, next).catch(() => {});
    // A signed-in member's choice also decides the language of their e-mails (like the site's switcher).
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const user = data.session?.user;
        if (user) return supabase.from("account_settings").update({ locale: next }).eq("user_id", user.id);
      })
      .catch(() => {});
  }, []);

  const value = useMemo(() => ({ ...wordsOf(locale), setLocale }), [locale, setLocale]);

  if (!ready) return null;
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** `const { t, a, locale } = useLocale()`: t is the site's dictionary, a the app's own words. */
export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale needs a LocaleProvider");
  return value;
}
