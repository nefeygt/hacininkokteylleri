// The shapes the app's screens draw, mapped from database rows in one place —
// the app's twin of the site's src/lib/content.ts (which is server-side).

import { DEFAULT_LOCALE, type Locale } from "@shared/i18n/locales";
import { COCKTAIL_TRANSLATION_COLUMNS, applyCocktailTranslation, type CocktailTranslationRow } from "@shared/translations";
import type { ShowcasePeriod } from "@shared/showcase";
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

/**
 * Hacı's published recipes in display order, with their ratings, and the glossary, in a language: the translation
 * rows (shared `applyCocktailTranslation`) replace the Turkish text where filled in; members' recipes stay as written.
 */
export async function fetchArchive(locale: Locale = DEFAULT_LOCALE): Promise<Archive> {
  const translated = locale !== DEFAULT_LOCALE;
  const [cocktails, ratings, glossary, cocktailTranslations, glossaryTranslations] = await Promise.all([
    supabase.from("cocktails").select(COCKTAIL_COLUMNS).eq("is_published", true).is("author_id", null).order("sort_order"),
    supabase.from("cocktail_ratings").select("cocktail_id, review_count, average_rating"),
    supabase.from("glossary_terms").select("term, definition"),
    translated
      ? supabase.from("cocktail_translations").select(COCKTAIL_TRANSLATION_COLUMNS).eq("locale", locale)
      : Promise.resolve(null),
    translated
      ? supabase.from("glossary_term_translations").select("translated_term, definition").eq("locale", locale)
      : Promise.resolve(null),
  ]);
  if (cocktails.error) throw new Error(cocktails.error.message);
  if (ratings.error) throw new Error(ratings.error.message);
  if (glossary.error) throw new Error(glossary.error.message);
  if (cocktailTranslations?.error) throw new Error(cocktailTranslations.error.message);
  if (glossaryTranslations?.error) throw new Error(glossaryTranslations.error.message);

  const rows = new Map(
    ((cocktailTranslations?.data ?? []) as unknown as CocktailTranslationRow[]).map((row) => [row.cocktail_id, row])
  );
  const byCocktail = new Map(
    ratings.data.map((r) => [r.cocktail_id, { average: Number(r.average_rating), count: r.review_count ?? 0 }])
  );
  return {
    cocktails: (cocktails.data as CocktailRow[]).map((row) =>
      applyCocktailTranslation({ ...toCocktail(row), rating: byCocktail.get(row.id) }, rows.get(row.id))
    ),
    // Members' recipes stay in the language they were written in, so the Turkish terms keep their tooltips.
    glossary: {
      ...Object.fromEntries(glossary.data.map((t) => [t.term, t.definition])),
      ...Object.fromEntries((glossaryTranslations?.data ?? []).map((t) => [t.translated_term, t.definition])),
    },
  };
}

// ---------------------------------------------------------------- the showcase (M7, ADR-019)

export interface ShowcaseEntry {
  id: string;
  pitch: string;
  voteCount: number;
  recipe: Cocktail;
}

export interface Showcase {
  /** The open period, or else the next one; null when none is planned. */
  period: ShowcasePeriod | null;
  /** Approved entries of that period, most votes first. */
  entries: ShowcaseEntry[];
}

type EntryRow = { id: string; pitch: string; vote_count: number; cocktails: CocktailRow };

// !inner leaves out entries whose recipe or author is no longer visible.
const ENTRY_COLUMNS = `id, pitch, vote_count, cocktails!inner(${RECIPE_COLUMNS})`;

/**
 * Approved, visible entries of a period (the site's getEntries). The filters
 * matter: an applicant's session also reads their own pending, rejected or
 * hidden application, and an author's their own unpublished recipe (RLS).
 */
async function fetchEntries(periodId: string, limit?: number): Promise<ShowcaseEntry[]> {
  let query = supabase
    .from("showcase_entries")
    .select(ENTRY_COLUMNS)
    .eq("period_id", periodId)
    .eq("status", "approved")
    .is("hidden_at", null)
    .eq("cocktails.is_published", true)
    .is("cocktails.hidden_at", null)
    .order("vote_count", { ascending: false })
    .order("created_at");
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data as unknown as EntryRow[];
  const recipes = await withRatings(rows.map((r) => r.cocktails));
  return rows.map((row, i) => ({ id: row.id, pitch: row.pitch, voteCount: row.vote_count, recipe: recipes[i] }));
}

function toPeriod(row: { id: string; starts_at: string; ends_at: string }): ShowcasePeriod {
  return { id: row.id, startsAt: row.starts_at, endsAt: row.ends_at };
}

/** The feed's showcase: the open period (or the next one) and its approved entries (the site's getShowcase). */
export async function fetchShowcase(): Promise<Showcase> {
  const { data, error } = await supabase
    .from("showcase_periods")
    .select("id, starts_at, ends_at")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { period: null, entries: [] };
  return { period: toPeriod(data), entries: await fetchEntries(data.id) };
}

/**
 * The derived winner (ADR-014, the site's getShowcaseWinner): the approved
 * entry with the most votes in the latest period that has ended, the earlier
 * application on a tie.
 */
export async function fetchShowcaseWinner(): Promise<ShowcaseEntry | null> {
  const { data, error } = await supabase
    .from("showcase_periods")
    .select("id, starts_at, ends_at")
    .lte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [winner] = await fetchEntries(data.id, 1);
  return winner ?? null;
}
