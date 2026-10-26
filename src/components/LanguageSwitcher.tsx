"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { rememberLocale } from "@/app/[lang]/(site)/account/actions";
import { LOCALE_NAMES, localePath, PUBLISHED_LOCALES, splitLocale } from "@/lib/i18n/locales";
import { useLocale } from "./LocaleProvider";

/**
 * The page in another language (ADR-032): the same path with the other prefix. Hidden while only one language
 * is published. Plain next/link, since the target already carries its prefix. A signed-in member's e-mails
 * follow the choice (rememberLocale does nothing for visitors).
 */
export default function LanguageSwitcher() {
  const { locale, t } = useLocale();
  const { path } = splitLocale(usePathname());
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (PUBLISHED_LOCALES.length < 2) return null;

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t.nav.language}
        title={t.nav.language}
        className="flex h-8 shrink-0 items-center gap-1 rounded px-1.5 font-mono text-[11px] uppercase text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
      >
        <Languages className="h-3.5 w-3.5" />
        {locale}
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-border bg-bg-card p-1.5 shadow-xl">
          {PUBLISHED_LOCALES.map((l) => (
            <li key={l}>
              <NextLink
                href={localePath(l, path)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => {
                  setOpen(false);
                  if (l !== locale) void rememberLocale(l);
                }}
                className={`block rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-bg-elevated ${
                  l === locale ? "text-crimson-glow" : "text-text-primary"
                }`}
              >
                {LOCALE_NAMES[l]}
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
