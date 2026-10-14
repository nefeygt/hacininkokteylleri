"use server";

import { accountSession } from "@/lib/account";
import { LOG_COMMENT_MAX_LENGTH } from "@/lib/community";

// Comments under public drink logs (M6, ADR-018): a flat thread where the
// log's author replies. The database is the rule (RLS: only on visible public
// logs; the commenter, the log's author and admins delete; 100 a day).
// Comments are read in the browser, so nothing is revalidated.

export type CommentResult = { ok?: boolean; error?: string };

export async function addLogComment(logId: string, body: string): Promise<CommentResult> {
  const text = body.trim();
  if (!text) return { error: "Bir şey yaz." };
  if (text.length > LOG_COMMENT_MAX_LENGTH) return { error: `Yorum en fazla ${LOG_COMMENT_MAX_LENGTH} karakter olabilir.` };

  const session = await accountSession();
  if (session.state === "signed-out") return { error: "Yorum yazmak için giriş yapmalısın." };
  if (session.state === "onboarding") return { error: "Önce profilini tamamla." };
  const { supabase, profile } = session;

  const { error } = await supabase.from("log_comments").insert({ log_id: logId, user_id: profile.id, body: text });
  if (error) {
    if (error.message.includes("Daily comment limit")) return { error: "Bugün yeterince yorum yazdın. Yarın tekrar dene." };
    if (error.code === "42501") return { error: "Bu kayda yorum yazılamaz." };
    return { error: `Gönderilemedi: ${error.message}` };
  }
  return { ok: true };
}

export async function deleteLogComment(id: string): Promise<CommentResult> {
  const session = await accountSession();
  if (session.state !== "ok") return { error: "Oturumun sona ermiş. Sayfayı yenileyip tekrar giriş yap." };

  const { data, error } = await session.supabase.from("log_comments").delete().eq("id", id).select("id");
  if (error) return { error: `Silinemedi: ${error.message}` };
  if (!data.length) return { error: "Bu yorumu silemezsin." };
  return { ok: true };
}
