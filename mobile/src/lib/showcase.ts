// The showcase (M8 step 6) — the site's feed/actions.ts and the browser reads of
// ShowcaseEntries and ShowcaseApply for the app. The database is the rule (RLS:
// one application per member per period, only their own published recipe with
// a photo, votes only on approved entries while the period is open; ADR-019);
// these give the same friendly errors and refresh the site's feed and home page.

import { PITCH_MAX_LENGTH } from "@shared/showcase";
import type { Database } from "@shared/supabase/database.types";
import type { Writer } from "./community";
import { revalidateSite } from "./revalidate";
import { supabase } from "./supabase";

export type ShowcaseResult = { ok?: boolean; error?: string };

export type ShowcaseStatus = Database["public"]["Enums"]["showcase_status"];

/** The member's own application in a period, whatever its status. */
export interface MyEntry {
  id: string;
  status: ShowcaseStatus;
  pitch: string;
  cocktails: { name: string; slug: string } | null;
}

/** A recipe the member may apply with: their own, published, visible, with a photo. */
export interface Eligible {
  id: string;
  name: string;
}

/** The member's application in the period (or null) and the recipes they could apply with. */
export async function fetchMyApplication(periodId: string, memberId: string): Promise<{ mine: MyEntry | null; eligible: Eligible[] }> {
  const [entry, recipes] = await Promise.all([
    supabase
      .from("showcase_entries")
      .select("id, status, pitch, cocktails(name, slug)")
      .eq("period_id", periodId)
      .eq("user_id", memberId)
      .maybeSingle(),
    supabase
      .from("cocktails")
      .select("id, name")
      .eq("author_id", memberId)
      .eq("is_published", true)
      .is("hidden_at", null)
      .not("image_path", "is", null)
      .order("created_at", { ascending: false }),
  ]);
  if (entry.error) throw new Error(entry.error.message);
  if (recipes.error) throw new Error(recipes.error.message);
  return { mine: entry.data as MyEntry | null, eligible: recipes.data };
}

/** Which of these entries the member voted for — votes are private, a voter reads only theirs. */
export async function fetchMyVotes(memberId: string, entryIds: string[]): Promise<Set<string>> {
  if (entryIds.length === 0) return new Set();
  const { data } = await supabase.from("showcase_votes").select("entry_id").eq("user_id", memberId).in("entry_id", entryIds);
  return new Set((data ?? []).map((v) => v.entry_id));
}

export async function applyToShowcase(writer: Writer, periodId: string, cocktailId: string, pitch: string): Promise<ShowcaseResult> {
  const text = pitch.trim();
  if (!text) return { error: "Tarifini neden vitrinde görmek istediğini birkaç cümleyle anlat." };
  if (text.length > PITCH_MAX_LENGTH) return { error: `Tanıtım en fazla ${PITCH_MAX_LENGTH} karakter olabilir.` };

  const { error } = await supabase
    .from("showcase_entries")
    .insert({ period_id: periodId, cocktail_id: cocktailId, user_id: writer.id, pitch: text });
  if (error) {
    if (error.code === "23505") return { error: "Bu döneme zaten başvurdun." };
    if (error.code === "42501") return { error: "Başvurulamadı: tarif yayında ve fotoğraflı olmalı, dönem de bitmemiş olmalı." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }
  // A pending application is on no static page, so nothing to refresh (as on the site).
  return { ok: true };
}

/** Withdraws the member's own application; its votes go with it. */
export async function withdrawShowcaseEntry(writer: Writer, entryId: string): Promise<ShowcaseResult> {
  const { error } = await supabase.from("showcase_entries").delete().eq("id", entryId).eq("user_id", writer.id);
  if (error) return { error: `Geri çekilemedi: ${error.message}` };
  revalidateSite(["/feed", "/"]);
  return { ok: true };
}

/** Upvotes an entry or takes the vote back: once per member per entry, their own included (ADR-014). */
export async function setShowcaseVote(writer: Writer, entryId: string, vote: boolean): Promise<ShowcaseResult> {
  const { error } = vote
    ? await supabase.from("showcase_votes").insert({ entry_id: entryId, user_id: writer.id })
    : await supabase.from("showcase_votes").delete().eq("entry_id", entryId).eq("user_id", writer.id);
  // Voting twice (the site and the app) is not an error.
  if (error && error.code !== "23505") {
    if (error.code === "42501") return { error: "Oylama şu an kapalı." };
    return { error: `Kaydedilemedi: ${error.message}` };
  }
  revalidateSite(["/feed"]);
  return { ok: true };
}
