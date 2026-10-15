// The ingredient catalogue (M9, ADR-029) and "what can I make": shared by the
// site, the panel and, later, the Expo app. Browser-safe: no Next.js imports.

import type { Database } from "./supabase/database.types";

export type IngredientCategory = Database["public"]["Enums"]["ingredient_category"];

export interface CatalogueIngredient {
  id: string;
  name: string;
  category: IngredientCategory;
  /** Counted as present without being picked (water). */
  alwaysAtHand: boolean;
}

/** Display order and Turkish headings of the catalogue's groups. */
export const INGREDIENT_CATEGORIES: { value: IngredientCategory; label: string }[] = [
  { value: "spirit", label: "Sert içkiler" },
  { value: "liqueur", label: "Likörler ve köpüklü" },
  { value: "juice", label: "Meyve suları" },
  { value: "sweetener", label: "Şuruplar ve tatlandırıcılar" },
  { value: "mixer", label: "Gazlılar, kahve, çay, süt" },
  { value: "fresh", label: "Taze malzemeler" },
  { value: "other", label: "Diğer" },
];

export const CATALOGUE_NAME_MAX = 60;

/** The catalogue in category order, each group sorted by name. */
export function groupByCategory<T extends { category: IngredientCategory; name: string }>(
  items: T[]
): { value: IngredientCategory; label: string; items: T[] }[] {
  return INGREDIENT_CATEGORIES.map((c) => ({
    ...c,
    items: items.filter((i) => i.category === c.value).sort((a, b) => a.name.localeCompare(b.name, "tr")),
  })).filter((g) => g.items.length > 0);
}

export interface MatchResult<T> {
  /** Every catalogue ingredient is at hand. */
  ready: T[];
  /** Exactly one is missing (it is named), and the visitor has at least one. */
  oneShort: { cocktail: T; missing: CatalogueIngredient }[];
}

/**
 * Splits recipes by what the visitor has. A recipe counts by its distinct
 * catalogue ingredients; lines without one (members' recipes) are ignored, and
 * a recipe with none at all never matches.
 */
export function matchCocktails<T extends { ingredients: { ingredientId?: string }[] }>(
  cocktails: T[],
  catalogue: CatalogueIngredient[],
  have: ReadonlySet<string>
): MatchResult<T> {
  const byId = new Map(catalogue.map((i) => [i.id, i]));
  const result: MatchResult<T> = { ready: [], oneShort: [] };
  if (have.size === 0) return result;

  for (const cocktail of cocktails) {
    const needed = new Set(cocktail.ingredients.flatMap((i) => (i.ingredientId ? [i.ingredientId] : [])));
    if (needed.size === 0) continue;
    const missing = [...needed].filter((id) => !have.has(id) && !byId.get(id)?.alwaysAtHand);
    if (missing.length === 0) result.ready.push(cocktail);
    // One short only counts when the visitor has something the recipe uses.
    else if (missing.length === 1 && [...needed].some((id) => have.has(id))) {
      const item = byId.get(missing[0]);
      if (item) result.oneShort.push({ cocktail, missing: item });
    }
  }
  return result;
}
