"use server";

import { revalidateLocalized } from "@/lib/i18n/revalidate";
import { accountSession } from "@/lib/account";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { actionDictionary } from "@/lib/i18n/server";
import { cleanRecipeInput, toSavedIngredients, type RecipeInput } from "@/lib/recipe";
import { slugify } from "@/lib/slug";
import { RECIPE_IMAGES_BUCKET } from "@/lib/supabase/config";

// Members' recipes (M6, ADR-018). The database is the rule (RLS, save_recipe,
// the limits, 10 recipes a day); these actions give friendly errors, clean up
// replaced photos and revalidate the pages that show the recipe (ADR-016).
// Like every action here, they never call redirect() (ADR-007).

export type RecipeResult = { ok?: boolean; error?: string; id?: string; slug?: string };

function writeError(code: string | undefined, message: string, t: Dictionary): string {
  if (message.includes("Daily recipe limit")) return t.actions.dailyRecipe;
  if (code === "23514") return t.actions.recipeInvalid;
  if (code === "P0002") return t.actions.recipeNotFound;
  if (code === "23503") return t.actions.ingredientMissing;
  return format(t.validation.saveFailed, { message });
}

function revalidateRecipe(slug: string, username: string) {
  revalidateLocalized(`/recipes/${slug}`);
  revalidateLocalized(`/u/${username}`);
  revalidateLocalized("/feed");
  // The showcase's winner on the home page may be this recipe (M7).
  revalidateLocalized("/");
  // Fully linked published recipes take part in "Elimde ne var?" (ADR-029).
  revalidateLocalized("/what-can-i-make");
}

/** Creates a recipe (no id) or edits the member's own. The slug is set once, at creation. */
export async function saveRecipe(input: RecipeInput, id?: string): Promise<RecipeResult> {
  const t = await actionDictionary();
  const recipe = cleanRecipeInput(input, t.validation);
  if ("error" in recipe) return recipe;

  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, profile } = session;

  if (recipe.imagePath && !recipe.imagePath.startsWith(`${profile.id}/`)) return { error: t.actions.photoUnreadable };

  let previous: { slug: string; image_path: string | null } | null = null;
  if (id) {
    const { data } = await supabase
      .from("cocktails")
      .select("slug, image_path")
      .eq("id", id)
      .eq("author_id", profile.id)
      .maybeSingle();
    if (!data) return { error: t.actions.recipeNotFound };
    previous = data;
  }

  const fields = {
    id: id ?? null,
    name: recipe.name,
    subtitle: recipe.subtitle,
    base_alcohol: recipe.baseAlcohol,
    flavor: recipe.flavor,
    tags: recipe.tags,
    color: recipe.color,
    image_path: recipe.imagePath,
    instructions: recipe.instructions,
    garnish: recipe.garnish,
    glass: recipe.glass,
    vegan: recipe.vegan,
    note: recipe.note,
    is_published: recipe.isPublished,
  };

  // Slugs are unique across house and members' recipes; on a clash, add a
  // short suffix and try again ("negroni" → "negroni-k3f").
  const base = slugify(recipe.name).slice(0, 60).replace(/-+$/, "") || t.actions.slugFallback;
  let slug = previous?.slug ?? base;
  let savedId: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase.rpc("save_recipe", {
      recipe: { ...fields, slug },
      ingredients: toSavedIngredients(recipe.ingredients),
    });
    if (!error) {
      savedId = data;
      break;
    }
    if (error.code === "23505" && !id) {
      slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
      continue;
    }
    return { error: writeError(error.code, error.message, t) };
  }
  if (!savedId) return { error: t.actions.slugFailed };

  // The old photo is no longer referenced; photos are never overwritten in place (ADR-006).
  if (previous?.image_path && previous.image_path !== recipe.imagePath) {
    await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([previous.image_path]);
  }

  revalidateRecipe(slug, profile.username);
  return { ok: true, id: savedId, slug };
}

export async function deleteRecipe(id: string): Promise<RecipeResult> {
  const t = await actionDictionary();
  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, profile } = session;

  const { data } = await supabase
    .from("cocktails")
    .select("slug, image_path")
    .eq("id", id)
    .eq("author_id", profile.id)
    .maybeSingle();
  if (!data) return { error: t.actions.recipeNotFound };

  const { error } = await supabase.from("cocktails").delete().eq("id", id).eq("author_id", profile.id);
  if (error) return { error: format(t.actions.deleteFailed, { message: error.message }) };

  if (data.image_path) await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([data.image_path]);

  revalidateRecipe(data.slug, profile.username);
  return { ok: true };
}
