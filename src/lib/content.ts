import type { Database } from "@/lib/supabase/database.types";
import { cocktailImageUrl } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

// The shapes the site's components draw. Database rows are mapped into these
// in one place, so a column rename touches this file and nothing else.

export type IngredientIcon = Database["public"]["Enums"]["ingredient_icon"];

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  iconType: IngredientIcon;
}

export interface Cocktail {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  color: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  instructions: string[];
  garnish: string;
  glass: string;
  vegan: boolean;
  note?: string;
}

/** Term → explanation, shown as a tooltip wherever the term appears. */
export type Glossary = Record<string, string>;

const COCKTAIL_COLUMNS =
  "id, slug, name, subtitle, base_alcohol, flavor, tags, color, image_path, instructions, garnish, glass, vegan, note, cocktail_ingredients(position, name, amount, unit, icon)";

type CocktailRow = Pick<
  Database["public"]["Tables"]["cocktails"]["Row"],
  | "id" | "slug" | "name" | "subtitle" | "base_alcohol" | "flavor" | "tags" | "color"
  | "image_path" | "instructions" | "garnish" | "glass" | "vegan" | "note"
> & {
  cocktail_ingredients: Pick<
    Database["public"]["Tables"]["cocktail_ingredients"]["Row"],
    "position" | "name" | "amount" | "unit" | "icon"
  >[];
};

function toCocktail(row: CocktailRow): Cocktail {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    baseAlcohol: row.base_alcohol,
    flavor: row.flavor,
    tags: row.tags,
    color: row.color,
    imageUrl: cocktailImageUrl(row.image_path),
    ingredients: [...row.cocktail_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ name: i.name, amount: Number(i.amount), unit: i.unit, iconType: i.icon })),
    instructions: row.instructions,
    garnish: row.garnish,
    glass: row.glass,
    vegan: row.vegan,
    note: row.note ?? undefined,
  };
}

/** Every published cocktail, in display order. */
export async function getPublishedCocktails(): Promise<Cocktail[]> {
  const { data, error } = await createPublicClient()
    .from("cocktails")
    .select(COCKTAIL_COLUMNS)
    .eq("is_published", true)
    .order("sort_order");

  if (error) throw new Error(`Could not load cocktails: ${error.message}`);
  return (data as CocktailRow[]).map(toCocktail);
}

export async function getGlossary(): Promise<Glossary> {
  const { data, error } = await createPublicClient()
    .from("glossary_terms")
    .select("term, definition");

  if (error) throw new Error(`Could not load the glossary: ${error.message}`);
  return Object.fromEntries(data.map((t) => [t.term, t.definition]));
}
