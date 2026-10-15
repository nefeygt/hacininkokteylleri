"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { addLogComment, deleteLogComment } from "@/app/(site)/logs/actions";
import Avatar from "@/components/Avatar";
import ReportButton from "@/components/ReportButton";
import { useMember } from "@/components/useMember";
import { LOG_COMMENT_MAX_LENGTH } from "@/lib/community";
import { createClient } from "@/lib/supabase/browser";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  hidden_at: string | null;
  user_id: string;
  profiles: { username: string; display_name: string; avatar_path: string | null };
}

const COMMENT_COLUMNS = "id, body, created_at, hidden_at, user_id, profiles!inner(username, display_name, avatar_path)";
const SHOWN = 200;

function when(value: string) {
  return new Date(value).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

/**
 * The comment thread under a public drink log (M6, ADR-018), read in the
 * browser so the log page stays static. Any member comments; the log's author
 * replies in the same thread and may remove comments on their own log.
 */
export default function LogComments({ logId, ownerId }: { logId: string; ownerId: string }) {
  const { member } = useMember();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const memberId = member.state === "ok" ? member.id : null;

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("log_comments")
      .select(COMMENT_COLUMNS)
      .eq("log_id", logId)
      .order("created_at", { ascending: true })
      .limit(SHOWN);
    setComments((data as Comment[] | null) ?? []);
  }, [logId]);

  useEffect(() => {
    load();
  }, [load, memberId]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addLogComment(logId, body);
      if (result.error) {
        setError(result.error);
        return;
      }
      setBody("");
      await load();
    });
  }

  return (
    <section className="mt-8">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
        Yorumlar {comments && comments.length > 0 && <span className="text-text-muted/60">({comments.length})</span>}
      </h2>

      {comments === null ? (
        <p className="text-xs text-text-muted">Yükleniyor…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-text-muted">Henüz yorum yok.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isLogOwner={comment.user_id === ownerId}
              canDelete={memberId !== null && (memberId === comment.user_id || memberId === ownerId)}
              canReport={memberId !== null && memberId !== comment.user_id}
              onDeleted={load}
            />
          ))}
        </ul>
      )}

      <div className="mt-6">
        {member.state === "loading" ? null : member.state === "signed-out" ? (
          <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
            Yorum yazmak için{" "}
            <Link
              href={`/login?next=${encodeURIComponent(`/logs/${logId}`)}`}
              className="text-crimson-glow underline underline-offset-2"
            >
              giriş yap
            </Link>
            .
          </p>
        ) : member.state === "onboarding" ? (
          <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
            Yorum yazmak için önce{" "}
            <Link href="/welcome" className="text-crimson-glow underline underline-offset-2">
              profilini tamamla
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={send} className="rounded border border-border bg-bg-elevated/40 px-4 py-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={LOG_COMMENT_MAX_LENGTH}
              rows={2}
              aria-label="Yorum"
              placeholder={memberId === ownerId ? "Yanıt yaz…" : "Yorum yaz…"}
              className="w-full resize-y rounded border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-crimson-glow/40"
            />
            {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="mt-2 rounded bg-crimson px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Gönderiliyor…" : "Gönder"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function CommentItem({
  comment,
  isLogOwner,
  canDelete,
  canReport,
  onDeleted,
}: {
  comment: Comment;
  isLogOwner: boolean;
  canDelete: boolean;
  canReport: boolean;
  onDeleted: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteLogComment(comment.id);
      if (result.error) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      await onDeleted();
    });
  }

  return (
    <li className={`flex gap-3 ${comment.hidden_at ? "opacity-60" : ""}`}>
      <Link href={`/u/${comment.profiles.username}`} className="shrink-0">
        <Avatar path={comment.profiles.avatar_path} name={comment.profiles.display_name} size={30} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/u/${comment.profiles.username}`} className="text-sm font-semibold text-text-primary hover:text-crimson-glow">
            {comment.profiles.display_name}
          </Link>
          {isLogOwner && (
            <span className="rounded bg-crimson/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-crimson-glow">
              kayıt sahibi
            </span>
          )}
          <span className="font-mono text-[10px] text-text-muted">{when(comment.created_at)}</span>
        </div>
        <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{comment.body}</p>
        {comment.hidden_at && (
          <p className="mt-1 font-mono text-[11px] text-crimson-glow">
            Bu yorum yöneticiler tarafından gizlendi; yalnızca sen görüyorsun.
          </p>
        )}
        {error && <p className="mt-1 font-mono text-[11px] text-crimson-glow">{error}</p>}
        {(canDelete || canReport) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            {canDelete && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className={`font-mono text-[10px] underline underline-offset-2 hover:text-crimson-glow ${
                  confirming ? "text-crimson-glow" : "text-text-muted"
                }`}
              >
                {confirming ? "Emin misin? Evet, sil" : "Sil"}
              </button>
            )}
            {canReport && <ReportButton targetType="log_comment" targetId={comment.id} />}
          </div>
        )}
      </div>
    </li>
  );
}
