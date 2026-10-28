// Follows, one public log and its comments, and the logs of the people you
// follow (M8 step 5) — the site's u/actions.ts, logs/actions.ts, FollowButton,
// LogComments and FollowingLogs for the app. The database is the rule (RLS,
// no self-follows, 200 follows and 100 comments a day; comments only on
// visible public logs; ADR-018).

import { INTL_LOCALES, type Locale } from "@shared/i18n/locales";
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
    return { error: format(words().t.validation.saveFailed, { message: error.message }) };
  }
  revalidateSite([`/u/${followee.username}`, `/u/${writer.username}`]);
  return { ok: true };
}

export type FollowListKind = "followers" | "following";

export interface FollowPerson {
  username: string;
  display_name: string;
  avatar_path: string | null;
  bio: string | null;
}

/** How many people a list shows; the screen says when there are more (the site's FollowList). */
const FOLLOW_LIST_SHOWN = 200;

/** A profile's followers or the people they follow, newest follow first; hidden profiles left out (RLS). */
export async function fetchFollowList(profileId: string, kind: FollowListKind): Promise<{ people: FollowPerson[]; total: number }> {
  const columns = "username, display_name, avatar_path, bio";
  const query =
    kind === "followers"
      ? supabase
          .from("follows")
          .select(`created_at, person:profiles!follows_follower_id_fkey (${columns})`, { count: "exact" })
          .eq("followee_id", profileId)
      : supabase
          .from("follows")
          .select(`created_at, person:profiles!follows_followee_id_fkey (${columns})`, { count: "exact" })
          .eq("follower_id", profileId);
  const { data, count, error } = await query.order("created_at", { ascending: false }).limit(FOLLOW_LIST_SHOWN);
  if (error) throw new Error(error.message);
  const people = (data as unknown as { person: FollowPerson | null }[]).flatMap((row) => (row.person ? [row.person] : []));
  return { people, total: count ?? people.length };
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
  edited_at: string | null;
  hidden_at: string | null;
  user_id: string;
  profiles: { username: string; display_name: string; avatar_path: string | null };
}

const COMMENT_COLUMNS = "id, body, created_at, edited_at, hidden_at, user_id, profiles!inner(username, display_name, avatar_path)";

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
  const invalid = checkComment(text);
  if (invalid) return { error: invalid };

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
  if (error) return { error: format(words().t.actions.deleteFailed, { message: error.message }) };
  if (!data.length) return { error: words().t.actions.cannotDeleteComment };
  return { ok: true };
}

/**
 * The commenter edits their own visible comment; the database stamps
 * `edited_at` and the policy refuses anyone else (or a hidden comment).
 */
export async function editComment(id: string, body: string): Promise<SocialResult> {
  const text = body.trim();
  const invalid = checkComment(text);
  if (invalid) return { error: invalid };

  const { data, error } = await supabase.from("log_comments").update({ body: text }).eq("id", id).select("id");
  if (error) return { error: format(words().t.validation.saveFailed, { message: error.message }) };
  if (!data.length) return { error: words().t.actions.cannotEditComment };
  return { ok: true };
}

function checkComment(text: string): string | null {
  if (!text) return words().t.actions.writeSomething;
  if (text.length > LOG_COMMENT_MAX_LENGTH) return format(words().t.actions.commentMax, { max: LOG_COMMENT_MAX_LENGTH });
  return null;
}

/** "15 Ekim 21:40". */
export function formatCommentTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(INTL_LOCALES[locale], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
