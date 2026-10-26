"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, isThemeId, type ThemeId } from "@/lib/themes";
import { useLocale } from "./LocaleProvider";

/**
 * "Görünüm" in the navbar (ADR-028): picks one of THEMES, applies it to <html> at once and keeps
 * it in this browser. The inline boot script in the root layout applies it on the next visit.
 */
export default function ThemePicker() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (isThemeId(current)) setTheme(current);
  }, []);

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

  function choose(next: ThemeId) {
    setTheme(next);
    setOpen(false);
    if (next === DEFAULT_THEME) delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t.themes.title}
        title={t.themes.title}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-secondary"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-bg-card p-1.5 shadow-xl">
          <p className="px-2.5 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
            {t.themes.title}
          </p>
          <ul className="grid gap-0.5">
            {THEMES.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => choose(option.id)}
                  aria-pressed={theme === option.id}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-bg-elevated"
                >
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 rounded-full border border-border-light"
                    style={{
                      background: `linear-gradient(135deg, ${option.swatch[0]} 50%, ${option.swatch[1]} 50%)`,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-text-primary">{t.themes[option.id].name}</span>
                    <span className="block text-xs text-text-muted">{t.themes[option.id].hint}</span>
                  </span>
                  {theme === option.id && <Check className="h-4 w-4 shrink-0 text-crimson-glow" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
