"use client";

import type { CocktailInput } from "./types";
import { PANEL_LOCALE_NAMES, type TranslatedLocale, type TranslationInput } from "./translations";

const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted";
const field =
  "w-full rounded border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";

/** How many fields the Turkish recipe fills that this language leaves empty (they show in Turkish there). */
export function missingCount(form: CocktailInput, locale: TranslatedLocale, tagsText: string): number {
  const t = form.translations[locale];
  const pairs: [string, string][] = [
    [form.subtitle, t.subtitle],
    [form.baseAlcohol, t.baseAlcohol],
    [form.flavor, t.flavor],
    [form.tags.join(), tagsText],
    [form.garnish, t.garnish],
    [form.glass, t.glass],
    [form.note, t.note],
    [form.instructions.join(""), t.instructions.join("")],
    ...form.ingredients.map((i): [string, string] => [i.name, i.translatedNames[locale]]),
  ];
  return pairs.filter(([tr, other]) => tr.trim() && !other.trim()).length;
}

/**
 * The recipe in one other language (ADR-032), under the Turkish form. Every field is optional: an empty one
 * shows the Turkish text on that language's pages. The words follow docs/glossary.md.
 */
export default function CocktailTranslation({
  locale,
  form,
  tagsText,
  onTagsText,
  onChange,
  onIngredientName,
}: {
  locale: TranslatedLocale;
  form: CocktailInput;
  tagsText: string;
  onTagsText: (text: string) => void;
  onChange: (patch: Partial<TranslationInput>) => void;
  onIngredientName: (index: number, name: string) => void;
}) {
  const t = form.translations[locale];
  const missing = missingCount(form, locale, tagsText);
  const language = PANEL_LOCALE_NAMES[locale];

  return (
    <section className="rounded-sm border border-border bg-bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">{language}</h2>
        <span className={`font-mono text-[10px] ${missing ? "text-crimson-glow" : "text-vegan"}`}>
          {missing ? `${missing} alan boş` : "Hepsi dolu"}
        </span>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-text-muted">
        {language} sayfalarda bu metinler görünür. Boş bıraktığın alan orada Türkçesiyle çıkar. Kokteylin adı
        genelde çevrilmez; boş kalırsa Türkçe adı kullanılır.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Ad (isteğe bağlı)</span>
          <input value={t.name} onChange={(e) => onChange({ name: e.target.value })} placeholder={form.name} className={field} />
        </label>
        <label className="block">
          <span className={label}>Alt başlık</span>
          <input value={t.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} placeholder={form.subtitle} className={field} />
        </label>
        <label className="block">
          <span className={label}>Baz alkol</span>
          <input value={t.baseAlcohol} onChange={(e) => onChange({ baseAlcohol: e.target.value })} placeholder={form.baseAlcohol} className={field} />
        </label>
        <label className="block">
          <span className={label}>Baskın tat</span>
          <input value={t.flavor} onChange={(e) => onChange({ flavor: e.target.value })} placeholder={form.flavor} className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Etiketler (virgülle ayır)</span>
          <input value={tagsText} onChange={(e) => onTagsText(e.target.value)} placeholder={form.tags.join(", ")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Bardak</span>
          <input value={t.glass} onChange={(e) => onChange({ glass: e.target.value })} placeholder={form.glass} className={field} />
        </label>
        <label className="block">
          <span className={label}>Süsleme</span>
          <input value={t.garnish} onChange={(e) => onChange({ garnish: e.target.value })} placeholder={form.garnish} className={field} />
        </label>

        <div className="sm:col-span-2">
          <span className={label}>Malzeme adları</span>
          <div className="space-y-2">
            {form.ingredients.map((ing, i) => (
              <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr]">
                <span className="truncate text-sm text-text-secondary">{ing.name || `${i + 1}. malzeme`}</span>
                <input
                  aria-label={`${ing.name || `${i + 1}. malzeme`}: ${language}`}
                  value={ing.translatedNames[locale]}
                  onChange={(e) => onIngredientName(i, e.target.value)}
                  className={field}
                />
              </div>
            ))}
          </div>
        </div>

        <label className="block sm:col-span-2">
          <span className={label}>Hazırlanış (her satır bir adım)</span>
          <textarea
            rows={Math.max(3, form.instructions.length + 1)}
            value={t.instructions.join("\n")}
            onChange={(e) => onChange({ instructions: e.target.value.split("\n") })}
            placeholder={form.instructions.join("\n")}
            className={`${field} resize-y`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Not</span>
          <textarea rows={2} value={t.note} onChange={(e) => onChange({ note: e.target.value })} placeholder={form.note} className={`${field} resize-y`} />
        </label>
      </div>
    </section>
  );
}
