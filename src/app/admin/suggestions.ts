import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import type { Suggestions } from "./types";

function distinct(values: string[], locale: Locale): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, locale));
}

/** Values already in use, so the form can suggest them instead of inviting typos. */
export async function loadSuggestions(supabase: SupabaseClient<Database>, locale: Locale = DEFAULT_LOCALE): Promise<Suggestions> {
  const translated = locale !== DEFAULT_LOCALE;
  const [{ data: cocktails }, { data: ingredients }, { data: catalogue }, { data: texts }, { data: names }] = await Promise.all([
    supabase.from("cocktails").select("base_alcohol, flavor, glass").is("author_id", null),
    supabase.from("cocktail_ingredients").select("unit, cocktails!inner(author_id)").is("cocktails.author_id", null),
    supabase.from("ingredients").select("id, name, category, always_at_hand").order("name"),
    // In another language the suggestions are that language's words for the house recipes.
    translated
      ? supabase.from("cocktail_translations").select("base_alcohol, flavor, glass").eq("locale", locale)
      : Promise.resolve({ data: null }),
    translated
      ? supabase.from("ingredient_translations").select("ingredient_id, name").eq("locale", locale)
      : Promise.resolve({ data: null }),
  ]);
  const words = translated ? (texts ?? []) : (cocktails ?? []);
  const catalogueNames = new Map((names ?? []).map((n) => [n.ingredient_id, n.name]));

  return {
    baseAlcohols: distinct(words.map((c) => c.base_alcohol), locale),
    flavors: distinct(words.map((c) => c.flavor), locale),
    glasses: distinct(words.map((c) => c.glass), locale),
    units: distinct((ingredients ?? []).map((i) => i.unit), locale),
    catalogue: (catalogue ?? []).map((i) => ({
      id: i.id,
      name: catalogueNames.get(i.id) ?? i.name,
      category: i.category,
      alwaysAtHand: i.always_at_hand,
    })),
  };
}
