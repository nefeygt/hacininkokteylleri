"use server";

import { revalidateLocalized } from "@/lib/i18n/revalidate";
import { accountSession } from "@/lib/account";
import { format } from "@/lib/i18n/format";
import { actionDictionary } from "@/lib/i18n/server";

// Follows (M6, ADR-018): public, Letterboxd-style. The database is the rule
// (RLS, no self-follows, 200 a day); this action gives friendly errors and
// revalidates both profiles, whose follower counts are part of the static page.

export type FollowResult = { ok?: boolean; error?: string };

export async function setFollow(followeeId: string, follow: boolean): Promise<FollowResult> {
  const dict = await actionDictionary();
  const t = dict.actions;
  const session = await accountSession();
  if (session.state === "signed-out") return { error: t.followSignIn };
  if (session.state === "onboarding") return { error: t.profileFirst };
  const { supabase, profile } = session;
  if (followeeId === profile.id) return { error: t.followSelf };

  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: profile.id, followee_id: followeeId })
    : await supabase.from("follows").delete().eq("follower_id", profile.id).eq("followee_id", followeeId);
  // Following twice (two tabs) is not an error.
  if (error && error.code !== "23505") {
    if (error.message.includes("Daily follow limit")) return { error: t.dailyFollow };
    return { error: format(dict.validation.saveFailed, { message: error.message }) };
  }

  const { data: followee } = await supabase.from("profiles").select("username").eq("id", followeeId).maybeSingle();
  if (followee) revalidateLocalized(`/u/${followee.username}`, "layout");
  revalidateLocalized(`/u/${profile.username}`, "layout");
  return { ok: true };
}
