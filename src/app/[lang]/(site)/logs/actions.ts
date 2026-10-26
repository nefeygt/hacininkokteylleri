"use server";

import { accountSession } from "@/lib/account";
import { LOG_COMMENT_MAX_LENGTH } from "@/lib/community";
import { format } from "@/lib/i18n/format";
import { actionDictionary } from "@/lib/i18n/server";

// Comments under public drink logs (M6, ADR-018): a flat thread where the
// log's author replies. The database is the rule (RLS: only on visible public
// logs; the commenter, the log's author and admins delete; the commenter edits; 100 a day).
// Comments are read in the browser, so nothing is revalidated.

export type CommentResult = { ok?: boolean; error?: string };

export async function addLogComment(logId: string, body: string): Promise<CommentResult> {
  const t = (await actionDictionary()).actions;
  const text = body.trim();
  if (!text) return { error: t.writeSomething };
  if (text.length > LOG_COMMENT_MAX_LENGTH) return { error: format(t.commentMax, { max: LOG_COMMENT_MAX_LENGTH }) };

  const session = await accountSession();
  if (session.state === "signed-out") return { error: t.commentSignIn };
  if (session.state === "onboarding") return { error: t.profileFirst };
  const { supabase, profile } = session;

  const { error } = await supabase.from("log_comments").insert({ log_id: logId, user_id: profile.id, body: text });
  if (error) {
    if (error.message.includes("Daily comment limit")) return { error: t.dailyComment };
    if (error.code === "42501") return { error: t.cannotCommentLog };
    return { error: format(t.sendFailed, { message: error.message }) };
  }
  return { ok: true };
}

export async function deleteLogComment(id: string): Promise<CommentResult> {
  const t = (await actionDictionary()).actions;
  const session = await accountSession();
  if (session.state !== "ok") return { error: t.sessionLost };

  const { data, error } = await session.supabase.from("log_comments").delete().eq("id", id).select("id");
  if (error) return { error: format(t.deleteFailed, { message: error.message }) };
  if (!data.length) return { error: t.cannotDeleteComment };
  return { ok: true };
}

export async function editLogComment(id: string, body: string): Promise<CommentResult> {
  const dict = await actionDictionary();
  const t = dict.actions;
  const text = body.trim();
  if (!text) return { error: t.writeSomething };
  if (text.length > LOG_COMMENT_MAX_LENGTH) return { error: format(t.commentMax, { max: LOG_COMMENT_MAX_LENGTH }) };

  const session = await accountSession();
  if (session.state !== "ok") return { error: t.sessionLost };

  const { data, error } = await session.supabase.from("log_comments").update({ body: text }).eq("id", id).select("id");
  if (error) return { error: format(dict.validation.saveFailed, { message: error.message }) };
  if (!data.length) return { error: t.cannotEditComment };
  return { ok: true };
}
