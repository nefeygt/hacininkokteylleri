// Drink logs (M8 step 4) — the site's account/logs/actions.ts for the app. The
// database is the rule (RLS, the recipe check function, 50 logs a day); these
// give the same friendly errors, then ask the site to refresh the member's
// public profile and the log's page (ADR-017, ADR-020).

import { RATING_ERROR, isValidRating } from "@shared/community";
import { LOG_NOTE_MAX_LENGTH, cleanRecipe, type LogRecipe } from "@shared/drink-log";
import { router } from "expo-router";
import type { Json } from "@shared/supabase/database.types";
import type { Writer } from "./community";
import type { Cocktail } from "./content";
import { revalidateSite } from "./revalidate";
import { supabase } from "./supabase";
import { format } from "@shared/i18n/format";
import { words } from "@/lib/i18n";

export type LogResult = { ok?: boolean; error?: string; id?: string };

/** The site's DrinkLogRow. */
export interface DrinkLog {
  id: string;
  user_id: string;
  cocktail_id: string | null;
  drunk_on: string;
  recipe: Json;
  rating: number | null;
  note: string | null;
  is_public: boolean;
  hidden_at: string | null;
  cocktails: { slug: string; is_published: boolean; author_id: string | null } | null;
}

export const LOG_COLUMNS =
  "id, user_id, cocktail_id, drunk_on, recipe, rating, note, is_public, hidden_at, cocktails(slug, is_published, author_id)";

export interface LogInput {
  cocktailId: string;
  drunkOn: string;
  recipe: unknown;
  rating: number | null;
  note: string;
  isPublic: boolean;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function writeError(code: string | undefined, message: string): string {
  if (message.includes("Daily drink log limit")) return words().t.actions.dailyLog;
  if (code === "23514") return words().t.actions.logInvalid;
  if (code === "42501") return words().t.actions.logNotAllowed;
  return format(words().t.validation.saveFailed, { message });
}

function logPages(username: string, id: string): string[] {
  return [`/u/${username}`, `/logs/${id}`];
}

/** The member's own logs, private and public, newest first (the site's /account/logs). */
export async function fetchMyLogs(memberId: string): Promise<DrinkLog[]> {
  const { data, error } = await supabase
    .from("drink_logs")
    .select(LOG_COLUMNS)
    .eq("user_id", memberId)
    .order("drunk_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data as DrinkLog[];
}

export async function fetchMyLog(memberId: string, id: string): Promise<DrinkLog | null> {
  const { data, error } = await supabase.from("drink_logs").select(LOG_COLUMNS).eq("id", id).eq("user_id", memberId).maybeSingle();
  if (error) throw new Error(error.message);
  return data as DrinkLog | null;
}

/**
 * A member's public, visible logs for their profile. The filters matter in the
 * app: the owner's own session could read their private logs too (RLS).
 */
export async function fetchPublicLogs(profileId: string): Promise<DrinkLog[]> {
  const { data, error } = await supabase
    .from("drink_logs")
    .select(LOG_COLUMNS)
    .eq("user_id", profileId)
    .eq("is_public", true)
    .is("hidden_at", null)
    .order("drunk_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data as DrinkLog[];
}

/** A house recipe as the starting snapshot of a new log. */
export function recipeOf(cocktail: Cocktail): LogRecipe {
  return {
    name: cocktail.name,
    ingredients: cocktail.ingredients.map((i) => ({ name: i.name, amount: i.amount, unit: i.unit, icon: i.iconType })),
    instructions: cocktail.instructions,
    garnish: cocktail.garnish || null,
    glass: cocktail.glass || null,
  };
}

/** Adds a log (no id) or edits the member's own log. */
export async function saveDrinkLog(writer: Writer, input: LogInput, id?: string): Promise<LogResult> {
  if (!DATE.test(input.drunkOn)) return { error: words().t.actions.pickDate };
  if (input.rating !== null && !isValidRating(input.rating)) return { error: RATING_ERROR };
  const note = input.note.trim();
  if (note.length > LOG_NOTE_MAX_LENGTH) return { error: `Not en fazla ${LOG_NOTE_MAX_LENGTH} karakter olabilir.` };
  const recipe = cleanRecipe(input.recipe);
  if ("error" in recipe) return recipe;

  const fields = {
    drunk_on: input.drunkOn,
    recipe,
    rating: input.rating,
    note: note || null,
    is_public: input.isPublic,
  };

  if (id) {
    const { data, error } = await supabase.from("drink_logs").update(fields).eq("id", id).eq("user_id", writer.id).select("id");
    if (error) return { error: writeError(error.code, error.message) };
    if (!data.length) return { error: words().t.actions.logNotFound };
  } else {
    const { data, error } = await supabase
      .from("drink_logs")
      .insert({ ...fields, user_id: writer.id, cocktail_id: input.cocktailId })
      .select("id")
      .single();
    if (error) return { error: writeError(error.code, error.message) };
    id = data.id;
  }

  revalidateSite(logPages(writer.username, id));
  return { ok: true, id };
}

export async function deleteDrinkLog(writer: Writer, id: string): Promise<LogResult> {
  const { error } = await supabase.from("drink_logs").delete().eq("id", id).eq("user_id", writer.id);
  if (error) return { error: `Silinemedi: ${error.message}` };

  revalidateSite(logPages(writer.username, id));
  return { ok: true };
}

/** "2026-10-15" moved by `days`, without a time-zone shift. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Back to the screen before a log form, or to the log list when it was opened directly (a link, the web). */
export function leave() {
  if (router.canGoBack()) router.back();
  else router.replace("/logs");
}
