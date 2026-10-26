"use server";

import { revalidatePath } from "next/cache";
import { revalidateLocalized } from "@/lib/i18n/revalidate";
import { adminSession } from "@/lib/admin";
import { BRAND } from "@/lib/brand";
import { CATALOGUE_NAME_MAX, type IngredientCategory } from "@/lib/ingredients";
import { periodBounds, type PeriodLength } from "@/lib/showcase";
import { SLUG_PATTERN } from "@/lib/slug";
import { COCKTAIL_IMAGES_BUCKET } from "@/lib/supabase/config";
import { Constants, type Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { PANEL_LOCALE_NAMES, PANEL_LOCALE_OF, TRANSLATED_LOCALES, type TranslatedLocale } from "./translations";
import type { CocktailInput } from "./types";

// Public pages that show content. Every write revalidates them, so an edit is
// live on the site at once instead of within the hour (ADR-005).
function revalidatePublicPages() {
  revalidateLocalized("/cocktails");
  revalidateLocalized("/cocktails/[slug]", "page");
  revalidateLocalized("/cocktails/spirit/[slug]", "page");
  revalidateLocalized("/cocktails/flavor/[slug]", "page");
  revalidateLocalized("/what-can-i-make");
  revalidateLocalized("/glossary");
}

export type ActionResult = { error?: string; id?: string; ok?: boolean };

type ShowcaseStatus = Database["public"]["Enums"]["showcase_status"];

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
    if (!ing.ingredientId) return `${n}. malzeme için katalogdan bir malzeme seç.`;
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
      ingredient_id: i.ingredientId,
    })),
  });

  if (error) {
    if (error.code === "23505") return { error: "Bu kısa ad başka bir kokteylde kullanılıyor." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }

  if (id) {
    const problem = await saveCocktailTranslations(supabase, id, input);
    if (problem) return { error: problem, id };
  }

  // The old photo is no longer referenced; images are never overwritten in place (ADR-006).
  if (previousImage && previousImage !== input.imagePath) {
    await supabase.storage.from(COCKTAIL_IMAGES_BUCKET).remove([previousImage]);
  }

  revalidatePublicPages();
  revalidatePath("/admin", "layout");
  return { id: id ?? undefined };
}

type AdminClient = NonNullable<Awaited<ReturnType<typeof adminClient>>>;

/**
 * Writes the recipe's other languages (ADR-032): one row per language, deleted when every field is empty, so
 * the site falls back to Turkish. Ingredient names are stored by position, steps without the empty lines.
 */
