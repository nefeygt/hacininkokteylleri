import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { Database } from "@/lib/supabase/database.types";
import { cocktailImageUrl, recipeImageUrl } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";
import type { ShowcasePeriod } from "@/lib/showcase";
import type { CatalogueIngredient } from "@/lib/ingredients";
import { COCKTAIL_TRANSLATION_COLUMNS, applyCocktailTranslation, type CocktailTranslationRow } from "@/lib/translations";

// The shapes the site's components draw. Database rows are mapped into these
// in one place, so a column rename touches this file and nothing else.

export type IngredientIcon = Database["public"]["Enums"]["ingredient_icon"];

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  iconType: IngredientIcon;
  /** The catalogue ingredient (ADR-029); house recipes always have one. */
  ingredientId?: string;
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

export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
}

export interface Rating {
  average: number;
  count: number;
  /** Reviews per half star: [0] = 0.5 stars … [9] = 5 stars (the breakdown, M9). */
  halfStars?: number[];
}

const RATING_COLUMNS = "cocktail_id, review_count, average_rating, half_star_counts";

function toRating(r: { average_rating: number | null; review_count: number | null; half_star_counts: number[] | null }): Rating {
  return { average: Number(r.average_rating), count: r.review_count ?? 0, halfStars: r.half_star_counts ?? undefined };
}

/** Term → explanation, shown as a tooltip wherever the term appears. */
export type Glossary = Record<string, string>;

const COCKTAIL_COLUMNS =
  "id, slug, name, subtitle, base_alcohol, flavor, tags, color, image_path, instructions, garnish, glass, vegan, note, author_id, cocktail_ingredients(position, name, amount, unit, icon, ingredient_id)";

// Members' recipes carry their author; !inner leaves out recipes whose author
// is hidden (the profiles policies hide them from everyone else).
const RECIPE_COLUMNS = `${COCKTAIL_COLUMNS}, profiles!cocktails_author_id_fkey!inner(id, username, display_name, avatar_path)`;

type CocktailRow = Pick<
  Database["public"]["Tables"]["cocktails"]["Row"],
  | "id" | "slug" | "name" | "subtitle" | "base_alcohol" | "flavor" | "tags" | "color"
  | "image_path" | "instructions" | "garnish" | "glass" | "vegan" | "note" | "author_id"
