// A house recipe in another language (ADR-032), shared by the site and the app: the translation row's fields
// replace the Turkish ones where they are filled in. No framework imports, so the app can use it too.

/** The columns of `cocktail_translations` that `applyCocktailTranslation` reads. */
export const COCKTAIL_TRANSLATION_COLUMNS =
  "cocktail_id, name, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names";

export interface CocktailTranslationRow {
  cocktail_id: string;
  name: string;
  subtitle: string;
  base_alcohol: string;
  flavor: string;
  tags: string[];
  garnish: string;
  glass: string;
  note: string;
  instructions: string[];
  ingredient_names: string[];
}

/** The fields of a recipe a translation can replace. */
export interface TranslatableCocktail {
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  garnish: string;
  glass: string;
  note?: string;
  instructions: string[];
  ingredients: { name: string }[];
}

/**
 * The recipe with its translation applied: a missing row, an empty field or a missing position keeps the
 * Turkish text. The name changes only when the row has one.
 */
export function applyCocktailTranslation<T extends TranslatableCocktail>(cocktail: T, row: CocktailTranslationRow | undefined): T {
  if (!row) return cocktail;
  return {
    ...cocktail,
    name: row.name || cocktail.name,
    subtitle: row.subtitle || cocktail.subtitle,
    baseAlcohol: row.base_alcohol || cocktail.baseAlcohol,
    flavor: row.flavor || cocktail.flavor,
    tags: row.tags.length > 0 ? row.tags : cocktail.tags,
    garnish: row.garnish || cocktail.garnish,
    glass: row.glass || cocktail.glass,
    note: row.note || cocktail.note,
    instructions: row.instructions.length > 0 ? row.instructions : cocktail.instructions,
    ingredients: cocktail.ingredients.map((ingredient, i) => ({ ...ingredient, name: row.ingredient_names[i] || ingredient.name })),
  };
}
