"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { SLUG_PATTERN } from "@/lib/slug";
import { COCKTAIL_IMAGES_BUCKET } from "@/lib/supabase/config";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { CocktailInput } from "./types";

// Public pages that show content. Every write revalidates them, so an edit is
// live on the site at once instead of within the hour (ADR-005).
function revalidatePublicPages() {
  revalidatePath("/kokteyller");
}

export type ActionResult = { error?: string; id?: string };

// ---------------------------------------------------------------- session

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "E-posta ve şifre gerekli." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-posta ya da şifre hatalı." };

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}

// ---------------------------------------------------------------- cocktails

function validate(input: CocktailInput): string | null {
  if (!input.name.trim()) return "Kokteylin bir adı olmalı.";
  if (!SLUG_PATTERN.test(input.slug)) {
    return "Kısa ad yalnızca küçük harf, rakam ve tire içerebilir (ör. kuzu-kulagi-sour).";
  }
  if (!input.baseAlcohol.trim()) return "Baz alkol boş olamaz.";
  if (!input.flavor.trim()) return "Baskın tat boş olamaz.";
  if (!/^#[0-9a-fA-F]{6}$/.test(input.color)) return "Renk #RRGGBB biçiminde olmalı.";
  if (input.ingredients.length === 0) return "En az bir malzeme ekle.";
  for (const [i, ing] of input.ingredients.entries()) {
    const n = i + 1;
    if (!ing.name.trim()) return `${n}. malzemenin adı boş.`;
    if (!(ing.amount > 0 && ing.amount < 10000)) return `${n}. malzemenin miktarı 0'dan büyük olmalı.`;
    if (Math.round(ing.amount * 100) !== ing.amount * 100) {
      return `${n}. malzemenin miktarında en fazla iki ondalık olabilir.`;
    }
    if (!ing.unit.trim()) return `${n}. malzemenin birimi boş.`;
    if (!Constants.public.Enums.ingredient_icon.includes(ing.icon)) return `${n}. malzemenin simgesi geçersiz.`;
  }
  if (input.instructions.filter((s) => s.trim()).length === 0) return "En az bir hazırlanış adımı ekle.";
  if (!Number.isInteger(input.sortOrder)) return "Sıra bir tam sayı olmalı.";
  return null;
}

export async function saveCocktail(input: CocktailInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const problem = validate(input);
  if (problem) return { error: problem };

  let previousImage: string | null = null;
  if (input.id) {
    const { data } = await supabase.from("cocktails").select("image_path").eq("id", input.id).single();
    previousImage = data?.image_path ?? null;
  }

  const { data: id, error } = await supabase.rpc("save_cocktail", {
    cocktail: {
      id: input.id ?? null,
      slug: input.slug,
      name: input.name.trim(),
      subtitle: input.subtitle.trim(),
      base_alcohol: input.baseAlcohol.trim(),
      flavor: input.flavor.trim(),
      tags: input.tags.map((t) => t.trim()).filter(Boolean),
      color: input.color,
      image_path: input.imagePath,
      instructions: input.instructions.map((s) => s.trim()).filter(Boolean),
      garnish: input.garnish.trim(),
      glass: input.glass.trim(),
      vegan: input.vegan,
      note: input.note.trim(),
      sort_order: input.sortOrder,
      is_published: input.isPublished,
    },
    ingredients: input.ingredients.map((i) => ({
      name: i.name.trim(),
      amount: i.amount,
      unit: i.unit.trim(),
      icon: i.icon,
    })),
  });

  if (error) {
    if (error.code === "23505") return { error: "Bu kısa ad başka bir kokteylde kullanılıyor." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }

  // The old photo is no longer referenced; images are never overwritten in place (ADR-006).
  if (previousImage && previousImage !== input.imagePath) {
    await supabase.storage.from(COCKTAIL_IMAGES_BUCKET).remove([previousImage]);
  }

  revalidatePublicPages();
  revalidatePath("/admin", "layout");
  return { id: id ?? undefined };
}

export async function setPublished(id: string, published: boolean): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("cocktails").update({ is_published: published }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePublicPages();
  revalidatePath("/admin", "layout");
  return {};
}

export async function deleteCocktail(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("cocktails").select("image_path").eq("id", id).single();

  const { error } = await supabase.from("cocktails").delete().eq("id", id);
  if (error) return { error: error.message };

  if (data?.image_path) {
    await supabase.storage.from(COCKTAIL_IMAGES_BUCKET).remove([data.image_path]);
  }

  revalidatePublicPages();
  revalidatePath("/admin", "layout");
  redirect("/");
}

// ---------------------------------------------------------------- glossary

export async function saveGlossaryTerm(
  originalTerm: string | null,
  term: string,
  definition: string
): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  term = term.trim();
  definition = definition.trim();
  if (!term || !definition) return { error: "Terim ve açıklama boş olamaz." };

  const { error } = originalTerm
    ? await supabase.from("glossary_terms").update({ term, definition }).eq("term", originalTerm)
    : await supabase.from("glossary_terms").insert({ term, definition });

  if (error) {
    if (error.code === "23505") return { error: "Bu terim zaten sözlükte var." };
    return { error: error.message };
  }

  revalidatePublicPages();
  revalidatePath("/admin/sozluk");
  return {};
}

export async function deleteGlossaryTerm(term: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("glossary_terms").delete().eq("term", term);
  if (error) return { error: error.message };
  revalidatePublicPages();
  revalidatePath("/admin/sozluk");
  return {};
}
