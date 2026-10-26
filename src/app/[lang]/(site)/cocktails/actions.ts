"use server";

import { revalidateLocalized } from "@/lib/i18n/revalidate";
import { accountSession } from "@/lib/account";
import { REVIEW_MAX_LENGTH, REPORT_REASON_MAX_LENGTH, isValidRating } from "@/lib/community";
import { format } from "@/lib/i18n/format";
import { actionDictionary } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Database } from "@/lib/supabase/database.types";

// Reviews, favourites and reports (M4). The database is the rule (RLS, one
// review per person per cocktail, daily limits); these actions give friendly
// errors and revalidate the static pages that show the result (ADR-005).
// Like every action here, they never call redirect() (ADR-007).

export type CommunityResult = { ok?: boolean; error?: string };

async function member() {
  const t = await actionDictionary();
  const session = await accountSession();
  if (session.state === "signed-out") return { error: t.actions.signInFirst } as const;
  if (session.state === "onboarding") return { error: t.actions.profileFirst } as const;
  return session;
}

// A review or favourite changes an average or the feed's "popular" list:
// house recipes show on /cocktails and their own pages (ADR-025), members'
// recipes on theirs (M6).
function revalidateCommunityPages(username: string) {
  revalidateLocalized("/cocktails");
  revalidateLocalized("/cocktails/[slug]", "page");
  revalidateLocalized("/recipes/[slug]", "page");
  revalidateLocalized("/feed");
  revalidateLocalized(`/u/${username}`);
}

function writeError(message: string, t: Dictionary): string {
  if (message.includes("Daily review limit")) return t.actions.dailyReview;
  if (message.includes("Daily report limit")) return t.actions.dailyReport;
  return format(t.validation.saveFailed, { message });
}

/** Writes the member's review of a cocktail, or edits it: one per person per cocktail (ADR-012). */
export async function saveReview(cocktailId: string, rating: number, body: string): Promise<CommunityResult> {
  const t = await actionDictionary();
  if (!isValidRating(rating)) return { error: t.validation.ratingError };
  const text = body.trim();
  if (text.length > REVIEW_MAX_LENGTH) return { error: format(t.actions.reviewMax, { max: REVIEW_MAX_LENGTH }) };

  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  // An upsert would need UPDATE on cocktail_id and user_id, which members do
  // not have (column grants), so edit first and insert when nothing was there.
  const { data: updated, error: updateError } = await supabase
    .from("reviews")
    .update({ rating, body: text || null })
    .eq("cocktail_id", cocktailId)
    .eq("user_id", profile.id)
    .select("id");
  if (updateError) return { error: writeError(updateError.message, t) };

  if (!updated.length) {
    const { error } = await supabase
      .from("reviews")
      .insert({ cocktail_id: cocktailId, user_id: profile.id, rating, body: text || null });
    if (error) {
      if (error.code === "42501") return { error: t.actions.cannotReview };
      return { error: writeError(error.message, t) };
    }
  }

  revalidateCommunityPages(profile.username);
  return { ok: true };
}

export async function deleteReview(cocktailId: string): Promise<CommunityResult> {
  const t = await actionDictionary();
  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  const { error } = await supabase.from("reviews").delete().eq("cocktail_id", cocktailId).eq("user_id", profile.id);
  if (error) return { error: format(t.actions.deleteFailed, { message: error.message }) };

  revalidateCommunityPages(profile.username);
  return { ok: true };
}

export async function setFavorite(cocktailId: string, favorite: boolean): Promise<CommunityResult> {
  const t = await actionDictionary();
  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  const { error } = favorite
    ? await supabase.from("favorites").insert({ user_id: profile.id, cocktail_id: cocktailId })
    : await supabase.from("favorites").delete().eq("user_id", profile.id).eq("cocktail_id", cocktailId);
  // Saving twice (two tabs) is not an error.
  if (error && error.code !== "23505") return { error: format(t.validation.saveFailed, { message: error.message }) };

  revalidateLocalized(`/u/${profile.username}`);
  revalidateLocalized("/feed");
  return { ok: true };
}

type ReportTarget = Database["public"]["Enums"]["report_target"];

export type ReportableTarget = Extract<ReportTarget, "review" | "profile" | "drink_log" | "cocktail" | "log_comment" | "showcase_entry">;

/**
 * Reports a review, a profile, a public drink log, a member's recipe or a log
 * comment to the admins. Members cannot read reports back.
 */
export async function reportContent(
  targetType: ReportableTarget,
  targetId: string,
  reason: string
): Promise<CommunityResult> {
  const t = await actionDictionary();
  const text = reason.trim();
  if (text.length > REPORT_REASON_MAX_LENGTH) {
    return { error: format(t.actions.reasonMax, { max: REPORT_REASON_MAX_LENGTH }) };
  }

  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: profile.id, target_type: targetType, target_id: targetId, reason: text || null });
  if (error) {
    if (error.code === "23505") return { ok: true }; // already reported; once is enough
    return { error: writeError(error.message, t) };
  }
  return { ok: true };
}
