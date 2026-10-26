"use client";

import { createContext, useContext } from "react";
import { en } from "@/lib/i18n/dictionaries/en";
import { tr } from "@/lib/i18n/dictionaries/tr";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import { DEFAULT_LOCALE, localePath, type Locale } from "@/lib/i18n/locales";

const DICTIONARIES: Record<Locale, Dictionary> = { tr, en };

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** The page's language for every client component below it (ADR-032); set by [lang]/(site)/layout.tsx. */
export default function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** The page's language, its words, and a helper that puts a path into the language. */
export function useLocale() {
  const locale = useContext(LocaleContext);
  return { locale, t: DICTIONARIES[locale], href: (path: string) => localePath(locale, path) };
}
