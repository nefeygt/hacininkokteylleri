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
  /** Visible reviews only; absent when nobody has reviewed it yet. */
  rating?: Rating;
}

export interface Rating {
  average: number;
  count: number;
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

/**
 * Every published cocktail, in display order, with its average rating. The
 * ratings reach the static page at its revalidation; a review write
 * revalidates it at once (ADR-005, ADR-014).
 */
export async function getPublishedCocktails(): Promise<Cocktail[]> {
  const supabase = createPublicClient();
  const [{ data, error }, ratings] = await Promise.all([
    supabase.from("cocktails").select(COCKTAIL_COLUMNS).eq("is_published", true).order("sort_order"),
    supabase.from("cocktail_ratings").select("cocktail_id, review_count, average_rating"),
  ]);

  if (error) throw new Error(`Could not load cocktails: ${error.message}`);
  if (ratings.error) throw new Error(`Could not load ratings: ${ratings.error.message}`);

  const byCocktail = new Map(
    ratings.data.map((r) => [r.cocktail_id, { average: Number(r.average_rating), count: r.review_count ?? 0 }])
  );
  return (data as CocktailRow[]).map((row) => ({ ...toCocktail(row), rating: byCocktail.get(row.id) }));
}

export async function getGlossary(): Promise<Glossary> {
  const { data, error } = await createPublicClient()
    .from("glossary_terms")
    .select("term, definition");

  if (error) throw new Error(`Could not load the glossary: ${error.message}`);
  return Object.fromEntries(data.map((t) => [t.term, t.definition]));
}
