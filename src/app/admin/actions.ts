"use server";

import { revalidatePath } from "next/cache";
import { adminSession } from "@/lib/admin";
import { BRAND } from "@/lib/brand";
import { SLUG_PATTERN } from "@/lib/slug";
import { COCKTAIL_IMAGES_BUCKET } from "@/lib/supabase/config";
import { Constants } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { CocktailInput } from "./types";

// Public pages that show content. Every write revalidates them, so an edit is
// live on the site at once instead of within the hour (ADR-005).
function revalidatePublicPages() {
  revalidatePath("/cocktails");
}

export type ActionResult = { error?: string; id?: string; ok?: boolean };

// These actions never call redirect(). Next.js renders an action's redirect
// target internally, bypassing src/proxy.ts, so on the admin host "/" came back
// as the public home page. The caller navigates instead (ADR-007).

const SESSION_LOST = "Oturumun sona ermiş. Sayfayı yenileyip tekrar giriş yap.";

/** The signed-in admin's client, or null when the session is not a 2FA admin session. */
async function adminClient() {
  const session = await adminSession();
  return session.state === "ok" ? session.supabase : null;
}

// ---------------------------------------------------------------- session

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "E-posta ve şifre gerekli." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-posta ya da şifre hatalı." };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------- two-factor (ADR-011)

const WRONG_CODE = "Kod doğru değil ya da süresi geçti. Uygulamadaki güncel kodu gir.";

/** Creates a TOTP factor and returns its QR code. Only for an admin who has none yet. */
export async function startTotpEnrollment(): Promise<
  { error: string } | { factorId: string; qrCode: string; secret: string }
> {
  const session = await adminSession();
  if (session.state !== "enroll") return { error: "Bu hesap için iki adımlı doğrulama kurulamaz." };
  const { supabase } = session;

  // A half-finished setup from an earlier visit would block a new one.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Yönetim paneli ${Date.now().toString(36)}`,
    issuer: BRAND,
  });
  if (error) return { error: `QR kodu oluşturulamadı: ${error.message}` };

  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Confirms the new factor with its first code; the session becomes aal2. */
export async function verifyTotpEnrollment(factorId: string, code: string): Promise<ActionResult> {
  const session = await adminSession();
  if (session.state !== "enroll") return { ok: true };

  const { error } = await session.supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
  if (error) return { error: WRONG_CODE };
  return { ok: true };
}

/** The code screen on every later sign-in. */
export async function verifyTotp(formData: FormData): Promise<ActionResult> {
  const session = await adminSession();
  if (session.state === "ok") return { ok: true };
  if (session.state !== "verify") return { error: SESSION_LOST };

  const { data: factors } = await session.supabase.auth.mfa.listFactors();
  const factor = factors?.totp[0];
  if (!factor) return { error: SESSION_LOST };

  const code = String(formData.get("code") ?? "").trim();
  const { error } = await session.supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return { error: WRONG_CODE };
  return { ok: true };
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
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

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
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { error } = await supabase.from("cocktails").update({ is_published: published }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePublicPages();
  revalidatePath("/admin", "layout");
  return {};
}

export async function deleteCocktail(id: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { data } = await supabase.from("cocktails").select("image_path").eq("id", id).single();

  const { error } = await supabase.from("cocktails").delete().eq("id", id);
  if (error) return { error: error.message };

  if (data?.image_path) {
    await supabase.storage.from(COCKTAIL_IMAGES_BUCKET).remove([data.image_path]);
  }

  revalidatePublicPages();
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// ---------------------------------------------------------------- glossary

export async function saveGlossaryTerm(
  originalTerm: string | null,
  term: string,
  definition: string
): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
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
  revalidatePath("/admin/glossary");
  return {};
}

export async function deleteGlossaryTerm(term: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { error } = await supabase.from("glossary_terms").delete().eq("term", term);
  if (error) return { error: error.message };
  revalidatePublicPages();
  revalidatePath("/admin/glossary");
  return {};
}

// ---------------------------------------------------------------- moderation (M4)

// Hiding is a column guarded by private.guard_moderation(), which also writes
// hidden_by; the author still sees the row, marked hidden (ADR-014).

export async function setReviewHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { data, error } = await supabase
    .from("reviews")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id)
    .select("profiles(username)")
    .maybeSingle();
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  revalidatePublicPages();
  if (data?.profiles) revalidatePath(`/u/${data.profiles.username}`);
  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function setProfileHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { data, error } = await supabase
    .from("profiles")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id)
    .select("username")
    .maybeSingle();
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  // A hidden profile's reviews leave the averages too (cocktail_ratings).
  revalidatePublicPages();
  if (data) revalidatePath(`/u/${data.username}`);
  revalidatePath("/admin/moderation");
  return { ok: true };
}

export async function setDrinkLogHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { data, error } = await supabase
    .from("drink_logs")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id)
    .select("profiles(username)")
    .maybeSingle();
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  if (data?.profiles) revalidatePath(`/u/${data.profiles.username}`);
  revalidatePath(`/logs/${id}`);
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Hides or shows a member's recipe (M6); its page, the feed and the author's profile follow. */
export async function setRecipeHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { data, error } = await supabase
    .from("cocktails")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id)
    .not("author_id", "is", null)
    .select("slug, profiles!cocktails_author_id_fkey(username)")
    .maybeSingle();
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  if (data) revalidatePath(`/recipes/${data.slug}`);
  if (data?.profiles) revalidatePath(`/u/${data.profiles.username}`);
  revalidatePath("/feed");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Hides or shows a comment under a drink log (M6); comments are read in the browser. */
export async function setLogCommentHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { error } = await supabase
    .from("log_comments")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  revalidatePath("/admin/moderation");
  return { ok: true };
}

/** Closes a report; resolved_by is written by the database. */
export async function resolveReport(id: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { error } = await supabase.from("reports").update({ resolved_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: `Kaydedilemedi: ${error.message}` };

  revalidatePath("/admin/moderation");
  return { ok: true };
}
