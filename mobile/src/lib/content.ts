// The shapes the app's screens draw, mapped from database rows in one place —
// the app's twin of the site's src/lib/content.ts (which is server-side).

import type { Database } from "@shared/supabase/database.types";
import { cocktailImageUrl, recipeImageUrl, supabase } from "./supabase";

export type IngredientIcon = Database["public"]["Enums"]["ingredient_icon"];

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  iconType: IngredientIcon;
}

export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
}

export interface Rating {
  average: number;
  count: number;
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
  /** A member's recipe (M6); absent for a house recipe (Hacı's). */
  author?: Author;
}

/** Term → explanation, shown wherever the term appears. */
export type Glossary = Record<string, string>;

const COCKTAIL_COLUMNS =
  "id, slug, name, subtitle, base_alcohol, flavor, tags, color, image_path, instructions, garnish, glass, vegan, note, author_id, cocktail_ingredients(position, name, amount, unit, icon)";

type CocktailRow = Pick<
  Database["public"]["Tables"]["cocktails"]["Row"],
  | "id" | "slug" | "name" | "subtitle" | "base_alcohol" | "flavor" | "tags" | "color"
  | "image_path" | "instructions" | "garnish" | "glass" | "vegan" | "note" | "author_id"
> & {
  cocktail_ingredients: Pick<
    Database["public"]["Tables"]["cocktail_ingredients"]["Row"],
    "position" | "name" | "amount" | "unit" | "icon"
  >[];
  profiles?: { id: string; username: string; display_name: string; avatar_path: string | null } | null;
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
    imageUrl: row.author_id ? recipeImageUrl(row.image_path) : cocktailImageUrl(row.image_path),
    ingredients: [...row.cocktail_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ name: i.name, amount: Number(i.amount), unit: i.unit, iconType: i.icon })),
    instructions: row.instructions,
    garnish: row.garnish,
    glass: row.glass,
    vegan: row.vegan,
    note: row.note ?? undefined,
    author: row.profiles
      ? {
          id: row.profiles.id,
          username: row.profiles.username,
          displayName: row.profiles.display_name,
          avatarPath: row.profiles.avatar_path,
        }
      : undefined,
  };
}

// Members' recipes carry their author; !inner leaves out recipes whose author
// is hidden (the profiles policies hide them from everyone else).
const RECIPE_COLUMNS = `${COCKTAIL_COLUMNS}, profiles!cocktails_author_id_fkey!inner(id, username, display_name, avatar_path)`;

async function withRatings(rows: CocktailRow[]): Promise<Cocktail[]> {
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("cocktail_ratings")
    .select("cocktail_id, review_count, average_rating")
    .in("cocktail_id", rows.map((r) => r.id));
  if (error) throw new Error(error.message);
  const byCocktail = new Map(
    data.map((r) => [r.cocktail_id, { average: Number(r.average_rating), count: r.review_count ?? 0 }])
  );
  return rows.map((row) => ({ ...toCocktail(row), rating: byCocktail.get(row.id) }));
}

/**
 * One published member's recipe by its slug, or null (the site's getRecipe).
 * Filtered to published and visible: the author's own session reads drafts
 * and hidden rows too (RLS).
 */
export async function fetchRecipe(slug: string): Promise<Cocktail | null> {
  const { data, error } = await supabase
    .from("cocktails")
    .select(RECIPE_COLUMNS)
    .eq("slug", slug)
    .not("author_id", "is", null)
    .eq("is_published", true)
    .is("hidden_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [recipe] = await withRatings([data as CocktailRow]);
  return recipe;
}

/** The newest published members' recipes, optionally by one author (the feed, a profile). */
export async function fetchNewRecipes(limit: number, authorId?: string): Promise<Cocktail[]> {
  let query = supabase
    .from("cocktails")
    .select(RECIPE_COLUMNS)
    .not("author_id", "is", null)
    .eq("is_published", true)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (authorId) query = query.eq("author_id", authorId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return withRatings(data as CocktailRow[]);
}

/** Members' recipes with the most reviews and favourites in 30 days (the site's getPopularRecipes). */
export async function fetchPopularRecipes(limit: number): Promise<Cocktail[]> {
  const { data: ranked, error } = await supabase
    .from("recipe_popularity")
    .select("cocktail_id, score")
    .gt("score", 0)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  const ids = ranked.map((r) => r.cocktail_id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const { data, error: recipesError } = await supabase
    .from("cocktails")
    .select(RECIPE_COLUMNS)
    .in("id", ids)
    .eq("is_published", true)
    .is("hidden_at", null);
  if (recipesError) throw new Error(recipesError.message);
  const order = new Map(ids.map((id, i) => [id, i]));
  const rows = (data as CocktailRow[]).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return withRatings(rows);
}

export interface Archive {
  cocktails: Cocktail[];
  glossary: Glossary;
}

/** Hacı's published recipes in display order, with their ratings, and the glossary. */
export async function fetchArchive(): Promise<Archive> {
  const [cocktails, ratings, glossary] = await Promise.all([
    supabase.from("cocktails").select(COCKTAIL_COLUMNS).eq("is_published", true).is("author_id", null).order("sort_order"),
    supabase.from("cocktail_ratings").select("cocktail_id, review_count, average_rating"),
    supabase.from("glossary_terms").select("term, definition"),
  ]);
  if (cocktails.error) throw new Error(cocktails.error.message);
  if (ratings.error) throw new Error(ratings.error.message);
  if (glossary.error) throw new Error(glossary.error.message);

  const byCocktail = new Map(
    ratings.data.map((r) => [r.cocktail_id, { average: Number(r.average_rating), count: r.review_count ?? 0 }])
  );
  return {
    cocktails: (cocktails.data as CocktailRow[]).map((row) => ({ ...toCocktail(row), rating: byCocktail.get(row.id) })),
    glossary: Object.fromEntries(glossary.data.map((t) => [t.term, t.definition])),
  };
}
