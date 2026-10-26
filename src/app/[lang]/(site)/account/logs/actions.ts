"use server";

import { revalidateLocalized } from "@/lib/i18n/revalidate";
import { accountSession } from "@/lib/account";
import { isValidRating } from "@/lib/community";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { actionDictionary } from "@/lib/i18n/server";
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

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function writeError(code: string | undefined, message: string, t: Dictionary): string {
  if (message.includes("Daily drink log limit")) return t.actions.dailyLog;
  if (code === "23514") return t.actions.logInvalid;
  if (code === "42501") return t.actions.logNotAllowed;
  return format(t.validation.saveFailed, { message });
}

/** Adds a log (no id) or edits the member's own log. */
export async function saveDrinkLog(input: LogInput, id?: string): Promise<LogResult> {
  const t = await actionDictionary();
  if (!DATE.test(input.drunkOn)) return { error: t.actions.pickDate };
  if (input.rating !== null && !isValidRating(input.rating)) return { error: t.validation.ratingError };
  const note = input.note.trim();
  if (note.length > LOG_NOTE_MAX_LENGTH) return { error: format(t.validation.noteMax, { max: LOG_NOTE_MAX_LENGTH }) };
  const recipe = cleanRecipe(input.recipe, t.validation);
  if ("error" in recipe) return recipe;

  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
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
    if (error) return { error: writeError(error.code, error.message, t) };
    if (!data.length) return { error: t.actions.logNotFound };
  } else {
    const { data, error } = await supabase
      .from("drink_logs")
      .insert({ ...fields, user_id: profile.id, cocktail_id: input.cocktailId })
      .select("id")
      .single();
    if (error) return { error: writeError(error.code, error.message, t) };
    id = data.id;
  }

  revalidateLocalized(`/u/${profile.username}`);
  revalidateLocalized(`/logs/${id}`);
  return { ok: true, id };
}

export async function deleteDrinkLog(id: string): Promise<LogResult> {
  const t = await actionDictionary();
  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, profile } = session;

  const { error } = await supabase.from("drink_logs").delete().eq("id", id).eq("user_id", profile.id);
  if (error) return { error: format(t.actions.deleteFailed, { message: error.message }) };

  revalidateLocalized(`/u/${profile.username}`);
  revalidateLocalized(`/logs/${id}`);
  return { ok: true };
}

/** Whether new logs start public. Existing logs keep their own setting. */
export async function setLogsPublicDefault(isPublic: boolean): Promise<LogResult> {
  const t = await actionDictionary();
  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, user } = session;

  const { error } = await supabase
    .from("account_settings")
    .update({ logs_public_default: isPublic })
    .eq("user_id", user.id);
  if (error) return { error: format(t.validation.saveFailed, { message: error.message }) };
  return { ok: true };
}

/** Whether unread notifications are e-mailed as a digest (ADR-031). */
export async function setEmailNotifications(on: boolean): Promise<LogResult> {
  const t = await actionDictionary();
  const session = await accountSession();
  if (session.state !== "ok") return { error: t.actions.sessionLost };
  const { supabase, user } = session;

  const { error } = await supabase.from("account_settings").update({ email_notifications: on }).eq("user_id", user.id);
  if (error) return { error: format(t.validation.saveFailed, { message: error.message }) };
  return { ok: true };
}
