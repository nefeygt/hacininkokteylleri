"use client";

import Link from "@/components/LocaleLink";
import { useCallback, useEffect, useState, useTransition } from "react";
import { addLogComment, deleteLogComment, editLogComment } from "@/app/[lang]/(site)/logs/actions";
import Avatar from "@/components/Avatar";
import ReportButton from "@/components/ReportButton";
import { useMember } from "@/components/useMember";
import { LOG_COMMENT_MAX_LENGTH } from "@/lib/community";
import { createClient } from "@/lib/supabase/browser";
import { INTL_LOCALES, type Locale } from "@/lib/i18n/locales";
import { useLocale } from "@/components/LocaleProvider";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  hidden_at: string | null;
  user_id: string;
  profiles: { username: string; display_name: string; avatar_path: string | null };
}

const COMMENT_COLUMNS = "id, body, created_at, edited_at, hidden_at, user_id, profiles!inner(username, display_name, avatar_path)";
const SHOWN = 200;

function when(value: string, locale: Locale) {
  return new Date(value).toLocaleString(INTL_LOCALES[locale], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

/**
 * The comment thread under a public drink log (M6, ADR-018), read in the
 * browser so the log page stays static. Any member comments; the log's author
 * replies in the same thread and may remove comments on their own log.
 */
export default function LogComments({ logId, ownerId }: { logId: string; ownerId: string }) {
  const { t } = useLocale();
  const tl = t.logComments;
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
        {tl.heading} {comments && comments.length > 0 && <span className="text-text-muted">({comments.length})</span>}
      </h2>

      {comments === null ? (
        <p className="text-xs text-text-muted">{t.common.loading}</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-text-muted">{tl.none}</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isLogOwner={comment.user_id === ownerId}
              canDelete={memberId !== null && (memberId === comment.user_id || memberId === ownerId)}
              canEdit={memberId !== null && memberId === comment.user_id && !comment.hidden_at}
              canReport={memberId !== null && memberId !== comment.user_id}
              onDeleted={load}
            />
          ))}
        </ul>
      )}

      <div className="mt-6">
        {member.state === "loading" ? null : member.state === "signed-out" ? (
          <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
            {tl.signInPrefix}
            <Link
              href={`/login?next=${encodeURIComponent(`/logs/${logId}`)}`}
              className="text-crimson-glow underline underline-offset-2"
            >
              {t.common.signIn}
            </Link>
            .
          </p>
        ) : member.state === "onboarding" ? (
          <p className="rounded bg-bg-elevated/50 px-4 py-3 text-xs text-text-secondary">
            {tl.finishPrefix}
            <Link href="/welcome" className="text-crimson-glow underline underline-offset-2">
              {t.common.completeProfile}
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
              aria-label={tl.comment}
              placeholder={memberId === ownerId ? tl.replyPlaceholder : tl.commentPlaceholder}
              className="w-full resize-y rounded border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-crimson-glow/40"
            />
            {error && <p className="mt-2 text-xs text-crimson-glow">{error}</p>}
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="mt-2 rounded bg-crimson px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? t.common.sending : t.common.send}
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
  canEdit,
  canReport,
  onDeleted,
}: {
  comment: Comment;
  isLogOwner: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canReport: boolean;
  onDeleted: () => Promise<void>;
}) {
  const { t, locale } = useLocale();
  const tl = t.logComments;
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
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

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await editLogComment(comment.id, draft);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
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
              {tl.owner}
            </span>
          )}
          <span className="font-mono text-[10px] text-text-muted">
            {when(comment.created_at, locale)}
            {comment.edited_at && <span title={when(comment.edited_at, locale)}>{tl.edited}</span>}
          </span>
        </div>
        {editing ? (
          <form onSubmit={save} className="mt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={LOG_COMMENT_MAX_LENGTH}
              rows={2}
              aria-label={tl.editLabel}
              autoFocus
              className="w-full resize-y rounded border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-crimson-glow/40"
            />
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="submit"
                disabled={pending || !draft.trim() || draft.trim() === comment.body}
                className="rounded bg-crimson px-3 py-1 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {pending ? t.common.saving : t.common.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.body);
                  setError(null);
                }}
                className="font-mono text-[10px] text-text-muted underline underline-offset-2 hover:text-text-primary"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{comment.body}</p>
        )}
        {comment.hidden_at && (
          <p className="mt-1 font-mono text-[11px] text-crimson-glow">
            {tl.hiddenOwn}
          </p>
        )}
        {error && <p className="mt-1 font-mono text-[11px] text-crimson-glow">{error}</p>}
        {!editing && (canDelete || canEdit || canReport) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-4">
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-mono text-[10px] text-text-muted underline underline-offset-2 hover:text-crimson-glow"
              >
                {t.common.edit}
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className={`font-mono text-[10px] underline underline-offset-2 hover:text-crimson-glow ${
                  confirming ? "text-crimson-glow" : "text-text-muted"
                }`}
              >
                {confirming ? t.common.confirmDelete : t.common.delete}
              </button>
            )}
            {canReport && <ReportButton targetType="log_comment" targetId={comment.id} />}
          </div>
        )}
      </div>
    </li>
  );
}
