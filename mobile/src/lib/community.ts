// Reviews, favourites and reports (M8 step 3) — the site's cocktails/actions.ts
// for the app. The database is the rule (RLS, one review per person per
// cocktail, daily limits); these give the same friendly errors, then ask the
// site to refresh the static pages that show the result (ADR-020).

import { RATING_ERROR, REPORT_REASON_MAX_LENGTH, REVIEW_MAX_LENGTH, isValidRating } from "@shared/community";
import type { Database } from "@shared/supabase/database.types";
import { revalidateSite } from "./revalidate";
import { supabase } from "./supabase";
import { format } from "@shared/i18n/format";
import { words } from "@/lib/i18n";

export type CommunityResult = { ok?: boolean; error?: string };

/** Who is writing: the member's id and username (the session's "ok" state). */
export interface Writer {
  id: string;
  username: string;
}

/** The pages a review or favourite changes — the site's revalidateCommunityPages(). */
function communityPages(username: string): string[] {
  return ["/cocktails", "/recipes/[slug]", "/feed", `/u/${username}`];
}

function writeError(message: string): string {
  if (message.includes("Daily review limit")) return words().t.actions.dailyReview;
  if (message.includes("Daily report limit")) return words().t.actions.dailyReport;
  return format(words().t.validation.saveFailed, { message });
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  updated_at: string;
  hidden_at: string | null;
  user_id: string;
  profiles: { username: string; display_name: string; avatar_path: string | null };
}

const REVIEW_COLUMNS = "id, rating, body, updated_at, hidden_at, user_id, profiles!inner(username, display_name, avatar_path)";
const SHOWN = 50;

/** The visible reviews of a cocktail (newest first) and the member's own, which may be hidden. */
export async function fetchReviews(cocktailId: string, memberId: string | null): Promise<{ reviews: Review[]; own: Review | null }> {
  const [list, mine] = await Promise.all([
    supabase
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("cocktail_id", cocktailId)
      .is("hidden_at", null)
      .order("updated_at", { ascending: false })
      .limit(SHOWN),
    memberId
      ? supabase.from("reviews").select(REVIEW_COLUMNS).eq("cocktail_id", cocktailId).eq("user_id", memberId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (list.error) throw new Error(list.error.message);
  return { reviews: (list.data as Review[] | null) ?? [], own: (mine.data as Review | null) ?? null };
}

/** Writes the member's review of a cocktail, or edits it: one per person per cocktail (ADR-012). */
export async function saveReview(writer: Writer, cocktailId: string, rating: number, body: string): Promise<CommunityResult> {
  if (!isValidRating(rating)) return { error: RATING_ERROR };
  const text = body.trim();
  if (text.length > REVIEW_MAX_LENGTH) return { error: `Yorum en fazla ${REVIEW_MAX_LENGTH} karakter olabilir.` };

  // Members have no UPDATE on cocktail_id and user_id (column grants), so no
  // upsert: edit first and insert when nothing was there (as the site does).
  const { data: updated, error: updateError } = await supabase
    .from("reviews")
    .update({ rating, body: text || null })
    .eq("cocktail_id", cocktailId)
    .eq("user_id", writer.id)
    .select("id");
  if (updateError) return { error: writeError(updateError.message) };

  if (!updated.length) {
    const { error } = await supabase
      .from("reviews")
      .insert({ cocktail_id: cocktailId, user_id: writer.id, rating, body: text || null });
    if (error) {
      if (error.code === "42501") return { error: words().t.actions.cannotReview };
      return { error: writeError(error.message) };
    }
  }

  revalidateSite(communityPages(writer.username));
  return { ok: true };
}

export async function deleteReview(writer: Writer, cocktailId: string): Promise<CommunityResult> {
  const { error } = await supabase.from("reviews").delete().eq("cocktail_id", cocktailId).eq("user_id", writer.id);
  if (error) return { error: `Silinemedi: ${error.message}` };

  revalidateSite(communityPages(writer.username));
  return { ok: true };
}

export async function setFavorite(writer: Writer, cocktailId: string, favorite: boolean): Promise<CommunityResult> {
  const { error } = favorite
    ? await supabase.from("favorites").insert({ user_id: writer.id, cocktail_id: cocktailId })
    : await supabase.from("favorites").delete().eq("user_id", writer.id).eq("cocktail_id", cocktailId);
  // Saving twice (the site and the app) is not an error.
  if (error && error.code !== "23505") return { error: `Kaydedilemedi: ${error.message}` };

  revalidateSite([`/u/${writer.username}`, "/feed"]);
  return { ok: true };
}

type ReportTarget = Database["public"]["Enums"]["report_target"];

export type ReportableTarget = Extract<ReportTarget, "review" | "profile" | "drink_log" | "cocktail" | "log_comment" | "showcase_entry">;

/** Reports something to the admins. Members cannot read reports back. */
export async function reportContent(writer: Writer, targetType: ReportableTarget, targetId: string, reason: string): Promise<CommunityResult> {
  const text = reason.trim();
  if (text.length > REPORT_REASON_MAX_LENGTH) {
    return { error: format(words().t.actions.reasonMax, { max: REPORT_REASON_MAX_LENGTH }) };
  }

  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: writer.id, target_type: targetType, target_id: targetId, reason: text || null });
  if (error) {
    if (error.code === "23505") return { ok: true }; // already reported; once is enough
    return { error: writeError(error.message) };
  }
  return { ok: true };
}

/** "15 Ekim 2026". */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
