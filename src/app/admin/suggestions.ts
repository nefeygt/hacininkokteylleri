import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Suggestions } from "./types";

function distinct(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}

/** Values already in use, so the form can suggest them instead of inviting typos. */
export async function loadSuggestions(supabase: SupabaseClient<Database>): Promise<Suggestions> {
  const [{ data: cocktails }, { data: ingredients }] = await Promise.all([
    supabase.from("cocktails").select("base_alcohol, flavor, glass").is("author_id", null),
    supabase.from("cocktail_ingredients").select("unit, cocktails!inner(author_id)").is("cocktails.author_id", null),
  ]);

  return {
    baseAlcohols: distinct((cocktails ?? []).map((c) => c.base_alcohol)),
    flavors: distinct((cocktails ?? []).map((c) => c.flavor)),
    glasses: distinct((cocktails ?? []).map((c) => c.glass)),
    units: distinct((ingredients ?? []).map((i) => i.unit)),
  };
}
