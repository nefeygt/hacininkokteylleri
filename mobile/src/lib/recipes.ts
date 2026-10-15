// Members' recipes (M8 step 5) — the site's account/recipes/actions.ts and its
// ImageField for the app. The database is the rule (RLS, save_recipe, the
// length checks, 10 recipes a day); these give the same friendly errors, keep
// photos never-overwritten (ADR-006) and ask the site to refresh the pages
// that show the recipe (ADR-018, ADR-020).

import { cleanRecipeInput, toSavedIngredients, type RecipeInput } from "@shared/recipe";
import { slugify } from "@shared/slug";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import type { Writer } from "./community";
import { revalidateSite } from "./revalidate";
import { supabase } from "./supabase";

export const RECIPE_IMAGES_BUCKET = "recipe-images";

export type RecipeResult = { ok?: boolean; error?: string; id?: string; slug?: string };

/** One of the member's own recipes in their list (the site's /account/recipes). */
export interface OwnRecipe {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  color: string;
  is_published: boolean;
  hidden_at: string | null;
}

/** A recipe opened in the form: what the form edits plus what it only shows. */
export interface EditableRecipe {
  id: string;
  slug: string;
  hidden: boolean;
  input: RecipeInput;
}

/** The site's new-recipe defaults. */
export const NEW_RECIPE: RecipeInput = {
  name: "",
  subtitle: "",
  baseAlcohol: "",
  flavor: "",
  tags: [],
  color: "#8b1a1a",
  imagePath: null,
  ingredients: [{ name: "", amount: 4, unit: "cl", icon: "shot" }],
  instructions: [""],
  garnish: "",
  glass: "",
  vegan: false,
  note: "",
  isPublished: true,
};

function writeError(code: string | undefined, message: string): string {
  if (message.includes("Daily recipe limit")) return "Bugün yeterince tarif ekledin. Yarın tekrar dene.";
  if (code === "23514") return "Tarif geçersiz: alanları kontrol et.";
  if (code === "P0002") return "Tarif bulunamadı.";
  if (code === "23503") return "Katalogdaki bir malzeme bulunamadı. Tarifi kapatıp yeniden aç.";
  return `Kaydedilemedi: ${message}`;
}

/** The pages a recipe write changes — the site's revalidateRecipe(); "/" for the showcase's winner. */
function recipePages(slug: string, username: string): string[] {
  return [`/recipes/${slug}`, `/u/${username}`, "/feed", "/", "/what-can-i-make"];
}

/** The member's recipes, drafts and published, newest first. */
export async function fetchMyRecipes(memberId: string): Promise<OwnRecipe[]> {
  const { data, error } = await supabase
    .from("cocktails")
    .select("id, slug, name, subtitle, color, is_published, hidden_at")
    .eq("author_id", memberId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchMyRecipe(memberId: string, id: string): Promise<EditableRecipe | null> {
  const { data: r, error } = await supabase
    .from("cocktails")
    .select("*, cocktail_ingredients(position, name, amount, unit, icon, ingredient_id)")
    .eq("id", id)
    .eq("author_id", memberId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    hidden: Boolean(r.hidden_at),
    input: {
      name: r.name,
      subtitle: r.subtitle,
      baseAlcohol: r.base_alcohol,
      flavor: r.flavor,
      tags: r.tags,
      color: r.color,
      imagePath: r.image_path,
      ingredients: [...r.cocktail_ingredients]
        .sort((a, b) => a.position - b.position)
        // The catalogue link rides along so an edit in the app keeps it (ADR-029).
        .map((i) => ({
          name: i.name,
          amount: Number(i.amount),
          unit: i.unit,
          icon: i.icon,
          ingredientId: i.ingredient_id ?? undefined,
        })),
      instructions: r.instructions,
      garnish: r.garnish,
      glass: r.glass,
      vegan: r.vegan,
      note: r.note ?? "",
      isPublished: r.is_published,
    },
  };
}

/** Creates a recipe (no id) or edits the member's own. The slug is set once, at creation. */
export async function saveRecipe(writer: Writer, input: RecipeInput, id?: string): Promise<RecipeResult> {
  const recipe = cleanRecipeInput(input);
  if ("error" in recipe) return recipe;
  if (recipe.imagePath && !recipe.imagePath.startsWith(`${writer.id}/`)) return { error: "Fotoğraf okunamadı." };

  let previous: { slug: string; image_path: string | null } | null = null;
  if (id) {
    const { data } = await supabase.from("cocktails").select("slug, image_path").eq("id", id).eq("author_id", writer.id).maybeSingle();
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
  // short suffix and try again ("negroni" → "negroni-k3f"), as the site does.
  const base = slugify(recipe.name).slice(0, 60).replace(/-+$/, "") || "tarif";
  let slug = previous?.slug ?? base;
  let savedId: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase.rpc("save_recipe", { recipe: { ...fields, slug }, ingredients: toSavedIngredients(recipe.ingredients) });
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

  revalidateSite(recipePages(slug, writer.username));
  return { ok: true, id: savedId, slug };
}

export async function deleteRecipe(writer: Writer, id: string): Promise<RecipeResult> {
  const { data } = await supabase.from("cocktails").select("slug, image_path").eq("id", id).eq("author_id", writer.id).maybeSingle();
  if (!data) return { error: "Tarif bulunamadı." };

  const { error } = await supabase.from("cocktails").delete().eq("id", id).eq("author_id", writer.id);
  if (error) return { error: `Silinemedi: ${error.message}` };

  if (data.image_path) await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([data.image_path]);

  revalidateSite(recipePages(data.slug, writer.username));
  return { ok: true };
}

const MAX_WIDTH = 1600;
const MAX_BYTES = 1024 * 1024; // the bucket's limit

/**
 * Picks a photo from the gallery, scales it to at most 1600 px wide, encodes
 * WebP and uploads it to the member's folder under a fresh name (the site's
 * ImageField). Returns the new path, null when the member cancelled.
 */
export async function pickRecipePhoto(writer: Writer, slug: string | undefined): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  let body: ArrayBuffer | null = null;
  for (const compress of [0.8, 0.6, 0.4]) {
    let context = ImageManipulator.manipulate(asset.uri);
    // Both sides: on the web the manipulator does not work out a missing one (height 0).
    if (asset.width > MAX_WIDTH) {
      context = context.resize({ width: MAX_WIDTH, height: Math.round((asset.height * MAX_WIDTH) / asset.width) });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.WEBP, compress });
    body = await (await fetch(saved.uri)).arrayBuffer();
    if (body.byteLength <= MAX_BYTES) break;
  }
  if (!body || body.byteLength > MAX_BYTES) throw new Error("Fotoğraf çok büyük. Başka bir fotoğraf dene.");

  const name = `${writer.id}/${slug || "tarif"}-${Date.now().toString(36)}.webp`;
  const { error } = await supabase.storage
    .from(RECIPE_IMAGES_BUCKET)
    .upload(name, body, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw new Error("Yükleme başarısız.");
  return name;
}

/** Drops a photo uploaded in the form but never saved with the recipe. */
export async function discardRecipePhoto(path: string): Promise<void> {
  await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([path]);
}

/** Back to the screen before the recipe form, or to "Tariflerim" when it was opened directly. */
export function leaveRecipeForm() {
  if (router.canGoBack()) router.back();
  else router.replace("/my-recipes");
}
