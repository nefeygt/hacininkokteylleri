"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  CATALOGUE_NAME_MAX,
  INGREDIENT_CATEGORIES,
  groupByCategory,
  type CatalogueIngredient,
  type IngredientCategory,
} from "@/lib/ingredients";
import { deleteCatalogueIngredient, saveCatalogueIngredient } from "./actions";
import { emptyNames, PANEL_LOCALE_NAMES, TRANSLATED_LOCALES, type TranslatedLocale } from "./translations";

type Item = CatalogueIngredient & { uses: number; translations: Record<TranslatedLocale, string> };

const field =
  "w-full rounded border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";

function ItemRow({ initial }: { initial: Item | null }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<IngredientCategory>(initial?.category ?? "spirit");
  const [alwaysAtHand, setAlwaysAtHand] = useState(initial?.alwaysAtHand ?? false);
  const [translations, setTranslations] = useState(initial?.translations ?? emptyNames);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty =
    name !== (initial?.name ?? "") ||
    category !== (initial?.category ?? "spirit") ||
    alwaysAtHand !== (initial?.alwaysAtHand ?? false) ||
    TRANSLATED_LOCALES.some((l) => translations[l] !== (initial?.translations[l] ?? ""));

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveCatalogueIngredient(initial?.id ?? null, name, category, alwaysAtHand, translations);
      if (result.error) setError(result.error);
      else if (!initial) {
        setName("");
        setAlwaysAtHand(false);
        setTranslations(emptyNames());
      }
    });
  }

  function remove() {
    if (!initial) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteCatalogueIngredient(initial.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <li className="grid items-center gap-2 p-3 sm:grid-cols-[1fr_1fr_200px_100px_auto]">
      <input
        value={name}
        maxLength={CATALOGUE_NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        placeholder={initial ? "Ad" : "Yeni malzeme"}
        className={field}
      />
      {TRANSLATED_LOCALES.map((l) => (
        <input
          key={l}
          value={translations[l]}
          maxLength={CATALOGUE_NAME_MAX}
          onChange={(e) => setTranslations((all) => ({ ...all, [l]: e.target.value }))}
          placeholder={`${PANEL_LOCALE_NAMES[l]} ad`}
          aria-label={`${PANEL_LOCALE_NAMES[l]} ad`}
          className={field}
        />
      ))}
      <select value={category} onChange={(e) => setCategory(e.target.value as IngredientCategory)} className={field}>
        {INGREDIENT_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-xs text-text-secondary">
        <input type="checkbox" checked={alwaysAtHand} onChange={(e) => setAlwaysAtHand(e.target.checked)} />
        Hep elde
      </label>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!dirty || pending || !name.trim()}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded bg-crimson px-3 py-2 text-xs text-white hover:bg-crimson-light disabled:opacity-40"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : initial ? null : <Plus className="h-3.5 w-3.5" />}
          {initial ? "Kaydet" : "Ekle"}
        </button>
        {initial && (
          <>
            <span className="w-14 text-right font-mono text-[10px] text-text-muted" title="Kaç tarif satırında kullanılıyor">
              {initial.uses} tarif
            </span>
            <button
              type="button"
              disabled={pending || initial.uses > 0}
              onClick={remove}
              title={initial.uses > 0 ? "Tariflerde kullanılıyor" : "Sil"}
              className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-crimson-glow disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-crimson-glow sm:col-span-5">{error}</p>}
    </li>
  );
}

export default function IngredientCatalogueEditor({ items }: { items: Item[] }) {
  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border rounded-sm border border-crimson/30 bg-bg-card">
        <ItemRow key="__new" initial={null} />
      </ul>
      {groupByCategory(items).map((g) => (
        <section key={g.value}>
          <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">{g.label}</h2>
          <ul className="divide-y divide-border rounded-sm border border-border bg-bg-card">
            {g.items.map((i) => (
              <ItemRow key={i.id} initial={i} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
