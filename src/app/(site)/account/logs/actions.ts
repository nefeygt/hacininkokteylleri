"use server";

import { revalidatePath } from "next/cache";
import { accountSession } from "@/lib/account";
import { LOG_NOTE_MAX_LENGTH, cleanRecipe } from "@/lib/drink-log";

// Drink logs (M5). The database is the rule (RLS, the recipe check function,
// 50 logs a day); these actions give friendly errors and revalidate the
// member's public profile, where public logs show (ADR-016). Like every
// action here, they never call redirect() (ADR-007).

export type LogResult = { ok?: boolean; error?: string; id?: string };

export interface LogInput {
  cocktailId: string;
  drunkOn: string;
  recipe: unknown;
  rating: number | null;
  note: string;
  isPublic: boolean;
}

const SESSION_LOST = "Oturumun sona ermiş. Sayfayı yenileyip tekrar giriş yap.";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function writeError(code: string | undefined, message: string): string {
  if (message.includes("Daily drink log limit")) return "Bugün yeterince kayıt ekledin. Yarın tekrar dene.";
  if (code === "23514") return "Kayıt geçersiz: tarihi ve tarifi kontrol et.";
  if (code === "42501") return "Bu kokteyl için kayıt eklenemez.";
  return `Kaydedilemedi: ${message}`;
}

/** Adds a log (no id) or edits the member's own log. */
export async function saveDrinkLog(input: LogInput, id?: string): Promise<LogResult> {
  if (!DATE.test(input.drunkOn)) return { error: "Geçerli bir tarih seç." };
  if (input.rating !== null && (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)) {
    return { error: "Puan 1 ile 5 arasında olmalı." };
  }
  const note = input.note.trim();
  if (note.length > LOG_NOTE_MAX_LENGTH) return { error: `Not en fazla ${LOG_NOTE_MAX_LENGTH} karakter olabilir.` };
  const recipe = cleanRecipe(input.recipe);
  if ("error" in recipe) return recipe;

  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, profile } = session;

  const fields = {
    drunk_on: input.drunkOn,
    recipe,
    rating: input.rating,
    note: note || null,
    is_public: input.isPublic,
  };

  if (id) {
    const { data, error } = await supabase
      .from("drink_logs")
      .update(fields)
      .eq("id", id)
      .eq("user_id", profile.id)
      .select("id");
    if (error) return { error: writeError(error.code, error.message) };
    if (!data.length) return { error: "Kayıt bulunamadı." };
  } else {
    const { data, error } = await supabase
      .from("drink_logs")
      .insert({ ...fields, user_id: profile.id, cocktail_id: input.cocktailId })
      .select("id")
      .single();
    if (error) return { error: writeError(error.code, error.message) };
    id = data.id;
  }

  revalidatePath(`/u/${profile.username}`);
  revalidatePath(`/logs/${id}`);
  return { ok: true, id };
}

export async function deleteDrinkLog(id: string): Promise<LogResult> {
  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, profile } = session;

  const { error } = await supabase.from("drink_logs").delete().eq("id", id).eq("user_id", profile.id);
  if (error) return { error: `Silinemedi: ${error.message}` };

  revalidatePath(`/u/${profile.username}`);
  revalidatePath(`/logs/${id}`);
  return { ok: true };
}

/** Whether new logs start public. Existing logs keep their own setting. */
export async function setLogsPublicDefault(isPublic: boolean): Promise<LogResult> {
  const session = await accountSession();
  if (session.state !== "ok") return { error: SESSION_LOST };
  const { supabase, user } = session;

  const { error } = await supabase
    .from("account_settings")
    .update({ logs_public_default: isPublic })
    .eq("user_id", user.id);
  if (error) return { error: `Kaydedilemedi: ${error.message}` };
  return { ok: true };
}
