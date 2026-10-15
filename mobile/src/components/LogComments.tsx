import { LOG_COMMENT_MAX_LENGTH } from "@shared/community";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import type { Writer } from "@/lib/community";
import { useSession } from "@/lib/session";
import { addComment, deleteComment, fetchComments, formatCommentTime, type LogComment } from "@/lib/social";
import { alpha, colors, fonts } from "@/lib/theme";
import Avatar from "./Avatar";
import { Button, Message } from "./Form";
import ReportButton from "./ReportButton";
import { Body, Label, Mono } from "./Type";

/**
 * The comment thread under a public drink log (the site's LogComments, ADR-018).
 * Any member comments; the log's author replies in the same thread, marked
 * "kayıt sahibi", and may remove comments on their own log.
 */
export default function LogComments({ logId, ownerId }: { logId: string; ownerId: string }) {
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
        Yorumlar {comments && comments.length > 0 ? <Label style={styles.count}>({comments.length})</Label> : null}
      </Label>

      {failed ? (
        <Pressable onPress={load}>
          <Mono style={styles.muted}>Yorumlar yüklenemedi. Tekrar dene</Mono>
        </Pressable>
      ) : comments === null ? (
        <Mono style={styles.muted}>Yükleniyor…</Mono>
      ) : comments.length === 0 ? (
        <Mono style={styles.muted}>Henüz yorum yok.</Mono>
      ) : (
        <View style={styles.list}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isLogOwner={comment.user_id === ownerId}
              canDelete={memberId !== null && (memberId === comment.user_id || memberId === ownerId)}
              onDeleted={load}
            />
          ))}
        </View>
      )}

      <View style={styles.compose}>
        {session.state === "loading" ? null : !writer ? (
          <View style={styles.prompt}>
            <Mono style={styles.promptText}>
              {session.state === "onboarding" ? "Yorum yazmak için önce profilini tamamla." : "Yorum yazmak için giriş yap."}
            </Mono>
            <Button
              kind="secondary"
              title={session.state === "onboarding" ? "Profilini tamamla" : "Giriş yap"}
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
              placeholder={memberId === ownerId ? "Yanıt yaz…" : "Yorum yaz…"}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Yorum"
              style={styles.input}
            />
            {error && <Message error>{error}</Message>}
            <View style={styles.send}>
              <Button title={pending ? "Gönderiliyor…" : "Gönder"} onPress={send} pending={pending} disabled={!body.trim()} />
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
  onDeleted,
}: {
  comment: LogComment;
  isLogOwner: boolean;
  canDelete: boolean;
  onDeleted: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
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
    await onDeleted();
  }

  return (
    <View style={[styles.item, comment.hidden_at ? styles.hidden : null]}>
      <Pressable onPress={openProfile} accessibilityRole="link" accessibilityLabel={`${profile.display_name} profili`}>
        <Avatar path={profile.avatar_path} name={profile.display_name} size={30} />
      </Pressable>
      <View style={styles.itemBody}>
        <View style={styles.itemHead}>
          <Pressable onPress={openProfile} accessibilityRole="link">
            <Body style={styles.name}>{profile.display_name}</Body>
          </Pressable>
          {isLogOwner && (
            <View style={styles.ownerBadge}>
              <Label style={styles.ownerText}>kayıt sahibi</Label>
            </View>
          )}
          <Mono style={styles.time}>{formatCommentTime(comment.created_at)}</Mono>
        </View>
        <Body style={styles.text}>{comment.body}</Body>
        {comment.hidden_at && (
          <Mono style={styles.hiddenNote}>Bu yorum yöneticiler tarafından gizlendi; yalnızca sen görüyorsun.</Mono>
        )}
        {error && <Message error>{error}</Message>}
        <View style={styles.actions}>
          {canDelete && (
            <Pressable
              onPress={remove}
              disabled={pending}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={confirming ? "Emin misin? Evet, sil" : "Yorumu sil"}
            >
              <Mono style={[styles.action, confirming && styles.danger]}>{confirming ? "Emin misin? Evet, sil" : "Sil"}</Mono>
            </Pressable>
          )}
          <ReportButton targetType="log_comment" targetId={comment.id} ownerId={comment.user_id} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 32 },
  title: { fontSize: 11, letterSpacing: 1.5, marginBottom: 14 },
  count: { fontSize: 11, color: colors.textMuted, opacity: 0.6 },
  muted: { fontSize: 12, color: colors.textMuted },
  list: { gap: 18 },
  item: { flexDirection: "row", gap: 12 },
  hidden: { opacity: 0.6 },
  itemBody: { flex: 1, minWidth: 0 },
  itemHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 4 },
  name: { fontFamily: fonts.sansBold, fontSize: 14 },
  ownerBadge: { backgroundColor: alpha(colors.crimson, 0.15), borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  ownerText: { fontSize: 9, letterSpacing: 1, color: colors.crimsonGlow },
  time: { fontSize: 10, color: colors.textMuted },
  text: { marginTop: 4, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  hiddenNote: { marginTop: 4, fontSize: 11, color: colors.crimsonGlow },
  actions: { marginTop: 6, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 16 },
  action: { fontSize: 10, color: colors.textMuted, textDecorationLine: "underline" },
  danger: { color: colors.crimsonGlow },
  compose: { marginTop: 24 },
  prompt: { gap: 12, alignItems: "flex-start", backgroundColor: alpha(colors.bgElevated, 0.5), borderRadius: 4, padding: 14 },
  promptText: { fontSize: 12, color: colors.textSecondary },
  form: { gap: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: alpha(colors.bgElevated, 0.4), borderRadius: 4, padding: 12 },
  input: {
    minHeight: 64,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  send: { alignSelf: "flex-start" },
});
