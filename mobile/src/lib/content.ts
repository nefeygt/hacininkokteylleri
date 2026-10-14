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