> & {
  cocktail_ingredients: Pick<
    Database["public"]["Tables"]["cocktail_ingredients"]["Row"],
    "position" | "name" | "amount" | "unit" | "icon" | "ingredient_id"
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
      .map((i) => ({
        name: i.name,
        amount: Number(i.amount),
        unit: i.unit,
        iconType: i.icon,
        ingredientId: i.ingredient_id ?? undefined,
      })),
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

/**
 * A recipe's own page: a house recipe under /cocktails (ADR-025), a member's
 * under /recipes (ADR-018). Slugs are unique across both.
 */
export function recipeHref(slug: string, isCommunity: boolean): string {
  return isCommunity ? `/recipes/${slug}` : `/cocktails/${slug}`;
}

/**
 * Every published cocktail, in display order, with its average rating. The
 * ratings reach the static page at its revalidation; a review write
 * revalidates it at once (ADR-005, ADR-014).
 */
export async function getPublishedCocktails(locale: Locale = DEFAULT_LOCALE): Promise<Cocktail[]> {
  const supabase = createPublicClient();
  const [{ data, error }, ratings] = await Promise.all([
    supabase.from("cocktails").select(COCKTAIL_COLUMNS).eq("is_published", true).is("author_id", null).order("sort_order"),
    supabase.from("cocktail_ratings").select(RATING_COLUMNS),
  ]);

  if (error) throw new Error(`Could not load cocktails: ${error.message}`);
  if (ratings.error) throw new Error(`Could not load ratings: ${ratings.error.message}`);

  const byCocktail = new Map(
    ratings.data.map((r) => [r.cocktail_id, toRating(r)])
  );
  return translateCocktails(
    (data as CocktailRow[]).map((row) => ({ ...toCocktail(row), rating: byCocktail.get(row.id) })),
    locale,
  );
}

/** The ingredient catalogue (ADR-029), for "what can I make"; names in the language where translated. */
export async function getIngredientCatalogue(locale: Locale = DEFAULT_LOCALE): Promise<CatalogueIngredient[]> {
  const supabase = createPublicClient();
  const [{ data, error }, translations] = await Promise.all([
    supabase.from("ingredients").select("id, name, category, always_at_hand").order("name"),
    locale === DEFAULT_LOCALE
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("ingredient_translations").select("ingredient_id, name").eq("locale", locale),
  ]);
  if (error) throw new Error(`Could not load ingredients: ${error.message}`);
  if (translations.error) throw new Error(`Could not load ingredient translations: ${translations.error.message}`);
  const names = new Map(translations.data.map((t) => [t.ingredient_id, t.name]));
  return data
    .map((i) => ({ id: i.id, name: names.get(i.id) ?? i.name, category: i.category, alwaysAtHand: i.always_at_hand }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * House recipes in another language (ADR-032): the translation rows are applied by `applyCocktailTranslation`
 * (shared with the app). Members' recipes stay as written.
 */
async function translateCocktails(cocktails: Cocktail[], locale: Locale): Promise<Cocktail[]> {
  const ids = cocktails.filter((c) => !c.author).map((c) => c.id);
  if (locale === DEFAULT_LOCALE || ids.length === 0) return cocktails;
  const { data, error } = await createPublicClient()
    .from("cocktail_translations")
    .select(COCKTAIL_TRANSLATION_COLUMNS)
    .eq("locale", locale)
    .in("cocktail_id", ids);
  if (error) throw new Error(`Could not load translations: ${error.message}`);
  const byId = new Map((data as unknown as CocktailTranslationRow[]).map((row) => [row.cocktail_id, row]));
  return cocktails.map((c) => applyCocktailTranslation(c, byId.get(c.id)));
}

async function withRatings(rows: CocktailRow[]): Promise<Cocktail[]> {
  if (rows.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("cocktail_ratings")
    .select(RATING_COLUMNS)
    .in("cocktail_id", rows.map((r) => r.id));
  if (error) throw new Error(`Could not load ratings: ${error.message}`);
  const byCocktail = new Map(
    data.map((r) => [r.cocktail_id, toRating(r)])
  );
  return rows.map((row) => ({ ...toCocktail(row), rating: byCocktail.get(row.id) }));
}

/** One published house recipe (Hacı's) by its slug, or null (ADR-025). */
export async function getCocktail(slug: string, locale: Locale = DEFAULT_LOCALE): Promise<Cocktail | null> {
  const { data, error } = await createPublicClient()
    .from("cocktails")
    .select(COCKTAIL_COLUMNS)
    .eq("slug", slug)
    .is("author_id", null)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load the cocktail: ${error.message}`);
  if (!data) return null;
  const [cocktail] = await translateCocktails(await withRatings([data as CocktailRow]), locale);
  return cocktail;
}

/** One published member's recipe by its slug, or null (M6). */
export async function getRecipe(slug: string): Promise<Cocktail | null> {
  const { data, error } = await createPublicClient()
    .from("cocktails")
    .select(RECIPE_COLUMNS)
    .eq("slug", slug)
    .not("author_id", "is", null)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load the recipe: ${error.message}`);
  if (!data) return null;
  const [recipe] = await withRatings([data as CocktailRow]);
  return recipe;
}

/** The newest published members' recipes, optionally by one author. */
export async function getNewRecipes(limit: number, authorId?: string): Promise<Cocktail[]> {
  let query = createPublicClient()
    .from("cocktails")
    .select(RECIPE_COLUMNS)
    .not("author_id", "is", null)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (authorId) query = query.eq("author_id", authorId);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load recipes: ${error.message}`);
  return withRatings(data as CocktailRow[]);
}

/**
 * Published members' recipes whose every line names a catalogue ingredient,
 * newest first: the ones "what can I make" can match (ADR-029).
 */
export async function getMatchableRecipes(): Promise<Cocktail[]> {
  const { data, error } = await createPublicClient()
    .from("cocktails")
    .select(RECIPE_COLUMNS)
    .not("author_id", "is", null)
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load recipes: ${error.message}`);
  const rows = (data as CocktailRow[]).filter(
    (r) => r.cocktail_ingredients.length > 0 && r.cocktail_ingredients.every((i) => i.ingredient_id)
  );
  return withRatings(rows);
}

/**
 * Members' recipes with the most reviews and favourites in the last 30 days
 * (the recipe_popularity view), Letterboxd's "popular this week". Recipes
 * nobody has touched yet are left to the "new" list.
 */
export async function getPopularRecipes(limit: number): Promise<Cocktail[]> {
  const supabase = createPublicClient();
  const { data: ranked, error } = await supabase
    .from("recipe_popularity")
    .select("cocktail_id, score")
    .gt("score", 0)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load popular recipes: ${error.message}`);
  const ids = ranked.map((r) => r.cocktail_id).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const { data, error: recipesError } = await supabase.from("cocktails").select(RECIPE_COLUMNS).in("id", ids);
  if (recipesError) throw new Error(`Could not load popular recipes: ${recipesError.message}`);
  const order = new Map(ids.map((id, i) => [id, i]));
  const rows = (data as CocktailRow[]).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return withRatings(rows);
}

// ---------------------------------------------------------------- showcase (M7)

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

// The anon client sees only approved, visible entries (RLS); !inner leaves out
// entries whose recipe or author is no longer visible.
const ENTRY_COLUMNS = `id, pitch, vote_count, cocktails!inner(${RECIPE_COLUMNS})`;

async function getEntries(periodId: string, limit?: number): Promise<ShowcaseEntry[]> {
  let query = createPublicClient()
    .from("showcase_entries")
    .select(ENTRY_COLUMNS)
    .eq("period_id", periodId)
    .order("vote_count", { ascending: false })
    .order("created_at");
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load the showcase: ${error.message}`);
  const rows = data as unknown as EntryRow[];
  const recipes = await withRatings(rows.map((r) => r.cocktails));
  return rows.map((row, i) => ({ id: row.id, pitch: row.pitch, voteCount: row.vote_count, recipe: recipes[i] }));
}

function toPeriod(row: { id: string; starts_at: string; ends_at: string }): ShowcasePeriod {
  return { id: row.id, startsAt: row.starts_at, endsAt: row.ends_at };
}

/** The feed's showcase: the open period (or the next one) and its approved entries. */
export async function getShowcase(): Promise<Showcase> {
  const { data, error } = await createPublicClient()
    .from("showcase_periods")
    .select("id, starts_at, ends_at")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load the showcase: ${error.message}`);
  if (!data) return { period: null, entries: [] };
  return { period: toPeriod(data), entries: await getEntries(data.id) };
}

/**
 * The derived winner (ADR-014): the approved entry with the most votes in the
 * latest period that has ended, the earlier application on a tie. Shown on the
 * home page until the next period ends. Never stored.
 */
export async function getShowcaseWinner(): Promise<(ShowcaseEntry & { period: ShowcasePeriod }) | null> {
  const { data, error } = await createPublicClient()
    .from("showcase_periods")
    .select("id, starts_at, ends_at")
    .lte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load the showcase winner: ${error.message}`);
  if (!data) return null;
  const [winner] = await getEntries(data.id, 1);
  return winner ? { ...winner, period: toPeriod(data) } : null;
}

/**
 * The glossary in a language: for English the translated terms (the words that appear in English text);
 * `withTurkish` adds the Turkish terms for pages that show members' recipes.
 */
export async function getGlossary(locale: Locale = DEFAULT_LOCALE, withTurkish = false): Promise<Glossary> {
  const supabase = createPublicClient();
  if (locale !== DEFAULT_LOCALE) {
    const { data, error } = await supabase
      .from("glossary_term_translations")
      .select("translated_term, definition")
      .eq("locale", locale);
    if (error) throw new Error(`Could not load the glossary: ${error.message}`);
    const translated = Object.fromEntries(data.map((t) => [t.translated_term, t.definition]));
    // A member's recipe stays in the language it was written in, so its Turkish terms keep their tooltips.
    return withTurkish ? { ...(await getGlossary(DEFAULT_LOCALE)), ...translated } : translated;
  }
  const { data, error } = await supabase.from("glossary_terms").select("term, definition");

  if (error) throw new Error(`Could not load the glossary: ${error.message}`);
  return Object.fromEntries(data.map((t) => [t.term, t.definition]));
}
