"use server";

import { revalidatePath } from "next/cache";
import { accountSession } from "@/lib/account";
import { cleanRecipeInput, type RecipeInput } from "@/lib/recipe";
import { slugify } from "@/lib/slug";
import { RECIPE_IMAGES_BUCKET } from "@/lib/supabase/config";

// Members' recipes (M6, ADR-018). The database is the rule (RLS, save_recipe,
// the limits, 10 recipes a day); these actions give friendly errors, clean up
// replaced photos and revalidate the pages that show the recipe (ADR-016).
// Like every action here, they never call redirect() (ADR-007).

export type RecipeResult = { ok?: boolean; error?: string; id?: string; slug?: string };

const SESSION_LOST = "Oturumun sona ermiş. Sayfayı yenileyip tekrar giriş yap.";

function writeError(code: string | undefined, message: string): string {
  if (message.includes("Daily recipe limit")) return "Bugün yeterince tarif ekledin. Yarın tekrar dene.";
  if (code === "23514") return "Tarif geçersiz: alanları kontrol et.";
  if (code === "P0002") return "Tarif bulunamadı.";
  return `Kaydedilemedi: ${message}`;
}

function revalidateRecipe(slug: string, username: string) {
  revalidatePath(`/recipes/${slug}`);
  revalidatePath(`/u/${username}`);
  revalidatePath("/feed");
}

/** Creates a recipe (no id) or edits the member's own. The slug is set once, at creation. */
export async function saveRecipe(input: RecipeInput, id?: string): Promise<RecipeResult> {
  const recipe = cleanRecipeInput(input);
  if ("error" in recipe) return recipe;

  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, profile } = session;

  if (recipe.imagePath && !recipe.imagePath.startsWith(`${profile.id}/`)) return { error: "Fotoğraf okunamadı." };

  let previous: { slug: string; image_path: string | null } | null = null;
  if (id) {
    const { data } = await supabase
      .from("cocktails")
      .select("slug, image_path")
      .eq("id", id)
      .eq("author_id", profile.id)
      .maybeSingle();
    if (!data) return { error: "Tarif bulunamadı." };
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
  const base = slugify(recipe.name).slice(0, 60).replace(/-+$/, "") || "tarif";
  let slug = previous?.slug ?? base;
  let savedId: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase.rpc("save_recipe", {
      recipe: { ...fields, slug },
      ingredients: recipe.ingredients,
    });
    if (!error) {
      savedId = data;
      break;
    }
    if (error.code === "23505" && !id) {
      slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
      continue;
    }
    return { error: writeError(error.code, error.message) };
  }
  if (!savedId) return { error: "Kaydedilemedi: kısa ad bulunamadı, adı biraz değiştirip tekrar dene." };

  // The old photo is no longer referenced; photos are never overwritten in place (ADR-006).
  if (previous?.image_path && previous.image_path !== recipe.imagePath) {
    await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([previous.image_path]);
  }

  revalidateRecipe(slug, profile.username);
  return { ok: true, id: savedId, slug };
}

export async function deleteRecipe(id: string): Promise<RecipeResult> {
  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, profile } = session;

  const { data } = await supabase
    .from("cocktails")
    .select("slug, image_path")
    .eq("id", id)
    .eq("author_id", profile.id)
    .maybeSingle();
  if (!data) return { error: "Tarif bulunamadı." };

  const { error } = await supabase.from("cocktails").delete().eq("id", id).eq("author_id", profile.id);
  if (error) return { error: `Silinemedi: ${error.message}` };

  if (data.image_path) await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([data.image_path]);

  revalidateRecipe(data.slug, profile.username);
  return { ok: true };
}
