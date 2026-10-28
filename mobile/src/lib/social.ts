// Follows, one public log and its comments, and the logs of the people you
// follow (M8 step 5) — the site's u/actions.ts, logs/actions.ts, FollowButton,
// LogComments and FollowingLogs for the app. The database is the rule (RLS,
// no self-follows, 200 follows and 100 comments a day; comments only on
// visible public logs; ADR-018).

import { LOG_COMMENT_MAX_LENGTH } from "@shared/community";
import type { Writer } from "./community";
import { LOG_COLUMNS, type DrinkLog } from "./drink-logs";
import { revalidateSite } from "./revalidate";
import { supabase } from "./supabase";
import { format } from "@shared/i18n/format";
import { words } from "@/lib/i18n";

export type SocialResult = { ok?: boolean; error?: string };

// ---------------------------------------------------------------- follows

export async function isFollowing(memberId: string, profileId: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", memberId)
    .eq("followee_id", profileId)
    .maybeSingle();
  return Boolean(data);
}

/** Follows or unfollows; both profiles' counts are on static pages, so both are revalidated. */
export async function setFollow(writer: Writer, followee: { id: string; username: string }, follow: boolean): Promise<SocialResult> {
  if (followee.id === writer.id) return { error: words().t.actions.followSelf };
  const { error } = follow
    ? await supabase.from("follows").insert({ follower_id: writer.id, followee_id: followee.id })
    : await supabase.from("follows").delete().eq("follower_id", writer.id).eq("followee_id", followee.id);
  // Following twice (the site and the app) is not an error.
  if (error && error.code !== "23505") {
    if (error.message.includes("Daily follow limit")) return { error: words().t.actions.dailyFollow };
    return { error: `Kaydedilemedi: ${error.message}` };
  }
  revalidateSite([`/u/${followee.username}`, `/u/${writer.username}`]);
  return { ok: true };
}

// ---------------------------------------------------------------- public logs

/** A log with its author, as the feed and the log screen show it. */
export type AuthoredLog = DrinkLog & { profiles: { username: string; display_name: string; avatar_path: string | null } };

const AUTHORED_LOG_COLUMNS = `${LOG_COLUMNS}, profiles!inner(username, display_name, avatar_path)`;

/**
 * One public, visible log with its author, or null (the site's /logs/{id}).
 * The filters matter: the owner's own session reads private and hidden logs.
 */
export async function fetchPublicLog(id: string): Promise<AuthoredLog | null> {
  const { data, error } = await supabase
    .from("drink_logs")
    .select(AUTHORED_LOG_COLUMNS)
    .eq("id", id)
    .eq("is_public", true)
    .is("hidden_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AuthoredLog | null;
}

/** How many comments each log has (the feed's and the profile's "Yorumlar (n)"). */
export async function countComments(logIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (logIds.length === 0) return counts;
  const { data } = await supabase.from("log_comments").select("log_id").in("log_id", logIds).is("hidden_at", null);
  for (const c of data ?? []) counts.set(c.log_id, (counts.get(c.log_id) ?? 0) + 1);
  return counts;
}

/** The latest public logs of the people the member follows (the feed's "Takip ettiklerinden"). */
export async function fetchFollowingLogs(memberId: string): Promise<{ followsNobody: boolean; logs: AuthoredLog[]; counts: Map<string, number> }> {
  const { data: follows, error } = await supabase.from("follows").select("followee_id").eq("follower_id", memberId).limit(1000);
  if (error) throw new Error(error.message);
  const ids = follows.map((f) => f.followee_id);
  if (ids.length === 0) return { followsNobody: true, logs: [], counts: new Map() };

  const { data, error: logsError } = await supabase
    .from("drink_logs")
    .select(AUTHORED_LOG_COLUMNS)
    .in("user_id", ids)
    .eq("is_public", true)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (logsError) throw new Error(logsError.message);
  const logs = data as AuthoredLog[];
  return { followsNobody: false, logs, counts: await countComments(logs.map((l) => l.id)) };
}

// ---------------------------------------------------------------- comments

export interface LogComment {
  id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
  user_id: string;
  profiles: { username: string; display_name: string; avatar_path: string | null };
}

const COMMENT_COLUMNS = "id, body, created_at, hidden_at, user_id, profiles!inner(username, display_name, avatar_path)";

/** The thread, oldest first. A commenter also reads their own hidden comments (RLS), marked as such. */
export async function fetchComments(logId: string): Promise<LogComment[]> {
  const { data, error } = await supabase
    .from("log_comments")
    .select(COMMENT_COLUMNS)
    .eq("log_id", logId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return data as LogComment[];
}

export async function addComment(writer: Writer, logId: string, body: string): Promise<SocialResult> {
  const text = body.trim();
  if (!text) return { error: words().t.actions.writeSomething };
  if (text.length > LOG_COMMENT_MAX_LENGTH) return { error: `Yorum en fazla ${LOG_COMMENT_MAX_LENGTH} karakter olabilir.` };

  const { error } = await supabase.from("log_comments").insert({ log_id: logId, user_id: writer.id, body: text });
  if (error) {
    if (error.message.includes("Daily comment limit")) return { error: words().t.actions.dailyComment };
    if (error.code === "42501") return { error: words().t.actions.cannotCommentLog };
    return { error: format(words().t.actions.sendFailed, { message: error.message }) };
  }
  // Comments are read in the browser on the site, so no page needs refreshing.
  return { ok: true };
}

export async function deleteComment(id: string): Promise<SocialResult> {
  const { data, error } = await supabase.from("log_comments").delete().eq("id", id).select("id");
  if (error) return { error: `Silinemedi: ${error.message}` };
  if (!data.length) return { error: words().t.actions.cannotDeleteComment };
  return { ok: true };
}

/** "15 Ekim 21:40". */
export function formatCommentTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