async function saveCocktailTranslations(supabase: AdminClient, id: string, input: CocktailInput): Promise<string | null> {
  for (const locale of TRANSLATED_LOCALES) {
    const t = input.translations[locale];
    const names = input.ingredients.map((i) => i.translatedNames[locale].trim());
    const row = {
      cocktail_id: id,
      locale,
      name: t.name.trim() || null,
      subtitle: t.subtitle.trim(),
      base_alcohol: t.baseAlcohol.trim(),
      flavor: t.flavor.trim(),
      tags: t.tags.map((tag) => tag.trim()).filter(Boolean),
      garnish: t.garnish.trim(),
      glass: t.glass.trim(),
      note: t.note.trim() || null,
      instructions: t.instructions.map((step) => step.trim()).filter(Boolean),
      ingredient_names: names.some(Boolean) ? names : [],
    };
    const empty =
      !row.name && !row.subtitle && !row.base_alcohol && !row.flavor && row.tags.length === 0 && !row.garnish &&
      !row.glass && !row.note && row.instructions.length === 0 && row.ingredient_names.length === 0;
    const { error } = empty
      ? await supabase.from("cocktail_translations").delete().eq("cocktail_id", id).eq("locale", locale)
      : await supabase.from("cocktail_translations").upsert(row, { onConflict: "cocktail_id,locale" });
    if (error) return `Türkçe kaydedildi, ${PANEL_LOCALE_OF[locale]} kaydedilemedi: ${error.message}`;
  }
  return null;
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

/** A glossary term in another language: the word to underline there and its tooltip. */
export type TermTranslation = { term: string; definition: string };

export async function saveGlossaryTerm(
  originalTerm: string | null,
  term: string,
  definition: string,
  translations: Record<TranslatedLocale, TermTranslation>
): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  term = term.trim();
  definition = definition.trim();
  if (!term || !definition) return { error: "Terim ve açıklama boş olamaz." };
  for (const locale of TRANSLATED_LOCALES) {
    const t = translations[locale];
    if (!t.term.trim() !== !t.definition.trim()) {
      return { error: `${PANEL_LOCALE_NAMES[locale]} terim ve açıklama birlikte doldurulmalı (ya da ikisi de boş).` };
    }
  }

  const { error } = originalTerm
    ? await supabase.from("glossary_terms").update({ term, definition }).eq("term", originalTerm)
    : await supabase.from("glossary_terms").insert({ term, definition });

  if (error) {
    if (error.code === "23505") return { error: "Bu terim zaten sözlükte var." };
    return { error: error.message };
  }

  // A renamed term's translations followed it (on update cascade).
  for (const locale of TRANSLATED_LOCALES) {
    const t = translations[locale];
    const { error: txError } = t.term.trim()
      ? await supabase
          .from("glossary_term_translations")
          .upsert({ term, locale, translated_term: t.term.trim(), definition: t.definition.trim() }, { onConflict: "term,locale" })
      : await supabase.from("glossary_term_translations").delete().eq("term", term).eq("locale", locale);
    if (txError) return { error: `Türkçe kaydedildi, ${PANEL_LOCALE_OF[locale]} kaydedilemedi: ${txError.message}` };
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

// ---------------------------------------------------------------- ingredient catalogue (ADR-029)

export async function saveCatalogueIngredient(
  id: string | null,
  name: string,
  category: IngredientCategory,
  alwaysAtHand: boolean,
  translations: Record<TranslatedLocale, string>
): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  name = name.trim();
  if (!name) return { error: "Malzemenin bir adı olmalı." };
  if (name.length > CATALOGUE_NAME_MAX) return { error: `Ad en fazla ${CATALOGUE_NAME_MAX} karakter olabilir.` };
  if (!Constants.public.Enums.ingredient_category.includes(category)) return { error: "Grup geçersiz." };

  for (const locale of TRANSLATED_LOCALES) {
    if (translations[locale].trim().length > CATALOGUE_NAME_MAX) {
      return { error: `${PANEL_LOCALE_OF[locale]} en fazla ${CATALOGUE_NAME_MAX} karakter olabilir.` };
    }
  }

  const row = { name, category, always_at_hand: alwaysAtHand };
  const { data, error } = id
    ? await supabase.from("ingredients").update(row).eq("id", id).select("id").single()
    : await supabase.from("ingredients").insert(row).select("id").single();

  if (error) {
    if (error.code === "23505") return { error: "Bu malzeme katalogda zaten var." };
    return { error: error.message };
  }

  for (const locale of TRANSLATED_LOCALES) {
    const translated = translations[locale].trim();
    const { error: txError } = translated
      ? await supabase
          .from("ingredient_translations")
          .upsert({ ingredient_id: data.id, locale, name: translated }, { onConflict: "ingredient_id,locale" })
      : await supabase.from("ingredient_translations").delete().eq("ingredient_id", data.id).eq("locale", locale);
    if (txError) return { error: `Türkçe kaydedildi, ${PANEL_LOCALE_OF[locale]} kaydedilemedi: ${txError.message}` };
  }

  revalidatePublicPages();
  revalidatePath("/admin/ingredients");
  return {};
}

export async function deleteCatalogueIngredient(id: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { error } = await supabase.from("ingredients").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") return { error: "Bu malzeme tariflerde kullanılıyor; önce tariflerden çıkar." };
    return { error: error.message };
  }
  revalidatePublicPages();
  revalidatePath("/admin/ingredients");
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
  if (data?.profiles) revalidateLocalized(`/u/${data.profiles.username}`);
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

  // A hidden profile's reviews leave the averages too (cocktail_ratings), and
  // its recipes the feed and the home page's showcase winner.
  revalidatePublicPages();
  revalidateLocalized("/feed");
  revalidateLocalized("/");
  if (data) revalidateLocalized(`/u/${data.username}`);
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

  if (data?.profiles) revalidateLocalized(`/u/${data.profiles.username}`);
  revalidateLocalized(`/logs/${id}`);
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

  if (data) revalidateLocalized(`/recipes/${data.slug}`);
  if (data?.profiles) revalidateLocalized(`/u/${data.profiles.username}`);
  revalidateLocalized("/feed");
  revalidateLocalized("/");
  revalidateLocalized("/what-can-i-make");
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

// ---------------------------------------------------------------- showcase (M7)

// Periods, approval and hiding are admin-only in the database (RLS, aal2); the
// winner is derived from the votes, never written (ADR-014, ADR-019). The feed
// shows the open period and the home page the latest winner, so both follow.
function revalidateShowcase() {
  revalidateLocalized("/feed");
  revalidateLocalized("/");
  revalidatePath("/admin/showcase");
}

/** Opens a period: a week or a month from midnight (Turkey) on the chosen day. */
export async function createShowcasePeriod(startDate: string, length: PeriodLength): Promise<ActionResult> {
  const bounds = periodBounds(startDate, length);
  if (!bounds) return { error: "Geçerli bir başlangıç tarihi seç." };
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };

  const { error } = await supabase.from("showcase_periods").insert({ starts_at: bounds.startsAt, ends_at: bounds.endsAt });
  if (error) {
    if (error.code === "23P01") return { error: "Bu tarihler başka bir dönemle çakışıyor." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }
  revalidateShowcase();
  return { ok: true };
}

/** Deletes a period with its applications and votes. */
export async function deleteShowcasePeriod(id: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { error } = await supabase.from("showcase_periods").delete().eq("id", id);
  if (error) return { error: `Silinemedi: ${error.message}` };
  revalidateShowcase();
  return { ok: true };
}

/** Approves or rejects an application (or puts it back to pending); reviewed_by is written by the database. */
export async function setShowcaseEntryStatus(id: string, status: ShowcaseStatus): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { error } = await supabase.from("showcase_entries").update({ status }).eq("id", id);
  if (error) return { error: `Kaydedilemedi: ${error.message}` };
  revalidateShowcase();
  return { ok: true };
}

/** Hides or shows an application, e.g. after a report. */
export async function setShowcaseEntryHidden(id: string, hidden: boolean): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: SESSION_LOST };
  const { error } = await supabase
    .from("showcase_entries")
    .update({ hidden_at: hidden ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: `Kaydedilemedi: ${error.message}` };
  revalidateShowcase();
  revalidatePath("/admin/moderation");
  return { ok: true };
}
