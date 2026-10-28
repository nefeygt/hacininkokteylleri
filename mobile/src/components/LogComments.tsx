import { LOG_COMMENT_MAX_LENGTH } from "@shared/community";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import type { Writer } from "@/lib/community";
import { useSession } from "@/lib/session";
import { addComment, deleteComment, editComment, fetchComments, formatCommentTime, type LogComment } from "@/lib/social";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import Avatar from "./Avatar";
import { Button, Message } from "./Form";
import ReportButton from "./ReportButton";
import { Body, Label, Mono } from "./Type";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

/**
 * The comment thread under a public drink log (the site's LogComments, ADR-018).
 * Any member comments; the log's author replies in the same thread, marked
 * "kayıt sahibi", and may remove comments on their own log.
 */
export default function LogComments({ logId, ownerId }: { logId: string; ownerId: string }) {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();
  const writer: Writer | null = session.state === "ok" ? { id: session.profile.id, username: session.profile.username } : null;
  const memberId = writer?.id ?? null;
  const [comments, setComments] = useState<LogComment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    try {
      setComments(await fetchComments(logId));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [logId]);

  // Again when the member changes: their own hidden comments become readable.
  useEffect(() => {
    load();
  }, [load, memberId]);

  async function send() {
    if (!writer) return;
    Keyboard.dismiss();
    setError(null);
    setPending(true);
    const result = await addComment(writer, logId, body);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setBody("");
    await load();
  }

  return (
    <View style={styles.section}>
      <Label style={styles.title}>
        {t.logComments.heading} {comments && comments.length > 0 ? <Label style={styles.count}>({comments.length})</Label> : null}
      </Label>

      {failed ? (
        <Pressable onPress={load}>
          <Mono style={styles.muted}>{a.load.comments}</Mono>
        </Pressable>
      ) : comments === null ? (
        <Mono style={styles.muted}>{t.common.loading}</Mono>
      ) : comments.length === 0 ? (
        <Mono style={styles.muted}>{t.logComments.none}</Mono>
      ) : (
        <View style={styles.list}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isLogOwner={comment.user_id === ownerId}
              canDelete={memberId !== null && (memberId === comment.user_id || memberId === ownerId)}
              canEdit={memberId !== null && memberId === comment.user_id && !comment.hidden_at}
              onChanged={load}
            />
          ))}
        </View>
      )}

      <View style={styles.compose}>
        {session.state === "loading" ? null : !writer ? (
          <View style={styles.prompt}>
            <Mono style={styles.promptText}>
              {session.state === "onboarding" ? `${t.logComments.finishPrefix}${t.common.completeProfile}.` : `${t.logComments.signInPrefix}${t.common.signIn}.`}
            </Mono>
            <Button
              kind="secondary"
              title={session.state === "onboarding" ? a.account.completeProfile : t.login.signIn}
              onPress={() => askToSignIn({ pathname: "/log/[id]", params: { id: logId } })}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              value={body}
              onChangeText={setBody}
              maxLength={LOG_COMMENT_MAX_LENGTH}
              multiline
              placeholder={memberId === ownerId ? t.logComments.replyPlaceholder : t.logComments.commentPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel={t.logComments.comment}
              style={styles.input}
            />
            {error && <Message error>{error}</Message>}
            <View style={styles.send}>
              <Button title={pending ? t.common.sending : t.common.send} onPress={send} pending={pending} disabled={!body.trim()} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function CommentItem({
  comment,
  isLogOwner,
  canDelete,
  canEdit,
  onChanged,
}: {
  comment: LogComment;
  isLogOwner: boolean;
  canDelete: boolean;
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const { t, a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const profile = comment.profiles;
  const openProfile = () => router.push({ pathname: "/u/[username]", params: { username: profile.username } });

  async function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setPending(true);
    const result = await deleteComment(comment.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      setConfirming(false);
      return;
    }
    await onChanged();
  }

  async function save() {
    Keyboard.dismiss();
    setError(null);
    setPending(true);
    const result = await editComment(comment.id, draft);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    await onChanged();
  }

  function cancel() {
    setEditing(false);
    setDraft(comment.body);
    setError(null);
  }

  return (
    <View style={[styles.item, comment.hidden_at ? styles.hidden : null]}>
      <Pressable onPress={openProfile} accessibilityRole="link" accessibilityLabel={format(a.profile.of, { name: profile.display_name })}>
        <Avatar path={profile.avatar_path} name={profile.display_name} size={30} />
      </Pressable>
      <View style={styles.itemBody}>
        <View style={styles.itemHead}>
          <Pressable onPress={openProfile} accessibilityRole="link">
            <Body style={styles.name}>{profile.display_name}</Body>
          </Pressable>
          {isLogOwner && (
            <View style={styles.ownerBadge}>
              <Label style={styles.ownerText}>{t.logComments.owner}</Label>
            </View>
          )}
          <Mono style={styles.time}>
            {formatCommentTime(comment.created_at, locale)}
            {comment.edited_at ? t.logComments.edited : ""}
          </Mono>
        </View>
        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              maxLength={LOG_COMMENT_MAX_LENGTH}
              multiline
              autoFocus
              accessibilityLabel={t.logComments.editLabel}
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
            />
            <View style={styles.editActions}>
              <Button
                title={pending ? t.common.saving : t.common.save}
                onPress={save}
                pending={pending}
                disabled={!draft.trim() || draft.trim() === comment.body}
              />
              <Pressable onPress={cancel} disabled={pending} hitSlop={6} accessibilityRole="button">
                <Mono style={styles.action}>{t.common.cancel}</Mono>
              </Pressable>
            </View>
          </View>
        ) : (
          <Body style={styles.text}>{comment.body}</Body>
        )}
        {comment.hidden_at && (
          <Mono style={styles.hiddenNote}>{t.logComments.hiddenOwn}</Mono>
        )}
        {error && <Message error>{error}</Message>}
        {!editing && (
        <View style={styles.actions}>
          {canEdit && (
            <Pressable onPress={() => setEditing(true)} hitSlop={6} accessibilityRole="button">
              <Mono style={styles.action}>{t.common.edit}</Mono>
            </Pressable>
          )}
          {canDelete && (
            <Pressable
              onPress={remove}
              disabled={pending}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={confirming ? t.common.confirmDelete : t.common.delete}
            >
              <Mono style={[styles.action, confirming && styles.danger]}>{confirming ? t.common.confirmDelete : t.common.delete}</Mono>
            </Pressable>
          )}
          <ReportButton targetType="log_comment" targetId={comment.id} ownerId={comment.user_id} />
        </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  section: { marginTop: 32 },
  title: { fontSize: 11, letterSpacing: 1.5, marginBottom: 14 },
  count: { fontSize: 11, color: t.colors.textMuted, opacity: 0.6 },
  muted: { fontSize: 12, color: t.colors.textMuted },
  list: { gap: 18 },
  item: { flexDirection: "row", gap: 12 },
  hidden: { opacity: 0.6 },
  itemBody: { flex: 1, minWidth: 0 },
  itemHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 4 },
  name: { fontFamily: t.fonts.sansBold, fontSize: 14 },
  ownerBadge: { backgroundColor: alpha(t.colors.crimson, 0.15), borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  ownerText: { fontSize: 9, letterSpacing: 1, color: t.colors.crimsonGlow },
  time: { fontSize: 10, color: t.colors.textMuted },
  text: { marginTop: 4, fontSize: 14, lineHeight: 20, color: t.colors.textSecondary },
  hiddenNote: { marginTop: 4, fontSize: 11, color: t.colors.crimsonGlow },
  actions: { marginTop: 6, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 16 },
  action: { fontSize: 10, color: t.colors.textMuted, textDecorationLine: "underline" },
  danger: { color: t.colors.crimsonGlow },
  compose: { marginTop: 24 },
  prompt: { gap: 12, alignItems: "flex-start", backgroundColor: alpha(t.colors.bgElevated, 0.5), borderRadius: 4, padding: 14 },
  promptText: { fontSize: 12, color: t.colors.textSecondary },
  form: { gap: 8, borderWidth: 1, borderColor: t.colors.border, backgroundColor: alpha(t.colors.bgElevated, 0.4), borderRadius: 4, padding: 12 },
  input: {
    minHeight: 64,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: t.colors.textPrimary,
    fontFamily: t.fonts.sans,
    fontSize: 14,
  },
  send: { alignSelf: "flex-start" },
  editForm: { marginTop: 6, gap: 8 },
  editActions: { flexDirection: "row", alignItems: "center", gap: 16 },
});
