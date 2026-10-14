"use server";

import { revalidatePath } from "next/cache";
import { accountSession } from "@/lib/account";
import { PITCH_MAX_LENGTH } from "@/lib/showcase";

// The showcase (M7, ADR-019). The database is the rule (RLS: one application per
// member per period, only their own published recipe with a photo, votes only
// on approved entries while the period is open); these actions give friendly
// errors and revalidate the feed, whose vote counts are part of the static page.
// Like every action here, they never call redirect() (ADR-007).

export type ShowcaseResult = { ok?: boolean; error?: string };

async function member() {
  const session = await accountSession();
  if (session.state === "signed-out") return { error: "Bunun için giriş yapmalısın." } as const;
  if (session.state === "onboarding") return { error: "Önce profilini tamamla." } as const;
  return session;
}

function revalidateShowcase() {
  revalidatePath("/feed");
  revalidatePath("/");
}

export async function applyToShowcase(periodId: string, cocktailId: string, pitch: string): Promise<ShowcaseResult> {
  const text = pitch.trim();
  if (!text) return { error: "Tarifini neden vitrinde görmek istediğini birkaç cümleyle anlat." };
  if (text.length > PITCH_MAX_LENGTH) return { error: `Tanıtım en fazla ${PITCH_MAX_LENGTH} karakter olabilir.` };

  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  const { error } = await supabase
    .from("showcase_entries")
    .insert({ period_id: periodId, cocktail_id: cocktailId, user_id: profile.id, pitch: text });
  if (error) {
    if (error.code === "23505") return { error: "Bu döneme zaten başvurdun." };
    if (error.code === "42501") {
      return { error: "Başvurulamadı: tarif yayında ve fotoğraflı olmalı, dönem de bitmemiş olmalı." };
    }
    return { error: `Kaydedilemedi: ${error.message}` };
  }
  return { ok: true };
}

/** Withdraws the member's own application; its votes go with it. */
export async function withdrawShowcaseEntry(entryId: string): Promise<ShowcaseResult> {
  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  const { error } = await supabase.from("showcase_entries").delete().eq("id", entryId).eq("user_id", profile.id);
  if (error) return { error: `Geri çekilemedi: ${error.message}` };
  revalidateShowcase();
  return { ok: true };
}

/** Upvotes an entry or takes the vote back: once per member per entry, their own included (ADR-014). */
export async function setShowcaseVote(entryId: string, vote: boolean): Promise<ShowcaseResult> {
  const session = await member();
  if ("error" in session) return session;
  const { supabase, profile } = session;

  const { error } = vote
    ? await supabase.from("showcase_votes").insert({ entry_id: entryId, user_id: profile.id })
    : await supabase.from("showcase_votes").delete().eq("entry_id", entryId).eq("user_id", profile.id);
  // Voting twice (two tabs) is not an error.
  if (error && error.code !== "23505") {
    if (error.code === "42501") return { error: "Oylama şu an kapalı." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }
  revalidatePath("/feed");
  return { ok: true };
}
