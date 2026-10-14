"use server";

import { revalidatePath } from "next/cache";
import { accountSession } from "@/lib/account";

// Follows (M6, ADR-018): public, Letterboxd-style. The database is the rule
// (RLS, no self-follows, 200 a day); this action gives friendly errors and
// revalidates both profiles, whose follower counts are part of the static page.

export type FollowResult = { ok?: boolean; error?: string };

export async function setFollow(followeeId: string, follow: boolean): Promise<FollowResult> {
  const session = await accountSession();
  if (session.state === "signed-out") return { error: "Takip etmek için giriş yapmalısın." };
  if (session.state === "onboarding") return { error: "Önce profilini tamamla." };
  const { supabase, profile } = session;
  if (followeeId === profile.id) return { error: "Kendini takip edemezsin." };

  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: profile.id, followee_id: followeeId })
    : await supabase.from("follows").delete().eq("follower_id", profile.id).eq("followee_id", followeeId);
  // Following twice (two tabs) is not an error.
  if (error && error.code !== "23505") {
    if (error.message.includes("Daily follow limit")) return { error: "Bugün yeterince kişiyi takip ettin. Yarın tekrar dene." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }

  const { data: followee } = await supabase.from("profiles").select("username").eq("id", followeeId).maybeSingle();
  if (followee) revalidatePath(`/u/${followee.username}`);
  revalidatePath(`/u/${profile.username}`);
  return { ok: true };
}
